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
            <h2
              class="text-2xl font-black text-slate-900 dark:text-white"
            >
              Compara los Niveles de Análisis
            </h2>
            <button
              @click="close"
              class="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              <XIcon class="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <!-- Feature Comparison Table -->
          <div class="overflow-x-auto mb-8">
            <table class="w-full">
              <thead>
                <tr class="border-b-2 border-slate-200 dark:border-slate-800">
                  <th
                    class="text-left p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  >
                    Característica
                  </th>
                  <th class="text-center p-4 min-w-[140px]">
                    <span
                      class="block text-sm font-bold text-slate-700 dark:text-slate-300"
                      >Básico</span
                    >
                    <span class="block text-xs text-slate-400">1 crédito</span>
                  </th>
                  <th
                    class="text-center p-4 min-w-[140px] bg-secondary/5 border-x border-secondary/20"
                  >
                    <span class="block text-sm font-bold text-secondary"
                      >Premium</span
                    >
                    <span class="block text-xs text-slate-400">3 créditos</span>
                  </th>
                  <th class="text-center p-4 min-w-[140px]">
                    <span
                      class="block text-sm font-bold text-slate-700 dark:text-slate-300"
                      >Forensic</span
                    >
                    <span class="block text-xs text-slate-400">10 créditos</span>
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
                  <td class="text-center p-4">
                    <TokenTooltip tokenExplanation="8K tokens ≈ 2-3 páginas">
                      ~8K tokens
                    </TokenTooltip>
                  </td>
                  <td
                    class="text-center p-4 bg-secondary/5 border-x border-secondary/20"
                  >
                    <TokenTooltip tokenExplanation="35K tokens ≈ 8-10 páginas">
                      <span class="text-secondary font-bold">~35K tokens</span>
                    </TokenTooltip>
                  </td>
                  <td class="text-center p-4">
                    <TokenTooltip tokenExplanation="120K tokens ≈ 25-30 páginas">
                      ~120K tokens
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
                  <td class="text-center p-4 text-sm text-slate-600 dark:text-slate-400">
                    Top 5 riesgos
                  </td>
                  <td
                    class="text-center p-4 bg-secondary/5 border-x border-secondary/20"
                  >
                    <span class="text-secondary font-bold">95%+ total</span>
                  </td>
                  <td class="text-center p-4 text-sm text-slate-600 dark:text-slate-400">
                    100% total
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
                  <td class="text-center p-4 text-sm text-slate-600 dark:text-slate-400">
                    ~30 segundos
                  </td>
                  <td
                    class="text-center p-4 bg-secondary/5 border-x border-secondary/20"
                  >
                    <span class="text-secondary font-bold">~2 minutos</span>
                  </td>
                  <td class="text-center p-4 text-sm text-slate-600 dark:text-slate-400">
                    ~5 minutos
                  </td>
                </tr>

                <!-- Best For Row -->
                <tr>
                  <td
                    class="p-4 text-sm font-bold text-slate-700 dark:text-slate-300"
                  >
                    Ideal para
                  </td>
                  <td class="text-center p-4 text-xs text-slate-600 dark:text-slate-400">
                    Escaneos rápidos
                  </td>
                  <td
                    class="text-center p-4 bg-secondary/5 border-x border-secondary/20"
                  >
                    <span class="text-secondary text-xs font-bold"
                      >Contratos estándar</span
                    >
                  </td>
                  <td class="text-center p-4 text-xs text-slate-600 dark:text-slate-400">
                    Alto valor
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Use Cases Section -->
          <div>
            <h3
              class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6 text-center"
            >
              ¿Cuál es para ti?
            </h3>
            <div class="grid md:grid-cols-3 gap-4">
              <!-- Basic Use Case -->
              <div
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
import { XIcon, ZapIcon, SearchIcon, ShieldCheckIcon } from "lucide-vue-next";
import TokenTooltip from "./TokenTooltip.vue";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["update:isOpen"]);

const close = () => {
  emit("update:isOpen", false);
};
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
