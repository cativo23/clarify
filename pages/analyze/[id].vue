<template>
  <div class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">

    <!-- Main Content -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-accent-indigo"></div>
        <p class="mt-4 text-primary-600 text-lg">Cargando análisis...</p>
      </div>

      <div v-else-if="!analysis" class="text-center py-20">
        <svg class="w-20 h-20 text-primary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-2xl font-bold text-primary-900 mb-2">Análisis no encontrado</h2>
        <p class="text-primary-600 mb-6">El análisis que buscas no existe o ha sido eliminado</p>
        <NuxtLink to="/dashboard"
          class="inline-block px-6 py-3 bg-accent-indigo text-white rounded-lg font-semibold hover:bg-accent-purple transition-all">
          Volver al Dashboard
        </NuxtLink>
      </div>

      <div v-else class="animate-fade-in">
        <!-- Header -->
        <div
          class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-premium p-8 mb-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h1 class="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                {{ analysis.contract_name }}
              </h1>
              <p class="text-slate-500 dark:text-slate-400 font-medium">
                Analizado el {{ formatDate(analysis.created_at) }}
              </p>
            </div>

            <!-- Traffic Light (Semáforo) Style Header -->
            <div
              class="flex flex-col items-center gap-4 px-8 py-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nivel de Riesgo</span>
              <div class="flex gap-4">
                <!-- Rojo -->
                <div class="flex flex-col items-center gap-2 group">
                  <div :class="[
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg',
                    analysis.risk_level === 'high' ? 'bg-risk-high text-white scale-110 shadow-risk-high/40' : 'bg-risk-high/10 text-risk-high/30 grayscale opacity-40'
                  ]">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span v-if="analysis.risk_level === 'high'"
                    class="text-[9px] font-black text-risk-high uppercase tracking-widest">Crítico</span>
                </div>
                <!-- Amarillo -->
                <div class="flex flex-col items-center gap-2 group">
                  <div :class="[
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg',
                    analysis.risk_level === 'medium' ? 'bg-risk-medium text-white scale-110 shadow-risk-medium/40' : 'bg-risk-medium/10 text-risk-medium/30 grayscale opacity-40'
                  ]">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span v-if="analysis.risk_level === 'medium'"
                    class="text-[9px] font-black text-risk-medium uppercase tracking-widest">Cautela</span>
                </div>
                <!-- Verde -->
                <div class="flex flex-col items-center gap-2 group">
                  <div :class="[
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg',
                    analysis.risk_level === 'low' ? 'bg-risk-low text-white scale-110 shadow-risk-low/40' : 'bg-risk-low/10 text-risk-low/30 grayscale opacity-40'
                  ]">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span v-if="analysis.risk_level === 'low'"
                    class="text-[9px] font-black text-risk-low uppercase tracking-widest">Seguro</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary & Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
            <div
              class="md:col-span-2 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative group">
              <div class="flex items-center gap-3 mb-6">
                <span class="text-xs font-black uppercase tracking-widest text-slate-400">Veredicto Legal</span>
                <span :class="[
                  'px-4 py-1 rounded-full text-xs font-bold ring-1 ring-inset',
                  summary.resumen_ejecutivo.veredicto?.includes('Rechazar') || summary.resumen_ejecutivo.veredicto?.includes('No') ? 'bg-risk-high/10 text-risk-high ring-risk-high/30' :
                    summary.resumen_ejecutivo.veredicto?.includes('Negociar') || summary.resumen_ejecutivo.veredicto?.includes('Precaución') ? 'bg-risk-medium/10 text-risk-medium ring-risk-medium/30' :
                      'bg-risk-low/10 text-risk-low ring-risk-low/30'
                ]">
                  {{ summary.resumen_ejecutivo.veredicto }}
                </span>
              </div>
              <h2 class="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Análisis Forense</h2>
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-6">
                {{ summary.resumen_ejecutivo.justificacion }}
              </p>
              <div v-if="summary.resumen_ejecutivo.mayor_riesgo_identificado"
                class="p-4 bg-white dark:bg-slate-900 rounded-2xl border-l-4 border-risk-high shadow-lg shadow-risk-high/5">
                <span class="text-[10px] font-black text-risk-high uppercase tracking-widest block mb-1">Impacto Crítico
                  Principal</span>
                <p class="text-sm text-slate-800 dark:text-slate-200 font-black italic">{{
                  summary.resumen_ejecutivo.mayor_riesgo_identificado }}</p>
              </div>
            </div>

            <div class="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h3 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">Métricas</h3>
              <div class="space-y-6 relative z-10">
                <div class="flex justify-between items-center group">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Críticos</span>
                  <div class="flex items-center gap-3">
                    <div class="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-risk-high"
                        :style="{ width: `${(summary.metricas.total_rojas / (summary.metricas.total_rojas + summary.metricas.total_amarillas + summary.metricas.total_verdes || 1)) * 100}%` }">
                      </div>
                    </div>
                    <span class="text-sm font-black text-white">{{ summary.metricas.total_rojas }}</span>
                  </div>
                </div>
                <div class="flex justify-between items-center group">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alertas</span>
                  <div class="flex items-center gap-3">
                    <div class="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-risk-medium"
                        :style="{ width: `${(summary.metricas.total_amarillas / (summary.metricas.total_rojas + summary.metricas.total_amarillas + summary.metricas.total_verdes || 1)) * 100}%` }">
                      </div>
                    </div>
                    <span class="text-sm font-black text-white">{{ summary.metricas.total_amarillas }}</span>
                  </div>
                </div>
                <div class="flex justify-between items-center group">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguros</span>
                  <div class="flex items-center gap-3">
                    <div class="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-risk-low"
                        :style="{ width: `${(summary.metricas.total_verdes / (summary.metricas.total_rojas + summary.metricas.total_amarillas + summary.metricas.total_verdes || 1)) * 100}%` }">
                      </div>
                    </div>
                    <span class="text-sm font-black text-white">{{ summary.metricas.total_verdes }}</span>
                  </div>
                </div>
                <div class="pt-6 border-t border-slate-800 flex justify-between items-center">
                  <span class="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Cobertura</span>
                  <span class="text-xl font-black text-secondary">{{ summary.metricas.porcentaje_clausulas_analizadas
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Legal Disclaimer Note -->
        <div
          class="mb-10 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center gap-4 animate-fade-in">
          <div
            class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-xs font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
            <span class="uppercase">Nota:</span> Este análisis es una guía informativa generada por IA. No constituye
            asesoría legal profesional. Siempre valide estos hallazgos con un abogado cualificado.
          </p>
        </div>

        <!-- Hallazgos -->
        <div class="mb-12">
          <div class="flex items-center gap-4 mb-8">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Análisis por Cláusula</h2>
            <div class="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
          </div>
          <div class="grid gap-6">
            <RiskCard v-for="(hallazgo, index) in summary.hallazgos" :key="index" :category="hallazgo.titulo"
              :description="hallazgo.explicacion"
              :risk="hallazgo.color === 'rojo' ? 'high' : hallazgo.color === 'amarillo' ? 'medium' : 'low'"
              :clausula="hallazgo.clausula" :cita-textual="hallazgo.cita_textual" :riesgo-real="hallazgo.riesgo_real"
              :mitigacion="hallazgo.mitigacion" />
          </div>
        </div>

        <!-- Cláusulas No Clasificadas -->
        <div v-if="summary.clausulas_no_clasificadas?.length"
          class="mb-12 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <h3
            class="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cláusulas Informativas
          </h3>
          <ul class="grid sm:grid-cols-2 gap-3">
            <li v-for="(item, i) in summary.clausulas_no_clasificadas" :key="i"
              class="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <span class="mt-1 w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0"></span>
              {{ item }}
            </li>
          </ul>
        </div>


        <!-- Actions -->
        <div
          class="flex flex-col sm:flex-row gap-4 justify-center items-center py-10 border-t border-slate-100 dark:border-slate-800">
          <button @click="downloadPDF"
            class="w-full sm:w-auto px-10 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-soft">
            Descargar Reporte (PDF)
          </button>
          <NuxtLink to="/dashboard"
            class="w-full sm:w-auto px-10 py-4 bg-secondary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-glow hover:scale-105 active:scale-95 transition-all text-center">
            Nueva Auditoría
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Analysis, AnalysisSummary } from '~/types'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const supabase = useSupabaseClient()

const analysis = ref<Analysis | null>(null)
const loading = ref(true)

const summary = computed<AnalysisSummary>(() => {
  return analysis.value?.summary_json || {
    resumen_ejecutivo: {
      veredicto: 'Bajo análisis',
      justificacion: '',
      clausulas_criticas_totales: 0,
      mayor_riesgo_identificado: ''
    },
    nivel_riesgo_general: 'Bajo',
    metricas: {
      total_rojas: 0,
      total_amarillas: 0,
      total_verdes: 0,
      porcentaje_clausulas_analizadas: '0%'
    },
    hallazgos: [],
    clausulas_no_clasificadas: []
  }
})

const fetchAnalysis = async () => {
  const id = route.params.id as string

  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    analysis.value = data
  } catch (error) {
    console.error('Error fetching analysis:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const downloadPDF = () => {
  // TODO: Implement PDF export
  alert('Funcionalidad de descarga en desarrollo')
}

onMounted(() => {
  fetchAnalysis()
})

useHead({
  title: computed(() => analysis.value?.contract_name || 'Análisis'),
})
</script>
