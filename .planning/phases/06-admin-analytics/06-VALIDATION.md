---
phase: 6
slug: admin-analytics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (Nuxt 3 testing) |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | ADMIN-01 | component | `npm run test` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | ADMIN-02 | component | `npm run test` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ADMIN-03 | integration | `npm run test` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | ADMIN-04 | integration | `npm run test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/admin/` — stubs for ADMIN-01/02/03/04
- [ ] `tests/unit/admin/dashboard.test.ts` — revenue dashboard tests
- [ ] `tests/unit/admin/funnel.test.ts` — conversion funnel tests
- [ ] `tests/unit/admin/user-management.test.ts` — user management tests
- [ ] Vitest configured (existing infrastructure)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin sees conversion funnel with charts | ADMIN-01 | Visual chart rendering | 1. Navigate to /admin/analytics 2. Verify funnel chart displays 4 stages 3. Verify time range selector works |
| Admin sees revenue dashboard with charts | ADMIN-02 | Visual chart rendering | 1. Navigate to /admin/analytics 2. Verify revenue chart displays 3. Verify time range toggles update data |
| Admin sees cost per analysis vs profit margin | ADMIN-03 | Visual data accuracy | 1. Navigate to /admin/analytics 2. Verify cost analysis section shows margin by tier |
| Admin can add credits to user | ADMIN-04 | UI interaction + DB | 1. Navigate to /admin/users 2. Select user 3. Click "Add Credits" 4. Enter amount + reason 5. Verify credits updated in DB |
| Admin can suspend user | ADMIN-04 | UI interaction + DB | 1. Navigate to /admin/users 2. Select user 3. Click "Suspend" 4. Enter reason 5. Verify user suspended in DB |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
