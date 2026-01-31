import { Worker } from 'bullmq'
import { getRedisConnection } from '../utils/queue'
import { extractTextFromPDF } from '../utils/pdf-parser'
import { analyzeContract } from '../utils/openai-client'
import { createClient } from '@supabase/supabase-js'

export default defineNitroPlugin((_nitroApp) => {
    const config = useRuntimeConfig()

    // Create Supabase Admin client to bypass RLS in background jobs
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || '',
        config.supabaseServiceKey
    )

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
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
                .from('contracts')
                .download(storagePath)

            if (downloadError || !fileData) {
                throw new Error(`Failed to download file from storage: ${downloadError?.message}`)
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

            // --- NORMALIZE SUMMARY FOR UI ---
            if (analysisType === 'basic') {
                analysisSummary = {
                    resumen_ejecutivo: {
                        veredicto: analysisSummary.recomendacion_final?.accion || analysisSummary.veredicto_rapido,
                        justificacion: analysisSummary.resumen_ejecutivo,
                        clausulas_criticas_totales: analysisSummary.total_clausulas_criticas,
                        mayor_riesgo_identificado: analysisSummary.alertas_criticas?.[0]?.titulo || null
                    },
                    nivel_riesgo_general: analysisSummary.nivel_riesgo,
                    metricas: {
                        total_rojas: analysisSummary.total_clausulas_criticas || 0,
                        total_amarillas: 0,
                        total_verdes: 0,
                        porcentaje_clausulas_analizadas: 'Escaneo de Alertas Rojas'
                    },
                    hallazgos: (analysisSummary.alertas_criticas || []).map((alerta: any) => ({
                        color: 'rojo',
                        titulo: alerta.titulo,
                        clausula: alerta.clausula,
                        cita_textual: alerta.cita_textual,
                        explicacion: alerta.por_que_es_peligroso,
                        riesgo_real: alerta.ejemplo_concreto,
                        mitigacion: 'Revisar esta cláusula cuidadosamente antes de firmar.'
                    })),
                    clausulas_no_clasificadas: []
                }
            }

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

            // Mark as failed in DB
            await supabaseAdmin
                .from('analyses')
                .update({
                    status: 'failed',
                    error_message: error.message || 'Unknown error occurred during analysis'
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
