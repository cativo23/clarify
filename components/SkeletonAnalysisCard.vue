<template>
  <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 animate-pulse">
    <!-- Risk indicator -->
    <div class="flex items-start justify-between mb-6">
      <div class="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
      <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
    </div>
    <!-- Title -->
    <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
    <!-- Date and status -->
    <div class="flex items-center gap-2 mb-4">
      <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
      <div class="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
    </div>
    <!-- Summary lines -->
    <div class="space-y-2 mb-4">
      <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
      <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
    </div>
    <!-- Action button -->
    <div class="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
  </div>
</template>

<script setup lang="ts">
</script>
