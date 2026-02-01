export default defineNuxtRouteMiddleware((_to, _from) => {
    const user = useSupabaseUser()

    // 1. Check Authentication
    if (!user.value) {
        return navigateTo('/login')
    }

    // 2. Check Admin Access via Email
    const config = useRuntimeConfig()
    const adminEmail = config.public.adminEmail

    if (!adminEmail || user.value.email !== adminEmail) {
        // Redirect to dashboard or error page if not authorized
        console.warn('Unauthorized access attempt to admin area by:', user.value.email)
        return navigateTo('/')
    }
})
