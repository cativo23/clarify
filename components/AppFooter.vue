<template>
  <footer
    class="bg-white dark:bg-slate-950 py-20 border-t border-slate-100 dark:border-slate-900 transition-colors duration-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid md:grid-cols-4 gap-12">
        <div class="col-span-2">
          <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-6">Clarify</h3>
          <p class="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
            Democratizando el acceso a la asesoría legal mediante inteligencia artificial de vanguardia. Auditorías
            transparentes para todos.
          </p>
          <div class="flex gap-4">
            <div
              class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-secondary transition-colors cursor-pointer">
              𝕏</div>
            <div
              class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-secondary transition-colors cursor-pointer">
              in</div>
            <div
              class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-secondary transition-colors cursor-pointer">
              📦</div>
          </div>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-sm">Producto</h4>
          <ul class="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
            <li>
              <NuxtLink to="/about" class="hover:text-secondary transition-colors">Sobre Nosotros</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/faq" class="hover:text-secondary transition-colors">FAQs</NuxtLink>
            </li>
            <li><a href="#" class="hover:text-secondary transition-colors">Seguridad</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-sm">Legal</h4>
          <ul class="space-y-4 text-slate-500 dark:text-slate-400 text-sm">
            <li>
              <NuxtLink to="/privacy" class="hover:text-secondary transition-colors">Privacidad</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/terms" class="hover:text-secondary transition-colors">Términos de Uso</NuxtLink>
            </li>
            <li><a href="#" class="hover:text-secondary transition-colors">Contacto</a></li>
          </ul>
        </div>
      </div>
      <div
        class="mt-20 pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-start gap-6">
        <p class="text-slate-400 text-xs text-center md:text-left max-w-2xl leading-relaxed">
          © 2026 Clarify. Clarify es una guía de análisis asistida por IA. No es un abogado ni proporciona asesoría
          legal. Toda la información generada es de carácter informativo y debe ser revisada por un profesional
          cualificado antes de tomar decisiones.
        </p>
        <p class="text-slate-400 text-xs mt-4 md:mt-0 whitespace-nowrap">Made with Nuxt 3 & AI</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>
