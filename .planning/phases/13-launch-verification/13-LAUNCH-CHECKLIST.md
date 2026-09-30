# Phase 13 Launch Verification Checklist

**Date:** 2026-09-30
**Release tag:** v1.0.0-alpha.26 (prerelease, published 2026-09-30T07:21:46Z)
**Main merge SHA:** `be1f782` (origin/main)
**App image digest:** `sha256:40474a05...` (`cativo23/clarify:latest`)
**Base URL exercised:** https://clarify.cativo.dev

This checklist is the source of truth for Phase 13. Every row traces to a committed evidence file
under `.planning/phases/13-launch-verification/evidence/` or to the fresh re-run recorded below.

---

## Main table

| ID | Criterion | Check performed | Result | Evidence | Observed at |
|---|---|---|---|---|---|
| LAUNCH-01a | HTTPS + health live in production | `curl` health/redirect/cert/HSTS against clarify.cativo.dev; 3 containers healthy | PASS | `evidence/02-deploy.md` | 2026-09-29 (final: v1.0.0-alpha.21) |
| LAUNCH-01b | Worker processes a submitted job end-to-end, exactly once | Basic analysis submitted via HTTPS; worker log shows exactly one Started/Successfully-completed pair; v2.1 structured fields present | PASS | `evidence/03-launch-01.md` | 2026-09-29T19:48:56Z |
| LAUNCH-02 | PDF export renders and is stored privately in analysis-pdfs | First export (`cached=false`) produced a valid 2-page PDF; `pdfinfo` + visual legibility check pass; unauthenticated/public-bucket access rejected | PASS | `evidence/04-launch-02-03.md`, `evidence/pdf-page1.png` | 2026-09-29T20:03:35Z |
| LAUNCH-03 | Second export served from cache, no regeneration | Second export (`cached=true`); identical sha256; unchanged stored-object `updated_at`/size; no `[PDF Export]` errors | PASS | `evidence/04-launch-02-03.md` | 2026-09-29T20:05:09Z |
| LAUNCH-04 | Forensic result page renders all sections, no layout errors | Forensic analysis with all sections populated; C1-C11 checklist all PASS after fixing a real `analysis_type` persistence bug (see Deviations) | PASS | `evidence/05-launch-04.md` | 2026-09-30T07:37:44Z (analysis) / 2026-09-30 (UI check, post-fix) |
| Phase 07 item 1 | HTTPS serves the app | Same as LAUNCH-01a | PASS | `evidence/02-deploy.md` | 2026-09-29 |
| Phase 07 item 2 | Certificate is valid Let's Encrypt | `openssl x509` issuer/dates | PASS | `evidence/02-deploy.md`, fresh re-run below | 2026-09-30T07:53Z |
| Phase 07 item 3 | Worker processes a real job | Same as LAUNCH-01b | PASS | `evidence/03-launch-01.md` | 2026-09-29 |
| Phase 07 item 4 | HTTP redirects to HTTPS with HSTS | `curl` redirect + HSTS header | PASS | `evidence/02-deploy.md`, fresh re-run below | 2026-09-30T07:53Z |
| Phase 07 item 5 | All 3 containers report healthy | `docker ps` on polaris2 | PASS | `evidence/02-deploy.md`, fresh re-run below | 2026-09-30T07:54Z |
| Phase 03 PDF render | PDF export renders correctly | Same as LAUNCH-02 | PASS | `evidence/04-launch-02-03.md` | 2026-09-29 |
| Phase 03 PDF caching | Second export uses cached copy | Same as LAUNCH-03 | PASS | `evidence/04-launch-02-03.md` | 2026-09-29 |
| Phase 01 Test 4 | Forensic-only sections (cross-clause, omissions, structural map) render | Same as LAUNCH-04 | PASS | `evidence/05-launch-04.md` | 2026-09-30 |

---

## Fresh re-run at sign-off (2026-09-30, ~07:53-07:56 UTC)

```
$ curl -s https://clarify.cativo.dev/api/health
{"status":"ok","services":{"database":"unknown","redis":"connected","ai":"active"},"timestamp":"2026-09-30T07:53:34.752Z"}
HTTP 200

$ curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}" http://clarify.cativo.dev/
301 -> https://clarify.cativo.dev/

$ openssl x509 -noout -issuer -dates   (clarify.cativo.dev:443)
issuer=C=US, O=Let's Encrypt, CN=YR2
notBefore=Sep 29 00:02:00 2026 GMT
notAfter=Dec 28 00:01:59 2026 GMT

$ curl -sI https://clarify.cativo.dev/ | grep -i strict-transport
strict-transport-security: max-age=31536000; includeSubDomains; preload

$ ssh polaris2 (167.235.52.161:52222) "docker ps --filter name=clarify"
clarify-worker-prod: Up 27 minutes (healthy)
clarify-redis-prod: Up 27 minutes (healthy)
clarify-app-prod: Up 27 minutes (healthy)

$ gh release view v1.0.0-alpha.26 --json tagName,isPrerelease,publishedAt
{"isPrerelease":true,"publishedAt":"2026-09-30T07:21:46Z","tagName":"v1.0.0-alpha.26"}

$ (authenticated) GET /api/analyses/1cb5ecd5.../export-pdf
{"success":true,"cached":true}

$ (authenticated) GET /api/analyses/f038ddc9.../status
{"status":"completed","analysis_type":"forensic"}
```

All fresh signals match the committed evidence — nothing regressed since the plans were executed.

---

## Flagged assumptions and deviations

- **24-hour signed-URL expiry:** not exercised in this phase. Only the immediate first/second export round-trip was verified.
- **Concurrent first-time exports:** idempotent by design (`upload(..., { upsert: true })`), but only the sequential round-trip was tested in production — no actual concurrency test was run.
- **Mobile width (390px) layout check (LAUNCH-04 C10):** not checked — no window-resize tool was available in this session. Recorded as "not checked," per the plan's own allowance; not a failure.
- **Auth mechanism used throughout:** `AUTH_MODE=browser` — every authenticated call in plans 13-04 through 13-07 was driven as a same-origin `fetch()` from the QA account's already-authenticated Chrome tab (`claude-in-chrome`), not a stored bearer token or reconstructed session cookie. This is a **D-04 deviation**: Carlos declined to create `~/.config/clarify-qa/credentials`, so the password-grant and cookie-reconstruction paths described in the original plans were never used.
- **`/api/health` proves Redis only:** its `database` and `ai` fields are hardcoded literals in the route (`server/api/health.get.ts`), not real checks. A 200 response proves Redis connectivity; it says nothing about Supabase or OpenAI reachability on its own — those were separately proven by the actual worker/analysis end-to-end tests (LAUNCH-01/04).
- **`contracts`-bucket visibility:** checked in 13-04 — it is private (`public: false`), same as `analysis-pdfs`. No finding to escalate.
- **Extra alpha releases cut under D-05 during this phase's verification** (all same-day fixes for real production bugs found live, each documented with root cause + local pre-ship verification):
  - **v1.0.0-alpha.21** — CSP `nonce` placeholder dropped by a custom `script-src` override, breaking all client-side hydration (dark mode toggle, login links).
  - **v1.0.0-alpha.22** — login-link hydration-mismatch dead clicks; forced `external` navigation on the three `/login` links.
  - **v1.0.0-alpha.23** — `pdfjs-dist`'s worker script silently dropped by Nitro's build tracer; every PDF analysis failed.
  - **v1.0.0-alpha.24** — BullMQ queue collision between a long-running local dev process and production, sharing the same unprefixed Redis queue.
  - **v1.0.0-alpha.25** — `server/prompts` never copied into the runtime image at all; every analysis failed with a configuration error.
  - **v1.0.0-alpha.26** — OpenAI SDK's default automatic retries multiplying the Forensic-tier timeout from a configured 10 minutes to ~15 minutes in practice.
  - **Database migration `20260930000001`** (no new release — DB-only fix) — the analysis-creation RPC never persisted `analysis_type`, silently defaulting every analysis to `'premium'` and permanently disabling the Forensic-only UI sections regardless of data completeness. This was the actual root cause of the original Phase 01 UAT Test 4 defect.

---

## Not in LAUNCH scope, not verified

- The Stripe **live** webhook endpoint and **live** price IDs — production `.env` currently uses Stripe **test-mode** keys (Carlos's explicit call: "Stripe nunca lo probamos"). Payment flows are not part of LAUNCH-01..04 and were not exercised against live Stripe in this phase.
