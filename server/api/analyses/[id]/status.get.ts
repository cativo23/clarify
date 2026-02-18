import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { sanitizeAnalysisSummary, getRequestUserContext, isTokenDebugEnabled } from '../../../utils/analysis-security'
import { applyRateLimit, RateLimitPresets } from '~/server/utils/rate-limit'
import { handleApiError } from '~/server/utils/error-handler'

export default defineEventHandler(async (event) => {
    try {
        // [SECURITY FIX M1] Rate limiting to prevent information disclosure and DoS
        await applyRateLimit(event, RateLimitPresets.standard, 'user')

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

        // Check if tokenDebug is enabled (development/testing mode)
        const tokenDebug = await isTokenDebugEnabled()

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

        // Strip debug info for non-admin users (unless tokenDebug enabled)
        const sanitizedAnalysis = {
            ...analysis,
            summary_json: sanitizeAnalysisSummary(analysis.summary_json, userContext.isAdmin, tokenDebug)
        }

        return {
            success: true,
            analysis: sanitizedAnalysis
        }
    } catch (error: any) {
        handleApiError(error, {
            userId: user?.id,
            endpoint: '/api/analyses/[id]/status',
            operation: 'get_analysis_status'
        })
    }
})
