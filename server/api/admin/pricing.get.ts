import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    // [SECURITY FIX C4] Require admin authentication
    await requireAdmin(event)

    const supabase = serverSupabaseServiceRole(event)

    const { data, error } = await supabase
        .from('pricing_tables')
        .select('*')

    if (error) {
        throw createError({ statusCode: 500, message: error.message })
    }

    return { pricing: data || [] }
})
