import Stripe from 'stripe'
import { handleApiError } from '~/server/utils/error-handler'
import { handleWebhookEvent } from '~/server/utils/stripe-client'
import { applyRateLimit, RateLimitPresets } from '~/server/utils/rate-limit'

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

    // [SECURITY FIX #3] Rate limit webhook endpoint to prevent abuse
    try {
        await applyRateLimit(event, RateLimitPresets.payment, 'ip')
    } catch {
        // Rate limit exceeded - log but don't expose details
        console.warn('[SECURITY] Webhook rate limit exceeded from IP:', event.context.clientIp)
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
        // [SECURITY FIX #3] Alert on signature verification failures
        if (error.type === 'StripeSignatureVerificationError') {
            console.error('[SECURITY ALERT] Webhook signature verification failed', {
                timestamp: new Date().toISOString(),
                signature: signature?.substring(0, 20) + '...',
                ip: event.context.clientIp
            })
        }

        // [SECURITY FIX H3] Don't expose Stripe error details or webhook secrets
        handleApiError(error, {
            endpoint: '/api/stripe/webhook',
            operation: 'stripe_webhook_verification'
        })
    }
})
