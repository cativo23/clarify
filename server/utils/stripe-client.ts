import Stripe from 'stripe'

export const createStripeClient = () => {
    const config = useRuntimeConfig()

    const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2024-12-18.acacia',
    })

    return stripe
}

// Credit packages
export const CREDIT_PACKAGES = [
    {
        id: 'pack_5',
        credits: 5,
        price: 4.99,
        priceId: 'price_5credits', // Replace with actual Stripe Price ID
        popular: false,
    },
    {
        id: 'pack_10',
        credits: 10,
        price: 8.99,
        priceId: 'price_10credits',
        popular: true,
    },
    {
        id: 'pack_25',
        credits: 25,
        price: 19.99,
        priceId: 'price_25credits',
        popular: false,
    },
]

export const createCheckoutSession = async (
    userId: string,
    packageId: string,
    successUrl: string,
    cancelUrl: string
) => {
    const stripe = createStripeClient()
    const pack = CREDIT_PACKAGES.find(p => p.id === packageId)

    if (!pack) {
        throw new Error('Invalid package')
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: pack.priceId,
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
            user_id: userId,
            credits: pack.credits.toString(),
        },
    })

    return session
}

// Update user credits in database
export const updateUserCreditsInDb = async (userId: string, credits: number) => {
    const config = useRuntimeConfig()
    const { createClient } = await import('@supabase/supabase-js')

    // Create a Supabase client with the SERVICE KEY to bypass RLS
    // This provides admin access to update any user's data
    const supabaseAdmin = createClient(
        config.public.supabase.url,
        config.supabaseServiceKey
    )

    // First get current credits
    const { data: user, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single()

    if (fetchError) {
        console.error(`Error fetching user ${userId}:`, fetchError)
        return false
    }

    const currentCredits = user?.credits || 0
    const newCredits = currentCredits + credits

    // Update credits
    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ credits: newCredits })
        .eq('id', userId)

    if (updateError) {
        console.error(`Error updating credits for user ${userId}:`, updateError)
        return false
    }

    console.log(`Successfully added ${credits} credits to user ${userId}. New balance: ${newCredits}`)
    // Log transaction
    await supabaseAdmin
        .from('transactions')
        .insert({
            user_id: userId,
            amount: 0, // We don't have the amount here easily available without more logic, typically price
            credits: credits,
            type: 'purchase',
            description: `Purchase of ${credits} credits via Stripe`
        })

    return true
}

export const handleWebhookEvent = async (event: Stripe.Event) => {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session

            // Extract user ID and credits from metadata
            const userId = session.metadata?.user_id
            const credits = parseInt(session.metadata?.credits || '0')

            if (userId && credits > 0) {
                await updateUserCreditsInDb(userId, credits)
            }
            break
        }

        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            console.log('PaymentIntent succeeded:', paymentIntent.id)
            break
        }

        default:
            console.log(`Unhandled event type: ${event.type}`)
    }
}
