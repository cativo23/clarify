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
        console.log('OpenAI Analysis Result:', JSON.stringify(analysisSummary, null, 2))

        // Map risk level for database indexing
        const riskMapping: Record<string, string> = {
            'Alto': 'high',
            'Medio': 'medium',
            'Bajo': 'low'
        }
        const dbRiskLevel = riskMapping[analysisSummary.nivel_riesgo_general] || 'medium'

        // Deduct credit
        const { error: creditError } = await client
            .from('users')
            .update({ credits: userData.credits - 1 })
            .eq('id', user.id)

        if (creditError) {
            throw createError({
                statusCode: 500,
                message: 'Failed to deduct credit',
            })
        }

        // Save analysis to database
        const { data: analysisData, error: analysisError } = await client
            .from('analyses')
            .insert({
                user_id: user.id,
                contract_name,
                file_url,
                summary_json: analysisSummary,
                risk_level: dbRiskLevel,
                credits_used: 1,
            })
            .select()
            .single()

        if (analysisError || !analysisData) {
            throw createError({
                statusCode: 500,
                message: 'Failed to save analysis',
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
