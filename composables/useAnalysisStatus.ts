import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

export type AnalysisStatus = 'pending' | 'queued' | 'analyzing' | 'finalizing' | 'completed' | 'failed'

/**
 * Normalize database status to UI status
 * DB uses: pending, processing, completed, failed
 * UI expects: pending, queued, analyzing, finalizing, completed, failed
 */
export function normalizeStatus(dbStatus: string): AnalysisStatus {
  switch (dbStatus) {
    case 'processing':
      return 'analyzing' // DB "processing" = UI "analyzing"
    case 'pending':
      return 'pending'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    default:
      return dbStatus as AnalysisStatus
  }
}

export interface Analysis {
  id: string
  user_id: string
  status: AnalysisStatus | string
  contract_name: string
  risk_level?: string | null
  created_at: string
  updated_at?: string
}

interface StatusConfig {
  label: string
  colorClass: string
  bgClass: string
  textClass: string
  icon: string
}

const STATUS_CONFIG: Record<AnalysisStatus, StatusConfig> = {
  pending: {
    label: 'Pendiente',
    colorClass: 'bg-slate-400',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-600 dark:text-slate-400',
    icon: 'clock',
  },
  queued: {
    label: 'En Cola',
    colorClass: 'bg-slate-500 animate-pulse',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-700 dark:text-slate-300',
    icon: 'queue',
  },
  analyzing: {
    label: 'Analizando...',
    colorClass: 'bg-secondary animate-pulse',
    bgClass: 'bg-secondary/10',
    textClass: 'text-secondary',
    icon: 'sparkles',
  },
  finalizing: {
    label: 'Finalizando...',
    colorClass: 'bg-accent-indigo animate-pulse',
    bgClass: 'bg-accent-indigo/10',
    textClass: 'text-accent-indigo',
    icon: 'check-circle',
  },
  completed: {
    label: 'Completado',
    colorClass: 'bg-risk-low',
    bgClass: 'bg-risk-low/10',
    textClass: 'text-risk-low',
    icon: 'check',
  },
  failed: {
    label: 'Fallido',
    colorClass: 'bg-red-500',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500',
    icon: 'x',
  },
}

/**
 * Get status configuration object
 */
export function getStatusConfig(status: string): StatusConfig {
  const validStatus = (status as AnalysisStatus) in STATUS_CONFIG
    ? (status as AnalysisStatus)
    : 'pending'
  return STATUS_CONFIG[validStatus]
}

/**
 * Get Spanish label for status
 */
export function getStatusLabel(status: string): string {
  return getStatusConfig(status).label
}

/**
 * Get Tailwind color class for status dot/badge
 */
export function getStatusColor(status: string): string {
  return getStatusConfig(status).colorClass
}

/**
 * Get background class for badge component
 */
export function getStatusBgClass(status: string): string {
  return getStatusConfig(status).bgClass
}

/**
 * Get text color class for badge component
 */
export function getStatusTextClass(status: string): string {
  return getStatusConfig(status).textClass
}

/**
 * Get icon name for status
 */
export function getStatusIcon(status: string): string {
  return getStatusConfig(status).icon
}

/**
 * Check if status is active (should show pulse animation)
 */
export function isActiveStatus(status: string): boolean {
  const activeStatuses: AnalysisStatus[] = ['pending', 'queued', 'analyzing', 'finalizing']
  return activeStatuses.includes(status as AnalysisStatus)
}

/**
 * Subscribe to real-time analysis updates via Supabase Realtime
 * @param analysisId - The ID of the analysis to subscribe to
 * @param userId - The user ID for filtering
 * @param callback - Called when analysis is updated
 * @returns Unsubscribe function
 */
export function subscribeToAnalysis(
  supabase: SupabaseClient,
  analysisId: string,
  userId: string,
  callback: (analysis: Analysis) => void,
): () => void {
  const channelName = `analysis-${analysisId}`

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'analyses',
        filter: `id=eq.${analysisId}`,
      },
      (payload) => {
        const updatedAnalysis = payload.new as Analysis
        if (updatedAnalysis) {
          // Normalize DB status to UI status
          const normalizedAnalysis = {
            ...updatedAnalysis,
            status: normalizeStatus(updatedAnalysis.status),
          }
          callback(normalizedAnalysis)
        }
      },
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Composable for managing analysis status subscriptions
 * Tracks active channels and provides cleanup
 */
export function useAnalysisStatus() {
  const supabase = useSupabaseClient()
  const activeSubscriptions = new Map<string, RealtimeChannel>()

  /**
   * Subscribe to an analysis and track the subscription
   */
  function subscribe(
    analysisId: string,
    userId: string,
    callback: (analysis: Analysis) => void,
  ): () => void {
    // Unsubscribe if already subscribed to this analysis
    if (activeSubscriptions.has(analysisId)) {
      unsubscribe(analysisId)
    }

    const channelName = `analysis-${analysisId}`

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analyses',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          const updatedAnalysis = payload.new as Analysis
          if (updatedAnalysis) {
            callback(updatedAnalysis)
          }
        },
      )
      .subscribe()

    activeSubscriptions.set(analysisId, channel)

    // Return unsubscribe function
    return () => unsubscribe(analysisId)
  }

  /**
   * Unsubscribe from a specific analysis
   */
  function unsubscribe(analysisId: string): void {
    const channel = activeSubscriptions.get(analysisId)
    if (channel) {
      supabase.removeChannel(channel)
      activeSubscriptions.delete(analysisId)
    }
  }

  /**
   * Unsubscribe from all analyses
   */
  function unsubscribeAll(): void {
    activeSubscriptions.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    activeSubscriptions.clear()
  }

  // Cleanup on unmount
  if (import.meta.client) {
    onUnmounted(() => {
      unsubscribeAll()
    })
  }

  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
    getStatusLabel,
    getStatusColor,
    getStatusBgClass,
    getStatusTextClass,
    getStatusIcon,
    isActiveStatus,
    getStatusConfig,
  }
}
