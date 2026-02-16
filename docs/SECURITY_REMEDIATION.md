# Security Remediation Guide

**Priority:** Critical → High → Medium → Low  
**Target Completion:** Before Production Deployment

---

## Critical Remediations

### C1: Remove Admin Email from Client-Side Config

**Files to Modify:**
- `nuxt.config.ts`
- `middleware/admin.ts`
- `pages/dashboard.vue`
- `components/AppHeader.vue`

**Step 1: Update `nuxt.config.ts`**
```typescript
// BEFORE
runtimeConfig: {
  public: {
    adminEmail: process.env.ADMIN_EMAIL || '',
  },
}

// AFTER
runtimeConfig: {
  // Keep adminEmail server-side only
  adminEmail: process.env.ADMIN_EMAIL || '',
  public: {
    // Remove adminEmail from public config
  },
}
```

**Step 2: Create server-side admin check utility**
```typescript
// server/utils/admin.ts
import { serverSupabaseUser } from '#supabase/server'

export const checkAdminAccess = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  const config = useRuntimeConfig()
  const adminEmail = config.adminEmail // Server-side only

  if (!user || !adminEmail || user.email !== adminEmail) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  return user
}
```

**Step 3: Update admin endpoints**
```typescript
// server/api/admin/config.get.ts
import { checkAdminAccess } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await checkAdminAccess(event)
  // ... rest of code
})
```

**Step 4: Update frontend admin detection**
```typescript
// composables/useAdmin.ts
export const useAdmin = () => {
  const isAdmin = ref(false)
  const checkAdmin = async () => {
    try {
      await $fetch('/api/admin/config')
      isAdmin.value = true
    } catch {
      isAdmin.value = false
    }
  }
  return { isAdmin, checkAdmin }
}
```

**Testing:**
```bash
# Verify admin email is not in client bundle
npm run build
grep -r "adminEmail" .output/client/
# Should return nothing
```

---

### C2: Implement Secure File Upload Validation

**Files to Modify:**
- `server/api/upload.post.ts`
- `server/utils/pdf-parser.ts`

**Step 1: Add file signature validation**
```typescript
// server/utils/file-validator.ts

const PDF_SIGNATURES = [
  '25504446', // %PDF (ASCII)
  '25215053', // %!PS (PostScript, sometimes PDF)
]

export const validateFileSignature = (buffer: Buffer): { valid: boolean; type?: string } => {
  const hexSignature = buffer.toString('hex', 0, 4)
  
  if (PDF_SIGNATURES.includes(hexSignature)) {
    return { valid: true, type: 'pdf' }
  }
  
  return { valid: false }
}

export const sanitizeFilename = (filename: string): string => {
  // Remove path traversal attempts
  const sanitized = path.basename(filename)
  // Remove special characters
  return sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export const validateFileComprehensive = (
  file: { name: string; buffer: Buffer; size: number }
): { valid: boolean; error?: string } => {
  // Check size
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File exceeds 10MB limit' }
  }

  // Check signature
  const sigCheck = validateFileSignature(file.buffer)
  if (!sigCheck.valid) {
    return { valid: false, error: 'Invalid file type. Only PDF files are allowed.' }
  }

  // Check filename
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'File extension must be .pdf' }
  }

  return { valid: true }
}
```

**Step 2: Update upload endpoint**
```typescript
// server/api/upload.post.ts
import { validateFileComprehensive, sanitizeFilename } from '~/server/utils/file-validator'

export default defineEventHandler(async (event): Promise<UploadResponse> => {
  try {
    const user = await serverSupabaseUser(event)
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, message: 'No file uploaded' })
    }

    const fileEntry = formData[0]
    const fileName = sanitizeFilename(fileEntry.filename || 'contract.pdf')
    const fileBuffer = fileEntry.data

    // Comprehensive validation
    const validation = validateFileComprehensive({
      name: fileName,
      buffer: fileBuffer,
      size: fileBuffer.length,
    })

    if (!validation.valid) {
      throw createError({ statusCode: 400, message: validation.error })
    }

    // Continue with upload...
  }
})
```

**Testing:**
```bash
# Test with valid PDF
curl -X POST http://localhost:3001/api/upload \
  -F "file=@valid-contract.pdf"

# Test with fake PDF (rename .exe to .pdf)
curl -X POST http://localhost:3001/api/upload \
  -F "file=@malicious.exe.pdf"
# Should reject

# Test with oversized file
curl -X POST http://localhost:3001/api/upload \
  -F "file=@large-file.pdf"
# Should reject
```

---

### C3: Secure Service Role Key Usage

**Files to Modify:**
- `server/plugins/worker.ts`
- `server/api/admin/*.ts`
- `server/utils/stripe-client.ts`

**Step 1: Create secure Supabase client factory**
```typescript
// server/utils/supabase-admin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface SupabaseAdminOptions {
  purpose: 'worker' | 'admin' | 'stripe' | 'analytics'
}

let cachedClients: Record<string, SupabaseClient> = {}

export const createAdminClient = (options: SupabaseAdminOptions): SupabaseClient => {
  const config = useRuntimeConfig()
  const cacheKey = options.purpose
  
  if (cachedClients[cacheKey]) {
    return cachedClients[cacheKey]
  }

  const client = createClient(
    process.env.SUPABASE_URL || '',
    config.supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Add custom headers for audit tracking
      headers: {
        'X-Client-Purpose': options.purpose,
      },
    }
  )

  cachedClients[cacheKey] = client
  return client
}

// Secure error logging
export const logSupabaseError = (context: string, error: any) => {
  // NEVER log the service key or full error objects
  console.error(`[Supabase Error] ${context}:`, {
    message: error.message,
    code: error.code,
    details: error.details, // Only if not sensitive
    // Never log: error.headers, error.client
  })
}
```

**Step 2: Update worker to use secure client**
```typescript
// server/plugins/worker.ts
import { createAdminClient, logSupabaseError } from '../utils/supabase-admin'

const supabaseAdmin = createAdminClient({ purpose: 'worker' })

try {
  // ... worker code
} catch (error: any) {
  logSupabaseError(`Worker analysis ${analysisId}`, error)
  // Don't expose error to job system
}
```

**Step 3: Update admin endpoints**
```typescript
// server/api/admin/users.get.ts
import { createAdminClient, logSupabaseError } from '../../utils/supabase-admin'

export default defineEventHandler(async (event) => {
  // Auth check first
  const user = await checkAdminAccess(event)
  
  const client = createAdminClient({ purpose: 'admin' })
  
  try {
    const { data, error } = await client.from('admin_users_summary').select('*')
    if (error) throw error
    return { users: data }
  } catch (error: any) {
    logSupabaseError('Admin users fetch', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch users' })
  }
})
```

**Testing:**
```bash
# Check logs don't contain service key
docker logs clarify-app | grep -i "supabase" | grep -v "error"
# Should not show any keys

# Verify error messages are sanitized
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer invalid-token"
# Should return generic error, not stack trace
```

---

## High Priority Remediations

### H1: Add Rate Limiting

**Installation:**
```bash
npm install rate-limiter-flexible
```

**Step 1: Create rate limiter middleware**
```typescript
// server/middleware/rateLimiter.ts
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1, // per 1 second
})

const apiRateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per minute
})

export default defineEventHandler(async (event) => {
  const path = event.path
  
  // Skip rate limiting for health checks
  if (path === '/api/health') {
    return
  }

  const ip = getRequestIP(event) || 'unknown'
  
  try {
    // Stricter limits on auth endpoints
    if (path.includes('/login') || path.includes('/api/auth')) {
      await rateLimiter.consume(ip)
    } else {
      await apiRateLimiter.consume(ip)
    }
  } catch (rejRes: any) {
    const retrySecs = Math.ceil(rejRes.msBeforeNext / 1000) || 1
    
    setHeader(event, 'Retry-After', retrySecs)
    setHeader(event, 'X-RateLimit-Limit', rejRes.points)
    setHeader(event, 'X-RateLimit-Remaining', rejRes.remainingPoints)
    
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    })
  }
})
```

**Step 2: Register middleware in `nuxt.config.ts`**
```typescript
export default defineNuxtConfig({
  nitro: {
    handlers: [
      // ... your handlers
    ],
    middleware: [
      '~/server/middleware/rateLimiter.ts'
    ]
  }
})
```

---

### H2: Fix Webhook Security

**Files to Modify:**
- `server/api/stripe/webhook.post.ts`

**Updated Implementation:**
```typescript
// server/api/stripe/webhook.post.ts
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  // Strict validation
  if (!body || !signature || !config.stripeWebhookSecret) {
    console.warn('Invalid webhook attempt: missing required fields')
    throw createError({
      statusCode: 400,
      message: 'Invalid webhook request',
    })
  }

  let stripeEvent: Stripe.Event
  
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    throw createError({
      statusCode: 400,
      message: 'Invalid webhook signature',
    })
  }

  // Process webhook with error handling
  try {
    await handleWebhookEvent(stripeEvent)
    return { received: true }
  } catch (error: any) {
    console.error('Webhook processing error:', error.message)
    // Still return 200 to prevent Stripe retries for processing errors
    return { received: true, error: 'Processing failed' }
  }
})
```

---

## Verification Checklist

After implementing remediations:

### Critical Fixes
- [ ] Admin email not visible in client bundle
- [ ] File uploads reject non-PDF files (even with .pdf extension)
- [ ] Service key never appears in logs
- [ ] Admin endpoints return 401 without proper auth

### High Priority Fixes
- [ ] Rate limiting active (test with `ab` or `wrk`)
- [ ] Webhook rejects invalid signatures
- [ ] Token check validates file ownership
- [ ] SQL injection tests pass (use SQLMap or manual testing)

### Medium Priority Fixes
- [ ] Debug info separated from user data
- [ ] CSP header present in responses
- [ ] Cookies have Secure, HttpOnly, SameSite flags
- [ ] Error messages don't leak internals
- [ ] Email verification enabled in Supabase

### Low Priority Fixes
- [ ] All security headers present (use securityheaders.com)
- [ ] `npm audit` returns no critical vulnerabilities

---

## Testing Commands

```bash
# Security headers check
curl -I https://your-domain.com | grep -E "(X-Frame|X-Content|Strict-Transport|Content-Security)"

# Rate limiting test
ab -n 100 -c 10 http://localhost:3001/api/health

# File upload security test
echo "not a pdf" > fake.pdf
curl -X POST http://localhost:3001/api/upload -F "file=@fake.pdf"

# Admin email exposure check
npm run build
strings .output/client/*.js | grep -i "admin"

# Dependency audit
npm audit --audit-level=critical
```

---

**Last Updated:** February 16, 2026  
**Next Review:** After each major release
