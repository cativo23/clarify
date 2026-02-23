<template>
  <div
    class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 animate-pulse"
  >
    <!-- Header: Icon + Status Badge -->
    <div class="flex items-center justify-between mb-6">
      <div class="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
      <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
    </div>

    <!-- Contract Name -->
    <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>

    <!-- Date + Status -->
    <div class="flex items-center gap-2 mb-6">
      <div class="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
      <div class="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      <div class="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
    </div>

    <!-- Bottom Section: "Ver reporte" + arrow -->
    <div
      class="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800"
    >
      <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
      <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
