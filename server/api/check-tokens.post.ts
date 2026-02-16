import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { extractTextFromPDF } from '~/server/utils/pdf-parser'
import { preprocessDocument } from '~/server/utils/preprocessing'
import { getPromptConfig } from '~/server/utils/config'

export default defineEventHandler(async (event) => {
    try {
        const user = await serverSupabaseUser(event)
        if (!user) {
            throw createError({ statusCode: 401, message: 'Unauthorized' })
        }

        const body = await readBody(event)
        const { file_url } = body

        if (!file_url) {
            throw createError({ statusCode: 400, message: 'Missing file_url' })
        }

        // 1. Download file from Storage
        const client = await serverSupabaseClient(event)

        // Extract storage path from file_url (assuming standard Supabase URL format)
        // .../storage/v1/object/public/contracts/USER_ID/FILENAME.pdf
        const filename = file_url.split('/').pop() || ''
        const storagePath = `${user.id}/${filename}`

        const { data: fileData, error: downloadError } = await client.storage
            .from('contracts')
            .download(storagePath)

        if (downloadError || !fileData) {
            throw createError({ statusCode: 500, message: `Failed to download file: ${downloadError?.message}` })
        }

        // 2. Extract Text
        const buffer = Buffer.from(await fileData.arrayBuffer())
        const text = await extractTextFromPDF(buffer)

        if (!text || text.trim().length === 0) {
            return {
                tokens: 0,
                canProcessBasic: false,
                canProcessPremium: false,
                message: 'No text found in document (possible image scan).'
            }
        }

        // 3. Get Limits
        const config = await getPromptConfig(client)
        const { tiers } = config

        // 4. Calculate Tokens
        // Basic Check
        const basicLimit = tiers.basic.tokenLimits.input

        // Premium Check
        const premiumLimit = tiers.premium.tokenLimits.input

        // Just run full count, reusing preprocessDocument to count
        const fullResult = preprocessDocument(text, 1000000)
        const totalTokens = fullResult.originalTokenCount

        return {
            success: true,
            originalTokens: totalTokens,
            estimatedCost: 0,
            limits: {
                basic: basicLimit,
                premium: premiumLimit
            },
            fitsInBasic: totalTokens <= basicLimit,
            fitsInPremium: totalTokens <= premiumLimit,
            suggestion: totalTokens > basicLimit ? 'premium' : 'basic'
        }

    } catch (error: any) {
        console.error('Error checking tokens:', error)
        return {
            success: false,
            error: error.message
        }
    }
})
