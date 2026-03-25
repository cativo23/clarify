---
phase: 5
slug: free-credits-onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-03
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest / jest 29.x |
| **Config file** | nuxt.config.ts |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | CREDIT-01 | unit | `npm run test` | ✅ / ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | CREDIT-02 | unit | `npm run test` | ✅ / ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | DEMO-01 | e2e | `npm run test:e2e` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/free-credits.spec.ts` — stubs for CREDIT-01
- [ ] `tests/unit/monthly-analysis.spec.ts` — stubs for CREDIT-02
- [ ] `tests/e2e/demo.spec.ts` — stubs for DEMO-01
- [ ] `tests/fixtures/users.ts` — shared fixtures

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email verification triggering credit allocation | CREDIT-01 | Requires actual email flow | Manually verify email verification grants 10 credits |
| Monthly free analysis reset | CREDIT-02 | Time-dependent behavior | Verify counter resets on schedule |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending