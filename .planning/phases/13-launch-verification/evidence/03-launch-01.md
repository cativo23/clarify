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

No contracts-bucket finding to report (see above — bucket is already private). Awaiting Carlos.
