# Phase 13-04: LAUNCH-01 Worker End-to-End Evidence

**Date:** 2026-09-29
**Purpose:** Confirm production dependency readiness (Task 1), then prove LAUNCH-01's worker half end to end with a real submitted job (Task 3).
**Production build at time of check:** started at v1.0.0-alpha.21; three further same-day hotfixes (alpha.23, alpha.24, alpha.25) shipped mid-plan as LAUNCH-01 testing itself uncovered each blocker — see Task 3 below.

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

**Continuation:** completed directly from the main conversation (which holds `mcp__claude-in-chrome__*` tool access), reusing the existing authenticated tab per the plan's own AUTH_MODE=browser fallback.

### 4. QA_USER_ID and first submission

```js
// same-origin fetch, executed in the authenticated tab
const res = await fetch('/api/user/profile'); const data = await res.json(); data.id
// -> 76b91094-... (QA_USER_ID, written to phase13-ids)
```
Credits confirmed: 10 (sufficient for a 1-credit Basic analysis).

The file-upload UI widget's drop-zone did not visually react to a programmatic file-input assignment (same class of click/event-binding flakiness observed elsewhere in this session's UI testing — see the phase's dark-mode-toggle/login-link investigation). Verified the file *was* correctly attached to the native `<input type=file>` (`files.length === 1`), then bypassed the UI widget entirely and drove the upload via the same underlying endpoint the UI itself calls: same-origin `fetch('/api/upload', {method:'POST', body: FormData})`, followed by `fetch('/api/analyze', ...)` — exactly the plan's own anticipated alternative ("via the upload UI, or same-origin fetch()").

**First attempt** (BASIC_ID `8f1bea54...`, submitted 2026-09-29T18:07:34Z): failed immediately.
Worker log: `Error parsing PDF: Error: Setting up fake worker failed: Cannot find module '.../pdfjs-dist/legacy/build/pdf.worker.mjs'`. **Root cause and fix: see `evidence/05-hotfix-alpha23.md` (v1.0.0-alpha.23).**

**Second attempt** (BASIC_ID `ed338c9f...`, submitted 2026-09-29T18:18:45Z, after alpha.23 deployed): failed with a generic "unexpected error" and **zero** worker log lines for the job, despite BullMQ's own job history (queried directly from Redis) showing it "completed". **Root cause and fix: a 3-day-old local dev process sharing the same unprefixed Redis queue was stealing production's jobs — see `evidence/06-hotfix-alpha24.md` (v1.0.0-alpha.24).**

**Third attempt** (BASIC_ID `b1232145...`, submitted 2026-09-29T18:33:37Z, after alpha.24 deployed): production's own worker finally logged the job (`Started processing basic analysis b1232145...`) but failed with `CRITICAL: Failed to load prompt from /app/server/prompts/v2/basic-analysis-prompt.txt`. **Root cause and fix: see `evidence/07-hotfix-alpha25.md` (v1.0.0-alpha.25).**

**Fourth attempt** (BASIC_ID `3942a796...`, submitted 2026-09-29T18:44:01Z, after alpha.25 deployed): prompt loaded correctly, request reached OpenAI (`gpt-6-luna`), but hit the output token limit mid-generation (`finish_reason: 'length'`, `has_content: false`) even for this small test fixture — `Analysis Debug: Tokens: 2528 / 8000` input, but the Basic tier's configured **output** limit (2500) was too tight for a gpt-6-luna reasoning pass. Per Carlos's direction, raised the DB-backed `configurations` row (`key=prompt_settings`) `tiers.basic.tokenLimits.output` from `2500` to `6000` (still well under Premium's `10000`) via a direct, scoped `PATCH` to `/rest/v1/configurations` from inside the app container using the service key — a data/config change, not a code release, per the plan's own D-05 "Server env value wrong" category (extended here to a DB-backed runtime config row of the same character). No new alpha release needed for this step.

### 5. Successful submission (BASIC_ID `1cb5ecd5-0c74-4bc5-b9c4-f83e540390f8`)

Submitted 2026-09-29T19:48:38Z. Worker picked it up within seconds (`19:48:34.85` — a few hundred ms of clock skew against the submit-time capture, not a delay) and completed at `19:48:56.82`.

**Duration: ~22 seconds** — well under the Phase 07 two-minute expectation for Basic.

### 6. Worker proof (exactly once, no double-processing)

```bash
$ ssh -p 52222 ... "docker logs clarify-worker-prod --timestamps 2>&1" | grep 1cb5ecd5
19:48:34.850 [Worker] Started processing basic analysis 1cb5ecd5-0c74-4bc5-b9c4-f83e540390f8 for user 76b91094-...
19:48:35.255 [Worker Supabase] Updating analysis 1cb5ecd5-... to processing
19:48:56.362 [Worker Supabase] Updating analysis 1cb5ecd5-... to completed
19:48:56.824 [Worker] Successfully completed analysis 1cb5ecd5-0c74-4bc5-b9c4-f83e540390f8
19:48:56.923 [Worker] Job 3 has completed
```
Exactly one `Started processing` line, exactly one `Successfully completed` line, exactly one `Job N has completed` line. No retry, no double-processing.

### 7. Structured output check (v2.1 fields)

```js
{
  "status": "completed",
  "veredicto": "present",
  "puntaje_riesgo": 2,
  "puntaje_type": "number",
  "desglose_type": "object",
  "hallazgos_count": 6,
  "hallazgos_with_confianza_categoria": 6
}
```
`resumen_ejecutivo.veredicto` non-empty, `puntaje_riesgo` numeric (0-10 scale, value 2), `desglose_riesgo` an object, `hallazgos` non-empty (6 items), and **all 6 of 6** hallazgos carry both `confianza` and `categoria_riesgo` — proving the Phase 11 v2.1 structured prompt fields run correctly in production.

**RESULT LAUNCH-01 status=completed**
