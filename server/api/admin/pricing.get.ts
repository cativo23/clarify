import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig()
        const supabase = createClient(process.env.SUPABASE_URL || '', config.supabaseServiceKey)

        const { data, error } = await supabase
            .from('pricing_tables')
            .select('*')

        if (error) {
            throw error
        }

        return { pricing: data || [] }
    } catch (err: any) {
        event.node.res.statusCode = err?.status || 500
        return { error: err?.message || 'Failed to fetch pricing' }
    }
})
