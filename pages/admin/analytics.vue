<script setup lang="ts">
definePageMeta({ middleware: ["admin"], layout: "admin" });

const users = ref<any[]>([]);
const loading = ref(true);
const pricing = ref<any[]>([]);
const estimates = ref<Record<string, number>>({});
const costData = ref<any>(null);
const costLoading = ref(false);
const costRange = ref<"7d" | "30d" | "90d" | "all">("30d");
const error = ref("");

// Revenue dashboard state
const revenueData = ref<any>(null);
const revenueLoading = ref(false);
const revenueRange = ref<"day" | "week" | "month" | "quarter" | "custom">("month");

// Funnel state
const funnelData = ref<any>(null);
const funnelLoading = ref(false);
const funnelRange = ref<"7d" | "30d" | "90d" | "custom">("30d");

const chartRef = ref<HTMLCanvasElement | null>(null);
const revenueChartRef = ref<HTMLCanvasElement | null>(null);
const funnelChartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: any = null;
let revenueChartInstance: any = null;
let funnelChartInstance: any = null;

// Computed metrics
const totalUsers = computed(() => users.value.length);
const totalAnalyses = computed(() =>
  users.value.reduce((sum, u) => sum + (u.analyses_count || 0), 0),
);
const totalCreditsInCirculation = computed(() =>
  users.value.reduce((sum, u) => sum + (u.credits || 0), 0),
);
const avgAnalysesPerUser = computed(() =>
  totalUsers.value > 0
    ? (totalAnalyses.value / totalUsers.value).toFixed(1)
    : "0",
);

const loadData = async () => {
  loading.value = true;
  error.value = "";

  try {
    const [uRes, pRes] = (await Promise.all([
      $fetch("/api/admin/users"),
      $fetch("/api/admin/pricing"),
    ])) as [any, any];
    users.value = uRes.users || [];
    pricing.value = pRes.pricing || [];
    await nextTick();
    renderChart();
  } catch (e: any) {
    console.error("Failed to load admin data", e);
    error.value = e.message || "Failed to load admin data";
  } finally {
    loading.value = false;
  }
};

const loadCostData = async () => {
  costLoading.value = true;
  try {
    const res = await $fetch(`/api/admin/costs?range=${costRange.value}`);
    costData.value = res;
  } catch (e: any) {
    console.error("Failed to load cost data", e);
  } finally {
    costLoading.value = false;
  }
};

const loadRevenueData = async () => {
  revenueLoading.value = true;
  try {
    const res = await $fetch(`/api/admin/revenue?range=${revenueRange.value}`);
    revenueData.value = res;
    await nextTick();
    renderRevenueChart();
  } catch (e: any) {
    console.error("Failed to load revenue data", e);
  } finally {
    revenueLoading.value = false;
  }
};

const loadFunnelData = async () => {
  funnelLoading.value = true;
  try {
    const res = await $fetch(`/api/admin/funnel?range=${funnelRange.value}`);
    funnelData.value = res;
    await nextTick();
    renderFunnelChart();
  } catch (e: any) {
    console.error("Failed to load funnel data", e);
  } finally {
    funnelLoading.value = false;
  }
};

onMounted(() => {
  loadData();
  loadCostData();
  loadRevenueData();
  loadFunnelData();
});

const renderChart = async () => {
  if (!chartRef.value) return;
  try {
    const Chart = (await import("chart.js/auto")).default;
    if (chartInstance) {
      chartInstance.destroy();
    }
    const ctx = chartRef.value.getContext("2d");
    if (!ctx) return;
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: users.value.map((u) => u.email?.split("@")[0] || "User"),
        datasets: [
          {
            label: "Analyses Count",
            data: users.value.map((u) => u.analyses_count || 0),
            backgroundColor: "#f59e0b",
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
          },
        },
      },
    });
  } catch (err) {
    console.warn("Chart.js not available; skip chart render", err);
  }
};

const renderRevenueChart = async () => {
  if (!revenueChartRef.value || !revenueData.value) return;
  try {
    const Chart = (await import("chart.js/auto")).default;
    if (revenueChartInstance) {
      revenueChartInstance.destroy();
    }
    const ctx = revenueChartRef.value.getContext("2d");
    if (!ctx) return;

    // Sort by date and extract labels and data
    const sortedRevenue = [...revenueData.value.revenue].sort((a, b) => a.date.localeCompare(b.date));
    const labels = sortedRevenue.map(r => r.date);
    const grossRevenue = sortedRevenue.map(r => r.gross_revenue);
    const netRevenue = sortedRevenue.map(r => r.net_revenue);

    revenueChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Gross Revenue",
            data: grossRevenue,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Net Revenue",
            data: netRevenue,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              font: { size: 12, weight: "bold" },
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: $${value.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => `$${value.toFixed(2)}`,
              font: { size: 11 },
            },
          },
          x: {
            ticks: { font: { size: 11 } },
          },
        },
      },
    });
  } catch (err) {
    console.warn("Revenue chart render failed", err);
  }
};

const renderFunnelChart = async () => {
  if (!funnelChartRef.value || !funnelData.value) return;
  try {
    const Chart = (await import("chart.js/auto")).default;
    if (funnelChartInstance) {
      funnelChartInstance.destroy();
    }
    const ctx = funnelChartRef.value.getContext("2d");
    if (!ctx) return;

    const funnel = funnelData.value.funnel;
    const labels = funnel.map((f: any) => f.stage);
    const counts = funnel.map((f: any) => f.count);
    const rates = funnel.map((f: any) => f.rate);

    // Funnel gradient colors (wide to narrow visually represented)
    const backgroundColors = [
      "rgba(99, 102, 241, 0.8)", // accent-indigo
      "rgba(99, 102, 241, 0.7)",
      "rgba(99, 102, 241, 0.6)",
      "rgba(99, 102, 241, 0.5)",
    ];

    funnelChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Users",
            data: counts,
            backgroundColor: backgroundColors,
            borderRadius: 8,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        indexAxis: "y", // Horizontal bar chart for funnel effect
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const count = context.parsed.x;
                const rate = rates[context.dataIndex];
                return `${count} users (${rate.toFixed(1)}% retention)`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value: number) => value.toLocaleString(),
              font: { size: 11 },
            },
            title: {
              display: true,
              text: "Users",
              font: { size: 12, weight: "bold" },
            },
          },
          y: {
            ticks: { font: { size: 12, weight: "bold" } },
          },
        },
      },
    });
  } catch (err) {
    console.warn("Funnel chart render failed", err);
  }
};

const estimateUserCost = async (userId: string) => {
  if (estimates.value[userId] !== undefined) return;

  try {
    const res = (await $fetch(`/api/admin/user/${userId}`)) as any;
    const analyses = res.analyses || [];
    // fetch prompt config to know fallback models
    const promptConfig = (await $fetch("/api/admin/config")) as any;
    let total = 0;

    for (const a of analyses) {
      const summary = a.summary_json || {};
      const debug = summary?._debug || {};
      if (!debug.usage) {
        // Skip if no usage data
        continue;
      }
      const input =
        debug.usage.input_tokens ||
        debug.usage.prompt_tokens ||
        debug.usage.total_input_tokens ||
        debug.usage.tokens_in ||
        debug.usage.input ||
        debug.usage.prompt ||
        0;
      const output =
        debug.usage.output_tokens ||
        debug.usage.completion_tokens ||
        debug.usage.total_output_tokens ||
        debug.usage.tokens_out ||
        debug.usage.output ||
        0;
      const model =
        debug.model_used || promptConfig?.tiers?.premium?.model || "gpt-5-mini";
      const priceRow =
        pricing.value.find((p: any) => p.model === model) || pricing.value[0];
      const inputCost = priceRow?.input_cost || 0;
      const outputCost = priceRow?.output_cost || 0;
      total += input * Number(inputCost) + output * Number(outputCost);
    }
    estimates.value = { ...estimates.value, [userId]: total };
  } catch (err) {
    console.error("Estimate failed", err);
    estimates.value = { ...estimates.value, [userId]: -1 };
  }
};

const formatCurrency = (value: number) => {
  if (value < 0) return "Error";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(value);
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US").format(value);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};
</script>

<template>
  <div class="w-full animate-slide-up">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-black text-slate-900 dark:text-white mb-2">
        Admin Analytics
      </h1>
      <p class="text-sm font-bold text-slate-500 dark:text-slate-400">
        Platform overview and user metrics
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-20 text-center">
      <LoadingSpinner size="lg" />
      <p
        class="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]"
      >
        Cargando analíticas...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="p-6 bg-risk-high/10 border border-risk-high rounded-2xl text-center"
    >
      <p class="text-risk-high font-bold">{{ error }}</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Metrics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft"
        >
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <span
              class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >Total Users</span
            >
          </div>
          <p class="text-3xl font-black text-slate-900 dark:text-white">
            {{ formatNumber(totalUsers) }}
          </p>
        </div>

        <div
          class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft"
        >
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-10 h-10 bg-accent-indigo/10 rounded-xl flex items-center justify-center text-accent-indigo"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span
              class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >Total Analyses</span
            >
          </div>
          <p class="text-3xl font-black text-slate-900 dark:text-white">
            {{ formatNumber(totalAnalyses) }}
          </p>
        </div>

        <div
          class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft"
        >
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-10 h-10 bg-risk-low/10 rounded-xl flex items-center justify-center text-risk-low"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                />
              </svg>
            </div>
            <span
              class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >Credits Active</span
            >
          </div>
          <p class="text-3xl font-black text-slate-900 dark:text-white">
            {{ formatNumber(totalCreditsInCirculation) }}
          </p>
        </div>

        <div
          class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft"
        >
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <span
              class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >Avg / User</span
            >
          </div>
          <p class="text-3xl font-black text-slate-900 dark:text-white">
            {{ avgAnalysesPerUser }}
          </p>
        </div>
      </div>

      <!-- Revenue Dashboard Section -->
      <div
        class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium mb-8"
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">
              Revenue Dashboard
            </h2>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400">
              Time-series revenue tracking and package breakdown
            </p>
          </div>
          <!-- Time Range Selector -->
          <div class="flex items-center gap-2">
            <button
              v-for="range in ['day', 'week', 'month', 'quarter']"
              :key="range"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                revenueRange === range
                  ? 'bg-secondary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              ]"
              @click="revenueRange = range as any; loadRevenueData()"
            >
              {{ range }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="revenueLoading" class="py-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p class="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Loading revenue data...
          </p>
        </div>

        <!-- Revenue Content -->
        <div v-else-if="revenueData" class="space-y-6">
          <!-- Revenue Chart -->
          <div class="h-72">
            <canvas ref="revenueChartRef"></canvas>
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Revenue
              </p>
              <p class="text-2xl font-black text-slate-900 dark:text-white">
                ${{ revenueData.summary.total_revenue.toFixed(2) }}
              </p>
            </div>
            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Net Revenue
              </p>
              <p class="text-2xl font-black text-success">
                ${{ revenueData.summary.total_net_revenue.toFixed(2) }}
              </p>
            </div>
            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Transactions
              </p>
              <p class="text-2xl font-black text-slate-900 dark:text-white">
                {{ revenueData.summary.total_transactions }}
              </p>
            </div>
            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Credits Sold
              </p>
              <p class="text-2xl font-black text-slate-900 dark:text-white">
                {{ revenueData.summary.total_credits_sold }}
              </p>
            </div>
          </div>

          <!-- Package Breakdown -->
          <div v-if="revenueData.by_package && revenueData.by_package.length > 0">
            <h3 class="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3">
              Revenue by Package
            </h3>
            <div class="grid md:grid-cols-3 gap-4">
              <div
                v-for="pkg in revenueData.by_package"
                :key="pkg.package"
                class="p-4 bg-gradient-to-br from-secondary/10 to-accent-indigo/10 rounded-xl border border-secondary/20"
              >
                <p class="text-sm font-black text-slate-900 dark:text-white mb-2">
                  {{ pkg.package }}
                </p>
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-500">Revenue:</span>
                  <span class="font-mono font-black text-slate-900 dark:text-white">
                    ${{ pkg.revenue.toFixed(2) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs mt-1">
                  <span class="font-bold text-slate-500">Sales:</span>
                  <span class="font-mono font-black text-slate-900 dark:text-white">
                    {{ pkg.count }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Data State -->
        <div v-else class="text-center py-12">
          <p class="text-slate-400 font-bold">No revenue data available</p>
        </div>
      </div>

      <!-- Conversion Funnel Section -->
      <div
        class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium mb-8"
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">
              Conversion Funnel
            </h2>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400">
              User onboarding journey from signup to first purchase
            </p>
          </div>
          <!-- Time Range Selector -->
          <div class="flex items-center gap-2">
            <button
              v-for="range in ['7d', '30d', '90d']"
              :key="range"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                funnelRange === range
                  ? 'bg-secondary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              ]"
              @click="funnelRange = range as any; loadFunnelData()"
            >
              {{ range }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="funnelLoading" class="py-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p class="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Loading funnel data...
          </p>
        </div>

        <!-- Funnel Content -->
        <div v-else-if="funnelData" class="space-y-6">
          <!-- Funnel Chart -->
          <div class="h-64">
            <canvas ref="funnelChartRef"></canvas>
          </div>

          <!-- Funnel Stats Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(stage, idx) in funnelData.funnel"
              :key="stage.stage"
              class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700"
            >
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {{ stage.stage }}
              </p>
              <p class="text-2xl font-black text-slate-900 dark:text-white mb-1">
                {{ formatNumber(stage.count) }}
              </p>
              <p
                v-if="idx === 0"
                class="text-xs font-black text-success"
              >
                Starting point
              </p>
              <p
                v-else
                :class="[
                  'text-xs font-black',
                  stage.rate >= 70 ? 'text-success' :
                  stage.rate >= 50 ? 'text-amber-500' : 'text-risk-high'
                ]"
              >
                {{ stage.rate.toFixed(1) }}% retention
              </p>
            </div>
          </div>
        </div>

        <!-- No Data State -->
        <div v-else class="text-center py-12">
          <p class="text-slate-400 font-bold">No funnel data available</p>
        </div>
      </div>

      <!-- Charts Section (Analyses + Pricing) -->
      <div class="grid lg:grid-cols-3 gap-6 mb-8">
        <!-- Analyses Chart -->
        <div
          class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium"
        >
          <h2 class="text-xl font-black text-slate-900 dark:text-white mb-2">
            Analyses by User
          </h2>
          <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Distribution of contract analyses across all users
          </p>
          <div class="h-64">
            <canvas ref="chartRef"></canvas>
          </div>
        </div>

        <!-- Pricing Snapshot -->
        <div
          class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium"
        >
          <h2 class="text-xl font-black text-slate-900 dark:text-white mb-2">
            Pricing Models
          </h2>
          <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Current AI model pricing
          </p>

          <div v-if="pricing.length === 0" class="text-center py-8">
            <p class="text-slate-400 text-sm font-bold">
              No pricing data available
            </p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="p in pricing"
              :key="p.model"
              class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700"
            >
              <p class="font-black text-slate-900 dark:text-white text-sm mb-2">
                {{ p.model }}
              </p>
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-500">Input:</span>
                <span
                  class="font-mono font-black text-slate-900 dark:text-white"
                  >${{ Number(p.input_cost).toFixed(6) }}</span
                >
              </div>
              <div class="flex items-center justify-between text-xs mt-1">
                <span class="font-bold text-slate-500">Output:</span>
                <span
                  class="font-mono font-black text-slate-900 dark:text-white"
                  >${{ Number(p.output_cost).toFixed(6) }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cost Analysis Section -->
      <div
        class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium mb-8"
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">
              Cost Analysis & Profit Margins
            </h2>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400">
              AI costs and profit margins by analysis tier
            </p>
          </div>
          <!-- Time Range Selector -->
          <div class="flex items-center gap-2">
            <button
              v-for="range in ['7d', '30d', '90d', 'all']"
              :key="range"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                costRange === range
                  ? 'bg-secondary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              ]"
              @click="costRange = range as any; loadCostData()"
            >
              {{ range }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="costLoading" class="py-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
          <p class="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Loading cost data...
          </p>
        </div>

        <!-- Cost Data Content -->
        <div v-else-if="costData" class="space-y-6">
          <!-- Tier Cards -->
          <div class="grid md:grid-cols-3 gap-4">
            <div
              v-for="tier in costData.by_tier"
              :key="tier.tier"
              class="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">
                  {{ tier.tier }}
                </h3>
                <span
                  class="px-2 py-1 bg-accent-indigo/10 text-accent-indigo rounded-md text-[10px] font-black uppercase tracking-widest"
                >
                  {{ tier.analyses }} analyses
                </span>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-bold text-slate-500">Revenue:</span>
                  <span class="font-mono font-black text-slate-900 dark:text-white">
                    ${{ tier.revenue.toFixed(2) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="font-bold text-slate-500">AI Cost:</span>
                  <span class="font-mono font-black text-risk-high">
                    ${{ tier.ai_cost.toFixed(4) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="font-bold text-slate-500">Gross Margin:</span>
                  <span
                    :class="[
                      'font-mono font-black',
                      tier.margin_percent >= 80 ? 'text-success' :
                      tier.margin_percent >= 60 ? 'text-amber-500' : 'text-risk-high'
                    ]"
                  >
                    ${{ tier.gross_margin.toFixed(2) }}
                  </span>
                </div>
                <div class="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-400">Margin %:</span>
                    <span
                      :class="[
                        'px-2 py-1 rounded-md text-xs font-black',
                        tier.margin_percent >= 80 ? 'bg-success/10 text-success' :
                        tier.margin_percent >= 60 ? 'bg-amber-500/10 text-amber-500' : 'bg-risk-high/10 text-risk-high'
                      ]"
                    >
                      {{ tier.margin_percent.toFixed(1) }}%
                    </span>
                  </div>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-400">Avg Cost/Analysis:</span>
                  <span class="font-mono font-black text-slate-600 dark:text-slate-400">
                    ${{ tier.avg_cost_per_analysis.toFixed(4) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary Card -->
          <div class="p-6 bg-gradient-to-r from-accent-indigo/10 to-secondary/10 rounded-2xl border border-accent-indigo/20">
            <h4 class="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4">
              Overall Summary
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Total Revenue
                </p>
                <p class="text-2xl font-black text-slate-900 dark:text-white">
                  ${{ costData.summary.total_revenue.toFixed(2) }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Total AI Cost
                </p>
                <p class="text-2xl font-black text-risk-high">
                  ${{ costData.summary.total_ai_cost.toFixed(4) }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Total Margin
                </p>
                <p class="text-2xl font-black text-success">
                  ${{ costData.summary.total_margin.toFixed(2) }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Overall Margin %
                </p>
                <p
                  :class="[
                    'text-2xl font-black',
                    costData.summary.overall_margin_percent >= 80 ? 'text-success' :
                    costData.summary.overall_margin_percent >= 60 ? 'text-amber-500' : 'text-risk-high'
                  ]"
                >
                  {{ costData.summary.overall_margin_percent.toFixed(1) }}%
                </p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-accent-indigo/20">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400">Blended Cost per Analysis:</span>
                <span class="font-mono font-black text-slate-600 dark:text-slate-400">
                  ${{ costData.summary.blended_cost_per_analysis.toFixed(4) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- No Data State -->
        <div v-else class="text-center py-12">
          <p class="text-slate-400 font-bold">No cost data available</p>
        </div>
      </div>

      <!-- Users Table -->
      <div
        class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden"
      >
        <h2 class="text-xl font-black text-slate-900 dark:text-white mb-6">
          User Details
        </h2>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr
                class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800"
              >
                <th class="px-4 py-3 text-left">User</th>
                <th class="px-4 py-3 text-right">Credits</th>
                <th class="px-4 py-3 text-right">Analyses</th>
                <th class="px-4 py-3 text-left">Last Activity</th>
                <th class="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="u in users"
                :key="u.id"
                class="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 bg-gradient-to-br from-secondary to-accent-indigo rounded-xl flex items-center justify-center text-white font-black"
                    >
                      {{ u.email?.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p
                        class="font-black text-slate-900 dark:text-white text-sm"
                      >
                        {{ u.email }}
                      </p>
                      <p
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                        ID: {{ u.id.slice(0, 8) }}...
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-right">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-black"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      />
                    </svg>
                    {{ formatNumber(u.credits) }}
                  </span>
                </td>
                <td class="px-4 py-4 text-right">
                  <span
                    class="font-mono font-black text-slate-900 dark:text-white"
                    >{{ formatNumber(u.analyses_count) }}</span
                  >
                </td>
                <td class="px-4 py-4">
                  <span class="text-xs font-bold text-slate-500">{{
                    formatDate(u.last_analysis_at)
                  }}</span>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <NuxtLink
                      :to="`/admin/user/${u.id}`"
                      class="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
                    >
                      View
                    </NuxtLink>
                    <button
                      class="px-4 py-2 bg-secondary/10 text-secondary rounded-lg font-black text-xs uppercase tracking-widest hover:bg-secondary hover:text-white transition-all"
                      @click.prevent="estimateUserCost(u.id)"
                    >
                      Cost
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cost Estimates Panel -->
        <div
          v-if="Object.keys(estimates).length > 0"
          class="mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
        >
          <h3
            class="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest"
          >
            Cost Estimates
          </h3>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(estimate, userId) in estimates"
              :key="userId"
              class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"
            >
              <p
                class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"
              >
                User {{ userId.slice(0, 8) }}
              </p>
              <p v-if="estimate === -1" class="text-risk-high font-black">
                Estimation Error
              </p>
              <p
                v-else
                class="text-2xl font-black text-slate-900 dark:text-white"
              >
                {{ formatCurrency(estimate) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
