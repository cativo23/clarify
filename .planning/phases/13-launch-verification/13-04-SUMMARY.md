---
phase: 13-launch-verification
plan: 04
subsystem: infra
tags: [bullmq, redis, docker, pdfjs-dist, openai, worker, launch-verification]

# Dependency graph
requires:
  - phase: 13-launch-verification
    provides: "13-03 (v1.0.0-alpha.20/21 deployed and verified: HTTPS/health/container checks)"
provides:
  - "Production dependency readiness confirmed: env vars, public config, Storage buckets (both private), all 22 migrations applied"
  - "LAUNCH-01 (worker half) proven end to end: a real Basic analysis submitted over HTTPS reached completed status via the production BullMQ worker, with v2.1 structured fields intact"
  - "AUTH_MODE=browser established as the working auth mechanism for this QA account, reusable by plans 13-05/13-06 (browser-driven, not a stored bearer/cookie token)"
  - "Three real production bugs found and fixed same-day: pdfjs-dist worker file missing from image (v1.0.0-alpha.23), BullMQ queue collision between local dev and production (v1.0.0-alpha.24), server/prompts missing from image (v1.0.0-alpha.25)"
  - "Basic tier's OpenAI output token limit raised 2500 -> 6000 (DB config, no release) after the fixture PDF hit the ceiling mid-generation on a reasoning model"
affects: ["13-05", "13-06", "13-07"]

actuals:
  tokens: 14000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "BullMQ queue/worker keys namespaced per environment (prefix: 'prod'|'dev' derived from NODE_ENV) to prevent local-dev/production collision on a shared Redis instance"
    - "Docker runtime-stage COPY of raw source-tree assets (server/prompts) alongside the traced .output, for files read via fs at runtime rather than statically imported"
    - "DB-backed runtime config (configurations table, key=prompt_settings) patched directly via a scoped service-key fetch from inside the container, for tuning changes that don't require a code release"

key-files:
  created:
    - ".planning/phases/13-launch-verification/evidence/03-launch-01.md — readiness + LAUNCH-01 end-to-end evidence"
    - ".planning/phases/13-launch-verification/evidence/05-hotfix-alpha23.md — pdfjs-dist worker file fix"
    - ".planning/phases/13-launch-verification/evidence/06-hotfix-alpha24.md — BullMQ queue-prefix fix"
    - ".planning/phases/13-launch-verification/evidence/07-hotfix-alpha25.md — server/prompts missing-from-image fix"
  modified:
    - "Dockerfile — copy full pdfjs-dist and server/prompts into the runner stage"
    - "server/utils/queue.ts, server/plugins/worker.ts — BullMQ prefix namespacing"

key-decisions:
  - "AUTH_MODE=browser used instead of password-grant/bearer/cookie reconstruction — Carlos declined to create ~/.config/clarify-qa/credentials, so all Task 3 API calls were driven as same-origin fetch() from the already-authenticated Chrome tab rather than replayed from a shell"
  - "Bypassed the dashboard's file-upload UI widget (didn't visually react to a programmatic file assignment — same click/event-binding flakiness class seen elsewhere this session) in favor of calling /api/upload and /api/analyze directly via fetch(), which the plan itself listed as an acceptable alternative"
  - "Raised Basic tier's OpenAI output token limit (2500 -> 6000) via a direct DB PATCH rather than a code release, per Carlos's explicit direction and the plan's D-05 'server/config value wrong' category — a cost-relevant tuning change, not a bug fix, so flagged rather than silently changed"
  - "Three infra bugs (pdfjs-dist, BullMQ prefix, server/prompts) were fixed immediately as same-day hotfix releases rather than deferred, following the same urgency precedent set in plan 13-03 for actively-broken core functionality"

requirements-completed: ["LAUNCH-01"]

coverage:
  - id: D1
    description: "Production dependency readiness: env vars (app+worker), public config, Storage buckets (both private), all 22 migrations applied"
    requirement: LAUNCH-01
    verification:
      - kind: integration
        ref: "Task 1 <verify> block (env ALL_SET checks, .supabase.co in HTML, bucket public flags, migration diff) — all four conditions PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "A Basic analysis submitted over HTTPS as a non-admin QA user reaches status=completed, processed exactly once by the production BullMQ worker, with v2.1 structured fields (numeric puntaje_riesgo, desglose_riesgo object, hallazgos carrying confianza+categoria_riesgo)"
    requirement: LAUNCH-01
    verification:
      - kind: integration
        ref: "evidence/03-launch-01.md Task 3 §5-7 — worker log lines (Started processing / Successfully completed, each exactly once) + status API structured-field check"
        status: pass
    human_judgment: false
  - id: D3
    description: "Three production bugs found and fixed live (pdfjs-dist missing worker file, BullMQ queue collision, missing server/prompts), each verified locally before shipping and confirmed via a subsequent successful deploy + retest"
    requirement: LAUNCH-01
    verification:
      - kind: manual_procedural
        ref: "evidence/05-hotfix-alpha23.md, evidence/06-hotfix-alpha24.md, evidence/07-hotfix-alpha25.md — each documents a local pre-ship verification plus the live retest that surfaced the next layer"
        status: pass
    human_judgment: true
    rationale: "These were infrastructure bugs discovered and fixed opportunistically during verification, not planned deliverables with a pre-written automated check — Carlos's go-ahead was obtained for each fix/release before shipping, recorded in the evidence files."

duration: ~3h (spans Task 1/2 by the worktree executor, plus the orchestrator's browser-driven Task 3 continuation and three interleaved hotfix cycles)
completed: 2026-09-29
status: complete
---

# Phase 13 Plan 04: Production Dependency Readiness and LAUNCH-01 Worker End-to-End Summary

**LAUNCH-01 fully proven in production — but getting there required finding and same-day-fixing three separate infrastructure bugs (pdfjs-dist's worker file, a BullMQ queue collision with local dev, and a missing server/prompts directory) plus a token-limit tuning change, each discovered only because a real job was actually submitted end to end.**

## Performance

- **Duration:** ~3h total across the worktree executor (Tasks 1-2) and the main-conversation browser-driven continuation (Task 3, including three hotfix cycles)
- **Tasks:** 3 of 3 complete
- **Files modified:** 2 code files (Dockerfile touched twice, server/utils/queue.ts, server/plugins/worker.ts), 4 evidence files created, 1 DB config row patched

## Accomplishments

- **Task 1 (readiness):** production env vars, public client config, Storage buckets (both private, no findings), and all 22 repo migrations confirmed present in the production Supabase project — zero gaps, zero fixes needed.
- **Task 2:** Carlos provisioned a dedicated non-admin QA account and stayed logged into it in the Chrome profile connected to claude-in-chrome, establishing AUTH_MODE=browser as this plan's (and 13-05/13-06's) auth mechanism.
- **Task 3 (LAUNCH-01 end-to-end):** after four failed submission attempts, each one uncovering and getting a same-day fix for a different real production bug, a Basic analysis completed successfully in ~22 seconds with correct v2.1 structured output, verified against the production worker's own logs (exactly one "Started processing", exactly one "Successfully completed" — no double-processing).

## Task Commits

Work spanned an isolated worktree (Task 1-2) and the main conversation's direct commits (Task 3's fixes, done outside worktree isolation since they required live production debugging via SSH + browser tools not available to a spawned subagent):

1. **Task 1 — production readiness evidence** — `2a94cfa` (docs, worktree) — `evidence/03-launch-01.md`
2. **Task 2 — QA account resolution** — `17c65d0` (docs, worktree) — same file
3. **Merge of worktree into develop** — `786dcc5..42e6a52` range (orchestrator)
4. **Hotfix: pdfjs-dist worker file** — PR #54, released as v1.0.0-alpha.23
5. **Hotfix: BullMQ queue prefix** — PR #57, released as v1.0.0-alpha.24
6. **Hotfix: missing server/prompts** — PR #60, released as v1.0.0-alpha.25
7. **Task 3 completion + evidence** — direct commit to develop (this SUMMARY + finished evidence/03-launch-01.md)

## Files Created/Modified

- `.planning/phases/13-launch-verification/evidence/03-launch-01.md` — full readiness + LAUNCH-01 evidence
- `.planning/phases/13-launch-verification/evidence/05-hotfix-alpha23.md`, `06-hotfix-alpha24.md`, `07-hotfix-alpha25.md` — one per hotfix release
- `Dockerfile` — two additional runner-stage COPY steps (full `pdfjs-dist`, `server/prompts`)
- `server/utils/queue.ts`, `server/plugins/worker.ts` — shared `queuePrefix` constant, applied to both the `Queue` and `Worker` constructors

## Decisions Made

- Used AUTH_MODE=browser (driving the already-authenticated Chrome tab via same-origin `fetch()`) instead of any credential-based auth path, since Carlos explicitly declined to create a QA credentials file.
- Bypassed the dashboard's upload widget (didn't react to a programmatic file assignment) in favor of calling the same API endpoints directly — an approach the plan itself anticipated.
- Fixed all three infrastructure bugs immediately as same-day hotfix releases (v1.0.0-alpha.23/24/25) rather than deferring them, consistent with the urgency precedent set in plan 13-03 for core functionality that's actively broken in production.
- Raised the Basic tier's OpenAI output token limit via a direct DB config patch (not a code release) after explicit confirmation from Carlos, since it's a cost-relevant tuning decision rather than a correctness bug.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] pdfjs-dist's worker script missing from the runtime image**
- **Found during:** Task 3, first submission attempt
- **Issue:** `Setting up fake worker failed: Cannot find module '.../pdfjs-dist/legacy/build/pdf.worker.mjs'` — every PDF analysis failed unconditionally
- **Fix:** Copy the complete `pdfjs-dist` package from the builder stage into the runner stage, replacing Nitro's partial trace
- **Files modified:** `Dockerfile`
- **Verification:** Built the image locally, ran `pdf-parse`'s actual `PDFParse().getText()` against the repo's test fixture inside the container — extracted 8969 characters
- **Committed in:** `5990ff3`, released as v1.0.0-alpha.23

**2. [Rule 3 - Blocking] BullMQ queue collision between local dev and production**
- **Found during:** Task 3, second submission attempt
- **Issue:** A 3-day-old local `nuxt dev` process shared the same unprefixed Redis queue as production and intermittently stole and failed production's jobs — production's own worker logged nothing for the job even though BullMQ's own history showed it "completed"
- **Fix:** Added a `queuePrefix` (`"prod"`/`"dev"` from `NODE_ENV`) applied identically to both the `Queue` and the `Worker`
- **Files modified:** `server/utils/queue.ts`, `server/plugins/worker.ts`
- **Verification:** Cross-checked BullMQ's `getCompleted()` job history against the raw Docker json-log file for the worker container, proving a different consumer had processed the job; after the fix, the production worker's own logs showed the full lifecycle for the next submission
- **Committed in:** `a1dc1d0`, released as v1.0.0-alpha.24

**3. [Rule 3 - Blocking] server/prompts missing from the runtime image entirely**
- **Found during:** Task 3, third submission attempt
- **Issue:** `CRITICAL: Failed to load prompt from /app/server/prompts/v2/basic-analysis-prompt.txt` — the Dockerfile's runner stage never copied anything under `/app/server`, so these `fs`-read (not statically imported) prompt files never existed in any built image
- **Fix:** Copy `server/prompts` from the builder stage into the runner stage at the same relative path
- **Files modified:** `Dockerfile`
- **Verification:** Built the image locally, confirmed the files exist and are readable inside the container
- **Committed in:** `a74f859`, released as v1.0.0-alpha.25

**4. [Rule 3-adjacent, config not code] Basic tier's OpenAI output token limit too low for a reasoning-model pass**
- **Found during:** Task 3, fourth submission attempt
- **Issue:** `finish_reason: 'length'` — the model hit its 2500-token output ceiling mid-generation (reasoning models spend hidden tokens against the same budget) even for the smallest test fixture
- **Fix:** Raised `tiers.basic.tokenLimits.output` from 2500 to 6000 in the DB-backed `configurations` row, with Carlos's explicit go-ahead (cost-relevant, not silently changed)
- **Files modified:** None (DB row only, via `PATCH /rest/v1/configurations` from inside the app container with the service key)
- **Verification:** Fifth submission attempt completed successfully with full structured output
- **Committed in:** N/A (data change, not code)

---

**Total deviations:** 4 (3 auto-fixed infra bugs + 1 config tuning change, all flagged to and confirmed by Carlos before shipping)
**Impact on plan:** All four were necessary for LAUNCH-01 to actually pass — none were scope creep; each was a genuine, previously-undiscovered blocker that only surfaced because a real job was submitted end to end for the first time since the initial deploy.

## Issues Encountered

- The dashboard's file-upload widget did not visually react to a programmatic `<input type=file>` file assignment — same class of click/event-binding flakiness observed elsewhere in today's session (dark-mode toggle, login link). Worked around by calling the underlying API endpoints directly via `fetch()`, which the plan already listed as an acceptable path. Not investigated further — out of scope for this plan, but worth a note for whoever eventually looks at general UI-interactivity flakiness on this app.
- `analysis_type` in the `/api/analyses/:id/status` response consistently showed `"premium"` even for jobs the worker correctly logged and processed as `"basic"` — a cosmetic/labeling inconsistency, not a functional bug (verified the worker used the correct tier, model, and credit cost throughout). Not investigated further; flagged here for a future cleanup pass.

## User Setup Required

None new beyond what 13-02 already established. The QA account (email/password) exists only in Carlos's own memory and the connected Chrome's session — by design, never written to disk or seen by any agent.

## Next Phase Readiness

- **READY.** LAUNCH-01 is fully satisfied. Production is healthy on v1.0.0-alpha.25 with the Basic tier's token limit corrected.
- **AUTH_MODE=browser** is the established mechanism for 13-05 (LAUNCH-02/03: PDF export/caching) and 13-06 (LAUNCH-04: Forensic UI render) — both should reuse the same authenticated Chrome tab rather than attempting credential-based auth.
- **Non-blocking follow-ups for a future plan:** the unused bundled Redis container in `docker-compose.prod.yml` (still dead weight per 13-03's notes), the `SUPABASE_ANON_KEY`/`SUPABASE_KEY` naming inconsistency (also from 13-03), the upload UI widget's file-input reactivity, and the `analysis_type` mislabeling in the status response.

---
*Phase: 13-launch-verification*
*Completed: 2026-09-29*
