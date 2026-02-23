import { ref } from "vue";

export function useUploadProgress() {
  const uploadProgress = ref<number>(0);
  const isUploading = ref<boolean>(false);
  const uploadError = ref<string | null>(null);
  const abortController = ref<AbortController | null>(null);
  let xhrRef: XMLHttpRequest | null = null;

  /**
   * Upload a file with progress tracking using XMLHttpRequest
   * @param file - The file to upload
   * @param url - The upload endpoint URL
   * @returns Promise with success status and file_url or error
   */
  async function uploadFile(
    file: File,
    url: string,
  ): Promise<{ success: boolean; file_url?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      // Reset state
      uploadProgress.value = 0;
      isUploading.value = true;
      uploadError.value = null;

      const xhr = new XMLHttpRequest();
      xhrRef = xhr;

      // Track abort controller
      abortController.value = new AbortController();

      // Progress event - updates percentage
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          uploadProgress.value = percentComplete;
        }
      });

      // Load event - upload complete
      xhr.addEventListener("load", () => {
        xhrRef = null;
        abortController.value = null;

        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            isUploading.value = false;
            resolve({
              success: true,
              file_url: response.file_url,
            });
          } catch (parseError) {
            const errorMsg = "Error al procesar la respuesta del servidor";
            uploadError.value = errorMsg;
            isUploading.value = false;
            reject(new Error(errorMsg));
          }
        } else {
          // Handle HTTP errors
          let errorMsg: string;

          // Specific handling for 413 Payload Too Large
          if (xhr.status === 413) {
            errorMsg = "El archivo excede el tamaño máximo de 10MB. Por favor sube un documento más pequeño.";
          } else {
            errorMsg = `Error ${xhr.status}: ${xhr.statusText}`;
            try {
              const errorData = JSON.parse(xhr.responseText);
              errorMsg = errorData.message || errorMsg;
            } catch {
              // Use status text if no JSON error
            }
          }
          uploadError.value = errorMsg;
          isUploading.value = false;
          reject(new Error(errorMsg));
        }
      });

      // Error event - network error
      xhr.addEventListener("error", () => {
        xhrRef = null;
        abortController.value = null;
        const errorMsg = "Error de red. Verifica tu conexión e intenta de nuevo.";
        uploadError.value = errorMsg;
        isUploading.value = false;
        reject(new Error(errorMsg));
      });

      // Open and send
      xhr.open("POST", url);
      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  }

  /**
   * Cancel the current upload
   */
  function cancelUpload(): void {
    if (abortController.value) {
      abortController.value.abort();
    }
    if (xhrRef) {
      xhrRef.abort();
      xhrRef = null;
    }
    resetProgress();
  }

  /**
   * Reset all progress state
   */
  function resetProgress(): void {
    uploadProgress.value = 0;
    isUploading.value = false;
    uploadError.value = null;
    abortController.value = null;
    xhrRef = null;
  }

  return {
    uploadProgress,
    isUploading,
    uploadError,
    abortController,
    uploadFile,
    cancelUpload,
    resetProgress,
  };
}
