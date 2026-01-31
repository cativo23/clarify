<template>
  <div class="pt-32 pb-24">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
        Sobre <span class="text-secondary">Nosotros</span>
      </h1>
      <div class="prose prose-lg dark:prose-invert max-w-none">
        <p class="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
          En Clarify, creemos que la transparencia legal no debería ser un lujo. Nuestra misión es democratizar el
          acceso a la comprensión de documentos complejos mediante el uso responsable de la inteligencia artificial.
        </p>

        <h2 class="text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">Nuestra Visión</h2>
        <p class="text-slate-600 dark:text-slate-400 mb-6">
          Nacimos de la frustración de enfrentarnos a contratos interminables llenos de términos técnicos diseñados para
          confundir. Queremos un mundo donde cada persona tenga la capacidad de entender exactamente qué está firmando
          en cuestión de segundos.
        </p>

        <div class="grid md:grid-cols-2 gap-8 my-12">
          <div class="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Ética en la IA</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm">
              Utilizamos tecnología de vanguardia para ofrecerte una guía informativa clara. No somos abogados ni
              proporcionamos asesoría legal; Clarify es una herramienta de apoyo para entender mejor el lenguaje
              complejo.
            </p>
          </div>
          <div class="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Privacidad Primero</h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm">
              Tus documentos son sagrados. Implementamos los estándares más altos de seguridad y nunca usamos tus datos
              para re-entrenar modelos públicos.
            </p>
          </div>
        </div>

        <h2 class="text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">El Equipo</h2>
        <p class="text-slate-600 dark:text-slate-400">
          Somos un equipo multidisciplinar de desarrolladores y apasionados por la tecnología que buscan simplificar la
          burocracia digital. Con sede en un entorno remoto, servimos a usuarios de todo el mundo hispanohablante.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Sobre Nosotros',
})
</script>
