export default defineNuxtRouteMiddleware((_to, _from) => {
    const user = useSupabaseUser()

    // If not authenticated, redirect to login
    if (!user.value) {
        return navigateTo('/login')
    }
})
