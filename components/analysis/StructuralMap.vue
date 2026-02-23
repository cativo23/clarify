<template>
  <section
    class="forensic-section border-2 border-slate-300 dark:border-slate-600 rounded-2xl p-6 mb-8 bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-900 dark:to-slate-800/30"
  >
    <!-- Header with collapsible toggle -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full flex items-center gap-3 mb-4 group"
      :aria-expanded="isExpanded"
    >
      <div
        class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
      >
        <DocumentChartBarIcon class="w-5 h-5 text-slate-600 dark:text-slate-400" />
      </div>
      <div class="flex-1 text-left">
        <h3
          class="text-lg font-black text-slate-900 dark:text-white tracking-tight"
        >
          Mapa Estructural
        </h3>
        <p
          class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1"
        >
          {{ mapa.total_secciones }} secciones · {{ mapa.total_paginas }} páginas · {{ mapa.total_anexos }} anexos
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
      <!-- Summary stats -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div
          class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
        >
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Secciones
          </p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">
            {{ mapa.total_secciones }}
          </p>
        </div>
        <div
          class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
        >
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Páginas
          </p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">
            {{ mapa.total_paginas }}
          </p>
        </div>
        <div
          class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
        >
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Anexos
          </p>
          <p class="text-2xl font-black text-slate-900 dark:text-white">
            {{ mapa.total_anexos }}
          </p>
        </div>
      </div>

      <!-- Sections list -->
      <div class="space-y-2">
        <div
          v-for="(seccion, idx) in mapa.secciones"
          :key="idx"
          class="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
        >
          <!-- Risk indicator -->
          <div
            class="w-3 h-3 rounded-full shrink-0"
            :class="getRiskClass(seccion.riesgo)"
            :title="`Riesgo: ${seccion.riesgo}`"
          />

          <!-- Section name -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {{ seccion.nombre }}
            </p>
          </div>

          <!-- Pages -->
          <div class="text-right">
            <p class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {{ seccion.paginas }}
            </p>
          </div>
        </div>
      </div>

      <!-- Risk legend -->
      <div class="flex flex-wrap gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-risk-high" />
          <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Alto Riesgo
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-risk-medium" />
          <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Riesgo Medio
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-risk-low" />
          <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Favorable
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-slate-400" />
          <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Neutro
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { DocumentChartBarIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

export interface SeccionEstructural {
  nombre: string
  paginas: string
  riesgo: 'rojo' | 'amarillo' | 'verde' | 'gris'
}

export interface MapaEstructural {
  total_secciones: number
  total_anexos: number
  total_paginas: number
  secciones: SeccionEstructural[]
}

defineProps<{
  mapa: MapaEstructural
}>()

const isExpanded = ref(true)

const getRiskClass = (riesgo: string) => {
  switch (riesgo) {
    case 'rojo':
      return 'bg-risk-high shadow-lg shadow-risk-high/40'
    case 'amarillo':
      return 'bg-risk-medium shadow-lg shadow-risk-medium/40'
    case 'verde':
      return 'bg-risk-low shadow-lg shadow-risk-low/40'
    default:
      return 'bg-slate-400'
  }
}
</script>
