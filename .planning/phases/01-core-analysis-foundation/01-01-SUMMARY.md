---
phase: 01-core-analysis-foundation
plan: 01
subsystem: prompts
tags: [forensic-analysis, gpt-5, prompt-engineering, contract-audit]
requires: []
provides:
  - server/prompts/v2/forensic-analysis-prompt.txt
affects:
  - server/utils/openai-client.ts
tech-stack:
  added: []
  patterns:
    - "5-phase analysis protocol (map, extract, cross-analyze, detect-omissions, classify)"
    - "4-tier severity classification (ROJO/AMARILLO/VERDE/GRIS)"
    - "Cross-clause inconsistency detection"
    - "Exhaustive omissions with suggested clause text"
key-files:
  created:
    - path: server/prompts/v2/forensic-analysis-prompt.txt
      purpose: "Forensic analysis system prompt for gpt-5 with 100% coverage requirements"
  modified: []
decisions:
  - "100% coverage required (vs Premium's 95%) to justify 10-credit price point"
  - "Output target 15k-40k tokens (vs Premium's 6k-10k) for exhaustive detail"
  - "Cross-clause analysis mandatory to detect contradictions like refund policy conflicts"
  - "Omissions must include suggested clause text for actionable remediation"
  - "Coverage verification in _debug to ensure every paragraph analyzed"
metrics:
  started: 2026-02-22T08:08:00Z
  completed: 2026-02-22T08:12:53Z
  duration_seconds: 293
  tasks_completed: 1
  files_created: 1
  files_modified: 0
  lines_added: 647
---

# Phase 01 Plan 01: Forensic Analysis Prompt Summary

**Forensic analysis prompt created with 100% coverage requirements, cross-clause inconsistency detection, and exhaustive omissions analysis for gpt-5 tier.**

## Tasks Completed

| Task | Type | Name | Status | Files | Commit |
|------|------|------|--------|-------|--------|
| 1 | auto | Create Forensic Analysis Prompt File | Done | server/prompts/v2/forensic-analysis-prompt.txt | eb6ef86 |

## Verification Results

All verification criteria passed:

| Criterion | Required | Actual | Status |
|-----------|----------|--------|--------|
| File exists | Yes | 647 lines | PASS |
| 100% coverage requirement | Present | 11 mentions | PASS |
| Cross-clause analysis | Present | 64 mentions | PASS |
| Exhaustive omissions | Present | 6 mentions | PASS |
| Token output target | 15k-40k | 10 mentions | PASS |
| Minimum lines | 200 | 647 | PASS |

## One-Liner

Forensic analysis prompt created with 100% clause-by-clause coverage, cross-clause inconsistency detection algorithm, exhaustive omissions with suggested remediation clauses, and 15k-40k token output target for gpt-5 model.

## Key Decisions

1. **100% Coverage Justification**: Every paragraph must be analyzed to justify the 10-credit price point and differentiate from Premium's 95% coverage.

2. **Cross-Clause Detection Priority**: Added explicit algorithm for detecting contradictions between clauses (e.g., Section 3.4 says 30-day refund vs Section 8.3 says 15-day) because these inconsistencies are legally significant and often exploited against users.

3. **Exhaustive Omissions with Suggested Text**: Each omission entry includes not just what's missing, but a complete suggested clause template. This provides maximum value for high-stakes contract negotiations.

4. **Coverage Verification in Debug Output**: The `_debug.coverage_verification` field requires actual paragraph and clause counts, preventing the AI from claiming 100% coverage without evidence.

5. **5-Phase Protocol**: Structured analysis as Map → Extract → Cross-Analyze → Detect Omissions → Classify to ensure systematic coverage and prevent AI from skipping sections.

## Technical Implementation

### Prompt Structure

The forensic prompt extends the Premium prompt structure with these additions:

| Section | Premium | Forensic |
|---------|---------|----------|
| Coverage | 95% | 100% (every paragraph) |
| Phases | 4 | 5 (added cross-clause analysis) |
| Output target | 6k-10k tokens | 15k-40k tokens |
| Cross-clause | Basic mention | Full algorithm with documentation |
| Omissions | Short list | Exhaustive with suggested clauses |
| Coverage verification | Not required | Required in _debug |
| Model | gpt-5-mini | gpt-5 |
| Cost | 3 credits | 10 credits |

### JSON Response Format

Added new fields for Forensic tier:

```json
{
  "_debug": {
    "tier": "forensic",
    "coverage_verification": {
      "paragraphsAnalyzed": 287,
      "paragraphsTotal": 287,
      "clausesAnalyzed": 156,
      "clausesTotal": 156,
      "crossReferencesFollowed": 23,
      "coveragePercentage": "100%"
    }
  },
  "analisis_cruzado": [/* NEW: Array of cross-clause inconsistencies */],
  "omisiones_critic": [/* Extended: Exhaustive list with suggested clauses */],
  "mapa_estructural": {/* NEW: Full structural map with paragraph counts */}
}
```

### Severity Classification

Extended to 4 tiers (from Premium's 3):

- **ROJO**: Critical, immediate risk (same as Premium)
- **AMARILLO**: Medium, potential friction (same as Premium)
- **VERDE**: Favorable to user (same as Premium)
- **GRIS**: Neutral/procedural (NEW - for complete documentation)

## Deviations from Plan

None - plan executed exactly as written.

## Files Created

### server/prompts/v2/forensic-analysis-prompt.txt (647 lines)

Core sections:

1. **Legal Disclaimer** - Same as Premium/Basic
2. **System Identity** - Elite Forensic Auditor with 25 years experience
3. **Fundamental Rules** - 100% coverage, intelligent token economy, quality standards
4. **5-Phase Protocol**:
   - Phase 1: Complete structural mapping
   - Phase 2: Clause-by-clause extraction
   - Phase 3: Cross-clause consistency checking
   - Phase 4: Exhaustive omissions detection
   - Phase 5: Extended severity classification
5. **Extended Classification** - ROJO/AMARILLO/VERDE/GRIS with detailed criteria
6. **JSON Response Format** - Extended with coverage verification, cross-clause analysis, omissions
7. **Risk Decision Algorithm** - Enhanced for forensic tier
8. **Token Management** - Chunking strategy for 120k+ token inputs
9. **Output Optimization** - Token budget distribution guidance
10. **Quality Checklist** - 100% coverage verification requirements
11. **Premium vs Forensic Comparison** - Clear differentiation table

## Integration Points

This prompt is designed to be loaded by `server/utils/openai-client.ts` when the Forensic tier is selected. The prompt file resolution should follow the existing pattern:

```typescript
// Expected pattern in openai-client.ts
const promptFile = tier === 'forensic'
  ? 'server/prompts/v2/forensic-analysis-prompt.txt'
  : tier === 'premium'
    ? 'server/prompts/v2/analysis-prompt.txt'
    : 'server/prompts/v2/basic-analysis-prompt.txt'
```

## Success Criteria Met

- [x] File exists with 200+ lines (647 lines)
- [x] Prompt can be loaded by openai-client.ts without errors (standard text file)
- [x] Prompt instructions clearly support 100% coverage requirement (11 explicit mentions)
- [x] Cross-clause analysis algorithm included (64 references)
- [x] Exhaustive omissions detection with suggested clauses (6 detailed examples)
- [x] Token budget 15k-40k specified (10 mentions)

## Self-Check: PASSED

All files created and committed. Summary created at `.planning/phases/01-core-analysis-foundation/01-01-SUMMARY.md`.
