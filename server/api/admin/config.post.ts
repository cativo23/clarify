import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { clearConfigCache } from '../../utils/config'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)

    // Auth Check
    const config = useRuntimeConfig()
    const adminEmail = config.public.adminEmail

    if (!adminEmail || user.email !== adminEmail) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized',
        })
    }

    const body = await readBody(event)
    // Use Service Role to bypass RLS policies
    const client = await serverSupabaseServiceRole(event)

    // Validation (Basic)
    if (!body || !body.promptVersion || !body.models || !body.tokenLimits) {
        throw createError({
            statusCode: 400,
            message: 'Invalid configuration object',
        })
    }

    const { error } = await client
        .from('configurations')
        .upsert({
            key: 'prompt_settings',
            value: body,
            updated_by: user.id
        }, { onConflict: 'key' })

    if (error) {
        throw createError({
            statusCode: 500,
            message: error.message,
        })
    }


    clearConfigCache()

    return { success: true }
})
