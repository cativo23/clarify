<template>
  <div class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- New Dashboard Layout -->
      <div class="grid lg:grid-cols-4 gap-8 mb-12">
        <!-- Sidebar: User & Quick Stats -->
        <div class="lg:col-span-1 space-y-6">
          <div
            class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft relative overflow-hidden group">
            <div
              class="absolute -top-4 -right-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors">
            </div>
            <div class="relative z-10 text-center">
              <div
                class="w-20 h-20 bg-gradient-to-br from-secondary to-accent-indigo rounded-3xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-secondary/20">
                {{ user?.email?.charAt(0).toUpperCase() }}
              </div>
              <h2 class="text-xl font-black text-slate-900 dark:text-white truncate mb-1">{{ user?.email?.split('@')[0]
                }}
              </h2>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Plan Estándar</p>

              <div
                class="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/10 rounded-xl mb-4 border border-secondary/20">
                <svg class="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" />
                </svg>
                <span class="text-lg font-black text-secondary">{{ userProfile?.credits || 0 }}</span>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Créditos</span>
              </div>

              <NuxtLink to="/credits"
                class="block w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98]">
                Comprar Más
              </NuxtLink>
            </div>
          </div>

          <!-- Quick Metrics -->
          <div
            class="bg-slate-900 rounded-[2rem] p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden group">
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-secondary/30 transition-colors">
            </div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Resumen de Seguridad</h3>
                <span
                  class="px-2 py-0.5 bg-secondary/20 text-secondary text-[8px] font-black uppercase rounded-full border border-secondary/30">
                  En Vivo
                </span>
              </div>

              <div class="space-y-6">
                <!-- Safety Score -->
                <div class="flex items-center gap-4">
                  <div class="relative flex items-center justify-center">
                    <svg class="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="6" fill="transparent"
                        class="text-slate-800" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="6" fill="transparent"
                        :stroke-dasharray="2 * Math.PI * 28"
                        :stroke-dashoffset="(1 - safetyScore / 100) * (2 * Math.PI * 28)"
                        class="text-secondary transition-all duration-1000 ease-out" />
                    </svg>
                    <span class="absolute text-sm font-black">{{ safetyScore }}%</span>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Índice de Protección</p>
                    <p class="text-xs font-black text-white">{{ safetyScore > 80 ? 'Seguridad Alta' : safetyScore > 50 ?
                      'Seguridad Media' : 'Atención Requerida' }}</p>
                  </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
                  <div>
                    <p class="text-xl font-black text-white">{{ totalCriticalFindings }}</p>
                    <p class="text-[9px] font-bold text-slate-500 uppercase">Puntos Críticos</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xl font-black text-secondary">{{ monthlyActivity }}</p>
                    <p class="text-[9px] font-bold text-slate-500 uppercase">Analizados / Mes</p>
                  </div>
                </div>

                <!-- Last Audit -->
                <div class="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Última Auditoría</span>
                  </div>
                  <span class="text-[10px] font-black text-white">{{ lastAnalysisDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Distribution & New Analysis -->
        <div class="lg:col-span-3 space-y-8">
          <!-- Distribution Chart Area -->
          <div
            class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2">Distribución de Riesgos</h2>
              <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Panorama general de tus contratos analizados.
              </p>

              <div class="space-y-3">
                <div v-for="risk in riskDistribution" :key="risk.level" class="flex items-center gap-3">
                  <div :class="['w-3 h-3 rounded-full', risk.color]"></div>
                  <span class="flex-1 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{{
                    risk.label }}</span>
                  <span class="text-sm font-black text-slate-900 dark:text-white">{{ risk.count }}</span>
                </div>
              </div>
            </div>

            <!-- SVG Donut Chart -->
            <div class="relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" class="w-48 h-48 transform -rotate-90">
                <circle v-for="(segment, idx) in chartSegments" :key="idx" cx="50" cy="50" r="40" fill="transparent"
                  stroke-width="12" :stroke="segment.stroke" :stroke-dasharray="`${segment.length} 251.2`"
                  :stroke-dashoffset="-segment.offset" class="transition-all duration-1000 ease-out" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-black text-slate-900 dark:text-white">{{ analyses.length }}</span>
                <span
                  class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-3">Contratos<br />Auditados</span>
              </div>
            </div>
          </div>

          <!-- New Analysis Section -->
          <div
            class="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-[2.5rem] shadow-premium p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
            <div
              class="absolute bottom-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mb-32 -mr-32 group-hover:bg-secondary/10 transition-colors duration-700">
            </div>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
              <span class="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </span>
              Auditar nuevo contrato
            </h2>

            <Dropzone v-model="selectedFile" @error="handleDropzoneError" class="mb-8" />

            <div v-if="selectedFile" class="space-y-8 animate-slide-up">
              <!-- Analysis Type Selector -->
              <div>
                <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Elige el nivel de protección
                </label>
                <AnalysisSelector v-model="analysisType" :user-credits="userProfile?.credits || 0" />
              </div>

              <!-- Contract Name and Action -->
              <div class="flex flex-col sm:flex-row gap-4 mb-4">
                <input v-model="contractName" type="text" placeholder="Nombre (ej: Contrato Arriendo)"
                  class="flex-1 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary text-slate-900 dark:text-white transition-all outline-none font-bold" />
                <button @click="handleAnalyze"
                  :disabled="analyzing || !contractName || (sharedCredits || 0) < (analysisType === 'premium' ? 3 : 1)"
                  class="px-10 py-4 bg-secondary text-white rounded-2xl font-black text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-3">
                  <span v-if="analyzing"
                    class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {{ analyzeButtonText }}
                </button>
              </div>

              <!-- Credit Warnings -->
              <div v-if="needsCredits"
                class="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 animate-slide-up flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" />
                    </svg>
                  </div>
                  <p class="text-xs font-bold text-slate-600 dark:text-slate-400">
                    No tienes créditos suficientes para realizar esta auditoría.
                  </p>
                </div>
                <NuxtLink to="/credits"
                  class="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline whitespace-nowrap">
                  Comprar Créditos
                </NuxtLink>
              </div>

              <div v-else-if="needsMoreForPremium"
                class="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 animate-slide-up flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" />
                    </svg>
                  </div>
                  <p class="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Necesitas 3 créditos para un <span class="text-secondary">Análisis Premium</span>.
                  </p>
                </div>
                <div class="flex items-center gap-4">
                  <button @click="analysisType = 'basic'"
                    class="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    Usar Rápido (1)
                  </button>
                  <NuxtLink to="/credits"
                    class="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline whitespace-nowrap">
                    Obtener más
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div v-if="analyzeError" class="mt-4 p-4 bg-risk-high/10 border border-risk-high rounded-2xl animate-shake">
              <p class="text-risk-high text-xs font-bold">{{ analyzeError }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Analyses -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white">Análisis Recientes</h2>
          <NuxtLink v-if="analyses.length > 5" to="/history"
            class="text-xs font-black text-secondary uppercase tracking-widest hover:underline">Ver Todo</NuxtLink>
        </div>

        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          <p class="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sincronizando...</p>
        </div>

        <div v-else-if="analyses.length === 0"
          class="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
          <svg class="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-slate-900 dark:text-white font-black mb-1">Aún no has analizado contratos</p>
          <p class="text-slate-500 dark:text-slate-500 text-sm font-medium">Sube tu primer documento para comenzar.</p>
        </div>

        <div v-else class="grid md:grid-cols-2 gap-4">
          <NuxtLink v-for="analysis in analyses.slice(0, 5)" :key="analysis.id" :to="`/analyze/${analysis.id}`"
            class="group p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-secondary/50 hover:shadow-premium transition-all flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div :class="[
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110',
                analysis.risk_level === 'high' ? 'bg-risk-high/10 text-risk-high' :
                  analysis.risk_level === 'medium' ? 'bg-risk-medium/10 text-risk-medium' :
                    analysis.risk_level === 'low' ? 'bg-risk-low/10 text-risk-low' : 'bg-slate-100 text-slate-400'
              ]">
                <svg v-if="analysis.status === 'completed'" class="w-7 h-7" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path v-if="analysis.risk_level === 'high'" stroke-linecap="round" stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  <path v-else-if="analysis.risk_level === 'medium'" stroke-linecap="round" stroke-linejoin="round"
                    stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span v-else-if="analysis.status === 'processing'"
                  class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></span>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3
                  class="font-black text-slate-900 dark:text-white group-hover:text-secondary transition-colors line-clamp-1">
                  {{ analysis.contract_name }}</h3>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{
                    formatDate(analysis.created_at) }}</span>
                  <span class="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                  <span :class="[
                    'text-[9px] font-black uppercase tracking-tighter',
                    analysis.status === 'completed' ? (analysis.risk_level === 'high' ? 'text-risk-high' : analysis.risk_level === 'medium' ? 'text-risk-medium' : 'text-risk-low') : 'text-slate-400'
                  ]">
                    {{ analysis.status === 'completed' ? (analysis.risk_level === 'high' ? 'Alto Riesgo' :
                      analysis.risk_level === 'medium' ? 'Cautela' : 'Seguro') : (analysis.status === 'processing' ?
                        'Analizando' : 'Pendiente') }}
                  </span>
                </div>
              </div>
            </div>
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-slate-200 group-hover:text-secondary group-hover:bg-secondary/10 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Analysis } from '~/types'

definePageMeta({
  middleware: 'auth',
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const userProfile = ref<any>(null)
const sharedCredits = useCreditsState()
const analyses = ref<Analysis[]>([])
const loading = ref(true)

const selectedFile = ref<File | null>(null)
const contractName = ref('')
const analysisType = ref<'basic' | 'premium'>('premium')
const analyzing = ref(false)
const analyzeError = ref('')

const analyzeButtonText = computed(() => {
  if (analyzing.value) return 'Procesando...'
  return analysisType.value === 'premium' ? 'Análisis Completo' : 'Análisis Rápido'
})

const needsCredits = computed(() => (sharedCredits.value || 0) === 0)
const needsMoreForPremium = computed(() =>
  analysisType.value === 'premium' &&
  (sharedCredits.value || 0) > 0 &&
  (sharedCredits.value || 0) < 3
)

// Chart Logic
const riskDistribution = computed(() => {
  const counts = { high: 0, medium: 0, low: 0 }
  analyses.value.forEach(a => {
    if (a.status === 'completed' && a.risk_level) {
      counts[a.risk_level as keyof typeof counts]++
    }
  })
  return [
    { level: 'high', label: 'Riesgo Alto', count: counts.high, color: 'bg-risk-high', stroke: '#ef4444' },
    { level: 'medium', label: 'Precaución', count: counts.medium, color: 'bg-risk-medium', stroke: '#f59e0b' },
    { level: 'low', label: 'Seguro', count: counts.low, color: 'bg-risk-low', stroke: '#10b981' },
  ]
})

const chartSegments = computed(() => {
  const total = riskDistribution.value.reduce((acc, curr) => acc + curr.count, 0)
  if (total === 0) return [{ stroke: '#cbd5e1', length: 251.2, offset: 0 }]

  let currentOffset = 0
  return riskDistribution.value.map(risk => {
    const length = (risk.count / total) * 251.2
    const segment = {
      stroke: risk.stroke,
      length,
      offset: currentOffset
    }
    currentOffset += length
    return segment
  })
})

// Auto-switch to basic if they only have 1 credit
watch(() => sharedCredits.value, (newCredits) => {
  if (newCredits === 1 && analysisType.value === 'premium') {
    analysisType.value = 'basic'
  }
}, { immediate: true })

// Fetch user data
const fetchUserData = async () => {
  if (!user.value?.id) return

  loading.value = true

  try {
    // Fetch user profile via shared composable (updates state)
    const profile = await fetchUserProfile()
    if (profile) {
      userProfile.value = profile
    }

    // Fetch analyses (keep via Supabase client for list or move to API if preferred, keeping as is for now)
    const { data: analysesData, error: analysesError } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (analysesError) {
      console.error('Error analyses:', analysesError)
    }

    analyses.value = analysesData || []
  } catch (error) {
    console.error('Error fetching user data:', error)
  } finally {
    loading.value = false
  }
}

// Realtime subscription
let realtimeChannel: any = null

const setupRealtimeSubscription = () => {
  if (realtimeChannel || !user.value?.id) return

  realtimeChannel = supabase
    .channel('analyses-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'analyses',
        filter: `user_id=eq.${user.value.id}`
      },
      async (payload) => {
        const updatedAnalysis = payload.new as Analysis
        console.log('Realtime update received:', updatedAnalysis)

        // Find and update the analysis in the list
        const index = analyses.value.findIndex(a => a.id === updatedAnalysis.id)
        if (index !== -1) {
          analyses.value[index] = updatedAnalysis
        } else {
          // If not in our current page list, we could choose to add it or ignore
          // Unshift if it's new (though we usually handle insertions manually or on refresh)
          analyses.value.unshift(updatedAnalysis)
        }

        // If job completed or failed, refresh user profile to ensure credits are correct
        if (updatedAnalysis.status === 'completed' || updatedAnalysis.status === 'failed') {
          await fetchUserProfile()
        }
      }
    )
    .subscribe()
}

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
})

// Watch for user changes to fetch data and setup realtime
watch(() => user.value, (newUser) => {
  if (newUser?.id) {
    fetchUserData()
    setupRealtimeSubscription()
  }
}, { immediate: true })

// Removed onMounted since watcher handles immediate check

// Removed onMounted since watcher handles immediate check

const lastAnalysisDate = computed(() => {
  const firstAnalysis = analyses.value[0]
  if (!firstAnalysis) return 'Ninguno'

  const lastDate = new Date(firstAnalysis.created_at)
  const now = new Date()
  const diffMs = now.getTime() - lastDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`

  return formatDate(firstAnalysis.created_at)
})

const totalCriticalFindings = computed(() => {
  return analyses.value.reduce((acc, a) => {
    return acc + (a.summary_json?.metricas?.total_rojas || 0)
  }, 0)
})

const safetyScore = computed(() => {
  if (analyses.value.length === 0) return 0
  const completed = analyses.value.filter(a => a.status === 'completed')
  if (completed.length === 0) return 100

  const weights = { low: 100, medium: 50, high: 0 }
  const sum = completed.reduce((acc, a) => {
    const level = (a.risk_level as 'low' | 'medium' | 'high') || 'low'
    return acc + weights[level]
  }, 0)
  return Math.round(sum / completed.length)
})

const monthlyActivity = computed(() => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return analyses.value.filter(a => new Date(a.created_at) >= thirtyDaysAgo).length
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const handleDropzoneError = (message: string) => {
  analyzeError.value = message
}

const handleAnalyze = async () => {
  if (!selectedFile.value || !contractName.value) return

  analyzing.value = true
  analyzeError.value = ''

  try {
    // Upload file
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const uploadResponse = await $fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!uploadResponse.success || !uploadResponse.file_url) {
      throw new Error(uploadResponse.error || 'Error al subir archivo')
    }

    // Analyze contract
    const analyzeResponse = await $fetch<{ success: boolean, analysisId: string, error?: string }>('/api/analyze', {
      method: 'POST',
      body: {
        file_url: uploadResponse.file_url,
        contract_name: contractName.value,
        analysis_type: analysisType.value,
      },
    })

    if (!analyzeResponse.success || !analyzeResponse.analysisId) {
      throw new Error(analyzeResponse.error || 'Error al iniciar análisis')
    }

    // Add as a placeholder to the list and let polling handle the rest
    const newAnalysis: any = {
      id: analyzeResponse.analysisId,
      contract_name: contractName.value,
      status: 'pending',
      created_at: new Date().toISOString(),
      risk_level: null,
      summary_json: null
    }

    analyses.value.unshift(newAnalysis)

    // Clear form
    selectedFile.value = null
    contractName.value = ''

    // Refresh profile state
    await fetchUserProfile()

  } catch (error: any) {
    analyzeError.value = error.message || 'Ocurrió un error durante el análisis'
  } finally {
    analyzing.value = false
  }
}



useHead({
  title: 'Dashboard',
})
</script>
