# Requirements: v2.0 Analysis Experience

## Milestone Goal

Transform the flat analysis report into a structured, navigable reading experience with confidence signals that help non-lawyers know what to trust and what to scrutinize.

---

## v2.0 Requirements

### Analysis Results UI

- [ ] **RESULT-01**: User can view analysis results with a sidebar index of clause sections, clickable to jump to each section
- [ ] **RESULT-02**: User can expand/collapse individual clause finding cards to reduce cognitive overload
- [ ] **RESULT-03**: User can see AI-quoted source clause text alongside each finding's explanation

### Confidence Signals

- [ ] **CONF-01**: User can see an overall risk score (0–10) with a breakdown by risk category at the top of each analysis
- [ ] **CONF-02**: User can see a per-clause certainty badge (High/Medium/Low) indicating AI confidence in each flag
- [ ] **CONF-03**: User can see a coverage percentage showing what portion of the contract was analyzed

### Prompt Engineering

- [ ] **PROMPT-02**: All tier prompts (Basic, Premium, Forensic) emit structured clause-level data including clause quotes, certainty ratings, and risk category tags
- [ ] **PROMPT-03**: Forensic tier prompt returns a coverage estimate (percentage of contract clauses analyzed)

### Launch Verification (v1.1 Deferred)

- [ ] **LAUNCH-01**: Production deployment at clarify.cativo.dev is live — HTTPS active, health endpoint responds, BullMQ worker running
- [ ] **LAUNCH-02**: PDF export renders correctly in production (Supabase Storage bucket configured and verified)
- [ ] **LAUNCH-03**: PDF caching round-trip verified in production (upload → cache → re-serve)
- [ ] **LAUNCH-04**: Forensic tier UI sections render correctly in the analysis report (resolves Phase 1 Test 4 UAT gap)

---

## Future Requirements (Deferred)

- Contract comparison mode — upload two versions, see risk delta (deferred to v2.1)
- Subscription billing — recurring plans (deferred until credit model profitability confirmed)
- Mobile app — web-first approach maintained

## Out of Scope

- Contract comparison / diff view — not enough user signal on exact use case; deferred to v2.1
- Real-time collaboration — individual user focus
- Multi-language support — English only
- Full CLM (Contract Lifecycle Management) — pre-signature analysis focus only
- PDF parsing for clause extraction — AI quotes clause text inline; no client/server PDF parsing layer

---

## Traceability

_Filled by roadmapper when ROADMAP.md is created._

| REQ-ID | Phase | Plan |
|--------|-------|------|
| RESULT-01 | — | — |
| RESULT-02 | — | — |
| RESULT-03 | — | — |
| CONF-01 | — | — |
| CONF-02 | — | — |
| CONF-03 | — | — |
| PROMPT-02 | — | — |
| PROMPT-03 | — | — |
| LAUNCH-01 | — | — |
| LAUNCH-02 | — | — |
| LAUNCH-03 | — | — |
| LAUNCH-04 | — | — |

---

*Last updated: 2026-05-07 — v2.0 requirements defined*
