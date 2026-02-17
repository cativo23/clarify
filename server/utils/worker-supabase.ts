/**
 * Worker-specific Supabase client with scoped operations
 * 
 * [SECURITY FIX C5] This module restricts worker operations to only what's needed:
 * - Update analysis status (processing → completed/failed)
 * - Download files from storage bucket
 * - No arbitrary queries, no user data access
 * 
 * The service_role key is still required for background jobs, but we limit
 * the blast radius by controlling WHAT operations the worker can perform.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface WorkerSupabaseClient {
    /**
     * Update analysis record status
     * Only allows updating specific fields on analyses table
     */
    updateAnalysisStatus: (
        analysisId: string,
        status: 'processing' | 'completed' | 'failed',
        data?: { summary_json?: any; risk_level?: string; error_message?: string }
    ) => Promise<{ success: boolean; error?: string }>

    /**
     * Download file from contracts bucket
     * Only allows reading from 'contracts' bucket
     */
    downloadContractFile: (storagePath: string) => Promise<{
        data?: Blob
        error?: string
    }>

    /**
     * Get analysis record by ID
     * Only allows selecting specific fields
     */
    getAnalysisById: (analysisId: string) => Promise<{
        id?: string
        user_id?: string
        status?: string
        storage_path?: string
        error?: string
    }>
}

let cachedClient: {
    supabase: SupabaseClient
    wrapper: WorkerSupabaseClient
} | null = null

/**
 * Creates a worker-scoped Supabase client
 * Uses service_role but restricts operations via application logic
 */
export function getWorkerSupabaseClient(): WorkerSupabaseClient {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('[Worker Supabase] Missing environment configuration')
    }

    // Return cached if available
    if (cachedClient) {
        return cachedClient.wrapper
    }

    // Create admin client (bypasses RLS - use with extreme caution)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    // Create scoped wrapper
    const wrapper: WorkerSupabaseClient = {
        async updateAnalysisStatus(analysisId, status, data = {}) {
            console.log(`[Worker Supabase] Updating analysis ${analysisId} to ${status}`)

            // Validate status transition
            const allowedStatuses = ['processing', 'completed', 'failed']
            if (!allowedStatuses.includes(status)) {
                const error = `Invalid status: ${status}`
                console.error(`[Worker Supabase] ${error}`)
                return { success: false, error }
            }

            // Build update payload with only allowed fields
            const updateData: any = {
                status,
                updated_at: new Date().toISOString()
            }

            // Only include provided optional fields
            if (data.summary_json !== undefined) {
                updateData.summary_json = data.summary_json
            }
            if (data.risk_level !== undefined) {
                updateData.risk_level = data.risk_level
            }
            if (data.error_message !== undefined) {
                updateData.error_message = data.error_message
            }

            try {
                const { error } = await supabase
                    .from('analyses')
                    .update(updateData)
                    .eq('id', analysisId)

                if (error) {
                    console.error('[Worker Supabase] Update failed:', error.message)
                    return { success: false, error: error.message }
                }

                return { success: true }
            } catch (err: any) {
                console.error('[Worker Supabase] Update error:', err.message)
                return { success: false, error: err.message }
            }
        },

        async downloadContractFile(storagePath) {
            console.log(`[Worker Supabase] Downloading file: ${storagePath}`)

            // Validate storage path format
            if (!storagePath || typeof storagePath !== 'string') {
                return { error: 'Invalid storage path' }
            }

            // Security: Prevent path traversal
            if (storagePath.includes('..') || storagePath.startsWith('/')) {
                console.error('[Worker Supabase] Path traversal attempt blocked')
                return { error: 'Invalid storage path format' }
            }

            try {
                const { data, error } = await supabase.storage
                    .from('contracts')
                    .download(storagePath)

                if (error || !data) {
                    console.error('[Worker Supabase] Download failed:', error?.message)
                    return { error: error?.message || 'Download failed' }
                }

                return { data }
            } catch (err: any) {
                console.error('[Worker Supabase] Download error:', err.message)
                return { error: err.message }
            }
        },

        async getAnalysisById(analysisId) {
            console.log(`[Worker Supabase] Fetching analysis: ${analysisId}`)

            try {
                const { data, error } = await supabase
                    .from('analyses')
                    .select('id, user_id, status, storage_path')
                    .eq('id', analysisId)
                    .single()

                if (error || !data) {
                    console.error('[Worker Supabase] Fetch failed:', error?.message)
                    return { error: error?.message || 'Analysis not found' }
                }

                return {
                    id: data.id,
                    user_id: data.user_id,
                    status: data.status,
                    storage_path: data.storage_path
                }
            } catch (err: any) {
                console.error('[Worker Supabase] Fetch error:', err.message)
                return { error: err.message }
            }
        }
    }

    cachedClient = { supabase, wrapper }
    return wrapper
}

/**
 * Clear cached client (useful for testing or config reload)
 */
export function clearWorkerSupabaseCache() {
    cachedClient = null
}
