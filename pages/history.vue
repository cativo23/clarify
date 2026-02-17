<template>
    <div class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <!-- Header Section -->
            <div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <NuxtLink to="/dashboard"
                        class="group flex items-center gap-2 text-slate-400 hover:text-secondary mb-4 transition-colors">
                        <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span class="text-xs font-black uppercase tracking-widest">Panel de Control</span>
                    </NuxtLink>
                    <h1 class="text-4xl font-black text-slate-900 dark:text-white mb-2">Historial de Análisis</h1>
                    <p class="text-slate-500 dark:text-slate-400 font-medium">Gestiona y revisa todos tus contratos
                        auditados.</p>
                </div>

                <!-- Search & Filters -->
                <div class="flex flex-col sm:flex-row gap-4 items-center">
                    <div class="relative w-full sm:w-64">
                        <input v-model="searchQuery" type="text" placeholder="Buscar contrato..."
                            class="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-secondary/50 focus:border-secondary text-slate-900 dark:text-white transition-all outline-none font-bold" />
                        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div
                        class="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <button v-for="filter in filters" :key="filter.id" @click="activeFilter = filter.id" :class="[
                            'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                            activeFilter === filter.id
                                ? 'bg-white dark:bg-slate-800 text-secondary shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        ]">
                            {{ filter.label }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-24">
                <div class="relative w-16 h-16">
                    <div class="absolute inset-0 border-4 border-secondary/20 rounded-full"></div>
                    <div
                        class="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin">
                    </div>
                </div>
                <p class="mt-6 text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
                    Sincronizando con la nube...</p>
            </div>

            <div v-else-if="filteredAnalyses.length === 0"
                class="text-center py-32 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <div
                    class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">No se encontraron resultados</h3>
                <p class="text-slate-500 dark:text-slate-400 font-medium mb-8">Intenta ajustar tus filtros o búsqueda.
                </p>
                <button v-if="searchQuery || activeFilter !== 'all'" @click="resetFilters"
                    class="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:scale-105 transition-all">
                    Limpiar Filtros
                </button>
            </div>

            <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NuxtLink v-for="analysis in filteredAnalyses" :key="analysis.id" :to="`/analyze/${analysis.id}`"
                    class="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 hover:border-secondary/50 hover:shadow-premium transition-all relative overflow-hidden">
                    <!-- Background Decoration -->
                    <div :class="[
                        'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity',
                        analysis.risk_level === 'high' ? 'bg-risk-high' :
                            analysis.risk_level === 'medium' ? 'bg-risk-medium' : 'bg-risk-low'
                    ]"></div>

                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-6">
                            <div :class="[
                                'w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg',
                                analysis.risk_level === 'high' ? 'bg-risk-high shadow-risk-high/20' :
                                    analysis.risk_level === 'medium' ? 'bg-risk-medium shadow-risk-medium/20' :
                                        analysis.risk_level === 'low' ? 'bg-risk-low shadow-risk-low/20' : 'bg-slate-100'
                            ]">
                                <svg v-if="analysis.status === 'completed'" class="w-7 h-7 text-white" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path v-if="analysis.risk_level === 'high'" stroke-linecap="round"
                                        stroke-linejoin="round" stroke-width="2.5"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    <path v-else-if="analysis.risk_level === 'medium'" stroke-linecap="round"
                                        stroke-linejoin="round" stroke-width="2.5"
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                                        d="M5 13l4 4L19 7" />
                                </svg>
                                <div v-else-if="analysis.status === 'processing'"
                                    class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin">
                                </div>
                                <svg v-else class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div class="text-right">
                                <span :class="[
                                    'text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg',
                                    analysis.risk_level === 'high' ? 'bg-risk-high/10 text-risk-high' :
                                        analysis.risk_level === 'medium' ? 'bg-risk-medium/10 text-risk-medium' :
                                            analysis.risk_level === 'low' ? 'bg-risk-low/10 text-risk-low' : 'bg-slate-100 text-slate-400'
                                ]">
                                    {{ getRiskLabel(analysis) }}
                                </span>
                            </div>
                        </div>

                        <h3
                            class="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-secondary transition-colors line-clamp-1">
                            {{ analysis.contract_name }}
                        </h3>

                        <div class="flex items-center gap-2 mb-6">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{
                                formatDate(analysis.created_at) }}</span>
                            <span class="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{
                                analysis.status === 'completed' ? 'Finalizado' : 'En Cola' }}</span>
                        </div>

                        <div
                            class="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                            <span class="text-xs font-bold text-slate-500">Ver reporte completo</span>
                            <div
                                class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-secondary group-hover:text-white transition-all">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </NuxtLink>
            </div>

        </main>
    </div>
</template>

<script setup lang="ts">
import type { Analysis } from '~/types'

definePageMeta({
    middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const analyses = ref<Analysis[]>([])
const loading = ref(true)
const searchQuery = ref('')
const activeFilter = ref('all')

const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'high', label: 'Riesgo Alto' },
    { id: 'medium', label: 'Cuidado' },
    { id: 'low', label: 'Seguro' }
]

const fetchAnalyses = async () => {
    if (!user.value) return
    loading.value = true

    try {
        // [SECURITY FIX M4] Fetch analyses via API endpoint (not direct Supabase query)
        const response = await $fetch('/api/analyses')
        analyses.value = response.analyses || []
    } catch (err) {
        console.error('Error fetching analyses:', err)
        analyses.value = []
    } finally {
        loading.value = false
    }
}

const filteredAnalyses = computed(() => {
    return analyses.value.filter(a => {
        const matchesSearch = a.contract_name.toLowerCase().includes(searchQuery.value.toLowerCase())
        const matchesFilter = activeFilter.value === 'all' || a.risk_level === activeFilter.value
        return matchesSearch && matchesFilter
    })
})

const getRiskLabel = (analysis: Analysis) => {
    if (analysis.status !== 'completed') return 'Pendiente'
    switch (analysis.risk_level) {
        case 'high': return 'Alto Riesgo'
        case 'medium': return 'Precaución'
        case 'low': return 'Seguro'
        default: return 'No Evaluado'
    }
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

const resetFilters = () => {
    searchQuery.value = ''
    activeFilter.value = 'all'
}

onMounted(() => {
    fetchAnalyses()
})

useHead({
    title: 'Historial | Clarify'
})
</script>
