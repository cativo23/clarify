<template>
  <div class="pt-32 pb-24">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1
        class="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight"
      >
        Términos de <span class="text-secondary">Uso</span>
      </h1>
      <div class="prose prose-slate dark:prose-invert max-w-none">
        <p
          class="text-sm text-slate-500 mb-8 uppercase tracking-widest font-black"
        >
          Última actualización: 31 de Enero, 2026
        </p>

        <h2 class="text-2xl font-bold mt-12 mb-4">
          1. Aceptación de los Términos
        </h2>
        <p>
          Al acceder y utilizar Clarify, aceptas quedar vinculado por estos
          términos de uso y todas las leyes y reglamentos aplicables.
        </p>

        <h2 class="text-2xl font-bold mt-12 mb-4">
          2. Descargo de Responsabilidad Legal
        </h2>
        <div
          class="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6"
        >
          <p class="text-amber-700 dark:text-amber-400 font-bold m-0">
            IMPORTANTE: Clarify es una herramienta de asistencia basada en IA.
            No es un despacho de abogados y NO proporciona asesoría legal. El
            uso de esta herramienta no crea una relación abogado-cliente.
            Siempre consulta con un profesional del derecho antes de tomar
            decisiones basadas en el análisis de la IA.
          </p>
        </div>

        <h2 class="text-2xl font-bold mt-12 mb-4">
          3. Limitación de Responsabilidad
        </h2>
        <p>
          Clarify no se hace responsable de las consecuencias derivadas de
          interpretaciones erróneas por parte de la IA o de acciones tomadas por
          el usuario basadas en los reportes generados.
        </p>

        <h2 class="text-2xl font-bold mt-12 mb-4">4. Uso de Créditos</h2>
        <p>
          Los créditos comprados no tienen fecha de caducidad pero no son
          reembolsables. Cada análisis se descuenta del saldo del usuario en el
          momento de iniciarse.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "Términos de Uso",
});
</script>
