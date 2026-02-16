import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { getPromptConfig } from '../../utils/config'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)

    // Auth Check
    const runtimeConfig = useRuntimeConfig()
    const adminEmail = runtimeConfig.public.adminEmail

    if (!user || user.email !== adminEmail) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized',
        })
    }

    // Reuse utility which handles fetching/caching
    // Use Service Role to bypass RLS policies (since we already verified admin email)
    const client = await serverSupabaseServiceRole(event)
    // Force fresh read for admin panel to avoid stale cache
    const promptConfig = await getPromptConfig(client, true)

    return promptConfig
})
