import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Normalizes email for safe comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Applies Unicode NFKC normalization to prevent homograph attacks
 * @param email - The email to normalize
 * @returns Normalized email string
 */
function normalizeEmail(email: string): string {
    return email
        .toLowerCase()
        .trim()
        .normalize('NFKC') // Unicode normalization to prevent homograph attacks
}

/**
 * Checks if the current user is an admin based on email
 *
 * [SECURITY FIX H1] Implements defense-in-depth against admin auth bypass:
 * - Case-insensitive email comparison
 * - Unicode NFKC normalization prevents homograph attacks (e.g., Cyrillic 'а')
 * - Checks both config.adminEmail AND admin_emails database table
 *
 * @param event - The H3 event
 * @returns true if user is authenticated and is admin, false otherwise
 */
export async function isAdminUser(event: H3Event): Promise<boolean> {
    const user = await serverSupabaseUser(event)

    if (!user || !user.email) {
        return false
    }

    const config = useRuntimeConfig()
    const adminEmailConfig = config.adminEmail

    // Normalize user's email for comparison
    const userEmail = normalizeEmail(user.email)

    // Check 1: Compare against config.adminEmail (normalized)
    if (adminEmailConfig) {
        const normalizedAdminEmail = normalizeEmail(adminEmailConfig)
        if (userEmail === normalizedAdminEmail) {
            return true
        }
    }

    // Check 2: [Defense in Depth] Query admin_emails table for additional admins
    // This allows multiple admins without hardcoding emails in config
    try {
        const supabase = await serverSupabaseClient(event)
        const { data, error } = await supabase
            .from('admin_emails')
            .select('email')
            .eq('email', userEmail)
            .eq('is_active', true)
            .maybeSingle()

        if (error) {
            // Log but don't fail - table might not exist yet
            console.debug('[Auth] admin_emails table query:', error.message)
            return !!adminEmailConfig && userEmail === normalizeEmail(adminEmailConfig)
        }

        return !!data
    } catch (dbError) {
        // Database error - fall back to config-only check
        console.error('[Auth] Database error checking admin_emails:', dbError)
        return !!adminEmailConfig && userEmail === normalizeEmail(adminEmailConfig)
    }
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
