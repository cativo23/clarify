<template>
  <span
    class="inline-flex items-center rounded-full font-black uppercase tracking-wider px-2 py-0.5 text-[9px]"
    :class="toneClasses"
    title="Nivel de confianza de la IA en este hallazgo"
  >
    <span class="whitespace-nowrap">Confianza {{ confianza }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ confianza: "Alta" | "Media" | "Baja" }>();

const toneClasses = computed(() => {
  switch (props.confianza) {
    case "Alta":
      return "bg-accent-indigo/10 text-accent-indigo dark:text-indigo-300";
    case "Media":
      return "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    case "Baja":
      return "border border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500";
  }
});
</script>
