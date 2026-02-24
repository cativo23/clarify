---
status: complete
phase: 03-pdf-export-history
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-02-24T13:35:00Z
updated: 2026-02-24T14:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Download Analysis PDF
expected: On analysis detail page, clicking "Descargar Reporte (PDF)" initiates browser download. PDF file downloads with appropriate filename. Loading state shows during generation.
result: pass

### 2. PDF Header Branding
expected: PDF opens with Clarify text logo in secondary green (#00dc82) at top. Contract name and analysis date displayed in header.
result: pass

### 3. PDF Risk Badge
expected: Risk level badge displays with correct traffic light color: red for High (Riesgo Alto), amber for Medium (Cuidado), green for Low (Seguro).
result: pass

### 4. PDF Executive Summary
expected: PDF includes executive summary section with verdict (Aceptar/Negociar/Rechazar), justification text, and metrics showing count of hallazgos by risk level.
result: issue
reported: "Metrics show garbled characters: 'Métricas: Ø=Ý4 0 Ø=ßá 4 Ø=ßâ 22' instead of colored circles"
severity: minor
root_cause: "Unicode emoji not supported by pdfkit built-in Helvetica font"

### 5. PDF Hallazgos Section
expected: All hallazgos appear in PDF with risk-colored left border, explanation, risk level, and mitigation suggestion for each finding.
result: pass

### 6. PDF Forensic Sections
expected: For Forensic analyses, PDF includes analisis_cruzado (cross-clause analysis), omisiones (critical omissions), and mapa_estructural (structural map) sections.
result: pass

### 7. PDF Footer Disclaimer
expected: Every PDF page includes footer with legal disclaimer ("No constituye asesoría legal profesional") and page numbers.
result: issue
reported: "Footer and page numbers only appear on last page, not on regular content pages"
severity: major
root_cause: "PDF generator footer callback not properly configured for all pages"

### 8. History Search
expected: On history page, typing in search box filters analyses by contract name (case-insensitive, partial match works).
result: pass

### 9. History Risk Filters
expected: Risk filter buttons (Todos/Fallidos/Riesgo Alto/Cuidado/Seguro) filter the analysis list to show only matching risk levels.
result: pass

### 10. History Date Range Filters
expected: Date FROM and TO inputs filter analyses by date range. Setting FROM excludes earlier analyses. Setting TO excludes later analyses.
result: issue
reported: "Filtering from Feb 17 to 21 didn't show analysis on Feb 21 - TO date not inclusive"
severity: major
root_cause: "Date TO comparison might be using < instead of <=, or time component issue"

### 11. Combined History Filters
expected: Multiple filters (search + risk + date) apply together with AND logic. Results only match when ALL filters are satisfied.
result: pass

### 12. Clear All Filters
expected: "Clear all filters" button resets search query, risk filter, and date range filters to show all analyses.
result: issue
reported: "No hay boton de limpiar todos los filtros" (No "Clear all filters" button exists)
severity: major
root_cause: "Clear all filters button not implemented in history page"

## Summary

total: 12
passed: 8
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "PDF includes executive summary section with verdict, justification, and metrics showing count of hallazgos by risk level using colored indicators"
  status: failed
  reason: "User reported: Metrics show garbled characters instead of colored circles"
  severity: minor
  test: 4
  root_cause: "server/utils/pdf-generator.ts:330 - Unicode emoji (🔴🟡🟢) rendered with Helvetica font which only supports Latin-1 character set. Emoji glyphs not available, causing garbled output like 'Ø=Ý'."
  artifacts:
    - path: "server/utils/pdf-generator.ts"
      issue: "Emoji in metrics text on line 330"
  missing:
    - "Replace emoji with Latin-1 compatible symbols (●) with risk colors, or text labels [ROJAS/AMARILLAS/VERDES]"

- truth: "Every PDF page includes footer with legal disclaimer and page numbers"
  status: failed
  reason: "User reported: Footer and page numbers only appear on last page, not on regular content pages"
  severity: major
  test: 7
  root_cause: "server/utils/pdf-generator.ts:94-108 - Footer only drawn at doc.end() for last page. addFooterAndBreak callback only triggers on content overflow, not on every page. pdfkit with autoFirstPage:false doesn't auto-draw footers."
  artifacts:
    - path: "server/utils/pdf-generator.ts"
      issue: "Footer drawing logic at lines 105-108 only runs at end"
  missing:
    - "Use doc.on('pageAdded') event listener to draw footer on every page automatically"

- truth: "Date FROM and TO inputs filter analyses by date range inclusively (includes both FROM and TO dates)"
  status: failed
  reason: "User reported: Filtering from Feb 17 to 21 didn't show analysis on Feb 21 - TO date not inclusive"
  severity: major
  test: 10
  root_cause: "pages/history.vue:410 - new Date(dateTo.value) creates midnight timestamp (00:00:00). Analyses with time > midnight (e.g., 14:30) fail the <= comparison. Example: 2026-02-21T14:30 <= 2026-02-21T00:00 = false."
  artifacts:
    - path: "pages/history.vue"
      issue: "matchesDateTo comparison on line 410"
  missing:
    - "Set TO date to end of day: toDate.setHours(23, 59, 59, 999)"

- truth: "'Clear all filters' button resets search query, risk filter, and date range filters to show all analyses"
  status: failed
  reason: "User reported: No hay boton de limpiar todos los filtros (button doesn't exist)"
  severity: major
  test: 12
  root_cause: "pages/history.vue:152-159 - 'Limpiar filtros' button only exists in empty state (v-else-if='filteredAnalyses.length === 0'). Main filter bar (lines 42-103) has no clear button. resetFilters() function exists (lines 446-451) but no UI trigger when results visible."
  artifacts:
    - path: "pages/history.vue"
      issue: "Clear button only in empty state, not in main filter bar"
  missing:
    - "Add 'Limpiar filtros' button to main filter bar, visible when hasActiveFilters is true"
    - "Button should call existing resetFilters() function"
