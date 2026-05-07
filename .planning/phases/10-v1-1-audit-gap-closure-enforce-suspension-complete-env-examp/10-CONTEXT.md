# Phase 10: v1.1 Audit Gap Closure — Context

**Gathered:** 2026-05-06
**Status:** Ready for planning
**Source:** Derived from `.planning/milestones/v1.1-MILESTONE-AUDIT.md` (re-audit 2026-05-06)

<domain>
## Phase Boundary

Close the four gap-closure items surfaced by the v1.1 milestone re-audit so the v1.1 milestone (admin + deploy) can pass its FAIL gate. Strictly scoped to the four items below — no new admin features, no deploy scope expansion.

Items in scope:
1. **ADMIN-04 (BLOCKER):** Enforce `users.is_suspended` everywhere a suspended user could still consume the platform (auth, upload, queue worker).
2. **DEPLOY-01 (BLOCKER):** Complete `.env.example` with the env vars the server already references but the template omits.
3. **ADMIN-01 (WARNING):** Add the missing `get_email_verified_users_in_range` Postgres RPC so the funnel Stage 2 metric stops silently equaling Stage 1.
4. **ADMIN-02 (WARNING):** Replace hard-coded price-band package inference in `revenue.get.ts` with a join on `credit_transactions.credits_purchased`.

Out of scope:
- Phase 06 retroactive `06-VERIFICATION.md` and `06-VALIDATION.md` cleanup (separate `/gsd-validate-phase 06` run).
- Phase 07 human UAT (HTTPS / health / worker / Traefik) — owned by deploy operator, not code.
- Any new admin dashboards or admin-only features beyond enforcing existing flags.
</domain>

<decisions>
## Implementation Decisions (locked from audit evidence)

### ADMIN-04 — Suspension enforcement
- **Decision:** A suspended user (`users.is_suspended = true`) MUST be blocked from:
  1. Authenticated API access (return 403 with code `ACCOUNT_SUSPENDED`).
  2. File upload (`/api/upload`).
  3. Background analysis processing (the BullMQ worker must reject jobs whose owner is suspended, refunding/holding credits per existing patterns rather than silently consuming).
- **Decision:** Enforcement lives in the shared auth helper (`server/utils/auth.ts`) so every protected endpoint inherits it. Endpoints that read `users` should also short-circuit on `is_suspended`.
- **Decision:** Worker check happens at job pickup in `server/plugins/worker.ts` (or its job-handler module) by reading `users.is_suspended` for the job's `user_id`. Suspended job → fail job with reason `account_suspended`, do NOT debit credits.
- **Decision:** Error contract: `createError({ statusCode: 403, statusMessage: 'Account suspended', data: { code: 'ACCOUNT_SUSPENDED' } })`. Frontend can surface this without further changes in this phase.
- **Decision:** No new column or migration. The `is_suspended` boolean already exists.

### DEPLOY-01 — `.env.example` completion
- **Decision:** Add the following keys to `.env.example` with placeholder values and inline comments explaining purpose + consequence-if-missing. Group into existing sections where they fit.
  - `ADMIN_EMAIL` — primary admin email used by `nuxt.config.ts:81` and `server/utils/auth.ts` admin gate. Without it, no admin can log in to v1.1 admin dashboards.
  - `STRIPE_PRICE_ID_5_CREDITS`, `STRIPE_PRICE_ID_10_CREDITS`, `STRIPE_PRICE_ID_25_CREDITS` — production Stripe price IDs. `server/utils/stripe-client.ts` falls back to test prices if missing → wrong-product billing risk in prod.
  - `ALLOWED_REDIRECT_ORIGINS` — comma-separated list of safe redirect origins for auth callbacks.
  - `DISABLE_WORKER` — `"true"` to disable the in-process BullMQ worker (used when running a dedicated worker container).
  - `NODE_ENV` — `production` / `development` — controls multiple runtime branches.
- **Decision:** Update `CLAUDE.md`'s "Environment Variables" section to list the new keys (one-line mention; full docs live in `.env.example`).
- **Decision:** Do NOT change runtime fallback behavior in this phase (no removing test-price fallbacks in `stripe-client.ts`). The fix is documenting the contract; tightening fallbacks is a separate hardening pass.

### ADMIN-01 — Funnel Stage 2 RPC
- **Decision:** Create migration `database/migrations/<timestamp>_funnel_stage2_rpc.sql` defining `get_email_verified_users_in_range(start_date timestamptz, end_date timestamptz)` returning `setof users` (or a typed row matching what `funnel.get.ts` consumes — id and email_confirmed_at).
- **Decision:** RPC must filter on `email_confirmed_at` from `auth.users` joined to `public.users` (current fallback uses `created_at`, which is wrong). RLS / `SECURITY DEFINER` mirrors patterns already used elsewhere in `database/migrations/`.
- **Decision:** Keep the JS fallback in `funnel.get.ts` for resilience but log a `console.warn` when it triggers so the warning surfaces in dev when migrations weren't applied.
- **Decision:** Add a smoke test (Vitest server test) confirming the RPC returns a different count from the Stage 1 query when seed data has both signed-up-but-unverified and verified users.

### ADMIN-02 — Revenue package join
- **Decision:** Replace amount-band inference in `server/api/admin/revenue.get.ts:144-153` with a join on `credit_transactions.credits_purchased`. Map `credits_purchased` → package label (`5`, `10`, `25`) → `"{n} credits"`. Unknown counts bucket as `"other"`.
- **Decision:** No schema change required (`credits_purchased` already exists on `credit_transactions`).
- **Decision:** Add a Vitest test asserting that a price-change in `stripe-client.ts` does NOT change the package breakdown (i.e., the breakdown is now decoupled from price).

### Cross-cutting
- **Decision:** Each fix gets its own atomic commit and its own PLAN.md. Two waves: schema/runtime mitigations (suspension, RPC) in Wave 1; documentation + reporting fixes (`.env.example`, revenue join) in Wave 2 (independent of Wave 1).
- **Decision:** All four items must land in this phase — no partial close. Audit re-run at end of phase must show all four as `satisfied`.
- **Decision:** Tests use existing Vitest setup. No new test framework. RLS-sensitive tests use the service-role client per project convention.

### Claude's Discretion
- Exact migration filename timestamp.
- Exact wording of `.env.example` comments (informative, not prescriptive).
- Whether worker rejection of a suspended-user job credits a refund or just holds the job — pick the option that matches the Phase 3 worker's existing failure-path conventions (read `server/plugins/worker.ts` first).
- Whether to centralize the suspension check as a small helper (`assertNotSuspended(user)`) or inline it — pick whichever results in fewer touched files.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit & milestone
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md` — full evidence + line-number citations for all four gaps
- `.planning/milestones/v1.1-admin-deploy-REQUIREMENTS.md` — original ADMIN-01..04, DEPLOY-01 IDs

### Server runtime files cited by the audit
- `server/api/admin/users/[id].patch.ts` — writes `is_suspended` (consumer side)
- `server/utils/auth.ts` — admin gate; suspension check belongs here
- `server/api/upload.post.ts` (or current upload route) — must reject suspended users
- `server/plugins/worker.ts` — must reject jobs from suspended users
- `server/api/admin/funnel.get.ts:75-101` — calls missing RPC
- `server/api/admin/revenue.get.ts:144-153` — hard-coded price bands
- `server/utils/stripe-client.ts:20-39` — test-price fallback that DEPLOY-01 documents
- `nuxt.config.ts:81` — `ADMIN_EMAIL` reference
- `.env.example` — file to update

### Database
- `database/migrations/20260216000000_create_core_schema.sql` — `credit_transactions.credits_purchased` column
- (existing migration patterns for `SECURITY DEFINER` RPCs — pick any prior RPC migration as template)

### Project standards
- `CLAUDE.md` — RLS, atomic ops, conventional commits, gitmoji, Docker exec convention
</canonical_refs>

<specifics>
## Specific Ideas

- Suspension error code constant `ACCOUNT_SUSPENDED` should be exported from `server/utils/auth.ts` alongside any existing error codes there.
- `.env.example` order: keep new keys in the section that semantically owns them (ADMIN_EMAIL near auth/Supabase, STRIPE_PRICE_ID_* in Stripe block, ALLOWED_REDIRECT_ORIGINS in Application, DISABLE_WORKER in Worker, NODE_ENV in Application).
- Funnel RPC should accept `(start_date timestamptz, end_date timestamptz)` to match the existing call site signature exactly.
- Revenue join can use the existing `credit_transactions` row already loaded at `revenue.get.ts` (audit cites the same function); avoid a second round-trip.
</specifics>

<deferred>
## Deferred Ideas

- Removing the test-price fallback in `server/utils/stripe-client.ts` (separate hardening phase).
- Phase 06 retroactive VERIFICATION.md + VALIDATION.md compliance fix (`/gsd-validate-phase 06`).
- Phase 07 human UAT items (HTTPS, health, worker, Traefik) — operator runbook, not code.
- Frontend surfacing of `ACCOUNT_SUSPENDED` error code beyond default error UI.
</deferred>

---

*Phase: 10-v1-1-audit-gap-closure*
*Context derived from milestone audit on 2026-05-06*
