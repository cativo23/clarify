# Secure Coding Guidelines - Clarify

**Version:** 1.0  
**Effective Date:** February 16, 2026  
**Applies To:** All developers working on Clarify

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation](#input-validation)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [File Handling](#file-handling)
6. [Error Handling & Logging](#error-handling--logging)
7. [Dependencies & Supply Chain](#dependencies--supply-chain)
8. [Database Security](#database-security)
9. [Deployment Security](#deployment-security)
10. [Code Review Checklist](#code-review-checklist)

---

## Authentication & Authorization

### ✅ DO:

**Use server-side session management**
```typescript
// ✅ Correct: Server-side auth check
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  // ... protected logic
})
```

**Implement principle of least privilege**
```typescript
// ✅ Correct: Use client-side user context for user data
const client = await serverSupabaseClient(event) // Uses user's session

// ✅ Correct: Use admin client only when necessary
const adminClient = createAdminClient({ purpose: 'worker' })
```

**Validate authorization on every request**
```typescript
// ✅ Correct: Check ownership before accessing resources
const { data: analysis } = await client
  .from('analyses')
  .select('*')
  .eq('id', analysisId)
  .eq('user_id', user.id) // Ownership check
  .single()
```

### ❌ DON'T:

**Never trust client-side authentication**
```typescript
// ❌ WRONG: Trusting client-sent user ID
const userId = event.context.userId // Can be spoofed!

// ✅ CORRECT: Get user from session
const user = await serverSupabaseUser(event)
```

**Never expose secrets to client**
```typescript
// ❌ WRONG: Service key in client code
const client = createClient(url, serviceKey) // In .vue file!

// ✅ CORRECT: Service key only in server/ directory
const client = createAdminClient({ purpose: 'worker' }) // In server/
```

**Don't skip authorization checks**
```typescript
// ❌ WRONG: Assuming authenticated user owns the resource
const { data } = await client.from('analyses').select().eq('id', id)

// ✅ CORRECT: Explicit ownership check
const { data } = await client
  .from('analyses')
  .select()
  .eq('id', id)
  .eq('user_id', user.id)
```

---

## Input Validation

### ✅ DO:

**Validate all user inputs**
```typescript
// ✅ Correct: Schema validation with Zod
import { z } from 'zod'

const analyzeSchema = z.object({
  file_url: z.string().url(),
  contract_name: z.string().min(1).max(255),
  analysis_type: z.enum(['basic', 'premium']).default('premium'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = analyzeSchema.parse(body)
  // ... use validated data
})
```

**Sanitize filenames**
```typescript
// ✅ Correct: Remove path traversal and special chars
export const sanitizeFilename = (filename: string): string => {
  const base = path.basename(filename) // Remove paths
  return base.replace(/[^a-zA-Z0-9._-]/g, '_') // Allow only safe chars
}
```

**Use allowlists for enums**
```typescript
// ✅ Correct: Allowlist for analysis types
const VALID_TYPES = ['basic', 'premium'] as const
type AnalysisType = typeof VALID_TYPES[number]

const validateType = (type: string): AnalysisType => {
  if (!VALID_TYPES.includes(type as AnalysisType)) {
    throw createError({ statusCode: 400, message: 'Invalid analysis type' })
  }
  return type as AnalysisType
}
```

### ❌ DON'T:

**Never use user input directly in queries**
```typescript
// ❌ WRONG: Direct concatenation (SQL injection risk)
const query = `SELECT * FROM analyses WHERE id = '${userId}'`

// ✅ CORRECT: Parameterized queries
const { data } = await client.from('analyses').select().eq('id', userId)
```

**Don't trust Content-Type headers**
```typescript
// ❌ WRONG: Only checking MIME type from client
if (file.type !== 'application/pdf') reject()

// ✅ CORRECT: Verify file signature
const signature = file.buffer.toString('hex', 0, 4)
if (signature !== '25504446') reject() // %PDF
```

---

## Data Protection

### ✅ DO:

**Encrypt sensitive data at rest**
```typescript
// ✅ Correct: Use Supabase encryption for sensitive fields
// Database level: Enable pgcrypto extension
// Application level: Encrypt before storing if needed
```

**Use HTTPS everywhere**
```typescript
// ✅ Correct: Force HTTPS in production
// nuxt.config.ts
export default defineNuxtConfig({
  security: {
    headers: {
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    },
  },
})
```

**Implement data minimization**
```typescript
// ✅ Correct: Only fetch needed fields
const { data } = await client
  .from('users')
  .select('id, email, credits') // Not select('*')
  .eq('id', user.id)
```

### ❌ DON'T:

**Never log sensitive data**
```typescript
// ❌ WRONG: Logging full user object
console.log('User data:', user) // May contain tokens, emails, etc.

// ✅ CORRECT: Log only necessary info
console.log('User authenticated:', user.id)
```

**Don't store API keys in code**
```typescript
// ❌ WRONG: Hardcoded API key
const apiKey = 'sk-1234567890abcdef'

// ✅ CORRECT: Environment variable
const apiKey = process.env.OPENAI_API_KEY
```

---

## API Security

### ✅ DO:

**Implement rate limiting**
```typescript
// ✅ Correct: Rate limiter on sensitive endpoints
const authLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60, // per minute
})

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event)
  await authLimiter.consume(ip)
  // ... auth logic
})
```

**Use proper HTTP status codes**
```typescript
// ✅ Correct: Specific error codes
throw createError({ statusCode: 401, message: 'Unauthorized' }) // Auth failed
throw createError({ statusCode: 403, message: 'Forbidden' }) // No permission
throw createError({ statusCode: 404, message: 'Not Found' }) // Resource missing
throw createError({ statusCode: 429, message: 'Too Many Requests' }) // Rate limited
```

**Validate request size**
```typescript
// ✅ Correct: Limit request body size
export default defineEventHandler(async (event) => {
  const body = await readBody(event, { limit: '1mb' })
  // ... process body
})
```

### ❌ DON'T:

**Never expose internal errors**
```typescript
// ❌ WRONG: Exposing stack traces
throw createError({
  statusCode: 500,
  message: error.stack, // Internal details!
})

// ✅ CORRECT: Generic error message
console.error('Analysis failed:', error)
throw createError({
  statusCode: 500,
  message: 'Analysis failed. Please try again.',
})
```

**Don't allow unlimited retries**
```typescript
// ❌ WRONG: No retry limits
queue.add('job', data)

// ✅ CORRECT: Limited retries with backoff
queue.add('job', data, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: 100,
})
```

---

## File Handling

### ✅ DO:

**Validate files comprehensively**
```typescript
// ✅ Correct: Multi-layer validation
export const validateFile = (file: UploadedFile): ValidationResult => {
  // 1. Check size
  if (file.size > MAX_SIZE) return { valid: false, error: 'Too large' }
  
  // 2. Check extension
  if (!ALLOWED_EXTENSIONS.includes(file.ext)) {
    return { valid: false, error: 'Invalid extension' }
  }
  
  // 3. Check signature (magic bytes)
  const sig = file.buffer.toString('hex', 0, 4)
  if (!VALID_SIGNATURES.includes(sig)) {
    return { valid: false, error: 'Invalid file type' }
  }
  
  // 4. Scan for malware (production)
  // await clamav.scan(file.buffer)
  
  return { valid: true }
}
```

**Use secure storage paths**
```typescript
// ✅ Correct: Isolated storage with user prefix
const storagePath = `${user.id}/${Date.now()}-${randomUUID()}.pdf`

// Upload to user's isolated bucket
await client.storage.from('contracts').upload(storagePath, buffer)
```

**Generate unique filenames**
```typescript
// ✅ Correct: UUID-based filenames
import { randomUUID } from 'crypto'

const uniqueName = `${user.id}/${randomUUID()}.pdf`
```

### ❌ DON'T:

**Never use original filenames directly**
```typescript
// ❌ WRONG: Using client-provided filename
const path = `uploads/${file.name}` // Path traversal risk!

// ✅ CORRECT: Sanitize and generate new name
const safeName = `${user.id}/${randomUUID()}.pdf`
```

**Don't store files in webroot**
```typescript
// ❌ WRONG: Public directory
await fs.writeFile(`./public/uploads/${filename}`, buffer)

// ✅ CORRECT: Use Supabase Storage with private bucket
await client.storage.from('contracts').upload(path, buffer)
```

---

## Error Handling & Logging

### ✅ DO:

**Log errors with context**
```typescript
// ✅ Correct: Structured logging
console.error(JSON.stringify({
  level: 'error',
  timestamp: new Date().toISOString(),
  context: 'analyze_contract',
  userId: user.id,
  analysisId: analysisId,
  error: error.message,
  code: error.code,
}))
```

**Use error boundaries**
```typescript
// ✅ Correct: Try-catch with proper handling
try {
  const result = await analyzeContract(text)
  return { success: true, data: result }
} catch (error: any) {
  console.error('Analysis error:', {
    userId: user.id,
    message: error.message,
    code: error.code,
  })
  return {
    success: false,
    error: 'Analysis failed. Please try again.',
  }
}
```

**Implement health checks**
```typescript
// ✅ Correct: Comprehensive health check
export default defineEventHandler(async () => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    openai: await checkOpenAI(),
  }
  
  const healthy = Object.values(checks).every(c => c.ok)
  
  return {
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  }
})
```

### ❌ DON'T:

**Never swallow errors silently**
```typescript
// ❌ WRONG: Empty catch block
try {
  await riskyOperation()
} catch (error) {
  // Silent failure!
}

// ✅ CORRECT: Log and handle
try {
  await riskyOperation()
} catch (error: any) {
  console.error('Operation failed:', error.message)
  throw error
}
```

**Don't expose stack traces**
```typescript
// ❌ WRONG: Sending stack trace to client
return { error: error.stack }

// ✅ CORRECT: Generic message
return { error: 'An unexpected error occurred' }
```

---

## Dependencies & Supply Chain

### ✅ DO:

**Pin dependency versions**
```json
// ✅ Correct: Exact versions in package.json
{
  "dependencies": {
    "openai": "4.77.3",
    "stripe": "17.5.0"
  }
}
```

**Run regular audits**
```bash
# ✅ Correct: Weekly audit script
# package.json
{
  "scripts": {
    "security:audit": "npm audit --audit-level=high",
    "security:fix": "npm audit fix"
  }
}
```

**Use dependency update automation**
```yaml
# ✅ Correct: GitHub Dependabot
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

### ❌ DON'T:

**Never use unpinned versions**
```json
// ❌ WRONG: Allowing any version
{
  "dependencies": {
    "openai": "^4.0.0", // Could install vulnerable 4.99.9
    "stripe": "*" // Never use wildcards!
  }
}
```

**Don't ignore audit warnings**
```bash
# ❌ WRONG: Ignoring vulnerabilities
npm audit # Has critical vulnerabilities, but deploy anyway

# ✅ CORRECT: Fix before deploy
npm audit fix
# Or update specific packages
npm update package-name
```

---

## Database Security

### ✅ DO:

**Use Row Level Security (RLS)**
```sql
-- ✅ Correct: RLS policy for analyses table
CREATE POLICY "Users can view own analyses"
ON analyses FOR SELECT
USING (auth.uid() = user_id);
```

**Use stored procedures for complex operations**
```sql
-- ✅ Correct: Atomic credit transaction
CREATE OR REPLACE FUNCTION process_analysis_transaction(
  p_user_id uuid,
  p_credit_cost integer
) RETURNS uuid AS $$
DECLARE
  v_analysis_id uuid;
BEGIN
  -- Check credits
  IF (SELECT credits FROM users WHERE id = p_user_id) < p_credit_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Deduct credits and create analysis atomically
  UPDATE users SET credits = credits - p_credit_cost WHERE id = p_user_id;
  
  INSERT INTO analyses (user_id, ...)
  VALUES (p_user_id, ...)
  RETURNING id INTO v_analysis_id;
  
  RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Implement database backups**
```bash
# ✅ Correct: Automated daily backups
# crontab
0 2 * * * pg_dump -U postgres clarify | gzip > /backups/clarify-$(date +\%F).sql.gz
```

### ❌ DON'T:

**Never use admin credentials in application**
```typescript
// ❌ WRONG: Using service key for regular queries
const client = createClient(url, SERVICE_KEY) // Has full access!

// ✅ CORRECT: Use user session or limited role
const client = await serverSupabaseClient(event) // Respects RLS
```

**Don't skip input validation in SQL**
```sql
-- ❌ WRONG: Dynamic SQL with user input
EXECUTE 'SELECT * FROM ' || user_provided_table;

-- ✅ CORRECT: Parameterized queries
SELECT * FROM analyses WHERE id = $1;
```

---

## Deployment Security

### ✅ DO:

**Use non-root users in containers**
```dockerfile
# ✅ Correct: Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

USER nuxtjs
```

**Implement health checks**
```dockerfile
# ✅ Correct: Health check in Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1
```

**Use secrets management**
```bash
# ✅ Correct: Docker secrets or environment files
docker run --env-file .env.production clarify-app

# Or use Docker secrets in Swarm/Kubernetes
```

### ❌ DON'T:

**Never commit .env files**
```bash
# ❌ WRONG: .env in git
git add .env.production

# ✅ CORRECT: .env in .gitignore
echo ".env*" >> .gitignore
```

**Don't run as root**
```dockerfile
# ❌ WRONG: Running as root (default)
FROM node:20-alpine
USER root # Explicit root!

# ✅ CORRECT: Non-root user
FROM node:20-alpine
RUN adduser --system nuxtjs
USER nuxtjs
```

---

## Code Review Checklist

### Before Submitting PR

- [ ] **Authentication**: All endpoints verify user session
- [ ] **Authorization**: Ownership/permission checks in place
- [ ] **Input Validation**: All user inputs validated/sanitized
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **Logging**: No secrets/PII in logs
- [ ] **Dependencies**: No new vulnerable packages
- [ ] **File Uploads**: Signature validation implemented
- [ ] **Database**: RLS policies cover new tables
- [ ] **Environment Variables**: No hardcoded secrets
- [ ] **TypeScript**: Strict mode, no `any` types

### Security Testing

```bash
# Run before merging
npm run lint
npm run typecheck
npm run security:audit

# Test file upload security
./scripts/test-upload-security.sh

# Test rate limiting
ab -n 100 -c 20 http://localhost:3001/api/health
```

---

## Incident Response

### If a vulnerability is discovered:

1. **Immediate**: Rotate affected credentials
2. **Assess**: Determine scope and impact
3. **Fix**: Implement and test remediation
4. **Deploy**: Emergency deployment if critical
5. **Review**: Post-incident analysis
6. **Document**: Update this guide with learnings

### Contact

- Security Team: security@clarify.com
- Emergency: +XX-XXX-XXX-XXXX (on-call)

---

**Acknowledgments:** These guidelines are based on:
- OWASP Top 10
- CWE/SANS Top 25
- NIST Secure Software Development Framework
- Supabase Security Best Practices

**Last Updated:** February 16, 2026  
**Next Review:** Quarterly or after major incidents
