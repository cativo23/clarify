---
phase: 10-v1-1-audit-gap-closure
plan: 01
subsystem: security/auth
tags: [admin, security, suspension, ADMIN-04, BLOCKER]
requires:
  - users.is_suspended column (migration 20260316000001)
  - serverSupabaseClient (#supabase/server)
  - getWorkerSupabaseClient (server/utils/worker-supabase.ts)
provides:
  - assertNotSuspended(event, userId?) → 403 ACCOUNT_SUSPENDED
  - ACCOUNT_SUSPENDED string constant
  - WorkerSupabaseClient.isUserSuspended(userId) → boolean
  - Suspension gate on POST /api/upload
  - Suspension gate on BullMQ analysis-queue job pickup
affects:
  - server/utils/auth.ts
  - server/api/upload.post.ts
  - server/plugins/worker.ts
  - server/utils/worker-supabase.ts
  - tests/unit/server/utils/suspension.test.ts
tech_stack:
  added: []
  patterns:
    - Fail-open on suspension lookup error (mirrors admin_emails defensive pattern)
    - Worker job-pickup gating (not enqueue) for pre-suspension queued jobs
    - Standardized error contract via data.code (no message parsing in clients)
key_files:
  created:
    - tests/unit/server/utils/suspension.test.ts
    - .planning/phases/10-v1-1-audit-gap-closure-enforce-suspension-complete-env-examp/deferred-items.md
  modified:
    - server/utils/auth.ts
    - server/api/upload.post.ts
    - server/plugins/worker.ts
    - server/utils/worker-supabase.ts
decisions:
  - Fail-open on suspension lookup error — infra hiccups must not lock out legitimate users; suspension is a deliberate admin act so absence of evidence = not suspended
  - Worker check at job pickup, not enqueue — covers queue items that pre-date the suspension event
  - Test file lives under tests/unit/server/utils/ (project convention) instead of plan-specified tests/server/ — vitest project config only globs tests/unit and tests/integration
  - Source-level grep tests for worker plugin (Tests 9–10) — defineNitroPlugin binds BullMQ at import, making direct invocation in vitest impractical; helper is unit-tested separately (Tests 8a/8b/8c)
metrics:
  duration_minutes: 18
  tasks_completed: 3
  files_changed: 5
  tests_added: 14
  completed_date: "2026-05-07"
---

# Phase 10 Plan 01: Enforce User Suspension Summary

JWT-style 403 gate (`ACCOUNT_SUSPENDED`) added to the shared auth helper, the upload endpoint, and the BullMQ worker so a flag previously written but never read now actually blocks suspended users from uploading, queuing, or having queued jobs processed.

## What Was Built

### 1. Shared helper — `server/utils/auth.ts`
- `ACCOUNT_SUSPENDED` constant (string literal type) — clients/UI branch on `error.data.code` rather than parsing messages.
- `assertNotSuspended(event, userId?)` — looks up `users.is_suspended` via the request-scoped Supabase client and throws 403 when true. Auto-resolves `userId` from session when omitted; returns silently for unauthenticated requests (auth gating stays the caller's responsibility, mirroring the existing `requireAdmin` separation). Fails open on lookup error.

### 2. Upload route — `server/api/upload.post.ts`
- Imports `assertNotSuspended` from `../utils/auth`.
- Calls it after `auth.getUser()` and BEFORE `readMultipartFormData`. Test 7 verifies the ordering — a suspended user's PDF is never parsed, never validated, never uploaded to Storage.

### 3. Worker — `server/plugins/worker.ts` + `server/utils/worker-supabase.ts`
- New `WorkerSupabaseClient.isUserSuspended(userId)` method on the scoped service-role wrapper. Reads only `users.is_suspended`; fails open on error.
- Worker job handler calls `isUserSuspended(userId)` BEFORE `updateAnalysisStatus("processing")` and `downloadContractFile`. On hit: logs `[Worker] Rejecting analysis ...`, sets status=`failed` with `error_message="account_suspended"`, returns. No credit debit (no work done).

## Tests (14, all passing)

| # | Coverage |
|---|----------|
| 1 | `assertNotSuspended` resolves silently when `is_suspended=false` |
| 2 | Throws 403 with `data.code='ACCOUNT_SUSPENDED'` when `is_suspended=true` |
| 3 | `ACCOUNT_SUSPENDED` constant exported and equals `"ACCOUNT_SUSPENDED"` |
| 4 | When `userId` omitted, helper resolves it via `auth.getUser()` |
| 4b | When unauthenticated, returns silently (auth handled elsewhere) |
| — | Fails open on suspension lookup error |
| 5 | Suspended user POST `/api/upload` returns 403 ACCOUNT_SUSPENDED |
| 6 | Non-suspended user passes the gate and proceeds |
| 7 | Gate runs BEFORE `readMultipartFormData` (no PDF parsed for suspended user) |
| 8a | `isUserSuspended` returns true when `is_suspended=true` |
| 8b | Returns false when `is_suspended=false` |
| 8c | Returns false (fail-open) when lookup errors |
| 9 | Worker source: `isUserSuspended` referenced before `downloadContractFile` |
| 10 | Worker source: emits `account_suspended` failure with early-return block |

Run: `npx vitest run tests/unit/server/utils/suspension.test.ts` → 14 passed.

## Commits

| Hash | Phase | Type |
|------|-------|------|
| 7f29f67 | 10-01 | test: failing tests for `assertNotSuspended` (RED) |
| ca1e6f5 | 10-01 | feat: `assertNotSuspended` helper + `ACCOUNT_SUSPENDED` constant (GREEN) |
| 86c8858 | 10-01 | test: failing tests for upload route suspension gate (RED) |
| be64f48 | 10-01 | security: gate `/api/upload` with `assertNotSuspended` (GREEN) |
| af06577 | 10-01 | test: failing tests for worker suspension gate (RED) |
| c5f8da3 | 10-01 | security: worker rejects suspended-user jobs at pickup (GREEN) |

TDD gates verified: each task has a `test(...)` commit immediately followed by a `feat`/`security` commit.

## Deviations from Plan

### Auto-fixed / Adjusted

**1. [Rule 3 — Blocker] Test file location**
- **Issue:** Plan listed `tests/server/suspension.test.ts`, but `vitest.config.ts` only globs `tests/unit/**` and `tests/integration/**` — a `tests/server/` file would never run.
- **Fix:** Wrote tests to `tests/unit/server/utils/suspension.test.ts` (matches existing convention seen in `tests/unit/server/utils/auth.test.ts` and `analysis-security.test.ts`).
- **Files modified:** plan path → `tests/unit/server/utils/suspension.test.ts`
- **Commits:** 7f29f67, 86c8858, af06577

**2. [Rule 3 — Blocker] Test runner cwd**
- **Issue:** Plan said run via `docker compose exec app npx vitest`. The container mounts the project root, not the worktree, so worktree changes are invisible to the container.
- **Fix:** Ran vitest on the host using parent project's `node_modules` (per-package symlinks plus a local `.nuxt/tsconfig.json` copy for `vitest.config.ts` resolution). All 14 tests pass cleanly.

**3. [Rule 3 — Blocker] `createError` not globally available in tests**
- **Issue:** First GREEN run had `caught.statusCode === undefined` because Nuxt's auto-imported `createError` is not stubbed by `tests/setup.ts`.
- **Fix:** `vi.stubGlobal('createError', (err) => err)` at the top of `suspension.test.ts`, matching the pattern in `tests/unit/server/utils/auth.test.ts`.

**4. [Plan deviation — semantic, not bug] Worker grep target**
- **Issue:** Plan acceptance criterion `grep -n "is_suspended" server/plugins/worker.ts` ≥ 1 match. The implementation delegates to `getWorkerSupabaseClient().isUserSuspended()` (the plan's own action step 2 explicitly permits this if it matches existing conventions in `worker-supabase.ts`, which it does — every other DB read in the worker goes through the wrapper).
- **Effect:** `worker.ts` references `isUserSuspended` (camelCase wrapper); the literal column name `is_suspended` lives in `worker-supabase.ts`. Spirit of the criterion (the worker actually reads the flag) is satisfied. Test 9 enforces the ordering at source level.

### Out-of-scope (Deferred)

Pre-existing typecheck errors observed during execution but NOT fixed (scope boundary rule):
- `components/demo/InteractiveDemo.vue`, `server/api/demo/simulate.post.ts`, `server/api/health.get.ts`
- `server/api/admin/funnel.get.ts`, `server/api/admin/revenue.get.ts` — likely resolved by sister plans 10-03 / 10-04

Logged in `.planning/phases/10-v1-1-audit-gap-closure-.../deferred-items.md`.

## Threat Model — Disposition

| ID | Status | Note |
|----|--------|------|
| T-10-01 (EoP — suspended user → upload) | mitigated | `assertNotSuspended` runs before file work in `upload.post.ts:29` |
| T-10-02 (EoP — pre-suspension queued job) | mitigated | Worker pickup gate at `worker.ts:44`, before `updateAnalysisStatus("processing")` |
| T-10-03 (Tampering — bypass via new endpoint) | accepted | Documented; new endpoints must call `assertNotSuspended` |
| T-10-04 (InfoDisclosure — error leak) | mitigated | Fixed `data.code='ACCOUNT_SUSPENDED'`; no DB error text propagated |
| T-10-05 (DoS — flapping suspension) | accepted | BullMQ retries already capped at 3 |

No new threat surface introduced. No `Threat Flags` needed.

## Verification Evidence

```
$ grep -rn "is_suspended\|isUserSuspended" server/ | grep -v test
server/api/upload.post.ts:28:    // Throws 403 with data.code='ACCOUNT_SUSPENDED' when users.is_suspended=true.
server/plugins/worker.ts:44:        if (await supabase.isUserSuspended(userId)) {
server/api/admin/users/[id].patch.ts:120:          is_suspended: true,
server/api/admin/users/[id].patch.ts:148:          is_suspended: false,
server/utils/auth.ts:149:    .select("is_suspended")
server/utils/auth.ts:159:  if (data?.is_suspended === true) {
server/utils/worker-supabase.ts:177:          .select("is_suspended")
server/utils/worker-supabase.ts:190:        return data?.is_suspended === true;
```

Readers exist in auth.ts (helper), upload.post.ts (via helper, doc reference), worker.ts (via helper), and worker-supabase.ts (helper impl). Writers remain in the admin patch route as intended.

## Success Criteria — Met

- [x] ADMIN-04: `users.is_suspended` is read by enforcement points (was: written-only)
- [x] Suspended user gets 403 `ACCOUNT_SUSPENDED` on `/api/upload` (Test 5)
- [x] Suspended user's queued job ends as `failed` / `account_suspended` without credit debit (Test 9 + worker.ts:48–51)
- [x] Zero new `any` casts introduced (verified by grep on diff; `worker-supabase.ts` `update` uses pre-existing `any` for `updateData` only)

## Self-Check: PASSED

- Files exist:
  - server/utils/auth.ts — FOUND (assertNotSuspended at line 134, ACCOUNT_SUSPENDED at line 112)
  - server/api/upload.post.ts — FOUND (gate at line 29, before readMultipartFormData at line 32)
  - server/plugins/worker.ts — FOUND (gate at line 44, before status="processing")
  - server/utils/worker-supabase.ts — FOUND (isUserSuspended at line 169)
  - tests/unit/server/utils/suspension.test.ts — FOUND (14 tests)
  - .planning/phases/.../deferred-items.md — FOUND
- Commits exist (verified via `git log --oneline d831fff..HEAD`):
  - 7f29f67, ca1e6f5, 86c8858, be64f48, af06577, c5f8da3 — all FOUND
- Tests pass: 14/14
