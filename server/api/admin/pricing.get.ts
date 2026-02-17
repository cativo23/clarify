import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const supabase = serverSupabaseServiceRole(event)

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
