---
phase: 12-analysis-results-ui-confidence-signals
plan: 03
subsystem: analysis-report-ui
tags: [risk-score, confidence-signals, breakdown-bars, trust-ui]
dependency graph:
  requires:
    - "pages/analyze/[id].vue summary grid (phase 12-01)"
  provides:
    - "composables/useRiskScore.ts (getScoreRisk, buildBreakdownBars)"
    - "components/analysis/RiskScorePanel.vue"
  affects:
    - "pages/analyze/[id].vue"
tech-stack:
  added: []
  patterns:
    - "Composable returns pure levels/labels/numbers only; every Tailwind class string lives in the .vue file (composables/ is not Tailwind-scanned)"
    - "Relative-to-max bar-width formula with a 6% visibility floor, filtering non-finite/non-positive counts before sizing"
key-files:
  created:
    - composables/useRiskScore.ts
    - components/analysis/RiskScorePanel.vue
    - tests/unit/composables/useRiskScore.test.ts
    - tests/unit/components/RiskScorePanel.test.ts
  modified:
    - "pages/analyze/[id].vue"
decisions:
  - "getScoreRisk rounds then clamps to 0-10 before banding, so a fractional or out-of-range model score never displays or bands incorrectly (D-03)"
  - "buildBreakdownBars filters non-positive/non-finite counts before computing max, so a zero-count category can never draw a floor-width bar"
  - "Old dark 'Métricas' card chrome (bg-slate-900/rounded-3xl/border-slate-800 + blur decoration + Cobertura row) reused verbatim; only the internal header and bar section changed per D-08"
metrics:
  duration: "~30 minutes"
  completed: "2026-09-26"
estimate:
  tokens: 55000
  raw_tokens: 55000
  tasks: 2
  confidence: low
actuals:
  tokens: 5430
  tasks: 2
  commits: 2
commits: 2
plan_head_before: 953fb25988a50de06295c25ea5d7ebf1cd84b3dd
status: complete
---

# Phase 12 Plan 03: Combined Risk Score Panel Summary

The old "Métricas" card on `/analyze/[id]` is replaced by a single `RiskScorePanel` showing the 0-10 `puntaje_riesgo` with a banded, colored risk label and Críticos/Alertas/Seguros severity pills up top, one relative-sized bar per `desglose_riesgo` category in the middle, and the coverage percentage at the bottom.

## What Was Built

**Task 1 — Score, risk label, severity pills, coverage:** `composables/useRiskScore.ts` exports `getScoreRisk(score)`, which returns `null` for undefined/NaN input and otherwise rounds, clamps to 0-10, and bands into `low`/"Riesgo Bajo" (0-2), `medium`/"Riesgo Medio" (3-5), or `high`/"Riesgo Alto" (6-10) — no Tailwind classes in this file. `components/analysis/RiskScorePanel.vue` reuses the old card's chrome (`bg-slate-900 rounded-3xl border-slate-800 shadow-2xl` + blur decoration) and Cobertura row verbatim, adding a new header: the 48px score number + "/10" + an icon'd risk label (icon paths borrowed from `RiskCard.vue`) on the left, and a `flex-wrap` pill list (Críticos/Alertas/Seguros, using the risk tokens) on the right that wraps independently of the score block. `pages/analyze/[id].vue`'s old inline metrics card is gone; the same grid slot now holds `<RiskScorePanel>` bound to `summary.puntaje_riesgo` and the three `metricas` totals plus `porcentaje_clausulas_analizadas`.

**Task 2 — Category breakdown bars:** `buildBreakdownBars(desglose)` filters out non-finite/non-positive counts, sorts the rest descending (stable sort preserves tie order), and sizes each bar's `widthPct` relative to the max count, floored at 6% and capped at 100%. `RiskScorePanel.vue` renders this as a `ul` (only when non-empty) between the header and the Cobertura row — category name above, a `bg-secondary` fill on a `bg-slate-800` track below, count at the end. `pages/analyze/[id].vue` now also passes `:desglose-riesgo="summary.desglose_riesgo"`.

## Deviations from Plan

None — plan executed exactly as written. One TS fix required by `tsc --noEmit` inside Task 1's GREEN step: `sorted[0][1]` was flagged as possibly undefined under `noUncheckedIndexedAccess`; changed to `sorted[0]?.[1] ?? 1` (Rule 1 — the array is already guaranteed non-empty by the preceding length check, so this is a type-narrowing fix, not a behavior change).

## Auth Gates

None encountered.

## Known Stubs

None — the panel is fully wired to real `summary.puntaje_riesgo`, `summary.desglose_riesgo`, and `summary.metricas` fields; no hardcoded/placeholder values.

## Deferred / Unrun Verification

Task 2's `<human-check>` (visual parity of the score/pills/breakdown/coverage layout against the confirmed mockup, at desktop width and ~375px) was not run — it requires a completed post-Phase-11 analysis viewed in a real browser at two widths, which the executor cannot judge headlessly. Recorded in `.planning/WINDOWS.md` as an `unrun-verify` entry (id 3).

## Threat Flags

None — all three mitigations from the plan's threat register are implemented and unit-tested: category names render through mustache interpolation only (`grep -n v-html components/analysis/RiskScorePanel.vue` returns nothing); only `buildBreakdownBars`' rounded, 6-100-clamped `widthPct` reaches the fill's `:style` binding, never an AI string; `getScoreRisk` rounds and clamps before banding, so an out-of-range or fractional model score can never display an impossible value.

## Verification

- All 30 unit tests pass across the two new test files; the full `tests/unit/components` + `tests/unit/composables` suite (7 files, 77 tests) shows no regressions.
- `tsc --noEmit` reports no errors in `composables/useRiskScore.ts`, `components/analysis/RiskScorePanel.vue`, or `pages/analyze/[id].vue` (pre-existing `server/api/admin/` errors remain, out of scope).
- ESLint clean on every created/modified file.
- `pages/analyze/[id].vue` binds `RiskScorePanel` to `summary.puntaje_riesgo`, `summary.desglose_riesgo`, the three `metricas` totals, and `porcentaje_clausulas_analizadas`; the string "Métricas" no longer appears on the page.
- `RiskScorePanel.vue` uses the risk tokens (`risk-high`/`risk-medium`/`risk-low`) for the label and pills, and the accent (`bg-secondary`/`text-secondary`) only for the breakdown fills and the coverage value.

## Self-Check: PASSED

- `composables/useRiskScore.ts` — FOUND
- `components/analysis/RiskScorePanel.vue` — FOUND
- `tests/unit/composables/useRiskScore.test.ts` — FOUND
- `tests/unit/components/RiskScorePanel.test.ts` — FOUND
- Commit `4a4437c` — FOUND
- Commit `ba405f1` — FOUND
