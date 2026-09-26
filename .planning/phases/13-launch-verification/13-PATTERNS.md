# Phase 13: Launch Verification - Pattern Map

**Mapped:** 2026-09-26
**Files analyzed:** 6 (config edits + optional new artifacts)
**Analogs found:** 5 / 6

This phase is predominantly **ops/config/verification**, not new application code. There is no
"controller/service/model" surface being added — the artifacts are: one config edit
(Traefik hostname), one docs edit (CHANGELOG entry), an optional smoke-test script, and a
generated (non-source) evidence HTML/PNG page. Verification itself is done via SSH/curl/agent
calls, not new source files, so most "patterns" here are about **what existing code already
implements** (to read/verify against), not what to copy structurally.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `docker-compose.prod.yml` (edit lines 56/61, P4) | config | request-response (routing) | itself (existing file, minimal edit) | exact — literal find/replace, no new pattern needed |
| `CHANGELOG.md` (new version section) | config/docs | batch (append) | `CHANGELOG.md` `## [1.0.0-alpha.18]` entry (lines 5-19) | exact — copy heading/section structure |
| `scripts/smoke-test-prod.sh` or `.ts` (optional, per Wave-0-Gaps) | utility | request-response (HTTP checks) | `scripts/test-redis.ts` (full file, 114 lines) | role-match — same "standalone diagnostic script with clear pass/fail console output" shape |
| Evidence HTML page (generated artifact, not source) | utility (report generator) | transform (real data → static HTML → PNG) | `~/.claude/rules/evidence-attachments.md` recipe (no in-repo analog; global convention) | no in-repo analog — follow the global rule verbatim |
| `.github/workflows/ci-cd.yml` / `auto-release.yml` | config (CI/CD) | event-driven | itself — **read-only this phase**, no edits planned (out of scope: "CI/CD pipeline redesign") | n/a — do not modify |
| GitHub secrets `SSH_HOST`, `SSH_PORT` (P1/P2) | config (ops, not a file) | n/a | `gh secret list` / `gh secret set` — ops action, no code file | n/a |

No controller/service/model/component files are created or modified in this phase — all four
LAUNCH requirements verify **existing, already-implemented** endpoints and UI sections.

## Pattern Assignments

### `docker-compose.prod.yml` (config, request-response)

**Analog:** itself — this is a targeted 2-line string replacement, not a structural pattern to
borrow from elsewhere.

**Exact lines to change** (already confirmed by direct read this session):
```yaml
# Line 56 — currently:
- "traefik.http.routers.clarify-http.rule=Host(`clarify.yourdomain.com`)"
# Line 61 — currently:
- "traefik.http.routers.clarify.rule=Host(`clarify.yourdomain.com`)"
# Change both instances of `clarify.yourdomain.com` -> `clarify.cativo.dev`
```
Also note line 38 has the same placeholder in a default value (`BASE_URL=${BASE_URL:-https://clarify.yourdomain.com}`) — low priority since `.env` on the server should set `BASE_URL` explicitly (P3), but flag for consistency if editing this file anyway.

No other labels need changes — network name (`space-server_web`), TLS resolver (`letsencrypt`), and service port (`3000`) are already correct.

---

### `CHANGELOG.md` (docs, batch/append)

**Analog:** existing `## [1.0.0-alpha.18] - 2026-05-06` entry (lines 5-19)

**Structure to copy:**
```markdown
## [1.0.0-alpha.18] - 2026-05-06

### Security
- **#33** ...

### Performance
- **#34** ...

### Tests / Tooling
- **#37** ...

---
```
New entry should follow the same `## [vX.Y.Z] - YYYY-MM-DD` heading + `### Category` subsections
(`Security`, `Performance`, `Tests / Tooling`, or add `### Features` / `### Deploy` as needed for
v2.0's actual content — Phase 11 prompt upgrades + Phase 12 UI changes + this phase's deploy fix).
This entry must exist **before** merging the release PR, per research's Code Examples note:
`auto-release.yml:75-89` does exact version-string matching against `CHANGELOG.md` and falls back
to a placeholder release-notes message with a workflow warning if no matching section is found.

---

### `scripts/smoke-test-prod.sh` (optional, utility, request-response)

**Analog:** `scripts/test-redis.ts` (full file read this session, 114 lines)

**Pattern to copy** (diagnostic script shape — not TypeScript-specific, adapt to bash/curl):
- Emoji-prefixed section headers for readability (`🔍`, `📍`, `✅`, `❌`) — matches project's existing script style
- Structured phases: print connection/target details → run checks sequentially → print pass/fail per step → summary block at the end
- Explicit `try/catch`-equivalent per check with a `Troubleshooting:` hint block on failure (lines 97-105) rather than a bare stack trace
- `process.exit(1)` (or bash `exit 1`) on failure so it's CI/script-composable

If written, this script would wrap the exact commands already given in RESEARCH.md Pattern 1-4
(health curl, job-submit + log grep, PDF export cache round-trip) — **this is optional per
Wave 0 Gaps in RESEARCH.md, not required by CONTEXT.md**, so only build it if the planner decides
a reusable artifact is worth the time over ad-hoc commands.

---

### Evidence HTML/PNG page (generated artifact)

**No in-repo analog exists** — this is the first HTML evidence page generated for this project.
Follow `~/.claude/rules/evidence-attachments.md` verbatim:
1. Write HTML with real data only (curl status codes, timestamps, log lines, PDF `cached` boolean values, screenshot references) — never invented values.
2. Serve via `python3 -m http.server` on localhost (not `file://`).
3. Render via `google-chrome-stable --headless --disable-gpu --hide-scrollbars --no-sandbox --screenshot=evidencia.png --window-size=<real-content-height>`.
4. Redact/truncate any signed PDF URLs before including them (per RESEARCH.md Security Domain — signed URLs are time-limited but still shouldn't be pasted in full).
5. One page, readable at 100%, tables for what/result/build-identity per the rule's recipe.

---

## Shared Patterns

### Existing verification signals (read, do not reimplement)

**Health endpoint** — `server/api/health.get.ts` (full file, 32 lines, already excerpted in RESEARCH.md Pattern 1). Returns `{status, services: {database, redis, ai}, timestamp}`, 503 if Redis unreachable. **Pitfall:** `database`/`ai` fields are hardcoded literals, not real checks — only `redis` is live-verified.

**PDF export + cache** — `server/api/analyses/[id]/export-pdf.get.ts` (excerpted in RESEARCH.md Pattern 4, line 87 references `analysis-pdfs` bucket). Response shape: `{success, url, cached: boolean, filename}`. Use the explicit `cached` field for LAUNCH-02/03 — do not infer from timing.

**Worker liveness** — `server/plugins/worker.ts` + `docker-compose.prod.yml:120-125` healthcheck is a placeholder (`node -e "console.log('worker alive')"`) — does not prove Redis/BullMQ connectivity. Real verification requires submitting a job and grepping worker container logs for `[Worker] Successfully completed <id>` (exact grep pattern in RESEARCH.md Pattern 3).

**Forensic UI sections** — `pages/analyze/[id].vue` lines ~440-465 (excerpted in RESEARCH.md Code Examples) — `isForensic` computed (line 637) gates `CrossClauseAnalysis`/`CriticalOmissions`/`StructuralMap`, each independently guarding on non-empty data. `[Forensic Debug]` console logging (lines 643-658) already emits the exact fields `browser-qa-agent` should check via devtools console capture.

### Rate-limit exemption (informational, no action needed)
`server/plugins/rate-limit.ts:36-42` already exempts `/api/health`, `/_nuxt`, `/favicon` — repeated health polling during verification will not trip a 429. No pattern to copy; just noting so the planner doesn't add unnecessary rate-limit handling to verification commands.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Evidence HTML/PNG page | utility (report) | transform | First such artifact in this project; global `evidence-attachments.md` rule is the only source of truth, not codebase precedent |
| `gh secret set SSH_HOST` / `SSH_PORT` (P1/P2) | config (ops action) | n/a | Not a file at all — a GitHub CLI action; no code pattern applies, only the exact commands in RESEARCH.md Deploy Prerequisites |

## Metadata

**Analog search scope:** `server/api/`, `server/plugins/`, `pages/analyze/`, `scripts/`, root config files (`docker-compose.prod.yml`, `CHANGELOG.md`, `.github/workflows/`)
**Files scanned:** `docker-compose.prod.yml` (full read), `CHANGELOG.md` (head), `scripts/test-redis.ts` (full read), plus files already read in RESEARCH.md this session (`server/api/health.get.ts`, `server/api/analyses/[id]/export-pdf.get.ts`, `pages/analyze/[id].vue`, `server/plugins/worker.ts`, `server/plugins/rate-limit.ts`) — reused rather than re-read per no-re-read rule
**Pattern extraction date:** 2026-09-26
