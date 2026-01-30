import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { User } from '../../types'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized',
        })
    }

    const client = await serverSupabaseClient(event)

    // Try to get user profile
    const { data: profile, error } = await client
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    // If user exists, return it
    if (profile) {
        return profile as User
    }

    // If not found (or error), try to create/sync it
    // This handles cases where auth exists but public.users record is missing
    console.log('User profile not found, creating syncd record for:', user.id)

    const newProfile = {
        id: user.id,
        email: user.email,
        credits: 3, // Default starting credits
    }

    // Use Service Role to bypass RLS during creation
    const config = useRuntimeConfig()
    const { createClient } = await import('@supabase/supabase-js')

    const supabaseAdmin = createClient(
        config.public.supabase.url,
        config.supabaseServiceKey
    )

    const { data: createdProfile, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(newProfile)
        .select()
        .single()

    if (insertError) {
        console.error('Error creating user profile:', insertError)
        throw createError({
            statusCode: 500,
            message: 'Failed to create user profile',
        })
    }

    return createdProfile as User
})
