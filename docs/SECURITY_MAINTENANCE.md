# Security Maintenance

> **Note:** This document has been consolidated into the main [Security Documentation](./SECURITY.md).

## Quick Reference

For complete security information including audit findings, controls, and maintenance procedures, see:

**[docs/SECURITY.md](./SECURITY.md)**

## Maintenance Schedule Summary

| Frequency | Task | Duration |
|-----------|------|----------|
| **Monthly** | Dependency audit (`npm audit`) | 30 min |
| **Quarterly** | Security review (headers, rate limits, admin access) | 2 hours |
| **Annually** | Full security assessment, penetration testing | Full day |

## Quick Health Checks

```bash
# Validate security headers
curl -I https://yourapp.com | grep -E "Strict-Transport-Security|X-Frame-Options"

# Check rate limiting is active
grep "applyRateLimit" server/api/*.ts | wc -l  # Expected: > 3

# Verify Redis TLS in production
echo $REDIS_TOKEN | wc -c  # Expected: > 20
```

## Key Files to Review

| File | Purpose |
|------|---------|
| `server/utils/auth.ts` | Admin authentication |
| `server/utils/rate-limit.ts` | Rate limiting configuration |
| `server/api/stripe/webhook.post.ts` | Webhook security |
| `database/migrations/*` | RLS policies |

---

**See [SECURITY.md](./SECURITY.md) for:**
- Complete audit findings and fixes
- OWASP Top 10 compliance mapping
- Incident response procedures
- Secret management guidelines
- Admin management SQL commands
