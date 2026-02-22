<template>
  <div
    class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500"
  >
    <AppHeader />
    <main>
      <slot />
    </main>
    <AppFooter />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
// Default layout with global header and footer
</script>
