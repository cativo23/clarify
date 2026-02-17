import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { User } from '~/types'

export default defineEventHandler(async (event) => {
    let user
    try {
        user = await serverSupabaseUser(event)
    } catch (error) {
        console.error('Error in profile.get.ts - serverSupabaseUser failed:', error)
        throw createError({
            statusCode: 401,
            message: 'Unauthorized: Session missing or invalid',
        })
    }

    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized',
        })
    }

    const client = await serverSupabaseClient(event)

    // Try to get user profile
    let { data: profile } = await client
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    // If not found (or error), try to create/sync it
    if (!profile) {
        console.log('User profile not found, creating syncd record for:', user.id)

        const newProfile = {
            id: user.id,
            email: user.email,
            credits: 3, // Default starting credits
        }

        // Use Service Role to bypass RLS during creation
        const supabaseAdmin = serverSupabaseServiceRole(event)

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
        profile = createdProfile
    }

    const finalProfile = {
        ...profile,
        is_admin: user.email ? (user.email === useRuntimeConfig().adminEmail) : false
    }

    return finalProfile as User
})
