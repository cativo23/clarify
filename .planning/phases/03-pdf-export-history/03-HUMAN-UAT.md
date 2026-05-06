---
status: partial
phase: 03-pdf-export-history
source: [03-VERIFICATION.md]
started: 2026-05-06T00:00:00Z
updated: 2026-05-06T23:25:00Z
---

## Current Test

[items 4 & 5 still require manual run]

## Tests

### 1. PDF visual render on multi-page Forensic analysis
expected: Footer with disclaimer + "Página X de N" appears on every page; metrics text (no emoji) renders cleanly without garbled characters
result: passed (after fix 6c077fc) — 3-page generated PDF shows NOTA LEGAL + 2-line disclaimer + "Página X de 3" on pages 1, 2, 3; metrics line renders as "Hallazgos: 5 críticos, 3 medios, 2 bajos" with clean accents and no garbled glyphs.
defect_found: original 03-03 footer post-pass auto-paginated due to doc.y inherited from switchToPage(); 9 spurious pages were generated. Fixed in 6c077fc by resetting doc.y/doc.x and forcing lineBreak:false on each text call.

### 2. Date TO filter inclusivity
expected: Selecting a TO date in history filters includes analyses created on that date through end-of-day (23:59:59)
result: passed (after fix 6c077fc) — HASTA=2026-05-06 returns all 5 seeded analyses including today's (created at 17:15 local).
defect_found: original `new Date(value); setHours(23,59,59)` resolved to end-of-day UTC, which is the prior day in UTC-6, so HASTA=today excluded today's analyses. Fixed by anchoring to local time via `new Date(value + "T23:59:59.999")`.

### 3. "Limpiar filtros" button visibility toggle
expected: Button appears in main filter bar when any filter is active and clears all filters when clicked; hidden when no filters active
result: passed — button appeared after setting HASTA, cleared both date inputs on click, and disappeared once no filter was active.

### 4. PDF caching round-trip
expected: Subsequent PDF downloads of the same analysis return cached PDF from Supabase Storage
result: passed — first export-pdf returned `cached: false`, second returned `cached: true` against the same signed Storage URL (verified via fetch).

### 5. Cross-user PDF access denial
expected: User A cannot download PDF for an analysis owned by User B (RLS/ownership enforced)
result: pending — needs a second auth user; deferred.

## Summary

total: 5
passed: 4
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps

None outstanding from this run. Two defects were caught during runtime testing (timezone-sensitive TO filter, footer post-pass overflow) and resolved in commit 6c077fc — recorded under each test's `defect_found` line.
