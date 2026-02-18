import type { User, Analysis } from '~/types'

// Cache TTL for user profile (5 minutes)
const USER_PROFILE_CACHE_TTL = 5 * 60 * 1000

// Shared state for credits
export const useCreditsState = () => useState<number>('user-credits', () => 0)
// Shared state for full user profile (including is_admin)
export const useUserState = () => useState<User | null>('user-profile', () => null)
// Track last fetch time for cache invalidation
export const useUserStateLastFetch = () => useState<number>('user-profile-last-fetch', () => 0)

// Check if cached user profile is stale
export const isUserProfileStale = (): boolean => {
    const lastFetch = useUserStateLastFetch()
    return Date.now() - lastFetch.value > USER_PROFILE_CACHE_TTL
}

// Fetch user profile with credits and admin status
export const fetchUserProfile = async (forceRefresh = false) => {
    const user = useSupabaseUser()
    const creditsState = useCreditsState()
    const userState = useUserState()
    const lastFetch = useUserStateLastFetch()
    // Capture client and router at start to preserve context
    const supabase = useSupabaseClient()
    const router = useRouter()

    if (!user.value?.id) return null

    // Skip fetch if cache is still valid (unless force refresh)
    if (!forceRefresh && !isUserProfileStale() && userState.value) {
        return userState.value
    }

    try {
        const profile = await $fetch<User>('/api/user/profile', {
            headers: useRequestHeaders(['cookie']) as any
        })
        if (profile) {
            creditsState.value = profile.credits
            userState.value = profile
            lastFetch.value = Date.now() // Update cache timestamp
            return profile
        }
    } catch (error: any) {
        console.error('Error fetching user profile:', error)
        if (error.statusCode === 401 || error.response?.status === 401) {
            // Token invalid, force logout using captive client
            await supabase.auth.signOut()
            userState.value = null
            lastFetch.value = 0
            // Use captured router for navigation
            return router.push('/login')
        }
    }

    return null
}

// Fetch user's analyses
export const useUserAnalyses = async () => {
    const user = useSupabaseUser()

    if (!user.value?.id) return []

    try {
        // [SECURITY FIX M4] Use API endpoint instead of direct Supabase query
        // This ensures debug info is stripped for non-admin users
        const { data, error } = await $fetch('/api/analyses')

        if (error) {
            console.error('Error fetching analyses:', error)
            return []
        }

        return data.analyses || []
    } catch (error: any) {
        console.error('Error fetching analyses:', error)
        return []
    }
}


// Save analysis to database
export const saveAnalysis = async (analysis: Omit<Analysis, 'id' | 'created_at'>) => {
    const client = useSupabaseClient()

    const { data, error } = await client
        .from('analyses')
        .insert(analysis)
        .select()
        .single()

    if (error) throw error

    return data as Analysis
}

// Upload file to Supabase Storage
export const uploadContractFile = async (file: File) => {
    const client = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) throw new Error('User not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.value.id}/${Date.now()}.${fileExt}`

    const { data: _uploadData, error } = await client.storage
        .from('contracts')
        .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = client.storage
        .from('contracts')
        .getPublicUrl(fileName)

    return publicUrl
}
