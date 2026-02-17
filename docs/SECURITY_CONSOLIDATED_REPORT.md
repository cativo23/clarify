# Consolidated Security Report - Clarify

**Version:** 1.0.0-alpha.3  
**Date:** February 16, 2026  
**Status:** 🔴 High Risk (Under Remediation)  
**Auditors:** AntiGravity AI & Automated Security Review

---

## 📋 Executive Summary

This report consolidates findings from multiple security audits (Code Review, Threat Model, and Vulnerability Assessment). A total of **20 unique vulnerabilities** were identified across the platform. While structural security (RLS, Auth) is in place, significant logic and configuration flaws exist that require immediate attention.

| 🔴 **Critical** | 2 | Open |
| 🟠 **High** | 5 | Open |
| 🟡 **Medium** | 6 | Open |
| 🟢 **Low** | 2 | Open |
| ✅ **Resolved** | 6 | Fixed (C1-C3, H1, H4, Deps) |

**Overall Risk Score: 7.8/10 (High)**
---
## 🔴 Critical Vulnerabilities

### C4: Admin Pricing Endpoint Missing Authentication
- **Location:** `server/api/admin/pricing.get.ts`
- **Description:** Uses service key to bypass RLS but lacks any user/admin validation.
- **Impact:** Unauthenticated access to business-sensitive pricing data.

### C5: Service Role Key Overuse & Exposure Risk
- **Location:** `server/plugins/worker.ts`, `server/utils/openai-client.ts`
- **Description:** High blast radius due to extensive use of the `service_role` key without restricted scopes.
- **Impact:** Complete database compromise if any worker or admin endpoint is breached.

---

## 🟠 High Severity Issues

### H1: Admin Email Exposed in Public Config
- **Status:** ✅ FIXED (Feb 16, 2026)
- **Location:** `nuxt.config.ts`
- **Description:** `adminEmail` was moved from `runtimeConfig.public` to private `runtimeConfig`.
- **Remediation:** Admin status is now calculated on the server and exposed via the user profile API as a boolean `is_admin` flag. API routes are protected by a centralized `requireAdmin` utility that checks the private runtime config.

### H2: Missing Server-Side File Validation
- **Location:** `server/api/upload.post.ts`
- **Description:** No magic byte check; only extension and size are validated.
- **Impact:** Potential malware hosting or bypass of intended file types.

### H3: Information Disclosure in Error Responses
- **Location:** Multiple endpoints
- **Description:** Raw database and API errors (Stripe/OpenAI) are returned to the client.
- **Impact:** Reconnaissance information for attackers.
### H5: Client-Side Credit Update Risk
- **Location:** `composables/useSupabase.ts`
- **Description:** Client-side function exists that could allow setting arbitrary credit amounts if RLS is relaxed.
- **Impact:** Financial loss and privilege escalation.

### H6: Webhook Signature Verification Bypass
- **Location:** `server/api/stripe/webhook.post.ts`
- **Description:** Weak error handling in the webhook endpoint.
- **Impact:** Acceptance of forged payment events.

### H7: Potential SQL Injection in Stored Procedures
- **Location:** `database/init.sql`
- **Description:** Complex RPC functions require audit for dynamic SQL usage.

---

## 🟡 Medium Severity Issues

*   **M1: Missing Rate Limiting**: All endpoints allow unlimited requests. (Risk: DoS/Cost).
*   **M2: `SECURITY DEFINER` Search Path**: PL/pgSQL functions lack restricted search paths.
*   **M3: Redis without Auth/TLS**: Job queue is exposed in production environments.
*   **M4: Debug Info in DB**: Sensitive analysis metadata stored in public-accessible `summary_json`.
*   **M5: Insecure Cookie/CSP Config**: Lacks strict security headers and cookie flags.
*   **M6: Missing Email Verification**: Accounts can be used without verified identities.

---

## ✅ Resolved Issues

### Resolved: Library Vulnerabilities
- **Status:** FIXED (Feb 16, 2026)
- **Description:** High and Medium severity vulnerabilities found by `npm audit` (including `@isaacs/brace-expansion`) were fully resolved using `npm audit fix` and dependency pinning. 

### Resolved: C1 - Race Condition & IDOR in Credit Deduction
- **Status:** ✅ FIXED (Feb 16, 2026)
- **Location:** `server/api/analyze.post.ts`, `database/init.sql`, `database/migrations/001_...sql`
- **Description:** Fixed the TOCTOU race condition using `FOR UPDATE` row locking. Additionally resolved an IDOR vulnerability by removing `p_user_id` from the RPC and using `auth.uid()` securely on the server.

- **Description:** Implemented strict URL validation for Supabase Storage. Added hostname whitelisting, bucket restrictions (contracts only), path traversal prevention, and protocol enforcement (HTTPS-only). Enforced use of relative storage paths in the database instead of raw external URLs.

### Resolved: C3 - Open Redirect Protection
- **Status:** ✅ FIXED (Feb 17, 2026)
- **Location:** `server/api/stripe/checkout.post.ts`, `server/utils/redirect-validation.ts`
- **Description:** Removed client-side control of Stripe redirect URLs. Destinations are now constructed server-side using trusted origins and validated paths.

### Resolved: H4 - Atomic Stripe Credit Updates
- **Status:** ✅ FIXED (Feb 17, 2026)
- **Location:** `server/utils/stripe-client.ts`, `database/migrations/002_...sql`
- **Description:** Replaced dangerous Read-Modify-Write pattern with a single atomic PostgreSQL function (`increment_user_credits`). This ensures credit balances remains consistent even if multiple payment webhooks fire concurrently.

---

## 🛡️ Remediation Checklist

- [x] **Auth**: Move admin check to server-side and hide email.
- [ ] **Uploads**: Add `Buffer.subarray(0, 4)` magic byte check for `%PDF`.
- [x] **Atomic**: Refactor `increment_user_credits` into an atomic SQL function. (C1 & H4 Fixed)
- [ ] **SSL**: Enable TLS for Redis connections.
- [ ] **Headers**: Add `nuxt-security` module or custom CSP/HSTS middleware.

---

**End of Report**  
*Maintained by the Security Team.*
