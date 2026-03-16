import { requireAdmin } from "../../utils/auth";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const range = (query.range as string) || "30d";
  const from = query.from as string;
  const to = query.to as string;

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  const endDate = to ? new Date(to) : now;

  if (from) {
    startDate = new Date(from);
  } else {
    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date("2024-01-01");
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw createError({
      statusCode: 500,
      message: "Missing Supabase configuration",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch pricing tables
  const { data: pricingData, error: pricingError } = await supabase
    .from("pricing_tables")
    .select("*");

  if (pricingError) {
    console.error("Failed to fetch pricing tables:", pricingError.message);
  }

  const pricingMap = new Map(
    (pricingData || []).map((p) => [p.model, { input: Number(p.input_cost), output: Number(p.output_cost) }])
  );

  // Default tier to model mapping
  const tierModels: Record<string, string> = {
    basic: "gpt-4o-mini",
    premium: "gpt-5-mini",
    forensic: "gpt-5",
  };

  // Fetch completed analyses with summary_json containing usage data
  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("id, user_id, credits_used, summary_json, created_at")
    .eq("status", "completed")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (analysesError) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch analyses: ${analysesError.message}`,
    });
  }

  // Initialize tier aggregations
  const tierData: Record<string, { analyses: number; revenue: number; aiCost: number }> = {
    basic: { analyses: 0, revenue: 0, aiCost: 0 },
    premium: { analyses: 0, revenue: 0, aiCost: 0 },
    forensic: { analyses: 0, revenue: 0, aiCost: 0 },
  };

  // Assume $0.99 per credit for revenue calculation
  const CREDIT_PRICE = 0.99;

  // Process each analysis
  for (const analysis of analyses || []) {
    const summary = analysis.summary_json as any;
    const debug = summary?._debug;
    const usage = debug?.usage;

    // Skip analyses without usage data
    if (!usage) {
      continue;
    }

    // Extract tier from summary or infer from credits_used
    let tier = summary?.tier?.toLowerCase() || "basic";
    if (!tierData[tier]) {
      // Infer tier from credits used
      if (analysis.credits_used === 1) tier = "basic";
      else if (analysis.credits_used === 3) tier = "premium";
      else if (analysis.credits_used >= 10) tier = "forensic";
      else tier = "basic";
    }

    // Extract tokens
    const inputTokens =
      usage.input_tokens ||
      usage.prompt_tokens ||
      usage.input ||
      usage.tokens_in ||
      0;

    const outputTokens =
      usage.output_tokens ||
      usage.completion_tokens ||
      usage.output ||
      usage.tokens_out ||
      0;

    // Get model used
    const modelUsed = debug?.model_used || tierModels[tier] || "gpt-4o-mini";

    // Get pricing for this model
    const price = pricingMap.get(modelUsed) || { input: 0, output: 0 };

    // Calculate AI cost: (input_tokens / 1000 * input_cost) + (output_tokens / 1000 * output_cost)
    const aiCost = (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output;

    // Calculate revenue from credits used
    const revenue = (analysis.credits_used || 1) * CREDIT_PRICE;

    // Aggregate by tier
    const tierEntry = tierData[tier as keyof typeof tierData];
    if (tierEntry) {
      tierEntry.analyses += 1;
      tierEntry.revenue += revenue;
      tierEntry.aiCost += aiCost;
    }
  }

  // Build response by tier
  const byTier = Object.entries(tierData).map(([tierKey, data]) => {
    const margin = data.revenue - data.aiCost;
    const marginPercent = data.revenue > 0 ? (margin / data.revenue) * 100 : 0;
    const avgCostPerAnalysis = data.analyses > 0 ? data.aiCost / data.analyses : 0;

    return {
      tier: tierKey.charAt(0).toUpperCase() + tierKey.slice(1), // Capitalize
      analyses: data.analyses,
      revenue: Math.round(data.revenue * 100) / 100,
      ai_cost: Math.round(data.aiCost * 10000) / 10000,
      gross_margin: Math.round(margin * 100) / 100,
      margin_percent: Math.round(marginPercent * 10) / 10,
      avg_cost_per_analysis: Math.round(avgCostPerAnalysis * 10000) / 10000,
    };
  });

  // Calculate summary
  const totalRevenue = byTier.reduce((sum, t) => sum + t.revenue, 0);
  const totalAiCost = byTier.reduce((sum, t) => sum + t.ai_cost, 0);
  const totalMargin = totalRevenue - totalAiCost;
  const totalAnalyses = byTier.reduce((sum, t) => sum + t.analyses, 0);
  const overallMarginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
  const blendedCostPerAnalysis = totalAnalyses > 0 ? totalAiCost / totalAnalyses : 0;

  return {
    by_tier: byTier,
    summary: {
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_ai_cost: Math.round(totalAiCost * 10000) / 10000,
      total_margin: Math.round(totalMargin * 100) / 100,
      overall_margin_percent: Math.round(overallMarginPercent * 10) / 10,
      blended_cost_per_analysis: Math.round(blendedCostPerAnalysis * 10000) / 10000,
    },
    period: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
  };
});
