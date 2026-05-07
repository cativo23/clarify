---
phase: 11-prompt-engineering
plan: 02
subsystem: api
tags: [openai, prompts, contracts, analysis, forensic]

# Dependency graph
requires:
  - phase: 11-prompt-engineering
    plan: 01
    provides: Basic and Premium prompts upgraded to v2.1 with shared structured fields

provides:
  - Forensic tier prompt v2.1 with all shared structured fields (confianza, categoria_riesgo, puntaje_riesgo, desglose_riesgo)
  - Forensic-only numeric coverage fields in metricas (clausulas_analizadas, clausulas_total)

affects:
  - 12-analysis-experience-ui (reads confianza, categoria_riesgo, puntaje_riesgo, desglose_riesgo, clausulas_analizadas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Forensic-only metricas extension: clausulas_analizadas and clausulas_total as numeric siblings of porcentaje_clausulas_analizadas"
    - "Cross-reference enforcement: metricas numeric coverage must match _debug.coverage_verification values"

key-files:
  created: []
  modified:
    - server/prompts/v2/forensic-analysis-prompt.txt

key-decisions:
  - "clausulas_analizadas and clausulas_total added to Forensic metricas only (D-11, D-12) — Basic/Premium keep string-only porcentaje_clausulas_analizadas"
  - "Numeric coverage fields must equal _debug.coverage_verification.clausesAnalyzed/clausesTotal for consistency (D-13)"
  - "All three new sections (PUNTAJE DE RIESGO, CATEGORÍAS DE RIESGO, CONFIANZA DEL ANÁLISIS) use word-for-word identical text from Basic v2.1 for shared field consistency"

requirements-completed:
  - PROMPT-02
  - PROMPT-03

# Metrics
duration: 2min
completed: 2026-05-07
---

# Phase 11 Plan 02: Prompt Engineering v2.1 — Forensic Tier Upgrade

**Forensic tier prompt upgraded to v2.1 with shared structured fields (confianza, categoria_riesgo, puntaje_riesgo, desglose_riesgo) plus Forensic-only numeric coverage metricas (clausulas_analizadas, clausulas_total) for PROMPT-02 and PROMPT-03 completion**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-07T22:23:14Z
- **Completed:** 2026-05-07T22:25:36Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Upgraded `forensic-analysis-prompt.txt` to v2.1 with the three new instruction sections (PUNTAJE DE RIESGO, CATEGORÍAS DE RIESGO, CONFIANZA DEL ANÁLISIS) — word-for-word identical to the completed Basic/Premium v2.1 prompts for vocabulary consistency
- Updated JSON example: bumped `prompt_version` to `"v2.1"`, added `puntaje_riesgo: 8` and `desglose_riesgo` at top level (per D-02), added `confianza` and `categoria_riesgo` to all 5 hallazgo entries
- Added Forensic-only `clausulas_analizadas` and `clausulas_total` numeric fields to the metricas block (D-11), with instruction text cross-referencing `_debug.coverage_verification` for consistency (D-13)
- Extended CHECKLIST DE CALIDAD with 4 new items covering all new structured fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade Forensic tier prompt to emit all v2.1 shared fields** - `4243040` (feat)
2. **Task 2: Add Forensic-specific numeric coverage fields to metricas (PROMPT-03)** - `0ab8a6d` (feat)

## Files Created/Modified

- `server/prompts/v2/forensic-analysis-prompt.txt` — v2.0 → v2.1: added PUNTAJE DE RIESGO, CATEGORÍAS DE RIESGO, and CONFIANZA DEL ANÁLISIS sections; updated JSON example with puntaje_riesgo, desglose_riesgo, confianza, categoria_riesgo; added clausulas_analizadas and clausulas_total to metricas; updated CHECKLIST DE CALIDAD

## Decisions Made

- Sections inserted between ALGORITMO DE DECISIÓN DE RIESGO and GESTIÓN DE TOKENS — preserving the logical flow from decision rules to new scoring/categorization rules
- Numeric coverage fields placed before `porcentaje_clausulas_analizadas` in the metricas JSON example, making the relationship clear (numeric source → derived string)
- The checklist item for `clausulas_analizadas` was added in Task 1's commit since the CHECKLIST was being updated anyway; Task 2 commit confirms the coverage instruction block and JSON example changes

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The Forensic prompt now fully specifies all required fields. Phase 12 UI will consume these fields; any UI stubs are tracked in Phase 12 planning.

## Threat Flags

None. The only file modified is a server-side prompt `.txt` file. No new network endpoints, auth paths, or schema changes introduced.

## Self-Check

### Files exist:
- `server/prompts/v2/forensic-analysis-prompt.txt` — modified (exists in worktree)

### Commits exist:
- `4243040` — Task 1 (feat: upgrade shared fields)
- `0ab8a6d` — Task 2 (feat: add numeric coverage fields)

### Acceptance criteria verified:
- `grep -c "puntaje_riesgo" forensic-analysis-prompt.txt` → 4 (>= 3) ✓
- `grep -c "confianza" forensic-analysis-prompt.txt` → 8 (>= 5) ✓
- `grep -c "categoria_riesgo" forensic-analysis-prompt.txt` → 9 (>= 3) ✓
- `grep '"v2.1"' forensic-analysis-prompt.txt` → match ✓
- `grep '"desglose_riesgo"' forensic-analysis-prompt.txt` → match in JSON example ✓
- 7-value enum present in CATEGORÍAS DE RIESGO section ✓
- `grep -c "clausulas_analizadas" forensic-analysis-prompt.txt` → 7 (>= 3) ✓
- `grep -c "clausulas_total" forensic-analysis-prompt.txt` → 4 (>= 3) ✓
- `grep '"clausulas_analizadas": 156'` → match (numeric value) ✓
- `grep '"clausulas_total": 156'` → match (numeric value) ✓
- `grep "coverage_verification"` → 4 matches ✓
- `"clausulas_analizadas"` as JSON key absent from basic and premium prompts ✓

## Self-Check: PASSED

---
*Phase: 11-prompt-engineering*
*Completed: 2026-05-07*
