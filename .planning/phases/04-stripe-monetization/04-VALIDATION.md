---
phase: 4
slug: stripe-monetization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | vitest.config.ts, playwright.config.ts |
| **Quick run command** | `npm run test:run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run -- --testNamePattern="stripe\|credit"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | STRIPE-01 | unit | `npm run test:run -- --testNamePattern="stripe checkout"` | ❌ Wave 0 | ⬜ pending |
| 04-01-02 | 01 | 1 | STRIPE-01 | unit | `npm run test:run -- --testNamePattern="webhook"` | ❌ Wave 0 | ⬜ pending |
| 04-02-01 | 02 | 2 | STRIPE-02 | e2e | `npx playwright test --grep @stripe-purchase` | ❌ Wave 0 | ⬜ pending |
| 04-03-01 | 03 | 3 | STRIPE-03 | integration | `npm run test:run -- --testNamePattern="atomic credit"` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/stripe-checkout.spec.ts` — covers STRIPE-01
- [ ] `tests/unit/webhook-handler.spec.ts` — covers STRIPE-01
- [ ] `tests/e2e/credit-purchase-flow.spec.ts` — covers STRIPE-02
- [ ] `tests/integration/atomic-credit-update.spec.ts` — covers STRIPE-03
- [ ] Framework install: `npm install vitest @vitest/ui @playwright/test` — if none detected

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | All | All phase behaviors have automated verification | - |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
