<template>
  <nav
    aria-label="Índice de secciones"
    class="bg-white dark:bg-slate-900 rounded-[2rem] shadow-soft p-6 border border-slate-100 dark:border-slate-800"
  >
    <h3 class="text-xl font-black text-slate-900 dark:text-white mb-4">
      Secciones
    </h3>
    <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-x-4">
      <li v-for="entry in entries" :key="entry.category">
        <button
          type="button"
          class="w-full text-left py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500"
          @click="scrollToEntry(entry)"
        >
          {{ entry.category }} ({{ entry.count }})
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { CategoryIndexEntry } from "~/composables/useFindingsReport";
import { findingAnchorId } from "~/composables/useFindingsReport";

defineProps<{ entries: CategoryIndexEntry[] }>();

function scrollToEntry(entry: CategoryIndexEntry): void {
  const target = document.getElementById(findingAnchorId(entry.firstIndex));
  if (!target) return;
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
  target.focus({ preventScroll: true });
}
</script>
