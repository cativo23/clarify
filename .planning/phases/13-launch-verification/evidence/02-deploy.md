# Phase 13-03: Release Cut and First Production Deploy Evidence

**Date:** 2026-09-28
**Purpose:** Record the v1.0.0-alpha.20 GitFlow release cut (Task 1) and, after Carlos's go/no-go (Task 2), the first production deploy to polaris2 (Task 3).

---

## Task 1: Cut release/v1.0.0-alpha.20 and open both GitFlow PRs

### 1. Fetch and pre-flight checks

```bash
$ git fetch origin --tags --prune
(no new refs — already up to date)

$ gh release view v1.0.0-alpha.20 -R cativo23/clarify
release not found
```
**Result:** PASS — the v1.0.0-alpha.20 release does not exist yet.

### 2. develop / origin/develop state

At the time this plan executed, local `develop`, `origin/develop`, and this worktree's HEAD were already identical (`c527e057a0447639ead1cdee9d74e755db563bc2`) — the wave-1 executor merges (plans 13-01, 13-02) had already brought `develop` up to date with `origin/develop`, and both `23174ee` (Node 24 CI docker-action upgrade) and `fde524a` (LICENSE) were already ancestors of `develop`:

```bash
$ git rev-parse HEAD
c527e057a0447639ead1cdee9d74e755db563bc2
$ git rev-parse develop
c527e057a0447639ead1cdee9d74e755db563bc2
$ git rev-parse origin/develop
c527e057a0447639ead1cdee9d74e755db563bc2

$ git merge-base --is-ancestor 23174ee develop && echo ANCESTOR
ANCESTOR
$ git merge-base --is-ancestor fde524a develop && echo ANCESTOR
ANCESTOR
```

**Result:** PASS — no merge was needed (`develop` already had everything `origin/develop` has, and the Node 24 CI upgrade + LICENSE commits are already in `develop`'s history). This worktree's own branch (`worktree-agent-a7facd3e8e68c3e41`) was already forked from this exact commit, so `develop` could not be checked out directly inside this worktree (git refuses — it's checked out in the primary repository checkout). The release branch was created directly from this worktree's HEAD, which is byte-identical to `develop`.

### 3. Release branch cut

```bash
$ git checkout -b release/v1.0.0-alpha.20
Switched to a new branch 'release/v1.0.0-alpha.20'

$ git push -u origin release/v1.0.0-alpha.20
 * [new branch]      release/v1.0.0-alpha.20 -> release/v1.0.0-alpha.20
branch 'release/v1.0.0-alpha.20' set up to track 'origin/release/v1.0.0-alpha.20'.
```

**Release branch head SHA:** `c527e057a0447639ead1cdee9d74e755db563bc2` (before this evidence commit)

### 4. Pull requests

**PR to `main`:** [#46](https://github.com/cativo23/clarify/pull/46) — `release: v1.0.0-alpha.20`

```bash
$ gh pr view 46 --json number,url,mergeable,mergeStateStatus,baseRefName,headRefName
{"baseRefName":"main","headRefName":"release/v1.0.0-alpha.20","mergeStateStatus":"CLEAN","mergeable":"MERGEABLE","number":46,"url":"https://github.com/cativo23/clarify/pull/46"}
```
**Result:** PASS — CLEAN / MERGEABLE.

**PR to `develop`:** could not be opened at first attempt — GitHub rejected it with `No commits between develop and release/v1.0.0-alpha.20`, because the release branch was cut directly from `develop`'s exact HEAD with no new commits yet. Resolved by committing this evidence file on the release branch first (commit `f9d98e7`, "📝 docs(13-03): record release PRs"), pushing it, and then opening the `develop` PR immediately after — that commit is what creates the diff GitHub requires. This is a pre-existing quirk of this specific release (13-01/13-02 already landed all the release content directly on `develop`, so the release branch started with zero diff from `develop`), not a plan defect; no code changes were made to work around it, only the ordering of "commit evidence" vs. "open develop PR" was swapped from the plan's literal step order.

**PR to `develop`:** [#47](https://github.com/cativo23/clarify/pull/47) — `release: v1.0.0-alpha.20`

```bash
$ gh pr view 47 --json number,url,mergeable,mergeStateStatus,baseRefName,headRefName
{"baseRefName":"develop","headRefName":"release/v1.0.0-alpha.20","mergeStateStatus":"CLEAN","mergeable":"MERGEABLE","number":47,"url":"https://github.com/cativo23/clarify/pull/47"}
```
**Result:** PASS — CLEAN / MERGEABLE.

Re-checked PR #46 (main) after the evidence-file push — still CLEAN / MERGEABLE:
```bash
$ gh pr view 46 --json number,url,mergeable,mergeStateStatus,baseRefName,headRefName
{"baseRefName":"main","headRefName":"release/v1.0.0-alpha.20","mergeStateStatus":"CLEAN","mergeable":"MERGEABLE","number":46,"url":"https://github.com/cativo23/clarify/pull/46"}
```

### 5. Task 1 plan-level `<verify>` re-run

```bash
$ git fetch -q origin
$ gh pr list -R cativo23/clarify --head release/v1.0.0-alpha.20 --state open --json baseRefName --jq '[.[].baseRefName] | sort | join(",")'
develop,main
$ git merge-base --is-ancestor 23174ee origin/release/v1.0.0-alpha.20 && echo ANCESTOR
ANCESTOR
$ git show origin/release/v1.0.0-alpha.20:docker-compose.prod.yml | grep -q 'NUXT_REDIS_HOST' && echo PASS
PASS
$ gh release view v1.0.0-alpha.20 -R cativo23/clarify
release not found
```
**Result:** PASS — all four conditions of the plan's Task 1 `<verify>` block hold: both PRs open (develop, main), the release branch has the Node 24 CI commit, the compose file has the 13-01 NUXT_REDIS_HOST fix, and no v1.0.0-alpha.20 release exists yet.

### 6. Task 1 outcome

Both release PRs are open and mergeable ([#46](https://github.com/cativo23/clarify/pull/46) to `main`, [#47](https://github.com/cativo23/clarify/pull/47) to `develop`). Nothing is merged or published. Task 2 (go/no-go checkpoint) is next — this executor halts here and returns control to the orchestrator per this plan's `autonomous: false` frontmatter and the checkpoint's blocking gate; Task 3 (merge, release, deploy, verify) runs only after Carlos says "go".

---

## Task 2: Go/no-go checkpoint

**Carlos said "go."** Proceeding with Task 3.

## Task 3: Tracer (production leg)

### 1. Merge PRs

```bash
$ gh pr merge 47 --merge --admin   # release/v1.0.0-alpha.20 -> develop
mergedAt: 2026-09-28T22:46:19Z, mergeCommit: 11fecefa91e863921e81617f74bc9ad7741584bf

$ gh pr merge 46 --merge --admin   # release/v1.0.0-alpha.20 -> main
mergedAt: 2026-09-28T22:46:27Z, mergeCommit: e248cc7e4733f043259546d24102bcbd8923396a
```
**Result:** PASS — both PRs merged, develop first then main, per the plan's step ordering.

### 2. Auto Release

```bash
$ gh run list -R cativo23/clarify --workflow=auto-release.yml --limit 1
36494349485  release/v1.0.0-alpha.20  in_progress
$ gh run watch 36494349485 --exit-status
✓ release in 6s (ID 109170284474)
  ✓ Set up job / Checkout / Extract and validate version / Check tag does not already exist
  ✓ Parse release notes from CHANGELOG.md / Create GitHub Release
```

```bash
$ gh release view v1.0.0-alpha.20 -R cativo23/clarify --json tagName,isPrerelease,body
{"tagName":"v1.0.0-alpha.20","isPrerelease":true,"body":"### Features\n...### Deploy\n..."}
```
**Result:** PASS — auto-release.yml created the release itself as a prerelease, notes match the CHANGELOG `[1.0.0-alpha.20]` section exactly. CLAUDE.md's manual tag/`gh release create` steps (4-5) were **not** run — not needed, avoiding a duplicate release.

### 3. CI/CD — build

```bash
$ gh run list -R cativo23/clarify --workflow=ci-cd.yml --limit 1
36494363136  v1.0.0-alpha.20  release event, in_progress
```

**First attempt (run 36494363136):**
- `build` job: **success** in 3m23s — image built and pushed to Docker Hub (`cativo23/clarify:v1.0.0-alpha.20`, `:latest`, `:sha-*`).
- `Deploy to Home Server` job: **failed** at step "Copy compose file to server" (`appleboy/scp-action`). Log tail:
  ```
  remote server os type is unix
  scp file to server.
  2026/09/28 22:54:42 error copy file to dest: ***, error message: dial tcp ***:***: connect: connection timed out
  ```
  The first connection (host-type probe) succeeded; the second connection (the actual file transfer) timed out after ~2m15s.

**Diagnosis attempt 1 (before retrying):** direct SSH from this machine to the server succeeded immediately (`ssh -p 52222 cativo23@cativo.dev` → `SSH_OK`), confirming the `SSH_HOST`/`SSH_PORT`/`SSH_USERNAME`/`SSH_PRIVATE_KEY` secrets are all correct and the server is reachable. This did not look like a credential problem, so per the D-05 fix loop this executor ran ONE rerun of the failed job: `gh run rerun 36494363136 --failed`.

**Second attempt (same run, rerun):**
- `build` job: **success** again in 3m23s (rebuilt/re-pushed the same tags).
- `Deploy to Home Server` job: **failed again**, identical symptom:
  ```
  remote server os type is unix
  scp file to server.
  2026/09/28 23:00:21 error copy file to dest: ***, error message: dial tcp ***:***: connect: connection timed out
  ```
  Same ~2m15s timeout on the second connection, same step.

**Result:** **FAIL — two identical failures.** Per this plan's executor notes ("if the same approach fails twice, stop and report"), no third rerun was attempted.

**Additional diagnosis performed (read-only, no server changes):**
```bash
$ ssh -p 52222 cativo23@cativo.dev 'sudo -n fail2ban-client status sshd'
Status for the jail: sshd
|- Currently banned: 0
`- Banned IP list:  (empty)

$ ssh -p 52222 cativo23@cativo.dev 'sudo -n grep "2026-09-28 2[23]:" /var/log/fail2ban.log'
(no output — no ban/unban activity during the failure window 22:50-23:01 UTC)

$ ssh -p 52222 cativo23@cativo.dev 'grep -E "MaxStartups|MaxSessions" /etc/ssh/sshd_config'
MaxSessions 50
MaxStartups 20:50:100
```
fail2ban is not blocking anything and sshd's connection limits are generous — this rules out a server-side auto-ban or connection-limit cause. `journalctl -u sshd` was not readable by the `cativo23` user (not in `adm`/`systemd-journal` groups), so the exact TCP-level cause on the GitHub Actions → home-server path (ISP/router NAT, ephemeral runner IP, or a transient network condition specific to establishing a *second* connection within the same job) could not be pinned down further from this session.

**Note on the deploy job's actual effect:** because the failure is at "Copy compose file to server" (before "Deploy to server", which was `skipped`), **no `docker compose` command ever ran on the server**. Production is unchanged from its pre-13-03 state (no clarify containers running, per 13-01/13-02's pre-flight evidence) — this is not a partial/broken deploy, it is simply not deployed yet.

**Halting Task 3 here per plan/executor-notes instructions.** The release is published and the image is built and available on Docker Hub; only the SSH-based compose-file copy step is blocked. Steps 4-8 of Task 3 (server health check, HTTPS/TLS checks, image-digest comparison, release-branch cleanup, and this file's own completion) are **not yet done** and depend on a successful deploy job run.

**Recommended next steps for Carlos (not acted on by this executor — outside the D-05 categories and outside D-02's automated-only deploy scope):**
1. Simplest: just retry again later (`gh run rerun 36494363136 --failed` from `gh` CLI) — the symptom (first connection OK, second connection times out) is consistent with a transient network condition (home router NAT/conntrack table, ISP path, or the specific GitHub Actions runner IP for that job) rather than a fixed misconfiguration, since direct SSH from this session worked both times without issue.
2. If it keeps failing identically, check the home router/firewall logs for dropped connections around the failure timestamps (this session could not reach beyond `fail2ban` and `sshd_config`, both clean).
3. A one-time manual `docker compose` deploy via this session's already-working SSH access was considered and intentionally **not** done — 13-CONTEXT.md's D-02 explicitly scopes this phase to the *existing automated* GitHub Actions pipeline ("No new deploy mechanism needed"), and 13-RESEARCH.md flags manual deploy as "not the intended flow" for this phase. Switching to it would be a deviation from an explicit locked decision, not a same-approach retry — flagging for Carlos's call rather than doing it unilaterally.
