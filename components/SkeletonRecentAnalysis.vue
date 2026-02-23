<template>
  <div
    class="group p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] animate-pulse"
  >
    <div class="flex items-center gap-4">
      <!-- Icon placeholder -->
      <div class="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
      <!-- Text content -->
      <div class="flex-1 space-y-2">
        <!-- Title line -->
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        <!-- Timestamp and status line -->
        <div class="flex items-center gap-2">
          <div class="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          <div
            class="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"
          ></div>
          <div class="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
