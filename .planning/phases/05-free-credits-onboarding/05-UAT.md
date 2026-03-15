---
status: testing
phase: 05-free-credits-onboarding
source:
  - 05-00-SUMMARY.md
  - 05-01-SUMMARY.md
  - 05-02-SUMMARY.md
  - 05-03-SUMMARY.md
started: 2026-03-15T22:15:00Z
updated: 2026-03-15T22:15:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Email Verification - 10 Free Credits on Signup
expected: New user signs up and verifies email. After email confirmation, user account shows 10 credits added. Database: free_credits_awarded = TRUE, free_credits_at has timestamp, credits increased by 10.
result: issue
reported: "no, solo 3 creditos"
severity: major

### 2. Free Credits Awarded Only Once
expected: User who already received free credits cannot receive them again on subsequent email verifications. Database: free_credits_awarded prevents duplicate awards.
result: skipped
reason: "Bloqueado - test 1 falla (no funciona agregar 10 créditos al verificar cuenta)"

### 3. Monthly Free Basic Analysis - One Per Month
expected: User can use 1 free Basic analysis per month. After using free analysis, monthly_free_analysis_used = TRUE. Next Basic analysis requires credits.
result: pass

### 4. Free Analysis Only Applies to Basic Tier
expected: Free analysis option only available for 'basic' tier. Premium and Forensic tiers always require credits regardless of monthly free analysis status.
result: pass

### 5. Monthly Free Analysis Reset
expected: At start of new calendar month, monthly_free_analysis_used resets to FALSE. User can use free Basic analysis again in the new month.
result: skipped
reason: "Se probará después - requiere esperar inicio de nuevo mes calendario"

### 6. Race Condition Prevention - Free Credits
expected: Multiple concurrent email verification requests do not result in multiple credit awards. Atomic FOR UPDATE lock prevents race conditions.
result: skipped
reason: "Test técnico - requiere script de peticiones concurrentes. Implementado a nivel de DB con FOR UPDATE lock."

### 7. Race Condition Prevention - Monthly Free Analysis
expected: Multiple concurrent requests for free Basic analysis do not both succeed. Only one request marks the analysis as used.
result: skipped
reason: "Test técnico - requiere script de peticiones concurrentes. Implementado a nivel de DB con FOR UPDATE lock."

### 8. Homepage Demo - Access Without Authentication
expected: Homepage (/) has "Ver Demo" button visible without login. Clicking opens demo modal/component without requiring authentication.
result: pass

### 9. Demo - Sample Documents Available
expected: Demo component shows 3 sample documents (Contrato de Servicios, Acuerdo de Confidencialidad, Contrato de Arrendamiento) for user to try.
result: pass

### 10. Demo - Contract Name Input
expected: User can enter custom contract name in text input field. Input accepts and displays entered text.
result: pass

### 11. Demo - Simulation Flow
expected: After entering contract name and clicking analyze, progress indicator shows upload progress. Simulated analysis completes and displays results with risk level, summary, and hallazgos.
result: pass

### 12. Demo - Rate Limiting
expected: After 10 demo requests within an hour, API returns 429 error. User sees friendly error message about rate limit.
result: pass
reported: "funciono, pero yo haria max 5 pruebas por dia por ip"
severity: minor

## Summary

total: 12
passed: 7
issues: 1
pending: 0
skipped: 4

## Gaps

- truth: "New user receives 10 credits automatically on email verification"
  status: failed
  reason: "User reported: no, solo 3 creditos"
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Demo rate limiting configured with reasonable limits"
  status: failed
  reason: "User reported: funciono, pero yo haria max 5 pruebas por dia por ip"
  severity: minor
  test: 12
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
