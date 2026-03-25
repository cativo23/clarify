import { serverSupabaseClient } from "#supabase/server";
import { getAnalysisQueue } from "../utils/queue";
import { validateSupabaseStorageUrl } from "../utils/ssrf-protection";
import { handleApiError } from "../utils/error-handler";
import { z } from "zod";
import { getHeader } from "h3";
import { getPromptConfig } from "../utils/config";

/**
 * Check if user qualifies for monthly free Basic analysis
 * - Only applies to 'basic' tier
 * - Resets at the start of each calendar month
 * - Can only be used once per month
 */
async function checkMonthlyFreeAnalysis(
  client: any,
  userId: string,
  analysisType: string
): Promise<{ qualifies: boolean; needsReset: boolean }> {
  // Only basic tier qualifies for free analysis
  if (analysisType !== "basic") {
    return { qualifies: false, needsReset: false };
  }

  // Get user's monthly free analysis status
  const { data: user, error } = await client
    .from("users")
    .select("monthly_free_analysis_used, monthly_free_analysis_reset_date")
    .eq("id", userId)
    .single();

  if (error || !user) {
    console.error("[Monthly Free] Failed to fetch user status:", error);
    return { qualifies: false, needsReset: false };
  }

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const resetDate = user.monthly_free_analysis_reset_date
    ? new Date(user.monthly_free_analysis_reset_date)
    : null;

  // Check if we need to reset the monthly counter (new month started)
  const needsReset =
    !resetDate || resetDate < currentMonthStart || user.monthly_free_analysis_used === null;

  if (needsReset) {
    // Reset the monthly free analysis flag for the new month
    await client
      .from("users")
      .update({
        monthly_free_analysis_used: false,
        monthly_free_analysis_reset_date: currentMonthStart.toISOString(),
        monthly_free_analysis_counter: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return { qualifies: true, needsReset: true };
  }

  // User qualifies if they haven't used their free analysis this month
  return { qualifies: !user.monthly_free_analysis_used, needsReset: false };
}

/**
 * Process analysis with monthly free Basic analysis support
 * Uses atomic database transaction to prevent race conditions
 */
async function processAnalysisWithFreeCheck(
  client: any,
  userId: string,
  contractName: string,
  storagePath: string,
  analysisType: string,
  creditCost: number
): Promise<{ analysisId: string | null; error?: any }> {
  // Check if user qualifies for monthly free Basic analysis
  const freeCheck = await checkMonthlyFreeAnalysis(client, userId, analysisType);

  if (freeCheck.qualifies && analysisType === "basic") {
    // User qualifies for free Basic analysis - use atomic transaction
    const { data: analysisId, error: txError } = await client.rpc(
      "process_analysis_transaction_with_free_check",
      {
        p_user_id: userId,
        p_contract_name: contractName,
        p_storage_path: storagePath,
        p_analysis_type: analysisType,
        p_credit_cost: 0, // Free analysis
        p_is_free: true,
      }
    );

    if (txError) {
      console.error("[Free Analysis] Transaction error:", txError);
      return { analysisId: null, error: txError };
    }

    console.log(`[Analyze] Monthly free Basic analysis used for user ${userId}`);
    return { analysisId };
  }

  // Normal paid analysis
  const { data: analysisId, error: txError } = await client.rpc(
    "process_analysis_transaction",
    {
      p_contract_name: contractName,
      p_storage_path: storagePath,
      p_analysis_type: analysisType,
      p_credit_cost: creditCost,
      p_summary_json: null,
      p_risk_level: null,
    }
  );

  if (txError) {
    return { analysisId: null, error: txError };
  }

  return { analysisId };
}

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

    // Process analysis with monthly free Basic analysis support
    const { analysisId, error: txError } = await processAnalysisWithFreeCheck(
      client,
      user.id,
      contract_name,
      storagePath,
      analysis_type,
      creditCost,
    );

    if (txError) {
      console.error("[Analyze] Transaction error:", txError);

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
