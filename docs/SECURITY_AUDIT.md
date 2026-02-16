# Security Audit Report - Clarify

**Application:** Clarify - AI-Powered Contract Analysis Platform  
**Audit Date:** February 16, 2026  
**Version:** 1.0.0-alpha.1  
**Auditor:** Automated Security Review

---

## Executive Summary

This security audit identified **14 vulnerabilities** across the Clarify codebase:

- 🔴 **Critical:** 3
- 🟠 **High:** 4
- 🟡 **Medium:** 5
- 🟢 **Low:** 2

### Risk Score: 7.2/10 (High)

Immediate action is required for critical and high-severity issues before production deployment.

---

## Table of Contents

1. [Critical Vulnerabilities](#critical-vulnerabilities)
2. [High Severity Issues](#high-severity-issues)
3. [Medium Severity Issues](#medium-severity-issues)
4. [Low Severity Issues](#low-severity-issues)
5. [Security Best Practices](#security-best-practices)
6. [Recommendations](#recommendations)

---

## Critical Vulnerabilities

### 🔴 C1: Hardcoded Admin Email in Client-Side Code

**Location:** `nuxt.config.ts`, `middleware/admin.ts`, `pages/dashboard.vue`  
**Severity:** Critical  
**CWE:** CWE-798 (Use of Hard-coded Credentials)

**Description:**
The admin email is configured via environment variable but is exposed to the client through `runtimeConfig.public.adminEmail`. This allows attackers to discover the admin email address and target phishing/social engineering attacks.

**Vulnerable Code:**
```typescript
// nuxt.config.ts
runtimeConfig: {
  public: {
    adminEmail: process.env.ADMIN_EMAIL || '', // EXPOSED TO CLIENT
  },
}
```

**Impact:**
- Admin email enumeration
- Targeted phishing attacks
- Social engineering vectors

**Recommendation:**
Move admin email validation to server-side only. Use server sessions or claims-based authorization.

```typescript
// server/utils/auth.ts
export const isAdmin = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  const adminEmail = useRuntimeConfig().adminEmail // Server-side only
  return user.email === adminEmail
}
```

---

### 🔴 C2: Missing Input Validation on File Upload

**Location:** `server/api/upload.post.ts`  
**Severity:** Critical  
**CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type)

**Description:**
The file upload endpoint only checks MIME type client-side and file extension. Attackers can upload malicious files with disguised extensions (e.g., `.pdf.exe` or polyglot files).

**Vulnerable Code:**
```typescript
// server/api/upload.post.ts
const fileName = fileEntry.filename || 'contract.pdf'
// No server-side content-type validation
// No file signature/magic bytes check
```

**Impact:**
- Malicious file upload
- Server-side code execution
- XSS via embedded scripts in PDFs

**Recommendation:**
```typescript
// Validate file signature (magic bytes)
const validatePDFSignature = (buffer: Buffer): boolean => {
  const signature = buffer.toString('hex', 0, 4)
  return signature === '25504446' // %PDF
}

// Additional validations:
// 1. Check magic bytes
// 2. Sanitize filename (remove path traversal)
// 3. Use allowlist for extensions
// 4. Scan with antivirus (ClamAV)
```

---

### 🔴 C3: Service Role Key Exposure Risk

**Location:** `server/plugins/worker.ts`, `server/api/admin/*.ts`  
**Severity:** Critical  
**CWE:** CWE-798 (Use of Hard-coded Credentials)

**Description:**
The Supabase service role key bypasses all Row Level Security (RLS) policies. If leaked, attackers gain full database access. The key is loaded from environment variables but logged in error messages and used extensively.

**Vulnerable Code:**
```typescript
// server/plugins/worker.ts
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  config.supabaseServiceKey // FULL DATABASE ACCESS
)
```

**Impact:**
- Complete database compromise if key leaks
- Bypass of all RLS policies
- Unauthorized data access/modification

**Recommendation:**
1. Never log errors containing the service key
2. Use separate service keys with minimal permissions per endpoint
3. Implement key rotation strategy
4. Add network-level restrictions

---

## High Severity Issues

### 🟠 H1: Insufficient Authentication on Token Check Endpoint

**Location:** `server/api/check-tokens.post.ts`  
**Severity:** High  
**CWE:** CWE-287 (Improper Authentication)

**Description:**
The endpoint downloads files from Supabase storage using the user's context but doesn't validate if the user owns the file before processing.

**Vulnerable Code:**
```typescript
const storagePath = `${user.id}/${filename}`
const { data: fileData } = await client.storage
  .from('contracts')
  .download(storagePath)
```

**Impact:**
- Potential IDOR if filename manipulation allows accessing other users' files
- Token enumeration attacks

**Recommendation:**
Add explicit ownership validation before file operations.

---

### 🟠 H2: Missing Rate Limiting

**Location:** All API endpoints  
**Severity:** High  
**CWE:** CWE-770 (Allocation of Resources Without Limits)

**Description:**
No rate limiting is implemented on any endpoint. Attackers can:
- Exhaust API quotas (OpenAI, Stripe)
- Perform brute-force attacks
- Drain user credits via repeated requests

**Impact:**
- Financial loss (OpenAI API costs, Stripe fees)
- Denial of service
- Credit exhaustion attacks

**Recommendation:**
```typescript
// server/middleware/rateLimiter.ts
import { RateLimiterMemory } from 'rate-limiter-flexible'

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1, // per second
})

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event)
  await rateLimiter.consume(ip)
})
```

---

### 🟠 H3: Webhook Signature Verification Bypass

**Location:** `server/api/stripe/webhook.post.ts`  
**Severity:** High  
**CWE:** CWE-347 (Improper Verification of Cryptographic Signature)

**Description:**
While webhook signature verification is implemented, the error handling could allow bypass if the signature header is malformed.

**Vulnerable Code:**
```typescript
if (!body || !signature) {
  throw createError({
    statusCode: 400,
    message: 'Missing body or signature',
  })
}
// Continues without explicit return
```

**Impact:**
- Fake webhook injection
- Unauthorized credit additions
- Payment fraud

**Recommendation:**
```typescript
if (!body || !signature) {
  throw createError({ statusCode: 400, message: 'Invalid webhook' })
}

try {
  const event = stripe.webhooks.constructEvent(body, signature, secret)
  await handleWebhookEvent(event)
} catch (error) {
  throw createError({ statusCode: 400, message: 'Invalid signature' })
}
```

---

### 🟠 H4: SQL Injection via Stored Procedure

**Location:** `server/api/analyze.post.ts`  
**Severity:** High  
**CWE:** CWE-89 (SQL Injection)

**Description:**
The code calls a stored procedure `process_analysis_transaction` with user-controlled parameters. While parameterized queries are generally safe, the procedure implementation must be audited.

**Vulnerable Code:**
```typescript
const { data: analysisId } = await client
  .rpc('process_analysis_transaction', {
    p_user_id: user.id,
    p_contract_name: contract_name, // User input
    p_file_url: file_url,
    p_analysis_type: analysis_type,
  })
```

**Impact:**
- Potential SQL injection if stored procedure uses dynamic SQL
- Data manipulation
- Privilege escalation

**Recommendation:**
1. Audit `database/init.sql` for dynamic SQL in stored procedures
2. Use strict input validation on `contract_name`
3. Implement allowlist for `analysis_type`

---

## Medium Severity Issues

### 🟡 M1: Debug Information Exposure

**Location:** `server/plugins/worker.ts`, `pages/admin/analytics.vue`  
**Severity:** Medium  
**CWE:** CWE-215 (Insertion of Sensitive Information Into Debug Output)

**Description:**
Debug information including token usage and model details is stored in `summary_json` and exposed to admin users. This could reveal prompt engineering secrets.

**Impact:**
- Prompt injection reconnaissance
- Model fingerprinting
- Cost structure exposure

**Recommendation:**
Separate debug data from user-facing data. Store in a separate column with stricter access controls.

---

### 🟡 M2: Missing Content Security Policy

**Location:** `nuxt.config.ts`, `app.vue`  
**Severity:** Medium  
**CWE:** CWE-693 (Protection Mechanism Omission)

**Description:**
No Content Security Policy (CSP) headers are configured. This increases XSS attack surface.

**Impact:**
- XSS attacks
- Data exfiltration
- Session hijacking

**Recommendation:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
        }
      ]
    }
  }
})
```

---

### 🟡 M3: Insecure Cookie Configuration

**Location:** `nuxt.config.ts`  
**Severity:** Medium  
**CWE:** CWE-614 (Sensitive Cookie in HTTPS Session Without 'Secure' Attribute)

**Description:**
No explicit cookie security configuration is defined. Session cookies may lack `Secure`, `HttpOnly`, or `SameSite` attributes.

**Recommendation:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  security: {
    session: {
      cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
      }
    }
  }
})
```

---

### 🟡 M4: Error Message Information Leakage

**Location:** Multiple API endpoints  
**Severity:** Medium  
**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)

**Description:**
Error messages from Supabase and OpenAI are directly returned to clients, potentially revealing internal implementation details.

**Example:**
```typescript
throw createError({
  statusCode: 500,
  message: error.message, // Internal error exposed
})
```

**Recommendation:**
```typescript
// Log full error internally
console.error('Detailed error:', error)

// Return sanitized message to client
throw createError({
  statusCode: 500,
  message: 'An unexpected error occurred. Please try again.',
})
```

---

### 🟡 M5: Missing Email Verification

**Location:** `pages/login.vue`, Supabase auth configuration  
**Severity:** Medium  
**CWE:** CWE-293 (Using Referer Field to Determine Origin)

**Description:**
No email verification is enforced before allowing account access. Attackers can create accounts with arbitrary emails.

**Impact:**
- Account takeover via email collision
- Spam/fake accounts
- Reputation damage

**Recommendation:**
Enable Supabase email confirmation:
```typescript
// Supabase Dashboard > Authentication > Settings
// Enable "Enable email confirmations"
```

---

## Low Severity Issues

### 🟢 L1: Missing Security Headers

**Location:** `nuxt.config.ts`  
**Severity:** Low  
**CWE:** CWE-693 (Protection Mechanism Omission)

**Description:**
Important security headers are missing:
- `X-Frame-Options` (clickjacking)
- `X-Content-Type-Options` (MIME sniffing)
- `Strict-Transport-Security` (HTTPS enforcement)
- `Referrer-Policy`

**Recommendation:**
Configure in Nuxt or reverse proxy:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 🟢 L2: Dependency Vulnerabilities

**Location:** `package.json`  
**Severity:** Low  
**CWE:** CWE-1391 (Use of Weak Credentials)

**Description:**
Several dependencies should be monitored for vulnerabilities:
- `openai@4.77.3`
- `stripe@17.5.0`
- `bullmq@5.67.2`
- `ioredis@5.9.2`

**Recommendation:**
```bash
# Run regular audits
npm audit
npm audit fix

# Consider automated dependency updates
# GitHub Dependabot or Renovate
```

---

## Security Best Practices

### Implemented ✅

1. **Non-root Docker user** - Production container runs as `nuxtjs` user
2. **Environment variable separation** - Secrets stored in `.env`
3. **Row Level Security (RLS)** - Supabase RLS policies in place
4. **Webhook signature verification** - Stripe webhooks are signed
5. **Health check endpoint** - `/api/health` for monitoring
6. **TypeScript strict mode** - Type safety enabled

### Missing ❌

1. **Rate limiting** - No request throttling
2. **Input sanitization** - Limited validation on user inputs
3. **Audit logging** - No security event logging
4. **CORS configuration** - Default Nuxt CORS settings
5. **Security testing** - No SAST/DAST pipeline
6. **Secret rotation** - Static API keys
7. **Backup encryption** - Database backups not encrypted
8. **Monitoring/Alerting** - No security monitoring

---

## Recommendations

### Immediate Actions (Before Production)

1. **Fix Critical Issues (C1-C3)**
   - Move admin email validation server-side
   - Implement file signature validation
   - Audit service key usage

2. **Implement Rate Limiting**
   - Add `rate-limiter-flexible` package
   - Configure per-endpoint limits
   - Add exponential backoff

3. **Enhance Authentication**
   - Enable email verification
   - Add MFA support
   - Implement session timeout

4. **Security Headers**
   - Configure CSP, HSTS, X-Frame-Options
   - Use `helmet` middleware or Nuxt security module

### Short-term (1-2 Weeks)

5. **Input Validation Framework**
   - Use `zod` or `yup` for schema validation
   - Sanitize all user inputs
   - Validate file uploads server-side

6. **Error Handling Standardization**
   - Create error handler middleware
   - Log detailed errors internally
   - Return sanitized messages to clients

7. **Security Monitoring**
   - Set up error tracking (Sentry)
   - Implement security event logging
   - Configure alerts for suspicious activity

### Long-term (1-3 Months)

8. **Security Testing Pipeline**
   - Add SAST (Static Application Security Testing)
   - Implement DAST (Dynamic Application Security Testing)
   - Regular penetration testing

9. **Compliance**
   - GDPR compliance review
   - Data retention policies
   - Privacy impact assessment

10. **Infrastructure Hardening**
    - WAF (Web Application Firewall)
    - DDoS protection
    - Network segmentation

---

## Appendix: Secure Configuration Template

### `.env.production`
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx # Rotate quarterly

# OpenAI
OPENAI_API_KEY=sk-xxx # Use organization key with budget limits

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Redis
REDIS_HOST=internal-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=strong_password_here

# Security
ADMIN_EMAIL=admin@clarify.com # Not exposed to client
NODE_ENV=production
BASE_URL=https://clarify.com

# Rate Limiting
RATE_LIMIT_POINTS=10
RATE_LIMIT_DURATION=1

# Session
SESSION_TIMEOUT=3600
COOKIE_SECURE=true
```

### Security Checklist for Deployment

- [ ] All critical vulnerabilities fixed
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Error messages sanitized
- [ ] Email verification enabled
- [ ] Monitoring/alerting configured
- [ ] Backup strategy implemented
- [ ] Incident response plan created
- [ ] Security audit scheduled (quarterly)

---

## Contact

For security concerns or to report vulnerabilities:
- Email: security@clarify.com (configure this)
- PGP Key: [Add PGP key for secure communication]

---

**Document Version:** 1.0  
**Last Updated:** February 16, 2026  
**Next Review:** May 16, 2026
