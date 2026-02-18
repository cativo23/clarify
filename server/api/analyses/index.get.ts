import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { sanitizeAnalysesList, getRequestUserContext, isTokenDebugEnabled } from '~/server/utils/analysis-security'

export default defineEventHandler(async (event) => {
    try {
        const user = await serverSupabaseUser(event)

        if (!user) {
            throw createError({ statusCode: 401, message: 'Unauthorized' })
        }

        // Get user context including admin status
        const userContext = await getRequestUserContext(event)

        // Check if tokenDebug is enabled (development/testing mode)
        const tokenDebug = await isTokenDebugEnabled()

        const client = await serverSupabaseClient(event)

        // Fetch user's analyses
        const { data: analyses, error } = await client
            .from('analyses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching analyses:', error)
            throw createError({ statusCode: 500, message: 'Failed to fetch analyses' })
        }

        // [SECURITY FIX M4] Strip debug info for non-admin users (unless tokenDebug enabled)
        const sanitizedAnalyses = sanitizeAnalysesList(analyses || [], userContext.isAdmin, tokenDebug)

        return {
            success: true,
            analyses: sanitizedAnalyses
        }
    } catch (error: any) {
        console.error('Error in analyses list endpoint:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch analyses'
        })
    }
})
