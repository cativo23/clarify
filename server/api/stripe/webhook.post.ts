import Stripe from 'stripe'


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
            message: 'Missing body or signature',
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
        console.error('Webhook error:', error.message)
        throw createError({
            statusCode: 400,
            message: `Webhook Error: ${error.message}`,
        })
    }
})
