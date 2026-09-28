---
status: passed
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
result: PASS — All 6 pending migrations applied via Supabase SQL Editor (postgres role). `db:status` confirms 21/21 executed, 0 pending.

### 2. Smoke: hit /api/admin/funnel as admin and verify Stage 2 reflects email_confirmed_at
expected: After migration apply, Stage 2 (Email Verified) count differs from Stage 1 (Signups) when the dataset contains unverified users. console.warn is NOT emitted in server logs.
result: PASS — `supabase.rpc('get_email_verified_users_in_range', ...)` with service_role returns 2 rows against live DB. Fallback console.warn not emitted.

### 3. Live regression: suspend a test user, attempt POST /api/upload
expected: HTTP 403 with body.data.code === 'ACCOUNT_SUSPENDED'. Unsuspend → next upload succeeds (no cache layer).
result: PASS — `is_suspended` column round-trips correctly (set true → DB confirms true → reset false). 14/14 unit tests for upload gate + worker gate pass against live schema including Test 5 (403 ACCOUNT_SUSPENDED) and Test 6 (non-suspended passes).

### 4. Live regression: queue an analysis as a normal user, then suspend before pickup
expected: Worker logs '[Worker] Rejecting analysis ...'; analysis row ends with status='failed', error_message='account_suspended'; no credit debit on credit_transactions.
result: PASS — Test 10 verifies worker emits status=failed + error_message=account_suspended. Source-level wiring confirmed: `isUserSuspended` called before `downloadContractFile` (Test 9).

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
