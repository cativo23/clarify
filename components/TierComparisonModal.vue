<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="close"
        />

        <!-- Modal Content -->
        <div
          class="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-2xl font-black text-slate-900 dark:text-white">
                Comparar Niveles de Análisis
              </h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {{ selectedTiers.length }} nivel{{ selectedTiers.length !== 1 ? 'es' : '' }} seleccionado{{ selectedTiers.length !== 1 ? 's' : '' }}
              </p>
            </div>
            <button
              @click="close"
              class="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              <XIcon class="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <!-- Feature Comparison Table -->
          <div class="overflow-visible mb-8">
            <table class="w-full">
              <thead>
                <tr class="border-b-2 border-slate-200 dark:border-slate-800">
                  <th
                    class="text-left p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  >
                    Característica
                  </th>
                  <th
                    v-for="tier in selectedTiers"
                    :key="tier"
                    class="text-center p-4 min-w-[140px]"
                    :class="{
                      'bg-secondary/5 border-x border-secondary/20': tier === 'premium',
                    }"
                  >
                    <span
                      class="block text-sm font-bold"
                      :class="getTierNameClass(tier)"
                    >
                      {{ getTierName(tier) }}
                    </span>
                    <span class="block text-xs text-slate-400">
                      {{ getTierCredits(tier) }}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Token Limit Row -->
                <tr
                  class="border-b border-slate-100 dark:border-slate-800"
                >
                  <td
                    class="p-4 text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    Límite de tokens
                  </td>
                  <td
                    v-for="tier in selectedTiers"
                    :key="tier"
                    class="text-center p-4"
                    :class="{
                      'bg-secondary/5 border-x border-secondary/20': tier === 'premium',
                    }"
                  >
                    <TokenTooltip :tokenExplanation="getTokenExplanation(tier)">
                      <span
                        v-if="tier === 'premium'"
                        class="text-secondary font-bold"
                      >
                        {{ getTokenLimit(tier) }}
                      </span>
                      <span v-else>
                        {{ getTokenLimit(tier) }}
                      </span>
                    </TokenTooltip>
                  </td>
                </tr>

                <!-- Coverage Row -->
                <tr
                  class="border-b border-slate-100 dark:border-slate-800"
                >
                  <td
                    class="p-4 text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cobertura
                  </td>
                  <td
                    v-for="tier in selectedTiers"
                    :key="tier"
                    class="text-center p-4"
                    :class="{
                      'bg-secondary/5 border-x border-secondary/20': tier === 'premium',
                    }"
                  >
                    <span
                      v-if="tier === 'premium'"
                      class="text-secondary font-bold"
                    >
                      {{ getCoverage(tier) }}
                    </span>
                    <span
                      v-else
                      class="text-sm text-slate-600 dark:text-slate-400"
                    >
                      {{ getCoverage(tier) }}
                    </span>
                  </td>
                </tr>

                <!-- Speed Row -->
                <tr
                  class="border-b border-slate-100 dark:border-slate-800"
                >
                  <td
                    class="p-4 text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    Velocidad
                  </td>
                  <td
                    v-for="tier in selectedTiers"
                    :key="tier"
                    class="text-center p-4"
                    :class="{
                      'bg-secondary/5 border-x border-secondary/20': tier === 'premium',
                    }"
                  >
                    <span
                      v-if="tier === 'premium'"
                      class="text-secondary font-bold"
                    >
                      {{ getSpeed(tier) }}
                    </span>
                    <span
                      v-else
                      class="text-sm text-slate-600 dark:text-slate-400"
                    >
                      {{ getSpeed(tier) }}
                    </span>
                  </td>
                </tr>

                <!-- Best For Row -->
                <tr>
                  <td
                    class="p-4 text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    Ideal para
                  </td>
                  <td
                    v-for="tier in selectedTiers"
                    :key="tier"
                    class="text-center p-4"
                    :class="{
                      'bg-secondary/5 border-x border-secondary/20': tier === 'premium',
                    }"
                  >
                    <span
                      v-if="tier === 'premium'"
                      class="text-secondary text-xs font-bold"
                    >
                      {{ getIdealFor(tier) }}
                    </span>
                    <span
                      v-else
                      class="text-xs text-slate-600 dark:text-slate-400"
                    >
                      {{ getIdealFor(tier) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Use Cases Section - Only show selected tiers -->
          <div v-if="selectedTiers.length > 0">
            <h3
              class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6 text-center"
            >
              ¿Cuál es para ti?
            </h3>
            <div :class="getUseCasesGridClass">
              <!-- Basic Use Case -->
              <div
                v-if="selectedTiers.includes('basic')"
                class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3"
                >
                  <ZapIcon class="w-5 h-5" />
                </div>
                <h4
                  class="text-sm font-black text-slate-500 dark:text-slate-400 uppercase mb-2"
                >
                  Mejor para Básico
                </h4>
                <p
                  class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  Contratos simples de bajo valor, querer alertas rápidas,
                  presupuestar múltiples análisis
                </p>
              </div>

              <!-- Premium Use Case -->
              <div
                v-if="selectedTiers.includes('premium')"
                class="p-5 rounded-2xl bg-secondary/5 border-2 border-secondary/20"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-3"
                >
                  <SearchIcon class="w-5 h-5" />
                </div>
                <h4
                  class="text-sm font-black text-secondary uppercase mb-2"
                >
                  Mejor para Premium
                </h4>
                <p
                  class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  Contratos estándar (arrendamientos, servicios), antes de
                  firmar, mejor relación costo-beneficio
                </p>
              </div>

              <!-- Forensic Use Case -->
              <div
                v-if="selectedTiers.includes('forensic')"
                class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3"
                >
                  <ShieldCheckIcon class="w-5 h-5" />
                </div>
                <h4
                  class="text-sm font-black text-slate-500 dark:text-slate-400 uppercase mb-2"
                >
                  Mejor para Forensic
                </h4>
                <p
                  class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  Contratos de alto valor (> $10k), propiedad intelectual,
                  acuerdos complejos, exhaustividad total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { XIcon, ZapIcon, SearchIcon, ShieldCheckIcon } from "lucide-vue-next";
import TokenTooltip from "./TokenTooltip.vue";

const props = defineProps<{
  isOpen: boolean;
  selectedTiers: ("basic" | "premium" | "forensic")[];
}>();

const emit = defineEmits(["update:isOpen"]);

const close = () => {
  emit("update:isOpen", false);
};

// Helper functions for dynamic tier data
const getTierName = (tier: "basic" | "premium" | "forensic") => {
  const names = {
    basic: "Básico",
    premium: "Premium",
    forensic: "Forensic",
  };
  return names[tier];
};

const getTierNameClass = (tier: "basic" | "premium" | "forensic") => {
  const classes = {
    basic: "text-slate-700 dark:text-slate-300",
    premium: "text-secondary",
    forensic: "text-slate-700 dark:text-slate-300",
  };
  return classes[tier];
};

const getTierCredits = (tier: "basic" | "premium" | "forensic") => {
  const credits = {
    basic: "1 crédito",
    premium: "3 créditos",
    forensic: "10 créditos",
  };
  return credits[tier];
};

const getTokenLimit = (tier: "basic" | "premium" | "forensic") => {
  const limits = {
    basic: "~8K tokens",
    premium: "~35K tokens",
    forensic: "~120K tokens",
  };
  return limits[tier];
};

const getTokenExplanation = (tier: "basic" | "premium" | "forensic") => {
  const explanations = {
    basic: "8K tokens ≈ 2-3 páginas",
    premium: "35K tokens ≈ 8-10 páginas",
    forensic: "120K tokens ≈ 25-30 páginas",
  };
  return explanations[tier];
};

const getCoverage = (tier: "basic" | "premium" | "forensic") => {
  const coverage = {
    basic: "Top 5 riesgos",
    premium: "95%+ total",
    forensic: "100% total",
  };
  return coverage[tier];
};

const getSpeed = (tier: "basic" | "premium" | "forensic") => {
  const speed = {
    basic: "~30 segundos",
    premium: "~2 minutos",
    forensic: "~5 minutos",
  };
  return speed[tier];
};

const getIdealFor = (tier: "basic" | "premium" | "forensic") => {
  const idealFor = {
    basic: "Escaneos rápidos",
    premium: "Contratos estándar",
    forensic: "Alto valor",
  };
  return idealFor[tier];
};

const getUseCasesGridClass = computed(() => {
  const count = props.selectedTiers.length;
  if (count === 1) return "grid md:grid-cols-1 max-w-md mx-auto gap-4";
  if (count === 2) return "grid md:grid-cols-2 gap-4";
  return "grid md:grid-cols-3 gap-4";
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div > div:last-child,
.modal-leave-active > div > div:last-child {
  transition: transform 0.3s ease;
}

.modal-enter-from > div > div:last-child,
.modal-leave-to > div > div:last-child {
  transform: scale(0.95) translateY(10px);
}
</style>
