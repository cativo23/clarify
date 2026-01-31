import type { AnalysisRequest, AnalysisResponse } from '../../types'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'


export default defineEventHandler(async (event): Promise<AnalysisResponse> => {
    try {
        // Get user from session
        const user = await serverSupabaseUser(event)

        if (!user) {
            throw createError({
                statusCode: 401,
                message: 'Unauthorized',
            })
        }

        // Parse request body
        const body = await readBody<AnalysisRequest>(event)
        const { file_url, contract_name } = body

        if (!file_url || !contract_name) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields',
            })
        }

        // Get Supabase client
        const client = await serverSupabaseClient(event)

        // Check user credits
        const { data: userData, error: userError } = await client
            .from('users')
            .select('credits')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            throw createError({
                statusCode: 500,
                message: 'Failed to fetch user data',
            })
        }

        if (userData.credits < 1) {
            throw createError({
                statusCode: 402,
                message: 'Insufficient credits',
            })
        }

        // Download PDF from Supabase Storage
        // Download PDF from Supabase Storage
        // Reconstruct path: user_id/filename (since upload puts it in user folder)
        const filename = file_url.split('/').pop() || ''
        const storagePath = `${user.id}/${filename}`

        console.log('Downloading file from:', storagePath)

        const { data: fileData, error: fileError } = await client.storage
            .from('contracts')
            .download(storagePath)

        if (fileError || !fileData) {
            throw createError({
                statusCode: 500,
                message: 'Failed to download file',
            })
        }

        // Extract text from PDF
        const buffer = Buffer.from(await fileData.arrayBuffer())
        const contractText = await extractTextFromPDF(buffer)

        // Analyze with OpenAI
        const analysisSummary = await analyzeContract(contractText)

        // Map risk level for database indexing
        const riskMapping: Record<string, string> = {
            'Alto': 'high',
            'Medio': 'medium',
            'Bajo': 'low'
        }
        const dbRiskLevel = riskMapping[analysisSummary.nivel_riesgo_general] || 'medium'

        // Operación atómica: Deducción de crédito + guardar análisis (Uso de RPC para atomicidad)
        const { data: analysisId, error: txError } = await client
            .rpc('process_analysis_transaction', {
                p_user_id: user.id,
                p_contract_name: contract_name,
                p_file_url: file_url,
                p_summary_json: analysisSummary,
                p_risk_level: dbRiskLevel
            })

        if (txError) {
            console.error('Transaction error:', txError)
            throw createError({
                statusCode: 500,
                message: txError.message || 'Failed to process analysis transaction',
            })
        }

        // Fetch the created analysis record
        const { data: analysisData, error: fetchError } = await client
            .from('analyses')
            .select('*')
            .eq('id', analysisId)
            .single()

        if (fetchError || !analysisData) {
            throw createError({
                statusCode: 500,
                message: 'Analysis saved but could not be retrieved',
            })
        }

        return {
            success: true,
            analysis: analysisData,
        }
    } catch (error: any) {
        console.error('Error in analyze endpoint:', error)

        return {
            success: false,
            error: error.message || 'An error occurred during analysis',
        }
    }
})
