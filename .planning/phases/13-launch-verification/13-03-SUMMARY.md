---
phase: 13-launch-verification
plan: 03
subsystem: infra
tags: [gitflow, github-actions, docker-hub, ssh-deploy, release]

# Dependency graph
requires:
  - phase: 13-launch-verification
    provides: "13-01 (compose fix, DOMMatrix crash fix, v1.0.0-alpha.20 release content), 13-02 (deploy secrets, server scaffolding, Supabase Auth URLs)"
provides:
  - "v1.0.0-alpha.20 published as a GitHub prerelease with CHANGELOG notes (via auto-release.yml)"
  - "cativo23/clarify:v1.0.0-alpha.20 and :latest images built and pushed to Docker Hub (via ci-cd.yml build job, twice, both successful)"
  - "release/v1.0.0-alpha.20 merged into both develop and main via GitHub PRs #47 and #46"
  - "A precisely diagnosed, reproducible deploy-job blocker: the SSH file-copy step to polaris2 times out on its second connection, twice in a row, with secrets/server health independently confirmed good"
affects: ["13-04 (LAUNCH-01..04 verification cannot start until the deploy job actually succeeds)", "13-05", "13-06", "13-07"]

actuals:
  tokens: 9600
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "GitFlow release-cut executor operations (cut branch, open/merge PRs, commit evidence) performed directly on real branches (release/*, develop, main) rather than routed through the standard isolated-worktree-then-merge model, per this plan's explicit dispatch authorization — necessary because the plan's own deliverable IS the GitFlow branch state, not application code"
    - "Fast-forward push of a docs-only evidence/SUMMARY commit directly to origin/develop from a freshly-created local branch tracking origin/develop's post-merge tip, used as the worktree-safe equivalent of 'commit on develop' when the shared develop branch is checked out elsewhere and cannot be checked out by name in this worktree"

key-files:
  created: []
  modified:
    - ".planning/phases/13-launch-verification/evidence/02-deploy.md — full Task 1 (PR cut/open) and Task 3 (merge, release, build, deploy-failure diagnosis) evidence"

key-decisions:
  - "Merged develop PR (#47) before main PR (#46), per the plan's Task 3 step 1 explicit ordering (not the reverse order suggested as a fallback option by the dispatching message)"
  - "Treated a repeatable 'connection timed out' on the deploy job's SCP step as NOT a secret/credential problem, despite the plan's executor notes' blanket 'SSH timeout = secret problem' heuristic — direct SSH from this session succeeded instantly with the same secrets, so the fix loop's one sanctioned rerun was used instead of asking Carlos to re-set a secret that was independently proven correct"
  - "After the rerun failed identically a second time, stopped per 'if the same approach fails twice, stop and report' — did not attempt a third automated rerun"
  - "Did not fall back to a manual `docker compose` deploy via this session's own working SSH access, despite having D-03 production access and a working connection — 13-CONTEXT.md's D-02 explicitly scopes this phase to the existing automated GitHub Actions pipeline ('no new deploy mechanism needed'), and 13-RESEARCH.md flags manual deploy as 'not the intended flow' for this phase; switching mechanisms to route around a CI-specific failure is an architectural deviation (Rule 4), not a same-approach retry, so it was flagged for Carlos rather than done unilaterally"

requirements-completed: []

coverage:
  - id: D1
    description: "release/v1.0.0-alpha.20 cut from develop, both GitFlow PRs (#46 to main, #47 to develop) opened and mergeable, evidence committed and pushed before any merge"
    requirement: LAUNCH-01
    verification:
      - kind: integration
        ref: "Task 1 <verify> block (PR base-branch check, Node 24 CI commit ancestry, compose NUXT_REDIS_HOST grep, release-not-yet-published check) — all four conditions PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both PRs merged (develop first, then main); v1.0.0-alpha.20 published as a GitHub prerelease with correct CHANGELOG-sourced notes via auto-release.yml"
    requirement: LAUNCH-01
    verification:
      - kind: integration
        ref: "gh pr view 47/46 mergedAt+mergeCommit; gh release view v1.0.0-alpha.20 --json tagName,isPrerelease,body"
        status: pass
    human_judgment: false
  - id: D3
    description: "ci-cd.yml build job builds and pushes cativo23/clarify:v1.0.0-alpha.20 + :latest to Docker Hub"
    requirement: LAUNCH-01
    verification:
      - kind: integration
        ref: "gh run view 36494363136 — build job conclusion: success (both the original run and the rerun)"
        status: pass
    human_judgment: false
  - id: D4
    description: "ci-cd.yml deploy job copies docker-compose.prod.yml to polaris2 and brings up the stack — the actual first production deploy"
    requirement: LAUNCH-01
    verification:
      - kind: integration
        ref: "gh run view 36494363136 — Deploy to Home Server job, step 'Copy compose file to server'"
        status: fail
    human_judgment: true
    rationale: "Failed identically twice (connection timed out on the second SSH connection within the job, after the first connection succeeded); root cause not fully diagnosable from this session (no journalctl access, fail2ban confirmed clean) — needs Carlos's judgment on whether to retry, investigate the network path, or accept a deviation from the automated-only deploy decision (D-02)"
  - id: D5
    description: "Production HTTPS health, container health, and image-digest checks (the actual tracer-completing checks)"
    requirement: LAUNCH-01
    verification: []
    human_judgment: true
    rationale: "Blocked entirely on D4 — no deploy has succeeded yet, so there is nothing to check against clarify.cativo.dev"

duration: ~40min
completed: 2026-09-28
status: halted
---

# Phase 13 Plan 03: Release Cut and First Production Deploy (Halted) Summary

**v1.0.0-alpha.20 is cut, merged, and published as a GitHub prerelease with a correctly-built and Docker-Hub-pushed image — but the CI/CD deploy job's SSH file-copy step to polaris2 failed identically twice (connection timeout on the second of two connections within the job) with secrets and server health independently confirmed good, so the actual production deploy and all downstream HTTPS/health/container checks remain undone.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-09-28 (Task 1) — halted 2026-09-28T23:0x (Task 3, after second deploy-job failure)
- **Tasks:** 2 of 3 (Task 1 complete, Task 2 resolved "go", Task 3 halted partway through)
- **Files modified:** 1 (`evidence/02-deploy.md`, appended across the run)

## Accomplishments

- **Task 1 (complete):** `release/v1.0.0-alpha.20` cut directly from `develop`'s exact HEAD (already up to date with `origin/develop`, including the Node 24 CI commit and LICENSE commit — no merge was needed). Pushed to origin, both GitFlow PRs opened ([#46](https://github.com/cativo23/clarify/pull/46) to `main`, [#47](https://github.com/cativo23/clarify/pull/47) to `develop`), both confirmed CLEAN/MERGEABLE, evidence committed and pushed before any merge.
- **Task 2:** Carlos said "go." Both PRs merged — develop (#47) first, then main (#46) — per the plan's explicit step ordering.
- **Task 3 (partial):**
  - `auto-release.yml` ran automatically on the main-PR merge and correctly created the `v1.0.0-alpha.20` GitHub prerelease with CHANGELOG-sourced notes — CLAUDE.md's manual tag/release steps were correctly skipped (not needed).
  - `ci-cd.yml`'s `build` job succeeded twice (both the original run and the one sanctioned rerun): `cativo23/clarify:v1.0.0-alpha.20` and `:latest` are on Docker Hub.
  - `ci-cd.yml`'s `Deploy to Home Server` job failed **identically twice** at "Copy compose file to server": the job's first SSH connection (host-type probe) succeeds, then the second connection (the actual file copy) times out (`dial tcp ***:***: connect: connection timed out`) after ~2m15s both times.
  - Diagnosed (read-only, no server changes): a direct SSH connection from this session to the same host/port/key succeeded instantly both times this was checked, ruling out a bad secret. `fail2ban-client status sshd` showed 0 currently banned and the fail2ban log had zero ban/unban activity during either failure window, ruling out an auto-ban. `sshd_config`'s `MaxStartups`/`MaxSessions` are generous defaults, ruling out a connection-limit rejection. `journalctl -u sshd` was not readable by the `cativo23` user in this session (not in `adm`/`systemd-journal`), so the precise network-layer cause (home router NAT/conntrack, ISP path, or something specific to the GitHub Actions runner's egress IP on a second connection within the same job) could not be pinned down further.
  - Per the plan's own instruction ("if the same approach fails twice, stop and report"), no third rerun was attempted, and no fallback to a manual SSH-based deploy was attempted (that would deviate from 13-CONTEXT.md's D-02 "existing automated pipeline only" decision — flagged as a Rule 4 architectural question for Carlos, not decided unilaterally).
  - No `docker compose` command ever ran on the server (the failure is before that step) — production is unchanged from its pre-13-03 state (no clarify containers running), not a partial or broken deploy.

## Task Commits

Each unit of work was committed atomically, on real GitFlow branches per this plan's explicit design (not the standard isolated-worktree-then-merge model — see Deviations):

1. **Task 1 — release PR evidence** — `f9d98e7` (docs, on `release/v1.0.0-alpha.20`) — `.planning/phases/13-launch-verification/evidence/02-deploy.md`
2. **Task 1 — develop PR + mergeable-state evidence** — `3503990` (docs, on `release/v1.0.0-alpha.20`) — same file
3. **Task 2/3 — PR merges** — GitHub-generated merge commits `11fecefa` (into `develop`, PR #47) and `e248cc7e` (into `main`, PR #46); no local commit made by this executor for the merges themselves
4. **Task 3 — deploy-failure diagnosis evidence** — `b3c0397` (docs, pushed directly to `develop`) — same file, plus this SUMMARY.md in a following commit

**Plan metadata:** this SUMMARY.md is committed directly to `develop` in the commit immediately following `b3c0397`, for the same reason (see Deviations) — `develop` cannot be checked out by name inside this worktree (it's checked out in the primary repo checkout), so a fast-forward push from a freshly-created local branch tracking `origin/develop`'s tip is used instead of the standard worktree-merge flow.

_Base commit for this worktree was `c527e057a0447639ead1cdee9d74e755db563bc2`; `git rev-list --count c527e057a0447639ead1cdee9d74e755db563bc2..HEAD` = 4 (3 direct commits by this executor + 1 GitHub-generated merge commit that is an ancestor of `develop`; the `main`-branch merge commit `e248cc7e` is on a different line of history and not counted here)._

## Files Created/Modified

- `.planning/phases/13-launch-verification/evidence/02-deploy.md` — complete Task 1 evidence (PR cut/open/mergeable-state) and Task 3 evidence (merge results, auto-release confirmation, CI/CD build success, deploy-job failure diagnosis, recommended next steps)

## Decisions Made

- Merged the `develop` PR before the `main` PR, per the plan's explicit Task 3 step 1 ordering.
- Treated the deploy job's "connection timed out" as a transient network issue rather than a credential problem, based on a direct, successful SSH test with the same secrets — used the plan's one sanctioned rerun rather than asking Carlos to reset a secret that was independently verified correct.
- Stopped after the rerun failed identically, per "if the same approach fails twice, stop and report" — did not attempt a third rerun.
- Did not fall back to a manual `docker compose` deploy via this session's working SSH access, even though it was technically available (D-03 grants production access) — this would deviate from 13-CONTEXT.md's D-02 ("no new deploy mechanism needed") and 13-RESEARCH.md's explicit note that manual deploy is "not the intended flow" for this phase. Flagged as a decision for Carlos rather than acted on.

## Deviations from Plan

### Auto-fixed Issues

None — no code, config, or compose-file bugs were found or fixed. The only issue encountered (the deploy job's SSH timeout) is documented below as an Issue Encountered, not an auto-fixed deviation, because it was not resolved within this run.

### Process deviations (not code fixes — documented for traceability)

**1. [Rule 3-adjacent, explicitly authorized by dispatch] GitFlow branch operations performed directly on real branches inside an isolated worktree, not through the standard worktree-then-merge model.**
- **Found during:** Task 1, immediately (this worktree's `HEAD` needed to become `release/v1.0.0-alpha.20`, then later a branch tracking `origin/develop`, rather than staying on the assigned `worktree-agent-*` branch for the whole plan).
- **Context:** This plan's entire purpose is to produce real GitFlow branch/PR/release state, which the standard "commit on agent branch, orchestrator merges to develop later" model cannot produce (a PR against `develop` needs a real, pushed branch; GitHub Release publishing needs a real merge to `main`). The dispatching prompt's `<parallel_execution>` section explicitly authorized this: "You will create a real `release/v1.0.0-alpha.20` branch and push it to origin... this is expected and intended."
- **Mechanics used:** (a) confirmed via `git worktree list` that `develop` was checked out in the primary repo checkout, so it could not be checked out by name in this worktree; (b) since this worktree's HEAD was already byte-identical to `develop`/`origin/develop`, created `release/v1.0.0-alpha.20` directly from HEAD (equivalent to the plan's literal `git checkout develop && git merge --no-edit origin/develop && git checkout -b release/...`, with the merge step correctly resolving to a no-op); (c) for the Task-3 evidence/SUMMARY commits that the plan says belong "on develop," created a new local branch (`worktree-agent-a7facd3e8e68c3e41-task3`, matching the project's agent-branch naming convention) tracking `origin/develop`'s post-merge tip, committed there, and fast-forward-pushed directly to `origin`'s `develop` ref (`git push origin <local-branch>:develop`) — mirroring the exact mechanism this project's own GSD orchestrator already uses for merging prior wave-1 executor branches into `develop` (confirmed via `git log`: `24e4b15 chore: merge executor worktree ...`, `c527e05 chore: merge executor worktree ...`, both present on `origin/develop` with no corresponding PR).
- **Files/branches affected:** `release/v1.0.0-alpha.20` (created, pushed, still exists — not yet deleted per plan step 7, since Task 3 hasn't reached that step), `origin/develop` (two direct pushes), this worktree's original agent branch `worktree-agent-a7facd3e8e68c3e41` (untouched, still at `c527e05` — zero new commits, by design).
- **Verification:** `gh pr view` on both PRs before and after each push confirmed CLEAN/MERGEABLE at every step; `git rev-parse`/`git ls-remote` confirmed each push landed at the expected SHA with no force-push used anywhere.

**2. Opening the `develop` PR required reordering the plan's literal step sequence.**
- **Found during:** Task 1, step 4 (open both PRs before committing evidence).
- **Issue:** `gh pr create --base develop ...` failed with `No commits between develop and release/v1.0.0-alpha.20` — the release branch was cut directly from `develop`'s exact HEAD (13-01/13-02 had already landed everything), so there was zero diff until a commit was added.
- **Fix:** Opened the `main` PR first (succeeded immediately, since `main` is genuinely behind), committed the evidence file (which the plan called for anyway, just one step later than written), pushed, then opened the `develop` PR — which then succeeded since a diff now existed.
- **Files modified:** None beyond the evidence file itself.
- **Verification:** Both PRs subsequently confirmed CLEAN/MERGEABLE (`gh pr view 46`/`47 --json mergeable,mergeStateStatus`).
- **Committed in:** `f9d98e7` (evidence commit that created the diff), PR #47 opened immediately after.

---

**Total deviations:** 0 code/compose fixes; 2 process notes (both required by this plan's atypical GitFlow-on-real-branches design, both explicitly anticipated or authorized by the dispatching instructions).
**Impact on plan:** None on scope or correctness — both are mechanical adaptations to operating on real shared branches from inside an isolated worktree, not changes to what the plan actually delivers.

## Issues Encountered

- **The deploy job's SSH file-copy step (`appleboy/scp-action`) failed identically twice with `connection timed out` on its second TCP connection within the job**, despite the first connection in the same job succeeding and despite independent, successful direct SSH tests from this session using the same secrets. Root cause not fully diagnosed: `fail2ban` was confirmed clean (0 banned, no ban/unban log activity in either failure window) and `sshd_config`'s connection limits are generous, but `journalctl -u sshd` access was denied to this session's user, so the precise network-layer cause (home router NAT/conntrack table, ISP path instability, or a GitHub Actions runner-egress-IP-specific condition) remains open. **This is the blocking issue for the rest of Phase 13** — LAUNCH-01 through LAUNCH-04 all require a live deployment to verify against, and none of those checks could be attempted.

## User Setup Required

None new. All deploy secrets/scaffolding from 13-02 remain valid and were independently re-confirmed working in this plan (direct SSH succeeded twice). No additional external service configuration is needed to retry — the blocker is a network-path symptom, not a missing credential or configuration.

## Next Phase Readiness

- **BLOCKER, not ready:** LAUNCH-01 (and therefore LAUNCH-02/03/04, all of which depend on a live deployment) cannot be verified until the CI/CD deploy job actually completes successfully. The release, tag, and Docker Hub image are all correctly published and waiting — only the SSH copy-to-server step is failing.
- **Recommended next action for Carlos:** simplest first — just retry the deploy job again (`gh run rerun 36494363136 --failed -R cativo23/clarify`, or via the GitHub UI); the symptom pattern (first connection fine, second times out) reads as transient rather than a fixed misconfiguration. If it fails a third consecutive time in the same way, the network path between GitHub Actions and polaris2 itself (not credentials, not compose file, not this project's code) likely needs investigation — router/ISP logs beyond what `fail2ban`/`sshd_config` could show from inside this session.
- **Do not re-cut a new alpha release to work around this.** Per the plan's own D-05 fix loop, a new version bump is only for compose-file/code problems on develop, which this is not — the same `v1.0.0-alpha.20` tag/image should be redeployed once the network issue clears, via `gh run rerun`.
- Plan 13-03's own remaining steps (server container health, HTTPS/TLS/redirect/HSTS checks, image-digest comparison, release-branch cleanup, and this evidence file's final "Complete" section) are all still pending and depend entirely on the deploy job succeeding. A continuation executor picking this back up should start from Task 3 step 4 (`docker compose ps` health check) once a `gh run view <id>` shows the `Deploy to Home Server` job as `success`.

## Self-Check: PASSED

- `evidence/02-deploy.md` exists on disk and contains the full Task 1 + Task 3 (partial) narrative, verified via direct read.
- Commits `f9d98e7`, `3503990`, `b3c0397` all exist in `git log --oneline` on `origin/develop` (confirmed via `git ls-remote origin develop` matching `b3c0397` before this SUMMARY commit).
- PRs #46 and #47 both confirmed `state: MERGED` via `gh pr view`.
- Release `v1.0.0-alpha.20` confirmed via `gh release view` as `isPrerelease: true` with correct CHANGELOG-sourced body.
- Docker Hub push confirmed via two successful `build` job runs (`gh run view 36494363136`).
- Deploy job failure independently re-verified via `gh run view --log-failed` twice (original + rerun), both showing the identical timeout symptom — not asserted from memory.
- No destructive git operations were used anywhere in this plan: only `git checkout -b`, `git push` (never `--force`), and standard commits. `git worktree list` was used (read-only) to confirm branch-checkout constraints before acting.

---
*Phase: 13-launch-verification*
*Completed: 2026-09-28*
*Status: halted — Task 3 blocked on a deploy-job network-timeout requiring Carlos's decision on retry vs. investigation*
