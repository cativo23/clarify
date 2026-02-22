import { serverSupabaseClient } from "#supabase/server";
import { getAnalysisQueue } from "../utils/queue";
import { validateSupabaseStorageUrl } from "../utils/ssrf-protection";
import { handleApiError } from "../utils/error-handler";
import { z } from "zod";
import { getHeader } from "h3";
import { getPromptConfig } from "../utils/config";

/**
 * Request validation schema
 * [SECURITY FIX #2] Input sanitization to prevent injection and DoS attacks
 */
const analyzeRequestSchema = z.object({
  file_url: z.string().url("file_url must be a valid URL"),
  contract_name: z
    .string()
    .min(1, "contract_name cannot be empty")
    .max(255, "contract_name must be less than 255 characters")
    .regex(
      /^[a-zA-Z0-9_\-\s]+$/,
      "contract_name can only contain letters, numbers, hyphens, underscores and spaces",
    ),
  analysis_type: z.enum(["basic", "premium", "forensic"]).default("premium"),
});

export default defineEventHandler(async (event) => {
  const _client = await serverSupabaseClient(event);
  const user = (await _client.auth.getUser()).data.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  try {
    // [SECURITY FIX M5] Validate Content-Type header
    const contentType = getHeader(event, "content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw createError({
        statusCode: 415,
        message: "Unsupported Media Type. Application/json expected.",
      });
    }

    const body = await readBody(event);

    // [SECURITY FIX #2] Validate and sanitize input using zod
    const parseResult = analyzeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      console.warn("[SECURITY] Invalid analyze request:", {
        userId: user.id,
        errors,
        receivedKeys: Object.keys(body),
      });
      throw createError({
        statusCode: 400,
        message: "Invalid request format",
        data: { errors },
      });
    }

    const { file_url, contract_name, analysis_type } = parseResult.data;

    // [SECURITY FIX C2] Validate file_url to prevent SSRF attacks
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const validation = validateSupabaseStorageUrl(file_url, supabaseUrl);

    if (!validation.isValid) {
      throw createError({
        statusCode: 400,
        message:
          "Invalid file URL. Files must be uploaded to the contracts storage bucket.",
      });
    }

    const storagePath = validation.storagePath!;

    // Get credit cost from configuration (basic=1, premium=3, forensic=10)
    const config = await getPromptConfig();
    const creditCost = config.tiers[analysis_type]?.credits || 3;
    console.log(`[Analyze] Tier: ${analysis_type}, Credits: ${creditCost}`);

    const client = await serverSupabaseClient(event);

    // Create analysis record using RPC - credit check and deduction are now atomic
    const { data: analysisId, error: txError } = await client.rpc(
      "process_analysis_transaction",
      {
        p_contract_name: contract_name,
        p_storage_path: storagePath,
        p_analysis_type: analysis_type,
        p_credit_cost: creditCost,
        p_summary_json: null,
        p_risk_level: null,
      },
    );

    if (txError) {
      console.error("Transaction error:", txError);

      // Check for insufficient credits error - safe to show
      if (txError.message && txError.message.includes("Insufficient credits")) {
        throw createError({
          statusCode: 402,
          message:
            "Insufficient credits. Please purchase more credits to continue.",
        });
      }

      // [SECURITY FIX H3] Don't expose database error details
      throw createError({
        statusCode: 500,
        message: "Failed to create analysis record. Please try again.",
      });
    }

    // Enqueue job
    const queue = getAnalysisQueue();
    await queue.add(
      "analyze-contract",
      {
        analysisId,
        userId: user.id,
        storagePath,
        analysisType: analysis_type,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    );

    return {
      success: true,
      analysisId,
    };
  } catch (error: any) {
    // [SECURITY FIX H3] Use safe error handling
    handleApiError(error, {
      userId: user?.id,
      endpoint: "/api/analyze",
      operation: "create_analysis",
    });
  }
});
