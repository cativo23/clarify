---
status: testing
phase: 03-pdf-export-history
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-02-24T13:35:00Z
updated: 2026-02-24T13:35:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 8
name: History Search
expected: |
  On history page (/history), typing in search box filters analyses by contract name.
  Search is case-insensitive (e.g., "servicios" matches "Servicios").
  Partial match works (e.g., "Serv" matches "Servicios").
awaiting: user response

## Tests

### 1. Download Analysis PDF
expected: On analysis detail page, clicking "Descargar Reporte (PDF)" initiates browser download. PDF file downloads with appropriate filename. Loading state shows during generation.
result: issue
reported: "500 Server Error on /api/analyses/[id]/export-pdf"
severity: blocker
root_cause: "Supabase Storage bucket 'analysis-pdfs' not created - manual setup required"

### 2. PDF Header Branding
expected: PDF opens with Clarify text logo in secondary green (#00dc82) at top. Contract name and analysis date displayed in header.
result: skipped
reason: "Blocked by Test 1 - requires Supabase Storage bucket setup"

### 3. PDF Risk Badge
expected: Risk level badge displays with correct traffic light color: red for High (Riesgo Alto), amber for Medium (Cuidado), green for Low (Seguro).
result: [pending]

### 4. PDF Executive Summary
expected: PDF includes executive summary section with verdict (Aceptar/Negociar/Rechazar), justification text, and metrics showing count of hallazgos by risk level.
result: [pending]

### 5. PDF Hallazgos Section
expected: All hallazgos appear in PDF with risk-colored left border, explanation, risk level, and mitigation suggestion for each finding.
result: [pending]

### 6. PDF Forensic Sections
expected: For Forensic analyses, PDF includes analisis_cruzado (cross-clause analysis), omisiones (critical omissions), and mapa_estructural (structural map) sections.
result: [pending]

### 7. PDF Footer Disclaimer
expected: Every PDF page includes footer with legal disclaimer ("No constituye asesoría legal profesional") and page numbers.
result: [pending]

### 8. History Search
expected: On history page, typing in search box filters analyses by contract name (case-insensitive, partial match works).
result: [pending]

### 9. History Risk Filters
expected: Risk filter buttons (Todos/Fallidos/Riesgo Alto/Cuidado/Seguro) filter the analysis list to show only matching risk levels.
result: [pending]

### 10. History Date Range Filters
expected: Date FROM and TO inputs filter analyses by date range. Setting FROM excludes earlier analyses. Setting TO excludes later analyses.
result: [pending]

### 11. Combined History Filters
expected: Multiple filters (search + risk + date) apply together with AND logic. Results only match when ALL filters are satisfied.
result: [pending]

### 12. Clear All Filters
expected: "Clear all filters" button resets search query, risk filter, and date range filters to show all analyses.
result: [pending]

## Summary

total: 12
passed: 0
issues: 1
pending: 10
skipped: 1

## Gaps

- truth: "On analysis detail page, clicking 'Descargar Reporte (PDF)' initiates browser download. PDF file downloads with appropriate filename. Loading state shows during generation."
  status: failed
  reason: "User reported: 500 Server Error on /api/analyses/[id]/export-pdf"
  severity: blocker
  test: 1
  root_cause: "Supabase Storage bucket 'analysis-pdfs' not created - manual setup required"
  artifacts:
    - path: ".planning/phases/03-pdf-export-history/STORAGE-SETUP.md"
      issue: "Setup documentation exists but bucket not created in Supabase"
  missing:
    - "Create 'analysis-pdfs' bucket in Supabase Storage Dashboard"
    - "Add RLS policies for user isolation"
