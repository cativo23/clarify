export interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => [])
  const toastTimeouts = new Map<number, NodeJS.Timeout>()

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now()
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }

    toasts.value.push(newToast)

    // Auto-remove after duration
    if (newToast.duration) {
      const timeout = setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
      toastTimeouts.set(id, timeout)
    }

    return id
  }

  const removeToast = (id: number) => {
    const timeout = toastTimeouts.get(id)
    if (timeout) {
      clearTimeout(timeout)
      toastTimeouts.delete(id)
    }
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (message: string, duration?: number) =>
    addToast({ type: 'success', message, duration })

  const error = (message: string, duration?: number) =>
    addToast({ type: 'error', message, duration })

  const info = (message: string, duration?: number) =>
    addToast({ type: 'info', message, duration })

  const warning = (message: string, duration?: number) =>
    addToast({ type: 'warning', message, duration })

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
