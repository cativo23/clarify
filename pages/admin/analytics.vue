<script setup lang="ts">
definePageMeta({ middleware: ['admin'], layout: 'default' })

const users = ref<any[]>([])
const loading = ref(true)
const pricing = ref<any[]>([])
const estimates = ref<Record<string, number>>({})
const error = ref('')

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: any = null

// Computed metrics
const totalUsers = computed(() => users.value.length)
const totalAnalyses = computed(() => users.value.reduce((sum, u) => sum + (u.analyses_count || 0), 0))
const totalCreditsInCirculation = computed(() => users.value.reduce((sum, u) => sum + (u.credits || 0), 0))
const avgAnalysesPerUser = computed(() => totalUsers.value > 0 ? (totalAnalyses.value / totalUsers.value).toFixed(1) : '0')

const loadData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const [uRes, pRes] = await Promise.all([
      $fetch('/api/admin/users'),
      $fetch('/api/admin/pricing')
    ]) as [any, any]
    users.value = uRes.users || []
    pricing.value = pRes.pricing || []
    await nextTick()
    renderChart()
  } catch (e: any) {
    console.error('Failed to load admin data', e)
    error.value = e.message || 'Failed to load admin data'
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })

const renderChart = async () => {
  if (!chartRef.value) return
  try {
    const Chart = (await import('chart.js/auto')).default
    if (chartInstance) {
      chartInstance.destroy()
    }
    const ctx = chartRef.value.getContext('2d')
    if (!ctx) return
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: users.value.map(u => u.email?.split('@')[0] || 'User'),
        datasets: [{
          label: 'Analyses Count',
          data: users.value.map(u => u.analyses_count || 0),
          backgroundColor: '#f59e0b',
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    })
  } catch (err) {
    console.warn('Chart.js not available; skip chart render', err)
  }
}

const estimateUserCost = async (userId: string) => {
  if (estimates.value[userId] !== undefined) return
  
  try {
    const res = await $fetch(`/api/admin/user/${userId}`) as any
    const analyses = res.analyses || []
    // fetch prompt config to know fallback models
    const promptConfig = await $fetch('/api/admin/config') as any
    let total = 0
    
    for (const a of analyses) {
      const summary = a.summary_json || {}
      const debug = summary?._debug || {}
      if (!debug.usage) {
        // Skip if no usage data
        continue
      }
      const input = debug.usage.input_tokens || debug.usage.prompt_tokens || debug.usage.total_input_tokens || debug.usage.tokens_in || debug.usage.input || debug.usage.prompt || 0
      const output = debug.usage.output_tokens || debug.usage.completion_tokens || debug.usage.total_output_tokens || debug.usage.tokens_out || debug.usage.output || 0
      const model = debug.model_used || promptConfig?.tiers?.premium?.model || 'gpt-5-mini'
      const priceRow = pricing.value.find((p: any) => p.model === model) || pricing.value[0]
      const inputCost = (priceRow?.input_cost || 0)
      const outputCost = (priceRow?.output_cost || 0)
      total += (input * Number(inputCost) + output * Number(outputCost))
    }
    estimates.value = { ...estimates.value, [userId]: total }
  } catch (err) {
    console.error('Estimate failed', err)
    estimates.value = { ...estimates.value, [userId]: -1 }
  }
}

const formatCurrency = (value: number) => {
  if (value < 0) return 'Error'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  }).format(value)
}

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('en-US').format(value)
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-slate-900 dark:text-white mb-2">Admin Analytics</h1>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400">Platform overview and user metrics</p>
        </div>
        <NuxtLink to="/admin/config"
          class="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98]">
          Config
        </NuxtLink>
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

      <!-- Dashboard Content -->
      <div v-else>
        <!-- Metrics Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Users</span>
            </div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">{{ formatNumber(totalUsers) }}</p>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-accent-indigo/10 rounded-xl flex items-center justify-center text-accent-indigo">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Analyses</span>
            </div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">{{ formatNumber(totalAnalyses) }}</p>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-risk-low/10 rounded-xl flex items-center justify-center text-risk-low">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" />
                </svg>
              </div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credits Active</span>
            </div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">{{ formatNumber(totalCreditsInCirculation) }}</p>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-soft">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg / User</span>
            </div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">{{ avgAnalysesPerUser }}</p>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid lg:grid-cols-3 gap-6 mb-8">
          <!-- Analyses Chart -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium">
            <h2 class="text-xl font-black text-slate-900 dark:text-white mb-2">Analyses by User</h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Distribution of contract analyses across all users</p>
            <div class="h-64">
              <canvas ref="chartRef"></canvas>
            </div>
          </div>

          <!-- Pricing Snapshot -->
          <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium">
            <h2 class="text-xl font-black text-slate-900 dark:text-white mb-2">Pricing Models</h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Current AI model pricing</p>
            
            <div v-if="pricing.length === 0" class="text-center py-8">
              <p class="text-slate-400 text-sm font-bold">No pricing data available</p>
            </div>
            
            <div v-else class="space-y-3">
              <div v-for="p in pricing" :key="p.model" 
                class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <p class="font-black text-slate-900 dark:text-white text-sm mb-2">{{ p.model }}</p>
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-500">Input:</span>
                  <span class="font-mono font-black text-slate-900 dark:text-white">${{ Number(p.input_cost).toFixed(6) }}</span>
                </div>
                <div class="flex items-center justify-between text-xs mt-1">
                  <span class="font-bold text-slate-500">Output:</span>
                  <span class="font-mono font-black text-slate-900 dark:text-white">${{ Number(p.output_cost).toFixed(6) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
          <h2 class="text-xl font-black text-slate-900 dark:text-white mb-6">User Details</h2>
          
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th class="px-4 py-3 text-left">User</th>
                  <th class="px-4 py-3 text-right">Credits</th>
                  <th class="px-4 py-3 text-right">Analyses</th>
                  <th class="px-4 py-3 text-left">Last Activity</th>
                  <th class="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id" 
                  class="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td class="px-4 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-gradient-to-br from-secondary to-accent-indigo rounded-xl flex items-center justify-center text-white font-black">
                        {{ u.email?.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-black text-slate-900 dark:text-white text-sm">{{ u.email }}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: {{ u.id.slice(0, 8) }}...</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-4 text-right">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-black">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" />
                      </svg>
                      {{ formatNumber(u.credits) }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-right">
                    <span class="font-mono font-black text-slate-900 dark:text-white">{{ formatNumber(u.analyses_count) }}</span>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-xs font-bold text-slate-500">{{ formatDate(u.last_analysis_at) }}</span>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <NuxtLink :to="`/admin/user/${u.id}`"
                        class="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all">
                        View
                      </NuxtLink>
                      <button @click.prevent="estimateUserCost(u.id)" 
                        class="px-4 py-2 bg-secondary/10 text-secondary rounded-lg font-black text-xs uppercase tracking-widest hover:bg-secondary hover:text-white transition-all">
                        Cost
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cost Estimates Panel -->
          <div v-if="Object.keys(estimates).length > 0" 
            class="mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h3 class="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Cost Estimates</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="(estimate, userId) in estimates" :key="userId"
                class="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User {{ userId.slice(0, 8) }}</p>
                <p v-if="estimate === -1" class="text-risk-high font-black">Estimation Error</p>
                <p v-else class="text-2xl font-black text-slate-900 dark:text-white">{{ formatCurrency(estimate) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
