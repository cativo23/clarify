<script setup lang="ts">
import { LineChart } from 'vue-chrts';
import type { ChartData } from 'vue-chrts';

interface RevenuePoint {
  date: string;
  gross_revenue: number;
  net_revenue: number;
}

interface RevenueData {
  revenue: RevenuePoint[];
  summary: {
    total_revenue: number;
    total_net_revenue: number;
    total_transactions: number;
    total_credits_sold: number;
  };
}

const props = defineProps<{
  data: RevenueData | null;
}>();

const chartData = computed<ChartData>(() => {
  if (!props.data?.revenue) return { data: [], categories: [] };

  const sorted = [...props.data.revenue].sort((a, b) => a.date.localeCompare(b.date));

  return {
    data: sorted.map(r => ({
      date: r.date.split('T')[0],
      gross: r.gross_revenue,
      net: r.net_revenue,
    })),
    categories: {
      gross: { name: 'Gross Revenue', color: '#10b981' },
      net: { name: 'Net Revenue', color: '#3b82f6' },
    },
  };
});

const xFormatter = (i: number) => {
  if (!chartData.value.data[i]) return '';
  return chartData.value.data[i].date;
};
</script>

<template>
  <div v-if="data?.revenue" class="h-full">
    <LineChart
      :data="chartData.data"
      :categories="chartData.categories"
      :height="288"
      :xFormatter="xFormatter"
      xLabel="Date"
      yLabel="Revenue (USD)"
      :showLegend="true"
      :curve="true"
    />
  </div>
  <div v-else class="flex items-center justify-center h-72 text-slate-400">
    No revenue data available
  </div>
</template>
