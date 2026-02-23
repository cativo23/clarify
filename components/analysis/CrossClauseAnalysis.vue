<template>
  <section
    class="forensic-section border-2 border-accent-indigo/30 rounded-2xl p-6 mb-8 bg-gradient-to-br from-accent-indigo/5 to-secondary/5 dark:from-slate-900 dark:to-slate-800/50"
  >
    <!-- Header with collapsible toggle -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full flex items-center gap-3 mb-4 group"
      :aria-expanded="isExpanded"
    >
      <div
        class="w-10 h-10 rounded-xl bg-accent-indigo/10 dark:bg-accent-indigo/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
      >
        <ShieldCheckIcon class="w-5 h-5 text-accent-indigo" />
      </div>
      <div class="flex-1 text-left">
        <h3
          class="text-lg font-black text-slate-900 dark:text-white tracking-tight"
        >
          Análisis Cruzado de Cláusulas
        </h3>
        <p
          class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1"
        >
          {{ analisisCruzado.length }} inconsistencias detectadas entre cláusulas
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
        v-for="(item, idx) in analisisCruzado"
        :key="item.inconsistencia_id || idx"
        class="bg-white dark:bg-slate-900 rounded-xl p-5 border-l-4 shadow-sm hover:shadow-md transition-shadow"
        :class="getBorderClass(item.severidad)"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 mb-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span
                class="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest"
                :class="getBadgeClass(item.severidad)"
              >
                {{ item.tipo }}
              </span>
              <span
                class="text-[10px] font-bold text-slate-400 dark:text-slate-500"
              >
                {{ item.inconsistencia_id }}
              </span>
            </div>
            <p class="font-bold text-slate-800 dark:text-slate-200">
              {{ item.clausula_origen }} → {{ item.clausula_destino }}
            </p>
          </div>
        </div>

        <!-- Inconsistency details -->
        <div class="space-y-3">
          <div
            class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"
          >
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Inconsistencia
            </p>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
              {{ item.inconsistencia }}
            </p>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div
              class="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-800/30"
            >
              <p class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
                Texto Original
              </p>
              <p class="text-xs font-medium text-amber-900 dark:text-amber-300 italic">
                "{{ item.texto_origen }}"
              </p>
            </div>
            <div
              class="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-800/30"
            >
              <p class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
                Texto Destino
              </p>
              <p class="text-xs font-medium text-amber-900 dark:text-amber-300 italic">
                "{{ item.texto_destino }}"
              </p>
            </div>
          </div>

          <div
            class="p-3 bg-risk-high/5 dark:bg-risk-high/10 rounded-lg border border-risk-high/20"
          >
            <p class="text-[10px] font-black text-risk-high uppercase tracking-widest mb-1">
              Impacto
            </p>
            <p class="text-sm font-bold text-slate-800 dark:text-slate-200">
              {{ item.impacto }}
            </p>
          </div>

          <div
            class="p-3 bg-secondary/5 dark:bg-secondary/10 rounded-lg border border-secondary/20"
          >
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">
              Recomendación
            </p>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
              {{ item.recomendacion }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ShieldCheckIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

export interface AnalisisCruzadoItem {
  inconsistencia_id: string
  tipo: string
  clausula_origen: string
  clausula_destino: string
  texto_origen: string
  texto_destino: string
  inconsistencia: string
  impacto: string
  recomendacion: string
  severidad: 'rojo' | 'amarillo'
}

defineProps<{
  analisisCruzado: AnalisisCruzadoItem[]
}>()

const isExpanded = ref(true)

const getBorderClass = (severidad: string) => {
  return severidad === 'rojo'
    ? 'border-risk-high'
    : 'border-risk-medium'
}

const getBadgeClass = (severidad: string) => {
  return severidad === 'rojo'
    ? 'bg-risk-high/10 text-risk-high ring-1 ring-inset ring-risk-high/30'
    : 'bg-risk-medium/10 text-risk-medium ring-1 ring-inset ring-risk-medium/30'
}
</script>
