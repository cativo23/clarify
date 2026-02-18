# Stripe Setup Guide

To enable payments and credit top-ups in Clarify, you must configure your Stripe account and update the environment variables.

## 1. Obtain API Keys

1.  Go to the [Stripe Dashboard](https://dashboard.stripe.com/).
2.  Enable **Test Mode** (toggle in the top-right corner).
3.  Navigate to **Developers** > **API keys**.
4.  Copy the `Publishable key` and `Secret key`.
5.  Add them to your `.env` file:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 2. Create Products (Credit Packages)

You need to create 3 products in Stripe to match the packages in the application.

1.  Go to **Product catalog** > **Add product**.
2.  **Basic Pack (5 Credits)**:
    - **Name**: 5 Clarify Credits
    - **Price**: 4.99 USD
    - **Billing**: One-time
3.  **Popular Pack (10 Credits)**:
    - **Name**: 10 Clarify Credits
    - **Price**: 8.99 USD
    - **Billing**: One-time
4.  **Pro Pack (25 Credits)**:
    - **Name**: 25 Clarify Credits
    - **Price**: 19.99 USD
    - **Billing**: One-time

### Copy Price IDs

After creating each product, copy the **API ID** of the *Price* (starts with `price_...`) and update the `server/utils/stripe-client.ts` file:

```typescript
// server/utils/stripe-client.ts

export const CREDIT_PACKAGES = [
    {
        id: 'pack_5',
        // ...
        priceId: 'price_XXXXXX', // <-- Paste the 5-credit price ID here
    },
    {
        id: 'pack_10',
        // ...
        priceId: 'price_XXXXXX', // <-- Paste the 10-credit price ID here
    },
    {
        id: 'pack_25',
        // ...
        priceId: 'price_XXXXXX', // <-- Paste the 25-credit price ID here
    },
]
```

## 3. Configure Webhooks

The webhook ensures that credits are added to the user's account automatically after a successful payment.

### Local Development (Stripe CLI)

1.  [Install the Stripe CLI](https://stripe.com/docs/stripe-cli).
2.  Login: `stripe login`
3.  Start the listener:
    ```bash
    stripe listen --forward-to localhost:3001/api/stripe/webhook
    ```
4.  Copy the **Webhook Signing Secret** (starts with `whsec_...`).
5.  Add it to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Production

1.  Go to **Developers** > **Webhooks** in the Stripe Dashboard.
2.  Click **Add endpoint**.
3.  **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
4.  **Events to send**: Select `checkout.session.completed`.
5.  Copy the **Signing secret** and add it to your production environment variables.
