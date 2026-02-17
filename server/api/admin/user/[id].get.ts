import { requireAdmin } from '../../../utils/auth'
import { getAdminSupabaseClient } from '../../../utils/admin-supabase'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const admin = getAdminSupabaseClient()
    const userId = getRouterParam(event, 'id')

    if (!userId) {
        throw createError({ statusCode: 400, message: 'Missing user id' })
    }

    const result = await admin.getUserWithAnalyses(userId)

    if (result.error) {
        throw createError({ statusCode: 500, message: result.error })
    }

    return { profile: result.profile, analyses: result.analyses || [] }
})
