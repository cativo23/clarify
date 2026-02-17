export default defineNuxtRouteMiddleware(async (_to, _from) => {
    const user = useSupabaseUser()

    // 1. Check Authentication
    if (!user.value) {
        return navigateTo('/login')
    }

    // 2. Check Admin Access via Profile State
    const userState = useUserState()

    // Race condition fix: If navigating directly to admin URL, profile might not be laoded
    if (!userState.value) {
        await fetchUserProfile()
    }

    const isAdmin = userState.value?.is_admin

    if (!isAdmin) {
        // Redirect to dashboard or error page if not authorized
        console.warn('Unauthorized access attempt to admin area by:', user.value.email)
        return navigateTo('/')
    }
})
