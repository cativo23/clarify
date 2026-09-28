# Phase 13: Launch Verification - Research

**Researched:** 2026-09-26
**Domain:** Docker/Traefik production deployment (GitFlow release → GitHub Actions CI/CD → SSH deploy) + live production verification (HTTPS, BullMQ, Supabase Storage, UI rendering)
**Confidence:** HIGH (deployment-gap findings are directly SSH/curl/`gh`-verified against the real target this session; UI/code findings are direct file reads)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 13 includes the deploy step, not just verification. Production currently does NOT have Phase 11 (prompts) or Phase 12 (UI) changes live.
- **D-02:** Deploy follows the existing GitFlow release process already documented in `CLAUDE.md` (release branch, PRs via `gh pr create`, tag, `gh release create --prerelease`) — this triggers the CI/CD pipeline in `DEPLOY.md` (GitHub Actions → Docker Hub → SSH → `docker compose -f docker-compose.prod.yml`). No new deploy mechanism needed.
- **D-03:** Claude gets direct production access this phase: SSH to the VPS (`cativo23@cativo.dev`), curl against `clarify.cativo.dev`, and read container logs (`docker compose -f docker-compose.prod.yml logs`). No local-only restriction.
- **D-04:** Use all three verification approaches together: SSH+curl/docker CLI for backend checks; `browser-qa-agent` for the Forensic tier UI visual check (LAUNCH-04); `api-integration-tester` for the PDF export/cache round-trip (LAUNCH-02/LAUNCH-03).
- **D-05:** If any verification check fails, fix it inline within this phase and re-run the failed check until it passes. Do not defer failures to a new phase.
- **D-06:** Produce a generated HTML evidence page (per `evidence-attachments` convention: real command output, status codes, timestamps — no invented values), rendered to PNG via headless Chrome, as sign-off artifact.

### Claude's Discretion
- Exact SSH command sequence and log-grep patterns for confirming the worker processed a job.
- Whether the release version is `v2.0.0-alpha.1` or a different alpha increment — follow existing tag numbering in `git tag -l`.
- Layout/styling of the generated evidence HTML page.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Out of scope per phase boundary: new features, CI/CD pipeline redesign, subscription billing, multi-region deployment.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LAUNCH-01 | Production deployment at clarify.cativo.dev is live — HTTPS active, health endpoint responds, BullMQ worker running | **Blocked on a prior, undocumented deploy gap** (see Critical Finding below) — deploy must happen first; `server/api/health.get.ts` and `server/plugins/worker.ts` read/verified this session give the exact check commands |
| LAUNCH-02 | PDF export renders correctly in production (Supabase Storage bucket configured and verified) | `server/api/analyses/[id]/export-pdf.get.ts` read this session — exact bucket name, path pattern, and response shape documented below; bucket has **no tracked migration**, must be verified live |
| LAUNCH-03 | PDF caching round-trip verified in production (upload → cache → re-serve) | Same endpoint returns an explicit `cached: boolean` field in its JSON response — the cleanest possible verification signal, no log-scraping or timing heuristics needed |
| LAUNCH-04 | Forensic tier UI sections render correctly (resolves Phase 1 Test 4 UAT gap) | `pages/analyze/[id].vue` read this session — `isForensic` computed + `[Forensic Debug]` console logging already in place at lines 637-658; exact section list documented below |

</phase_requirements>

## Summary

**Critical finding, verified this session, that changes the shape of this phase:** production has never actually been deployed. This is not "stale build," it is **no build at all**. Independently confirmed via SSH to the real VPS and `curl`/`gh` against the real domain/repo (not sourced from any injected claim — every item below was checked directly with a tool call this session):

- `ssh polaris2 "docker ps -a | grep -i clarify"` → no container, running or stopped, named/imaged `clarify` exists anywhere on the box (51 other containers for other projects are running fine on the same host).
- `/home/cativo23/deploy/clarify-deploy` does not exist on the server at all — every sibling project (`nova-id-deploy`, `portfolio-api-deploy`, etc.) has its directory; clarify's has never been created.
- `curl -I https://clarify.cativo.dev/api/health` and `/` both return **HTTP 404**, served by `nginx/1.27.5` (Traefik's default/fallback backend for an unmatched host) — DNS is correctly pointed (`clarify.cativo.dev` → `167.235.52.161`, the same box), but there is no Traefik router live for this host.
- `gh secret list` on `cativo23/clarify` shows only `DOCKER_PASSWORD`, `DOCKER_USERNAME`, `RELEASE_PAT`, `SSH_PRIVATE_KEY`, `SSH_USERNAME` — **`SSH_HOST` and `SSH_PORT` are missing**, both required by `.github/workflows/ci-cd.yml`'s `appleboy/scp-action` and `appleboy/ssh-action` steps. The deploy job will fail (empty host) even if a release is cut today.
- A `cativo23/clarify:latest` image **does exist** on Docker Hub (last pushed 2026-05-06, most recently pulled 2026-09-25) — so a build artifact exists from a past CI run, but it was never `docker compose up`'d anywhere. This is consistent with STATE.md's "infrastructure ready" (the Dockerfile/workflow work), not with an actual running service.
- `docker-compose.prod.yml`'s Traefik labels are still the **literal placeholder** `Host(\`clarify.yourdomain.com\`)` (lines 56/61) — not `clarify.cativo.dev`. Even after a successful deploy, Traefik will not route the real domain to the container until this is fixed.
- `ssh cativo23@cativo.dev` (the exact command documented in `CLAUDE.md` and copied into `13-CONTEXT.md` D-03) **times out on port 22** — the box only accepts SSH on **port 52222** (confirmed via the working `polaris2` alias in `~/.ssh/config`, and by directly testing port 22 against `cativo.dev`, which timed out). Any SSH command in the phase plan needs `-p 52222`, and `SSH_PORT` secret needs to be `52222`, not the default `22`.

None of this contradicts `13-CONTEXT.md`'s D-01 in substance (it correctly says the deploy step is in scope), but D-01's phrasing ("production currently runs the pre-v2.0 build") **overstates** what's actually live — there is no build running at all, pre-v2.0 or otherwise. The planner should treat "first deploy ever" as the true starting state, not "redeploy of an existing service."

**Primary recommendation:** Sequence the phase as (1) fix the two missing GitHub secrets + the Traefik hostname placeholder + first-time server `.env` setup (deploy prerequisites, none of which are new code — config/ops fixes), (2) cut the GitFlow release per `CLAUDE.md`, (3) confirm the CI/CD workflow run turns into a live, routable container, (4) run the four LAUNCH verification checks in order (LAUNCH-01 → 02 → 03 → 04) since each depends on a working deployment, (5) produce the evidence HTML/PNG.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTTPS/TLS termination + hostname routing | CDN/Reverse-proxy (Traefik) | — | Traefik owns Let's Encrypt certs and host-based routing; app container never terminates TLS |
| Health check | API/Backend (Nuxt server route) | Database/Storage (Redis ping) | `server/api/health.get.ts` pings Redis directly; DB/AI status fields exist in the payload but are hardcoded, not actually checked (see Pitfall below) |
| Analysis job processing | API/Backend (BullMQ worker, separate container) | Database/Storage (Supabase) | Worker container (`DISABLE_WORKER=false`) is a distinct process from the HTTP app container — this split already exists in `docker-compose.prod.yml`, this phase only proves it's alive |
| PDF generation + caching | API/Backend (Nuxt server route) | Database/Storage (Supabase Storage `analysis-pdfs` bucket) | Existing endpoint (`export-pdf.get.ts`) owns both generation and the `exists()`-before-regenerate cache check; no client-side caching involved |
| Forensic UI rendering | Browser/Client (Vue SFC) | — | `pages/analyze/[id].vue` conditionally renders `CrossClauseAnalysis`, `CriticalOmissions`, `StructuralMap` client-side based on `analysis.summary_json` already fetched from the API |
| Deploy orchestration | CI/CD (GitHub Actions) | OS/Infra (Docker Compose on VPS) | GitHub Actions builds+pushes the image and SSHes into the VPS to run `docker compose`; no in-repo deploy tooling beyond the two workflow files |

## Package Legitimacy Audit

**Not applicable.** This phase installs no new packages — it is a deploy/config/verification phase using only existing dependencies (`bullmq`, `ioredis`, `@supabase/supabase-js`, already in `package.json` and used in production since Phase 7/v1.0). No `npm install` step is expected in any plan for this phase.

## Deploy Prerequisites (must resolve before LAUNCH-01 can be attempted)

These are blocking gaps discovered this session, not present in any prior phase's research. Each is either a one-line config fix or an ops action — no application code changes required.

| # | Gap | Evidence (verified this session) | Fix |
|---|-----|-----------------------------------|-----|
| P1 | `SSH_HOST` GitHub secret missing | `gh secret list --json name` on `cativo23/clarify` → 5 secrets, no `SSH_HOST` | `gh secret set SSH_HOST --body cativo.dev` (or the raw IP `167.235.52.161` — both resolve to the same box; `cativo.dev` matches the DEPLOY.md example and other repos' convention) — **checkpoint:human-verify**, this sets a real credential/target |
| P2 | `SSH_PORT` GitHub secret missing, **and the documented default (22) is closed** | `ssh -p 22 cativo23@cativo.dev` → `Connection timed out`; working `polaris2` SSH alias in `~/.ssh/config` uses `Port 52222` | `gh secret set SSH_PORT --body 52222` — **checkpoint:human-verify** |
| P3 | `/home/cativo23/deploy/clarify-deploy` does not exist on the server; no `.env` file for clarify exists anywhere on the box | `ssh polaris2 "ls /home/cativo23/deploy/clarify-deploy"` → No such file or directory; `find /home/cativo23 -iname '*clarify*'` → zero hits outside the repo checkout that doesn't exist either | One-time manual step per `DEPLOY.md` "First-Time Server Setup": `mkdir -p`, then create `.env` from `.env.example` with real Supabase/OpenAI/Stripe/Redis values — **checkpoint:human-verify**, this is where production secrets get typed in |
| P4 | `docker-compose.prod.yml` Traefik host rule is still the literal placeholder domain | Read this session, lines 56 & 61: `` "traefik.http.routers.clarify-http.rule=Host(`clarify.yourdomain.com`)" `` and `` "traefik.http.routers.clarify.rule=Host(`clarify.yourdomain.com`)" `` | Code edit: replace `clarify.yourdomain.com` with `clarify.cativo.dev` in both labels, commit as part of the release branch |
| P5 | Supabase Storage bucket `analysis-pdfs` has no tracked migration/IaC — its existence in the **production** Supabase project is unconfirmed | `grep -rl "analysis-pdfs\|createBucket" database/` → only the app-code reference in `export-pdf.get.ts:87`, zero SQL/IaC hits | Verify directly against prod Supabase (dashboard or `supabase storage ls` if CLI configured) as a LAUNCH-02 pre-check; create the bucket manually if absent — **checkpoint:human-verify**, needs prod Supabase dashboard access this agent doesn't have |
| P6 | `CLAUDE.md` / `13-CONTEXT.md` D-03's documented SSH command omits the required port | `ssh cativo23@cativo.dev` (no `-p`) times out; must be `ssh -p 52222 cativo23@cativo.dev` (or the pre-configured `ssh polaris2` alias) | Use `-p 52222` in every SSH command the plan writes; this is a documentation gap in `CLAUDE.md`, not a phase deliverable, but the plan's commands must account for it |

**Why this belongs in research, not just "discovered during execution":** every one of P1-P6 is independently verifiable with a single tool call (`gh secret list`, `ssh ... ls`, `grep`, `ssh -p 22 ...`) and none require guessing — the planner should turn P1-P6 into explicit Wave-0 tasks before any LAUNCH-0X verification task, so the plan doesn't fail partway through a release cut.

## Standard Stack

No new libraries. Existing production stack (all already in `package.json`, verified unchanged this phase):

| Library | Purpose | Where used |
|---------|---------|------------|
| `bullmq` | Queue/worker | `server/plugins/worker.ts`, `server/utils/queue.ts` |
| `ioredis` | Redis client (TLS, Upstash-compatible) | `server/utils/queue.ts:1,17-21` |
| `@supabase/supabase-js` | Storage admin client for PDF cache | `server/api/analyses/[id]/export-pdf.get.ts:12,101` |

## Architecture Patterns

### System Architecture Diagram

```
Release branch merged to main (GitFlow)
        │
        ▼
.github/workflows/auto-release.yml  (on: pull_request closed+merged, branch startsWith 'release/')
  → extracts vX.Y.Z from branch name → creates GitHub Release (prerelease if -alpha/-beta or v0.x)
        │  (release: published)
        ▼
.github/workflows/ci-cd.yml
  ├─ build job: docker build → push cativo23/clarify:{tag,latest,sha} to Docker Hub
  └─ deploy job (needs: build):
        scp docker-compose.prod.yml → SSH_HOST:SSH_PORT:/home/cativo23/deploy/clarify-deploy/
        ssh → docker login, docker compose pull, down, up -d, prune, tail logs
        │
        ▼
Polaris2 VPS (167.235.52.161)
  Traefik (external network space-server_web, already running, handles ALL other projects' TLS)
        │  routes Host(`clarify.cativo.dev`) → clarify-app-prod:3000   [BROKEN until P4 fixed]
        ▼
  app container (DISABLE_WORKER=true) ──HTTP──> Nuxt server routes (/api/health, /api/analyze, /api/analyses/[id]/*)
        │                                              │
        │                                       enqueues job
        ▼                                              ▼
  worker container (DISABLE_WORKER=false) <──BullMQ── redis container (queue backend)
        │
        ├─ downloads contract from Supabase Storage 'contracts' bucket
        ├─ extracts text, calls OpenAI (gpt-6-luna/sol/astra by tier)
        └─ writes result to Supabase `analyses` table (status: completed/failed)
                │
                ▼
  Browser: GET /api/analyses/[id]/status (poll) → renders pages/analyze/[id].vue
                │
                ▼
  GET /api/analyses/[id]/export-pdf
        ├─ adminClient.storage.from('analysis-pdfs').exists(path) → cached:true, signed URL (24h)
        └─ else: generate PDF → upload (upsert, cacheControl 1yr) → cached:false, signed URL
```

### Recommended Verification Sequence
```
Wave 0 (prerequisites, config/ops only):
  P1  gh secret set SSH_HOST
  P2  gh secret set SSH_PORT
  P3  ssh -p 52222 → mkdir deploy dir, create .env with real prod values
  P4  edit docker-compose.prod.yml Traefik labels → clarify.cativo.dev
  P5  verify analysis-pdfs bucket exists in prod Supabase (create if missing)

Wave 1 (deploy):
  Cut GitFlow release (CLAUDE.md process) → wait for ci-cd.yml to complete → confirm container is Up (healthy)

Wave 2 (verify, in dependency order):
  LAUNCH-01: curl HTTPS + /api/health; submit real analysis; poll status; grep worker logs
  LAUNCH-02: api-integration-tester hits export-pdf for a completed analysis; confirm 200 + signed URL + cached:false on first call
  LAUNCH-03: same endpoint called again for the same analysis id; confirm cached:true, no regenerate-error path in logs
  LAUNCH-04: browser-qa-agent navigates to a Forensic-tier analysis; confirms all sections render, captures console (no [Forensic Debug] anomalies)

Wave 3 (sign-off):
  Generate evidence HTML from the real command output collected above → render to PNG (evidence-attachments recipe)
```

### Pattern 1: Health endpoint check
**What:** `GET /api/health` pings Redis and returns 503 if disconnected, 200 otherwise.
**Verified this session** — read `server/api/health.get.ts` in full (32 lines).
```typescript
// Source: server/api/health.get.ts (read in full this session)
const health = {
  status: "ok" as const,
  services: { database: "unknown" as const, redis: "unknown" as const, ai: "active" as const },
  timestamp: new Date().toISOString(),
};
try {
  const redis = getRedisConnection();
  await redis.ping();
  health.services.redis = "connected";
} catch {
  health.services.redis = "disconnected";
  health.status = "degraded";
}
if (health.services.redis === "disconnected") {
  throw createError({ statusCode: 503, statusMessage: "Service Unhealthy", body: health });
}
return health;
```
**Verification command:**
```bash
curl -s -o /dev/null -w "HTTP_STATUS:%{http_code}\n" https://clarify.cativo.dev/api/health
curl -s https://clarify.cativo.dev/api/health | jq .
```
Expect `200` and `{"status":"ok","services":{"database":"unknown","redis":"connected","ai":"active"}, ...}`.

### Pattern 2: Rate-limit exemption for health checks
**Verified this session** — `server/plugins/rate-limit.ts:36-42` explicitly skips `/api/health`, `/_nuxt`, `/favicon` before applying `applyRateLimit`. Repeated health polling during verification will never trip a 429.

### Pattern 3: End-to-end worker verification via real job submission
**What:** Submit a real analysis, then poll and grep logs rather than trusting container "healthy" status alone (the worker healthcheck only checks `node -e "console.log('worker alive')"` — it proves the process is up, **not** that it can reach Redis or process jobs).
```bash
# Source: server/api/analyze.post.ts (response shape read this session)
# POST /api/analyze returns: { success: true, analysisId }
# GET  /api/analyses/[id]/status returns: { success: true, analysis: { status, summary_json, ... } }

# 1. Upload + submit a Basic-tier analysis (cheapest, 1 credit) through the real UI or API
# 2. Poll:
curl -s -H "Authorization: Bearer $TOKEN" https://clarify.cativo.dev/api/analyses/$ID/status | jq '.analysis.status'
# 3. Confirm the worker actually touched it:
ssh -p 52222 cativo23@cativo.dev \
  "docker compose -f /home/cativo23/deploy/clarify-deploy/docker-compose.prod.yml logs worker --since 5m | grep -E '\\[Worker\\] (Started processing|Successfully completed) .*$ID'"
```

### Pattern 4: PDF export cache round-trip via response field, not timing
**What:** The endpoint already tells you whether it hit cache — no need to infer from response latency (the local Playwright test at `tests/e2e/pdf-export.spec.ts:77-116` uses a timing heuristic and even comments "actual caching performance may vary"; production verification should prefer the explicit field).
```typescript
// Source: server/api/analyses/[id]/export-pdf.get.ts (read in full this session)
// First call (no cached file): returns { success: true, url, cached: false, filename }
// Second call (file now exists in storage): returns { success: true, url, cached: true, filename }
```
```bash
# Call 1 — expect cached:false
curl -s -H "Authorization: Bearer $TOKEN" https://clarify.cativo.dev/api/analyses/$ID/export-pdf | jq '{cached, success}'
# Call 2, immediately after — expect cached:true
curl -s -H "Authorization: Bearer $TOKEN" https://clarify.cativo.dev/api/analyses/$ID/export-pdf | jq '{cached, success}'
```

### Anti-Patterns to Avoid
- **Trusting `docker compose ps` "healthy" as proof of end-to-end function:** the worker healthcheck (`node -e "console.log('worker alive')"`, `docker-compose.prod.yml:120-125`) only proves the Node process didn't crash — it does not touch Redis or BullMQ. Always pair it with a real submitted job + log grep (Pattern 3).
- **Assuming `clarify.cativo.dev` health/DNS success implies the app is live:** DNS already resolves correctly today (confirmed: `getent hosts clarify.cativo.dev` → `167.235.52.161`) even though nothing is deployed — DNS correctness is necessary but not sufficient.
- **Re-using the CLAUDE.md-documented `ssh cativo23@cativo.dev` command as-is:** it omits the port and will hang until timeout (confirmed this session). Always add `-p 52222`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF-cache-hit detection | A custom log parser or response-time threshold | The endpoint's own `cached` boolean field | Already implemented, unambiguous, zero false positives from network jitter |
| Production smoke evidence | A bespoke screenshot tool | `evidence-attachments` HTML→PNG recipe (user global rule) + `browser-qa-agent`/`api-integration-tester` for the underlying checks | Matches the project's existing convention and the phase's D-04/D-06 decisions exactly |
| Worker liveness proof | Trusting the Docker healthcheck | A real submitted analysis job + `docker compose logs worker \| grep` | Docker's healthcheck for the worker container is a placeholder (`console.log`), not a functional check |

**Key insight:** every LAUNCH requirement already has a purpose-built, already-implemented signal in the codebase (health JSON, `cached` boolean, `[Forensic Debug]` console logs) — this phase's verification tasks should read those signals directly rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Deploying without fixing the Traefik hostname placeholder first
**What goes wrong:** CI/CD succeeds, container reports healthy, but `https://clarify.cativo.dev` still 404s because Traefik has no router matching that host.
**Why it happens:** `docker-compose.prod.yml` was written generically (`clarify.yourdomain.com`) and never updated for the real domain before this phase.
**How to avoid:** Fix P4 (see Deploy Prerequisites) on the release branch, before merging, so the fix ships with the same deploy.
**Warning signs:** `docker compose ps` shows the app container healthy, but curl to the real domain still 404s while curl to `http://<container>:3000/api/health` from inside the network (or via `docker compose exec app wget ...`) succeeds.

### Pitfall 2: Health endpoint "ok" status is a soft signal for DB/AI
**What goes wrong:** Reading `server/api/health.get.ts` in full shows `database: "unknown"` and `ai: "active"` are **hardcoded literals**, never actually probed — only `redis` is a real check. A 200 from `/api/health` proves Redis connectivity, nothing about Supabase or OpenAI reachability.
**Why it happens:** The endpoint was written as a lightweight liveness probe for Docker's healthcheck, not a full dependency check.
**How to avoid:** Treat LAUNCH-01's "health endpoint returns 200" criterion as satisfied by the literal HTTP 200, but rely on Pattern 3 (real job submission) for the actual "worker processes a job end-to-end" proof — don't conflate the two.
**Warning signs:** None from the endpoint itself — this is a silent gap, worth calling out explicitly in the evidence page so it isn't mistaken for a full-stack health check.

### Pitfall 3: GitHub Actions deploy step silently no-ops on missing secrets
**What goes wrong:** `appleboy/scp-action`/`appleboy/ssh-action` with an empty `host:` input typically fails fast with a connection error — but it fails **inside a GitHub Actions job log**, not in any local terminal, so a plan that only checks `docker ps` on the server afterward will correctly see nothing changed and could misdiagnose it as "deploy didn't trigger" rather than "deploy failed for a known, fixable reason."
**How to avoid:** After cutting the release, check `gh run list --workflow=ci-cd.yml` / `gh run view <id> --log` for the deploy job specifically, not just the server state.

### Pitfall 4: Confusing "image exists on Docker Hub" with "app is deployed"
**What goes wrong:** `cativo23/clarify:latest` already exists (pushed 2026-05-06) — someone could assume this means a deploy happened at some point and just needs a restart. It doesn't; no compose file, `.env`, or container ever existed on the server for this project (confirmed exhaustively this session).
**How to avoid:** Treat Docker Hub image presence and server-side deployment state as two independent facts; verify both.

## Code Examples

### Confirming the Forensic UI sections (LAUNCH-04) — exact conditional structure
```vue
<!-- Source: pages/analyze/[id].vue (read this session, lines ~440-465) -->
<FindingsSection :hallazgos="summary.hallazgos ?? []" :coverage="summary.metricas.porcentaje_clausulas_analizadas" />

<div v-if="isForensic && analysis.summary_json">
  <CrossClauseAnalysis v-if="analysis.summary_json?.analisis_cruzado?.length" :analisis-cruzado="analysis.summary_json.analisis_cruzado" />
  <CriticalOmissions v-if="analysis.summary_json?.omisiones?.length" :omisiones="analysis.summary_json.omisiones" />
  <StructuralMap v-if="analysis.summary_json?.mapa_estructural" :mapa="analysis.summary_json.mapa_estructural" />
</div>
```
```typescript
// Source: pages/analyze/[id].vue:637 (read this session)
const isForensic = computed(() => analysis.value?.analysis_type === "forensic");
// lines 643-658: console.log("[Forensic Debug] analysis_type:", ...), isForensic, analisis_cruzado, omisiones, mapa_estructural
```
**Implication for LAUNCH-04:** the three Forensic-only sections (`CrossClauseAnalysis`, `CriticalOmissions`, `StructuralMap`) each independently guard on their own data being present/non-empty — a Forensic analysis whose `summary_json` is missing one of these three keys will silently render fewer sections with no error. The `browser-qa-agent` visual check should confirm the specific Forensic-tier analysis used for verification has all three populated (check via `/api/analyses/[id]/status` response first, or read the `[Forensic Debug]` console logs the page already emits), not just "the page loaded without a crash."

### GitFlow release commands (from CLAUDE.md, applicable version)
```bash
# package.json version and latest tag both currently read "1.0.0-alpha.18" / "v1.0.0-alpha.18"
# — no v1.1.0 or v2.0.0 tag was ever cut despite the "v1.1"/"v2.0" milestone *names* in ROADMAP.md.
# Two valid options for this release; planner/user must pick (Claude's Discretion per CONTEXT.md):
#   (a) v2.0.0-alpha.1  — matches the milestone name, breaks the existing alpha-counter convention
#   (b) v1.0.0-alpha.19 — continues the literal tag sequence in `git tag -l`, ignores milestone naming
# Recommendation: (a), since CHANGELOG.md and package.json should start reflecting the v2.0 milestone
# now that it's shipping — but this is a judgment call, flag it to the user rather than assume silently.

git checkout -b release/v2.0.0-alpha.1
git push -u origin release/v2.0.0-alpha.1
gh pr create --base develop --head release/v2.0.0-alpha.1 --title "release: v2.0.0-alpha.1" --body "..."
gh pr create --base main --head release/v2.0.0-alpha.1 --title "release: v2.0.0-alpha.1" --body "..."
# merging the main PR triggers auto-release.yml -> creates GitHub Release -> triggers ci-cd.yml
```
**Note (verified this session, `.github/workflows/auto-release.yml:29-53`):** the branch name is parsed with `RAW="${BRANCH#release/}"` then validated against `^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?...` — `v2.0.0-alpha.1` and `v1.0.0-alpha.19` both pass this regex; either is mechanically valid. **Note also:** `CHANGELOG.md`'s current top entry is `## [1.0.0-alpha.18]` with no `[Unreleased]`/v2.0 section yet — `auto-release.yml:75-89` parses release notes by exact version-number match from `CHANGELOG.md` and falls back to a generic `"Release $TAG"` message with a workflow warning if no matching section exists. A `CHANGELOG.md` entry for the chosen version should be added on the release branch before merging, or the GitHub Release notes will be a placeholder.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `docker compose up -d --build` on the server (documented as "Manual Deployment (Alternative)" in `DEPLOY.md`) | Automated GitHub Actions release → build → SSH deploy | Phase 7/v1.1, per `DEPLOY.md` and `.github/workflows/*.yml` | This phase should use the automated path only (per D-02); manual deploy is a documented fallback, not the intended flow |

**Deprecated/outdated:** None specific to this phase — the pipeline itself is current, it has simply never been exercised end-to-end for this project.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `SSH_HOST` should be set to `cativo.dev` (hostname) rather than the raw IP `167.235.52.161` | Deploy Prerequisites P1 | Low — both resolve to the same box (confirmed via `getent hosts`); either works for `appleboy/ssh-action`. Flagged for user confirmation since it's a one-time secret-set action. |
| A2 | The `analysis-pdfs` Supabase Storage bucket needs to be created manually if absent, via the Supabase dashboard | Deploy Prerequisites P5 | Medium — if the bucket already exists in the prod Supabase project (created out-of-band, e.g. by whoever set up Phase 3 in production originally), this step is a no-op; if it doesn't exist, PDF export will fail with an upload error until created. This agent has no credential to check the prod Supabase project directly this session — the planner must add a verification/creation step, not assume either way. |
| A3 | Recommending `v2.0.0-alpha.1` over continuing the `v1.0.0-alpha.N` sequence | Code Examples — GitFlow release commands | Low — cosmetic/versioning choice only, does not affect deploy mechanics; both pass the auto-release.yml regex. |

## Open Questions

1. **Does the production Supabase project already have the `analysis-pdfs` bucket, RLS policies, and the `contracts` bucket the worker downloads from?**
   - What we know: the app code references both bucket names (`contracts` in `worker.ts:67`, `analysis-pdfs` in `export-pdf.get.ts:87`); neither has a tracked SQL migration or IaC definition in this repo.
   - What's unclear: whether these were created manually in the actual prod Supabase project at some point (e.g., during a previous, undocumented setup attempt) or need to be created fresh as part of this phase.
   - Recommendation: first LAUNCH-02 task should be a direct check against the prod Supabase Storage API/dashboard (needs `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` for the real prod project, which this research session did not have access to) before attempting any PDF export call.

2. **Should `SSH_HOST`/`SSH_PORT` secrets be set by this phase's execution, or is that an out-of-band action the user performs?**
   - What we know: D-03 grants direct production access (SSH, curl, docker logs) for verification; it does not explicitly grant permission to modify GitHub Actions secrets.
   - What's unclear: whether "fixing the deploy pipeline" (P1/P2) falls under D-01's "Phase 13 includes the deploy step" or needs a separate human action.
   - Recommendation: plan these as `checkpoint:human-verify` tasks — surface the exact `gh secret set` commands and values, let the user run or approve them, per the project's `always_confirm_external_services` safety config (`.planning/config.json`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| SSH access to production VPS | All LAUNCH checks | ✓ (via `polaris2` alias; `-p 52222` required) | OpenSSH (server-side unconfirmed, client fine) | — |
| `gh` CLI, authenticated | GitFlow release process, secret management | ✓ | confirmed working this session (`gh secret list`, `gh repo view`, `gh api` all succeeded) | — |
| Docker Hub image `cativo23/clarify` | CI/CD build/pull step | ✓ (stale, last pushed 2026-05-06) | tag `latest` + `sha-*` | New push will happen automatically on release |
| GitHub Actions secrets `SSH_HOST`, `SSH_PORT` | CI/CD deploy job | ✗ | — | **No fallback — deploy job fails without these.** Must be set (P1/P2). |
| Server directory `/home/cativo23/deploy/clarify-deploy` + `.env` | `docker compose up -d` on the server | ✗ | — | **No fallback — first-time manual setup required (P3).** |
| `space-server_web` external Docker network | Traefik routing | ✓ | already exists, used by all other projects on the box | — |
| Disk space on VPS | Image pull/build | ✓ | 24G available / 75G (68% used) | — |
| GitHub environment `prod` protection rules | CI/CD `environment: prod` gate | ✓ (no protection rules configured — `can_admins_bypass: true`, empty `protection_rules`) | — | Workflow will not pause for manual approval |

**Missing dependencies with no fallback:**
- `SSH_HOST`/`SSH_PORT` secrets (P1/P2)
- Server-side `.env` + deploy directory (P3)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (`unit`/`integration` projects) + Playwright (`test:e2e`) — both configured against **local** (`http://localhost:3001`), not production |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command (local, not applicable to prod verification) | `npm run test:unit` |
| Full suite command (local) | `npm run test:run && npm run test:e2e` |

**This phase's verification is not expressible as a local Vitest/Playwright run** — LAUNCH-01 through LAUNCH-04 are inherently checks against the live production deployment. The existing `tests/e2e/pdf-export.spec.ts` (read in full this session) already exercises PDF-export + caching against `localhost:3001` with a `TEST_USER_EMAIL`-gated skip — useful as a **reference pattern**, not as the production check itself (its `baseURL` is hardcoded in `playwright.config.ts`, not env-overridable without a config change this phase should not make, per the "no CI/CD pipeline redesign" scope boundary).

### Phase Requirements → Verification Command Map
| Req ID | Behavior | Verification Type | Command | Exists Today? |
|--------|----------|-------------------|---------|----------------|
| LAUNCH-01 | HTTPS + health 200 | curl smoke check | `curl -s -o /dev/null -w '%{http_code}' https://clarify.cativo.dev/api/health` | ✅ endpoint exists; ❌ currently 404 until deployed |
| LAUNCH-01 | Worker processes a job | real submission + log grep | Submit via UI/API → poll `/api/analyses/[id]/status` → `ssh -p 52222 ... docker compose logs worker \| grep '\[Worker\] Successfully completed'` | ✅ all pieces exist in code; needs live deploy first |
| LAUNCH-02 | PDF renders, bucket accessible | `api-integration-tester` agent hitting `export-pdf` | `GET /api/analyses/[id]/export-pdf` → expect `200`, `cached:false`, valid signed `url` | ✅ endpoint exists; bucket existence in prod **unconfirmed** (Open Question 1) |
| LAUNCH-03 | Cache round-trip | same endpoint, called twice | Second call → expect `cached:true` | ✅ field already exists in response |
| LAUNCH-04 | Forensic UI sections render | `browser-qa-agent` visual check | Navigate to a Forensic analysis, screenshot, confirm `CrossClauseAnalysis`/`CriticalOmissions`/`StructuralMap`/`RiskScorePanel`/`FindingsSection` all visible, check console for `[Forensic Debug]` output confirming non-empty data | ✅ debug logging already in place to aid this exact check |

### Sampling Rate
- **Per check:** run each LAUNCH-0X command once it passes prerequisites; re-run after any inline fix (per D-05).
- **Phase gate:** all four LAUNCH checks green + evidence HTML/PNG generated, before considering Phase 13 (and v2.0) complete.

### Wave 0 Gaps
- [ ] No automated production smoke-test script exists in the repo (e.g., a `scripts/smoke-test-prod.sh`) — not required by CONTEXT.md, but the planner may choose to write one as a lightweight, reusable artifact from this phase's ad-hoc curl commands. Optional, not blocking.
- [ ] Deploy prerequisites P1-P5 (see Deploy Prerequisites section) — these are the actual Wave 0 for this phase, ahead of any test/verification concern.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Not touched this phase — existing Supabase Auth unchanged |
| V3 Session Management | No | Unchanged |
| V4 Access Control | No | Unchanged — `export-pdf.get.ts` already scopes by `user_id` (verified reading the file: `.eq("user_id", user.id)`) |
| V5 Input Validation | No | No new input-handling code this phase |
| V6 Cryptography | Yes | HTTPS/TLS via Traefik + Let's Encrypt (`docker-compose.prod.yml` labels `tls.certresolver=letsencrypt`) — existing, this phase only verifies it's active for the real hostname once P4 is fixed |
| V14 Configuration | Yes | Production secrets (`SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, etc.) must land only in the server-side `.env` (P3), never in the evidence HTML page, git history, or GitHub Actions logs |

### Known Threat Patterns for this phase's stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Secret leakage via CI logs (`echo "$DOCKER_PASSWORD" \| docker login --password-stdin` in `ci-cd.yml:88`) | Information Disclosure | Already piped via stdin (not `--password`), and `debug: true` is only set on the `scp-action` step (file copy), not the `ssh-action` step that handles the login — confirmed by reading `ci-cd.yml` in full this session. No change needed, but the evidence HTML (D-06) must never paste raw workflow logs containing this line without redaction. |
| Evidence page accidentally including a real secret value (e.g., a signed PDF URL containing a token, or a `SUPABASE_SERVICE_KEY` pasted from a debug session) | Information Disclosure | Per user's `evidence-attachments` rule: only real, non-secret data (status codes, timestamps, IDs, log lines with secrets stripped) belongs in the generated HTML. Signed PDF URLs are time-limited (24h) but should still be redacted/truncated in the evidence page rather than posted in full. |
| Missing `SSH_HOST`/`SSH_PORT` secrets causing a future, different actor to mis-set them to the wrong host | Tampering (low likelihood, but worth a paranoid check) | Confirm both DNS (`clarify.cativo.dev`) and the SSH target resolve to the same, expected IP (`167.235.52.161`) before setting secrets — already cross-checked this session. |

## Sources

### Primary (HIGH confidence — direct tool verification this session)
- `ssh polaris2` (SSH to production VPS) — `docker ps -a`, `df -h`, `docker network ls`, directory listings
- `gh secret list`, `gh api repos/cativo23/clarify/environments`, `gh repo view` — GitHub Actions/repo state
- `curl` against `https://clarify.cativo.dev/` and `/api/health` — live HTTP behavior
- Docker Hub public API (`hub.docker.com/v2/repositories/cativo23/clarify/tags`) — image push/pull history
- Direct file reads: `server/api/health.get.ts`, `server/api/analyses/[id]/export-pdf.get.ts`, `server/api/analyses/[id]/status.get.ts`, `server/api/analyze.post.ts`, `server/plugins/worker.ts`, `server/plugins/rate-limit.ts`, `pages/analyze/[id].vue`, `docker-compose.prod.yml`, `.github/workflows/ci-cd.yml`, `.github/workflows/auto-release.yml`, `.env.example`, `CHANGELOG.md`, `package.json`, `~/.ssh/config`

### Secondary (MEDIUM confidence)
- `DEPLOY.md`, `.planning/phases/07-production-deployment/07-CONTEXT.md`, `.planning/phases/13-launch-verification/13-CONTEXT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/MILESTONES.md` — project-authored planning docs, trusted but describing intended/past state rather than directly-observed current state

### Tertiary (LOW confidence)
None used — every claim in this document is either a direct file read or a direct tool-verified observation this session.

## Metadata

**Confidence breakdown:**
- Deploy-gap findings (Critical Finding, Deploy Prerequisites P1-P6): HIGH — every item independently confirmed via `ssh`/`curl`/`gh` this session, several cross-checked two ways (e.g., port 22 vs. working alias; DNS resolution matching known IP)
- Standard stack / architecture: HIGH — no new libraries, existing code read in full
- LAUNCH-02/03 bucket existence in prod: LOW/open — this agent has no credential to the real prod Supabase project; flagged as Open Question 1, not asserted either way
- Pitfalls: HIGH — each sourced from a specific line range read this session

**Research date:** 2026-09-26
**Valid until:** Short shelf life — once the deploy prerequisites (P1-P5) are resolved and a release is cut, the "production is not deployed" finding becomes stale within hours. Re-verify container/HTTP state immediately before executing any LAUNCH-0X check rather than trusting this document's snapshot.
