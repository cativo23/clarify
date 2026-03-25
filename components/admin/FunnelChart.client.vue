<script setup lang="ts">
import { BarChart } from 'vue-chrts';
import type { ChartData } from 'vue-chrts';

interface FunnelStage {
  stage: string;
  count: number;
  rate: number;
}

interface FunnelData {
  funnel: FunnelStage[];
  period: {
    from: string;
    to: string;
  };
}

const props = defineProps<{
  data: FunnelData | null;
}>();

const chartData = computed<ChartData>(() => {
  if (!props.data?.funnel) return { data: [], categories: [] };

  return {
    data: props.data.funnel.map(f => ({
      stage: f.stage,
      count: f.count,
    })),
    categories: {
      count: { name: 'Users', color: '#6366f1' },
    },
  };
});

const xFormatter = (i: number) => {
  if (!chartData.value.data[i]) return '';
  return chartData.value.data[i].stage;
};
</script>

<template>
  <div v-if="data?.funnel" class="h-full">
    <BarChart
      :data="chartData.data"
      :categories="chartData.categories"
      :height="256"
      :xFormatter="xFormatter"
      xLabel="Stage"
      yLabel="Users"
      :showLegend="false"
      :horizontal="true"
      :yAxis="['count']"
    />
  </div>
  <div v-else class="flex items-center justify-center h-64 text-slate-400">
    No funnel data available
  </div>
</template>
