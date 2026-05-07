---
phase: 10-v1-1-audit-gap-closure
plan: 04
subsystem: admin-analytics
tags: [admin, revenue, refactor, audit-gap, ADMIN-02]
requires:
  - credit_transactions.credits_purchased column
provides:
  - by_package breakdown decoupled from Stripe pricing
  - vitest invariance test pinning ADMIN-02 fix
affects:
  - server/api/admin/revenue.get.ts
tech_stack:
  added: []
  patterns:
    - "Lookup-table mapping (Record<number,string>) in module scope, decouples reporting from pricing"
key_files:
  created:
    - tests/unit/server/revenue-package-breakdown.test.ts
  modified:
    - server/api/admin/revenue.get.ts
decisions:
  - "Map by_package from credit_transactions.credits_purchased (5/10/25), NOT amount price-bands; null/unknown counts bucket as 'other'"
  - "Test file placed under tests/unit/server/ (vitest config restricts discovery to tests/unit/** and tests/integration/**); plan-suggested tests/server/ would not be discovered"
metrics:
  duration_minutes: 12
  tasks_completed: 2
  tests_passed: 5
  completed_date: 2026-05-07
---

# Phase 10 Plan 04: Decouple revenue by_package from Stripe pricing — Summary

**One-liner:** Replace amount-band package inference in `admin/revenue.get.ts` with a deterministic `credits_purchased → label` lookup, plus a vitest invariance test that fails if any future change re-couples the breakdown to Stripe amounts.

## Outcome

- ADMIN-02 (WARNING in v1.1-MILESTONE-AUDIT.md) is closed: by_package breakdown is now derived from `credit_transactions.credits_purchased`, so changing Stripe prices in `server/utils/stripe-client.ts` cannot silently shift package buckets.
- Legacy rows with NULL `credits_purchased` bucket as `"other"` (no crash, explicit branch via `tx.credits_purchased ?? null`).
- Mapping is documented inline at the module-scope `PACKAGE_LABEL` constant: `5 → "5 credits"`, `10 → "10 credits"`, `25 → "25 credits"`, else `"other"`.
- 5/5 vitest tests pass; Test 2 is the load-bearing invariance assertion (same `credits_purchased`, mutated amounts → identical by_package shape).

## Tasks

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Replace amount-band inference with credits_purchased mapping | `ffdeb49` | `server/api/admin/revenue.get.ts` |
| 2 | Vitest test — price-change invariance + null-credits bucketing | `7699a63` | `tests/unit/server/revenue-package-breakdown.test.ts` |

## Acceptance Criteria — Verified

Task 1:
- `grep "amount >= 4.49\|amount >= 8.49\|amount >= 19.49"` → 0 matches ✓
- `grep "PACKAGE_LABEL"` → 3 matches (definition + 2 lookups) ✓
- `grep -c "credits_purchased"` → 7 (≥3) ✓
- `grep "decoupled from Stripe"` → 2 matches (≥1) ✓
- typecheck: no new errors introduced (3 pre-existing TS errors in unrelated date-key block at lines 96/111/117 are out-of-scope — same count both pre- and post-refactor)

Task 2:
- File exists at `tests/unit/server/revenue-package-breakdown.test.ts` ✓
- 5 passing tests (vitest reports `5 passed`) ✓
- `grep "invariance|invariant|price.*change"` → 6 matches (≥1) ✓
- `grep -c "99.00|199.00|299.00"` → 5 (≥3) ✓
- `grep "credits_purchased: null"` → 2 (≥1) ✓

## Plan Verification

- ✅ typecheck clean (no new errors from this plan; 3 pre-existing errors in unrelated date-key block are tracked as out-of-scope)
- ✅ All 5 tests pass
- ✅ `grep "amount >= "` in `revenue.get.ts` returns 0 matches (no remnants of price-band logic)

## Deviations from Plan

### [Rule 3 - Blocking] Test file path moved from `tests/server/` to `tests/unit/server/`

- **Found during:** Task 2 setup
- **Issue:** Plan specifies `tests/server/revenue-package-breakdown.test.ts`, but `vitest.config.ts` restricts test discovery to `tests/unit/**` and `tests/integration/**`. A file at `tests/server/...` would not be discovered or executed.
- **Fix:** Created the file at `tests/unit/server/revenue-package-breakdown.test.ts` instead. Mirrors the existing `tests/unit/server/funnel-stage2.test.ts` location used by Plan 10-02. The docker_note in the executor prompt also flags this exact constraint.
- **Files modified:** `tests/unit/server/revenue-package-breakdown.test.ts` (instead of `tests/server/...`)
- **Commit:** `7699a63`

### Out-of-scope pre-existing typecheck errors (NOT fixed)

`server/api/admin/revenue.get.ts` has 3 pre-existing TS strict-mode errors (lines 96, 111, 117) in the date-key grouping block, unrelated to the by_package logic this plan touches. Verified by stash-and-recheck baseline: same 3 errors before the refactor (at offsets 85, 100, 106). Logged here for the verifier; not fixed per scope-boundary rule.

## Threat Model Coverage

| ID | Mitigation Status |
|----|-------------------|
| T-10-13 (tampering with credits_purchased) | Accept — admin endpoint is read-only; writes gated by Stripe webhook RPC |
| T-10-14 (info disclosure) | Mitigated — `requireAdmin` unchanged at top of handler |
| T-10-15 (legacy NULL crash) | Mitigated — `tx.credits_purchased ?? null` + Test 3 covers bucketing |
| T-10-16 (silent drift after price change) | Mitigated — THIS WAS THE BUG; Test 2 enforces invariance permanently |

## TDD Gate Compliance

This plan's two tasks were committed in pragmatic order: refactor (`ffdeb49`) then test (`7699a63`). The test file targets the post-refactor implementation; reverting the refactor commit alone would cause the test to fail (Test 2's invariance assertion specifically demands the credits_purchased path), so the gate is enforced retroactively. No standalone failing-test commit was created; this is a divergence from strict RED-first ordering, but the invariance test is explicitly engineered to fail on the legacy code path (amounts of 99/199/299 would all bucket as "other"), so the regression-protection guarantee is intact.

## Self-Check: PASSED

- File `server/api/admin/revenue.get.ts` modified ✓ (commit `ffdeb49` in `git log`)
- File `tests/unit/server/revenue-package-breakdown.test.ts` created ✓ (commit `7699a63` in `git log`)
- Both commit hashes present in `git log --oneline -3`
- 5/5 tests pass under `npx vitest run`
- 0 price-band remnants in source
