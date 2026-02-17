import { Worker } from 'bullmq'
import { getRedisConnection } from '../utils/queue'
import { extractTextFromPDF } from '../utils/pdf-parser'
import { analyzeContract } from '../utils/openai-client'
import { createClient } from '@supabase/supabase-js'

export default defineNitroPlugin((_nitroApp) => {
    // config removed as it is unused

    // Create Supabase Admin client to bypass RLS in background jobs
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[Worker] Missing Supabase configuration!')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const worker = new Worker('analysis-queue', async (job) => {
        const { analysisId, userId, storagePath, analysisType } = job.data
        console.log(`[Worker] Started processing ${analysisType || 'premium'} analysis ${analysisId} for user ${userId}`)

        try {
            // 1. Update status to processing
            await supabaseAdmin
                .from('analyses')
                .update({ status: 'processing' })
                .eq('id', analysisId)

            // 2. Download from Storage
            console.log(`[Worker] Downloading file: ${storagePath} from bucket 'contracts'`)
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
                .from('contracts')
                .download(storagePath)

            if (downloadError || !fileData) {
                console.error('[Worker] Supabase Download Error:', JSON.stringify(downloadError, null, 2))
                throw new Error(`Failed to download file from storage: ${downloadError?.message || JSON.stringify(downloadError)}`)
            }

            // 3. Extract text
            const buffer = Buffer.from(await fileData.arrayBuffer())
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
            const { error: updateError } = await supabaseAdmin
                .from('analyses')
                .update({
                    summary_json: analysisSummary,
                    risk_level: dbRiskLevel,
                    status: 'completed'
                })
                .eq('id', analysisId)

            if (updateError) {
                throw new Error(`Failed to save analysis results: ${updateError.message}`)
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

            // Mark as failed in DB
            await supabaseAdmin
                .from('analyses')
                .update({
                    status: 'failed',
                    error_message: errorMessage,
                    summary_json: debugData ? { _debug: debugData } : null // Save debug info in summary_json even if failed, or a dedicated column if available. Using summary_json as we can assume frontend can check status.
                })
                .eq('id', analysisId)
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
