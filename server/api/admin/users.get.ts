import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const runtimeConfig = useRuntimeConfig()
    const adminEmail = runtimeConfig.public.adminEmail

    if (!user || user.email !== adminEmail) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

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
