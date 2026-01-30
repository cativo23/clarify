<template>
  <div 
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    class="relative"
  >
    <div
      :class="[
        'border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer',
        isDragging 
          ? 'border-accent-indigo bg-accent-indigo/5 scale-[1.02]' 
          : 'border-primary-300 hover:border-accent-indigo hover:bg-primary-50'
      ]"
      @click="openFilePicker"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".pdf"
        @change="handleFileChange"
        class="hidden"
      />

      <!-- Upload Icon -->
      <div class="mb-6">
        <div 
          :class="[
            'w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all',
            isDragging ? 'bg-accent-indigo' : 'bg-primary-100'
          ]"
        >
          <svg 
            class="w-10 h-10 transition-colors" 
            :class="isDragging ? 'text-white' : 'text-primary-600'"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      </div>

      <!-- Text -->
      <div class="mb-4">
        <p class="text-xl font-semibold text-primary-900 mb-2">
          {{ isDragging ? '¡Suelta tu contrato aquí!' : 'Arrastra tu contrato' }}
        </p>
        <p class="text-primary-600">
          o <span class="text-accent-indigo font-medium">haz clic para seleccionar</span>
        </p>
      </div>

      <!-- File Info -->
      <div class="text-sm text-primary-500">
        Solo archivos PDF • Máximo 10MB
      </div>
    </div>

    <!-- Selected File Preview -->
    <div v-if="selectedFile" class="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200 flex items-center justify-between animate-slide-up">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-risk-high rounded flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <p class="font-medium text-primary-900">{{ selectedFile.name }}</p>
          <p class="text-sm text-primary-600">{{ formatFileSize(selectedFile.size) }}</p>
        </div>
      </div>
      <button
        @click.stop="clearFile"
        class="text-primary-400 hover:text-risk-high transition-colors p-2"
        title="Eliminar archivo"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-4 p-4 bg-risk-high/10 border border-risk-high rounded-lg animate-slide-up">
      <p class="text-risk-high text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: File | null
}>()

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'error': [message: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const selectedFile = ref<File | null>(props.modelValue || null)
const error = ref('')

const openFilePicker = () => {
  fileInput.value?.click()
}

const validateFile = (file: File): boolean => {
  error.value = ''

  // Check file type
  if (file.type !== 'application/pdf') {
    error.value = 'Solo se permiten archivos PDF'
    emit('error', error.value)
    return false
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = 'El archivo no debe superar los 10MB'
    emit('error', error.value)
    return false
  }

  return true
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file && validateFile(file)) {
    selectedFile.value = file
    emit('update:modelValue', file)
  }
}

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  
  const file = event.dataTransfer?.files[0]
  if (file && validateFile(file)) {
    selectedFile.value = file
    emit('update:modelValue', file)
  }
}

const clearFile = () => {
  selectedFile.value = null
  error.value = ''
  emit('update:modelValue', null)
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  selectedFile.value = newValue || null
})
</script>
