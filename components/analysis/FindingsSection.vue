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

    <div
      v-else
      class="grid gap-6 items-start"
      :class="
        indexEntries.length > 0
          ? ['lg:grid-cols-[14rem_minmax(0,1fr)]', 'lg:gap-8']
          : []
      "
    >
      <aside v-if="indexEntries.length > 0" class="lg:sticky lg:top-24">
        <ReportSidebar :entries="indexEntries" />
      </aside>
      <div class="grid gap-6">
        <div
          v-for="(hallazgo, index) in hallazgos"
          :id="findingAnchorId(index)"
          :key="findingAnchorId(index)"
          tabindex="-1"
          class="scroll-mt-24 focus:outline-none"
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Hallazgo } from "~/types";
import RiskCard from "~/components/RiskCard.vue";
import ReportSidebar from "~/components/analysis/ReportSidebar.vue";
import {
  findingAnchorId,
  hallazgoColorToRisk,
  formatCoverageSentence,
  groupFindingsByCategory,
} from "~/composables/useFindingsReport";

const props = defineProps<{ hallazgos: Hallazgo[]; coverage: string }>();

const indexEntries = computed(() => groupFindingsByCategory(props.hallazgos));
</script>
