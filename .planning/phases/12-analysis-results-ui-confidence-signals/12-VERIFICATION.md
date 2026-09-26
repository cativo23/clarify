---
phase: 12-analysis-results-ui-confidence-signals
verified: 2026-09-26T04:15:00Z
status: human_needed
score: 6/6 must-haves verified
covered_files: [".planning/phases/12-analysis-results-ui-confidence-signals/12-01-PLAN.md", ".planning/phases/12-analysis-results-ui-confidence-signals/12-01-SUMMARY.md", ".planning/phases/12-analysis-results-ui-confidence-signals/12-02-PLAN.md", ".planning/phases/12-analysis-results-ui-confidence-signals/12-02-SUMMARY.md", ".planning/phases/12-analysis-results-ui-confidence-signals/12-03-PLAN.md", ".planning/phases/12-analysis-results-ui-confidence-signals/12-03-SUMMARY.md", ".planning/phases/12-analysis-results-ui-confidence-signals/12-CONTEXT.md", ".planning/phases/12-analysis-results-ui-confidence-signals/12-UI-SPEC.md", "components/CertaintyBadge.vue", "components/RiskCard.vue", "components/analysis/FindingsSection.vue", "components/analysis/ReportSidebar.vue", "components/analysis/RiskScorePanel.vue", "composables/useFindingsReport.ts", "composables/useRiskScore.ts", "pages/analyze/[id].vue"]
covered_digest: "v1:sha256:a71dda22ab095a92ad6cd9425d803b50a867e160dad7b87e9187e1d7697e273f"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Open /analyze/{id} for a completed Premium or Forensic analysis with a long cita_textual. Compare the quoted-clause block on a collapsed card."
    expected: "The quote reads comfortably without excessive vertical bulk on a collapsed card. If a very long quote reads poorly, the UI-SPEC backstop (line-clamp-3 + scoped read-more) should be applied."
    why_human: "Readability/visual weight of real, variable-length AI text on a collapsed card is a judgment call that unit tests (happy-dom) cannot make (12-01 Task 2 human-check, logged as WINDOWS.md unrun-verify #1)"
  - test: "At >=1024px, scroll through a multi-category report and click each Secciones sidebar entry; then resize below 1024px and repeat."
    expected: "Desktop: sidebar sits left, stays sticky while scrolling, and each click scrolls the target card's top edge just below the sticky header (not hidden under it). Mobile: sidebar stacks above the cards in a 2-3 column grid. Keyboard Tab + Enter on an entry moves focus to the target card with a visible slate focus ring, no outline jump."
    why_human: "Sticky positioning, scroll offset under a fixed header, and responsive breakpoint behavior are runtime layout behaviors happy-dom does not render (12-02 Task 2 human-check, logged as WINDOWS.md unrun-verify #2)"
  - test: "Open /analyze/{id} for a completed post-Phase-11 analysis at desktop width and at ~375px; compare the risk score panel (score, pills, breakdown bars, coverage) against the confirmed mockup (score 7/10, Financiero 3 / Datos 2 / Responsabilidad 1, coverage 96%)."
    expected: "Score + risk label on the left, severity pills wrapping independently on the right; one green bar per category sized relative to the max; divider then Cobertura value at the bottom; nothing overflows the card at either width; the old Métricas panel is gone."
    why_human: "Visual parity with a confirmed mockup and wrap behavior across viewport widths cannot be asserted by happy-dom (12-03 Task 2 human-check, logged as WINDOWS.md unrun-verify #3)"
---

# Phase 12: Analysis Results UI & Confidence Signals Verification Report

**Phase Goal:** Users can navigate analysis results with clarity — understanding what was flagged, why, how confident the AI is, and how much of their contract was covered.
**Verified:** 2026-09-26T04:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every finding card whose hallazgo carries confianza shows an inline "Confianza Alta/Media/Baja" pill in the title row (CONF-02, D-07) | ✓ VERIFIED | `components/RiskCard.vue:52-57` wraps `<h3>` + `<CertaintyBadge v-if="confianza">` in a shared `flex items-center` row; `components/CertaintyBadge.vue` renders `Confianza {{ confianza }}` with the three tone classes from D-color-spec; `pages/analyze/[id].vue` → `FindingsSection.vue:52` binds `:confianza="hallazgo.confianza"` from real data; 13 passing tests in `RiskCard.test.ts` cover pill text, tone classes, inline placement, and the omitted case |
| 2 | The AI-quoted source clause (cita_textual) is visible directly under the explanation on every card while collapsed (RESULT-03, D-05) | ✓ VERIFIED | `RiskCard.vue:74-98`: the "Referencia del Contrato" quote block sits after the description paragraph, outside the `v-if="isExpanded"` region, guarded only by `v-if="props.citaTextual"`; confirmed by grep (`Referencia del Contrato` count 1, positioned before `v-if="isExpanded"`) and by passing collapsed-state tests |
| 3 | Clicking "Ver más detalles" reveals Ubicación/Impacto Real/Sugerencia de Mitigación; "Ver menos" hides them again (RESULT-02, D-06) | ✓ VERIFIED | `RiskCard.vue:101-178`: details wrapper condition is `clausula \|\| riesgoReal \|\| mitigacion \|\| details` (citaTextual excluded); toggle has `type="button"` and `:aria-expanded="isExpanded"`; toggle/collapse tests pass |
| 4 | The Secciones sidebar groups findings by categoria_riesgo and clicking an entry scrolls to that category's first finding (RESULT-01, D-01/D-02) | ✓ VERIFIED | `useFindingsReport.ts groupFindingsByCategory` builds a `Map` preserving first-appearance order; `ReportSidebar.vue` renders `nav[aria-label="Índice de secciones"]` with one button per entry reading `{category} ({count})`; `scrollToEntry` resolves via `document.getElementById(findingAnchorId(entry.firstIndex))` and calls `scrollIntoView`; integration test in `FindingsSection.test.ts` clicks a real rendered entry and confirms the actual anchored card (not a mock) is scrolled to and focused |
| 5 | The combined risk score panel (score, severity pills, category bars, coverage %) replaces the old Métricas panel (CONF-01, CONF-03, D-08/D-09) | ✓ VERIFIED | `pages/analyze/[id].vue:398-405` renders `<RiskScorePanel>` bound to `summary.puntaje_riesgo`, `summary.desglose_riesgo`, the three `metricas` totals, and `porcentaje_clausulas_analizadas`; `grep -c "Métricas" "pages/analyze/[id].vue"` returns 0; `RiskScorePanel.vue` renders score/label via `getScoreRisk`, Críticos/Alertas/Seguros pills carrying the old rojas/amarillas/verdes counts, `buildBreakdownBars`-driven bars, and the Cobertura row at the bottom, matching D-08's layout order exactly |
| 6 | An analysis with zero hallazgos shows "Sin hallazgos de riesgo" and the coverage sentence instead of an empty grid | ✓ VERIFIED | `FindingsSection.vue:13-22` renders the empty-state heading and `formatCoverageSentence(coverage)`; `FindingsSection.test.ts` asserts the exact sentence and zero RiskCard instances for `hallazgos: []` |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/CertaintyBadge.vue` | Dot-less certainty pill | ✓ VERIFIED | Exists, substantive, wired into RiskCard, three literal tone classes, no v-html |
| `components/RiskCard.vue` | Inline pill + always-visible quote + a11y toggle | ✓ VERIFIED | Modified per plan; wired to CertaintyBadge and real hallazgo fields |
| `composables/useFindingsReport.ts` | Anchor id / color / coverage / grouping helpers | ✓ VERIFIED | All 4 exports present (`findingAnchorId`, `hallazgoColorToRisk`, `formatCoverageSentence`, `groupFindingsByCategory` + `CategoryIndexEntry`); zero Tailwind classes (grep confirms) |
| `components/analysis/FindingsSection.vue` | Findings grid, anchors, empty state, sidebar host | ✓ VERIFIED | Wired into page; renders `ReportSidebar` conditionally; every card wrapped in `hallazgo-{index}` + `scroll-mt-24` + `tabindex="-1"` |
| `components/analysis/ReportSidebar.vue` | Category index, click-to-scroll | ✓ VERIFIED | `aria-label="Índice de secciones"`, numeric-index-only DOM lookup, reduced-motion + focus handling present |
| `components/analysis/RiskScorePanel.vue` | Combined score/pills/bars/coverage panel | ✓ VERIFIED | Contains "Cobertura"; wired to `useRiskScore` helpers; old Métricas panel confirmed removed from the page |
| `composables/useRiskScore.ts` | Score banding, bar sizing | ✓ VERIFIED | `getScoreRisk`, `buildBreakdownBars` present, clamped/rounded per spec, zero Tailwind classes |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `pages/analyze/[id].vue` | `FindingsSection.vue` | `:hallazgos="summary.hallazgos ?? []"` | ✓ WIRED | Confirmed at page line 441-443 |
| `FindingsSection.vue` | `RiskCard.vue` | `:confianza`, `:cita-textual` bindings | ✓ WIRED | Confirmed at line 44-53 |
| `RiskCard.vue` | `CertaintyBadge.vue` | explicit import + `v-if="confianza"` | ✓ WIRED | Confirmed line 185, 56 |
| `FindingsSection.vue` | `ReportSidebar.vue` | `:entries="indexEntries"` computed via `groupFindingsByCategory` | ✓ WIRED | Confirmed line 33-34, 74 |
| `ReportSidebar.vue` | `useFindingsReport.ts` | `findingAnchorId(entry.firstIndex)` | ✓ WIRED | Confirmed line 30 |
| `pages/analyze/[id].vue` | `RiskScorePanel.vue` | `:puntaje-riesgo`, `:desglose-riesgo`, totals, `:coverage` | ✓ WIRED | Confirmed lines 398-404 |
| `RiskScorePanel.vue` | `useRiskScore.ts` | `getScoreRisk`, `buildBreakdownBars` | ✓ WIRED | Confirmed line 122, 133-134 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 6 phase-12 unit test files pass | `docker compose exec app npx vitest run --project unit tests/unit/components/RiskCard.test.ts tests/unit/components/FindingsSection.test.ts tests/unit/components/ReportSidebar.test.ts tests/unit/components/RiskScorePanel.test.ts tests/unit/composables/useFindingsReport.test.ts tests/unit/composables/useRiskScore.test.ts` | 6 files / 73 tests passed | ✓ PASS |
| No debt markers, v-html, or disallowed font weights in touched files | grep for TODO/FIXME/XXX/HACK/PLACEHOLDER/v-html across all 8 touched components/composables/page | zero matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| RESULT-01 | 12-02 | Sidebar index of clause sections, click-to-jump | ✓ SATISFIED | ReportSidebar + groupFindingsByCategory, integration-tested |
| RESULT-02 | 12-01 | Expand/collapse clause finding cards | ✓ SATISFIED | RiskCard toggle, a11y attrs, unit-tested |
| RESULT-03 | 12-01 | AI-quoted source clause visible alongside explanation | ✓ SATISFIED | Always-visible quote block, unit-tested |
| CONF-01 | 12-03 | Overall risk score (0-10) with category breakdown | ✓ SATISFIED | RiskScorePanel + getScoreRisk/buildBreakdownBars, unit-tested |
| CONF-02 | 12-01 | Per-clause certainty badge | ✓ SATISFIED | CertaintyBadge, inline in RiskCard title row |
| CONF-03 | 12-03 | Coverage percentage visible | ✓ SATISFIED | Cobertura row retained in RiskScorePanel |

No orphaned requirements found for Phase 12 in REQUIREMENTS.md.

### Anti-Patterns Found

None. Grep for `TODO|FIXME|XXX|HACK|PLACEHOLDER|v-html` across all 8 files modified/created in this phase returned zero matches.

### Human Verification Required

### 1. Long-quote readability on collapsed cards (RESULT-03 backstop)

**Test:** Open `/analyze/{id}` for a completed Premium/Forensic analysis with a long `cita_textual`. Look at the collapsed card.
**Expected:** The quote reads comfortably without excessive vertical bulk. If it reads poorly, apply the UI-SPEC `line-clamp-3` + scoped read-more backstop (not behind the main collapse toggle).
**Why human:** Visual weight/readability judgment on real variable-length AI text; not assertable via happy-dom. Already logged in `.planning/WINDOWS.md` as unrun-verify #1.

### 2. Sidebar sticky positioning, scroll offset, and responsive stacking (RESULT-01)

**Test:** At ≥1024px, scroll a multi-category report and click each Secciones entry; then resize below 1024px and repeat; then Tab to an entry and press Enter.
**Expected:** Desktop: sidebar sticky left column, each click lands the target card's top edge just below the sticky header. Mobile: sidebar stacks above cards in a 2-3 col grid. Keyboard: focus ring visible, Enter moves focus to the target card without outline jump.
**Why human:** Sticky/fixed-header scroll offset and responsive breakpoints are runtime layout behaviors happy-dom does not render. Already logged in `.planning/WINDOWS.md` as unrun-verify #2.

### 3. Visual parity of the combined risk panel against the confirmed mockup (CONF-01/CONF-03)

**Test:** Open a completed post-Phase-11 analysis at desktop and ~375px width; compare against the confirmed mockup (score 7/10, Financiero 3 / Datos 2 / Responsabilidad 1, coverage 96%).
**Expected:** Score/label left, pills wrap independently on the right, one bar per category sized relative to max, divider + Cobertura at bottom; nothing overflows at either width; old Métricas panel gone.
**Why human:** Visual parity with a confirmed mockup and cross-width wrap behavior cannot be asserted by happy-dom. Already logged in `.planning/WINDOWS.md` as unrun-verify #3.

### Gaps Summary

No gaps. All 6 derived truths (mapped 1:1 to the 6 phase requirements RESULT-01/02/03, CONF-01/02/03) are verified in the codebase with passing automated tests and confirmed wiring from `pages/analyze/[id].vue` down through composables. The only open items are the three pre-existing, explicitly logged visual/browser judgment calls (`.planning/WINDOWS.md` unrun-verify #1-3) that the phase's own plans correctly deferred to human review — these are expected human-check items, not defects, and do not block the phase goal being achieved in the codebase.

---

_Verified: 2026-09-26T04:15:00Z_
_Verifier: Claude (gsd-verifier)_
