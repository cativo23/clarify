<template>
  <div class="pt-32 pb-24">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1
        class="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-12 tracking-tight"
      >
        Preguntas <span class="text-secondary">Frecuentes</span>
      </h1>

      <div class="space-y-6">
        <div v-for="(item, index) in faqs" :key="index" class="group">
          <div
            class="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-premium group-hover:border-secondary/30"
          >
            <h3
              class="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-4"
            >
              <span
                class="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center text-sm"
                >{{ index + 1 }}</span
              >
              {{ item.question }}
            </h3>
            <p class="text-slate-600 dark:text-slate-400 leading-relaxed ml-12">
              {{ item.answer }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const faqs = [
  {
    question: "¿Es Clarify un servicio legal?",
    answer:
      "No. Clarify es una herramienta de análisis de documentos asistida por IA. Proporcionamos una guía intuitiva para entender mejor tus contratos, pero no sustituimos la asesoría de un abogado profesional.",
  },
  {
    question: "¿Cómo funciona el sistema de créditos?",
    answer:
      "Cada análisis consume créditos. Un análisis rápido consume 1 crédito, mientras que un análisis profundo (Premium) consume 3 créditos. Puedes comprar paquetes de créditos que nunca vencen.",
  },
  {
    question: "¿Es segura mi información?",
    answer:
      "Absolutamente. Utilizamos encriptación SSL en tránsito y reposo. Además, eliminamos los metadatos de los archivos y no almacenamos los documentos originales más allá del tiempo necesario para el análisis.",
  },
  {
    question: "¿Puedo analizar cualquier tipo de contrato?",
    answer:
      "Sí, nuestra IA actúa como una potente guía capaz de procesar contratos de arrendamiento, laborales, de servicios, términos y condiciones, y muchos más. Sin embargo, los resultados son orientativos y para documentos extremadamente técnicos, recomendamos siempre una revisión legal humana.",
  },
];

useHead({
  title: "Preguntas Frecuentes",
});
</script>
