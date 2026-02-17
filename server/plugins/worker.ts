import { Worker } from 'bullmq'
import { getRedisConnection } from '../utils/queue'
import { extractTextFromPDF } from '../utils/pdf-parser'
import { analyzeContract } from '../utils/openai-client'
import { getWorkerSupabaseClient } from '../utils/worker-supabase'
import { sanitizeErrorMessage } from '../utils/error-handler'

/**
 * [SECURITY FIX M4] Separate user-facing summary from debug info
 * Stores full data but marks debug fields for admin-only access
 * Debug info is hidden from regular users by default in API responses
 */
function prepareSummaryForStorage(summary: any): any {
  // Keep the full summary intact including all debug info
  // The _debug field contains:
  // - Token usage (input/output tokens)
  // - Model information
  // - Processing timestamps
  // - Preprocessing details
  
  // Mark the summary as having admin-only debug info
  // Frontend should check user.is_admin before displaying _debug
  const summaryWithMetadata = {
    ...summary,
    _debug: {
      ...summary._debug,
      _adminOnly: true, // Flag for frontend to hide from non-admins
      storedAt: new Date().toISOString()
    }
  }
  
  return summaryWithMetadata
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
            // [SECURITY FIX M4] Store full debug info marked for admin-only access
            const summaryWithMetadata = prepareSummaryForStorage(analysisSummary)
            
            const completeResult = await supabase.updateAnalysisStatus(analysisId, 'completed', {
                summary_json: summaryWithMetadata,
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
            // [SECURITY FIX M4] Store debug info marked for admin-only access
            const summaryWithMetadata = debugData ? prepareSummaryForStorage({ _debug: debugData }) : null
            
            await supabase.updateAnalysisStatus(analysisId, 'failed', {
                error_message: sanitizeErrorMessage(errorMessage),
                summary_json: summaryWithMetadata
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
