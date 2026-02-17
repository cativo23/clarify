import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const client = await serverSupabaseServiceRole(event)
    const userId = getRouterParam(event, 'id')

    if (!userId) {
        throw createError({ statusCode: 400, message: 'Missing user id' })
    }

    // Fetch user profile
    const { data: profile, error: pErr } = await client.from('users').select('*').eq('id', userId).single()
    if (pErr) {
        throw createError({ statusCode: 500, message: pErr.message })
    }

    // Fetch analyses for user
    const { data: analyses, error: aErr } = await client
        .from('analyses')
        .select('id, status, risk_level, created_at, summary_json')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (aErr) {
        throw createError({ statusCode: 500, message: aErr.message })
    }

    return { profile, analyses: analyses || [] }
})
