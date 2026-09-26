# Roadmap: Clarify

**Current Version:** v2.0 (Analysis Experience — in progress)
**Previous Versions:** v1.0 (shipped 2026-03-15), v1.1 (shipped 2026-03-25, closed 2026-05-07)
**Target:** Q3 2026

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-03-15)
- ✅ **v1.1 Admin & Deploy** — Phases 6, 7, 10 (shipped 2026-03-25, audit gaps closed 2026-05-07)
- 🔄 **v2.0 Analysis Experience** — Phases 11-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-03-15</summary>

- [x] Phase 1: Core Analysis Foundation (4/4 plans) — completed 2026-02-17
- [x] Phase 2: Tier Selection UX (6/6 plans) — completed 2026-02-20
- [x] Phase 3: PDF Export & History (3/3 plans) — completed 2026-02-25
- [x] Phase 4: Stripe Monetization (5/5 plans) — completed 2026-03-01
- [x] Phase 5: Free Credits & Onboarding (4/4 plans) — completed 2026-03-15

</details>

<details>
<summary>✅ v1.1 Admin & Deploy (Phases 6, 7, 10) — fully closed 2026-05-07</summary>

- [x] Phase 6: Admin Analytics (3/3 plans) — completed 2026-03-16
- [x] Phase 7: Production Deployment (1/1 plans) — completed 2026-03-25
- [x] Phase 10: v1.1 Audit Gap Closure (4/4 plans) — completed 2026-05-07

</details>

### 🔄 v2.0 Analysis Experience (Phases 11-13)

- [x] **Phase 11: Prompt Engineering** — Upgrade all tier prompts to emit structured clause-level output
- [ ] **Phase 12: Analysis Results UI & Confidence Signals** — Navigable clause cards, risk score, certainty badges, coverage indicator
- [ ] **Phase 13: Launch Verification** — Confirm production is live and all deferred UAT gaps are closed

## Phase Details

### Phase 11: Prompt Engineering

**Goal**: All three analysis tier prompts emit structured, clause-level data that the UI can consume directly
**Depends on**: Nothing (prompt changes are backend-only, no UI dependencies)
**Requirements**: PROMPT-02, PROMPT-03
**Success Criteria** (what must be TRUE):

  1. A Basic, Premium, and Forensic analysis each return clause-level findings with: the original quoted clause text, a certainty rating (High/Medium/Low), and a risk category tag
  2. A Forensic analysis response includes a numeric coverage estimate (percentage of contract clauses analyzed)
  3. Existing analysis history is not broken — older results without the new fields degrade gracefully in the UI
  4. All three tier prompts produce parseable structured output (no free-form text blobs where structured fields are expected)

**Plans**: 2 plans
Plans:

- [x] 11-01-PLAN.md — Types + Basic/Premium prompt upgrades (confianza, categoria_riesgo, puntaje_riesgo, desglose_riesgo)
- [x] 11-02-PLAN.md — Forensic prompt upgrade (same shared fields + clausulas_analizadas/clausulas_total coverage)

### Phase 12: Analysis Results UI & Confidence Signals

**Goal**: Users can navigate analysis results with clarity — understanding what was flagged, why, how confident the AI is, and how much of their contract was covered
**Depends on**: Phase 11
**Requirements**: RESULT-01, RESULT-02, RESULT-03, CONF-01, CONF-02, CONF-03
**Success Criteria** (what must be TRUE):

  1. User sees a sidebar index listing all clause sections; clicking a section name scrolls the report to that section
  2. User can collapse a clause finding card to hide its detail and expand it again — only the summary line is visible when collapsed
  3. User sees the exact AI-quoted source clause text displayed alongside the explanation for each finding
  4. User sees an overall risk score (0–10) with a breakdown by risk category (e.g., Liability, Payment, Termination) at the top of the report
  5. Each clause finding card displays a certainty badge (High / Medium / Low) and a coverage percentage appears somewhere visible on the report

**Plans**: 2/3 plans executed
Plans:

- [x] 12-01-PLAN.md — Tracer: certainty pill end-to-end, always-visible quoted clause, collapse toggle, FindingsSection with anchors + empty state (CONF-02, RESULT-02, RESULT-03)
- [x] 12-02-PLAN.md — Secciones index grouped by categoria_riesgo with click-to-scroll, keyboard + reduced-motion support (RESULT-01)
- [ ] 12-03-PLAN.md — Combined risk panel: 0-10 score + label, severity pills, category breakdown bars, coverage (CONF-01, CONF-03)

**UI hint**: yes

### Phase 13: Launch Verification

**Goal**: Production at clarify.cativo.dev is fully operational and all deferred UAT items from v1.1 are resolved
**Depends on**: Phase 12
**Requirements**: LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04
**Success Criteria** (what must be TRUE):

  1. clarify.cativo.dev responds over HTTPS, the health endpoint returns 200, and the BullMQ worker processes a submitted analysis end-to-end in production
  2. A PDF export triggered in production renders without error and is retrievable from Supabase Storage (bucket configured and accessible)
  3. A second request for the same analysis PDF is served from cache — no re-generation occurs (verified via logs or response time)
  4. A Forensic-tier analysis result page displays all UI sections (executive summary, risk breakdown, clause findings) without layout errors or missing sections

**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Core Analysis | v1.0 | 4/4 | Complete | 2026-02-17 |
| 2. Tier Selection | v1.0 | 6/6 | Complete | 2026-02-20 |
| 3. PDF & History | v1.0 | 3/3 | Complete | 2026-02-25 |
| 4. Monetization | v1.0 | 5/5 | Complete | 2026-03-01 |
| 5. Free Credits | v1.0 | 4/4 | Complete | 2026-03-15 |
| 6. Admin Analytics | v1.1 | 3/3 | Complete | 2026-03-16 |
| 7. Production Deploy | v1.1 | 1/1 | Complete | 2026-03-25 |
| 10. Audit Gap Closure | v1.1 | 4/4 | Complete | 2026-05-07 |
| 11. Prompt Engineering | v2.0 | 0/2 | Not started | - |
| 12. Analysis Results UI & Confidence Signals | v2.0 | 2/3 | In Progress|  |
| 13. Launch Verification | v2.0 | 0/? | Not started | - |

---

_For detailed milestone archives, see `.planning/milestones/`_
