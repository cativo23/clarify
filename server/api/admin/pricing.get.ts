import { requireAdmin } from '../../utils/auth'
import { getAdminSupabaseClient } from '../../utils/admin-supabase'

export default defineEventHandler(async (event) => {
    // [SECURITY FIX C4] Require admin authentication
    await requireAdmin(event)

    const admin = getAdminSupabaseClient()
    const result = await admin.getPricingTables()

    if (result.error) {
        throw createError({ statusCode: 500, message: result.error })
    }

    return { pricing: result.data || [] }
})
