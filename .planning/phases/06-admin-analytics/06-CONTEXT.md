# Phase 6: Admin Analytics - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement admin analytics dashboard for operational visibility into revenue, costs, and user behavior. Specifically:
- Revenue dashboard with daily/weekly/monthly/quarterly charts
- Conversion funnel (signup → purchase visualization)
- Cost analysis per tier (token usage vs profit margin)
- User management UI (add credits, suspend users, view history)

</domain>

<decisions>
## Implementation Decisions

### Revenue Dashboard
- Time ranges: Day, Week, Month, Quarter + Custom date range picker
- Chart type: Line chart (recommended for time-series trends)
- Metrics: Gross revenue, Net revenue (after refunds/adjustments), Revenue by package (5/10/25 credit packages)
- Updates: Refresh on page load + Manual refresh button (admin controls updates)

### Conversion Funnel
- Visualization: Classic funnel chart (wide-to-narrow showing drop-off)
- Stages tracked (4 stages for complete visibility):
  1. Signup → Email verified (onboarding completion)
  2. Email verified → First analysis (activation)
  3. First analysis → First purchase (monetization)
  4. Purchase → Repeat purchase (retention)
- Time range: Last 7/30/90 days + Custom selector
- Tracking approach: Reconstruct historical from existing DB timestamps (users.created_at, transactions, analyses)

### Cost Analysis Per Tier
- Primary view: Profit margin by tier (revenue - AI costs for Basic/Premium/Forensic)
- Key metrics:
  - AI model costs (input + output tokens × price)
  - Gross margin per tier (revenue - AI costs)
  - Average cost per analysis (blended average across all tiers)
- Updates: On-demand only (refresh on page load, no realtime updates)

### User Management
- Admin actions available:
  - Add/remove credits manually (with reason required)
  - Suspend/unsuspend account (mandatory reason field for audit trail)
  - View full analysis history
  - View transaction history
- Credit adjustments: Logged to `transactions` table as type='adjustment' (maintains consistent audit trail)
- User data visible:
  - Email and ID
  - Sign-up date
  - Last activity (last analysis timestamp)
  - Email verification status
  - Current credit balance
  - Lifetime value (total spent)
- Suspension: Requires mandatory reason field (audit trail)
- Credit adjustment: Add/subtract with required reason

### Layout & Navigation
- Navigation: Sidebar navigation (Analytics / Users / Settings sections)
- User list: Pagination (25-50 users per page)
- Data export: CSV export for all tables (useful for external analysis, accounting)

### Claude's Discretion
- Specific chart color schemes and styling (follow existing design system)
- Exact SQL queries for funnel reconstruction
- API endpoint structure for admin endpoints
- Form validation rules for credit adjustments and suspensions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Chart.js** — Already in use for existing admin analytics page (`/admin/analytics.vue`)
- **Admin middleware** — Existing `admin` middleware for auth checks
- **Admin layout** — Existing `admin` layout already configured
- **Transactions table** — Already has `type` column (purchase/refund/adjustment)
- **Existing admin endpoints** — `/api/admin/users`, `/api/admin/pricing`, `/api/admin/config`

### Established Patterns
- Server-side data fetching with `$fetch` composables
- TypeScript strict mode with explicit return types
- Error handling via centralized `handleApiError` utility
- Vue 3 Composition API with `<script setup lang="ts">`
- Tailwind CSS for all styling

### Integration Points
- `/admin/analytics` page exists but needs chart fixes (noted in ROADMAP)
- `transactions` table for revenue/conversion data
- `users` table (via Supabase Auth) for signup data
- `analyses` table for activation tracking
- Existing cost estimation logic in admin analytics page

</code_context>

<specifics>
## Specific Ideas

- Funnel should reconstruct historical data from existing DB timestamps (not just track future events)
- Credit adjustments should use the existing transactions table with type='adjustment'
- No realtime updates needed for cost dashboard — on-demand refresh is sufficient
- CSV export is preferred for external analysis and accounting purposes
- Mandatory reason fields for suspensions and credit adjustments (audit trail)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-admin-analytics*
*Context gathered: 2026-03-15*
