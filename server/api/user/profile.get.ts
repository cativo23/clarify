import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { User } from '~/types'
import { handleApiError } from '../../utils/error-handler'
import { applyRateLimit, RateLimitPresets } from '~/server/utils/rate-limit'
import { isAdminUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    let user
    try {
        // [SECURITY FIX M1] Rate limiting to prevent user enumeration and DoS
        await applyRateLimit(event, RateLimitPresets.standard, 'user')

        user = await serverSupabaseUser(event)

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
            console.log('User profile not found, creating synced record for:', user.id)

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

                // Check if it's an email verification issue
                if (insertError.message?.includes('email') ||
                    insertError.code === '42501') {
                    throw createError({
                        statusCode: 403,
                        message: 'Please verify your email address before logging in. Check your inbox for the confirmation link.',
                        data: {
                            code: 'EMAIL_NOT_VERIFIED',
                            email: user.email
                        }
                    })
                }

                throw createError({
                    statusCode: 500,
                    message: 'Failed to create user profile',
                })
            }
            profile = createdProfile
        }

        const finalProfile = {
            ...profile,
            is_admin: await isAdminUser(event)
        }

        return finalProfile as User
    } catch (error: any) {
        handleApiError(error, {
            userId: user?.id,
            endpoint: '/api/user/profile',
            operation: 'get_or_create_profile'
        })
    }
})
