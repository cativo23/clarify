<template>
  <div
    class="relative inline-block"
    @mouseenter="isOpen = true"
    @mouseleave="isOpen = false"
  >
    <slot name="trigger">
      <span
        class="underline decoration-dashed decoration-secondary/50 cursor-help"
      >
        <slot />
      </span>
    </slot>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-show="isOpen"
        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm rounded-xl w-72 shadow-xl z-50"
      >
        <slot name="content">
          <p class="font-bold mb-2">¿Qué es un token?</p>
          <p class="text-xs leading-relaxed mb-2">
            Piensa en tokens como ~4 caracteres cada uno.
          </p>
          <p class="text-xs leading-relaxed font-bold">
            {{ tokenExplanation }}
          </p>
        </slot>

        <!-- Arrow -->
        <div
          class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-white"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tokenExplanation?: string;
}>();

const isOpen = ref(false);
</script>
