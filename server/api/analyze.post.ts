import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { getAnalysisQueue } from '../utils/queue'
import { validateSupabaseStorageUrl } from '../utils/ssrf-protection'

export default defineEventHandler(async (event) => {
    try {
        const user = await serverSupabaseUser(event)
        if (!user) {
            throw createError({ statusCode: 401, message: 'Unauthorized' })
        }

        const body = await readBody(event)
        const { file_url, contract_name, analysis_type = 'premium' } = body

        if (!file_url || !contract_name) {
            throw createError({ statusCode: 400, message: 'Missing required fields' })
        }

        // [SECURITY FIX C2] Validate file_url to prevent SSRF attacks
        const supabaseUrl = process.env.SUPABASE_URL || ''
        const validation = validateSupabaseStorageUrl(file_url, supabaseUrl)

        if (!validation.isValid) {
            throw createError({
                statusCode: 400,
                message: `Invalid file URL: ${validation.error}`
            })
        }

        const storagePath = validation.storagePath!
        const creditCost = analysis_type === 'premium' ? 3 : 1
        const client = await serverSupabaseClient(event)

        // Create analysis record using RPC - credit check and deduction are now atomic
        const { data: analysisId, error: txError } = await client
            .rpc('process_analysis_transaction', {
                p_contract_name: contract_name,
                p_storage_path: storagePath,
                p_analysis_type: analysis_type,
                p_credit_cost: creditCost,
                p_summary_json: null,
                p_risk_level: null
            })

        if (txError) {
            console.error('Transaction error:', txError)
            // Check for insufficient credits error
            if (txError.message && txError.message.includes('Insufficient credits')) {
                throw createError({
                    statusCode: 402,
                    message: txError.message,
                })
            }
            throw createError({
                statusCode: 500,
                message: txError.message || 'Failed to process analysis transaction',
            })
        }

        // Enqueue job
        const queue = getAnalysisQueue()
        await queue.add('analyze-contract', {
            analysisId,
            userId: user.id,
            storagePath,
            analysisType: analysis_type
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            }
        })

        return {
            success: true,
            analysisId
        }
    } catch (error: any) {
        console.error('Error in analyze endpoint:', error)
        return {
            success: false,
            error: error.message || 'An error occurred during analysis initiation',
        }
    }
})
