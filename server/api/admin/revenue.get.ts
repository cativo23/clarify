import { requireAdmin } from "../../utils/auth";
import { getAdminSupabaseClient } from "../../utils/admin-supabase";

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event);

  // Parse query parameters
  const query = getQuery(event);
  const range = (query.range as string) || "month";
  const from = query.from as string | undefined;
  const to = query.to as string | undefined;

  // Calculate date range based on range param
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  if (range === "custom" && from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else {
    switch (range) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        // Start from beginning of week (Monday)
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust if Sunday
        startDate = new Date(now);
        startDate.setDate(now.getDate() + diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  const admin = getAdminSupabaseClient();
  const supabase = await admin.getConfig().then(() => {
    // Get raw supabase client for direct SQL queries
    const { createClient } = require("@supabase/supabase-js");
    return createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || ""
    );
  });

  // Query transactions with date filtering
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("status", "completed")
    .in("type", ["purchase", "refund", "adjustment"])
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Revenue API] Error fetching transactions:", error.message);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch revenue data",
    });
  }

  // Group transactions by date period
  const groupedByDate: Record<string, any[]> = {};

  for (const tx of transactions || []) {
    const txDate = new Date(tx.created_at);
    let dateKey: string;

    // Create date key based on range
    switch (range) {
      case "day":
        dateKey = txDate.toISOString().split("T")[0]; // YYYY-MM-DD
        break;
      case "week":
        // ISO week format: YYYY-Www
        const weekNum = getWeekNumber(txDate);
        dateKey = `${txDate.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
        break;
      case "month":
        dateKey = `${txDate.getFullYear()}-${(txDate.getMonth() + 1).toString().padStart(2, "0")}`;
        break;
      case "quarter":
        const q = Math.floor(txDate.getMonth() / 3) + 1;
        dateKey = `${txDate.getFullYear()}-Q${q}`;
        break;
      default:
        dateKey = txDate.toISOString().split("T")[0];
    }

    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(tx);
  }

  // Aggregate data per period
  const revenue = Object.entries(groupedByDate)
    .map(([date, txs]) => {
      const grossRevenue = txs
        .filter((t) => t.type === "purchase")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const refunds = txs
        .filter((t) => t.type === "refund")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const adjustments = txs
        .filter((t) => t.type === "adjustment")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const netRevenue = grossRevenue - refunds + adjustments;
      const creditsSold = txs
        .filter((t) => t.type === "purchase")
        .reduce((sum, t) => sum + (t.credits_purchased || 0), 0);

      return {
        date,
        gross_revenue: Math.round(grossRevenue * 100) / 100,
        net_revenue: Math.round(netRevenue * 100) / 100,
        transactions: txs.length,
        credits_sold: creditsSold,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate by_package breakdown (infer from amount)
  const byPackage: Record<string, any> = {};
  for (const tx of transactions || []) {
    if (tx.type !== "purchase") continue;

    const amount = Number(tx.amount);
    let packageName: string;

    // Infer package from amount
    if (amount >= 4.49 && amount <= 5.49) {
      packageName = "5 credits";
    } else if (amount >= 8.49 && amount <= 9.49) {
      packageName = "10 credits";
    } else if (amount >= 19.49 && amount <= 20.49) {
      packageName = "25 credits";
    } else {
      packageName = "other";
    }

    if (!byPackage[packageName]) {
      byPackage[packageName] = {
        package: packageName,
        revenue: 0,
        count: 0,
        credits: 0,
      };
    }
    byPackage[packageName].revenue += amount;
    byPackage[packageName].count += 1;
    byPackage[packageName].credits += tx.credits_purchased || 0;
  }

  const packageBreakdown = Object.values(byPackage).map((pkg: any) => ({
    ...pkg,
    revenue: Math.round(pkg.revenue * 100) / 100,
  }));

  // Calculate summary
  const totalGrossRevenue = revenue.reduce((sum, r) => sum + r.gross_revenue, 0);
  const totalNetRevenue = revenue.reduce((sum, r) => sum + r.net_revenue, 0);
  const totalTransactions = revenue.reduce((sum, r) => sum + r.transactions, 0);
  const totalCreditsSold = revenue.reduce((sum, r) => sum + r.credits_sold, 0);

  return {
    revenue,
    summary: {
      total_revenue: Math.round(totalGrossRevenue * 100) / 100,
      total_net_revenue: Math.round(totalNetRevenue * 100) / 100,
      total_transactions: totalTransactions,
      total_credits_sold: totalCreditsSold,
    },
    by_package: packageBreakdown,
    period: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
  };
});

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
