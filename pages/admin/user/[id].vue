<script setup lang="ts">
definePageMeta({ middleware: ['admin'], layout: 'default' })

const route = useRoute()
const id = route.params.id as string
const profile = ref<any>(null)
const analyses = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await $fetch(`/api/admin/user/${id}`)
    profile.value = res.profile
    analyses.value = res.analyses || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-12 px-6">
    <NuxtLink to="/admin/analytics" class="text-sm text-slate-500">&larr; Volver</NuxtLink>
    <div class="mt-4">
      <h2 class="text-2xl font-black">Usuario: {{ profile?.email }}</h2>
      <p class="text-sm text-slate-400">Credits: {{ profile?.credits ?? '-' }}</p>
    </div>

    <div class="mt-8">
      <h3 class="font-bold mb-2">Análisis</h3>
      <div v-if="loading">Cargando...</div>
      <div v-else>
        <div v-if="analyses.length === 0" class="text-slate-400">No hay análisis.</div>
        <div v-for="a in analyses" :key="a.id" class="p-4 mb-3 bg-white dark:bg-slate-900 rounded-lg border">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-mono text-xs text-slate-500">ID: {{ a.id }}</div>
              <div class="font-bold">Estado: {{ a.status }}</div>
              <div class="text-sm text-slate-400">Riesgo: {{ a.risk_level }}</div>
            </div>
            <div class="text-xs text-slate-400">{{ new Date(a.created_at).toLocaleString() }}</div>
          </div>
          <pre class="mt-3 text-xs font-mono text-slate-400 overflow-auto" v-if="a.summary_json">{{ JSON.stringify(a.summary_json, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
