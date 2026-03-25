/**
 * PDF Export API Endpoint
 *
 * Generates and exports analysis results as a formatted PDF report.
 * Implements caching via Supabase Storage to avoid regeneration costs.
 *
 * GET /api/analyses/[id]/export-pdf
 * Returns: { url: string, cached: boolean, filename: string }
 */

import { serverSupabaseClient } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import { generateAnalysisPDF } from "~/server/utils/pdf-generator";
import { sanitizeAnalysisSummary } from "~/server/utils/analysis-security";
import { applyRateLimit, RateLimitPresets } from "~/server/utils/rate-limit";
import { handleApiError } from "~/server/utils/error-handler";
import type { Analysis, AnalysisSummary } from "~/types";

export default defineEventHandler(async (event) => {
  let userId: string | undefined;

  try {
    // Apply rate limiting (10 req/min standard)
    await applyRateLimit(event, RateLimitPresets.standard, "user");

    const client = await serverSupabaseClient(event);
    const user = (await client.auth.getUser()).data.user;
    const analysisId = getRouterParam(event, "id");

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    userId = user.id;

    if (!analysisId) {
      throw createError({
        statusCode: 400,
        message: "Missing analysis ID",
      });
    }

    // Fetch analysis with ownership verification
    const { data: analysis, error: fetchError } = await client
      .from("analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", user.id) // Security: verify user owns this analysis
      .single();

    if (fetchError || !analysis) {
      throw createError({
        statusCode: 404,
        message: "Analysis not found",
      });
    }

    // Verify analysis is completed
    if (analysis.status !== "completed") {
      throw createError({
        statusCode: 400,
        message: "Analysis is not completed yet",
      });
    }

    if (!analysis.summary_json) {
      throw createError({
        statusCode: 400,
        message: "Analysis has no summary data",
      });
    }

    // Sanitize summary for non-admin users
    const userContext = await getRequestUserContext(event);
    const tokenDebug = await isTokenDebugEnabled();
    const summary = sanitizeAnalysisSummary(
      analysis.summary_json,
      userContext.isAdmin,
      tokenDebug,
    ) as AnalysisSummary;

    // Supabase Storage configuration
    const storageBucket = "analysis-pdfs";
    const storagePath = `${userId}/${analysisId}.pdf`;

    // Get admin client for storage operations
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        message: "Storage configuration missing",
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check for cached PDF
    const { data: existingFile } = await adminClient.storage
      .from(storageBucket)
      .exists(storagePath);

    if (existingFile) {
      // Generate signed URL for cached PDF (24h expiry)
      const { data: signedUrlData, error: urlError } = await adminClient.storage
        .from(storageBucket)
        .createSignedUrl(storagePath, 24 * 60 * 60, {
          transform: { format: "origin" },
        });

      if (urlError || !signedUrlData) {
        console.error("[PDF Export] Error generating signed URL:", urlError);
        // Fall through to regenerate
      } else {
        return {
          success: true,
          url: signedUrlData.signedUrl,
          cached: true,
          filename: generateFilename(analysis),
        };
      }
    }

    // Generate PDF
    const pdfBuffer = await generateAnalysisPDF(analysis as Analysis, summary, {
      includeBranding: true,
      includeDisclaimer: true,
    });

    // Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from(storageBucket)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true, // Overwrite if exists
        cacheControl: "31536000", // 1 year
      });

    if (uploadError) {
      console.error("[PDF Export] Upload error:", uploadError);
      throw createError({
        statusCode: 500,
        message: "Failed to store PDF",
      });
    }

    // Generate signed URL for newly uploaded PDF
    const { data: signedUrlData, error: urlError } = await adminClient.storage
      .from(storageBucket)
      .createSignedUrl(storagePath, 24 * 60 * 60, {
        transform: { format: "origin" },
      });

    if (urlError || !signedUrlData) {
      console.error("[PDF Export] Signed URL error:", urlError);
      throw createError({
        statusCode: 500,
        message: "Failed to generate download URL",
      });
    }

    return {
      success: true,
      url: signedUrlData.signedUrl,
      cached: false,
      filename: generateFilename(analysis),
    };
  } catch (error: unknown) {
    handleApiError(error, {
      userId,
      endpoint: "/api/analyses/[id]/export-pdf",
      operation: "export_pdf",
    });
  }
});

/**
 * Generate filename for PDF download
 * Format: clarify-{contract-name-slug}-{date}.pdf
 */
function generateFilename(analysis: Analysis): string {
  const contractSlug = (analysis.contract_name || "contrato")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Trim hyphens from ends
    .substring(0, 50); // Limit length

  const date = new Date(analysis.created_at).toISOString().split("T")[0];

  return `clarify-${contractSlug}-${date}.pdf`;
}

/**
 * Get request user context (helper for admin check)
 */
async function getRequestUserContext(event: H3Event) {
  const client = await serverSupabaseClient(event);
  const user = (await client.auth.getUser()).data.user;

  if (!user) {
    return { isAdmin: false };
  }

  // Check admin_emails table
  const { data: adminEmail } = await client
    .from("admin_emails")
    .select("email")
    .eq("email", user.email)
    .single();

  return { isAdmin: !!adminEmail };
}

/**
 * Check if token debug mode is enabled
 */
async function isTokenDebugEnabled(): Promise<boolean> {
  return process.env.NODE_ENV === "development";
}
