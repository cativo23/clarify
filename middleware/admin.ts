import { useSupabaseUser, useUserState, isUserProfileStale, fetchUserProfile } from '~/composables/useSupabase'

export default defineNuxtRouteMiddleware(async (_to, _from) => {
    const user = useSupabaseUser()

    // 1. Check Authentication
    if (!user.value) {
        return navigateTo('/login')
    }

    // 2. Check Admin Access via Profile State
    const userState = useUserState()

    // [SECURITY FIX M4] Refresh profile if stale or not loaded
    // Ensures admin status is checked against fresh data
    if (!userState.value || isUserProfileStale()) {
        await fetchUserProfile(true) // Force refresh
    }

    const isAdmin = userState.value?.is_admin

    if (!isAdmin) {
        // Redirect to dashboard or error page if not authorized
        console.warn('Unauthorized access attempt to admin area by:', user.value.email)
        return navigateTo('/')
    }
})
