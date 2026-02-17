import { serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Checks if the current user is an admin based on email
 * @param event - The H3 event
 * @returns true if user is authenticated and is admin, false otherwise
 */
export async function isAdminUser(event: H3Event): Promise<boolean> {
    const user = await serverSupabaseUser(event)

    if (!user || !user.email) {
        return false
    }

    const config = useRuntimeConfig()
    const adminEmail = config.adminEmail

    if (!adminEmail) {
        return false
    }

    return user.email === adminEmail
}

/**
 * Verifies admin access and throws 401 if not authorized
 * @param event - The H3 event
 * @throws 401 error if user is not admin
 */
export async function requireAdmin(event: H3Event): Promise<void> {
    const is_admin = await isAdminUser(event)

    if (!is_admin) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }
}
