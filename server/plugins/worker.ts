import { Worker } from 'bullmq'
import { getRedisConnection } from '../utils/queue'
import { extractTextFromPDF } from '../utils/pdf-parser'
import { analyzeContract } from '../utils/openai-client'
import { getWorkerSupabaseClient } from '../utils/worker-supabase'
import { sanitizeErrorMessage } from '../utils/error-handler'

/**
 * [SECURITY FIX M4] Sanitize analysis summary before storing to database
 * Removes sensitive debug information that shouldn't be publicly accessible
 */
function sanitizeSummaryForStorage(summary: any): any {
  // Create a copy to avoid mutating the original
  const sanitized = { ...summary }
  
  // Remove or sanitize _debug field which contains:
  // - Token usage data
  // - Model information
  // - Timestamps
  // - Other implementation details
  if (sanitized._debug) {
    // Keep only safe, non-sensitive fields
    const safeDebug = {
      timestamp: sanitized._debug.timestamp,
      preprocessing: sanitized._debug.preprocessing ? {
        originalTokens: sanitized._debug.preprocessing.originalTokens,
        processedTokens: sanitized._debug.preprocessing.processedTokens,
        truncated: sanitized._debug.preprocessing.truncated
      } : undefined
    }
    sanitized._debug = safeDebug
  }
  
  // Remove any fields that might contain sensitive data
  // Keep only user-facing analysis results
  const safeFields = [
    'nivel_riesgo_general',
    'nivel_riesgo',
    'resumen_ejecutivo',
    'clausulas_problematicas',
    'recomendaciones',
    'puntos_criticos',
    'riesgos_detectados',
    'clausulas_beneficiosas'
  ]
  
  // Create minimal safe summary for storage
  const minimalSummary: any = {}
  for (const field of safeFields) {
    if (sanitized[field] !== undefined) {
      minimalSummary[field] = sanitized[field]
    }
  }
  
  // Add sanitized debug if exists
  if (sanitized._debug) {
    minimalSummary._debug = sanitized._debug
  }
  
  return minimalSummary
}

export default defineNitroPlugin((_nitroApp) => {
    const worker = new Worker('analysis-queue', async (job) => {
        const { analysisId, userId, storagePath, analysisType } = job.data
        console.log(`[Worker] Started processing ${analysisType || 'premium'} analysis ${analysisId} for user ${userId}`)

        // [SECURITY FIX C5] Use scoped worker client instead of raw service_role
        const supabase = getWorkerSupabaseClient()

        try {
            // 1. Update status to processing
            const updateResult = await supabase.updateAnalysisStatus(analysisId, 'processing')
            if (!updateResult.success) {
                throw new Error(`Failed to update analysis status: ${updateResult.error}`)
            }

            // 2. Download from Storage
            console.log(`[Worker] Downloading file: ${storagePath} from bucket 'contracts'`)
            const downloadResult = await supabase.downloadContractFile(storagePath)

            if (downloadResult.error || !downloadResult.data) {
                console.error('[Worker] Download Error:', downloadResult.error)
                throw new Error(`Failed to download file from storage: ${downloadResult.error}`)
            }

            // 3. Extract text
            const buffer = Buffer.from(await downloadResult.data.arrayBuffer())
            const contractText = await extractTextFromPDF(buffer)

            if (!contractText || contractText.trim().length === 0) {
                throw new Error('Could not extract text from the PDF. It might be an image-only scan.')
            }

            // 4. Analyze with OpenAI
            let analysisSummary = await analyzeContract(contractText, analysisType || 'premium')

            // 5. Map risk level and Normalize Summary for UI
            // Premium uses 'nivel_riesgo_general', Basic uses 'nivel_riesgo'
            const riskLevelStr = analysisSummary.nivel_riesgo_general || analysisSummary.nivel_riesgo

            const riskMapping: Record<string, string> = {
                'Alto': 'high',
                'Medio': 'medium',
                'Bajo': 'low',
                'PELIGROSO': 'high',
                'PRECAUCIÓN': 'medium',
                'ACEPTABLE': 'low'
            }
            const dbRiskLevel = riskMapping[riskLevelStr] || 'medium'

            // 6. Save results and complete
            // [SECURITY FIX M4] Sanitize summary before storing to database
            const sanitizedSummary = sanitizeSummaryForStorage(analysisSummary)
            
            const completeResult = await supabase.updateAnalysisStatus(analysisId, 'completed', {
                summary_json: sanitizedSummary,
                risk_level: dbRiskLevel
            })

            if (!completeResult.success) {
                throw new Error(`Failed to save analysis results: ${completeResult.error}`)
            }

            console.log(`[Worker] Successfully completed analysis ${analysisId}`)

        } catch (error: any) {
            console.error(`[Worker] Error processing analysis ${analysisId}:`, error)

            // Prepare error data
            const errorMessage = error.message || 'Unknown error occurred during analysis'

            // If we have detailed debug info (e.g. from JSON parse error), save it
            let debugData = null
            if (error.debugInfo) {
                console.log(`[Worker] Saving debug info for failed analysis ${analysisId}`)
                debugData = error.debugInfo
            }

            // Mark as failed in DB using scoped client
            // [SECURITY FIX M4] Sanitize debug info before storing
            const sanitizedDebug = debugData ? sanitizeSummaryForStorage({ _debug: debugData })._debug : null
            
            await supabase.updateAnalysisStatus(analysisId, 'failed', {
                error_message: sanitizeErrorMessage(errorMessage),
                summary_json: sanitizedDebug ? { _debug: sanitizedDebug } : null
            })
        }
    }, {
        connection: getRedisConnection(),
        concurrency: 2, // Process up to 2 jobs at the same time
    })

    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} has completed`)
    })

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} has failed with ${err.message}`)
    })

    console.log('[Worker] Analysis worker plugin initialized')
})
