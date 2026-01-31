import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { getAnalysisQueue } from '../utils/queue'

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

        const creditCost = analysis_type === 'premium' ? 2 : 1
        const client = await serverSupabaseClient(event)

        // 1. Check credits
        const { data: userData, error: userError } = await client
            .from('users')
            .select('credits')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            throw createError({ statusCode: 500, message: 'Failed to fetch user data' })
        }

        if (userData.credits < creditCost) {
            throw createError({
                statusCode: 402,
                message: `Insufficient credits. ${analysis_type === 'premium' ? 'Premium' : 'Basic'} analysis requires ${creditCost} credit(s).`
            })
        }

        // 2. Extract storage path from file_url
        // file_url looks like: .../storage/v1/object/public/contracts/USER_ID/FILENAME.pdf
        const filename = file_url.split('/').pop() || ''
        const storagePath = `${user.id}/${filename}`

        // 3. Create analysis record as 'pending' using RPC to handle credit deduction atomically
        const { data: analysisId, error: txError } = await client
            .rpc('process_analysis_transaction', {
                p_user_id: user.id,
                p_contract_name: contract_name,
                p_file_url: file_url,
                p_analysis_type: analysis_type,
                p_credit_cost: creditCost,
                p_summary_json: null,
                p_risk_level: null
            })

        if (txError) {
            console.error('Transaction error:', txError)
            throw createError({
                statusCode: 500,
                message: txError.message || 'Failed to process analysis transaction',
            })
        }

        // 4. Enqueue job
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
