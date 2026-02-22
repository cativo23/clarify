<template>
  <div class="space-y-6">
    <!-- User Profile Card Skeleton -->
    <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 animate-pulse">
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-4 rounded-3xl bg-slate-200 dark:bg-slate-700"></div>
        <div class="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mx-auto mb-2"></div>
        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 mx-auto mb-6"></div>
        <div class="flex items-center justify-center gap-2 px-4 py-2 mb-4 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div class="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700"></div>
          <div class="h-5 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
        </div>
        <div class="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
      </div>
    </div>

    <!-- Safety Metrics Card Skeleton -->
    <div class="bg-slate-900 rounded-[2rem] p-6 border border-slate-800 animate-pulse">
      <div class="flex items-center justify-between mb-6">
        <div class="h-3 bg-slate-700 rounded w-32"></div>
        <div class="h-5 bg-slate-700 rounded w-16"></div>
      </div>
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-slate-700"></div>
        <div class="space-y-2">
          <div class="h-2 bg-slate-700 rounded w-24"></div>
          <div class="h-3 bg-slate-700 rounded w-32"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
        <div class="space-y-2">
          <div class="h-6 bg-slate-700 rounded w-12"></div>
          <div class="h-2 bg-slate-700 rounded w-20"></div>
        </div>
        <div class="space-y-2">
          <div class="h-6 bg-slate-700 rounded w-12 ml-auto"></div>
          <div class="h-2 bg-slate-700 rounded w-20 ml-auto"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
