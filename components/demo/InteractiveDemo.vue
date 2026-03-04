<template>
  <div class="w-full max-w-4xl mx-auto p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl">
    <!-- Demo Header -->
    <div class="mb-6 text-center">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Prueba Nuestro Servicio</h2>
      <p class="text-gray-600 dark:text-gray-300">
        Sube un contrato de ejemplo o selecciona uno predefinido para ver cómo funciona nuestro análisis
      </p>
    </div>

    <!-- Sample Documents Section -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">Documentos de Ejemplo:</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          v-for="(sample, index) in sampleDocuments"
          :key="index"
          @click="selectSample(sample)"
          class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left"
        >
          <div class="font-medium text-gray-800 dark:text-white">{{ sample.name }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ sample.description }}</div>
        </button>
      </div>
    </div>

    <!-- Contract Selection -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Nombre del Contrato:
      </label>
      <input
        v-model="contractName"
        type="text"
        placeholder="Ej: Contrato de Servicios Profesionales"
        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :disabled="isProcessing"
      />
    </div>

    <!-- Upload Simulation -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Subiendo documento...</span>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ uploadProgress }}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          class="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Action Button -->
    <div class="flex justify-center mb-6">
      <button
        @click="analyzeContract"
        :disabled="isProcessing || !contractName.trim()"
        class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {{ isProcessing ? 'Analizando...' : 'Ver Resultados de Demo' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isProcessing" class="mb-6 flex flex-col items-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
      <p class="text-gray-600 dark:text-gray-300">Analizando el contrato con IA avanzada...</p>
    </div>

    <!-- Results Display -->
    <div v-if="results && !isProcessing" class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Resultados del Análisis</h3>

        <!-- Executive Summary -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Resumen Ejecutivo</h4>
          <p class="text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 p-4 rounded-lg">
            {{ results.summary_json.executive_summary }}
          </p>
        </div>

        <!-- Risk Level -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Nivel de Riesgo</h4>
          <div class="flex items-center space-x-3">
            <span class="px-3 py-1 rounded-full text-white text-sm font-medium"
                  :class="getRiskColorClass(results.summary_json.risk_level)">
              {{ results.summary_json.risk_level.charAt(0).toUpperCase() + results.summary_json.risk_level.slice(1) }}
            </span>
            <div class="text-lg font-semibold text-gray-800 dark:text-white">
              Puntuación: {{ results.summary_json.risk_score }}/100
            </div>
          </div>
        </div>

        <!-- Key Findings -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Hallazgos Clave</h4>
          <ul class="space-y-2">
            <li v-for="(finding, index) in results.summary_json.key_findings"
                :key="index"
                class="flex items-start">
              <span class="mr-2 text-blue-500">•</span>
              <span class="text-gray-700 dark:text-gray-300">{{ finding }}</span>
            </li>
          </ul>
        </div>

        <!-- Risk Items -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Riesgos Identificados</h4>
          <div class="space-y-3">
            <div v-for="(risk, index) in results.risk_items"
                 :key="risk.id"
                 class="p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="font-medium text-gray-800 dark:text-white">{{ risk.clause_text }}</div>
                  <div class="flex items-center mt-2 space-x-3">
                    <span class="px-2 py-1 rounded text-xs font-medium"
                          :class="getRiskColorClass(risk.risk_level)">
                      {{ risk.risk_level.charAt(0).toUpperCase() + risk.risk_level.slice(1) }}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {{ risk.category }}
                    </span>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Severidad: {{ risk.severity }}/10
                    </span>
                  </div>
                </div>
              </div>
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <strong>Recomendación:</strong> {{ risk.recommendation }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Recomendaciones</h4>
          <ul class="space-y-2">
            <li v-for="(rec, index) in results.summary_json.recommendations"
                :key="index"
                class="flex items-start">
              <span class="mr-2 text-indigo-500">•</span>
              <span class="text-gray-700 dark:text-gray-300">{{ rec }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Reset Button -->
      <div class="mt-6 flex justify-center">
        <button
          @click="resetDemo"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
        >
          Probar Otro Contrato
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Analysis } from '~/types/index'

interface SampleDocument {
  name: string;
  description: string;
  filename: string;
}

const contractName = ref('');
const uploadProgress = ref(0);
const isProcessing = ref(false);
const results = ref<Analysis | null>(null);

const sampleDocuments: SampleDocument[] = [
  {
    name: 'Contrato de Servicios',
    description: 'Acuerdo estándar para servicios profesionales',
    filename: 'contrato-servicios.pdf'
  },
  {
    name: 'Acuerdo de Confidencialidad',
    description: 'NDA para protección de información sensible',
    filename: 'nda.pdf'
  },
  {
    name: 'Contrato de Arrendamiento',
    description: 'Acuerdo de arrendamiento comercial',
    filename: 'arrendamiento.pdf'
  }
];

// Simulate upload progress
const simulateUpload = () => {
  uploadProgress.value = 0;
  const interval = setInterval(() => {
    if (uploadProgress.value < 100) {
      uploadProgress.value += Math.floor(Math.random() * 10) + 5;
      if (uploadProgress.value > 100) uploadProgress.value = 100;
    } else {
      clearInterval(interval);
    }
  }, 100);
};

// Select a sample document
const selectSample = (sample: SampleDocument) => {
  if (!isProcessing.value) {
    contractName.value = sample.name;
    simulateUpload();
  }
};

// Get color classes based on risk level
const getRiskColorClass = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'high':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// Analyze the contract via demo API
const analyzeContract = async () => {
  if (!contractName.value.trim()) return;

  isProcessing.value = true;

  try {
    // Simulate upload progress
    simulateUpload();

    // Wait for upload to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Call the demo API
    const response = await $fetch('/api/demo/simulate', {
      method: 'POST',
      body: {
        contract_name: contractName.value,
        analysis_type: 'premium'
      }
    });

    if (response.success && response.data) {
      results.value = response.data as AnalysisResult;
    }
  } catch (error: any) {
    console.error('Demo analysis failed:', error);
    alert(`Error en la demo: ${error.message || 'Unknown error'}`);
  } finally {
    isProcessing.value = false;
  }
};

// Reset demo state
const resetDemo = () => {
  contractName.value = '';
  uploadProgress.value = 0;
  results.value = null;
  isProcessing.value = false;
};
</script>