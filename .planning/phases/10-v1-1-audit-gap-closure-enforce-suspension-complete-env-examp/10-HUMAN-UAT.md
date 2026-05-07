---
status: partial
phase: 10-v1-1-audit-gap-closure-enforce-suspension-complete-env-examp
source: [10-VERIFICATION.md]
started: 2026-05-07T06:20:00Z
updated: 2026-05-07T06:20:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Apply migration 20260506000001_funnel_stage2_rpc to the live database
expected: `docker compose exec app npm run db:migrate` succeeds; `npm run db:status` shows the migration as applied; psql `\df get_email_verified_users_in_range` returns 1 row. Then ADMIN-01 truth #1 (RPC exists in live DB) is satisfied.
result: [pending]

### 2. Smoke: hit /api/admin/funnel as admin and verify Stage 2 reflects email_confirmed_at
expected: After migration apply, Stage 2 (Email Verified) count differs from Stage 1 (Signups) when the dataset contains unverified users. console.warn is NOT emitted in server logs.
result: [pending]

### 3. Live regression: suspend a test user, attempt POST /api/upload
expected: HTTP 403 with body.data.code === 'ACCOUNT_SUSPENDED'. Unsuspend → next upload succeeds (no cache layer).
result: [pending]

### 4. Live regression: queue an analysis as a normal user, then suspend before pickup
expected: Worker logs '[Worker] Rejecting analysis ...'; analysis row ends with status='failed', error_message='account_suspended'; no credit debit on credit_transactions.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
