---
phase: 03-pdf-export-history
plan: 03
subsystem: pdf-export-history
type: gap_closure
tags: [pdf, history, filters, uat]
requires: [03-01]
provides: ["Inclusive PDF footer", "Latin-1 PDF metrics", "Inclusive TO date filter", "Limpiar filtros button"]
affects: [server/utils/pdf-generator.ts, pages/history.vue]
tech-stack:
  added: []
  patterns:
    - "pdfkit bufferPages + switchToPage post-pass for per-page footer"
key-files:
  created: []
  modified:
    - server/utils/pdf-generator.ts
    - pages/history.vue
decisions:
  - "Use pdfkit bufferPages + iterate range over pageAdded event: simpler, works with autoFirstPage:true and yields correct total page count for 'Página X de N'"
  - "Replace emoji with Spanish text labels rather than colored circles: avoids any font-glyph dependency and keeps metrics accessible to screen readers when copied"
metrics:
  duration: ~10m
  completed: 2026-05-06
requirements: [PDF-01, HISTORY-01, HISTORY-02]
---

# Phase 3 Plan 03: PDF & History UAT Gap Closure Summary

One-liner: Closed four UAT-diagnosed defects — PDF emoji garbling, missing footer on multi-page PDFs, exclusive TO date filter, and inaccessible "clear filters" action — restoring the polish promised by PDF-01 and HISTORY-02.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix PDF emoji garbled characters | 3e1ab5d | server/utils/pdf-generator.ts |
| 2 | Fix PDF footer missing on most pages | e2b5cc0 | server/utils/pdf-generator.ts |
| 3 | Fix TO date filter not inclusive | e9f449f | pages/history.vue |
| 4 | Add "Limpiar filtros" button to main filter bar | 7c608c2 | pages/history.vue |

## What Changed

### Task 1 — PDF metrics readable text
Replaced the Helvetica-incompatible emoji (`🔴 🟡 🟢`) with Spanish text labels:
`Hallazgos: N críticos, N medios, N bajos`. Helvetica is Latin-1 only, so the
previous emoji glyphs rendered as `Ø=Ý`-style mojibake.

### Task 2 — Footer on every page
- Enabled `bufferPages: true` on the PDFDocument constructor.
- After all content is written, iterate `doc.bufferedPageRange()` and call
  `doc.switchToPage(...)` on each, stamping the footer with correct `i+1 / total`.
- Removed the inline `addFooterToPage` calls that previously fired before each
  `doc.addPage()` (no longer needed and produced placeholder `1 of 1` numbers).
- Added `doc.flushPages()` before `doc.end()` to ensure footer writes are committed.

### Task 3 — Inclusive TO date filter
The TO comparison previously used the raw midnight timestamp from
`new Date('YYYY-MM-DD')`, excluding any analysis created later that same day.
Now we set the parsed `Date` to `23:59:59.999` before comparing.

### Task 4 — Limpiar filtros button
Added a button to the main filter bar (between the date range inputs and the
risk-level pill group) that is visible only when `hasActiveFilters` is true and
calls the existing `resetFilters` helper. The reset path was previously only
reachable from the empty-results state, which is unreachable when filters return
results.

## Verification

- ESLint: `pages/history.vue` and `server/utils/pdf-generator.ts` pass after
  prettier auto-fix on the latter (only a pre-existing `any` warning on the
  helper signature remains; out of scope per SCOPE BOUNDARY).
- Functional verification (PDF render, multi-page footer, date inclusivity, button
  toggle) requires a running app; UAT verifier will confirm in browser/PDF reader
  per the plan's verification checklist.

## Deviations from Plan

**1. [Rule 3 - Tooling] Ran `eslint --fix` for prettier formatting**
- **Found during:** Task 2
- **Issue:** Touching `pdf-generator.ts` surfaced 23 pre-existing prettier
  formatting errors that block lint gate.
- **Fix:** Auto-fix via `npx eslint --fix` (formatting only, no behavior change).
- **Files modified:** server/utils/pdf-generator.ts
- **Commit:** e2b5cc0 (folded into Task 2 commit since both touched same file)

**2. [Rule 1 - Bug] Plan suggested `pageAdded` event; used `bufferPages` + post-pass instead**
- **Found during:** Task 2
- **Issue:** `pageAdded` fires when a page is added, but at that point the page
  count is not yet final, so `Página X de N` would still be wrong (X = page
  number, N = unknown). Also doesn't help for the first page (which is added
  before any listener attaches).
- **Fix:** Used `bufferPages: true` and looped over `bufferedPageRange()` after
  content rendering. This yields correct totals and covers page 1.
- **Files modified:** server/utils/pdf-generator.ts
- **Commit:** e2b5cc0

## Authentication Gates
None.

## Known Stubs
None.

## Self-Check: PASSED
- FOUND: server/utils/pdf-generator.ts (modified)
- FOUND: pages/history.vue (modified)
- FOUND: 3e1ab5d, e2b5cc0, e9f449f, 7c608c2 (all commits in git log)
