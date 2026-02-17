import type { User, Analysis } from '~/types'



// Shared state for credits
export const useCreditsState = () => useState<number>('user-credits', () => 0)
// Shared state for full user profile (including is_admin)
export const useUserState = () => useState<User | null>('user-profile', () => null)

// Fetch user profile with credits and admin status
export const fetchUserProfile = async () => {
    const user = useSupabaseUser()
    const creditsState = useCreditsState()
    const userState = useUserState()
    // Capture client and router at start to preserve context
    const supabase = useSupabaseClient()
    const router = useRouter()

    if (!user.value?.id) return null

    try {
        const profile = await $fetch<User>('/api/user/profile', {
            headers: useRequestHeaders(['cookie']) as any
        })
        if (profile) {
            creditsState.value = profile.credits
            userState.value = profile
            return profile
        }
    } catch (error: any) {
        console.error('Error fetching user profile:', error)
        if (error.statusCode === 401 || error.response?.status === 401) {
            // Token invalid, force logout using captive client
            await supabase.auth.signOut()
            userState.value = null
            // Use captured router for navigation
            return router.push('/login')
        }
    }

    return null
}

// Fetch user's analyses
export const useUserAnalyses = async () => {
    const client = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) return []

    const { data, error } = await client
        .from('analyses')
        .select('*')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching analyses:', error)
        return []
    }

    return data as Analysis[]
}

// Update user credits
export const updateUserCredits = async (credits: number) => {
    const client = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) throw new Error('User not authenticated')

    const { data, error } = await client
        .from('users')
        .update({ credits })
        .eq('id', user.value.id)
        .select()
        .single()

    if (error) throw error

    return data as User
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
