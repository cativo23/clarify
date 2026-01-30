<template>
  <div class="min-h-screen bg-primary-50">
    <NuxtPage />
  </div>
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
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
