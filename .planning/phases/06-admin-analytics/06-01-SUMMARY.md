---
phase: 06-admin-analytics
plan: 01
subsystem: admin-analytics
tags: [revenue, funnel, dashboard, chartjs, admin]
dependency_graph:
  requires: ["06-00"]
  provides: ["revenue-api", "funnel-api", "revenue-dashboard", "conversion-funnel"]
  affects: ["pages/admin/analytics.vue"]
tech_stack:
  added: ["chart.js"]
  patterns: ["time-series aggregation", "conversion funnel analysis"]
key_files:
  created:
    - server/api/admin/revenue.get.ts
    - server/api/admin/funnel.get.ts
    - tests/unit/admin/revenue.test.ts
    - tests/unit/admin/funnel.test.ts
  modified:
    - pages/admin/analytics.vue
decisions:
  - "Horizontal bar chart for funnel visualization (easier to read stage names)"
  - "Gross vs net revenue displayed as solid vs dashed lines for visual distinction"
  - "Package breakdown inferred from transaction amount ranges (no schema change needed)"
metrics:
  duration_minutes: 15
  completed_at: "2026-03-16T07:25:00Z"
---

# Phase 06 Plan 01: Revenue Dashboard Summary

**One-liner:** Revenue dashboard with time-series charts (day/week/month/quarter ranges) and 4-stage conversion funnel (signups → email verified → first analysis → first purchase) using Chart.js visualizations.

## Tasks Completed

| Task | Name                                      | Commit    | Files Modified/Created                          |
|------|-------------------------------------------|-----------|-------------------------------------------------|
| 1    | Revenue API endpoint                      | 45749cc   | server/api/admin/revenue.get.ts                 |
| 2    | Funnel API endpoint                       | 45749cc   | server/api/admin/funnel.get.ts                  |
| 3    | Revenue dashboard and funnel UI           | 17a8f45   | pages/admin/analytics.vue                       |
| 4    | API tests                                 | 87e5e2a   | tests/unit/admin/revenue.test.ts, funnel.test.ts |

## API Response Formats

### Revenue API (`GET /api/admin/revenue`)

**Query Parameters:**
- `range`: `day` | `week` | `month` | `quarter` | `custom`
- `from`: optional ISO date (for custom range)
- `to`: optional ISO date (for custom range)

**Response Example:**
```json
{
  "revenue": [
    { "date": "2026-03-01", "gross_revenue": 49.90, "net_revenue": 44.91, "transactions": 10, "credits_sold": 100 },
    { "date": "2026-03-02", "gross_revenue": 59.90, "net_revenue": 54.91, "transactions": 12, "credits_sold": 120 }
  ],
  "summary": {
    "total_revenue": 149.70,
    "total_net_revenue": 134.73,
    "total_transactions": 30,
    "total_credits_sold": 300
  },
  "by_package": [
    { "package": "5 credits", "revenue": 49.90, "count": 10, "credits": 50 },
    { "package": "10 credits", "revenue": 59.90, "count": 6, "credits": 60 },
    { "package": "25 credits", "revenue": 39.90, "count": 2, "credits": 50 }
  ],
  "period": {
    "from": "2026-03-01T00:00:00.000Z",
    "to": "2026-03-15T23:59:59.999Z"
  }
}
```

**Key Implementation Details:**
- Gross revenue: Sum of `type='purchase'` transactions
- Net revenue: Gross - refunds + adjustments
- Package inference: Amount ranges ($4.49-5.49 → 5 credits, $8.49-9.49 → 10 credits, $19.49-20.49 → 25 credits)
- Date grouping: Uses DATE_TRUNC logic based on range param (day/week/month/quarter)

### Funnel API (`GET /api/admin/funnel`)

**Query Parameters:**
- `range`: `7d` | `30d` | `90d` | `custom`
- `from`: optional ISO date (for custom range)
- `to`: optional ISO date (for custom range)

**Response Example:**
```json
{
  "funnel": [
    { "stage": "Signups", "count": 100, "rate": 100 },
    { "stage": "Email Verified", "count": 85, "rate": 85.0 },
    { "stage": "First Analysis", "count": 60, "rate": 70.6 },
    { "stage": "First Purchase", "count": 25, "rate": 41.7 }
  ],
  "period": {
    "from": "2026-03-01T00:00:00.000Z",
    "to": "2026-03-15T23:59:59.999Z"
  }
}
```

**Key Implementation Details:**
- Stage 1 (Signups): Users created in date range
- Stage 2 (Email Verified): Users with `email_confirmed_at` in range (via RPC or fallback)
- Stage 3 (First Analysis): Users with MIN(analyses.created_at) in range
- Stage 4 (First Purchase): Users with MIN(transactions.created_at) in range where status='completed'
- Rate calculation: `stage_n.count / stage_(n-1).count * 100` (rounded to 1 decimal)

## Test Results

**Revenue API Tests:** 6/6 passed
- Time range aggregation (day/week/month/quarter)
- Gross vs net revenue calculation
- Package breakdown inference
- Transaction filtering by status/type
- Date grouping logic

**Funnel API Tests:** 7/7 passed
- 4-stage funnel structure
- Conversion rate calculations
- Range parameter handling
- Zero signups edge case
- Unique user tracking
- Drop-off point identification

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- **ADMIN-01:** ✅ Conversion funnel visible with 4 stages (Signups → Email Verified → First Analysis → First Purchase) and conversion rates displayed
- **ADMIN-02:** ✅ Revenue dashboard showing daily/weekly/monthly/quarterly revenue trends with gross/net comparison

## Manual Verification Steps

1. Navigate to `/admin/analytics` as admin user
2. Verify revenue chart displays with Day/Week/Month/Quarter selector buttons
3. Verify gross revenue (solid green line) and net revenue (dashed blue line) render correctly
4. Verify conversion funnel displays 4 horizontal bars with decreasing widths
5. Click each time range button and verify both charts update
6. Verify summary cards show total revenue, net revenue, transactions, and credits sold
7. Verify funnel stats show retention percentages between stages

## Key Decisions

1. **Horizontal bar chart for funnel:** Easier to read stage names and compare bar widths visually
2. **Gross vs net as solid vs dashed lines:** Visual distinction without relying solely on color
3. **Package inference from amount:** Avoids schema changes; uses amount ranges to determine package tier
4. **Chart.js for visualizations:** Already in use for existing analyses chart; consistent styling

## Self-Check: PASSED

- [x] Revenue API endpoint exists and returns correct structure
- [x] Funnel API endpoint exists and returns 4-stage data
- [x] Analytics page renders revenue dashboard with time-series chart
- [x] Analytics page renders conversion funnel with horizontal bar chart
- [x] All 13 unit tests pass
- [x] Commits created for each task
