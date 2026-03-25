---
status: testing
phase: 06-admin-analytics
source: [06-00-SUMMARY.md, 06-01-SUMMARY.md, 06-02-SUMMARY.md]
started: 2026-03-16T08:08:38.097Z
updated: 2026-03-16T08:08:38.097Z
---

## Current Test

number: 4
name: Conversion Funnel - Drop-off Visualization
expected: |
  Funnel bars decrease in width showing drop-off between stages.
  Percentage rates displayed between stages.
awaiting: user response

**Note:** API endpoints fixed (require is not defined error). Retesting needed.

## Tests

### 1. Revenue Dashboard - Time Series Chart
expected: Navigate to /admin/analytics. Revenue chart displays with Day/Week/Month/Quarter selector. Gross and net revenue lines visible. Summary cards show totals.
result: issue
reported: "si salen los botones, chart no muestra graficos, summary cars no filtra bien, hay varios analisis premium y forensic oero no salen solo los basic, no se si calculos estan bien"
severity: major

### 2. Revenue Dashboard - Time Range Selection
expected: Click each time range button (Day/Week/Month/Quarter). Chart updates to show data for selected period.
result: issue
reported: "no muestra daata"
severity: major

### 3. Conversion Funnel - 4 Stage Display
expected: Funnel section displays 4 horizontal bars: Signups → Email Verified → First Analysis → First Purchase. Each bar shows count and conversion rate to next stage.
result: issue
reported: "no muestra nada, en los enpotins de api de los chars parece haber errores"
severity: major

### 4. Conversion Funnel - Drop-off Visualization
expected: Funnel bars decrease in width showing drop-off between stages. Percentage rates displayed between stages (e.g., 85% email verified, 70% first analysis, 41% first purchase).
result: pass

### 5. Cost Analysis - 3 Tier Cards
expected: Navigate to /admin/analytics, scroll to cost analysis section. Three tier cards display (Basic/Premium/Forensic) showing: analysis count, revenue, AI cost, gross margin, margin percentage.
result: pass

### 6. Cost Analysis - Summary Totals
expected: Cost analysis summary card shows: total revenue, total AI cost, total margin, overall margin percentage, blended cost per analysis.
result: pass

### 7. Cost Analysis - Time Range Selector
expected: Cost analysis has time range selector (7d/30d/90d/all). Selecting different ranges updates the displayed cost data.
result: pass

### 8. User Management - Navigate to User Detail
expected: From /admin/analytics user table, click "View" on any user. Navigates to /admin/user/[id] page showing user detail.
result: pass

### 9. User Management - User Header Display
expected: User detail page shows header with: email, user ID, signup date, current credit balance badge, suspension status badge (if suspended), last activity timestamp.
result: [pending]

### 10. User Management - Credit Adjustment Form
expected: Credit adjustment form displays with: Add/Remove radio buttons, amount input field, reason text field, "Apply Adjustment" button.
result: [pending]

### 11. User Management - Add Credits Flow
expected: Select "Add Credits", enter amount (e.g., 50), enter reason ("Test credit"), submit. User header updates showing new credit balance. Success toast notification appears.
result: [pending]

### 12. User Management - Credit Adjustment Audit Trail
expected: After credit adjustment, check database transactions table. Entry exists with type='adjustment', description includes reason for adjustment.
result: [pending]

### 13. User Management - Suspension Form Display
expected: Suspension form displays: current status badge, reason textarea, "Suspend Account" button (or "Unsuspend Account" if already suspended).
result: [pending]

### 14. User Management - Suspend User Flow
expected: Enter suspension reason ("Testing suspension"), click "Suspend Account". User status badge changes to "Suspended". Unsuspend button appears. Success notification shown.
result: [pending]

### 15. User Management - Unsuspend User Flow
expected: For suspended user, click "Unsuspend Account". User status returns to "Active". Suspension reason cleared. Success notification shown.
result: [pending]

### 16. User Management - Analysis History Table
expected: User detail page shows analysis history table with columns: date, contract name, tier (Basic/Premium/Forensic), status, credits used.
result: [pending]

## Summary

total: 16
passed: 0
issues: 3
pending: 13
skipped: 0

## Gaps

- truth: "Revenue chart displays with Day/Week/Month/Quarter selector. Gross and net revenue lines visible. Summary cards show totals."
  status: failed
  reason: "User reported: si salen los botones, chart no muestra graficos, summary cars no filtra bien, hay varios analisis premium y forensic oero no salen solo los basic, no se si calculos estan bien"
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Click each time range button (Day/Week/Month/Quarter). Chart updates to show data for selected period."
  status: failed
  reason: "User reported: no muestra daata"
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Funnel section displays 4 horizontal bars: Signups → Email Verified → First Analysis → First Purchase. Each bar shows count and conversion rate to next stage."
  status: failed
  reason: "User reported: no muestra nada, en los enpotins de api de los chars parece haber errores"
  severity: major
  test: 3
  root_cause: "require is not defined - using CommonJS require() in ESM module (Nuxt 3 server)"
  artifacts:
    - path: "server/api/admin/revenue.get.ts"
      issue: "Using require('@supabase/supabase-js') instead of ES6 import"
    - path: "server/api/admin/funnel.get.ts"
      issue: "Using require('@supabase/supabase-js') instead of ES6 import"
  missing:
    - "Add import { createClient } from '@supabase/supabase-js' at top of files"
    - "Remove require() call and use imported createClient directly"
  debug_session: ""
