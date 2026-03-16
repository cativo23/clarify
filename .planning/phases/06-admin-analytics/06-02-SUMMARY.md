---
phase: 06
plan: 02
type: execute
completed: 2026-03-16
tasks_completed: 4
total_tasks: 4
completed: true
requirements: [ADMIN-03, ADMIN-04]
dependency_graph:
  requires: ["06-01"]
  provides: ["cost-analysis", "user-management"]
  affects: ["admin-dashboard"]
tech_stack:
  added:
    - "Supabase users table suspension fields"
  patterns:
    - "Zod validation for admin actions"
    - "Audit trail via transactions table"
key_files:
  created:
    - "server/api/admin/costs.get.ts"
    - "server/api/admin/users/[id].patch.ts"
    - "database/migrations/20260316000001_add_user_suspension_fields.sql"
    - "database/migrations/20260316000002_update_admin_users_view.sql"
  modified:
    - "pages/admin/analytics.vue"
    - "pages/admin/user/[id].vue"
    - "types/index.ts"
    - "tests/unit/admin/costs.test.ts"
    - "tests/unit/admin/user-management.test.ts"
decisions:
  - "Used $0.99/credit for revenue calculations (standardized pricing)"
  - "Credit adjustments logged as type='adjustment' with amount=0 (audit trail without monetary value)"
  - "Suspension requires mandatory reason field for compliance"
  - "Infer tier from credits_used when summary_json.tier missing (fallback logic)"
metrics:
  duration_minutes: 45
  tests_added: 30
  files_created: 4
  files_modified: 5
---

# Phase 06 Plan 02: Cost Analysis & User Management Summary

## One-Liner

Built cost analysis dashboard with profit margin tracking per tier (Basic/Premium/Forensic) and user management UI for credit adjustments and account suspension with audit trail logging.

---

## Task Summary

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Create cost analysis API endpoint | Complete | 8f51b2d |
| 2 | Create user update endpoint | Complete | 27698a6 |
| 3 | Create user detail page with management UI | Complete | fabd1a1 |
| 4 | Verify admin user management functionality | Complete | a5f586f |

---

## Implementation Details

### Cost Analysis API (`/api/admin/costs.get.ts`)

**Endpoint:** `GET /api/admin/costs?range=7d|30d|90d|all`

**Response Format:**
```json
{
  "by_tier": [
    {
      "tier": "Basic",
      "analyses": 150,
      "revenue": 148.50,
      "ai_cost": 22.30,
      "gross_margin": 126.20,
      "margin_percent": 84.9,
      "avg_cost_per_analysis": 0.15
    },
    { "tier": "Premium", ... },
    { "tier": "Forensic", ... }
  ],
  "summary": {
    "total_revenue": 500.00,
    "total_ai_cost": 75.00,
    "total_margin": 425.00,
    "overall_margin_percent": 85.0,
    "blended_cost_per_analysis": 2.50
  },
  "period": {
    "from": "2026-02-14T00:00:00Z",
    "to": "2026-03-16T00:00:00Z"
  }
}
```

**Cost Calculation Logic:**
- Extracts token usage from `summary_json._debug.usage`
- Maps tier to model: basic→gpt-4o-mini, premium→gpt-5-mini, forensic→gpt-5
- Calculates: `(input_tokens / 1000 * input_cost) + (output_tokens / 1000 * output_cost)`
- Revenue: `credits_used * $0.99`
- Margin: `revenue - ai_cost`

### User Update Endpoint (`/api/admin/users/[id].patch.ts`)

**Endpoint:** `PATCH /api/admin/users/[id]`

**Request Body:**
```typescript
{
  action: 'add_credits' | 'remove_credits' | 'suspend' | 'unsuspend',
  amount?: number,      // Required for credit actions
  reason: string        // Required for all actions
}
```

**Response (add_credits example):**
```json
{
  "success": true,
  "user": { "id": "...", "credits": 150, "email": "user@example.com" },
  "action": "add_credits",
  "amount": 50,
  "previous_credits": 100,
  "new_credits": 150
}
```

**Audit Trail:**
- Credit adjustments create `transactions` record with `type='adjustment'`
- Description: `"Added 50 credits: Manual credit for testing"`
- Suspension updates `is_suspended`, `suspension_reason`, `suspended_at` fields

### User Detail Page (`/admin/user/[id].vue`)

**Sections:**
1. **User Header Card**: Email, ID, signup date, credits badge, suspension status
2. **Stats Grid**: Total/Completed analyses, risk breakdown
3. **Credit Adjustment Form**: Add/Remove credits with amount and reason
4. **Suspension Form**: Status display, reason input, suspend/unsuspend button
5. **Analysis History Table**: All user analyses with risk levels

**Styling:**
- Follows existing admin design (rounded-[2rem], glassmorphism)
- Success/error toast notifications after actions
- Auto-refresh user data after successful actions

### Cost Analysis Dashboard (`/admin/analytics.vue`)

**Features:**
- Time range selector: 7d, 30d, 90d, all
- Three tier cards showing revenue, AI cost, gross margin, margin %
- Summary card with overall totals
- Color-coded margin percentages (green ≥80%, amber ≥60%, red <60%)

---

## Database Migrations

### 20260316000001_add_user_suspension_fields.sql

Adds suspension tracking to users table:
```sql
ALTER TABLE users
  ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN suspension_reason TEXT,
  ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_users_is_suspended ON users(is_suspended);
```

### 20260316000002_update_admin_users_view.sql

Updates admin_users_summary view to include suspension fields and email_confirmed_at.

**Manual Setup Required:**
Run these migrations in Supabase SQL Editor:
```bash
# Copy contents of:
# - database/migrations/20260316000001_add_user_suspension_fields.sql
# - database/migrations/20260316000002_update_admin_users_view.sql
```

---

## Test Results

**All 35 tests passing:**
```
✓ tests/unit/admin/costs.test.ts (14 tests) - Cost analysis logic
✓ tests/unit/admin/user-management.test.ts (16 tests) - User management logic
✓ tests/unit/admin/revenue.test.ts (3 tests) - Revenue API (Plan 06-01)
✓ tests/unit/admin/funnel.test.ts (2 tests) - Funnel API (Plan 06-01)
```

**Test Coverage:**
- Cost breakdown by tier
- Profit margin calculations
- Token usage cost extraction
- Credit adjustment validation
- Suspension/unsuspension flows
- Audit trail creation
- Date range handling

---

## Deviations from Plan

### Auto-fixed Issues

**None** - Plan executed exactly as written. All implementations matched the specified requirements.

---

## Manual Verification Required (Task 4)

### Cost Analysis Verification

1. Navigate to `/admin/analytics`
2. Verify cost analysis section displays below pricing snapshot
3. Check 3 tier cards (Basic/Premium/Forensic) with:
   - Analysis counts
   - Revenue and AI costs
   - Gross margin and margin percentage
4. Verify summary shows total margin and blended cost
5. Test time range selector (7d, 30d, 90d, all)

### User Management Verification

1. Navigate to `/admin/analytics` and click "View" on any user
2. Verify user detail page shows:
   - User info header with credits and suspension status
   - Credit adjustment form (Add/Remove radio, amount input, reason field)
   - Suspension form (status badge, reason textarea, action button)
   - Analysis history table
3. Test credit adjustment:
   - Select "Add Credits", enter 50, enter reason "Test credit"
   - Submit and verify credits updated in header
   - Verify transaction logged in database
4. Test suspension:
   - Enter reason "Testing suspension"
   - Click "Suspend Account"
   - Verify status shows "Suspended"
   - Verify unsuspend button appears
   - Click unsuspend and verify status returns to "Active"
5. Database verification:
   ```sql
   -- Check transaction audit trail
   SELECT * FROM transactions WHERE type = 'adjustment' ORDER BY created_at DESC LIMIT 5;

   -- Check suspension fields
   SELECT id, email, is_suspended, suspension_reason, suspended_at
   FROM users
   WHERE is_suspended = true OR suspension_reason IS NOT NULL;
   ```

---

## Files Created/Modified

**Created:**
- `server/api/admin/costs.get.ts` - Cost analysis endpoint
- `server/api/admin/users/[id].patch.ts` - User management endpoint
- `database/migrations/20260316000001_add_user_suspension_fields.sql`
- `database/migrations/20260316000002_update_admin_users_view.sql`

**Modified:**
- `pages/admin/analytics.vue` - Added cost analysis section
- `pages/admin/user/[id].vue` - Added credit/suspension forms
- `types/index.ts` - Added suspension fields to User interface
- `tests/unit/admin/costs.test.ts` - Implemented cost analysis tests
- `tests/unit/admin/user-management.test.ts` - Implemented user management tests

---

## Requirements Completed

- [x] **ADMIN-03**: Cost analysis shows margin by tier with accurate AI cost calculations
- [x] **ADMIN-04**: User management UI allows credit adjustments and suspension with audit trail

**Manual verification:** Approved by user - all functionality verified working

---

*Generated: 2026-03-16*
*Plan: 06-02*
*Phase: 06-admin-analytics*
