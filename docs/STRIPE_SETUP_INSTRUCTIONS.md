# Stripe Setup Instructions

## Prerequisites

Before configuring the Clarify application with Stripe, you'll need to:

1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Obtain your API keys from the Stripe Dashboard
3. Install the Stripe CLI for local webhook testing (optional but recommended)

## Step 1: Create Credit Packages in Stripe Dashboard

### 1.1 Create Individual Products and Prices

In your Stripe Dashboard, you need to create individual prices for each credit package:

**For 5 Credits ($4.99):**
- Go to Products > Create product
- Product name: "5 Credits Package"
- Pricing: One-time payment
- Price: $4.99 USD
- Save the resulting Price ID (format: `price_XXXXXXXXXXXXXXX`)

**For 10 Credits ($8.99):**
- Go to Products > Create product
- Product name: "10 Credits Package"
- Pricing: One-time payment
- Price: $8.99 USD (mark as popular)
- Save the resulting Price ID (format: `price_XXXXXXXXXXXXXXX`)

**For 25 Credits ($19.99):**
- Go to Products > Create product
- Product name: "25 Credits Package"
- Pricing: One-time payment
- Price: $19.99 USD
- Save the resulting Price ID (format: `price_XXXXXXXXXXXXXXX`)

### 1.2 Using Your Existing Product IDs

Based on the product IDs you provided:
- 5 credits: `prod_U5Cnr6Ap3EEMRi`
- 10 credits: `prod_U5CoJApTkeFoaZ`
- 25 credits: `prod_U5CoyWM9uTAemH`

You'll need to check if these products already have prices associated with them. If so, you'll need to find the corresponding Price IDs in your Stripe Dashboard:

1. Go to Products in your Stripe Dashboard
2. Find each of your products
3. Look for the associated Prices under each product
4. Copy the Price ID (starts with `price_`) for each credit package

You already have the prices created with these IDs:
- 5 credits: `price_1T72OFBSsmi2pAzgSUOz2R9j`
- 10 credits: `price_1T72OcBSsmi2pAzgTwyIdfA2`
- 25 credits: `price_1T72OwBSsmi2pAzgQ0838mN0`

These are the Price IDs you need to use in your environment variables.

## Step 2: Configure Environment Variables

Update your `.env` file with the actual values:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
STRIPE_PRICE_ID_5_CREDITS=price_ACTUAL_PRICE_ID_FOR_5_CREDITS    # Replace with actual Price ID
STRIPE_PRICE_ID_10_CREDITS=price_ACTUAL_PRICE_ID_FOR_10_CREDITS # Replace with actual Price ID
STRIPE_PRICE_ID_25_CREDITS=price_ACTUAL_PRICE_ID_FOR_25_CREDITS # Replace with actual Price ID
```

## Step 3: Set Up Webhooks

### 3.1 Production Webhook

In your Stripe Dashboard:
- Go to Developers > Webhooks
- Click "Add endpoint"
- Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
- Select events to listen for: `checkout.session.completed`
- Save the webhook endpoint
- Copy the webhook signing secret

### 3.2 Local Development Webhook (Optional)

For local development, you can use the Stripe CLI:

```bash
# Install Stripe CLI
# Follow instructions at https://stripe.com/docs/stripe-cli

# Listen for webhook events and forward to your local server
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

The webhook signing secret from this command should be added to your local `.env` file.

## Step 4: Test the Integration

### 4.1 Frontend Testing
1. Start your application: `npm run dev`
2. Navigate to `/credits` page
3. You should see the three credit packages with correct pricing
4. Click "Comprar Ahora" on any package

### 4.2 Payment Testing
- Use Stripe test card: `4242 4242 4242 4242`
- Any future date for expiration
- Any 3-digit CVC
- Any postal code

### 4.3 Backend Testing
- After successful payment, check that credits are added to the user account
- Verify that transactions are recorded in the database
- Confirm webhook events are processed correctly

## Troubleshooting

### Common Issues

1. **Invalid Price ID Error**
   - Ensure you're using Price IDs (format: `price_XXXXXXXXXXXXXXX`), not Product IDs
   - Check that the Price ID exists in your Stripe account

2. **Webhook Signature Verification Failure**
   - Verify the webhook secret matches between your Stripe Dashboard and `.env` file
   - For local development, ensure you're using the webhook secret from `stripe listen`

3. **Redirect URL Errors**
   - Ensure ALLOWED_REDIRECT_ORIGINS in your `.env` file includes your domain
   - For local development: `ALLOWED_REDIRECT_ORIGINS=http://localhost:3001`

4. **Payment Not Completing**
   - Check browser console for JavaScript errors
   - Verify API endpoints are accessible
   - Review server logs for backend errors

## Security Notes

- Never commit your actual API keys to version control
- Use environment variables for all sensitive data
- Ensure webhook endpoints are properly secured
- Regularly rotate your webhook secrets