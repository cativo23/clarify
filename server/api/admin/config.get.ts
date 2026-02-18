import { requireAdmin } from '../../utils/auth'
import { getAdminSupabaseClient } from '../../utils/admin-supabase'
import type { PromptConfig } from '../../utils/config'

const DEFAULT_CONFIG: PromptConfig = {
    promptVersion: 'v2',
    tiers: {
        basic: { model: 'gpt-4o-mini', credits: 1, tokenLimits: { input: 8000, output: 2500 } },
        premium: { model: 'gpt-5-mini', credits: 3, tokenLimits: { input: 35000, output: 10000 } },
        forensic: { model: 'gpt-5', credits: 10, tokenLimits: { input: 120000, output: 30000 } },
    },
    features: { preprocessing: true, tokenDebug: true },
}

export default defineEventHandler(async (event) => {
    await requireAdmin(event)
    const admin = getAdminSupabaseClient()
    
    const result = await admin.getConfig()
    
    if (result.error) {
        console.warn('Failed to fetch prompt config (using default):', result.error)
        return DEFAULT_CONFIG
    }
    
    return result.data || DEFAULT_CONFIG
})
