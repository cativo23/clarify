import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { getPromptConfig } from '../../utils/config'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const client = await serverSupabaseServiceRole(event)
    // Force fresh read for admin panel to avoid stale cache
    const promptConfig = await getPromptConfig(client, true)

    return promptConfig
})
