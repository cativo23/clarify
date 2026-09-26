<template>
  <section class="mb-12">
    <div class="flex items-center gap-4 mb-8">
      <h2
        class="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
      >
        Análisis por Cláusula
      </h2>
      <div class="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
    </div>

    <div
      v-if="hallazgos.length === 0"
      class="bg-white dark:bg-slate-900 rounded-[2rem] shadow-soft p-8 border border-slate-100 dark:border-slate-800"
    >
      <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">
        Sin hallazgos de riesgo
      </h3>
      <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {{ formatCoverageSentence(coverage) }}
      </p>
    </div>

    <div v-else class="grid gap-6">
      <div
        v-for="(hallazgo, index) in hallazgos"
        :id="findingAnchorId(index)"
        :key="findingAnchorId(index)"
        class="scroll-mt-24"
      >
        <RiskCard
          :category="hallazgo.titulo"
          :description="hallazgo.explicacion"
          :risk="hallazgoColorToRisk(hallazgo.color)"
          :clausula="hallazgo.clausula"
          :cita-textual="hallazgo.cita_textual"
          :riesgo-real="hallazgo.riesgo_real"
          :mitigacion="hallazgo.mitigacion"
          :confianza="hallazgo.confianza"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Hallazgo } from "~/types";
import RiskCard from "~/components/RiskCard.vue";
import {
  findingAnchorId,
  hallazgoColorToRisk,
  formatCoverageSentence,
} from "~/composables/useFindingsReport";

defineProps<{ hallazgos: Hallazgo[]; coverage: string }>();
</script>
