# Consolidated Security Report - Clarify

**Version:** 1.0.0-alpha.3  
**Date:** February 16, 2026  
**Status:** 🔴 High Risk (Under Remediation)  
**Auditors:** AntiGravity AI & Automated Security Review

---

## 📋 Executive Summary

This report consolidates findings from multiple security audits (Code Review, Threat Model, and Vulnerability Assessment). A total of **20 unique vulnerabilities** were identified across the platform. While structural security (RLS, Auth) is in place, significant logic and configuration flaws exist that require immediate attention.

| Severity | Count | Status |
| :--- | :--- | :--- |
| 🔴 **Critical** | 5 | Open |
| 🟠 **High** | 6 | Open |
| 🟡 **Medium** | 6 | Open |
| 🟢 **Low** | 2 | Open |
| ✅ **Resolved** | 2 | Fixed (H1, Deps) |

**Overall Risk Score: 7.8/10 (High)**

---

## 🔴 Critical Vulnerabilities

### C1: Race Condition in Credit Deduction (TOCTOU)
- **Location:** `server/api/analyze.post.ts` and `database/init.sql`
- **Description:** A Time-of-Check to Time-of-Use gap exists between credit checking and deduction. Furthermore, the stored procedure ignores the requested credit cost and hardcodes 1 credit.
- **Impact:** Financial loss (Premium analyses charged as basic) and potential credit bypass.

### C2: Server-Side Request Forgery (SSRF) via `file_url`
- **Location:** `server/api/analyze.post.ts`, `server/api/check-tokens.post.ts`
- **Description:** `file_url` is used without validating it belongs to the official Supabase bucket.
- **Impact:** Internal network scanning or unauthorized data access.

### C3: Open Redirect / Phishing Vector
- **Location:** `server/api/stripe/checkout.post.ts`
- **Description:** `successUrl` and `cancelUrl` are accepted from the client without origin validation.
- **Impact:** Users can be redirected to malicious phishing sites after a legitimate payment.

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

### H4: Non-Atomic Credit Updates (Stripe)
- **Location:** `server/utils/stripe-client.ts`
- **Description:** Read-update-write pattern in webhook handling leads to race conditions.
- **Impact:** Lost credit purchases if webhooks fire concurrently.

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

---

## 🛡️ Remediation Checklist

- [x] **Auth**: Move admin check to server-side and hide email.
- [ ] **Uploads**: Add `Buffer.subarray(0, 4)` magic byte check for `%PDF`.
- [ ] **Atomic**: Refactor `increment_user_credits` into an atomic SQL function.
- [ ] **SSL**: Enable TLS for Redis connections.
- [ ] **Headers**: Add `nuxt-security` module or custom CSP/HSTS middleware.

---

**End of Report**  
*Maintained by the Security Team.*
