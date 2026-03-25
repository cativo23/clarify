<script setup lang="ts">
import { BarChart } from 'vue-chrts';
import type { ChartData } from 'vue-chrts';

interface User {
  id: string;
  email: string;
  analyses_count: number;
}

const props = defineProps<{
  users: User[];
}>();

const chartData = computed<ChartData>(() => {
  if (!props.users.length) return { data: [], categories: [] };

  return {
    data: props.users.map(u => ({
      user: u.email?.split('@')[0] || 'User',
      count: u.analyses_count || 0,
    })),
    categories: {
      count: { name: 'Analyses', color: '#f59e0b' },
    },
  };
});

const xFormatter = (i: number) => {
  if (!chartData.value.data[i]) return '';
  return chartData.value.data[i].user;
};
</script>

<template>
  <div v-if="users.length" class="h-full">
    <BarChart
      :data="chartData.data"
      :categories="chartData.categories"
      :height="256"
      :xFormatter="xFormatter"
      xLabel="User"
      yLabel="Analyses"
      :showLegend="false"
      :yAxis="['count']"
    />
  </div>
  <div v-else class="flex items-center justify-center h-64 text-slate-400">
    No analyses data available
  </div>
</template>
