import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const user = await serverSupabaseUser(event)

        if (!user) {
            throw createError({
                statusCode: 401,
                message: 'Unauthorized',
            })
        }

        const body = await readBody(event)
        const { packageId, successUrl, cancelUrl } = body

        if (!packageId || !successUrl || !cancelUrl) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields',
            })
        }

        const session = await createCheckoutSession(
            user.id,
            packageId,
            successUrl,
            cancelUrl
        )

        return {
            success: true,
            data: {
                sessionId: session.id,
            },
        }
    } catch (error: any) {
        console.error('Error creating checkout session:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create checkout session',
        })
    }
})
