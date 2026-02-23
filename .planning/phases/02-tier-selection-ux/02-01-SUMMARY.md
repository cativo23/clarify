---
phase: 02-tier-selection-ux
plan: 01
subsystem: ui-components
tags: [tier-selection, ux, education, modal, tooltip]
dependency_graph:
  requires: []
  provides: [TIER-02]
  affects: [dashboard-page, user-analysis-flow]
tech_stack:
  added: []
  patterns: [css-only-tooltip, teleport-modal, expandable-card, progressive-disclosure]
key_files:
  created:
    - components/TokenTooltip.vue
    - components/TierComparisonModal.vue
  modified:
    - components/AnalysisSelector.vue
decisions:
  - "Used CSS-only hover tooltips instead of Popper.js for simplicity"
  - "Placed comparison modal trigger below tier cards for discoverability"
  - "Expand-on-click reveals more details while maintaining compact initial view"
  - "Token explanations use page analogies (8K ≈ 2-3 páginas) for non-technical users"
metrics:
  duration_seconds: ~300
  completed: 2026-02-23T06:12:37Z
---

# Phase 02 Plan 01: Tier Selection UX Summary

Enhanced tier selection UX with comparison modal, token education tooltips, and expand-on-click cards for progressive disclosure.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create TokenTooltip component | 34c1b82 | components/TokenTooltip.vue |
| 2 | Create TierComparisonModal component | 0bcf88c | components/TierComparisonModal.vue |
| 3 | Enhance AnalysisSelector with modal trigger and token tooltips | d9b8be7 | components/AnalysisSelector.vue |

## Summary

### 3/3 tasks complete

Plan 02-01 implemented all tier selection UX enhancements:

1. **TokenTooltip.vue** (34 lines) - Reusable CSS-only hover tooltip that explains tokens in non-technical terms. Default content: "Piensa en tokens como ~4 caracteres cada uno. 8K tokens ≈ 2-3 páginas de contrato". Supports dark mode with color inversion.

2. **TierComparisonModal.vue** (278 lines) - Full comparison modal with Teleport and Vue Transition. Features:
   - Feature comparison table with 4 tiers (token limits, coverage, speed, ideal para)
   - TokenTooltip integrated for each tier's token limit
   - Use cases section with "Mejor para Básico/Premium/Forensic" cards
   - Premium column highlighted with bg-secondary/5 and border-secondary/20
   - Accessible close button and backdrop click-to-close

3. **AnalysisSelector.vue** (511 lines, enhanced from 295) - Expanded tier cards with:
   - Expand-on-click progressive disclosure (compact → expanded view)
   - Expanded view shows token limits with TokenTooltip, detailed descriptions, and additional features
   - Comparison modal trigger button: "¿Cuál nivel es para mí?"
   - TokenTooltip wrappers for all token limit displays in the comparison table
   - Existing credit validation preserved (hasCreditsForPremium/Forensic)

## Key Decisions

- **CSS-only tooltips**: Chose simple CSS hover tooltips over Popper.js since we only need basic positioned tooltips. Lighter dependency footprint.
- **Modal placement**: Positioned "¿Cuál nivel es para mí?" button below the comparison table for natural discovery flow after users scan the tier overview.
- **Expand interaction**: Cards expand on click (not hover) to prevent accidental expansion and provide deliberate user control.
- **Token explanations**: Used page-count analogies (8K≈2-3, 35K≈8-10, 120K≈25-30 páginas) to make abstract token counts concrete for non-technical users.

## Verification Results

All success criteria met:
- [x] TierComparisonModal.vue exists with feature matrix and use cases
- [x] TokenTooltip.vue exists with non-technical token explanation
- [x] AnalysisSelector.vue cards expand on click to reveal more details
- [x] Comparison modal opens from "¿Cuál nivel es para mí?" button
- [x] Token tooltips appear on hover for all three tiers
- [x] Premium badge is subtle ("Recomendado" text, not prominent highlight)
- [x] Credit validation still prevents selection when insufficient credits
- [x] All components support dark mode

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All created files verified to exist. All commits recorded.
