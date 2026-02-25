<template>
  <div class="grid md:grid-cols-3 gap-4">
    <!-- Basic Analysis Card -->
    <div
      :class="[
        'relative p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer group',
        expandedTier === 'basic'
          ? 'border-secondary bg-secondary/5 ring-4 ring-secondary/10'
          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700',
      ]"
      @click="toggleTier('basic')"
    >
      <div class="flex items-center justify-between mb-4">
        <div
          :class="[
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
            expandedTier === 'basic' || modelValue === 'basic'
              ? 'bg-secondary text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
          ]"
        >
          <ZapIcon class="w-6 h-6" />
        </div>
        <div class="flex items-center gap-2">
          <!-- Selection checkbox -->
          <div
            v-if="isTierSelected('basic')"
            class="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center"
            @click.stop="toggleTier('basic')"
          >
            <CheckIcon class="w-3 h-3" />
          </div>
          <span
            class="text-xs font-black uppercase tracking-widest text-slate-400"
            >1 Crédito</span
          >
        </div>
      </div>

      <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">
        Análisis Rápido
      </h3>

      <!-- Compact view -->
      <template v-if="expandedTier !== 'basic'">
        <p
          class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4"
        >
          "Solo quiero saber si hay algo peligroso". Ideal para escaneos rápidos
          y alertas rojas.
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
      </template>

      <!-- Expanded view -->
      <template v-else>
        <p
          class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4"
        >
          Perfecto para obtener una visión general rápida. Nuestro IA escanea el
          contrato en busca de las cláusulas más peligrosas y te da un veredicto
          claro: ¿firmar o renegociar?
        </p>

        <div
          class="mb-4 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            Límite de tokens
          </p>
          <TokenTooltip tokenExplanation="8K tokens ≈ 2-3 páginas">
            <span
              class="text-sm font-bold text-slate-700 dark:text-slate-300 underline decoration-dashed decoration-secondary/50 cursor-help"
              >~8K tokens</span
            >
          </TokenTooltip>
        </div>

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
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> ~30 segundos
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> Ideal para contratos
            simples
          </li>
        </ul>
      </template>
    </div>

    <!-- Premium Analysis Card -->
    <div
      :class="[
        'relative p-6 rounded-3xl border-2 transition-all duration-300 group',
        hasCreditsForPremium
          ? 'cursor-pointer'
          : 'opacity-60 grayscale cursor-not-allowed',
        expandedTier === 'premium'
          ? 'border-secondary bg-secondary/5 ring-4 ring-secondary/10'
          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700',
      ]"
      @click="hasCreditsForPremium ? toggleTier('premium') : null"
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
            expandedTier === 'premium' || modelValue === 'premium'
              ? 'bg-secondary text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
          ]"
        >
          <SearchIcon class="w-6 h-6" />
        </div>
        <div class="flex items-center gap-2">
          <!-- Selection checkbox -->
          <div
            v-if="hasCreditsForPremium && isTierSelected('premium')"
            class="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center"
            @click.stop="toggleTier('premium')"
          >
            <CheckIcon class="w-3 h-3" />
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
      </div>

      <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">
        Auditoría Completa
      </h3>

      <!-- Compact view -->
      <template v-if="expandedTier !== 'premium'">
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
            <CheckIcon class="w-4 h-4 text-secondary" /> Estrategia de
            negociación
          </li>
        </ul>
      </template>

      <!-- Expanded view -->
      <template v-else>
        <p
          class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4"
        >
          El análisis más popular. Nuestra IA examina minuciosamente cada
          cláusula, identifica riesgos ocultos, inconsistencias y te proporciona
          una estrategia concreta de negociación.
        </p>

        <div
          class="mb-4 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            Límite de tokens
          </p>
          <TokenTooltip tokenExplanation="35K tokens ≈ 8-10 páginas">
            <span
              class="text-sm font-bold text-secondary underline decoration-dashed decoration-secondary/50 cursor-help"
              >~35K tokens</span
            >
          </TokenTooltip>
        </div>

        <ul class="space-y-2">
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> 95%+ Cobertura total
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> Estrategia de
            negociación
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> ~2 minutos
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> Mejor costo-beneficio
          </li>
        </ul>
      </template>
    </div>

    <!-- Forensic Analysis Card -->
    <div
      :class="[
        'relative p-6 rounded-3xl border-2 transition-all duration-300 group',
        hasCreditsForForensic
          ? 'cursor-pointer'
          : 'opacity-60 grayscale cursor-not-allowed',
        expandedTier === 'forensic'
          ? 'border-secondary bg-secondary/5 ring-4 ring-secondary/10'
          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700',
      ]"
      @click="hasCreditsForForensic ? toggleTier('forensic') : null"
    >
      <div
        v-if="hasCreditsForForensic"
        class="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-secondary to-accent-indigo text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-glow"
      >
        Máximo Detalle
      </div>

      <div class="flex items-center justify-between mb-4">
        <div
          :class="[
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
            expandedTier === 'forensic' || modelValue === 'forensic'
              ? 'bg-secondary text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
          ]"
        >
          <ShieldCheckIcon class="w-6 h-6" />
        </div>
        <div class="flex items-center gap-2">
          <!-- Selection checkbox -->
          <div
            v-if="hasCreditsForForensic && isTierSelected('forensic')"
            class="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center"
            @click.stop="toggleTier('forensic')"
          >
            <CheckIcon class="w-3 h-3" />
          </div>
          <div class="text-right">
            <span
              class="block text-xs font-black uppercase tracking-widest text-slate-400"
              >10 Créditos</span
            >
            <span
              v-if="!hasCreditsForForensic"
              class="text-[10px] text-risk-high font-bold"
              >Faltan créditos</span
            >
          </div>
        </div>
      </div>

      <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">
        Auditoría Forense
      </h3>

      <!-- Compact view -->
      <template v-if="expandedTier !== 'forensic'">
        <p
          class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4"
        >
          "Voy a negociar algo importante". Análisis exhaustivo de CADA
          cláusula, inconsistencias y omisiones críticas.
        </p>

        <ul class="space-y-2">
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> 100% Cobertura total
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> Análisis cruzado de
            cláusulas
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> Cláusulas sugeridas
          </li>
        </ul>
      </template>

      <!-- Expanded view -->
      <template v-else>
        <p
          class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4"
        >
          El análisis más exhaustivo disponible. Nuestra IA examina cada palabra,
          detecta inconsistencias entre cláusulas, omisiones críticas y te
          proporciona lenguaje contractual sugerido para proteger tus intereses.
        </p>

        <div
          class="mb-4 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
        >
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            Límite de tokens
          </p>
          <TokenTooltip tokenExplanation="120K tokens ≈ 25-30 páginas">
            <span
              class="text-sm font-bold text-slate-700 dark:text-slate-300 underline decoration-dashed decoration-secondary/50 cursor-help"
              >~120K tokens</span
            >
          </TokenTooltip>
        </div>

        <ul class="space-y-2">
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> 100% Cobertura total
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> Análisis cruzado de
            cláusulas
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> Cláusulas sugeridas
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> ~5 minutos
          </li>
          <li
            class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            <CheckIcon class="w-4 h-4 text-secondary" /> Para alto valor (&gt;
            $10k)
          </li>
        </ul>
      </template>
    </div>
  </div>

  <!-- Comparison Modal -->
  <TierComparisonModal
    v-model:isOpen="isComparisonModalOpen"
    :selected-tiers="selectedTiers"
  />

  <!-- Floating Compare Button -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="showCompareButton"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <button
          @click="openComparisonModal"
          class="px-8 py-4 bg-secondary text-white rounded-full font-bold text-sm shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Comparar ({{ selectedTiers.length }})
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ZapIcon,
  SearchIcon,
  CheckIcon,
  ShieldCheckIcon,
} from "lucide-vue-next";
import TokenTooltip from "./TokenTooltip.vue";
import TierComparisonModal from "./TierComparisonModal.vue";

const props = defineProps<{
  modelValue: "basic" | "premium" | "forensic";
  userCredits: number;
}>();

const emit = defineEmits(["update:modelValue"]);

const hasCreditsForPremium = computed(() => props.userCredits >= 3);
const hasCreditsForForensic = computed(() => props.userCredits >= 10);

// Single expanded tier (accordion behavior)
const expandedTier = ref<"basic" | "premium" | "forensic" | null>(null);

// Selected tiers for comparison
const selectedTiers = ref<("basic" | "premium" | "forensic")[]>([]);

// Check if a tier is selected
const isTierSelected = (tier: "basic" | "premium" | "forensic") => {
  return selectedTiers.value.includes(tier);
};

// Toggle tier selection and expansion
const toggleTier = (tier: "basic" | "premium" | "forensic") => {
  // If no credits, do nothing
  if (tier === "premium" && !hasCreditsForPremium.value) return;
  if (tier === "forensic" && !hasCreditsForForensic.value) return;

  // Toggle selection
  const index = selectedTiers.value.indexOf(tier);
  if (index > -1) {
    selectedTiers.value.splice(index, 1); // Remove from selection
  } else {
    selectedTiers.value.push(tier); // Add to selection
  }

  // Toggle expansion (accordion - only one expanded at a time)
  expandedTier.value = expandedTier.value === tier ? null : tier;

  // Emit selection for analysis
  emit("update:modelValue", tier);
};

// Comparison modal state
const isComparisonModalOpen = ref(false);

const openComparisonModal = () => {
  isComparisonModalOpen.value = true;
};

const showCompareButton = computed(() => selectedTiers.value.length >= 1);
</script>
