---
status: testing
phase: 03-pdf-export-history
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-02-24T13:35:00Z
updated: 2026-02-24T13:35:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 11
name: Combined History Filters
expected: |
  Multiple filters (search + risk + date) apply together with AND logic.
  Results only match when ALL filters are satisfied.
awaiting: user response

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
result: [pending]

### 12. Clear All Filters
expected: "Clear all filters" button resets search query, risk filter, and date range filters to show all analyses.
result: [pending]

## Summary

total: 12
passed: 7
issues: 3
pending: 2
skipped: 0

## Gaps

- truth: "PDF includes executive summary section with verdict, justification, and metrics showing count of hallazgos by risk level using colored indicators"
  status: failed
  reason: "User reported: Metrics show garbled characters instead of colored circles"
  severity: minor
  test: 4
  root_cause: "Unicode emoji not supported by pdfkit built-in Helvetica font"
  artifacts: []
  missing: []

- truth: "Every PDF page includes footer with legal disclaimer and page numbers"
  status: failed
  reason: "User reported: Footer and page numbers only appear on last page, not on regular content pages"
  severity: major
  test: 7
  root_cause: "PDF generator footer callback not properly configured for all pages"
  artifacts: []
  missing: []

- truth: "Date FROM and TO inputs filter analyses by date range inclusively (includes both FROM and TO dates)"
  status: failed
  reason: "User reported: Filtering from Feb 17 to 21 didn't show analysis on Feb 21 - TO date not inclusive"
  severity: major
  test: 10
  root_cause: "Date TO comparison might be using < instead of <=, or time component issue"
  artifacts: []
  missing: []
