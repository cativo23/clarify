# Retrospective: Clarify

Living retrospective — updated at each milestone close.

---

## Milestone: v1.0 MVP

**Shipped:** 2026-03-15
**Phases:** 5 | **Plans:** 22

### What Was Built

- 3-tier AI contract analysis (Basic/Premium/Forensic) with gpt-4o-mini, gpt-5-mini, gpt-5
- Secure upload with magic byte validation and BullMQ async processing
- PDF export with branded reports, Supabase Storage caching, history filters
- Stripe monetization (3 credit packages) with atomic webhook fulfillment
- Free credits onboarding (10 credits on signup) + 1 free Basic/month
- Homepage demo with rate limiting for trial-without-signup UX

### What Worked

- Tier-based credit system landed cleanly — 1/3/10 credits is intuitive
- BullMQ + Upstash Redis: async processing with no UI blocking, zero timeouts
- PDF generation (pdfkit) with bufferPages for consistent footers across pages
- Atomic PostgreSQL RPC for credit fulfillment — no double-credit bugs

### What Was Inefficient

- Forensic UI sections (analisis_cruzado, omisiones_critic, mapa_estructural) were built in backend but not surfaced in UI — discovered at UAT
- Phase 1-2 required a 2-pass approach (implement then fix UI)

### Key Lessons

- Plan UI display of new data structures at the same time as backend prompts, not after
- Magic byte validation is easy to implement but error message extraction needs explicit handling

---

## Milestone: v1.1 Admin & Deploy

**Shipped:** 2026-03-25 (Phases 6-7) | **Audit gaps closed:** 2026-05-07 (Phase 10)
**Phases:** 3 (6, 7, 10) | **Plans:** 8

### What Was Built

- Admin analytics dashboard: revenue charts, conversion funnel, cost analysis, user management
- Production deployment: `.env.example`, worker config, Redis health check
- Suspension enforcement: upload + BullMQ job gates check `users.is_suspended` (ADMIN-04)
- Funnel Stage 2: PostgreSQL SECURITY DEFINER RPC for email-verified counts (ADMIN-01)
- `.env.example` completeness: 6 missing vars documented with consequence-if-missing (DEPLOY-01)
- Revenue package breakdown via `credits_purchased` join, decoupled from Stripe prices (ADMIN-02)

### What Worked

- Post-ship audit caught 4 real blockers before v2.0 planning started — worth the extra phase
- Phase 10 audit gap closure was clean: 4 plans, 4 atomic commits, 23 tests, all passing
- Browser-based UAT via Claude's chrome automation tool was effective for admin UI testing
- Admin user management (credit adjustment + suspend/unsuspend) all worked on first attempt

### What Was Inefficient

- Initial v1.1 close (2026-03-25) was done without sufficient cross-phase integration checks — suspension flag was written but never read, RPC was called but never migrated
- Phase 10 was needed to fix what should have been caught before initial v1.1 tag
- `require()` vs `import` bug in ESM modules (funnel, revenue API files) slipped through testing

### Patterns Established

- Post-ship audit (`gsd-audit-milestone`) is mandatory before milestone close — catches integration gaps that code review misses
- SECURITY DEFINER SQL functions with explicit REVOKE/GRANT for cross-schema RPCs
- Env var documentation: per-key "consequence if missing" comments in `.env.example`
- `type='adjustment', amount=0` pattern for credit adjustments (monetary-neutral audit trail)
- Suspension enforcement at two layers (HTTP upload + queue job pickup) for defense in depth

### Key Lessons

- The initial v1.1 ship had 4 features that appeared complete but were cosmetic (suspension) or fallback-only (funnel, revenue, .env). Cross-phase integration checks must go deeper than "does the code exist?"
- Phase 10 pattern: targeted 1-blocker-per-plan + test-first approach is highly efficient for gap closure
- Browser automation for UAT is powerful but requires domain permission setup in advance

---

## Cross-Milestone Trends

| Metric | v1.0 | v1.1 |
|--------|------|------|
| Phases | 5 | 3 (6,7,10) |
| Plans | 22 | 8 |
| Tests | 95+ | 43+23=66 |
| UAT Gaps Found at Close | 1 (minor UI) | 4 (2 blockers) |
| Post-ship fixes needed | 0 | 1 phase (Phase 10) |
| Requirements hit rate | 85% (17/20) | 100% (5/5 after Phase 10) |

**Trend:** Test coverage is growing but integration testing gaps persist. The post-ship audit workflow is becoming a reliable backstop. Consider adding cross-phase integration tests to the plan checklist for v2.0.
