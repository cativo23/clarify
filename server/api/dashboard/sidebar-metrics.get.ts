import { serverSupabaseClient } from "#supabase/server";
import { getRequestUserContext } from "~/server/utils/analysis-security";

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event);
    const user = (await client.auth.getUser()).data.user;

    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    await getRequestUserContext(event);

    // Fetch user's analyses (only what's needed for sidebar metrics)
    const { data: analyses, error } = await client
      .from("analyses")
      .select("status, risk_level, created_at, summary_json")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching sidebar metrics:", error);
      throw createError({
        statusCode: 500,
        message: "Failed to fetch sidebar metrics",
      });
    }

    // Calculate metrics (same logic as frontend, but server-side)
    const completed = analyses.filter((a) => a.status === "completed");

    // Safety score
    const safetyScore =
      completed.length === 0
        ? 0
        : Math.round(
            completed.reduce((acc, a) => {
              const weights = { low: 100, medium: 50, high: 0 };
              const level =
                (a.risk_level as "low" | "medium" | "high") || "low";
              return acc + weights[level];
            }, 0) / completed.length,
          );

    // Monthly activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyActivity = analyses.filter(
      (a) => new Date(a.created_at) >= thirtyDaysAgo,
    ).length;

    // Total critical findings
    const totalCriticalFindings = analyses.reduce((acc, a) => {
      return acc + (a.summary_json?.metricas?.total_rojas || 0);
    }, 0);

    // Last analysis date
    const sortedAnalyses = [...(analyses || [])].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const lastAnalysisDate = sortedAnalyses[0]?.created_at || null;

    return {
      success: true,
      metrics: {
        safetyScore,
        monthlyActivity,
        totalCriticalFindings,
        lastAnalysisDate,
      },
    };
  } catch (error: any) {
    console.error("Error in sidebar metrics endpoint:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch sidebar metrics",
    });
  }
});
