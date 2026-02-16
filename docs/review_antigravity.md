# 🔒 Clarify — Security Vulnerability Review

**Reviewer:** Antigravity (AI Security Audit)
**Date:** 2026-02-16
**Scope:** Full codebase — server API, utilities, middleware, database, composables, configuration

---

## Executive Summary

This review identified **17 security vulnerabilities** across the Clarify codebase, categorized by OWASP Top 10 and general security best practices. The most critical findings involve **race conditions in financial operations**, **information leakage**, **insufficient input validation**, and **weak authorization patterns**.

| Severity | Count | Categories |
|----------|-------|------------|
| 🔴 Critical | 4 | Race conditions, SSRF, open redirect, missing auth |
| 🟠 High | 5 | Info disclosure, weak admin auth, file upload validation, credit manipulation |
| 🟡 Medium | 5 | Missing rate limiting, error propagation, Redis security, debug logging |
| 🟢 Low | 3 | Hardcoded config, inconsistent error handling, storage exposure |

---

## 🔴 Critical Vulnerabilities

### 1. Race Condition in Credit Deduction (TOCTOU)

**Severity:** 🔴 Critical
**OWASP:** A04:2021 – Insecure Design
**File:** [`analyze.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/analyze.post.ts#L22-L38)

The endpoint reads the user's credits (line 23–27), checks if they have enough (line 33), and then calls an RPC to deduct credits (line 46). However, there's a **Time-of-Check to Time-of-Use (TOCTOU)** gap between the credit check and the atomic RPC call.

```typescript
// Lines 22–38: Credit check is separate from deduction
const { data: userData, error: userError } = await client
    .from('users')
    .select('credits')
    .eq('id', user.id)
    .single()

if (userData.credits < creditCost) { // CHECK here
    throw createError({ statusCode: 402, message: '...' })
}

// ... lines later, RPC does its OWN check + deduction
const { data: analysisId, error: txError } = await client
    .rpc('process_analysis_transaction', { ... }) // USE here
```

Additionally, the database RPC function [`process_analysis_transaction`](file:///home/cativo23/projects/personal/clarify/database/init.sql#L66-L110) always deducts **1 credit** regardless of the `p_credit_cost` parameter the API sends. The RPC doesn't accept or use a credit cost parameter:

```sql
-- init.sql line 78: Hardcoded to check >= 1
IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND credits >= 1) THEN
-- init.sql line 83-84: Hardcoded to deduct 1
UPDATE users SET credits = credits - 1 WHERE id = p_user_id;
```

**Impact:** A premium analysis (should cost 3 credits) only deducts 1 credit, resulting in revenue loss. Additionally, concurrent requests could bypass credit checks.

**Remediation:**
```sql
-- Updated RPC that accepts and uses credit_cost
CREATE OR REPLACE FUNCTION process_analysis_transaction(
    p_user_id UUID,
    p_contract_name TEXT,
    p_file_url TEXT,
    p_analysis_type TEXT DEFAULT 'premium',
    p_credit_cost INTEGER DEFAULT 1,
    p_summary_json JSONB DEFAULT NULL,
    p_risk_level TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_analysis_id UUID;
BEGIN
    -- Atomically check AND deduct in one statement with row-level lock
    UPDATE users
    SET credits = credits - p_credit_cost
    WHERE id = p_user_id AND credits >= p_credit_cost;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    INSERT INTO analyses (user_id, contract_name, file_url, summary_json, risk_level, status, credits_used, created_at)
    VALUES (p_user_id, p_contract_name, p_file_url, p_summary_json, p_risk_level, 'pending', p_credit_cost, CURRENT_TIMESTAMP)
    RETURNING id INTO v_analysis_id;

    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Remove the redundant credit check in `analyze.post.ts` (lines 22–38) and let the RPC handle it atomically.

---

### 2. Server-Side Request Forgery (SSRF) via `file_url`

**Severity:** 🔴 Critical
**OWASP:** A10:2021 – Server-Side Request Forgery
**Files:** [`analyze.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/analyze.post.ts#L12), [`check-tokens.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/check-tokens.post.ts#L14)

The `file_url` parameter is accepted directly from the request body and used to construct a storage path by simply splitting on `/` and taking the last segment. There is **no validation** that `file_url` actually points to the expected Supabase storage bucket.

```typescript
// analyze.post.ts lines 42-43
const filename = file_url.split('/').pop() || ''
const storagePath = `${user.id}/${filename}`
```

**Impact:** While the storage path is scoped by `user.id`, a malicious `file_url` could bypass intended isolation. The URL is also stored directly in the database, potentially enabling stored XSS if rendered on the frontend.

**Remediation:**
```typescript
// Validate file_url belongs to the expected Supabase storage bucket
const config = useRuntimeConfig()
const expectedPrefix = `${config.public.supabase.url}/storage/v1/object/public/contracts/`

if (!file_url.startsWith(expectedPrefix)) {
    throw createError({ statusCode: 400, message: 'Invalid file URL' })
}

// Extract and validate filename
const filename = file_url.substring(expectedPrefix.length).split('/').pop()
if (!filename || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw createError({ statusCode: 400, message: 'Invalid filename' })
}
```

---

### 3. Open Redirect via Stripe Checkout URLs

**Severity:** 🔴 Critical
**OWASP:** A01:2021 – Broken Access Control
**File:** [`checkout.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/stripe/checkout.post.ts#L15)

The `successUrl` and `cancelUrl` parameters are accepted directly from the client and passed to `stripe.checkout.sessions.create()` without validation.

```typescript
const { packageId, successUrl, cancelUrl } = body
// No validation — these could be any URL
const session = await createCheckoutSession(user.id, packageId, successUrl, cancelUrl)
```

**Impact:** An attacker can craft a checkout link with a malicious `successUrl` pointing to a phishing page. After a legit Stripe payment, the user gets redirected to the attacker's domain.

**Remediation:**
```typescript
const config = useRuntimeConfig()
const allowedOrigin = config.public.baseUrl

// Validate redirect URLs belong to the application
if (!successUrl.startsWith(allowedOrigin) || !cancelUrl.startsWith(allowedOrigin)) {
    throw createError({ statusCode: 400, message: 'Invalid redirect URLs' })
}
```

---

### 4. Admin Pricing Endpoint Missing Authentication

**Severity:** 🔴 Critical
**OWASP:** A01:2021 – Broken Access Control
**File:** [`admin/pricing.get.ts`](file:///home/cativo23/projects/personal/clarify/server/api/admin/pricing.get.ts)

This endpoint uses the **Supabase service key** to bypass RLS but has **no authentication or authorization checks** at all. Any unauthenticated user can access the admin pricing data.

```typescript
// No user check, no admin check — direct service key usage
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const supabase = createClient(process.env.SUPABASE_URL || '', config.supabaseServiceKey)
    // ...
})
```

**Remediation:**
```typescript
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)
    const config = useRuntimeConfig()

    if (!user || user.email !== config.public.adminEmail) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const client = await serverSupabaseServiceRole(event)
    const { data, error } = await client.from('pricing_tables').select('*')
    // ...
})
```

---

## 🟠 High Vulnerabilities

### 5. Admin Email Exposed in Public Runtime Config

**Severity:** 🟠 High
**OWASP:** A05:2021 – Security Misconfiguration
**File:** [`nuxt.config.ts`](file:///home/cativo23/projects/personal/clarify/nuxt.config.ts#L40)

The `adminEmail` is placed under `runtimeConfig.public`, making it available to **all clients** via the `__NUXT__` payload or `useRuntimeConfig().public`:

```typescript
public: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    adminEmail: process.env.ADMIN_EMAIL || '', // ❌ Exposed to all clients
},
```

**Impact:** Attackers know exactly which email has admin access, enabling targeted phishing or social engineering attacks against that specific account.

**Remediation:** Move `adminEmail` to the private section of `runtimeConfig` (server-side only). Update all server-side references from `config.public.adminEmail` to `config.adminEmail`, and remove the client-side admin middleware's email check (use a server-side API call instead).

---

### 6. File Upload Missing Server-Side Type Validation

**Severity:** 🟠 High
**OWASP:** A04:2021 – Insecure Design
**File:** [`upload.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/upload.post.ts#L33-L50)

The upload endpoint only validates file **size** but not file **type** or **content**. The `contentType` is hardcoded to `'application/pdf'` for storage, but there's no validation that the uploaded file is actually a PDF:

```typescript
const fileName = fileEntry.filename || 'contract.pdf'
const fileBuffer = fileEntry.data
// Only size check, no type validation
if (fileBuffer.length > maxSize) { ... }
// Hardcoded content type — doesn't verify actual content
.upload(uniqueFileName, fileBuffer, { contentType: 'application/pdf', upsert: false })
```

**Impact:** Malicious files (executables, scripts, polyglots) can be uploaded and stored in the public bucket, potentially used for malware distribution or XSS via content-type confusion.

**Remediation:**
```typescript
// 1. Validate MIME type from the multipart data
const allowedMimeTypes = ['application/pdf']
if (fileEntry.type && !allowedMimeTypes.includes(fileEntry.type)) {
    throw createError({ statusCode: 400, message: 'Only PDF files are accepted' })
}

// 2. Validate file extension
const fileExt = fileName.split('.').pop()?.toLowerCase()
if (fileExt !== 'pdf') {
    throw createError({ statusCode: 400, message: 'File must have .pdf extension' })
}

// 3. Validate PDF magic bytes (header check)
const pdfMagicBytes = Buffer.from('%PDF')
if (!fileBuffer.subarray(0, 4).equals(pdfMagicBytes)) {
    throw createError({ statusCode: 400, message: 'File content is not a valid PDF' })
}
```

---

### 7. Information Disclosure in Error Responses

**Severity:** 🟠 High
**OWASP:** A09:2021 – Security Logging & Monitoring Failures
**Files:** Multiple endpoints

Several endpoints return raw error messages to the client, potentially exposing internal system details:

| File | Line | Leaked Information |
|------|------|--------------------|
| [`analyze.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/analyze.post.ts#L88) | 88 | Raw `error.message` |
| [`check-tokens.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/check-tokens.post.ts#L33) | 33 | Download error message with internal path |
| [`admin/config.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/admin/config.post.ts#L42) | 42 | Raw Supabase error |
| [`admin/users.get.ts`](file:///home/cativo23/projects/personal/clarify/server/api/admin/users.get.ts#L20) | 20 | Raw Supabase error |
| [`webhook.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/stripe/webhook.post.ts#L37) | 37 | Stripe webhook internal error |
| [`analyses/status.get.ts`](file:///home/cativo23/projects/personal/clarify/server/api/analyses/%5Bid%5D/status.get.ts#L36) | 36 | Raw error message |

**Remediation:** Return generic error messages to clients and log detailed errors server-side:
```typescript
} catch (error: any) {
    console.error('Detailed error for logging:', error)
    throw createError({
        statusCode: 500,
        message: 'An internal error occurred. Please try again later.',
    })
}
```

---

### 8. Race Condition in Stripe Credit Update (Non-Atomic Read-Update)

**Severity:** 🟠 High
**OWASP:** A04:2021 – Insecure Design
**File:** [`stripe-client.ts`](file:///home/cativo23/projects/personal/clarify/server/utils/stripe-client.ts#L73-L108)

The `updateUserCreditsInDb` function performs a **read-then-update** pattern that is not atomic:

```typescript
// Step 1: Read current credits
const { data: user } = await supabaseAdmin.from('users').select('credits').eq('id', userId).single()
const currentCredits = user?.credits || 0

// Step 2: Calculate and write (gap between read and write = race condition)
const newCredits = currentCredits + credits
await supabaseAdmin.from('users').update({ credits: newCredits }).eq('id', userId)
```

**Impact:** If two Stripe webhooks fire concurrently for the same user, one credit update could be lost, resulting in the user not receiving purchased credits.

**Remediation:**
```typescript
// Use atomic increment via Supabase RPC or raw SQL
const { error: updateError } = await supabaseAdmin.rpc('increment_user_credits', {
    p_user_id: userId,
    p_credits: credits,
})
```

```sql
CREATE OR REPLACE FUNCTION increment_user_credits(p_user_id UUID, p_credits INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE users SET credits = credits + p_credits WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 9. Client-Side Credit Update Function (Privilege Escalation Risk)

**Severity:** 🟠 High
**OWASP:** A01:2021 – Broken Access Control
**File:** [`composables/useSupabase.ts`](file:///home/cativo23/projects/personal/clarify/composables/useSupabase.ts#L60-L76)

The `updateUserCredits` composable allows **direct client-side credit updates** via Supabase:

```typescript
export const updateUserCredits = async (credits: number) => {
    const client = useSupabaseClient()
    const { data, error } = await client
        .from('users')
        .update({ credits }) // Sets credits to ANY value the client provides
        .eq('id', user.value.id)
        .select().single()
}
```

**Impact:** If RLS policies allow users to UPDATE their own row (review `policies.sql` — currently no UPDATE policy is defined, so this may be blocked by RLS). However, if RLS is misconfigured or an UPDATE policy is added later, this could enable users to set arbitrary credit balances.

**Remediation:** Remove this function. All credit mutations should go through server-side API endpoints to enforce business logic. If client-side optimistic updates are needed, use a read-only state and refresh from the server.

---

## 🟡 Medium Vulnerabilities

### 10. No Rate Limiting on API Endpoints

**Severity:** 🟡 Medium
**OWASP:** A04:2021 – Insecure Design
**Files:** All API endpoints

None of the API endpoints implement rate limiting. This affects:
- **`/api/analyze.post`** — Each request costs OpenAI API tokens
- **`/api/upload.post`** — Storage abuse
- **`/api/check-tokens.post`** — CPU-intensive PDF parsing and token counting
- **`/api/stripe/checkout.post`** — Stripe session abuse
- **`/api/user/profile.get`** — Information harvesting

**Remediation:** Add rate limiting at the API level using an H3/Nitro middleware:
```typescript
// server/middleware/rate-limit.ts
import { H3Event, getRequestIP } from 'h3'

const rateLimits = new Map<string, { count: number; resetAt: number }>()

export default defineEventHandler((event: H3Event) => {
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute window
    const maxRequests = 30

    const entry = rateLimits.get(ip)
    if (entry && now < entry.resetAt) {
        entry.count++
        if (entry.count > maxRequests) {
            throw createError({ statusCode: 429, message: 'Too many requests' })
        }
    } else {
        rateLimits.set(ip, { count: 1, resetAt: now + windowMs })
    }
})
```

---

### 11. `SECURITY DEFINER` Function Without Restricted Search Path

**Severity:** 🟡 Medium
**OWASP:** A05:2021 – Security Misconfiguration
**File:** [`database/init.sql`](file:///home/cativo23/projects/personal/clarify/database/init.sql#L110)

The `process_analysis_transaction` function uses `SECURITY DEFINER` without setting `search_path`, which could allow search path injection attacks:

```sql
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Remediation:**
```sql
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
```

---

### 12. Redis Connection Without Authentication

**Severity:** 🟡 Medium
**OWASP:** A07:2021 – Identification & Authentication Failures
**File:** [`server/utils/queue.ts`](file:///home/cativo23/projects/personal/clarify/server/utils/queue.ts#L10-L14)

The Redis connection is created without a password, and there's no TLS configuration:

```typescript
redisConnection = new Redis({
    host: config.redisHost,
    port: config.redisPort,
    maxRetriesPerRequest: null,
    // No password or TLS
})
```

**Impact:** In production, an unauthenticated Redis instance exposes the job queue to data theft, injection of malicious jobs, or denial of service.

**Remediation:**
```typescript
redisConnection = new Redis({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword, // Add to runtimeConfig
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    maxRetriesPerRequest: null,
})
```

---

### 13. Debug Information Stored in Production Database

**Severity:** 🟡 Medium
**OWASP:** A09:2021 – Security Logging & Monitoring Failures
**Files:** [`openai-client.ts`](file:///home/cativo23/projects/personal/clarify/server/utils/openai-client.ts#L166-L178), [`worker.ts`](file:///home/cativo23/projects/personal/clarify/server/plugins/worker.ts#L84-L98)

Analysis results stored in `summary_json` contain a `_debug` object with internal model information, token usage, prompt versions, and timestamps. Failed analyses store raw debug info including raw API responses:

```typescript
// openai-client.ts — debug info appended to every result
result._debug = {
    model_used: model,
    prompt_version: versionToUse,
    usage: response.usage,   // Token counts, costs
    timestamp: new Date().toISOString()
}
```

**Impact:** This data is accessible via the analyses endpoint and Supabase Realtime, potentially revealing internal infrastructure details to end users.

**Remediation:** Store debug data in a separate column or table with restricted access. Filter `_debug` from API responses sent to non-admin users.

---

### 14. `analysis_type` Input Not Validated

**Severity:** 🟡 Medium
**OWASP:** A03:2021 – Injection
**File:** [`analyze.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/analyze.post.ts#L12)

The `analysis_type` defaults to `'premium'` but is not validated against allowed values:

```typescript
const { file_url, contract_name, analysis_type = 'premium' } = body
// No validation that analysis_type is 'basic' or 'premium'
```

**Impact:** Arbitrary strings could be passed as `analysis_type`, potentially causing unexpected behavior in model selection or credit calculation downstream.

**Remediation:**
```typescript
const allowedTypes = ['basic', 'premium']
if (!allowedTypes.includes(analysis_type)) {
    throw createError({ statusCode: 400, message: 'Invalid analysis type' })
}
```

---

## 🟢 Low Vulnerabilities

### 15. Inconsistent Error Handling Patterns

**Severity:** 🟢 Low
**Files:** [`analyze.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/analyze.post.ts#L84-L90), [`analyses/status.get.ts`](file:///home/cativo23/projects/personal/clarify/server/api/analyses/%5Bid%5D/status.get.ts#L33-L38)

Some endpoints catch errors and return `{ success: false, error: ... }` (200 OK), while others use `throw createError()` (proper HTTP status codes). This inconsistency makes it harder for clients to handle errors correctly and could mask security-relevant failures.

**Example of returning success=false with 200 status:**
```typescript
// analyze.post.ts line 84-90
} catch (error: any) {
    return {
        success: false, // HTTP 200 with error payload
        error: error.message || 'An error occurred',
    }
}
```

**Remediation:** Standardize on `throw createError()` with appropriate HTTP status codes for all error cases.

---

### 16. Public Storage Bucket for Contract Files

**Severity:** 🟢 Low
**OWASP:** A01:2021 – Broken Access Control
**File:** [`upload.post.ts`](file:///home/cativo23/projects/personal/clarify/server/api/upload.post.ts#L69-L71)

After uploading, the code generates a **public URL** for the file:

```typescript
const { data: { publicUrl } } = client.storage
    .from('contracts')
    .getPublicUrl(uniqueFileName)
```

**Impact:** If the Supabase storage bucket is set to public, anyone with the URL can access uploaded contracts (sensitive legal documents). While the filename includes a timestamp making it hard to guess, it's a security-through-obscurity approach.

**Remediation:** Use signed URLs with expiration instead of public URLs, or ensure the bucket is set to private with authenticated access only.

---

### 17. Hardcoded Demo User in Database Init Script

**Severity:** 🟢 Low
**OWASP:** A05:2021 – Security Misconfiguration
**File:** [`database/init.sql`](file:///home/cativo23/projects/personal/clarify/database/init.sql#L61-L63)

```sql
INSERT INTO users (email, credits) VALUES ('demo@clarify.app', 10) ON CONFLICT (email) DO NOTHING;
```

**Impact:** If this script runs in production, a known demo account exists with free credits.

**Remediation:** Gate this behind an environment check or use separate seed scripts for development.

---

## 📋 Remediation Priority Matrix

| Priority | Vulnerability | Effort | Impact |
|----------|--------------|--------|--------|
| **P0** | #1 — Race condition / credit mismatch in RPC | Medium | Revenue loss, exploitable |
| **P0** | #4 — Pricing endpoint no auth | Low | Data exposure via admin endpoint |
| **P0** | #3 — Open redirect via checkout URLs | Low | Phishing attacks |
| **P1** | #2 — SSRF via `file_url` | Low | Path traversal, data leak |
| **P1** | #5 — Admin email in public config | Low | Social engineering |
| **P1** | #6 — No file type validation | Medium | Malware uploads |
| **P1** | #8 — Stripe credit update race | Medium | Lost credit purchases |
| **P1** | #9 — Client-side credit update | Low | Privilege escalation |
| **P2** | #7 — Information disclosure | Medium | Internal detail leaks |
| **P2** | #10 — No rate limiting | Medium | API abuse, cost |
| **P2** | #14 — Unvalidated `analysis_type` | Low | Logic bypass |
| **P3** | #11 — `SECURITY DEFINER` search path | Low | Search path injection |
| **P3** | #12 — Redis without auth | Low | Queue tampering |
| **P3** | #13 — Debug info in DB | Low | Info disclosure |
| **P3** | #15 — Inconsistent error patterns | Medium | Client confusion |
| **P3** | #16 — Public storage bucket | Low | Document exposure |
| **P3** | #17 — Hardcoded demo user | Low | Config hygiene |

---

## ✅ Positive Security Observations

The codebase does have several good security practices in place:

1. **Server-side authentication** — All user-facing endpoints check `serverSupabaseUser(event)` before proceeding
2. **Row-Level Security (RLS)** — Properly enabled on `users`, `analyses`, and `transactions` tables with per-user policies
3. **Stripe webhook signature verification** — The webhook endpoint correctly uses `stripe.webhooks.constructEvent()` to verify event authenticity
4. **Service-role key isolation** — The Supabase service key is kept server-side and used only where admin access is needed (worker, admin endpoints)
5. **Atomic analysis transaction** — The RPC-based approach for creating analyses is architecturally sound (the implementation just needs the credit cost fix)
6. **Environment variable usage** — All secrets use environment variables, no hardcoded API keys in source code
7. **Storage path scoping** — File uploads use `user.id` prefix for path isolation
8. **Analysis ownership check** — The status endpoint verifies `user_id` matches the requesting user (line 22 of `status.get.ts`)

---

*This review covers the codebase as of 2026-02-16. Re-review recommended after implementing the remediation items above.*
