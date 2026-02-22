<script setup lang="ts">
import { SunIcon, MoonIcon } from "@heroicons/vue/24/outline";

const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <button
    class="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-400 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:text-white dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-secondary group"
    aria-label="Toggle dark mode"
    @click="toggleTheme"
  >
    <div class="relative h-5 w-5">
      <!-- Sun Icon -->
      <SunIcon
        class="absolute inset-0 h-5 w-5 transform transition-all duration-500 ease-in-out"
        :class="
          colorMode.value === 'dark'
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        "
      />
      <!-- Moon Icon -->
      <MoonIcon
        class="absolute inset-0 h-5 w-5 transform transition-all duration-500 ease-in-out"
        :class="
          colorMode.value === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        "
      />
    </div>

    <!-- Subtle Glow Effect -->
    <span
      class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md bg-secondary/20 -z-10"
    ></span>
  </button>
</template>
