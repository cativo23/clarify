<template>
  <div
    class="relative"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div
      :class="[
        'border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all duration-500 cursor-pointer relative overflow-hidden group',
        isDragging
          ? 'border-secondary bg-secondary/5 scale-[1.02] shadow-glow'
          : 'border-slate-200 dark:border-slate-800 hover:border-secondary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50',
      ]"
      @click="openFilePicker"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".pdf"
        class="hidden"
        @change="handleFileChange"
      />

      <!-- Decor gradient -->
      <div
        v-if="isDragging"
        class="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent pointer-events-none"
      ></div>

      <!-- Upload Icon -->
      <div class="mb-8 relative z-10">
        <div
          :class="[
            'w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-lg',
            isDragging
              ? 'bg-secondary text-white rotate-12'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-secondary/10 group-hover:text-secondary group-hover:-rotate-6',
          ]"
        >
          <svg
            class="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
      </div>

      <!-- Text -->
      <div class="mb-6 relative z-10">
        <p
          class="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight"
        >
          {{ isDragging ? "¡Suelta tu contrato aquí!" : "Sube tu contrato" }}
        </p>
        <p class="text-slate-500 dark:text-slate-400 font-medium">
          Arrastra el archivo o
          <span
            class="text-secondary underline decoration-secondary/30 decoration-2 underline-offset-4 font-bold"
            >explora tus archivos</span
          >
        </p>
      </div>

      <!-- File Info -->
      <div
        class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 relative z-10"
      >
        PDF (MÁX. 10MB)
      </div>
    </div>

    <!-- Selected File Preview -->
    <div
      v-if="selectedFile"
      class="mt-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 animate-slide-up shadow-premium"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-risk-high/10 rounded-xl flex items-center justify-center text-risk-high shadow-inner"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p class="font-bold text-slate-900 dark:text-white leading-tight">
              {{ selectedFile.name }}
            </p>
            <p
              class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1"
            >
              {{ formatFileSize(selectedFile.size) }}
            </p>
          </div>
        </div>
        <button
          v-if="!isUploading"
          class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-risk-high hover:text-white transition-all flex items-center justify-center"
          title="Eliminar archivo"
          @click.stop="clearFile"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Upload Progress Bar -->
      <div v-if="isUploading || uploadProgress !== undefined" class="space-y-2">
        <div class="flex items-center justify-between">
          <span
            class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {{
              isUploading
                ? "Subiendo..."
                : uploadProgress === 100
                  ? "Completado"
                  : `Progreso: ${uploadProgress}%`
            }}
          </span>
          <span class="text-xs font-black text-secondary"
            >{{ uploadProgress ?? 0 }}%</span
          >
        </div>
        <div
          class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
        >
          <div
            class="h-full bg-gradient-to-r from-secondary to-accent-indigo transition-all duration-300 ease-out rounded-full"
            :style="{ width: `${uploadProgress ?? 0}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="mt-4 p-4 bg-risk-high/10 border border-risk-high rounded-lg animate-slide-up"
    >
      <p class="text-risk-high text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: File | null;
  uploadProgress?: number;
  isUploading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [file: File | null];
  error: [message: string];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const selectedFile = ref<File | null>(props.modelValue || null);
const error = ref("");

const openFilePicker = () => {
  fileInput.value?.click();
};

const validateFile = (file: File): boolean => {
  error.value = "";

  // Check file type
  if (file.type !== "application/pdf") {
    error.value = "Solo se permiten archivos PDF";
    emit("error", error.value);
    return false;
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    error.value = "El archivo no debe superar los 10MB";
    emit("error", error.value);
    return false;
  }

  return true;
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file && validateFile(file)) {
    selectedFile.value = file;
    emit("update:modelValue", file);
  }
};

const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;

  const file = event.dataTransfer?.files[0];
  if (file && validateFile(file)) {
    selectedFile.value = file;
    emit("update:modelValue", file);
  }
};

const clearFile = () => {
  selectedFile.value = null;
  error.value = "";
  emit("update:modelValue", null);

  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    selectedFile.value = newValue || null;
  },
);
</script>
