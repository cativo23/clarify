# Security Maintenance Guide

**Last Updated:** February 18, 2026  
**Status:** 🟢 Production Ready - All Known Issues Resolved

This guide establishes security practices and regular maintenance tasks to keep Clarify secure.

---

## 📅 Regular Security Tasks

### 🔄 **Monthly - Dependency Audit** (30 min)

**First Monday of each month**

```bash
# Check for known vulnerabilities
npm audit

# Auto-fix where safe
npm audit fix

# Review any remaining issues
npm audit --json | jq '.vulnerabilities'
```

**Action Items:**
- [ ] Review output for HIGH/CRITICAL vulnerabilities
- [ ] Create issues for any unresolved security vulnerabilities
- [ ] Document reasons if not fixing (with security sign-off)

**Responsible:** Lead Developer

---

### 📊 **Quarterly Security Review** (2 hours)

**First week of Jan, Apr, Jul, Oct**

**Checklist:**
- [ ] Review rate limiting configuration effectiveness
  - Check logs for rate limit violations
  - Adjust presets in `server/utils/rate-limit.ts` if needed
  
- [ ] Audit admin operations log
  - Review who accessed admin dashboard
  - Look for suspicious patterns in `admin_emails` table
  
- [ ] Review authentication changes
  - Any new login methods added?
  - Email verification still working?
  - MFA/2FA considerations?

- [ ] Check error logs for information disclosure
  - Search for exposed API keys, paths, or error details
  - Verify error sanitization is working

- [ ] Security headers validation
  - Test with `securityheaders.com`
  - Verify CSP, HSTS, X-Frame-Options still configured

**Command - Validate Security Headers:**
```bash
curl -I https://yourapp.com | grep -E "Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options|Content-Security-Policy"
```

**Responsible:** Security Lead + Tech Lead

---

### 🔐 **Annual Security Assessment** (Full Day)

**February of each year**

**Activities:**
- [ ] Full code security review (OWASP Top 10)
- [ ] Penetration testing (internal or 3rd party)
- [ ] Infrastructure security review
- [ ] Database access policy audit
- [ ] Incident response plan review
- [ ] Update this guide based on findings

**Responsible:** Security Team / External Consultant

---

## 🚨 Continuous Monitoring

### Production Alerts - Enable These

**Redis Connection Issues**
```
Alert if: Redis authentication fails OR TLS connection drops
Action: Check Upstash status, verify REDIS_TOKEN in production config
```

**Rate Limit Anomalies**
```
Alert if: Single IP exceeds limits repeatedly OR endpoint getting 429 responses
Action: Investigate for bot/attack activity, check logs with: 
  grep "ratelimit" /var/log/app.log
```

**Webhook Verification Failures**
```
Alert if: Stripe webhook signature verification fails 3+ times in an hour
Action: Check webhook secret, verify Stripe dashboard configuration
Location: server/api/stripe/webhook.post.ts logs
```

**Admin Access Anomalies**
```
Alert if: Non-configured admin email attempts login OR suspicious admin operations
Action: Review admin_emails table, check last_login timestamps
```

---

## 🔧 Key Security Configuration Files

**Never commit these files:**
- `.env` (environment secrets)
- `.env.local` (local overrides)

**Always review when changed:**
- `nuxt.config.ts` - Security headers, CSP configuration
- `server/utils/rate-limit.ts` - Rate limit presets (DoS protection)
- `server/utils/auth.ts` - Admin authentication logic
- `database/migrations/` - RLS policies, SECURITY DEFINER functions

---

## 🛡️ Critical Controls - Health Check

Run this quarterly to verify security controls are active:

```bash
# 1. Verify security headers are set
curl -s https://yourapp.com -I | grep -c "Strict-Transport-Security" 
# Expected: 1 (header present)

# 2. Check Redis TLS in production
echo $REDIS_TOKEN | wc -c
# Expected: > 20 (token exists)

# 3. Verify admin_emails table exists
# In Supabase Dashboard: SQL Editor
# SELECT COUNT(*) FROM admin_emails WHERE is_active = true;
# Expected: ≥ 1 (at least one admin)

# 4. Verify RLS is enabled
# In Supabase Dashboard: Check each table has RLS policies

# 5. Check rate limiting is active
grep "applyRateLimit" server/api/*.ts | wc -l
# Expected: > 3 (endpoints have rate limiting)
```

---

## 📞 Incident Response

### If You Suspect a Security Issue

**Immediately:**
1. **Do NOT post in public channels** (Slack, GitHub issues)
2. Contact security lead directly
3. Document: what, when, where, how discovered

**During Investigation:**
- Preserve logs and evidence
- Isolate affected systems if needed
- Notify affected users only after confirmed breach

**Post-Incident:**
- Root cause analysis
- Security review of related code
- Update this guide with lessons learned

---

## 🔐 Password & Secret Management

### Environment Secrets

**Production (`.env` - never committed):**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyxxx...
SUPABASE_SERVICE_ROLE=eyxxx...  # CRITICAL - protect carefully!
OPENAI_API_KEY=sk-xxx...
STRIPE_SECRET_KEY=sk_live_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
REDIS_HOST=your-upstash.upstash.io
REDIS_PORT=6379
REDIS_TOKEN=xxxxx  # Required in production
```

**Security Rules:**
- ✅ Rotate keys annually
- ✅ Use Vercel/deployment platform's secret manager (not local .env)
- ✅ Never log or expose secrets in error messages
- ✅ Service role key should be used only in server code
- ✅ Anon key safe for client-side (limited by RLS)

### Admin Email Configuration

**Add New Admin:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run:
```sql
INSERT INTO admin_emails (email, is_active, created_at)
VALUES ('newadmin@example.com', true, NOW());
```

**Remove Admin:**
```sql
UPDATE admin_emails
SET is_active = false
WHERE email = 'oldadmin@example.com';
```

**View Current Admins:**
```sql
SELECT email, is_active, created_at FROM admin_emails WHERE is_active = true;
```

---

## 📚 Security Learning Resources

- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Nuxt Security Modules](https://nuxt-security.vercel.app/)

---

## 📋 Maintenance Checklist Template

**Use this for quarterly reviews:**

```markdown
## Security Review - [QUARTER YYYY]

**Date:** ___________
**Reviewer:** ___________

### Dependency Audit
- [ ] Ran `npm audit`
- [ ] No unresolved HIGH/CRITICAL issues
- [ ] Updated `package-lock.json`

### Rate Limiting
- [ ] Reviewed limit presets effectiveness
- [ ] Checked for unusual rate limit violations
- [ ] Adjusted limits if needed

### Admin Access
- [ ] Verified admin_emails table contents
- [ ] Removed inactive admins
- [ ] Added new admins as needed

### Error Handling
- [ ] Sampled error logs for info disclosure
- [ ] Verified sanitization working
- [ ] No sensitive data in responses

### Headers & TLS
- [ ] Validated security headers present
- [ ] Tested with https://securityheaders.com/
- [ ] Verified Redis TLS in production

### Incidents
- [ ] No security incidents reported
- [ ] All past issues remediated
- [ ] Preventive measures in place

### Next Actions
- [ ] ___________
- [ ] ___________

**Sign-off:** ___________
```

---

## 🎯 Security Roadmap (Future Enhancements)

Consider these improvements in future versions:

- 🔮 **Multi-factor authentication (MFA)** for admin dashboard
- 🔮 **API key rotation** system for external integrations
- 🔮 **IP allowlisting** for admin access
- 🔮 **Web Application Firewall (WAF)** on Cloudflare/similar
- 🔮 **Security logging to external SIEM** (DataDog, New Relic, etc.)
- 🔮 **Bug bounty program** for responsible disclosure
- 🔮 **Annual external penetration testing**

---

## 📞 Contacts & Escalation

| Role | Contact | When to Contact |
|------|---------|-----------------|
| **Security Lead** | [Define] | Highest priority security issues |
| **Tech Lead** | [Define] | Technical security questions |
| **DevOps** | [Define] | Infrastructure/TLS/secrets issues |
| **Legal/Compliance** | [Define] | Data breach or compliance incidents |

---

## 📝 Document Updates

| Date | What Changed | Who | Reason |
|------|-------------|-----|--------|
| Feb 18, 2026 | Initial guide creation | Security Team | All issues resolved, establish maintenance |
| | | | |

---

**Last Reviewed:** February 18, 2026  
**Next Review Due:** May 18, 2026 (Quarterly)
