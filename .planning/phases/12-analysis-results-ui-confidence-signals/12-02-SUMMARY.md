---
phase: 12-analysis-results-ui-confidence-signals
plan: 02
subsystem: analysis-report-ui
tags: [findings, navigation, sidebar, accessibility]
dependency graph:
  requires:
    - "hallazgo-{index} anchor contract (plan 12-01)"
  provides:
    - "components/analysis/ReportSidebar.vue"
    - "groupFindingsByCategory + CategoryIndexEntry (composables/useFindingsReport.ts)"
  affects:
    - "components/analysis/FindingsSection.vue"
tech-stack:
  added: []
  patterns:
    - "Map-based first-appearance grouping keeps insertion order equal to category first occurrence"
    - "Numeric-index-only DOM lookup (findingAnchorId) — no selector built from AI text"
key-files:
  created:
    - components/analysis/ReportSidebar.vue
    - tests/unit/components/ReportSidebar.test.ts
  modified:
    - composables/useFindingsReport.ts
    - components/analysis/FindingsSection.vue
    - tests/unit/composables/useFindingsReport.test.ts
    - tests/unit/components/FindingsSection.test.ts
decisions:
  - "Index built from summary.hallazgos, not desglose_riesgo, so every category with at least one card (any color) is listed and always has a target to scroll to (D-01/D-02)"
  - "Sidebar sits in a sticky lg:grid-cols-[14rem_minmax(0,1fr)] column only when at least one finding has a category; otherwise the layout collapses to the plain cards grid with no lg:grid-cols wrapper"
  - "Card wrappers are non-Tab-stop focus targets (tabindex=-1) so scrollToEntry can move focus there without adding them to the natural Tab order"
metrics:
  duration: "~25 minutes"
  completed: "2026-09-26"
estimate:
  tokens: 50000
  raw_tokens: 50000
  tasks: 2
  confidence: low
actuals:
  tokens: 5100
  tasks: 2
  commits: 2
commits: 2
plan_head_before: 727275104858ee14291fd5ddb4a22a22f76f0dab
status: complete
---

# Phase 12 Plan 02: Category Section Index Summary

A "Secciones" sidebar now groups the findings by `categoria_riesgo`, shows `{categoria} ({count})` per category, and smooth-scrolls (or jumps, under reduced motion) to that category's first finding card — sticky on desktop, stacked on mobile, keyboard-operable with focus landing on the target card.

## What Was Built

**Task 1 — Category index with click-to-scroll:** `groupFindingsByCategory` in `composables/useFindingsReport.ts` walks `Hallazgo[]` with the element index, trims `categoria_riesgo`, skips undefined/whitespace-only values, and accumulates into a `Map<string, CategoryIndexEntry>` so insertion order equals first appearance while counts include every color. `components/analysis/ReportSidebar.vue` is a new light-chrome `nav` (`aria-label="Índice de secciones"`) with a "Secciones" heading and one button per entry (`{categoria} ({count})`); clicking resolves the target via `document.getElementById(findingAnchorId(entry.firstIndex))` — a numeric-index lookup, never a selector built from AI text — and calls `scrollIntoView({ behavior: "smooth", block: "start" })`, returning silently if the target doesn't exist. `components/analysis/FindingsSection.vue` computes `indexEntries` and wraps the existing cards grid in a `lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8` layout with the sidebar as a `lg:sticky lg:top-24` first child, only rendered when at least one category is present; below `lg:` it stacks above the cards via default block flow.

**Task 2 — Keyboard focus and reduced motion:** `scrollToEntry` now checks `window.matchMedia("(prefers-reduced-motion: reduce)").matches` at click time and uses `behavior: "auto"` instead of `"smooth"` when it matches, then calls `target.focus({ preventScroll: true })` so keyboard/screen-reader users land on the chosen finding. Entry buttons gained a slate focus-visible ring (`focus-visible:ring-slate-400`/`dark:ring-slate-500`) — the accent (Nuxt Green) token stays reserved. Each card wrapper in `FindingsSection.vue` gained `tabindex="-1"` (a programmatic focus target, not a Tab stop) plus `focus:outline-none` so the focused card shows no outline jump. A new integration test suite mounts `FindingsSection` with five categorized hallazgos, asserts the rendered index labels/order, clicks an entry, and confirms the real anchored card (not a mock) is both scrolled to and focused; a companion test confirms hallazgos with no `categoria_riesgo` render their cards with no index and no `lg:grid-cols-` wrapper class at all.

## Deviations from Plan

None — plan executed exactly as written. Continued from uncommitted RED-phase test scaffolding left by a prior interrupted executor run (Task 1's `groupFindingsByCategory` composable tests and the full `ReportSidebar.test.ts` file), which matched the plan's behavior bullets exactly and was used as-is rather than rewritten.

## Auth Gates

None encountered.

## Known Stubs

None — both new/modified files are fully wired to real `Hallazgo` data; no hardcoded/placeholder values.

## Deferred / Unrun Verification

Task 2's `<human-check>` (sticky positioning at 1024px+, scroll offset under the sticky header, and the responsive stack below 1024px) was not run — it requires a completed multi-category analysis viewed in a real browser at multiple widths, which the executor cannot judge headlessly. Recorded in `.planning/WINDOWS.md` as an `unrun-verify` entry (id 2).

## Threat Flags

None — `categoria_riesgo` renders through mustache interpolation only (`grep -nE "v-html" components/analysis/ReportSidebar.vue components/analysis/FindingsSection.vue` returns nothing); the scroll-target lookup uses `document.getElementById(findingAnchorId(entry.firstIndex))`, a numeric-index id, never a selector string built from AI text (`querySelector` absent from both files); the reserved `secondary` (Nuxt Green) accent token is not used in either file.

## Verification

- All 4 unit test files pass inside the container: `useFindingsReport.test.ts` (13), `ReportSidebar.test.ts` (6), `FindingsSection.test.ts` (11), `RiskCard.test.ts` (13) — 43 tests total.
- `tsc --noEmit` reports no errors in `composables/useFindingsReport.ts`, `components/analysis/ReportSidebar.vue`, or `components/analysis/FindingsSection.vue`.
- ESLint clean on every created/modified file.
- No new element uses `v-html`, the reserved accent token, a selector-based DOM lookup, or a font weight outside 400/900.

## Self-Check: PASSED

- `composables/useFindingsReport.ts` — FOUND (`groupFindingsByCategory`, `CategoryIndexEntry`)
- `components/analysis/ReportSidebar.vue` — FOUND
- `components/analysis/FindingsSection.vue` — FOUND (modified)
- `tests/unit/components/ReportSidebar.test.ts` — FOUND
- `tests/unit/components/FindingsSection.test.ts` — FOUND (modified)
- `tests/unit/composables/useFindingsReport.test.ts` — FOUND (modified)
- Commit `88e64ec` — FOUND
- Commit `aa6c600` — FOUND
