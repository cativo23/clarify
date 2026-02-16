import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { clearConfigCache } from '../../utils/config'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)

    // Auth Check
    const config = useRuntimeConfig()
    const adminEmail = config.public.adminEmail

    if (!user || user.email !== adminEmail) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized',
        })
    }

    const body = await readBody(event)
    // Use Service Role to bypass RLS policies
    const client = await serverSupabaseServiceRole(event)


    // Validation (Basic) - expect new `tiers` shape
    if (!body || !body.promptVersion || !body.tiers || !body.tiers.basic || !body.tiers.premium || !body.tiers.forensic) {
        throw createError({
            statusCode: 400,
            message: 'Invalid configuration object; expected promptVersion and tiers.{basic,premium,forensic}',
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
