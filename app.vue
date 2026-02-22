<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Set up global meta tags
useHead({
  titleTemplate: "%s | Clarify",
  htmlAttrs: {
    lang: "es",
  },
});
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
}

body {
  font-family: "Inter", sans-serif, system-ui;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  @apply bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(8px);
  transform: translateY(10px);
}

.layout-enter-active,
.layout-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
  filter: blur(10px);
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}
</style>
