<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Set up global meta tags
useHead({
  titleTemplate: '%s | Clarify',
  htmlAttrs: {
    lang: 'es',
  },
})
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif, system-ui;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  @apply bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.4s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
  transform: translateY(10px);
}
</style>
