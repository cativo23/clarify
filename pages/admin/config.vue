<script setup lang="ts">
definePageMeta({
    middleware: ['admin'],
    layout: 'admin'
})

const config = ref<any>({
    promptVersion: 'v2',
    tiers: {
        basic: { model: '', credits: 1, tokenLimits: { input: 8000, output: 2500 } },
        premium: { model: '', credits: 3, tokenLimits: { input: 35000, output: 10000 } },
        forensic: { model: '', credits: 10, tokenLimits: { input: 120000, output: 30000 } },
    },
    features: {
        preprocessing: true,
        tokenDebug: false
    }
})

const loading = ref(true)
const saving = ref(false)
const message = ref('')

// Fetch Config
onMounted(async () => {
    try {
        const data = await $fetch('/api/admin/config') as any
        // Map legacy shape if present
        if (data && data.models) {
            config.value = {
                promptVersion: data.promptVersion || 'v2',
                tiers: {
                    basic: { model: data.models.basic || '', credits: 1, tokenLimits: data.tokenLimits?.basic || { input: 8000, output: 2500 } },
                    premium: { model: data.models.premium || '', credits: 3, tokenLimits: data.tokenLimits?.premium || { input: 35000, output: 10000 } },
                    forensic: { model: 'gpt-5', credits: 10, tokenLimits: { input: 120000, output: 30000 } },
                },
                features: data.features || { preprocessing: true, tokenDebug: false }
            }
        } else {
            config.value = data
        }
    } catch (e: any) {
        message.value = 'Error loading config: ' + e.message
    } finally {
        loading.value = false
    }
})

// Save Config
const saveConfig = async () => {
    saving.value = true
    message.value = ''
    try {
        await $fetch('/api/admin/config', {
            method: 'POST',
            body: config.value
        })
        message.value = 'Configuration saved successfully!'
        
        // Refresh to ensure we have canonical state (map legacy if needed)
        const data = await $fetch('/api/admin/config') as any
        if (data && data.models) {
            config.value = {
                promptVersion: data.promptVersion || 'v2',
                tiers: {
                    basic: { model: data.models.basic || '', credits: 1, tokenLimits: data.tokenLimits?.basic || { input: 8000, output: 2500 } },
                    premium: { model: data.models.premium || '', credits: 3, tokenLimits: data.tokenLimits?.premium || { input: 35000, output: 10000 } },
                    forensic: { model: 'gpt-5', credits: 10, tokenLimits: { input: 120000, output: 30000 } },
                },
                features: data.features || { preprocessing: true, tokenDebug: false }
            }
        } else {
            config.value = data
        }
    } catch (e: any) {
        message.value = 'Error saving config: ' + e.message
    } finally {
        saving.value = false
    }
}

// Available Models List
const availableModels = [
    { id: 'gpt-5.2', name: 'GPT-5.2 (Pro)', type: 'reasoning' },
    { id: 'gpt-5.1', name: 'GPT-5.1 (Latest)', type: 'standard' },
    { id: 'gpt-5', name: 'GPT-5 (Standard)', type: 'standard' },
    { id: 'gpt-5-mini', name: 'GPT-5 mini', type: 'standard' },
    { id: 'o3', name: 'o3 (Reasoning)', type: 'reasoning' },
    { id: 'o3-mini', name: 'o3-mini', type: 'reasoning' },
    { id: 'o1', name: 'o1 (Reasoning)', type: 'reasoning' },
    { id: 'o1-mini', name: 'o1-mini', type: 'reasoning' },
    { id: 'gpt-4o', name: 'GPT-4o', type: 'legacy' },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', type: 'legacy' },
    { id: 'gpt-4.1', name: 'GPT-4.1', type: 'legacy' },
]

const searchBasic = ref('')
const searchPremium = ref('')
const searchForensic = ref('')
const showDropdownBasic = ref(false)
const showDropdownPremium = ref(false)
const showDropdownForensic = ref(false)

const filteredModelsBasic = computed(() => {
    return availableModels.filter(m => 
        m.name.toLowerCase().includes(searchBasic.value.toLowerCase()) ||
        m.id.toLowerCase().includes(searchBasic.value.toLowerCase())
    )
})

const filteredModelsPremium = computed(() => {
    return availableModels.filter(m => 
        m.name.toLowerCase().includes(searchPremium.value.toLowerCase()) ||
        m.id.toLowerCase().includes(searchPremium.value.toLowerCase())
    )
})

const filteredModelsForensic = computed(() => {
    return availableModels.filter(m => 
        m.name.toLowerCase().includes(searchForensic.value.toLowerCase()) ||
        m.id.toLowerCase().includes(searchForensic.value.toLowerCase())
    )
})

const selectModel = (plan: 'basic' | 'premium' | 'forensic', modelId: string) => {
    config.value.tiers[plan].model = modelId
    if (plan === 'basic') {
        showDropdownBasic.value = false
        searchBasic.value = ''
    } else if (plan === 'premium') {
        showDropdownPremium.value = false
        searchPremium.value = ''
    } else {
        showDropdownForensic.value = false
        searchForensic.value = ''
    }
}

// Click outside directive
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}
</script>

<template>
    <div class="w-full animate-slide-up">
        <!-- Header -->
        <div class="mb-12">
            <h1 class="text-4xl font-black mb-2">Configuración del Sistema</h1>
            <p class="text-slate-500 dark:text-slate-400 font-medium">Gestiona parámetros globales de la IA y límites.</p>
        </div>

            <div v-if="loading" class="py-20 text-center">
                 <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
                 <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando configuración...</p>
            </div>

            <div v-else class="space-y-8 animate-slide-up">
                <!-- System Status / Feedback -->
                <div v-if="message" 
                    :class="['p-4 rounded-2xl border flex items-center gap-3', message.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500']">
                    <span class="text-xl">{{ message.includes('Error') ? '🚨' : '✅' }}</span>
                    <span class="font-bold text-sm">{{ message }}</span>
                </div>

                <!-- Prompt Version -->
                <section class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-premium border border-slate-100 dark:border-slate-800">
                    <div class="flex items-start justify-between mb-6">
                         <div>
                            <h2 class="text-xl font-black mb-1">Versión de Prompts</h2>
                            <p class="text-slate-500 text-sm font-medium">Controla qué versión de instrucciones utiliza la IA.</p>
                         </div>
                         <span class="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black uppercase rounded-lg">Critical</span>
                    </div>
                   
                    <div class="grid md:grid-cols-2 gap-4">
                        <label :class="['cursor-pointer lg:col-span-1 p-4 rounded-2xl border-2 transition-all flex items-center gap-4', config.promptVersion === 'v1' ? 'border-secondary bg-secondary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300']">
                            <input type="radio" v-model="config.promptVersion" value="v1" class="hidden">
                            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="config.promptVersion === 'v1' ? 'border-secondary' : 'border-slate-400'">
                                <div v-if="config.promptVersion === 'v1'" class="w-2.5 h-2.5 bg-secondary rounded-full"></div>
                            </div>
                            <div>
                                <span class="block font-black text-sm">v1 (Legacy)</span>
                                <span class="text-xs text-slate-500">Antigua estructura. No recomendado.</span>
                            </div>
                        </label>

                        <label :class="['cursor-pointer lg:col-span-1 p-4 rounded-2xl border-2 transition-all flex items-center gap-4', config.promptVersion === 'v2' ? 'border-secondary bg-secondary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300']">
                             <input type="radio" v-model="config.promptVersion" value="v2" class="hidden">
                            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="config.promptVersion === 'v2' ? 'border-secondary' : 'border-slate-400'">
                                <div v-if="config.promptVersion === 'v2'" class="w-2.5 h-2.5 bg-secondary rounded-full"></div>
                            </div>
                            <div>
                                <span class="block font-black text-sm">v2 (Optimized)</span>
                                <span class="text-xs text-slate-500">Formato JSON estricto y depuración.</span>
                            </div>
                        </label>
                    </div>
                </section>

                <!-- Configuration Grid -->
                <div class="grid lg:grid-cols-2 gap-8">
                    <!-- Models -->
                    <section class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-premium border border-slate-100 dark:border-slate-800">
                        <h2 class="text-xl font-black mb-6 flex items-center gap-2">
                            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            Modelos AI
                        </h2>
                        <div class="space-y-6">
                            <!-- Basic Model Dropdown -->
                            <div class="relative" v-click-outside="() => showDropdownBasic = false">
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Basic Plan Model</label>
                                <div @click="showDropdownBasic = !showDropdownBasic" 
                                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-mono text-sm cursor-pointer flex justify-between items-center group hover:border-secondary transition-all">
                                        <span :class="config.tiers?.basic?.model ? 'text-slate-900 dark:text-white' : 'text-slate-400'">
                                        {{ config.tiers?.basic?.model || 'Seleccionar modelo...' }}
                                    </span>
                                    <svg class="w-4 h-4 text-slate-400 group-hover:text-secondary transition-transform" :class="{'rotate-180': showDropdownBasic}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                                </div>
                                
                                <div v-if="showDropdownBasic" class="absolute z-20 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-2 animate-slide-up">
                                    <div class="mb-2 p-2 relative">
                                        <input v-model="searchBasic" type="text" placeholder="Buscar modelo..." 
                                               class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-8 py-2 text-xs outline-none">
                                        <svg class="w-3.5 h-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2.5" stroke-linecap="round"/></svg>
                                    </div>
                                    <div class="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                                        <button v-for="m in filteredModelsBasic" :key="m.id" 
                                            @click="selectModel('basic', m.id)"
                                            class="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group"
                                            :class="config.tiers?.basic?.model === m.id ? 'bg-secondary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'">
                                            <span>{{ m.name }}</span>
                                            <span class="text-[8px] px-1.5 py-0.5 rounded uppercase" :class="m.type === 'reasoning' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'">{{ m.id }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                             <!-- Premium Model Dropdown -->
                             <div class="relative" v-click-outside="() => showDropdownPremium = false">
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Premium Plan Model</label>
                                <div @click="showDropdownPremium = !showDropdownPremium" 
                                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-mono text-sm cursor-pointer flex justify-between items-center group hover:border-secondary transition-all">
                                    <span :class="config.tiers?.premium?.model ? 'text-slate-900 dark:text-white' : 'text-slate-400'">
                                        {{ config.tiers?.premium?.model || 'Seleccionar modelo...' }}
                                    </span>
                                    <svg class="w-4 h-4 text-slate-400 group-hover:text-secondary transition-transform" :class="{'rotate-180': showDropdownPremium}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                                </div>
                                
                                <div v-if="showDropdownPremium" class="absolute z-20 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-2 animate-slide-up">
                                    <div class="mb-2 p-2 relative">
                                        <input v-model="searchPremium" type="text" placeholder="Buscar modelo..." 
                                               class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-8 py-2 text-xs outline-none">
                                        <svg class="w-3.5 h-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2.5" stroke-linecap="round"/></svg>
                                    </div>
                                    <div class="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                                        <button v-for="m in filteredModelsPremium" :key="m.id" 
                                            @click="selectModel('premium', m.id)"
                                            class="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group"
                                            :class="config.tiers?.premium?.model === m.id ? 'bg-secondary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'">
                                            <span>{{ m.name }}</span>
                                            <span class="text-[8px] px-1.5 py-0.5 rounded uppercase" :class="m.type === 'reasoning' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'">{{ m.id }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <!-- Forensic Model Dropdown -->
                            <div class="relative" v-click-outside="() => showDropdownForensic = false">
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Forensic Plan Model</label>
                                <div @click="showDropdownForensic = !showDropdownForensic" 
                                     class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-mono text-sm cursor-pointer flex justify-between items-center group hover:border-secondary transition-all">
                                    <span :class="config.tiers?.forensic?.model ? 'text-slate-900 dark:text-white' : 'text-slate-400'">
                                        {{ config.tiers?.forensic?.model || 'Seleccionar modelo...' }}
                                    </span>
                                    <svg class="w-4 h-4 text-slate-400 group-hover:text-secondary transition-transform" :class="{'rotate-180': showDropdownForensic}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                                </div>
                                
                                <div v-if="showDropdownForensic" class="absolute z-20 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-2 animate-slide-up">
                                    <div class="mb-2 p-2 relative">
                                        <input v-model="searchForensic" type="text" placeholder="Buscar modelo..." 
                                               class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-8 py-2 text-xs outline-none">
                                    </div>
                                    <div class="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                                        <button v-for="m in filteredModelsForensic" :key="m.id" 
                                            @click="selectModel('forensic', m.id)"
                                            class="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group"
                                            :class="config.tiers?.forensic?.model === m.id ? 'bg-secondary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'">
                                            <span>{{ m.name }}</span>
                                            <span class="text-[8px] px-1.5 py-0.5 rounded uppercase" :class="m.type === 'reasoning' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'">{{ m.id }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Features -->
                     <section class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-premium border border-slate-100 dark:border-slate-800">
                        <h2 class="text-xl font-black mb-6 flex items-center gap-2">
                             <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                             Control de Funciones
                        </h2>
                        <div class="space-y-4">
                             <label class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-secondary/50 transition-all">
                                <div>
                                    <span class="block font-bold text-sm">Preprocessing Smart</span>
                                    <span class="text-xs text-slate-500">Análisis inteligente de secciones</span>
                                </div>
                                <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" v-model="config.features.preprocessing" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer text-secondary checked:right-0 right-6 checked:bg-secondary checked:border-secondary"/>
                                    <label class="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-800 cursor-pointer"></label>
                                </div>
                             </label>

                              <label class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-secondary/50 transition-all">
                                <div>
                                    <span class="block font-bold text-sm">Debug Mode</span>
                                    <span class="text-xs text-slate-500">Logs detallados de tokens y errores</span>
                                </div>
                                <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" v-model="config.features.tokenDebug" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer text-secondary checked:right-0 right-6 checked:bg-secondary checked:border-secondary"/>
                                    <label class="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 dark:bg-slate-800 cursor-pointer"></label>
                                </div>
                             </label>
                        </div>
                    </section>
                </div>

                <!-- Token Limits -->
                 <section class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-premium border border-slate-100 dark:border-slate-800">
                    <h2 class="text-xl font-black mb-6">Límites de Tokens</h2>
                         <div class="grid md:grid-cols-3 gap-8">
                         <div class="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <h3 class="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                                Basic Plan
                            </h3>
                             <div class="space-y-4">
                                    <div>
                                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credits</label>
                                        <input type="number" v-model="config.tiers.basic.credits" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Input Max</label>
                                        <input type="number" v-model="config.tiers.basic.tokenLimits.input" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                    </div>
                                     <div>
                                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Output Max</label>
                                        <input type="number" v-model="config.tiers.basic.tokenLimits.output" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                    </div>
                                </div>
                        </div>
                        
                        <div class="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <h3 class="font-black text-rose-500 mb-4 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-rose-400"></span>
                                Forensic Plan
                            </h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credits</label>
                                    <input type="number" v-model="config.tiers.forensic.credits" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Input Max</label>
                                    <input type="number" v-model="config.tiers.forensic.tokenLimits.input" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                </div>
                                 <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Output Max</label>
                                    <input type="number" v-model="config.tiers.forensic.tokenLimits.output" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                </div>
                            </div>
                        </div>

                                 <div class="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <h3 class="font-black text-secondary mb-4 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-secondary"></span>
                                Premium Plan
                            </h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Credits</label>
                                    <input type="number" v-model="config.tiers.premium.credits" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Input Max</label>
                                    <input type="number" v-model="config.tiers.premium.tokenLimits.input" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                </div>
                                 <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Output Max</label>
                                    <input type="number" v-model="config.tiers.premium.tokenLimits.output" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold">
                                </div>
                            </div>
                        </div>
                    </div>
                 </section>

                <!-- Actions -->
                <div class="flex justify-end pt-4 sticky bottom-8">
                     <button 
                        @click="saveConfig" 
                        :disabled="saving"
                        class="px-8 py-4 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-2xl font-black text-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl shadow-secondary/20">
                        <span v-if="saving" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        {{ saving ? 'Guardando...' : 'Guardar Configuración' }}
                    </button>
                </div>
        </div>
    </div>
</template>

<style scoped>
.toggle-checkbox:checked {
  right: 0;
  border-color: #8b5cf6; /* Secondary color hex approximation or use var */
}
.toggle-checkbox:checked + .toggle-label {
  background-color: #8b5cf6;
}
.toggle-checkbox {
    transition: all 0.2s ease-in-out;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
}
</style>
