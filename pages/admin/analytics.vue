<script setup lang="ts">
definePageMeta({ middleware: ['admin'], layout: 'default' })

const users = ref<any[]>([])
const loading = ref(true)
const pricing = ref<any[]>([])
const estimates = ref<Record<string, number>>({})

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: any = null

const loadData = async () => {
  try {
    const [uRes, pRes] = await Promise.all([
      $fetch('/api/admin/users'),
      $fetch('/api/admin/pricing')
    ])
    users.value = uRes.users || []
    pricing.value = pRes.pricing || []
    renderChart()
  } catch (e: any) {
    console.error('Failed to load admin data', e)
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
    chartInstance = new Chart(chartRef.value.getContext('2d'), {
      type: 'bar',
      data: {
        labels: users.value.map(u => u.email),
        datasets: [{ label: 'Analyses Count', data: users.value.map(u => u.analyses_count || 0), backgroundColor: '#f59e0b' }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    })
  } catch (err) {
    console.warn('Chart.js not available; skip chart render', err)
  }
}

function getTokenCountsFromSummary(summary: any) {
  const debug = summary?._debug || {}
  console.log('Debug info:', debug)
  if (!debug.usage) return { input: 0, output: 0 }
  const input = debug.usage.input_tokens || debug.usage.prompt_tokens || debug.usage.total_input_tokens || debug.usage.tokens_in || debug.usage.input || debug.usage.prompt || 0
  const output = debug.usage.output_tokens || debug.usage.completion_tokens || debug.usage.total_output_tokens || debug.usage.tokens_out || debug.usage.output || 0
  return { input: Number(input) || 0, output: Number(output) || 0 }
}

const estimateUserCost = async (userId: string) => {
  // If cached, return
  if (estimates.value[userId] !== undefined) return
  try {
    const res = await $fetch(`/api/admin/user/${userId}`)
    const analyses = res.analyses || []
    // fetch prompt config to know fallback models
    const promptConfig = await $fetch('/api/admin/config')
    let total = 0
    for (const a of analyses) {
      const summary = a.summary_json || {}
      const { input, output } = getTokenCountsFromSummary(summary)
      console.log(`Analysis ${a.id}: input=${input}, output=${output}`)
      const model = summary?._debug?.model || promptConfig?.tiers?.premium?.model || 'gpt-5-mini'
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
</script>

<template>
  <div class="max-w-6xl px-6 py-12 mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-black">Admin Analytics</h1>
    </div>

    <div v-if="loading" class="py-12 text-center">Cargando...</div>

    <div v-else>
      <div class="grid gap-6 mb-6 md:grid-cols-2">
        <div class="h-64 p-4 bg-white border dark:bg-slate-900 rounded-2xl">
          <canvas ref="chartRef"></canvas>
        </div>
        <div class="p-4 bg-white border dark:bg-slate-900 rounded-2xl">
          <h3 class="mb-2 font-bold">Pricing snapshot</h3>
          <div v-if="pricing.length === 0" class="text-sm text-slate-400">No pricing data available.</div>
          <div v-else class="text-sm">
            <div v-for="p in pricing" :key="p.model" class="flex justify-between py-1 border-b last:border-b-0">
              <div class="font-mono text-xs">{{ p.model }}</div>
              <div class="text-xs">in: {{ p.input_cost }} • out: {{ p.output_cost }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 overflow-x-auto bg-white border dark:bg-slate-900 rounded-2xl">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="text-xs uppercase text-slate-500">
              <th class="px-3 py-2">Email</th>
              <th class="px-3 py-2">Credits</th>
              <th class="px-3 py-2">Analyses</th>
              <th class="px-3 py-2">Last Analysis</th>
              <th class="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-t">
              <td class="px-3 py-3 font-mono text-xs">{{ u.email }}</td>
              <td class="px-3 py-3">{{ u.credits ?? '-' }}</td>
              <td class="px-3 py-3">{{ u.analyses_count ?? 0 }}</td>
              <td class="px-3 py-3">{{ u.last_analysis_at ? new Date(u.last_analysis_at).toLocaleString() : '-' }}</td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-3">
                  <NuxtLink :to="`/admin/user/${u.id}`" class="font-bold text-primary">Ver</NuxtLink>
                  <button @click.prevent="estimateUserCost(u.id)" class="px-2 py-1 text-xs rounded bg-secondary/10">Estimar costo</button>
                  <div v-if="estimates[u.id] !== undefined" class="font-mono text-xs">
                    <span v-if="estimates[u.id] === -1">Error</span>
                    <span v-else>
                      ${{ estimates[u.id].toFixed(6) }}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
