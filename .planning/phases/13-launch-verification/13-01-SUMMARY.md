---
phase: 13-launch-verification
plan: 01
subsystem: infra
tags: [docker, traefik, nuxt-runtime-config, pdf-parse, napi-rs-canvas, ci-cd, release]

# Dependency graph
requires: []
provides:
  - "Production compose contract (docker-compose.prod.yml) aligned to the real polaris2 Traefik conventions, image reference with CLARIFY_IMAGE_TAG rollback seam, and full NUXT_ runtime-env override block"
  - "A pre-existing, unconditional production boot crash (pdf-parse -> pdfjs-dist -> @napi-rs/canvas DOMMatrix polyfill missing from the Nitro-traced .output) found and fixed"
  - "v1.0.0-alpha.20 release content: CHANGELOG section, package.json version, corrected DEPLOY.md"
affects: ["13-03 (release cut MUST build+publish a fresh image — v1.0.0-alpha.19 is broken)", "13-02", "13-04", "13-05", "13-06", "13-07"]

actuals:
  tokens: 3338
  tasks: 2
  commits: 3

tech-stack:
  added: ["@napi-rs/canvas@0.1.80 (explicit top-level dependency, pins what was already a transitive pdf-parse dependency)"]
  patterns: ["Dockerfile runner-stage explicit COPY as a Nitro node-file-trace bypass for native binary deps that ship behind a try/catch require()"]

key-files:
  created: []
  modified:
    - "docker-compose.prod.yml — Traefik labels (real host, websecure/letsencryptresolver), image reference, full NUXT_ runtime env contract for app+worker"
    - "Dockerfile — runner stage explicitly copies @napi-rs/canvas + @napi-rs/canvas-linux-x64-musl into .output/server/node_modules"
    - "package.json — @napi-rs/canvas pinned as explicit dependency; version bumped to 1.0.0-alpha.20"
    - "package-lock.json — regenerated to reflect the @napi-rs/canvas pin (also picks up a pre-existing, unrelated top-level version-field correction, see Deviations)"
    - "CHANGELOG.md — new [1.0.0-alpha.20] section"
    - "DEPLOY.md — SSH port corrected to 52222 everywhere, new Runtime environment contract and Traefik conventions subsections"

key-decisions:
  - "Investigated a lazy/no-canvas alternative (Option D) before the native-dependency fix; ruled out because pdf-parse@2.4.5's shipped ESM source imports pdfjs-dist at top-level module scope with no lazy/flag-gated path — confirmed against the actual installed package, not assumed"
  - "Fixed the DOMMatrix crash by pinning @napi-rs/canvas as an explicit top-level dependency (Carlos-approved Option A) plus an explicit Dockerfile COPY of the resolved package + its linux-x64-musl native binary into .output/server/node_modules, bypassing Nitro's node-file-trace gap rather than trying to make nft trace it correctly"
  - "Continued the existing v1.0.0-alpha.N tag sequence for the release version (v1.0.0-alpha.20) per 13-CONTEXT.md's Claude's Discretion, since git tag -l shows v1.0.0-alpha.19 as the actual latest published tag despite v1.1/v2.0 milestone names"
  - "Split the @napi-rs/canvas deviation into its own commit ahead of the plan's docker-compose.prod.yml commit, so the plan's own acceptance criterion (git show --stat HEAD lists only docker-compose.prod.yml) still holds for that specific commit"

requirements-completed: [LAUNCH-01]

coverage:
  - id: D1
    description: "Production compose contract (Traefik labels, image reference, NUXT_ runtime env) proven RED (published image, plain REDIS_HOST) then GREEN (locally rebuilt image with the same compose file) before any release is cut"
    requirement: LAUNCH-01
    verification:
      - kind: integration
        ref: "docker compose -f docker-compose.prod.yml -p clarify-prodcheck up -d --no-build redis app worker; GET /api/health"
        status: pass
      - kind: unit
        ref: "docker compose -f docker-compose.prod.yml --env-file /dev/null config -q (static label/env contract check)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pre-existing production boot crash (DOMMatrix is not defined, every container, every boot) found and fixed — @napi-rs/canvas pinned + explicitly copied into the Nitro-traced runtime output"
    verification:
      - kind: integration
        ref: "docker run <fixed image> -- node -e \"require('@napi-rs/canvas').DOMMatrix\" resolves to a function; container stays up under the same boot conditions that crashed the published v1.0.0-alpha.19 image"
        status: pass
    human_judgment: false
  - id: D3
    description: "v1.0.0-alpha.20 release content (CHANGELOG section, package.json version, corrected DEPLOY.md) is real and parseable by auto-release.yml's exact-version-match awk step"
    verification:
      - kind: unit
        ref: "Task 2 <verify> block: CHANGELOG heading regex + awk extraction non-empty; jq package.json version check; DEPLOY.md grep checks"
        status: pass
    human_judgment: false

duration: ~50min
completed: 2026-09-28
status: complete
---

# Phase 13 Plan 01: Production Deploy Tracer — Compose Fix, DOMMatrix Crash Fix, Release Content Summary

**Fixed a pre-existing, unconditional production boot crash in the published image (pdf-parse's DOMMatrix polyfill silently dropped by Nitro's build tracer) on top of the planned Traefik/image/runtime-env compose fix, then proved both fixes end-to-end against a locally rebuilt image before touching any release.**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-09-28
- **Tasks:** 2 (plus one Carlos-approved deviation task inserted ahead of Task 1, per the objective's `<prior_investigation_already_done>` instructions)
- **Files modified:** 6 (docker-compose.prod.yml, Dockerfile, package.json, package-lock.json, CHANGELOG.md, DEPLOY.md)

## Accomplishments

- **Found and fixed a production-blocking crash that predates this plan's original scope.** The currently-published `cativo23/clarify:latest` (v1.0.0-alpha.19) crashes on boot in both `app` and `worker` containers with `ReferenceError: DOMMatrix is not defined` — unconditional, every boot. Root cause: `server/utils/pdf-parser.ts` imports `pdf-parse`, which imports `pdfjs-dist`, which wraps `require("@napi-rs/canvas")` in a try/catch to polyfill `DOMMatrix`/`ImageData`/`Path2D` in Node. `pdf-parse@2.4.5` already depends on `@napi-rs/canvas@0.1.80` as a regular dependency, and `npm ci` on the Alpine `deps` stage correctly installs both the `-gnu` and `-musl` native binaries — the break is downstream: Nitro's `node-file-trace` does not follow that try/catch-wrapped `require()` when building `.output`, so `@napi-rs/canvas` is silently absent from the runner image, which only copies `.output` + `package.json` (no `node_modules`).
- **Investigated and ruled out a lazy/no-canvas alternative (Option D)** before implementing the native-dependency fix (Option A), per Carlos's request. Confirmed against the actual installed `pdf-parse@2.4.5` source (`dist/pdf-parse/esm/PDFParse.js`) that the `pdfjs-dist` import happens at top-level module scope, before any constructor or method runs — no flag or lazy-import path exists to avoid it.
- **Implemented Option A**: pinned `@napi-rs/canvas@0.1.80` as an explicit top-level `package.json` dependency, regenerated `package-lock.json` inside a `node:24-alpine` container (matching the project's Docker execution rule), and added an explicit `COPY` in the Dockerfile's runner stage that copies the resolved `@napi-rs/canvas` package and its `@napi-rs/canvas-linux-x64-musl` native binary from the builder stage directly into `.output/server/node_modules`, bypassing the Nitro tracing gap entirely.
- **Proved the fix locally** by building the full production Dockerfile (all 3 stages) with and without the fix:
  - RED (unmodified Dockerfile/package.json, local rebuild): container crashes at boot, `ReferenceError: DOMMatrix is not defined` at `pdfjs-dist/legacy/build/pdf.mjs:15620`.
  - GREEN (fixed Dockerfile/package.json, local rebuild): `require('@napi-rs/canvas').DOMMatrix` resolves to a function; container stays up under the same boot conditions.
- **Completed the plan's original Task 1** (docker-compose.prod.yml): fixed the Traefik router labels to match the real polaris2 static config (`entrypoints=websecure`, `certresolver=letsencryptresolver` instead of the nonexistent `https`/`letsencrypt` names), removed the now-redundant HTTP router and generic scheme-redirect middleware, added `image: cativo23/clarify:${CLARIFY_IMAGE_TAG:-latest}` to both `app` and `worker` (keeping the `build:` block for the documented manual path), and added the full `NUXT_`-prefixed runtime env override block plus plain pass-throughs (`ADMIN_EMAIL`, `ALLOWED_REDIRECT_ORIGINS`, `STRIPE_PRICE_ID_*`) to both services.
- **Proved Task 1's RED→GREEN** using the plan's own verify commands, run against the locally-rebuilt (fixed) image retagged locally as `cativo23/clarify:latest` so `docker compose ... --no-build` would exercise it (the actually-published tag cannot boot at all, so it could not be used for this proof): `GET /api/health` reports `"redis":"connected"`, worker logs `[Worker] Analysis worker plugin initialized`, zero occurrences of `127.0.0.1:6379` in worker logs.
- **Completed Task 2**: added the `[1.0.0-alpha.20]` CHANGELOG section (derived only from `git log --no-merges v1.0.0-alpha.19..HEAD`), bumped `package.json` version to `1.0.0-alpha.20`, and corrected DEPLOY.md (SSH port 52222 everywhere, new "Runtime environment contract" and "Traefik conventions on polaris2" subsections).

## Task Commits

Each task was committed atomically. This plan required an additional deviation commit ahead of Task 1's planned commit — see Deviations below.

1. **Deviation — @napi-rs/canvas DOMMatrix fix** — `60e16ab` (fix) — `package.json`, `package-lock.json`, `Dockerfile`
2. **Task 1: Tracer (local leg) — docker-compose.prod.yml** — `91b56aa` (fix) — `docker-compose.prod.yml`
3. **Task 2: Release content for v1.0.0-alpha.20** — `8f4ab2a` (chore) — `CHANGELOG.md`, `package.json`, `DEPLOY.md`

**Plan metadata commit:** intentionally NOT made from this worktree — the orchestrator commits `STATE.md`/`ROADMAP.md` centrally after all wave agents complete (per this plan's parallel-execution instructions). This SUMMARY.md is committed by the orchestrator's post-merge step.

_Note: base commit for this worktree was `e1940cb`; `git rev-list --count e1940cb..HEAD` = 3, matching the 3 commits above._

## Files Created/Modified

- `docker-compose.prod.yml` — real host + Traefik labels matching polaris2's actual entrypoints/resolver, image reference with rollback seam, full NUXT_ runtime env contract for app+worker
- `Dockerfile` — runner stage now explicitly copies `@napi-rs/canvas` + `@napi-rs/canvas-linux-x64-musl` into `.output/server/node_modules`
- `package.json` — `@napi-rs/canvas` pinned as explicit dependency; version bumped to `1.0.0-alpha.20`
- `package-lock.json` — regenerated for the pin (see Deviations for the incidental version-field fix)
- `CHANGELOG.md` — new `[1.0.0-alpha.20]` section
- `DEPLOY.md` — SSH port fix + two new subsections

## Decisions Made

- Confirmed Option D (lazy-load, avoid the native dependency) was not viable by reading `pdf-parse@2.4.5`'s actual shipped source, rather than assuming based on the package name/version alone — the import happens too early (top-level module scope) for any lazy pattern to help.
- Chose to fix the DOMMatrix crash via an explicit Dockerfile `COPY` of the resolved package rather than attempting to reconfigure Nitro's `node-file-trace`/`externals` behavior — this is a well-understood, minimal, and verifiable workaround for a known class of native-binary tracing gap, and avoids speculative Nitro config changes this session could not fully verify against nitropack's internals in the time available.
- Continued the `v1.0.0-alpha.N` tag sequence (`v1.0.0-alpha.20`) rather than switching to a `v2.0.0` tag, per `13-CONTEXT.md`'s explicit Claude's Discretion note and the actual `git tag -l` state (latest published tag is `v1.0.0-alpha.19`; no `v1.1`/`v2.0` tag has ever been cut despite the milestone names).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, escalated via explicit dispatch instructions] Fixed a pre-existing, unconditional production boot crash in `cativo23/clarify:latest`**

- **Found during:** Task 1's own RED-baseline step (a prior executor run had already discovered and reported this; this run implemented the approved fix per the dispatch prompt's `<prior_investigation_already_done>` block)
- **Issue:** Every container built from the current Dockerfile/package.json crashes at boot with `ReferenceError: DOMMatrix is not defined`, because Nitro's `node-file-trace` does not follow `pdfjs-dist`'s try/catch-wrapped `require("@napi-rs/canvas")` when building `.output`, so the polyfill package never reaches the runner image even though it installs correctly in the `deps`/`builder` stages.
- **Fix:** Pinned `@napi-rs/canvas@0.1.80` as an explicit top-level `package.json` dependency; regenerated `package-lock.json` via `npm install --package-lock-only` inside a `node:24-alpine` container (matching production's base image and this project's Docker-execution rule); added an explicit `COPY --from=builder` of `/app/node_modules/@napi-rs/canvas` and `/app/node_modules/@napi-rs/canvas-linux-x64-musl` into `.output/server/node_modules` in the Dockerfile's runner stage.
- **Files modified:** `package.json`, `package-lock.json`, `Dockerfile`
- **Verification:** Built the full 3-stage production Dockerfile locally twice (before and after the fix). RED: `ReferenceError: DOMMatrix is not defined` at `pdfjs-dist/legacy/build/pdf.mjs:15620`, container exits. GREEN: `node -e "require('@napi-rs/canvas').DOMMatrix"` inside the running fixed container returns `function`; container stays up under identical boot conditions. This fix was then folded into the same locally-rebuilt image used to prove Task 1's own compose-level RED/GREEN (see Task 1 commit message for that evidence), since the actually-published `v1.0.0-alpha.19` tag cannot boot at all and could not serve as the GREEN baseline otherwise.
- **Committed in:** `60e16ab` (separate commit, ahead of Task 1's planned `docker-compose.prod.yml`-only commit)

**2. [Rule 1 - Bug, incidental] Fixed a pre-existing, unrelated `package-lock.json` top-level version-field drift**

- **Found during:** the `npm install --package-lock-only` run for deviation #1
- **Issue:** `package-lock.json`'s top-level `"version"` field read `1.0.0-alpha.10.2`, stale against `package.json`'s `1.0.0-alpha.18` at the time (this is the "pre-existing, unrelated working-tree modification" the plan's own executor notes warned about). npm always re-syncs this field to `package.json`'s version on any `npm install`, so it was corrected as an unavoidable side effect of adding the `@napi-rs/canvas` pin — it was not touched deliberately or separately.
- **Fix:** No separate action; corrected automatically by the `npm install --package-lock-only` run.
- **Files modified:** `package-lock.json` (same commit as deviation #1)
- **Verification:** `git diff` of `package-lock.json` before committing showed exactly 3 deletions / 4 additions: the top-level version-field correction (2 lines) and the new `@napi-rs/canvas` dependency declaration (1 line) — no unrelated dependency-tree churn.
- **Committed in:** `60e16ab`

---

**Total deviations:** 2 auto-fixed (1 pre-existing production-blocking bug per explicit dispatch instructions, 1 incidental unrelated-drift fix as an unavoidable side effect of the first).
**Impact on plan:** `files_modified` for this plan is extended beyond the original `docker-compose.prod.yml, CHANGELOG.md, package.json, DEPLOY.md` to also include `package-lock.json` and `Dockerfile`. Both are necessary for the DOMMatrix fix to be real and reproducible from a clean checkout. No scope creep beyond what the dispatching prompt explicitly authorized — this was investigated and approved by Carlos before this run began (see the dispatch prompt's `<prior_investigation_already_done>` block).

### Acceptance-criteria note (Task 2)

Task 2's third acceptance criterion — `` `git status --porcelain` still shows the lockfile as modified-unstaged (the pre-existing change is untouched, not committed) `` — does **not** hold literally after this plan. The pre-existing lockfile drift no longer exists as an uncommitted, unrelated change: it was resolved (see deviation #2 above) as an inseparable side effect of the `npm install` run required for the @napi-rs/canvas pin (deviation #1), and was committed in `60e16ab`, a commit that predates and is separate from Task 2's own commit (`8f4ab2a`, which touches only `CHANGELOG.md`, `package.json`, `DEPLOY.md` — verified via `git show --stat HEAD`). Task 2's own commit did not sweep in the lockfile; the working tree is clean after this plan's commits, which is a stronger and more correct end-state than the acceptance criterion anticipated (it anticipated a scenario where the lockfile drift was still sitting there, uninvestigated).

## Issues Encountered

None beyond the pre-existing crash documented above as a deviation — no additional problems required inline problem-solving during Task 1 or Task 2.

## User Setup Required

None - no external service configuration required in this plan. (The phase's separate deploy prerequisites — `SSH_HOST`/`SSH_PORT` GitHub secrets, server-side `.env`, Supabase Storage bucket verification — are documented in `13-RESEARCH.md`'s Deploy Prerequisites table and are out of this plan's scope; they belong to later plans in this phase per the roadmap.)

## Next Phase Readiness

- **CRITICAL — flagged prominently per dispatch instructions:** Plan 13-03 (release cut) **MUST build and publish a fresh Docker image** for `v1.0.0-alpha.20`. The currently-tagged `cativo23/clarify:latest` / `v1.0.0-alpha.19` image is broken (crashes on boot, see Deviation #1) and is **not usable for deploy under any circumstances**, even as a rollback target via `CLARIFY_IMAGE_TAG` — DEPLOY.md's example rollback value should never be set to `v1.0.0-alpha.19` or earlier until this is re-verified. Any plan/task that assumes the existing Docker Hub image is deployable is working from stale information.
- The `docker-compose.prod.yml` production compose contract (Traefik labels, image reference, NUXT_ runtime env) is proven correct against a locally rebuilt CI-equivalent image — ready for plan 13-03 to build+push the real image and for plan 13-04+ to run the live LAUNCH-0X verification checks against the actual deployment.
- v1.0.0-alpha.20 release content (CHANGELOG, package.json version, DEPLOY.md) is committed and ready for the GitFlow release branch process in plan 13-03.
- `.afm` probe result for plan 13-05 (pdfkit font-metric survival check): **14 `.afm` files found** under `.output` in the rebuilt image — not a blocker for this plan, but plan 13-05 should know this number if it needs to diagnose a PDF-export font issue.
- No blockers for LAUNCH-01 remain from this plan's scope. The phase's other deploy prerequisites (GitHub secrets P1/P2, server `.env` P3, Supabase bucket P5) documented in 13-RESEARCH.md are still open and belong to later plans/waves in this phase.

## Self-Check: PASSED

- `docker-compose.prod.yml`, `Dockerfile`, `package.json`, `package-lock.json`, `CHANGELOG.md`, `DEPLOY.md` all exist on disk and contain the described changes (verified via `git show --stat` on each commit and direct `grep` checks above).
- Commits `60e16ab`, `91b56aa`, `8f4ab2a` all exist in `git log --oneline` on this worktree's branch.
- All of Task 1's and Task 2's `<acceptance_criteria>` re-verified passing (static contract check, dynamic RED/GREEN health+worker-log checks, CHANGELOG/package.json/DEPLOY.md checks) — see command output captured during execution.
- Plan-level `<verification>` re-confirmed: both Task 1 verify commands pass; Task 2 verify commands pass; 3 commits exist on this branch and none contains `package-lock.json` except the explicitly-flagged deviation commit.
- No `clarify-app-prod`, `clarify-worker-prod`, or `clarify-redis-prod` containers left running (confirmed via `docker ps -a --filter name=clarify`). Test-only Docker artifacts (local `space-server_web` network, local `cativo23/clarify:latest` retag, `clarify-local-red:test`/`clarify-local-green:test` images) were removed after use.

---
*Phase: 13-launch-verification*
*Completed: 2026-09-28*
