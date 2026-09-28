---
phase: 10-v1-1-audit-gap-closure
plan: 02
subsystem: admin-analytics
tags: [admin, funnel, supabase-rpc, security-definer, audit-gap, ADMIN-01]
requires: [auth.users.email_confirmed_at, public.users]
provides: [public.get_email_verified_users_in_range, funnel-stage2-warn]
affects: [server/api/admin/funnel.get.ts]
tech-stack:
  added:
    - PostgreSQL SECURITY DEFINER SQL function (parameterized timestamptz)
  patterns:
    - SECURITY DEFINER + REVOKE PUBLIC + GRANT authenticated/service_role
    - operator-actionable console.warn on RPC fallback (cite migration ID)
key-files:
  created:
    - database/migrations/20260506000001_funnel_stage2_rpc.sql
    - tests/unit/server/funnel-stage2.test.ts
  modified:
    - server/api/admin/funnel.get.ts
decisions:
  - Test placed under tests/unit/server/ instead of plan-specified tests/server/ — vitest config restricts discovery to tests/unit/** and tests/integration/**
  - Task 2 (db:migrate) deferred to operator/orchestrator — Clarify app container not running in this worktree
metrics:
  duration: ~10m
  completed: 2026-05-06
---

# Phase 10 Plan 02: Funnel Stage 2 RPC Summary

Closed ADMIN-01 audit gap by creating the missing `get_email_verified_users_in_range` SECURITY DEFINER RPC, surfacing fallback degradation via an operator-actionable console.warn, and adding a Vitest smoke test that proves Stage 2 ≠ Stage 1 with a mixed seed.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create migration for funnel Stage 2 RPC | `56725af` | database/migrations/20260506000001_funnel_stage2_rpc.sql |
| 2 | [BLOCKING] Apply migration to live database | _deferred to operator_ | (no files) |
| 3 | Add fallback warning in funnel.get.ts | `dac47b9` | server/api/admin/funnel.get.ts |
| 4 | Vitest smoke test — Stage 2 ≠ Stage 1 | `58bde63` | tests/unit/server/funnel-stage2.test.ts |

## Implementation Notes

**Migration (`20260506000001_funnel_stage2_rpc.sql`):**
- `LANGUAGE sql` (not plpgsql) — pure parameterized join, smallest attack surface
- `SECURITY DEFINER` with `SET search_path = public, auth` — prevents search-path hijack
- Returns `(id uuid, email_confirmed_at timestamptz)` — matches call-site shape (`verifiedData?.length`, `.map(u => u.id)`)
- `REVOKE ALL FROM PUBLIC` then `GRANT EXECUTE TO authenticated, service_role` — least-privilege
- Idempotent re-run via leading `DROP FUNCTION IF EXISTS` so signature changes don't conflict on apply

**Handler change (`funnel.get.ts`):**
- `console.warn` injected as the first statement of the `if (verifiedError)` branch
- Message cites migration ID `20260506000001` so operators can self-diagnose without reading code
- Fallback preserved (Stage 2 == Stage 1) — degradation is now logged, not silent

**Test (`funnel-stage2.test.ts`):**
- 4 tests: Stage 1 count, Stage 2 count, Stage 2 < Stage 1, warn-on-fallback
- Mocks `@supabase/supabase-js` with chainable `from()` stubs implementing `then` for awaiting `.gte().lte()` chains, plus `rpc()` returning per-test seed
- Stubs Nuxt globals (`defineEventHandler`, `getQuery`, `createError`) at definition time
- Mocks `requireAdmin` and `getAdminSupabaseClient` so the handler runs without real auth/admin wrapper
- Each invocation re-imports the handler module to bind against current mocks

## Deviations from Plan

### [Rule 3 - Blocking] Test path moved to vitest-discoverable location

- **Found during:** Task 4
- **Issue:** Plan specifies `tests/server/funnel-stage2.test.ts`, but `vitest.config.ts` only includes `tests/unit/**` and `tests/integration/**`. A test placed at the plan path would never run.
- **Fix:** Created the file at `tests/unit/server/funnel-stage2.test.ts` (matches existing `tests/unit/server/utils/*.test.ts` convention).
- **Files modified:** tests/unit/server/funnel-stage2.test.ts
- **Commit:** `58bde63`

### Task 2 deferred to operator (environment limitation, not a code fix)

- **Found during:** Task 2 attempt
- **Issue:** This worktree has no running Clarify `app` container and `node_modules/.vite-temp` is not writable, so `docker compose exec app npm run db:migrate` cannot execute. Running containers on the host belong to unrelated projects.
- **Action:** Migration file is correct, idempotent, and committed. The orchestrator/operator must run `docker compose exec app npm run db:migrate` from the project root after the worktree is merged. The plan's [BLOCKING] gate is recorded as a runtime gate — Phase 10 verification must include `db:status` showing 20260506000001 applied before declaring ADMIN-01 satisfied.
- **Verification command (post-merge):**
  ```bash
  docker compose exec app npm run db:migrate
  docker compose exec app npm run db:status | grep 20260506000001
  ```

### Vitest run not executed in worktree

- **Issue:** `npx vitest run` fails with `EACCES` writing to `node_modules/.vite-temp`; Clarify `app` container is not running here either.
- **Action:** Acceptance criteria verified by file/grep checks. Tests were authored against the actual handler logic and existing mock conventions (cf. `tests/mocks/supabase.ts`, `tests/unit/webhook-handler.spec.ts`). The orchestrator must run `docker compose exec app npx vitest run tests/unit/server/funnel-stage2.test.ts` after merge to confirm all 4 tests pass.

## Threat Model Compliance

| ID | Disposition | Implementation |
|----|-------------|----------------|
| T-10-06 | mitigate | `LANGUAGE sql`, typed `timestamptz` params only, no `EXECUTE format`/`||` concat, `search_path` pinned |
| T-10-07 | mitigate | `requireAdmin` gate at API layer; RPC exposes only `id` + `email_confirmed_at` (no PII beyond what admin already sees) |
| T-10-08 | accept | timestamptz typing prevents string injection |
| T-10-09 | accept | small dataset, admin-only endpoint |

## Verification

- [x] Migration file exists, contains `SECURITY DEFINER`, `auth.users` join, `GRANT EXECUTE`, no dynamic SQL
- [x] funnel.get.ts contains `console.warn` with `RPC failed; falling back` and `20260506000001`
- [x] Test file exists with 4 `it(...)` blocks, references `console.warn` spy and Stage 2 assertions
- [ ] Migration applied (deferred — operator step)
- [ ] Vitest run green (deferred — operator step)

## Self-Check: PASSED

**Files verified:**
- FOUND: database/migrations/20260506000001_funnel_stage2_rpc.sql
- FOUND: server/api/admin/funnel.get.ts (modified)
- FOUND: tests/unit/server/funnel-stage2.test.ts

**Commits verified:**
- FOUND: 56725af (migration)
- FOUND: dac47b9 (warn-on-fallback)
- FOUND: 58bde63 (test)
