import { createClient } from '@supabase/supabase-js'

export interface TierInfo {
    model: string
    credits: number
    tokenLimits: { input: number; output: number }
}

export interface PromptConfig {
    promptVersion: 'v1' | 'v2'
    tiers: {
        basic: TierInfo
        premium: TierInfo
        forensic: TierInfo
    }
    features: {
        preprocessing: boolean
        tokenDebug: boolean
    }
}

// Default config failover matching v1 hardcoded values and new defaults
const DEFAULT_CONFIG: PromptConfig = {
    promptVersion: 'v2',
    tiers: {
        basic: {
            model: 'gpt-4o-mini',
            credits: 1,
            tokenLimits: { input: 8000, output: 2500 },
        },
        premium: {
            model: 'gpt-5-mini',
            credits: 3,
            tokenLimits: { input: 35000, output: 10000 },
        },
        forensic: {
            model: 'gpt-5',
            credits: 10,
            tokenLimits: { input: 120000, output: 30000 },
        },
    },
    features: {
        preprocessing: true,
        tokenDebug: true,
    },
}

let cachedConfig: PromptConfig | null = null
let lastFetchTime = 0
const CACHE_TTL = 60 * 1000 // 1 minute

export const clearConfigCache = () => {
    cachedConfig = null
    lastFetchTime = 0
}

export const getPromptConfig = async (supabaseClient?: any, forceRefresh = false): Promise<PromptConfig> => {
    const now = Date.now()
    if (!forceRefresh && cachedConfig && now - lastFetchTime < CACHE_TTL) {
        return cachedConfig
    }

    try {
        let client = supabaseClient
        if (!client) {
            // Helper to get admin client if not provided (e.g. inside a utility not passed one)
            const config = useRuntimeConfig()
            client = createClient(
                process.env.SUPABASE_URL || '',
                config.supabaseServiceKey
            )
        }

        const { data, error } = await client
            .from('configurations')
            .select('value')
            .eq('key', 'prompt_settings')
            .limit(1)

        if (error) {
            // If table doesn't exist or row missing, warn and return default
            console.warn('Failed to fetch prompt config (using default):', error.message)
            return DEFAULT_CONFIG
        }

        if (!data || data.length === 0) {
            return DEFAULT_CONFIG
        }

        cachedConfig = data[0].value as PromptConfig
        lastFetchTime = now
        return cachedConfig
    } catch (err: any) {
        console.error('Error in getPromptConfig:', err)
        return DEFAULT_CONFIG
    }
}
