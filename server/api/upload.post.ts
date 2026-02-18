import type { UploadResponse } from '../../types'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { validateFileUpload, logFileValidation } from '../utils/file-validation'
import { handleApiError } from '~/server/utils/error-handler'

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
        if (!fileEntry) {
            throw createError({
                statusCode: 400,
                message: 'No file found in upload',
            })
        }
        const fileName = fileEntry.filename || 'contract.pdf'
        const fileBuffer = fileEntry.data

        // [SECURITY FIX H2] Comprehensive file validation with magic byte checking
        const validation = validateFileUpload(fileBuffer, fileName, {
            maxSizeMB: 10,
            allowedExtensions: ['pdf']
        })

        // Log validation for security auditing
        logFileValidation(fileName, fileBuffer.length, validation, user.id)

        if (!validation.isValid) {
            throw createError({
                statusCode: 400,
                message: validation.error,
            })
        }

        // Get Supabase client
        const client = await serverSupabaseClient(event)

        // Generate unique file name
        const fileExt = validation.file?.detectedExtension || 'pdf'
        const uniqueFileName = `${user.id}/${Date.now()}.${fileExt}`

        // Upload to Supabase Storage with correct content type
        const { data: _uploadData, error } = await client.storage
            .from('contracts')
            .upload(uniqueFileName, fileBuffer, {
                contentType: validation.file?.detectedType || 'application/pdf',
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

        console.log('[Upload] File validated and uploaded successfully:', {
            userId: user.id,
            fileName,
            detectedType: validation.file?.detectedType,
            fileSize: validation.file?.size
        })

        return {
            success: true,
            file_url: publicUrl,
        }
    } catch (error: any) {
        console.error('Error in upload endpoint:', error)
        handleApiError(error, {
            userId: user?.id,
            endpoint: '/api/upload',
            operation: 'upload_file'
        })
    }
})
