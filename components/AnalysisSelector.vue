<template>
  <div class="grid md:grid-cols-2 gap-4">
    <!-- Basic Analysis Card -->
    <div
      :class="[
        'relative p-6 rounded-3xl border-2 transition-all cursor-pointer group',
        modelValue === 'basic'
          ? 'border-secondary bg-secondary/5 ring-4 ring-secondary/10'
          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700',
      ]"
      @click="$emit('update:modelValue', 'basic')"
    >
      <div class="flex items-center justify-between mb-4">
        <div
          :class="[
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
            modelValue === 'basic'
              ? 'bg-secondary text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
          ]"
        >
          <ZapIcon class="w-6 h-6" />
        </div>
        <span
          class="text-xs font-black uppercase tracking-widest text-slate-400"
          >1 Crédito</span
        >
      </div>

      <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">
        Análisis Rápido
      </h3>
      <p
        class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4"
      >
        "Solo quiero saber si hay algo peligroso". Ideal para escaneos rápidos y
        alertas rojas.
      </p>

      <ul class="space-y-2">
        <li
          class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <CheckIcon class="w-4 h-4 text-secondary" /> Top 5 riesgos críticos
        </li>
        <li
          class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <CheckIcon class="w-4 h-4 text-secondary" /> Veredicto accionable
        </li>
      </ul>

      <div
        v-if="modelValue === 'basic'"
        class="absolute -top-2 -right-2 bg-secondary text-white p-1 rounded-full shadow-lg"
      >
        <CheckIcon class="w-4 h-4" />
      </div>
    </div>

    <!-- Premium Analysis Card -->
    <div
      :class="[
        'relative p-6 rounded-3xl border-2 transition-all group',
        hasCreditsForPremium
          ? 'cursor-pointer'
          : 'opacity-60 grayscale cursor-not-allowed',
        modelValue === 'premium'
          ? 'border-secondary bg-secondary/5 ring-4 ring-secondary/10'
          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700',
      ]"
      @click="
        hasCreditsForPremium ? $emit('update:modelValue', 'premium') : null
      "
    >
      <div
        v-if="hasCreditsForPremium"
        class="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-glow"
      >
        Recomendado
      </div>

      <div class="flex items-center justify-between mb-4">
        <div
          :class="[
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
            modelValue === 'premium'
              ? 'bg-secondary text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
          ]"
        >
          <SearchIcon class="w-6 h-6" />
        </div>
        <div class="text-right">
          <span
            class="block text-xs font-black uppercase tracking-widest text-slate-400"
            >3 Créditos</span
          >
          <span
            v-if="!hasCreditsForPremium"
            class="text-[10px] text-risk-high font-bold"
            >Faltan créditos</span
          >
        </div>
      </div>

      <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">
        Auditoría Completa
      </h3>
      <p
        class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4"
      >
        "Voy a firmar o negociar". Revisa TODO el contrato, lo obvio y lo que
        está escondido.
      </p>

      <ul class="space-y-2">
        <li
          class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <CheckIcon class="w-4 h-4 text-secondary" /> 95%+ Cobertura total
        </li>
        <li
          class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <CheckIcon class="w-4 h-4 text-secondary" /> Estrategia de negociación
        </li>
      </ul>

      <div
        v-if="modelValue === 'premium'"
        class="absolute -top-2 -right-2 bg-secondary text-white p-1 rounded-full shadow-lg"
      >
        <CheckIcon class="w-4 h-4" />
      </div>
    </div>
  </div>

  <!-- Tier Comparison Table -->
  <div
    class="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800"
  >
    <h4
      class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6 text-center"
    >
      Comparativa de Niveles
    </h4>
    <div class="grid grid-cols-3 gap-4 text-center">
      <!-- Basic Column -->
      <div class="space-y-2">
        <div
          class="w-10 h-10 mx-auto rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500"
        >
          <ZapIcon class="w-5 h-5" />
        </div>
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300">
          Básico
        </p>
        <p class="text-[10px] text-slate-400">~8K tokens</p>
        <p class="text-[9px] font-black text-slate-500 uppercase">1 crédito</p>
      </div>
      <!-- Premium Column -->
      <div
        class="border-x border-slate-200 dark:border-slate-700 px-4 space-y-2"
      >
        <div
          class="w-10 h-10 mx-auto rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"
        >
          <SearchIcon class="w-5 h-5" />
        </div>
        <p class="text-xs font-bold text-secondary">Premium</p>
        <p class="text-[10px] text-slate-400">~35K tokens</p>
        <p class="text-[9px] font-black text-secondary uppercase">3 créditos</p>
      </div>
      <!-- Forensic Column -->
      <div class="space-y-2">
        <div
          class="w-10 h-10 mx-auto rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500"
        >
          <ShieldCheckIcon class="w-5 h-5" />
        </div>
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300">
          Forensic
        </p>
        <p class="text-[10px] text-slate-400">~120K tokens</p>
        <p class="text-[9px] font-black text-slate-500 uppercase">
          10 créditos
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ZapIcon,
  SearchIcon,
  CheckIcon,
  ShieldCheckIcon,
} from "lucide-vue-next";

const props = defineProps<{
  modelValue: "basic" | "premium";
  userCredits: number;
}>();

defineEmits(["update:modelValue"]);

const hasCreditsForPremium = computed(() => props.userCredits >= 3);
</script>
