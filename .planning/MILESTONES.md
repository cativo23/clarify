# Milestones: Clarify

Shipped versions and key releases.

---

## v1.0 MVP — 2026-03-15

**Phases:** 1-5 | **Plans:** 22 | **Status:** ✅ SHIPPED

### Key Accomplishments

1. **3-Tier Analysis Engine** — Basic/Premium/Forensic with gpt-4o-mini, gpt-5-mini, gpt-5 (1/3/10 credits)
2. **Upload & Progress UX** — 10MB file upload with XHR progress indicator, magic byte validation
3. **PDF Export & History** — Branded PDF reports with Supabase Storage caching, date range filters
4. **Stripe Monetization** — Credit packages (5/$4.99, 10/$8.99, 25/$19.99) with atomic webhook fulfillment
5. **Free Credits Onboarding** — 10 credits on email verification, 1 free Basic analysis per month
6. **Interactive Demo** — Homepage demo with rate limiting (5 req/day) for trial without signup

### Stats

- **Timeline:** 2026-02-23 → 2026-03-15 (21 days)
- **Files Modified:** 50+
- **Test Coverage:** 95+ tests (24 Phase 5, 47 Phase 3, 24 Phase 1-2)
- **Requirements:** 17/20 complete (85%)

### Known Gaps

- Admin analytics dashboard (Phase 6) — Deferred to v1.1
- Production deployment (Phase 7) — Deferred to v1.1

### UAT Summary

- **Phase 1-4:** All UAT passed
- **Phase 5:** 10/12 tests passed (2 skipped for technical reasons)
- **Issues Resolved:** 2 (credits: 3→0, rate limit: 10/hour→5/day)

---

_For detailed milestone archive, see `.planning/milestones/v1.0-mvp-ROADMAP.md`_

---

## v1.1 Admin & Deploy — 2026-03-25

**Phases:** 6-7 | **Plans:** 4 | **Status:** ✅ SHIPPED

### Key Accomplishments

1. **Admin Revenue Dashboard** — Daily/weekly/monthly/quarterly revenue charts with gross/net comparison and package breakdown
2. **Conversion Funnel Tracking** — 4-stage funnel (Signups → Email Verified → First Analysis → First Purchase) with conversion rates
3. **Cost Analysis by Tier** — Profit margin tracking for Basic/Premium/Forensic with AI cost calculations
4. **User Management** — Credit adjustments and account suspension with audit trail logging
5. **Production Infrastructure** — `.env.example` template, configurable worker concurrency, Redis health check

### Stats

- **Timeline:** 2026-03-16 → 2026-03-25 (9 days)
- **Files Modified:** 15+
- **Test Coverage:** 43 admin tests (14 costs, 16 user-management, 6 revenue, 7 funnel)
- **Requirements:** 4/5 complete (80%)

### Known Gaps

- **DEPLOY-01** — Deployment artifacts complete, live verification pending (HTTPS, health endpoint, worker processing, Traefik routing)

### Tech Debt

- Phase 06 missing VERIFICATION.md file
- Database migrations for user suspension require manual Supabase execution

---

_For detailed milestone archive, see `.planning/milestones/v1.1-admin-deploy-ROADMAP.md`_
