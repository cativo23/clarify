<template>
  <section
    aria-label="Puntaje de riesgo"
    class="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden"
  >
    <div
      class="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16"
    ></div>

    <div class="relative z-10 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div v-if="scoreRisk" class="flex items-center gap-3 shrink-0">
          <div class="flex items-baseline gap-1">
            <span class="text-[48px] font-black leading-[1.1] text-white">{{
              scoreRisk.value
            }}</span>
            <span
              class="text-[10px] font-black uppercase tracking-widest text-slate-500"
              >/10</span
            >
          </div>
          <span
            :class="[
              'inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest',
              scoreLevelClass,
            ]"
          >
            <svg
              v-if="scoreRisk.level === 'high'"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else-if="scoreRisk.level === 'medium'"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            {{ scoreRisk.label }}
          </span>
        </div>

        <ul aria-label="Hallazgos por severidad" class="flex flex-wrap gap-2">
          <li
            class="inline-flex items-center gap-2 rounded-full font-black uppercase tracking-wider px-3 py-1.5 text-[10px] bg-risk-high/10 text-risk-high"
          >
            <span>Críticos</span>
            <span class="text-white">{{ totalRojas }}</span>
          </li>
          <li
            class="inline-flex items-center gap-2 rounded-full font-black uppercase tracking-wider px-3 py-1.5 text-[10px] bg-risk-medium/10 text-risk-medium"
          >
            <span>Alertas</span>
            <span class="text-white">{{ totalAmarillas }}</span>
          </li>
          <li
            class="inline-flex items-center gap-2 rounded-full font-black uppercase tracking-wider px-3 py-1.5 text-[10px] bg-risk-low/10 text-risk-low"
          >
            <span>Seguros</span>
            <span class="text-white">{{ totalVerdes }}</span>
          </li>
        </ul>
      </div>

      <ul
        v-if="bars.length > 0"
        aria-label="Desglose de riesgo por categoría"
        class="space-y-4"
      >
        <li v-for="bar in bars" :key="bar.category">
          <span
            class="block text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >{{ bar.category }}</span
          >
          <div class="mt-2 flex items-center gap-3">
            <div class="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-secondary rounded-full"
                :style="{ width: `${bar.widthPct}%` }"
              ></div>
            </div>
            <span class="text-sm font-black text-white">{{ bar.count }}</span>
          </div>
        </li>
      </ul>

      <div
        class="pt-6 border-t border-slate-800 flex justify-between items-center"
      >
        <span
          class="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]"
          >Cobertura</span
        >
        <span class="text-xl font-black text-secondary">{{ coverage }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getScoreRisk, buildBreakdownBars } from "~/composables/useRiskScore";

const props = defineProps<{
  puntajeRiesgo?: number | undefined;
  desgloseRiesgo?: Record<string, number> | undefined;
  totalRojas: number;
  totalAmarillas: number;
  totalVerdes: number;
  coverage: string;
}>();

const scoreRisk = computed(() => getScoreRisk(props.puntajeRiesgo));
const bars = computed(() => buildBreakdownBars(props.desgloseRiesgo));

const scoreLevelClass = computed(() => {
  switch (scoreRisk.value?.level) {
    case "high":
      return "text-risk-high";
    case "medium":
      return "text-risk-medium";
    case "low":
      return "text-risk-low";
    default:
      return "";
  }
});
</script>
