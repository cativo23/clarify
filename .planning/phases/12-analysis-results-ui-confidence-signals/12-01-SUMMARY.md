---
phase: 12-analysis-results-ui-confidence-signals
plan: 01
subsystem: analysis-report-ui
tags: [findings, confidence-signals, risk-card, trust-ui]
dependency graph:
  requires: []
  provides:
    - "components/CertaintyBadge.vue"
    - "composables/useFindingsReport.ts"
    - "components/analysis/FindingsSection.vue"
    - "hallazgo-{index} anchor contract"
  affects:
    - "components/RiskCard.vue"
    - "pages/analyze/[id].vue"
tech-stack:
  added: []
  patterns:
    - "Dot-less pill badge (CertaintyBadge) following AnalysisStatusBadge's sm-variant shell, tone classes hardcoded per literal switch case"
    - "Named-export composable (useFindingsReport) with zero Tailwind class strings, mirroring useAnalysisStatus.ts"
key-files:
  created:
    - components/CertaintyBadge.vue
    - composables/useFindingsReport.ts
    - components/analysis/FindingsSection.vue
    - tests/unit/components/RiskCard.test.ts
    - tests/unit/composables/useFindingsReport.test.ts
    - tests/unit/components/FindingsSection.test.ts
  modified:
    - components/RiskCard.vue
    - "pages/analyze/[id].vue"
decisions:
  - "Certainty pill renders inline with the card title in a shared flex row (D-07), not stacked below the risk label"
  - "cita_textual moved out of the collapsible details v-if block to always-visible markup directly under the description (D-05); quote box surface changed from white to bg-slate-50/dark:bg-slate-950 since it now sits on the white card"
  - "Details wrapper v-if condition no longer includes citaTextual, so quote-only findings render no empty toggle (D-06)"
  - "FindingsSection owns the findings grid, anchors, and empty state; pages/analyze/[id].vue now renders it as a single element bound to summary.hallazgos ?? [] and summary.metricas.porcentaje_clausulas_analizadas"
metrics:
  duration: "~35 minutes"
  completed: "2026-09-26"
estimate:
  tokens: 75000
  raw_tokens: 75000
  tasks: 3
  confidence: low
actuals:
  tokens: 6040
  tasks: 3
  commits: 3
commits: 3
plan_head_before: f13ab92f33b689efb08c9bd482d41ca7b8ade51e
status: complete
---

# Phase 12 Plan 01: Certainty Pill, Always-Visible Quote & FindingsSection Summary

Each clause finding card now shows an inline "Confianza Alta/Media/Baja" pill next to its title, the AI-quoted source clause is visible without a click, and the findings grid was extracted into a dedicated `FindingsSection` component with stable `hallazgo-{index}` anchors and an approved empty state.

## What Was Built

**Task 1 — Certainty pill (tracer):** `components/CertaintyBadge.vue` is a dot-less pill (`px-2 py-0.5 text-[9px]`, `rounded-full uppercase font-black`) following `AnalysisStatusBadge.vue`'s shell without the status dot/pulse logic. Tone classes are a hardcoded literal switch over `"Alta" | "Media" | "Baja"` — Alta gets `bg-accent-indigo/10 text-accent-indigo`, Media gets `bg-slate-200 text-slate-600`, Baja gets an outline-only `border-slate-300 text-slate-400`. `RiskCard.vue` gained an optional `confianza` prop and renders `<CertaintyBadge>` inline with the `<h3>` title inside a shared `flex flex-wrap items-center gap-2` wrapper. `pages/analyze/[id].vue`'s RiskCard loop passes `hallazgo.confianza` through.

**Task 2 — Always-visible quote + accessible toggle:** The "Referencia del Contrato" quote block moved from inside the `v-if="isExpanded"` details panel to directly under the description paragraph, always rendered when `citaTextual` is present. The details wrapper's `v-if` no longer checks `citaTextual`, so a quote-only finding (no `clausula`/`riesgoReal`/`mitigacion`/`details`) shows the quote with no toggle button at all. The toggle button gained `type="button"` and `:aria-expanded="isExpanded"`.

**Task 3 — FindingsSection extraction:** `composables/useFindingsReport.ts` exports three pure helpers (`findingAnchorId`, `hallazgoColorToRisk`, `formatCoverageSentence`) with zero Tailwind class strings. `components/analysis/FindingsSection.vue` renders the "Análisis por Cláusula" heading, a grid of `RiskCard`s each wrapped in a `hallazgo-{index}`-id'd `div.scroll-mt-24`, and the approved empty state ("Sin hallazgos de riesgo" + coverage sentence) when `hallazgos` is empty. `pages/analyze/[id].vue` now renders a single `<FindingsSection>` bound to `summary.hallazgos ?? []` and the coverage percentage, replacing the inline findings block and RiskCard loop entirely.

## Deviations from Plan

None — plan executed exactly as written. One naming adjustment: the inline HTML comment above the quote block was worded to avoid duplicating the literal string "Referencia del Contrato" (which would have doubled the acceptance-criteria grep count); the comment now reads "Quoted source clause, always visible per RESULT-03/D-05".

## Auth Gates

None encountered.

## Known Stubs

None — all three components are fully wired to real `Hallazgo` data; no hardcoded/placeholder values.

## Deferred / Unrun Verification

Task 2's `<human-check>` (visual judgment of long-quote readability on a collapsed card, using a real completed Premium/Forensic analysis) was not run — it requires uploading a contract via the browser and waiting for a paid OpenAI analysis to complete, which cannot be judged headlessly by the executor. Recorded in `.planning/WINDOWS.md` as an `unrun-verify` entry (id 1) with the UI-SPEC `line-clamp-3` backstop noted as the remedy if a human later finds it reads poorly.

## Threat Flags

None — all new/modified components render AI-controlled strings (`titulo`, `explicacion`, `cita_textual`, `clausula`, `riesgo_real`, `mitigacion`, `confianza`) through mustache interpolation only (verified via `grep -n v-html` returning nothing across all touched files); `CertaintyBadge`'s tone classes come from a switch over three hardcoded literals, never interpolating `confianza` into a class attribute; `FindingsSection`'s anchor ids derive only from the numeric array index via `findingAnchorId`, never from AI text.

## Verification

- All 32 unit tests pass (`tests/unit/components`, `tests/unit/composables`), including the pre-existing `ThemeToggle` regression suite.
- `tsc --noEmit` reports no errors in any file this plan touched (pre-existing `server/api/admin/` errors from Phase 11 remain, out of scope).
- ESLint clean on every created/modified file.
- `pages/analyze/[id].vue` renders findings only through `FindingsSection`, which passes `hallazgo.confianza` and `hallazgo.cita_textual` to `RiskCard`.
- No new component uses `v-html` or a 500/600/700 font weight.

## Self-Check: PASSED

- `components/CertaintyBadge.vue` — FOUND
- `composables/useFindingsReport.ts` — FOUND
- `components/analysis/FindingsSection.vue` — FOUND
- `tests/unit/components/RiskCard.test.ts` — FOUND
- `tests/unit/composables/useFindingsReport.test.ts` — FOUND
- `tests/unit/components/FindingsSection.test.ts` — FOUND
- Commit `32c6c3f` — FOUND
- Commit `c85b1cb` — FOUND
- Commit `abebccf` — FOUND
