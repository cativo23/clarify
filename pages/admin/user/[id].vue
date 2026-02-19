<script setup lang="ts">
definePageMeta({ middleware: ['admin'], layout: 'admin' })

import { vClickOutside } from '~/composables/useClickOutside'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const profile = ref<any>(null)
const analyses = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Computed stats
const totalAnalyses = computed(() => analyses.value.length)
const completedAnalyses = computed(() => analyses.value.filter(a => a.status === 'completed').length)
const highRiskCount = computed(() => analyses.value.filter(a => a.risk_level === 'high').length)
const mediumRiskCount = computed(() => analyses.value.filter(a => a.risk_level === 'medium').length)
const lowRiskCount = computed(() => analyses.value.filter(a => a.risk_level === 'low').length)

onMounted(async () => {
  try {
    const res = await $fetch(`/api/admin/user/${id.value}`)
    profile.value = res.profile
    analyses.value = res.analyses || []
  } catch (e: any) {
    console.error(e)
    error.value = e.message || 'Failed to load user data'
  } finally {
    loading.value = false
  }
})

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'high': return 'text-risk-high bg-risk-high/10'
    case 'medium': return 'text-risk-medium bg-risk-medium/10'
    case 'low': return 'text-risk-low bg-risk-low/10'
    default: return 'text-slate-400 bg-slate-100 dark:bg-slate-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-risk-low bg-risk-low/10'
    case 'processing': return 'text-secondary bg-secondary/10'
    case 'failed': return 'text-risk-high bg-risk-high/10'
    case 'pending': return 'text-slate-400 bg-slate-100 dark:bg-slate-800'
    default: return 'text-slate-400 bg-slate-100 dark:bg-slate-800'
  }
}

const backToAnalytics = () => {
  router.push('/admin/analytics')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-2">
          <button @click="backToAnalytics"
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-sm font-bold text-slate-400">Detalles de Usuario</span>
        </div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white">{{ profile?.email }}</h1>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
        <p class="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 bg-risk-high/10 border border-risk-high rounded-2xl text-center">
        <p class="text-risk-high font-bold">{{ error }}</p>
      </div>

      <!-- Content -->
      <div v-else-if="profile" class="space-y-8">
        <!-- User Profile Card -->
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium">
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 bg-gradient-to-br from-secondary to-accent-indigo rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
              {{ profile.email?.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-2">{{ profile.email }}</h2>
              <div class="flex items-center gap-4">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {{ profile.id }}</span>
                <span class="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined {{ formatDate(profile.created_at) }}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="flex items-center gap-2 justify-end mb-2">
                <svg class="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" />
                </svg>
                <span class="text-3xl font-black text-slate-900 dark:text-white">{{ profile.credits ?? 0 }}</span>
              </div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Credits</p>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-accent-indigo/10 rounded-xl flex items-center justify-center text-accent-indigo">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
            </div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">{{ totalAnalyses }}</p>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-risk-low/10 rounded-xl flex items-center justify-center text-risk-low">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
            </div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">{{ completedAnalyses }}</p>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-risk-high/10 rounded-xl flex items-center justify-center text-risk-high">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Risk</span>
            </div>
            <p class="text-3xl font-black text-risk-high">{{ highRiskCount }}</p>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medium Risk</span>
            </div>
            <p class="text-3xl font-black text-amber-500">{{ mediumRiskCount }}</p>
          </div>
        </div>

        <!-- Analyses Table -->
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-black text-slate-900 dark:text-white">Analysis History</h3>
              <p class="text-sm font-bold text-slate-500 dark:text-slate-400">All contract analyses for this user</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low: {{ lowRiskCount }}</span>
              <span class="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Med: {{ mediumRiskCount }}</span>
              <span class="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">High: {{ highRiskCount }}</span>
            </div>
          </div>

          <div v-if="analyses.length === 0" class="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <svg class="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-slate-900 dark:text-white font-black mb-1">No analyses yet</p>
            <p class="text-slate-500 dark:text-slate-500 text-sm font-medium">This user hasn't analyzed any contracts.</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="a in analyses" :key="a.id"
              class="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-secondary/30 transition-all">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div class="flex items-center gap-3">
                  <NuxtLink :to="`/analyze/${a.id}`"
                    :class="['w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105', getRiskColor(a.risk_level)]">
                    <svg v-if="a.status === 'completed'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path v-if="a.risk_level === 'high'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      <path v-else-if="a.risk_level === 'medium'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span v-else class="text-xs font-black uppercase">{{ a.status }}</span>
                  </NuxtLink>
                  <div>
                    <div class="flex items-center gap-2">
                      <span :class="['px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider', getStatusColor(a.status)]">
                        {{ a.status }}
                      </span>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ formatDate(a.created_at) }}</span>
                    </div>
                    <p class="text-[10px] font-mono text-slate-500 mt-1">ID: {{ a.id }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span :class="['px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest', getRiskColor(a.risk_level)]">
                    {{ a.risk_level || 'N/A' }} Risk
                  </span>
                </div>
              </div>

              <!-- Summary JSON (Collapsible) -->
              <details class="group">
                <summary class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400 hover:text-secondary transition-colors">
                  <svg class="w-4 h-4 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  View Analysis Details
                </summary>
                <pre class="mt-3 p-4 bg-slate-900 dark:bg-slate-950 rounded-xl overflow-auto text-xs font-mono text-slate-300 max-h-96">{{ JSON.stringify(a.summary_json, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
