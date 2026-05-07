---
phase: 11-prompt-engineering
reviewed: 2026-05-07T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - types/index.ts
  - server/prompts/v2/basic-analysis-prompt.txt
  - server/prompts/v2/analysis-prompt.txt
  - server/prompts/v2/forensic-analysis-prompt.txt
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-05-07
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

This phase introduced v2 prompt files for all three analysis tiers (basic, premium, forensic) and updated `types/index.ts` to add forensic-specific interfaces (`AnalisisCruzadoItem`, `OmisionCritic`, `MapaEstructural`). The prompts are well-structured with detailed quality checklists and token budgets. However, there are two blockers: a prompt instructs the model to output an error JSON for oversized documents, but there is no code anywhere that detects this error structure before saving it as a completed analysis — causing silent data corruption. Additionally, the forensic prompt's own example JSON directly contradicts its stated legal-advice prohibition. There are also several type/schema gaps and a cross-cutting risk algorithm inconsistency.

---

## Critical Issues

### CR-01: `DOCUMENT_TOO_LARGE_FOR_BASIC` error JSON silently saved as completed analysis

**File:** `server/prompts/v2/basic-analysis-prompt.txt:323`

**Issue:** The basic prompt instructs the model to return a special error JSON when the input exceeds 8,000 tokens:
```json
{
  "error": "DOCUMENT_TOO_LARGE_FOR_BASIC",
  "estimated_input_tokens": 12450,
  "max_allowed_tokens": 8000,
  "suggestion": "..."
}
```
The `openai-client.ts` parses this as valid JSON and returns it. The worker (`server/plugins/worker.ts:114`) then calls `prepareSummaryForStorage()` on it (which is a no-op pass-through) and saves it to `summary_json` with `status: "completed"` and `risk_level: "medium"` (the fallback when `nivel_riesgo_general` is absent). The string `"DOCUMENT_TOO_LARGE_FOR_BASIC"` is never checked anywhere in the codebase.

The result: a user who uploads a large contract gets a "completed" analysis record containing `{ "error": "DOCUMENT_TOO_LARGE_FOR_BASIC" }` as `summary_json`, not an error status. The frontend will attempt to render `hallazgos`, `resumen_ejecutivo`, etc. against a null/missing structure.

**Fix:** In `server/plugins/worker.ts`, add an error-type check immediately after `analyzeContract()` returns:
```typescript
const analysisSummary = await analyzeContract(contractText, analysisType || "premium");

// Detect prompt-level error responses before treating as valid analysis
if (analysisSummary.error && typeof analysisSummary.error === "string") {
  throw new Error(`Analysis rejected by model: ${analysisSummary.error}`);
}
```
This causes the job to fail cleanly with `status: "failed"` and an `error_message` the UI can render.

---

### CR-02: Forensic prompt example JSON directly contradicts the legal-advice prohibition

**File:** `server/prompts/v2/forensic-analysis-prompt.txt:278,338`

**Issue:** The forensic prompt explicitly forbids the word "Exige" in the `## ASESORAMIENTO LEGAL` rule (line 48: `"NO digas: ... 'Exige que cambien X'"`) and the quality checklist (line 553: `"¿Simple, sin 'debes'/'exige'?"`). However, the canonical example JSON in the same file uses "EXIGE" in two `mitigacion` fields:

- Line 278: `"mitigacion": "EXIGE eliminar inconsistencia antes de firmar."`
- Line 338: `"recomendacion": "EXIGE adjuntar Anexo B antes de firmar"`

Because LLMs learn tone and phrasing from examples far more reliably than from rule text, this example will consistently override the prohibition. The model will produce outputs containing prescriptive legal directives, creating a liability exposure for the platform ("Clarify told me to demand changes to the contract before signing").

**Fix:** Replace both instances with compliant phrasing that matches the stated rules:
```
Line 278: "mitigacion": "Considera solicitar que se elimine esta inconsistencia antes de firmar."
Line 338: "recomendacion": "Evalúa solicitar que adjunten el Anexo B antes de firmar."
```

---

## Warnings

### WR-01: Forensic-only `metricas` fields are absent from `AnalysisSummary` type

**File:** `types/index.ts:62`

**Issue:** The forensic prompt's JSON schema defines five additional `metricas` fields not present in the `AnalysisSummary.metricas` type:
- `total_omisiones` (number)
- `total_inconsistencias_cruzadas` (number)
- `total_hallazgos` (number)
- `clausulas_analizadas` (number)
- `clausulas_total` (number)

The forensic prompt also specifies `recomendacion_prioritaria` inside `resumen_ejecutivo` (forensic-analysis-prompt.txt:243), which is also absent from the typed `resumen_ejecutivo` shape. TypeScript will silently allow reading these as `undefined` since the parent objects are typed, but any code that attempts to render or calculate with them (e.g., coverage percentage display, omission counts in the UI) will produce `NaN` or empty UI without a type error to flag the gap.

**Fix:** Extend the type with optional forensic-specific fields:
```typescript
metricas: {
  total_rojas: number;
  total_amarillas: number;
  total_verdes: number;
  total_grises?: number;
  porcentaje_clausulas_analizadas: string;
  // Forensic-only
  total_omisiones?: number;
  total_inconsistencias_cruzadas?: number;
  total_hallazgos?: number;
  clausulas_analizadas?: number;
  clausulas_total?: number;
};
resumen_ejecutivo: {
  veredicto: string;
  justificacion: string;
  clausulas_criticas_totales: number;
  mayor_riesgo_identificado: string;
  recomendacion_prioritaria?: string; // Forensic-only
};
```

---

### WR-02: `puntaje_riesgo` consistency ranges have an overlapping boundary at 3 and 6

**File:** `server/prompts/v2/basic-analysis-prompt.txt:276`, `server/prompts/v2/analysis-prompt.txt:367`, `server/prompts/v2/forensic-analysis-prompt.txt:430`

**Issue:** All three prompts specify the same consistency rule:
```
Bajo  → puntaje 0–3
Medio → puntaje 3–6
Alto  → puntaje 6–10
```
The boundary values 3 and 6 are valid for two levels simultaneously. A contract with `nivel_riesgo_general: "Bajo"` may emit `puntaje_riesgo: 3`, and a contract with `nivel_riesgo_general: "Medio"` may also emit `puntaje_riesgo: 3`. The checklist rule `"puntaje_riesgo DEBE ser coherente"` becomes unenforceable at these exact values, producing inconsistent risk scores across analyses of similar contracts.

**Fix:** Use exclusive upper bounds to eliminate overlap:
```
Bajo  → puntaje 0–2
Medio → puntaje 3–5
Alto  → puntaje 6–10
```
Apply this change consistently across all three prompt files.

---

### WR-03: Basic risk algorithm assigns `"Firmar"` verdict alongside `"Medio"` risk level for 1 red finding

**File:** `server/prompts/v2/basic-analysis-prompt.txt:250`

**Issue:** The basic risk decision algorithm states:
```
ELSE SI (total_rojas = 1):
  nivel_riesgo_general = "Medio"
  veredicto = "Firmar" (con advertencia sobre el riesgo identificado)
```
The premium and forensic prompts assign `"Negociar primero"` for the same condition (1 red finding). "Medio" risk paired with "Firmar" is a contradiction: medium risk should prompt caution, not signing. This inconsistency across tiers also means a user who runs basic analysis on the same contract gets a weaker recommendation than premium, which is the opposite of what the tier upgrade messaging promises.

**Fix:** Align the basic algorithm with the premium/forensic algorithm:
```
ELSE SI (total_rojas = 1):
  nivel_riesgo_general = "Medio"
  veredicto = "Negociar primero"
```

---

### WR-04: Worker comment states basic uses `nivel_riesgo` but basic prompt defines `nivel_riesgo_general`

**File:** `server/plugins/worker.ts:98`

**Issue:** The worker contains:
```typescript
// Premium uses 'nivel_riesgo_general', Basic uses 'nivel_riesgo'
const riskLevelStr =
  analysisSummary.nivel_riesgo_general || analysisSummary.nivel_riesgo;
```
The v2 basic prompt (`basic-analysis-prompt.txt:172`) defines the field as `nivel_riesgo_general`, the same as premium and forensic. The comment is outdated from a previous schema version and the fallback to `nivel_riesgo` is dead code for v2 prompts. If a future developer removes `nivel_riesgo_general` thinking it only applies to premium, the fallback silently returns `undefined`, causing `riskMapping[undefined]` to resolve to `"medium"` for all basic analyses regardless of actual findings.

**Fix:** Remove the dead fallback and update the comment:
```typescript
// All v2 tiers use 'nivel_riesgo_general'
const riskLevelStr = analysisSummary.nivel_riesgo_general;
```

---

### WR-05: `nota_upgrade` field produced by basic prompt has no type definition or consumer

**File:** `server/prompts/v2/basic-analysis-prompt.txt:430`

**Issue:** The basic prompt's "CUÁNDO RECOMENDAR UPGRADE" section instructs the model to optionally append:
```json
"nota_upgrade": "Este análisis identificó X hallazgos cubriendo ~30% del contrato..."
```
This field is absent from `AnalysisSummary` in `types/index.ts`. No page, component, or API route references `nota_upgrade`. The model will produce this field when upgrade conditions are met, but the frontend silently drops it, making the upgrade nudge invisible to users — which undermines the product's monetization strategy.

**Fix:** Add the field to the type and wire it to the UI:
```typescript
// In AnalysisSummary
nota_upgrade?: string;
```
Then display the value in the analysis results page when present.

---

## Info

### IN-01: `_debug` field typed as `any` loses all type safety

**File:** `types/index.ts:87`

**Issue:** `_debug?: any` defeats TypeScript's strict typing for the entire debug payload. The debug structure is well-defined across all three prompts (timestamp, model_used, prompt_version, tier, preprocessing, and for forensic: coverage_verification). Typing it as `any` means any code reading `_debug.model_used` or `_debug.coverage_verification.clausesAnalyzed` is unchecked.

**Fix:** Define a typed interface:
```typescript
export interface AnalysisDebugInfo {
  timestamp: string;
  model_used: string;
  prompt_version: string;
  tier: "basic" | "premium" | "forensic";
  preprocessing: {
    truncated: boolean;
    originalTokens: number;
    processedTokens: number;
    relevantSections?: string[];
    chunking_applied?: boolean;
    totalParagraphs?: number;
    totalClauses?: number;
  };
  coverage_verification?: { // Forensic-only
    paragraphsAnalyzed: number;
    paragraphsTotal: number;
    clausesAnalyzed: number;
    clausesTotal: number;
    crossReferencesFollowed: number;
    coveragePercentage: string;
  };
  usage?: object;
}
// In AnalysisSummary:
_debug?: AnalysisDebugInfo;
```

---

### IN-02: Hardcoded example timestamp `"2025-01-31T10:30:00Z"` in all three prompt JSON examples

**File:** `server/prompts/v2/basic-analysis-prompt.txt:155`, `server/prompts/v2/analysis-prompt.txt:229`, `server/prompts/v2/forensic-analysis-prompt.txt:215`

**Issue:** All three prompt examples show the same hardcoded past timestamp. While `openai-client.ts:284` overwrites `_debug.timestamp` with `new Date().toISOString()` server-side, the example still trains the model to output a static string. If the server-side override is ever removed or the path to `_debug` changes, analyses will contain a stale 2025 timestamp that is hard to detect as wrong.

**Fix:** Replace with a clearly labeled placeholder in all three examples:
```json
"timestamp": "<ISO8601 timestamp of analysis>"
```

---

### IN-03: Premium prompt `## CHECKLIST` says "6 campos requeridos" but lists 7 fields

**File:** `server/prompts/v2/analysis-prompt.txt:459`

**Issue:** The premium quality checklist states:
> `Cada hallazgo tiene los 6 campos requeridos (color, título, cláusula, cita, explicación, riesgo, mitigación)`

The parenthetical lists 7 fields. This is a minor authoring error but could cause a model to consider a hallazgo valid with only 6 of the 7 fields, omitting one silently.

**Fix:** Correct the count:
```
- [ ] Cada hallazgo tiene los 7 campos requeridos (color, titulo, clausula, cita_textual, explicacion, riesgo_real, mitigacion)
```

---

_Reviewed: 2026-05-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
