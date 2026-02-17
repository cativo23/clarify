import Stripe from 'stripe'
import { handleApiError } from '~/server/utils/error-handler'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2025-02-24.acacia',
    })

    // Get raw body
    const body = await readRawBody(event)
    const signature = getHeader(event, 'stripe-signature')

    if (!body || !signature) {
        throw createError({
            statusCode: 400,
            message: 'Invalid webhook request',
        })
    }

    try {
        // Verify webhook signature
        const stripeEvent = stripe.webhooks.constructEvent(
            body,
            signature,
            config.stripeWebhookSecret
        )

        // Handle the event
        await handleWebhookEvent(stripeEvent)

        return { received: true }
    } catch (error: any) {
        // [SECURITY FIX H3] Don't expose Stripe error details or webhook secrets
        handleApiError(error, {
            endpoint: '/api/stripe/webhook',
            operation: 'stripe_webhook_verification'
        })
    }
})
