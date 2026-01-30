<template>
  <div class="min-h-screen bg-primary-50">
    <AppHeader />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-primary-900 mb-2">
          Bienvenido, {{ user?.email?.split('@')[0] }}
        </h1>
        <p class="text-primary-600">
          Analiza tus contratos y mantén el control de tus acuerdos legales
        </p>
      </div>

      <!-- Quick Stats -->
      <div class="grid md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-soft p-6 border border-primary-100">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-primary-600 font-medium">Total Análisis</h3>
            <div class="w-10 h-10 bg-accent-indigo/10 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-accent-indigo" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <p class="text-3xl font-bold text-primary-900">{{ analyses.length }}</p>
        </div>

        <div class="bg-white rounded-xl shadow-soft p-6 border border-primary-100">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-primary-600 font-medium">Créditos Disponibles</h3>
            <div class="w-10 h-10 bg-risk-low/10 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-risk-low" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <p class="text-3xl font-bold text-primary-900">{{ userProfile?.credits || 0 }}</p>
        </div>

        <div class="bg-white rounded-xl shadow-soft p-6 border border-primary-100">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-primary-600 font-medium">Último Análisis</h3>
            <div class="w-10 h-10 bg-risk-medium/10 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-risk-medium" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <p class="text-lg font-semibold text-primary-900">
            {{ lastAnalysisDate }}
          </p>
        </div>
      </div>

      <!-- New Analysis Section -->
      <div class="bg-white rounded-xl shadow-soft p-8 mb-8 border border-primary-100">
        <h2 class="text-2xl font-bold text-primary-900 mb-6">Nuevo Análisis</h2>
        
        <Dropzone 
          v-model="selectedFile" 
          @error="handleDropzoneError"
          class="mb-6"
        />

        <div v-if="selectedFile" class="flex gap-4">
          <input
            v-model="contractName"
            type="text"
            placeholder="Nombre del contrato (ej: Contrato de Arrendamiento)"
            class="flex-1 px-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-indigo focus:border-transparent"
          />
          <button
            @click="handleAnalyze"
            :disabled="analyzing || !contractName || (userProfile?.credits || 0) < 1"
            class="px-8 py-3 bg-accent-indigo text-white rounded-lg font-semibold hover:bg-accent-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {{ analyzing ? 'Analizando...' : 'Analizar (1 crédito)' }}
          </button>
        </div>

        <div v-if="analyzeError" class="mt-4 p-4 bg-risk-high/10 border border-risk-high rounded-lg">
          <p class="text-risk-high text-sm">{{ analyzeError }}</p>
        </div>

        <div v-if="(userProfile?.credits || 0) < 1" class="mt-4 p-4 bg-risk-medium/10 border border-risk-medium rounded-lg">
          <p class="text-risk-medium text-sm">
            No tienes créditos suficientes. 
            <NuxtLink to="/credits" class="font-semibold underline">Compra más créditos aquí</NuxtLink>
          </p>
        </div>
      </div>

      <!-- Recent Analyses -->
      <div class="bg-white rounded-xl shadow-soft p-8 border border-primary-100">
        <h2 class="text-2xl font-bold text-primary-900 mb-6">Análisis Recientes</h2>

        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-indigo"></div>
          <p class="mt-4 text-primary-600">Cargando análisis...</p>
        </div>

        <div v-else-if="analyses.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-primary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-primary-600 mb-2">No tienes análisis todavía</p>
          <p class="text-primary-500 text-sm">Sube tu primer contrato para comenzar</p>
        </div>

        <div v-else class="space-y-4">
          <NuxtLink
            v-for="analysis in analyses"
            :key="analysis.id"
            :to="`/analyze/${analysis.id}`"
            class="block p-6 border border-primary-200 rounded-lg hover:border-accent-indigo hover:shadow-soft transition-all"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-primary-900 mb-2">
                  {{ analysis.contract_name }}
                </h3>
                <p class="text-primary-600 text-sm mb-3">
                  {{ formatDate(analysis.created_at) }}
                </p>
                <div class="flex items-center gap-2">
                  <span 
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-semibold',
                      analysis.risk_level === 'high' ? 'bg-risk-high/10 text-risk-high' :
                      analysis.risk_level === 'medium' ? 'bg-risk-medium/10 text-risk-medium' :
                      'bg-risk-low/10 text-risk-low'
                    ]"
                  >
                    {{ 
                      analysis.risk_level === 'high' ? 'Riesgo Alto' :
                      analysis.risk_level === 'medium' ? 'Precaución' :
                      'Seguro'
                    }}
                  </span>
                </div>
              </div>
              <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
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
const analyses = ref<Analysis[]>([])
const loading = ref(true)

const selectedFile = ref<File | null>(null)
const contractName = ref('')
const analyzing = ref(false)
const analyzeError = ref('')

// Fetch user data
const fetchUserData = async () => {
  if (!user.value?.id) return

  loading.value = true

  try {
    // Fetch user profile via server API (handles sync automatically)
    try {
      const profile = await $fetch('/api/user/profile')
      if (profile) {
        userProfile.value = profile
      }
    } catch (e) {
      console.error('Error fetching profile API:', e)
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

// Watch for user changes to fetch data
watch(() => user.value, (newUser) => {
  if (newUser?.id) {
    fetchUserData()
  }
}, { immediate: true })

// Removed onMounted since watcher handles immediate check

// Removed onMounted since watcher handles immediate check

const lastAnalysisDate = computed(() => {
  if (analyses.value.length === 0) return 'Ninguno'
  
  const lastDate = new Date(analyses.value[0].created_at)
  const now = new Date()
  const diffMs = now.getTime() - lastDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  
  return formatDate(analyses.value[0].created_at)
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
    const analyzeResponse = await $fetch('/api/analyze', {
      method: 'POST',
      body: {
        file_url: uploadResponse.file_url,
        contract_name: contractName.value,
      },
    })

    if (!analyzeResponse.success || !analyzeResponse.analysis) {
      throw new Error(analyzeResponse.error || 'Error al analizar contrato')
    }

    // Redirect to results page
    navigateTo(`/analyze/${analyzeResponse.analysis.id}`)
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
