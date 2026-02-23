<template>
  <section
    class="forensic-section border-2 border-amber-500/30 rounded-2xl p-6 mb-8 bg-gradient-to-br from-amber-500/5 to-amber-600/5 dark:from-slate-900 dark:to-slate-800/50"
  >
    <!-- Header with collapsible toggle -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full flex items-center gap-3 mb-4 group"
      :aria-expanded="isExpanded"
    >
      <div
        class="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
      >
        <ExclamationTriangleIcon class="w-5 h-5 text-amber-600 dark:text-amber-500" />
      </div>
      <div class="flex-1 text-left">
        <h3
          class="text-lg font-black text-slate-900 dark:text-white tracking-tight"
        >
          Omisiones Críticas
        </h3>
        <p
          class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1"
        >
          {{ omisiones.length }} cláusulas esenciales faltantes con sugerencias
        </p>
      </div>
      <ChevronDownIcon
        class="w-5 h-5 text-slate-400 transition-transform duration-300"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>

    <!-- Collapsible content -->
    <div
      v-show="isExpanded"
      class="space-y-4 animate-fade-in pl-14"
    >
      <div
        v-for="(omision, idx) in omisiones"
        :key="omision.omision_id || idx"
        class="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Header -->
        <div class="flex items-start gap-3 mb-3">
          <div
            class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0"
          >
            <DocumentTextIcon class="w-4 h-4 text-amber-600 dark:text-amber-500" />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {{ omision.omision_id }}
              </span>
              <span
                class="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/30"
              >
                {{ omision.categoria.split(' - ')[0] }}
              </span>
            </div>
            <p class="font-bold text-slate-800 dark:text-slate-200">
              {{ omision.que_falta }}
            </p>
          </div>
        </div>

        <!-- Details grid -->
        <div class="space-y-3">
          <div
            class="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-800/30"
          >
            <p class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
              Por qué es crítico
            </p>
            <p class="text-sm font-medium text-amber-900 dark:text-amber-300 leading-relaxed">
              {{ omision.por_que_critico }}
            </p>
          </div>

          <div
            class="p-3 bg-risk-medium/5 dark:bg-risk-medium/10 rounded-lg border border-risk-medium/20"
          >
            <p class="text-[10px] font-black text-risk-medium uppercase tracking-widest mb-1">
              Riesgo para el Usuario
            </p>
            <p class="text-sm font-bold text-slate-800 dark:text-slate-200">
              {{ omision.riesgo_usuario }}
            </p>
          </div>

          <!-- Suggested clause -->
          <div
            class="p-4 bg-secondary/5 dark:bg-secondary/10 rounded-xl border-2 border-dashed border-secondary/30"
          >
            <div class="flex items-start gap-3">
              <PencilIcon class="w-4 h-4 text-secondary mt-0.5 shrink-0" />
              <div class="flex-1">
                <p class="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                  Cláusula Sugerida
                </p>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed border-l-2 border-secondary/30 pl-3">
                  {{ omision.clausula_sugerida }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="!omisiones.length"
        class="text-center py-8"
      >
        <CheckCircleIcon class="w-12 h-12 text-risk-low mx-auto mb-3 opacity-50" />
        <p class="text-sm font-bold text-slate-500 dark:text-slate-400">
          No se detectaron omisiones críticas
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckCircleIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

export interface OmisionCritic {
  omision_id: string
  categoria: string
  que_falta: string
  por_que_critico: string
  riesgo_usuario: string
  clausula_sugerida: string
}

defineProps<{
  omisiones: OmisionCritic[]
}>()

const isExpanded = ref(true)
</script>
