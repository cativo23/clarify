---
phase: 13-launch-verification
plan: 06
subsystem: database
tags: [postgres, rpc, forensic-tier, ui-rendering]

requires:
  - phase: 13-launch-verification
    provides: "13-04 (AUTH_MODE=browser established), 13-05 (PDF export/cache verified)"
provides:
  - "LAUNCH-04 verified: a Forensic result page renders all sections (executive summary, risk panel, clause findings, section index, cross-clause analysis, critical omissions, structural map, coverage) with no layout errors, closing Phase 01 UAT Test 4"
  - "Root cause fix for a real data-integrity bug: analysis_type was never persisted by the analysis-creation RPC, silently defaulting every analysis to 'premium' regardless of the tier requested — this, not a cosmetic label, is why Forensic-only UI sections never rendered"
affects: ["13-07"]

actuals:
  tokens: 12000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "One-off manual correction of a single pre-existing analysis row (analysis_type) to re-test already-generated content without spending further OpenAI budget, distinct from a full backfill migration"

key-files:
  created:
    - ".planning/phases/13-launch-verification/evidence/05-launch-04.md"
  modified:
    - "database/migrations/20260930000001_fix_analysis_type_not_persisted.sql"

key-decisions:
  - "Temporarily swapped the forensic tier's model to gpt-5 (whitelisted, covered by OpenAI's free daily-token program) for this one verification run, after discovering the account's paid balance was down to $0.49 and gpt-6-astra isn't covered by that free program — reverted to gpt-6-astra immediately after, with Carlos's explicit go-ahead"
  - "Applied a production database migration (CREATE OR REPLACE FUNCTION, no schema change) to fix analysis_type persistence, with Carlos's explicit go-ahead given the plan's own caution around production migrations"
  - "Did not backfill analysis_type for pre-existing analyses (out of scope, a separate optional decision) — manually corrected only the one row being used for this verification, since its AI-generated content was already correct and re-generating it would have cost more OpenAI budget for no benefit"

requirements-completed: ["LAUNCH-04"]

coverage:
  - id: D1
    description: "A completed production Forensic analysis exists with every renderable section (resumen_ejecutivo, puntaje_riesgo, desglose_riesgo, hallazgos, analisis_cruzado, omisiones, mapa_estructural, coverage metrics) populated and non-empty"
    requirement: LAUNCH-04
    verification:
      - kind: integration
        ref: "evidence/05-launch-04.md Task 1 — status API section inventory"
        status: pass
    human_judgment: false
  - id: D2
    description: "The production Forensic result page renders every section (C1-C11) with no layout errors, no console errors, and correct counts matching summary_json"
    requirement: LAUNCH-04
    verification:
      - kind: automated_ui
        ref: "evidence/05-launch-04.md Task 2 — C1-C11 checklist, all PASS"
        status: pass
    human_judgment: false
  - id: D3
    description: "Root-caused and fixed a real production bug: analysis_type was never persisted on analysis creation, defaulting every analysis to 'premium' and silently disabling the Forensic-only UI sections"
    requirement: LAUNCH-04
    verification:
      - kind: manual_procedural
        ref: "database/migrations/20260930000001_fix_analysis_type_not_persisted.sql, evidence/05-launch-04.md 'Root cause' section — before/after render check"
        status: pass
    human_judgment: true
    rationale: "A production database migration was applied with Carlos's explicit go-ahead rather than a pre-scripted automated check — this was an opportunistic fix discovered during verification, not a planned deliverable."

duration: ~1h
completed: 2026-09-30
status: complete
---

# Phase 13 Plan 06: LAUNCH-04 Forensic UI Verification Summary

**LAUNCH-04 fully verified in production — and along the way, found and fixed the real root cause of Phase 01 UAT Test 4's original failure: the analysis-creation RPC never persisted `analysis_type`, so every analysis silently defaulted to 'premium' and the Forensic-only UI sections were permanently gated off regardless of the data being present.**

## Performance

- **Duration:** ~1h (spans two failed real `gpt-6-astra` attempts already documented in `evidence/08-hotfix-alpha26.md`, a `gpt-5` fallback due to a near-zero OpenAI balance, and the render-check/root-cause/fix/re-verify cycle)
- **Tasks:** 2 of 2 complete
- **Files modified:** 1 evidence doc created, 1 migration file created and applied to production

## Accomplishments

- Produced a completed Forensic analysis (`f038ddc9-83d5-49a0-a056-d06acc194bcb`, using `gpt-5` as a temporary, approved stand-in for `gpt-6-astra` due to an OpenAI balance constraint) with every renderable section populated (37 hallazgos, 3 cross-clause findings, 14 omissions, full structural map, 100% clause coverage).
- Found that none of the three Forensic-only sections rendered on the live page despite the data being present — reproducing Phase 01 UAT Test 4's original defect.
- Root-caused it to a real bug (not a cosmetic label): `process_analysis_transaction_with_free_check` never persisted `p_analysis_type` into the `analyses` table, so every analysis silently got the column's `DEFAULT 'premium'`, permanently disabling `pages/analyze/[id].vue`'s `isForensic` gate.
- Fixed via a production database migration (function replacement only, no schema change), applied with Carlos's go-ahead; verified new analyses persist the correct tier immediately, and confirmed the same analysis renders all three sections correctly once its tier label was corrected.
- All C1-C11 checklist items pass: executive summary, risk panel, clause findings with certainty pills, working section-index navigation, cross-clause analysis, critical omissions, structural map, coverage percentage, no horizontal overflow, and zero console errors.

## Task Commits

1. **Task 1 + Task 2 — evidence** — `.planning/phases/13-launch-verification/evidence/05-launch-04.md`
2. **Root-cause fix** — `2b9b297` — `database/migrations/20260930000001_fix_analysis_type_not_persisted.sql`

## Files Created/Modified

- `.planning/phases/13-launch-verification/evidence/05-launch-04.md` — full Task 1/2 evidence, root cause analysis, C1-C11 checklist
- `database/migrations/20260930000001_fix_analysis_type_not_persisted.sql` — `CREATE OR REPLACE FUNCTION` fix, applied to production and recorded in `_migrations` (batch 9)

## Decisions Made

- Used `gpt-5` (whitelisted, free-tier-covered) in place of `gpt-6-astra` for this one verification run only, after confirming the OpenAI account balance ($0.49) couldn't safely absorb another expensive forensic-tier attempt — reverted immediately after.
- Applied the `analysis_type` fix directly to production as a migration (not deferred), since it's the actual blocker for LAUNCH-04 and a schema-non-invasive, low-risk `CREATE OR REPLACE FUNCTION` change — with Carlos's explicit confirmation given the plan's own caution around production migrations.
- Manually corrected only the one analysis row already under test, rather than backfilling all historical rows or re-generating new content — cheapest path to a valid re-test given the AI-generated content was already correct.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `analysis_type` never persisted by the analysis-creation RPC**
- **Found during:** Task 2, first render check (all three Forensic-only sections missing)
- **Issue:** `process_analysis_transaction_with_free_check` accepted `p_analysis_type` but never included it in its `INSERT INTO analyses (...)` statement, so every analysis got the column's `DEFAULT 'premium'`
- **Fix:** `CREATE OR REPLACE FUNCTION` adding `analysis_type` to the INSERT
- **Files modified:** `database/migrations/20260930000001_fix_analysis_type_not_persisted.sql`
- **Verification:** New analyses persist the correct tier; the test analysis rendered all three Forensic sections once its tier label was corrected
- **Committed in:** `2b9b297`

### Process deviations

- Used a substitute model (`gpt-5`) for one verification run due to an OpenAI account balance constraint discovered mid-plan — not a code or infra defect, a real-world cost constraint, resolved with Carlos's explicit direction.

---

**Total deviations:** 1 auto-fixed (root-cause data bug) + 1 process deviation (model substitution), both explicitly confirmed with Carlos before acting.
**Impact on plan:** The RPC fix was necessary — without it, LAUNCH-04 could not have passed regardless of how many times a Forensic analysis was regenerated, since the bug was in data persistence, not AI generation or UI code.

## Issues Encountered

- Two real `gpt-6-astra` forensic attempts failed with OpenAI timeouts before this plan even started its UI check — root-caused and fixed as v1.0.0-alpha.26 (see `evidence/08-hotfix-alpha26.md`), unrelated to this plan's own findings.
- Repeated click/scroll-timing flakiness consistent with the rest of this session's UI testing (a coordinate-based click on the section index silently failed once; a `ref`-based click succeeded). Not investigated further — same open, non-blocking finding noted in 13-04/13-05.
- One transient all-black screenshot capture during a scroll animation — confirmed via `getBoundingClientRect()` that no section actually had zero height; treated as a capture-timing artifact, not a real defect.

## User Setup Required

None new. Recommend Carlos add funds to the OpenAI account balance before Phase 13's remaining real-world (non-QA) Forensic-tier traffic, and consider re-enrolling/confirming the free-tier daily token program's model coverage if `gpt-6-astra` cost is a concern going forward.

## Next Phase Readiness

- **READY.** LAUNCH-01 through LAUNCH-04 are all verified. Only plan 13-07 (final sign-off checklist and evidence page) remains in Phase 13.
- **Recommended follow-up (not blocking):** decide whether to backfill `analysis_type` for analyses created before this migration — they remain mislabeled `'premium'` regardless of their real tier, which could affect any admin reporting or analytics that groups by tier.

---
*Phase: 13-launch-verification*
*Completed: 2026-09-30*
