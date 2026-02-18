# Security Documentation

**Project:** Clarify - Contract Analysis Platform
**Last Updated:** February 18, 2026

---

## Security Architecture

- **Authentication:** Supabase Auth with RLS (Row Level Security)
- **Authorization:** Admin access via `admin_emails` table with defense-in-depth
- **Rate Limiting:** Distributed Redis-based limiting with Upstash
- **Encryption:** TLS for all external services (Redis, Supabase, OpenAI, Stripe)
- **Input Validation:** Zod schemas on all user-facing endpoints
- **File Security:** Magic byte validation for uploads (PDF only)

---

## Security Controls

| Control | Location |
|---------|----------|
| Rate Limiting | `server/utils/rate-limit.ts` |
| Redis Security | Upstash with auth + TLS |
| Debug Info Protection | `server/utils/analysis-security.ts` |
| SSRF Protection | `server/utils/ssrf-protection.ts` |
| Redirect Validation | `server/utils/redirect-validation.ts` |
| File Validation | `server/utils/file-validation.ts` |
| Error Handling | `server/utils/error-handler.ts` |
| Atomic Operations | RPC `process_analysis_transaction` |
| Audit Logging | Admin operations logged |

### Security Headers

All responses include:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
```

### Key Files

| Category | Files |
|----------|-------|
| **Authentication** | `server/utils/auth.ts`, `middleware/auth.ts` |
| **Rate Limiting** | `server/utils/rate-limit.ts`, `server/plugins/rate-limit.ts` |
| **Input Validation** | `server/api/analyze.post.ts` |
| **File Security** | `server/utils/file-validation.ts`, `server/api/upload.post.ts` |
| **Error Handling** | `server/utils/error-handler.ts` |
| **SSRF Protection** | `server/utils/ssrf-protection.ts` |
| **Webhooks** | `server/api/stripe/webhook.post.ts`, `server/utils/stripe-client.ts` |
| **AI Security** | `server/utils/openai-client.ts`, `server/utils/analysis-security.ts` |

---

## OWASP Top 10 (2021) Coverage

| Category | Status | Notes |
|----------|--------|-------|
| A01 Broken Access Control | ✅ | Admin middleware, RLS, email normalization |
| A02 Cryptographic Failures | ✅ | TLS enforced for all external services |
| A03 Injection | ✅ | Zod validation, RPC parameterized |
| A04 Insecure Design | ✅ | Rate limiting, atomic operations |
| A05 Security Misconfiguration | ✅ | Redis TLS + auth required |
| A06 Vulnerable Components | ⚠️ | Monthly npm audit |
| A07 Auth/Session Failures | ✅ | Supabase Auth |
| A08 Data Integrity | ✅ | Atomic credit operations |
| A09 Logging Failures | ✅ | Audit logging, security alerts |
| A10 SSRF | ✅ | URL validation |

---

## Maintenance Schedule

### Monthly — Dependency Audit (30 min)

**When:** First Monday of each month

```bash
npm audit              # Check vulnerabilities
npm audit fix          # Auto-fix safe issues
npm audit --json       # Review remaining
```

### Quarterly — Security Review (2 hours)

**When:** First week of Jan, Apr, Jul, Oct

**Checklist:**
- [ ] Review rate limiting effectiveness
- [ ] Audit admin operations log
- [ ] Validate security headers
- [ ] Check error logs for info disclosure
- [ ] Review `admin_emails` table

**Quick Validation:**
```bash
# Security headers
curl -I https://yourapp.com | grep -E "Strict-Transport-Security|X-Frame-Options"

# Rate limiting active
grep "applyRateLimit" server/api/*.ts | wc -l  # Expected: > 3
```

### Annual — Security Assessment (Full Day)

**When:** February each year

- Full OWASP Top 10 review
- Penetration testing
- Infrastructure security review
- Incident response plan update

---

## Monitoring Alerts

| Alert | Trigger | Action |
|-------|---------|--------|
| **Redis Auth Failure** | Authentication fails or TLS drops | Check Upstash status, verify REDIS_TOKEN |
| **Rate Limit Anomaly** | Single IP exceeds limits repeatedly | Investigate for bot/attack |
| **Webhook Failure** | 3+ signature failures in 1 hour | Check webhook secret |
| **Admin Anomaly** | Non-configured admin attempts login | Review `admin_emails` table |

---

## Secret Management

### Required Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyxxx...
SUPABASE_SERVICE_ROLE=eyxxx...  # CRITICAL

# External Services
OPENAI_API_KEY=sk-xxx...
STRIPE_SECRET_KEY=sk_live_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...

# Redis (Upstash)
REDIS_HOST=your-upstash.upstash.io
REDIS_PORT=6379
REDIS_TOKEN=xxxxx  # Required in production

# Admin
ADMIN_EMAIL=admin@example.com
```

### Rules

- Rotate keys annually
- Use deployment platform secret manager
- Never log or expose secrets
- Service role key only in server code

---

## Admin Management

```sql
-- Add admin
INSERT INTO admin_emails (email, is_active, created_at)
VALUES ('newadmin@example.com', true, NOW());

-- Remove admin
UPDATE admin_emails
SET is_active = false
WHERE email = 'oldadmin@example.com';

-- View active admins
SELECT email, is_active, created_at
FROM admin_emails
WHERE is_active = true;
```

---

## Incident Response

**Immediately:**
1. Do **NOT** post in public channels
2. Contact security lead directly
3. Document: what, when, where, how discovered

**During Investigation:**
- Preserve logs and evidence
- Isolate affected systems if needed
- Notify affected users only after confirmed breach

**Post-Incident:**
- Root cause analysis
- Security review of related code
- Update this document with lessons learned

---

## Future Enhancements

- Multi-factor authentication (MFA) for admin
- API key rotation system
- IP allowlisting for admin access
- Web Application Firewall (WAF)
- SIEM integration (DataDog, New Relic)
- Bug bounty program
- Annual external penetration testing

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Analysis Tiers](./ANALYSIS_TIERS.md)
- [Stripe Setup](./STRIPE_SETUP.md)
