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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-2xl font-bold text-primary-900 mb-2">Análisis no encontrado</h2>
        <p class="text-primary-600 mb-6">El análisis que buscas no existe o ha sido eliminado</p>
        <NuxtLink to="/dashboard" class="inline-block px-6 py-3 bg-accent-indigo text-white rounded-lg font-semibold hover:bg-accent-purple transition-all">
          Volver al Dashboard
        </NuxtLink>
      </div>

      <div v-else class="animate-fade-in">
        <!-- Header -->
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-premium p-8 mb-10 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
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

            <!-- Overall Risk Badge -->
            <div 
              :class="[
                'px-6 py-3 rounded-full font-bold text-lg',
                analysis.risk_level === 'high' ? 'bg-risk-high text-white' :
                analysis.risk_level === 'medium' ? 'bg-risk-medium text-white' :
                'bg-risk-low text-white'
              ]"
            >
              {{ 
                analysis.risk_level === 'high' ? '🔴 Riesgo Alto' :
                analysis.risk_level === 'medium' ? '🟡 Precaución' :
                '🟢 Seguro'
              }}
            </div>
          </div>

          <!-- Summary & Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
            <div class="md:col-span-2 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative group">
              <div class="flex items-center gap-3 mb-6">
                <span class="text-xs font-black uppercase tracking-widest text-slate-400">Veredicto Legal</span>
                <span :class="[
                  'px-4 py-1 rounded-full text-xs font-bold ring-1 ring-inset',
                  summary.resumen_ejecutivo.veredicto?.includes('Rechazar') ? 'bg-risk-high/10 text-risk-high ring-risk-high/30' :
                  summary.resumen_ejecutivo.veredicto?.includes('Negociar') ? 'bg-risk-medium/10 text-risk-medium ring-risk-medium/30' :
                  'bg-risk-low/10 text-risk-low ring-risk-low/30'
                ]">
                  {{ summary.resumen_ejecutivo.veredicto }}
                </span>
              </div>
              <h2 class="text-xl font-black text-slate-900 dark:text-white mb-3">Análisis Forense</h2>
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-6">
                {{ summary.resumen_ejecutivo.justificacion }}
              </p>
              <div v-if="summary.resumen_ejecutivo.mayor_riesgo_identificado" class="p-4 bg-white dark:bg-slate-900 rounded-2xl border-l-4 border-risk-high shadow-sm">
                <span class="text-[10px] font-black text-risk-high uppercase tracking-widest block mb-1">Impacto Crítico Principal</span>
                <p class="text-sm text-slate-800 dark:text-slate-200 font-bold italic">{{ summary.resumen_ejecutivo.mayor_riesgo_identificado }}</p>
              </div>
            </div>

            <div class="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <h3 class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">Métricas de Auditoría</h3>
              <div class="space-y-5">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-bold text-slate-600 dark:text-slate-400">Puntos Críticos</span>
                  <span class="px-3 py-1 bg-risk-high text-white rounded-full text-[10px] font-black shadow-glow-sm">{{ summary.metricas.total_rojas }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-bold text-slate-600 dark:text-slate-400">Advertencias</span>
                  <span class="px-3 py-1 bg-risk-medium text-white rounded-full text-[10px] font-black shadow-glow-sm">{{ summary.metricas.total_amarillas }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-bold text-slate-600 dark:text-slate-400">Puntos Favorables</span>
                  <span class="px-3 py-1 bg-risk-low text-white rounded-full text-[10px] font-black shadow-glow-sm">{{ summary.metricas.total_verdes }}</span>
                </div>
                <div class="pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobertura</span>
                  <span class="text-sm font-black text-slate-900 dark:text-white">{{ summary.metricas.porcentaje_clausulas_analizadas }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hallazgos -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold dark:text-white text-primary-900 mb-6">Hallazgos Detallados</h2>
          <div class="space-y-4">
            <RiskCard
              v-for="(hallazgo, index) in summary.hallazgos"
              :key="index"
              :category="hallazgo.titulo"
              :description="hallazgo.explicacion"
              :risk="hallazgo.color === 'rojo' ? 'high' : hallazgo.color === 'amarillo' ? 'medium' : 'low'"
              :clausula="hallazgo.clausula"
              :cita-textual="hallazgo.cita_textual"
              :riesgo-real="hallazgo.riesgo_real"
              :mitigacion="hallazgo.mitigacion"
            />
          </div>
        </div>

        <!-- Cláusulas No Clasificadas -->
        <div v-if="summary.clausulas_no_clasificadas?.length" class="mb-8 p-6 bg-white rounded-xl border-2 border-dashed border-primary-200">
          <h3 class="text-lg font-bold text-primary-800 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cláusulas no categorizadas
          </h3>
          <ul class="list-disc list-inside space-y-2">
            <li v-for="(item, i) in summary.clausulas_no_clasificadas" :key="i" class="text-sm text-primary-600">
              {{ item }}
            </li>
          </ul>
        </div>


        <!-- Actions -->
        <div class="flex gap-4 justify-center">
          <button
            @click="downloadPDF"
            class="px-6 py-3 bg-white border-2 border-primary-300 text-primary-900 rounded-lg font-semibold hover:bg-primary-50 transition-all"
          >
            Descargar Reporte
          </button>
          <NuxtLink
            to="/dashboard"
            class="px-6 py-3 bg-accent-indigo text-white rounded-lg font-semibold hover:bg-accent-purple transition-all"
          >
            Analizar Otro Contrato
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
