# Phase 13: Launch Verification - Context

**Gathered:** 2026-09-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the v2.0 work (Phase 11 prompt upgrades + Phase 12 results UI) to `clarify.cativo.dev` and confirm it actually works in production. This phase covers **both the deploy and the verification** — as of this discussion, Phase 11/12 code has NOT been deployed yet, so production currently runs the pre-v2.0 build.

In scope:
1. Cut the GitFlow release per `CLAUDE.md`'s Release Process (release branch → PRs to develop/main → tag → GitHub release), which triggers the existing CI/CD pipeline (GitHub Actions → Docker Hub → SSH deploy) documented in `DEPLOY.md`.
2. Verify LAUNCH-01: HTTPS + health endpoint (200) + BullMQ worker processes a job end-to-end, on the deployed build.
3. Verify LAUNCH-02: PDF export renders without error in prod, retrievable from the `analysis-pdfs` Supabase Storage bucket.
4. Verify LAUNCH-03: second request for the same analysis PDF is served from cache (no regeneration) — verified via logs/response time.
5. Verify LAUNCH-04: a Forensic-tier result page renders all UI sections (executive summary, risk breakdown, clause findings) without layout errors — closes the Phase 1 Test 4 UAT gap.
6. Fix inline anything that fails verification, then re-verify.
7. Produce a rendered evidence page as the sign-off artifact for this phase / v2.0 close-out.

Out of scope: new features, CI/CD pipeline redesign, subscription billing, multi-region deployment (all per Phase 7 boundaries, still valid).

</domain>

<decisions>
## Implementation Decisions

### Deploy scope
- **D-01:** Phase 13 includes the deploy step, not just verification. Production currently does NOT have Phase 11 (prompts) or Phase 12 (UI) changes live.
- **D-02:** Deploy follows the existing GitFlow release process already documented in `CLAUDE.md` (release branch, PRs via `gh pr create`, tag, `gh release create --prerelease`) — this triggers the CI/CD pipeline in `DEPLOY.md` (GitHub Actions → Docker Hub → SSH → `docker compose -f docker-compose.prod.yml`). No new deploy mechanism needed.

### Production access
- **D-03:** Claude gets direct production access this phase: SSH to the VPS (`cativo23@cativo.dev`), curl against `clarify.cativo.dev`, and read container logs (`docker compose -f docker-compose.prod.yml logs`). No local-only restriction.

### Verification method
- **D-04:** Use all three approaches together, not one exclusively:
  - SSH + curl/docker CLI for backend checks (health endpoint, worker log tailing, PDF export API calls) — direct command output doubles as evidence.
  - `browser-qa-agent` for the Forensic tier UI visual check (LAUNCH-04) — curl alone can't confirm layout renders correctly.
  - `api-integration-tester` for the PDF export/cache round-trip (LAUNCH-02/LAUNCH-03) instead of hand-rolled curl loops, per the CLAUDE.md agent-routing default.

### Gap handling policy
- **D-05:** If any verification check fails (e.g., storage bucket misconfigured, worker not picking up jobs, Forensic UI broken in prod), fix it inline within this phase and re-run the failed check until it passes. Do not defer failures to a new phase — this is the launch-blocking phase.

### Evidence / sign-off artifact
- **D-06:** Produce a generated HTML evidence page per the user's `evidence-attachments` convention (real command output, status codes, timestamps — no invented values), rendered to PNG via headless Chrome, suitable to attach to the v2.0 milestone close-out. Not just a plain `VERIFICATION.md` checklist (though the checklist content still needs to exist as the source of truth — the HTML page presents it).

### Claude's Discretion
- Exact SSH command sequence and log-grep patterns for confirming the worker processed a job.
- Whether the release version is `v2.0.0-alpha.1` or a different alpha increment — follow existing tag numbering in `git tag -l`.
- Layout/styling of the generated evidence HTML page (per the evidence-attachments recipe: title + date + path tested, tables of what/result/build identity).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §LAUNCH-01–04 — full requirement text and UAT-gap traceability table.
- `.planning/ROADMAP.md` — Phase 13 section, success criteria.
- `.planning/STATE.md` — UAT gap traceability rows (Phase 07 prod env tests → LAUNCH-01; PDF render/caching → LAUNCH-02/03; Phase 01 Test 4 → LAUNCH-04).
- `.planning/MILESTONES.md` — line noting "Phase 01 Test 4 (Forensic UI sections) — deferred to v2.0."

### Deploy process
- `CLAUDE.md` §"GitFlow Release Process" — exact commands for release branch, PRs, tag, GitHub release.
- `DEPLOY.md` — CI/CD architecture, GitHub Actions secrets (`SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `SSH_PORT`), deploy triggers, and the `docker compose -f docker-compose.prod.yml logs` monitoring commands.
- `docker-compose.prod.yml` — production service definitions (app/worker/redis resource limits, Traefik labels) from Phase 7.

### Prior phase context (data this phase verifies)
- `.planning/phases/11-prompt-engineering/11-CONTEXT.md` — structured fields (`confianza`, `categoria_riesgo`, `puntaje_riesgo`, `desglose_riesgo`) that must be present in prod analysis output once deployed.
- `.planning/phases/12-analysis-results-ui-confidence-signals/12-CONTEXT.md` — UI sections (risk panel, certainty badges, sidebar index) that LAUNCH-04's Forensic check must confirm render correctly.
- `.planning/phases/07-production-deployment/07-CONTEXT.md` — original deploy decisions (health endpoint path, DISABLE_WORKER flag, resource allocation) still authoritative for LAUNCH-01.

### Evidence convention
- `~/.claude/rules/evidence-attachments.md` (user global rule) — HTML→PNG evidence recipe: real data only, served via `python3 -m http.server`, rendered via `google-chrome-stable --headless`, uploaded via `file_upload` tool (never the native dialog).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/api/health.get.ts` — existing health endpoint (referenced by `server/plugins/rate-limit.ts:37` as exempt from rate limiting).
- `server/api/analyses/[id]/export-pdf.get.ts` — PDF export + Supabase Storage caching already implemented (`analysis-pdfs` bucket, `exists()` check before regenerate, 24h signed URL, `cacheControl: "31536000"`). LAUNCH-02/03 verify this existing code works in prod, not new code.
- `pages/analyze/[id].vue` (~line 446 onward) — Forensic-specific sections (`isForensic` computed, `analisis_cruzado`, `omisiones`, `mapa_estructural`) already exist with debug console logging in place (`[Forensic Debug]` prefix) — useful for browser-qa-agent console-log verification.
- `server/plugins/worker.ts` — BullMQ worker with `DISABLE_WORKER` flag (Phase 7 D-05).

### Established Patterns
- Deploy is fully automated via GitHub Actions once a release/tag is created — no manual `docker compose up` on the server needed for this phase.
- SSH access pattern for verification: `ssh cativo23@cativo.dev` then `docker compose -f /home/cativo23/deploy/clarify-deploy/docker-compose.prod.yml logs`.

### Integration Points
- Verification must run AFTER the release/deploy step completes (CI/CD workflow finishes) — plan should sequence deploy-then-verify, not parallel.

</code_context>

<specifics>
## Specific Ideas

No specific UI/behavior requirements beyond the four LAUNCH criteria — this phase is entirely about confirming existing, already-planned work operates correctly once shipped.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
None — `todo.match-phase` returned zero matches for Phase 13.

</deferred>

---

*Phase: 13-launch-verification*
*Context gathered: 2026-09-26*
