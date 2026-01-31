import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

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

        return {
            success: true,
            analysis
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to fetch status'
        }
    }
})
