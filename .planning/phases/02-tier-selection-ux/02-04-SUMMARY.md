---
phase: 02-tier-selection-ux
plan: 04
subsystem: UI Components
tags: [tooltip, ux, tier-selection, interaction]
requires: []
provides:
  - Individual tooltip hover triggers (not group-hover)
  - Per-card expansion state
  - Clean comparison UI (modal-only)
affects:
  - components/TokenTooltip.vue
  - components/AnalysisSelector.vue
  - components/TierComparisonModal.vue
tech-stack:
  added: []
  patterns:
    - Individual hover triggers for tooltips
    - Per-card state object for independent expansion
key-files:
  created: []
  modified:
    - path: components/TokenTooltip.vue
      change: "Removed group class, changed group-hover to hover"
    - path: components/TierComparisonModal.vue
      change: "Changed overflow-x-auto to overflow-visible"
    - path: components/AnalysisSelector.vue
      change: "Replaced isExpanded with expandedTiers object, removed duplicate table"
key-decisions: []
requirements-completed: [TIER-02]
duration: "5 min"
completed: "2026-02-23T21:53:54Z"
---

# Phase 02 Plan 04: Individual Tooltip Hover and Per-Card Expansion Summary

## One-Liner

Fixed tooltip behavior to show individually on hover (not all at once), enabled independent tier card expansion, and removed duplicate comparison table.

## Execution Summary

**Start:** 2026-02-23T21:48:52Z
**End:** 2026-02-23T21:53:54Z
**Duration:** 5 min
**Tasks Completed:** 4/4
**Files Modified:** 3

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix TokenTooltip to use individual hover | 6c5494b | components/TokenTooltip.vue |
| 2 | Fix tooltip clipping in modal table | 2a28621 | components/TierComparisonModal.vue |
| 3 | Fix tier cards per-card expansion | 45db803 | components/AnalysisSelector.vue |
| 4 | Remove duplicate comparison table | 45db803 | components/AnalysisSelector.vue |

## Changes Made

### Task 1: Individual Tooltip Hover (TokenTooltip.vue)

**Issue:** Tooltips were using `group-hover` which caused all tooltips to appear when hovering over any parent element.

**Fix:**
- Removed `group` class from container div
- Changed `group-hover:opacity-100 group-hover:visible` to `hover:opacity-100 hover:visible`
- Each tooltip now responds only to its own hover state

### Task 2: Tooltip Clipping Fix (TierComparisonModal.vue)

**Issue:** Tooltips in the table were being clipped by `overflow-x-auto` container.

**Fix:**
- Changed line 31 from `overflow-x-auto` to `overflow-visible`
- Tooltips with `bottom-full` positioning now render above without clipping

### Task 3: Per-Card Expansion (AnalysisSelector.vue)

**Issue:** All tier cards expanded/collapsed together using shared `isExpanded` state.

**Fix:**
- Replaced `const isExpanded = ref<"basic" | "premium" | "forensic" | null>(null)`
- With `const expandedTiers = ref({ basic: false, premium: false, forensic: false })`
- Updated all 10 template references to use `expandedTiers.basic`, `expandedTiers.premium`, `expandedTiers.forensic`
- Each card now expands independently without affecting others

### Task 4: Remove Duplicate Table (AnalysisSelector.vue)

**Issue:** Redundant "Comparativa de Niveles" table duplicated information already in TierComparisonModal.

**Fix:**
- Removed lines 388-468 (entire comparison table section)
- Kept "Cuál nivel es para mí?" button that opens the modal
- Cleaner UI, single source of truth for comparison data

## Verification

All verification steps passed:
- [x] TokenTooltip.vue uses `hover:opacity-100 hover:visible` (not group-hover)
- [x] TierComparisonModal.vue table uses `overflow-visible`
- [x] AnalysisSelector.vue uses `expandedTiers` object for per-card state
- [x] Each tier card expands/collapses independently
- [x] Duplicate comparison table removed
- [x] Tooltips appear individually on hover
- [x] Tooltips are not clipped by table boundaries

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All modified files exist and changes verified via grep.
