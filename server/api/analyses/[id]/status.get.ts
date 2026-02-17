import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { sanitizeAnalysisSummary, getRequestUserContext } from '../../../utils/analysis-security'

export default defineEventHandler(async (event) => {
    try {
        const user = await serverSupabaseUser(event)
        const analysisId = getRouterParam(event, 'id')

        if (!user) {
            throw createError({ statusCode: 401, message: 'Unauthorized' })
        }

        if (!analysisId) {
            throw createError({ statusCode: 400, message: 'Missing analysis ID' })
        }

        // Get user context including admin status
        const userContext = await getRequestUserContext(event)

        const client = await serverSupabaseClient(event)

        const { data: analysis, error } = await client
            .from('analyses')
            .select('*')
            .eq('id', analysisId)
            .eq('user_id', user.id) // Security: Ensure user owns the analysis
            .single()

        if (error || !analysis) {
            throw createError({ statusCode: 404, message: 'Analysis not found' })
        }

        // [SECURITY FIX M4] Strip debug info for non-admin users
        const sanitizedAnalysis = {
            ...analysis,
            summary_json: sanitizeAnalysisSummary(analysis.summary_json, userContext.isAdmin)
        }

        return {
            success: true,
            analysis: sanitizedAnalysis
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to fetch status'
        }
    }
})
