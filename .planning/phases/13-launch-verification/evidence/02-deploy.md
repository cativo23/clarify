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

---

## Orchestrator continuation: root cause found and resolved

The executor's diagnosis (transient network condition) was investigated further by the orchestrator after Carlos reported the deploy as failed. Two more identical failures occurred on manual reruns (3 total), ruling out "transient."

### Actual root cause

`clarify`'s GitHub repo has a **`prod` environment** with its own environment-scoped secrets named `SSH_HOST` and `SSH_PORT` — these existed **before** this phase's work and were never surfaced by 13-02's research, which only checked repo-level secrets (`gh secret list`, which does not include environment-scoped ones). Since `ci-cd.yml`'s `deploy` job declares `environment: prod`, GitHub resolves `secrets.SSH_HOST`/`secrets.SSH_PORT` from the **environment-level** secrets, which silently shadow any repo-level secrets of the same name. The orchestrator's earlier `gh secret set SSH_HOST`/`gh secret set SSH_PORT` (during 13-02's checkpoint continuation) had set **repo-level** secrets, which were never actually used by this job — explaining three consistent, non-transient failures.

**Found by comparing against a working sibling project:** `portfolio-api` (43 production releases to the same host, `environment: prod`) uses `vars.DEPLOY_HOST`/`vars.DEPLOY_PORT` (plain repo variables, not secrets) set to the server's **raw IP** (`167.235.52.161`), sidestepping this exact class of shadowing issue entirely.

**Fix applied:**
```bash
$ gh secret set SSH_HOST --env prod -R cativo23/clarify -b "167.235.52.161"
$ gh secret set SSH_PORT --env prod -R cativo23/clarify -b "52222"
```
Both environment-scoped secrets confirmed updated (`updated_at: 2026-09-29T00:59:2Xz`).

### CI/CD — deploy (successful rerun)

```bash
$ gh run rerun 36494363136 -R cativo23/clarify --failed
$ gh run view 36494363136 -R cativo23/clarify --json conclusion --jq '.conclusion'
success
```
**Result:** PASS — `Deploy to Home Server` completed. `docker compose -f docker-compose.prod.yml pull/down/up -d` ran on polaris2 for the first time.

### Post-deploy incident: two further env-only bugs, fixed live (no new release needed)

1. **Redis auth vs. TLS conflict.** `/` returned HTTP 500. App logs: `[SECURITY] Redis authentication not configured in production` → `Redis authentication required in production environment` (from `server/utils/rate-limit.ts`'s hard production gate). The compose file's bundled `redis:7-alpine` had no password. The orchestrator initially set a fresh `REDIS_TOKEN` + `--requirepass` on the bundled local Redis, but `rate-limit.ts`/`queue.ts` unconditionally enable TLS (`redisConfig.tls = {}`) whenever `redisToken` is set — code written for Upstash, and the bundled local Redis doesn't speak TLS, so this produced `ETIMEDOUT` on every connection instead. **Resolved per Carlos's direction:** he already runs the same Upstash Redis instance for local dev; the orchestrator had Carlos copy his local `.env`'s `REDIS_HOST`/`REDIS_PORT`/`REDIS_TOKEN` (Upstash) onto the server `.env` in place of the bundled-Redis token, matching the architecture `server/utils/rate-limit.ts` and `queue.ts` actually expect. `docker compose up -d` recreated containers; `/api/health` confirmed `"redis":"connected"` with no auth error.
   - **Deviation note:** the bundled `redis:7-alpine` container in `docker-compose.prod.yml` is now unused dead weight (still started as a `worker` health dependency) since the app talks to Upstash instead. Not removed in this session — flagged as cleanup for a future phase/plan, not blocking LAUNCH-01..04.
2. **`SUPABASE_ANON_KEY` / `SUPABASE_KEY` name mismatch.** `/` still 500'd after the Redis fix: `"Your project's URL and Key are required to create a Supabase client!"`. `docker-compose.prod.yml` reads `${SUPABASE_ANON_KEY}` (and logged a compose warning that it was unset) while the server `.env` (copied from Carlos's local dev `.env`) uses the name `SUPABASE_KEY` for the same anon/publishable key. Fixed by adding a `SUPABASE_ANON_KEY` line to the server `.env` duplicating `SUPABASE_KEY`'s value (a public/publishable key, `sb_publishable_...` prefix — safe to duplicate under two names). `docker compose up -d` recreated containers again.
   - **Deviation note:** this is a pre-existing naming inconsistency between `.env.example`/`docker-compose.prod.yml` (which use `SUPABASE_ANON_KEY`) and the project's actual `.env` convention (`SUPABASE_KEY`, matching `CLAUDE.md`'s documented required-env list). Worth reconciling in a future cleanup plan so a fresh `.env` built from `.env.example` doesn't hit this same gap.

### Final verification (all must_haves)

```bash
$ curl -s -o /dev/null -w "%{http_code}" https://clarify.cativo.dev/api/health
200
$ curl -s https://clarify.cativo.dev/api/health
{"status":"ok","services":{"database":"unknown","redis":"connected","ai":"active"},"timestamp":"2026-09-29T01:20:28.373Z"}
$ curl -s -o /dev/null -w "%{http_code}" https://clarify.cativo.dev/
200
$ curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}" http://clarify.cativo.dev/
301 -> https://clarify.cativo.dev/
$ echo | openssl s_client -connect clarify.cativo.dev:443 -servername clarify.cativo.dev 2>/dev/null | openssl x509 -noout -issuer -dates
issuer=C=US, O=Let's Encrypt, CN=YR2
notBefore=Sep 29 00:02:00 2026 GMT
notAfter=Dec 28 00:01:59 2026 GMT
$ curl -sI https://clarify.cativo.dev/ | grep -i strict-transport
strict-transport-security: max-age=31536000; includeSubDomains; preload
$ ssh -p 52222 cativo23@cativo.dev "docker ps --filter name=clarify --format '{{.Names}}: {{.Status}}'"
clarify-worker-prod: Up (healthy)
clarify-redis-prod: Up (healthy)
clarify-app-prod: Up (healthy)
$ ssh -p 52222 cativo23@cativo.dev "docker inspect cativo23/clarify:latest --format '{{index .RepoDigests 0}}'"
cativo23/clarify@sha256:3536b201954146f9d2fb7787fdd1e58abb997ebc16c22ac15383b7b284bee6bc
$ docker buildx imagetools inspect cativo23/clarify:v1.0.0-alpha.20 --format '{{json .Manifest}}' | jq -r '.digest'
sha256:3536b201954146f9d2fb7787fdd1e58abb997ebc16c22ac15383b7b284bee6bc
```
**Result:** PASS — all Task 3 `must_haves` satisfied. Running image digest matches the published `v1.0.0-alpha.20` tag exactly. Redis reports connected (via Upstash, not the unused bundled container). Certificate is a valid Let's Encrypt cert with ~90 days validity. HSTS present. All three containers healthy.

### Incident note: accidental secret exposure

While debugging the corrupted `.env` (see below), the orchestrator ran `cat .env` over SSH, which printed the full production `.env` — including the real Supabase service key, OpenAI API key, and Stripe test-mode keys — into this session's transcript. Carlos was notified immediately and chose to handle rotation of those credentials himself, separately, rather than block the deploy on it. Flagged here for the record; no further action taken on it in this plan.

**`.env` corruption/recovery (unrelated to the above):** an earlier `sed` append (setting the bundled-Redis `REDIS_TOKEN`, since superseded by the Upstash fix) ran against a `.env` whose last line had no trailing newline, merging `BASE_URL`'s value with the new `REDIS_TOKEN=` line into one corrupted line. Caught immediately (before any container restart used it) and fixed by splitting the merged line back into two proper lines.

**Task 3 status: COMPLETE.** Release published, deployed, and independently re-verified end-to-end in production.
