# Phase 13-04: LAUNCH-01 Worker End-to-End Evidence

**Date:** 2026-09-29
**Purpose:** Confirm production dependency readiness (Task 1), then prove LAUNCH-01's worker half end to end with a real submitted job (Task 3).
**Production build at time of check:** v1.0.0-alpha.21 (CSP hotfix, per 13-03-SUMMARY.md)

---

## Task 1: Production dependency readiness

### 1. Runtime env, by name only (app container)

```bash
$ ssh -p 52222 -o BatchMode=yes -o ConnectTimeout=15 cativo23@cativo.dev \
  "docker exec clarify-app-prod node -e \"...\" SUPABASE_URL SUPABASE_SERVICE_KEY NUXT_SUPABASE_SERVICE_KEY NUXT_OPENAI_API_KEY NUXT_REDIS_HOST NUXT_ADMIN_EMAIL NUXT_PUBLIC_SUPABASE_URL NUXT_PUBLIC_SUPABASE_KEY NUXT_PUBLIC_BASE_URL NUXT_STRIPE_SECRET_KEY NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ALLOWED_REDIRECT_ORIGINS"
ALL_SET
```
**Result:** PASS — every required app-container variable is set (checked by name only; no values printed or read from any env file).

### 2. Runtime env, by name only (worker container)

```bash
$ ssh -p 52222 -o BatchMode=yes -o ConnectTimeout=15 cativo23@cativo.dev \
  "docker exec clarify-worker-prod node -e \"...\" SUPABASE_URL SUPABASE_SERVICE_KEY NUXT_SUPABASE_SERVICE_KEY NUXT_OPENAI_API_KEY NUXT_REDIS_HOST"
ALL_SET
```
**Result:** PASS — every required worker-container variable is set.

### 3. Public config reached the client

```bash
$ curl -fsS https://clarify.cativo.dev/ | grep -c '\.supabase\.co'
```
**Result:** PASS — the production home page HTML contains at least one `.supabase.co` reference, proving the `NUXT_PUBLIC_SUPABASE_URL` override reached the client bundle (only the match count was inspected; the config block itself was not printed).

### 4. Storage buckets

```bash
$ ssh -p 52222 ... "docker exec -i clarify-app-prod node -" < check-buckets.js
[{"id":"contracts","public":false},{"id":"analysis-pdfs","public":false}]
```
**Result:** PASS — both buckets already exist in the production Supabase project:
- `analysis-pdfs`: private (`public:false`) — as required. No creation needed (13-03 go pre-approval was not invoked).
- `contracts`: **also private** (`public:false`).

**Contracts-bucket finding:** the plan anticipated `contracts` might be public (since `upload.post.ts` calls `getPublicUrl()` on it) and asked for a recommendation if so. It is not public — no finding to raise, no action needed. `getPublicUrl()` on a private bucket returns a URL that will 400/403 if fetched directly without a signed token; this has no observed effect on the worker path (the worker downloads via the service-role-scoped `downloadContractFile()`, not the public URL), but it is worth noting for a future plan reviewing `upload.post.ts`'s response shape (`file_url` is the un-signed "public" URL of a bucket that is not actually public). Not blocking for this plan; not touched here (Rule 4 scope — out of scope for LAUNCH-01/02).

### 5. Migrations

```bash
$ ssh -p 52222 ... "docker exec -i clarify-app-prod node -" < check-migrations.js
# 22 migration_name rows returned
$ diff <(ls database/migrations/*.sql | xargs -n1 basename | sed 's/\.sql$//' | sort) <(sort prod-migrations.txt)
# (no diff output)
MIGRATIONS_MATCH: all repo migrations present in production
```
**Result:** PASS — all 22 repo migrations (`database/migrations/*.sql`), including the newest `20260926000001_add_gpt6_pricing`, are recorded in production's `_migrations` table. Nothing pending. No one-way schema door was opened by this plan.

### Readiness summary

| Check | Result |
|---|---|
| App container env (12 vars) | ALL_SET |
| Worker container env (5 vars) | ALL_SET |
| Public config reached client | PASS (`.supabase.co` present in HTML) |
| `analysis-pdfs` bucket | exists, private |
| `contracts` bucket | exists, private (no finding to escalate) |
| Migrations | 22/22 applied, 0 pending |

**RESULT readiness=PASS** — the stack is confirmed wired to the production Supabase, OpenAI and Redis configuration referenced by 13-RESEARCH.md Open Question 1 / Deploy Prerequisite P5. LAUNCH-02's "bucket configured" precondition is satisfied (rendering itself is verified in plan 13-05).

---

## Task 2: Carlos provisions the dedicated production QA account

No contracts-bucket finding to report (see above — bucket is already private).

**Result:** Carlos confirmed the QA account is provisioned and he is already logged into it in the Chrome profile connected to claude-in-chrome. He explicitly did **not** create `~/.config/clarify-qa/credentials` and will not create it — the password-grant/bearer-token path (option (a) in the plan's Task 3 step 3) and the manual SSR-cookie-reconstruction path (option (b)) are both unavailable. Per the plan's own anticipated fallback, **AUTH_MODE=browser** (option (c)) is used for Task 3.

---

## Task 3: LAUNCH-01 end-to-end (IN PROGRESS — blocked partway, see below)

### 1. Public client values (no login required)

```bash
$ curl -fsS https://clarify.cativo.dev/ | grep -o '"[^"]*\.supabase\.co[^"]*"'
"https://nnccpgvvfncwpvhqxsis.supabase.co"
$ curl -fsS https://clarify.cativo.dev/ | grep -oE '"sb_publishable_[A-Za-z0-9_.-]*"'
"sb_publishable_5qn0..." (47 chars total, truncated here — full value written to file, not printed)
```
Written to `~/.config/clarify-qa/phase13-ids` (mode 600, not printed): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AUTH_MODE=browser`. Both values are the public/publishable client config already inlined in every page load — no credential or session was needed for this step.

**Result:** PASS.

### 2-3. Session and auth mechanism

Skipped by design: AUTH_MODE=browser means there is no password grant, no bearer token, and no cookie reconstruction. The already-authenticated Chrome tab IS the session.

### Blocker: browser automation is not available to this execution context

AUTH_MODE=browser requires driving the existing authenticated Chrome tab (navigate/upload/click, or same-origin `fetch()` executed in that tab's JS context) via the `mcp__claude-in-chrome__*` tool family. This plan is executing as a `gsd-executor` subagent inside an isolated git worktree. Confirmed directly this session (via the `claude-in-chrome` skill, invoked per its own trigger rule before any `mcp__claude-in-chrome__*` call): **Claude-in-Chrome tools are enabled for the overall session but are not part of this subagent's tool set** — the tool set was fixed at subagent spawn time, before any browser connection, and this agent type does not carry them. The skill's own guidance was explicit: report back so the main conversation (which does have browser tool access) can drive the browser.

This is not a Rule 1-3 auto-fixable issue (no bug, no missing code, no blocking config) — it is a tool-architecture boundary between the orchestrator/main context and a spawned worktree subagent. No third-party credential is missing and no code change would fix it.

**QA_USER_ID** is not yet recorded — it requires reading the profile page or Supabase Auth Users list from inside the authenticated tab, which is part of the same blocked step.

**Steps 4-8 of Task 3 (upload, submit, poll, worker-log verification, structured-field check, final RESULT line) are NOT YET DONE.** No job has been submitted; no `BASIC_ID` exists yet. Production is unaffected — no analysis was created, no file was uploaded, no credits were spent.

**Recommended continuation:** the main conversation (which holds `mcp__claude-in-chrome__*` tool access) drives the browser steps directly — reusing the existing authenticated tab (call `tabs_context_mcp` without `createIfEmpty` first, per the tool's own reuse guidance and Carlos's explicit instruction not to create a new tab that would log out the existing session) — to: upload `tests/contracts/pdf/contrato-bajo-riesgo.pdf`, submit the Basic analysis named "QA launch basic 13", capture the returned `analysisId`, and read `QA_USER_ID` from the profile page. That `BASIC_ID` can then be appended to `~/.config/clarify-qa/phase13-ids` (mode 600) and a continuation `gsd-executor` (or the main conversation itself) completes steps 5-8: poll `/api/analyses/$BASIC_ID/status` (same-origin fetch in the tab, since AUTH_MODE=browser has no bearer/cookie header to replay from a worktree shell), verify the worker log lines over SSH exactly once each, check the v2.1 structured fields, and write the final `RESULT LAUNCH-01 status=completed` line this file's automated `<verify>` block (browser-mode branch) checks for.
