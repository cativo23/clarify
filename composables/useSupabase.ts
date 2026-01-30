import type { User, Analysis, Transaction } from '~/types'



// Fetch user profile with credits
export const useUserProfile = async () => {
    const client = useSupabaseClient()
    const user = useSupabaseUser()

    if (!user.value?.id) return null

    const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', user.value.id)
        .single()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }

    return data as User
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

    const { data, error } = await client.storage
        .from('contracts')
        .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = client.storage
        .from('contracts')
        .getPublicUrl(fileName)

    return publicUrl
}
