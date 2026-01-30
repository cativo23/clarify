<template>
  <div class="min-h-screen bg-primary-50">
    <AppHeader />

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
        <div class="bg-white rounded-xl shadow-soft p-8 mb-8 border border-primary-100">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-primary-900 mb-2">
                {{ analysis.contract_name }}
              </h1>
              <p class="text-primary-600">
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

          <!-- Summary -->
          <div class="p-6 bg-primary-50 rounded-lg border border-primary-200">
            <h2 class="text-lg font-semibold text-primary-900 mb-3">Resumen Ejecutivo</h2>
            <p class="text-primary-700 leading-relaxed">
              {{ summary.resumen_ejecutivo }}
            </p>
          </div>
        </div>

        <!-- Hallazgos -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-primary-900 mb-6">Puntos Clave del Análisis</h2>
          <div class="space-y-4">
            <RiskCard
              v-for="(hallazgo, index) in summary.hallazgos"
              :key="index"
              :category="hallazgo.titulo"
              :description="hallazgo.explicacion"
              :risk="hallazgo.color === 'rojo' ? 'high' : hallazgo.color === 'amarillo' ? 'medium' : 'low'"
              :clausula="hallazgo.clausula"
              :cita-textual="hallazgo.cita_textual"
            />
          </div>
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
    resumen_ejecutivo: '',
    nivel_riesgo_general: 'Bajo',
    hallazgos: [],
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
