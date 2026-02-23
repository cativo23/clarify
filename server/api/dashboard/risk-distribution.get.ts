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

    // Fetch only completed analyses with risk level
    const { data: analyses, error } = await client
      .from("analyses")
      .select("risk_level")
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (error) {
      console.error("Error fetching risk distribution:", error);
      throw createError({
        statusCode: 500,
        message: "Failed to fetch risk distribution",
      });
    }

    // Calculate distribution
    const distribution = {
      high: analyses.filter((a) => a.risk_level === "high").length,
      medium: analyses.filter((a) => a.risk_level === "medium").length,
      low: analyses.filter((a) => a.risk_level === "low").length,
    };

    const total = distribution.high + distribution.medium + distribution.low;

    return {
      success: true,
      distribution: {
        ...distribution,
        total,
      },
    };
  } catch (error: any) {
    console.error("Error in risk distribution endpoint:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch risk distribution",
    });
  }
});
