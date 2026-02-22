<template>
  <div
    class="bg-white dark:bg-slate-900 rounded-[2rem] shadow-soft hover:shadow-premium transition-all duration-300 p-8 border border-slate-100 dark:border-slate-800 group"
  >
    <!-- Risk Level Indicator -->
    <div class="flex items-center gap-6 mb-6">
      <div
        :class="[
          'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-lg',
          riskColorClasses.bg,
        ]"
      >
        <svg
          v-if="risk === 'high'"
          class="w-7 h-7 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-else-if="risk === 'medium'"
          class="w-7 h-7 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-else
          class="w-7 h-7 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <div class="flex-1">
        <h3 class="text-xl font-black text-slate-900 dark:text-white mb-1">
          {{ category }}
        </h3>
        <p
          :class="[
            'text-xs font-black uppercase tracking-widest',
            riskColorClasses.text,
          ]"
        >
          {{ riskLabel }}
        </p>
      </div>
    </div>

    <!-- Description -->
    <p class="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-lg">
      {{ description }}
    </p>

    <!-- Details (Expandable) -->
    <div
      v-if="
        props.clausula ||
        props.citaTextual ||
        props.riesgoReal ||
        props.mitigacion ||
        props.details
      "
    >
      <button
        class="flex items-center gap-2 text-secondary hover:text-emerald-500 font-bold text-sm transition-colors group/btn"
        @click="isExpanded = !isExpanded"
      >
        <span
          class="border-b-2 border-secondary/30 group-hover/btn:border-secondary transition-all"
          >{{ isExpanded ? "Ver menos" : "Ver más detalles" }}</span
        >
        <svg
          :class="[
            'w-4 h-4 transition-transform duration-500',
            isExpanded ? 'rotate-180' : '',
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        v-if="isExpanded"
        class="mt-6 p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 animate-slide-up space-y-6"
      >
        <div v-if="props.clausula">
          <span
            class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2"
            >Ubicación</span
          >
          <p class="text-sm text-slate-900 dark:text-slate-200 font-bold">
            {{ props.clausula }}
          </p>
        </div>

        <div v-if="props.riesgoReal">
          <span
            class="text-[10px] font-black text-risk-high uppercase tracking-widest block mb-2"
            >Impacto Real</span
          >
          <p class="text-sm text-slate-700 dark:text-slate-300">
            {{ props.riesgoReal }}
          </p>
        </div>

        <div v-if="props.mitigacion">
          <span
            class="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2"
            >Sugerencia de Mitigación</span
          >
          <p class="text-sm text-slate-700 dark:text-slate-300">
            {{ props.mitigacion }}
          </p>
        </div>

        <div v-if="props.citaTextual">
          <span
            class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2"
            >Referencia del Contrato</span
          >
          <div
            class="relative mt-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <svg
              class="absolute -left-2 -top-2 w-8 h-8 text-secondary/10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M14.017 21L14.017 18C14.017 16.899 14.899 16 16.017 16L19.017 16C19.562 16 20.017 15.545 20.017 15L20.017 11C20.017 10.455 19.562 10 19.017 10L15.017 10C14.472 10 14.017 9.545 14.017 9L14.017 6C14.017 5.455 14.472 5 15.017 5L18.017 5C19.135 5 20.017 5.881 20.017 7L20.017 8.5C20.017 8.776 20.241 9 20.517 9L21.517 9C21.793 9 22.017 8.776 22.017 8.5L22.017 7C22.017 4.791 20.226 3 18.017 3L15.017 3C12.808 3 11.017 4.791 11.017 7L11.017 9C11.017 11.209 12.808 13 15.017 13L19.017 13L19.017 15L16.017 15C14.363 15 13.017 16.346 13.017 18L13.017 21L14.017 21ZM4.017 21L4.017 18C4.017 16.899 4.899 16 6.017 16L9.017 16C9.562 16 10.017 15.545 10.017 15L10.017 11C10.017 10.455 9.562 10 9.017 10L5.017 10C4.472 10 4.017 9.545 4.017 9L4.017 6C4.017 5.455 4.472 5 5.017 5L8.017 5C9.135 5 10.017 5.881 10.017 7L10.017 8.5C10.017 8.776 10.241 9 10.517 9L11.517 9C11.793 9 12.017 8.776 12.017 8.5L12.017 7C12.017 4.791 10.226 3 8.017 3L5.017 3C2.808 3 1.017 4.791 1.017 7L1.017 9C1.017 11.209 2.808 13 5.017 13L9.017 13L9.017 15L6.017 15C4.363 15 3.017 16.346 3.017 18L3.017 21L4.017 21Z"
              />
            </svg>
            <p
              class="text-sm text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed"
            >
              {{ props.citaTextual }}
            </p>
          </div>
        </div>

        <div v-if="props.details">
          <span
            class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2"
            >Notas Adicionales</span
          >
          <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {{ props.details }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { RiskLevel } from "~/types";

const props = defineProps<{
  category: string;
  description: string;
  risk: RiskLevel;
  clausula?: string | undefined;
  citaTextual?: string | undefined;
  riesgoReal?: string | undefined;
  mitigacion?: string | undefined;
  details?: string | undefined;
}>();

const isExpanded = ref(false);

const riskLabel = computed(() => {
  switch (props.risk) {
    case "high":
      return "Riesgo Alto";
    case "medium":
      return "Precaución";
    case "low":
      return "Seguro";
    default:
      return "";
  }
});

const riskColorClasses = computed(() => {
  switch (props.risk) {
    case "high":
      return {
        bg: "bg-risk-high",
        text: "text-risk-high",
      };
    case "medium":
      return {
        bg: "bg-risk-medium",
        text: "text-risk-medium",
      };
    case "low":
      return {
        bg: "bg-risk-low",
        text: "text-risk-low",
      };
    default:
      return {
        bg: "bg-primary-500",
        text: "text-primary-500",
      };
  }
});
</script>
