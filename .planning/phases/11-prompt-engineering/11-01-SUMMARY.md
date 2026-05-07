---
phase: 11-prompt-engineering
plan: 01
subsystem: api
tags: [openai, prompts, typescript, contracts, analysis]

# Dependency graph
requires:
  - phase: 01-core-analysis-foundation
    provides: Hallazgo and AnalysisSummary TypeScript interfaces, Basic and Premium prompt files

provides:
  - Updated Hallazgo interface with confianza and categoria_riesgo optional fields
  - Updated AnalysisSummary interface with puntaje_riesgo and desglose_riesgo at top level
  - Basic tier prompt v2.1 with scoring anchors, confianza calibration, 7-value enum
  - Premium tier prompt v2.1 with identical structured field vocabulary

affects:
  - 11-prompt-engineering (plan 02 — Forensic prompt upgrade)
  - 12-analysis-experience-ui (reads confianza, categoria_riesgo, puntaje_riesgo, desglose_riesgo)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Controlled enum taxonomy for risk categorization (Financiero, Datos, Derechos, Responsabilidad, Disputas, Modificaciones, Otro)"
    - "Prompt scoring anchors with calibration consistency rule (score must match nivel_riesgo_general range)"
    - "confianza as AI confidence in classification, not clause language clarity"

key-files:
  created: []
  modified:
    - types/index.ts
    - server/prompts/v2/basic-analysis-prompt.txt
    - server/prompts/v2/analysis-prompt.txt

key-decisions:
  - "All new fields added as optional (?) to preserve backward compatibility with stored analyses"
  - "puntaje_riesgo and desglose_riesgo placed at top level of AnalysisSummary, not inside metricas (D-02)"
  - "gris added to Hallazgo.color union — it was emitted by prompts but missing from TypeScript type"
  - "total_grises added as optional to metricas for Premium/Forensic compatibility"
  - "desglose_riesgo counts rojos + amarillos by categoria_riesgo; only categories with >= 1 finding included"

patterns-established:
  - "Prompt versioning: bump prompt_version in _debug block when making structural JSON changes"
  - "Controlled enum in prompts: table format with exact string values to enforce consistent LLM output"
  - "Scoring anchors: explicit calibration examples prevent score drift across analyses"

requirements-completed:
  - PROMPT-02

# Metrics
duration: 20min
completed: 2026-05-07
---

# Phase 11 Plan 01: Prompt Engineering v2.1 — TypeScript Interfaces and Prompt Upgrade

**Basic and Premium prompts bumped to v2.1 with scoring anchors, 7-value risk category enum, confianza calibration, and puntaje_riesgo + desglose_riesgo at JSON top level; TypeScript interfaces extended with 4 new optional fields for Phase 12 UI consumption**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-07T22:00:00Z
- **Completed:** 2026-05-07T22:20:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Extended `Hallazgo` interface with `confianza?: "Alta" | "Media" | "Baja"` and `categoria_riesgo?: string`; extended `AnalysisSummary` with `puntaje_riesgo?: number` and `desglose_riesgo?: Record<string, number>` at top level — all optional for backward compatibility
- Upgraded Basic tier prompt (`basic-analysis-prompt.txt`) to v2.1 with explicit scoring anchors (0–10 calibration), confianza calibration table with Spanish examples, 7-value controlled enum for categoria_riesgo, updated JSON example, and 3 new checklist items
- Upgraded Premium tier prompt (`analysis-prompt.txt`) to v2.1 with identical structured field vocabulary — consistent controlled enum and calibration rules across both tiers

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend TypeScript interfaces with optional v2.1 fields** - `76cff63` (feat)
2. **Task 2: Upgrade Basic tier prompt to emit v2.1 structured fields** - `1d15f75` (feat)
3. **Task 3: Upgrade Premium tier prompt to emit v2.1 structured fields** - `c8cb7d0` (feat)

## Files Created/Modified

- `types/index.ts` — Added `confianza?`, `categoria_riesgo?` to `Hallazgo`; added `puntaje_riesgo?`, `desglose_riesgo?` to `AnalysisSummary` (top level); added `total_grises?` to `metricas`; added `"gris"` to `Hallazgo.color` union
- `server/prompts/v2/basic-analysis-prompt.txt` — v2.0 → v2.1: added PUNTAJE DE RIESGO, CATEGORÍAS DE RIESGO, and CONFIANZA DEL ANÁLISIS sections; updated JSON example; updated CHECKLIST DE CALIDAD
- `server/prompts/v2/analysis-prompt.txt` — v2.0 → v2.1: identical structural additions as basic prompt; Premium-specific JSON example values (puntaje_riesgo=5, gris hallazgo gets categoria_riesgo="Otro")

## Decisions Made

- `gris` was already emitted by prompts but missing from `Hallazgo.color` union — added during Task 1 as a Rule 1 bug fix (type didn't reflect actual runtime output)
- `desglose_riesgo` counts red + yellow findings only (per D-04 and plan spec); green/grey not included in the breakdown count
- Both prompts use identical enum vocabulary and calibration rules so Phase 12 UI can rely on a consistent vocabulary regardless of analysis tier

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added "gris" to Hallazgo.color union**
- **Found during:** Task 1 (TypeScript interface review)
- **Issue:** The `Hallazgo.color` union only contained `"rojo" | "amarillo" | "verde"` but both prompts emit `"gris"` findings — making the TypeScript type inaccurate for existing data
- **Fix:** Added `"gris"` to the union as specified in the plan's `<action>` section
- **Files modified:** types/index.ts
- **Verification:** `grep '"gris"' types/index.ts` shows gris in both Hallazgo.color and MapaEstructural secciones riesgo union
- **Committed in:** 76cff63 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type mismatch bug)
**Impact on plan:** The plan actually called this out explicitly in the `<action>` block — included here for transparency. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in `server/api/admin/` and other files (`tsc --noEmit` exits non-zero) — confirmed these are not caused by changes in this plan; `types/index.ts` itself compiles without errors. Out of scope per scope boundary rules.

## User Setup Required

None — no external service configuration required. Prompt changes take effect immediately (loaded via `fs.readFile` at runtime, no deploy needed).

## Next Phase Readiness

- Phase 11 Plan 02 (Forensic prompt upgrade) can proceed — it follows identical pattern for `forensic-analysis-prompt.txt` with the additional `clausulas_analizadas` / `clausulas_total` numeric metricas fields (D-11/D-13)
- Phase 12 (Analysis Experience UI) can safely read `confianza`, `categoria_riesgo`, `puntaje_riesgo`, `desglose_riesgo` from analysis results — all fields are optional so old stored analyses without them degrade gracefully

---
*Phase: 11-prompt-engineering*
*Completed: 2026-05-07*
