import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const client = await serverSupabaseServiceRole(event)

    // Return a summary per user from the view: id, email, credits, analyses_count, last_analysis_at
    const { data, error } = await client
        .from('admin_users_summary')
        .select('*')

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return { users: data || [] }
})
