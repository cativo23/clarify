import type { UploadResponse } from '../../types'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<UploadResponse> => {
    try {
        // Get user from session
        const user = await serverSupabaseUser(event)

        if (!user) {
            throw createError({
                statusCode: 401,
                message: 'Unauthorized',
            })
        }

        // Parse multipart form data
        const formData = await readMultipartFormData(event)

        if (!formData || formData.length === 0) {
            throw createError({
                statusCode: 400,
                message: 'No file uploaded',
            })
        }

        const fileEntry = formData[0]
        const fileName = fileEntry.filename || 'contract.pdf'
        const fileBuffer = fileEntry.data

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024
        if (fileBuffer.length > maxSize) {
            throw createError({
                statusCode: 400,
                message: 'File size exceeds 10MB limit',
            })
        }

        // Get Supabase client
        const client = await serverSupabaseClient(event)

        // Generate unique file name
        const fileExt = fileName.split('.').pop()
        const uniqueFileName = `${user.id}/${Date.now()}.${fileExt}`

        // Upload to Supabase Storage
        const { data, error } = await client.storage
            .from('contracts')
            .upload(uniqueFileName, fileBuffer, {
                contentType: 'application/pdf',
                upsert: false,
            })

        if (error) {
            console.error('Upload error:', error)
            throw createError({
                statusCode: 500,
                message: 'Failed to upload file',
            })
        }

        // Get public URL
        const { data: { publicUrl } } = client.storage
            .from('contracts')
            .getPublicUrl(uniqueFileName)

        return {
            success: true,
            file_url: publicUrl,
        }
    } catch (error: any) {
        console.error('Error in upload endpoint:', error)

        return {
            success: false,
            error: error.message || 'An error occurred during upload',
        }
    }
})
