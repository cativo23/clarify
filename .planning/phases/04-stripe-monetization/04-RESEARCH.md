# Phase 4: Stripe & Monetization - Research

**Researched:** 2026-02-25
**Domain:** Stripe payment integration, credit monetization system
**Confidence:** HIGH

## Summary

The Stripe integration for the Clarify project builds upon an already well-established foundation. The core architecture is in place with server-side checkout sessions, webhook handling with atomic credit updates via PostgreSQL RPC, and comprehensive transaction logging. The system uses a 3-tier analysis strategy (Basic/Premium/Forensic) with credit costs of 1/3/10 credits respectively, and offers fixed-price credit packages (5/$4.99, 10/$8.99, 25/$19.99).

The existing codebase implements security best practices including signature verification, rate limiting on webhooks, atomic credit updates to prevent race conditions, and server-side redirect URL construction to prevent open redirect vulnerabilities. The integration follows Stripe's recommended practices with client-side modal checkout experiences.

**Primary recommendation:** Leverage the existing well-architected Stripe integration foundation and focus on completing the remaining implementation details for MVP release.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Stripe's recommended modal/popup integration approach for best UX
- Implement according to Stripe's best practices for seamless payment flow
- Handle success and failure flows gracefully within the modal context
- MVP pricing: 5 credits for $4.99, 10 credits for $8.99, 25 credits for $19.99
- No credit expiration for MVP
- No promotional pricing or bundles for MVP
- No regional pricing considerations for MVP
- Implement industry-standard atomic credit updates using PostgreSQL RPC
- Include proper retry mechanisms for webhook failures
- Use Stripe's signature verification for security
- Handle error cases where credit update fails after successful payment
- Capture comprehensive transaction data for audit trails
- Include compliance measures for financial transactions
- Support analytics capabilities for business insights
- Log all necessary data to `transactions` table as specified
- Use Stripe's suggested approach with extensible architecture
- Implement proper coding patterns to allow adding other providers later
- Support cards only initially (no other payment methods)
- One-time credit purchases only (not subscriptions)
- Focus on immediate credit delivery after successful payment
- Implement best possible user experience for showing credit balances
- Design intuitive UI that clearly shows available credits to users

### Claude's Discretion
- Specific technical implementation details for Stripe integration
- Error handling edge cases beyond core requirements
- Database schema details for transaction logging
- UI component design within established design system

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRIPE-01 | Stripe Configuration — Price IDs, webhook secret, checkout flow working | Existing architecture supports Stripe checkout and webhook integration with proper configuration via environment variables |
| STRIPE-02 | Credit Purchase Flow — Users can buy credit packages (5/$4.99, 10/$8.99, 25/$19.99) | Frontend UI implemented with pricing cards, backend checkout session creation in place |
| STRIPE-03 | Webhook Handling — Atomic credit increment on successful payment via PostgreSQL RPC | Atomic credit updates via RPC already implemented in database and webhook handler |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | 20.3.1 | Server-side Stripe API integration | Official Stripe Node.js library, maintained by Stripe |
| @stripe/stripe-js | 8.8.0 | Client-side Stripe Elements and Checkout | Official Stripe JavaScript library for frontend integration |
| @supabase/supabase-js | 2.0.4 | Database operations for credits and transactions | Project standard for database operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| BullMQ | 5.70.0 | Queue processing (for webhook retries if needed) | Retry mechanisms for failed webhook events |
| ioredis | 5.9.3 | Redis connection for BullMQ | Webhook retry processing |

**Installation:**
```bash
npm install stripe @stripe/stripe-js
```

## Architecture Patterns

### Recommended Project Structure
```
server/
├── api/
│   └── stripe/
│       ├── checkout.post.ts     # Create checkout sessions
│       └── webhook.post.ts      # Handle payment completion
├── utils/
│   └── stripe-client.ts         # Stripe client and helper functions
database/
└── migrations/
    └── 20260217000001_atomic_credit_increment.sql  # RPC for atomic updates
components/
└── CreditPackageSelector.vue    # Credit package selection UI
pages/
└── credits.vue                 # Credit purchase page
```

### Pattern 1: Secure Checkout Session Creation
**What:** Server-side creation of Stripe checkout sessions with proper security measures
**When to use:** When a user initiates a credit purchase
**Example:**
```typescript
// Source: /server/api/stripe/checkout.post.ts
export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event);
    const user = (await client.auth.getUser()).data.user;

    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const body = await readBody(event);
    const { packageId } = body;

    // [SECURITY FIX C3] Construct safe redirect URLs server-side
    const successUrl = createSafeRedirectUrl("/dashboard", {
      payment: "success",
    });
    const cancelUrl = createSafeRedirectUrl("/credits", {
      payment: "cancelled",
    });

    const session = await createCheckoutSession(
      user.id,
      packageId,
      successUrl,
      cancelUrl,
    );

    return { success: true, data: { sessionId: session.id, sessionUrl: session.url } };
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    throw createError({ statusCode: 500, message: error.message || "Failed to create checkout session" });
  }
});
```

### Pattern 2: Secure Webhook Handling
**What:** Properly secured webhook handling with signature verification and atomic operations
**When to use:** When Stripe sends payment completion notifications
**Example:**
```typescript
// Source: /server/api/stripe/webhook.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: "2026-01-28.clover",
  });

  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!body || !signature) {
    throw createError({ statusCode: 400, message: "Invalid webhook request" });
  }

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret,
    );

    await handleWebhookEvent(stripeEvent);

    return { received: true };
  } catch (error: any) {
    if (error.type === "StripeSignatureVerificationError") {
      console.error("[SECURITY ALERT] Webhook signature verification failed", {
        timestamp: new Date().toISOString(),
        signature: signature?.substring(0, 20) + "...",
        ip: event.context.clientIp,
      });
    }

    handleApiError(error, {
      endpoint: "/api/stripe/webhook",
      operation: "stripe_webhook_verification",
    });
  }
});
```

### Pattern 3: Atomic Credit Updates
**What:** PostgreSQL RPC functions for safe, atomic credit updates
**When to use:** When processing successful payments to prevent race conditions
**Example:**
```sql
-- Source: /database/migrations/20260217000001_atomic_credit_increment.sql
CREATE OR REPLACE FUNCTION increment_user_credits(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_new_credits INTEGER;
BEGIN
    UPDATE users
    SET credits = credits + p_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING credits INTO v_new_credits;

    RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Anti-Patterns to Avoid
- **Direct credit updates in webhook:** Use atomic RPC functions instead of direct SQL updates to prevent race conditions
- **Client-side redirect URL construction:** Always construct redirect URLs server-side to prevent open redirect vulnerabilities
- **Storing payment info in client:** Never store sensitive payment information on the client side

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment processing | Custom payment processor | Stripe | Stripe handles PCI compliance, fraud detection, and payment security |
| Signature verification | Custom crypto logic | Stripe's webhook signature verification | Stripe provides secure, tested verification methods |
| Atomic credit updates | Manual credit update logic | PostgreSQL RPC functions | RPC prevents race conditions that could lead to incorrect credit amounts |
| Transaction logging | Custom financial logging | Built-in transactions table | Already designed for compliance and audit trails |
| Rate limiting | Custom rate limiting | Built-in rate limiting middleware | Prevents webhook flooding and potential abuse |

**Key insight:** The financial transaction domain has many regulatory and security requirements that are difficult to implement correctly from scratch. Using established solutions like Stripe reduces risk significantly.

## Common Pitfalls

### Pitfall 1: Race Conditions in Credit Updates
**What goes wrong:** Multiple simultaneous webhook calls can result in incorrect credit calculations
**Why it happens:** Direct database updates without atomic operations
**How to avoid:** Use PostgreSQL RPC functions for atomic credit increments
**Warning signs:** Credits don't match expected amounts after multiple simultaneous payments

### Pitfall 2: Insecure Webhook Handling
**What goes wrong:** Malicious actors can forge webhook events to manipulate credit balances
**Why it happens:** Missing or incorrect signature verification
**How to avoid:** Always verify webhook signatures using Stripe's provided methods
**Warning signs:** Unexpected credit increases with no corresponding payments

### Pitfall 3: Open Redirect Vulnerabilities
**What goes wrong:** Attackers can redirect users to malicious sites after payment
**Why it happens:** Client-side construction of redirect URLs
**How to avoid:** Server-side URL construction with white-listed domains
**Warning signs:** Unexpected redirect URLs in logs

### Pitfall 4: Incomplete Error Handling
**What goes wrong:** Payment succeeds but credits aren't added, causing customer complaints
**Why it happens:** Not handling scenarios where payment completes but credit update fails
**How to avoid:** Proper error handling and manual reconciliation processes
**Warning signs:** Stripe payments confirmed but no credit additions in system

## Code Examples

Verified patterns from official sources:

### Creating a Checkout Session
```typescript
// Source: /server/utils/stripe-client.ts
import Stripe from "stripe";

export const CREDIT_PACKAGES = [
  {
    id: "pack_5",
    credits: 5,
    price: 4.99,
    priceId: "price_5credits", // Replace with actual Stripe Price ID
    popular: false,
  },
  // Additional packages...
];

export const createCheckoutSession = async (
  userId: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string,
) => {
  const stripe = createStripeClient();
  const pack = CREDIT_PACKAGES.find((p) => p.id === packageId);

  if (!pack) {
    throw new Error("Invalid package");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: pack.priceId,
        quantity: 1,
      },
    ],
    mode: "payment", // One-time payment, not subscription
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      user_id: userId,
      credits: pack.credits.toString(),
    },
  });

  return session;
};
```

### Processing Webhook Events
```typescript
// Source: /server/utils/stripe-client.ts
export const handleWebhookEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract user ID and credits from metadata
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || "0");

      if (userId && credits > 0) {
        await updateUserCreditsInDb(userId, credits);
      }
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("PaymentIntent succeeded:", paymentIntent.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};
```

### Updating User Credits with Transaction Logging
```typescript
// Source: /server/utils/stripe-client.ts
export const updateUserCreditsInDb = async (
  userId: string,
  credits: number,
) => {
  const config = useRuntimeConfig();
  const { createClient } = await import("@supabase/supabase-js");

  // Create a Supabase client with the SERVICE KEY to bypass RLS
  const supabaseAdmin = createClient(
    config.public.supabase.url,
    config.supabaseServiceKey,
  );

  // [SECURITY FIX H4] Atomic credit increment
  const { data: newCredits, error: updateError } = await supabaseAdmin.rpc(
    "increment_user_credits",
    {
      p_user_id: userId,
      p_amount: credits,
    },
  );

  if (updateError) {
    console.error(`Error updating credits for user ${userId}:`, updateError);
    return false;
  }

  console.log(
    `Successfully added ${credits} credits to user ${userId}. New balance: ${newCredits}`,
  );

  // Log transaction
  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    amount: 0, // Typically the price of the package
    credits: credits,
    type: "purchase",
    description: `Purchase of ${credits} credits via Stripe`,
  });

  return true;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side credit updates | Server-side atomic RPC | Feb 2026 (Migration 20260217000001) | Eliminated race conditions |
| Direct database updates | PostgreSQL RPC functions | Feb 2026 | Improved security and consistency |
| Simple credit addition | Comprehensive transaction logging | Feb 2026 | Better audit trails and compliance |

**Deprecated/outdated:**
- Direct SQL credit updates: Replaced by atomic RPC functions
- Client-side payment processing: Now handled server-side for security

## Open Questions

1. **Webhook retry mechanisms**
   - What we know: Basic webhook handling is in place
   - What's unclear: How to implement robust retry mechanisms for failed webhook processing
   - Recommendation: Use BullMQ to queue webhook retries with exponential backoff

2. **Price ID configuration**
   - What we know: Fixed pricing packages defined in constants
   - What's unclear: How to configure actual Stripe Price IDs in production
   - Recommendation: Create setup script to register prices in Stripe and update constants

3. **Error recovery procedures**
   - What we know: Error handling exists for immediate failures
   - What's unclear: How to handle partial failures (payment succeeds but credit fails)
   - Recommendation: Implement manual reconciliation dashboard for admin staff

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | vitest.config.ts, playwright.config.ts |
| Quick run command | `npm run test:run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STRIPE-01 | Stripe checkout session creation | unit | `npm run test:run -- --testNamePattern="stripe checkout"` | ❌ Wave 0 |
| STRIPE-01 | Webhook signature verification | unit | `npm run test:run -- --testNamePattern="webhook"` | ❌ Wave 0 |
| STRIPE-02 | Credit purchase flow from UI | e2e | `npx playwright test --grep @stripe-purchase` | ❌ Wave 0 |
| STRIPE-03 | Atomic credit updates via RPC | integration | `npm run test:run -- --testNamePattern="atomic credit"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:run -- --testNamePattern="stripe\|credit"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/stripe-checkout.spec.ts` — covers STRIPE-01
- [ ] `tests/unit/webhook-handler.spec.ts` — covers STRIPE-01
- [ ] `tests/e2e/credit-purchase-flow.spec.ts` — covers STRIPE-02
- [ ] `tests/integration/atomic-credit-update.spec.ts` — covers STRIPE-03
- [ ] Framework install: `npm install vitest @vitest/ui @playwright/test` — if none detected

## Sources

### Primary (HIGH confidence)
- Existing codebase - Stripe integration already partially implemented
- Official Stripe documentation - API usage patterns
- PostgreSQL documentation - RPC functions and atomic operations

### Secondary (MEDIUM confidence)
- Nuxt 3 documentation - Server API best practices
- Supabase documentation - Database security and RLS policies

### Tertiary (LOW confidence)
- Web search for webhook retry patterns - needs validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on existing code and official Stripe libraries
- Architecture: HIGH - Well-documented patterns in existing codebase
- Pitfalls: HIGH - Based on security fixes already implemented in codebase
- Validation: MEDIUM - Need to create tests for existing functionality

**Research date:** 2026-02-25
**Valid until:** 2026-03-27 (30 days for stable, 7 for fast-moving)