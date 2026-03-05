---
phase: 4
slug: stripe-monetization
status: partial
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
updated: 2026-03-05
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
| 04-01-01 | 01 | 1 | STRIPE-01 | unit | `npm run test:run tests/unit/stripe-checkout.spec.ts` | ✅ | ❌ red (config gap) |
| 04-01-02 | 01 | 1 | STRIPE-01 | unit | `npm run test:run tests/unit/webhook-handler.spec.ts` | ✅ | ❌ red (config gap) |
| 04-02-01 | 02 | 2 | STRIPE-02 | e2e | `npx playwright test --grep @stripe-purchase` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 3 | STRIPE-03 | integration | `npm run test:run tests/integration/atomic-credit-update.spec.ts` | ✅ | ❌ red (config gap) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/unit/stripe-checkout.spec.ts` — covers STRIPE-01 (exists, needs Nuxt mocking)
- [x] `tests/unit/webhook-handler.spec.ts` — covers STRIPE-01 (exists, needs Nuxt mocking)
- [x] `tests/e2e/credit-purchase-flow.spec.ts` — covers STRIPE-02 (exists)
- [x] `tests/integration/atomic-credit-update.spec.ts` — covers STRIPE-03 (exists, needs Nuxt mocking)
- [x] Framework install: Vitest + Playwright already configured
- [x] vitest.config.ts updated to include `*.spec.ts` files

### Remaining Gaps
- [ ] Add Nuxt test utils mock for `defineEventHandler`
- [ ] Add Nuxt test utils mock for `useRuntimeConfig`
- [ ] Verify E2E Playwright tests run

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

---

## Validation Audit 2026-03-05

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 1 (vitest.config.ts updated) |
| Escalated | 3 (Nuxt mocking gaps) |

### Audit Notes
- All test files exist: `stripe-checkout.spec.ts`, `webhook-handler.spec.ts`, `atomic-credit-update.spec.ts`, `credit-purchase-flow.spec.ts`
- Vitest config updated to include `*.spec.ts` files
- Tests fail due to missing Nuxt test utilities mocking (`defineEventHandler`, `useRuntimeConfig`)
- Requires Nuxt test setup or test refactoring to mock server-side functions
