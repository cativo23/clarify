# Phase 11: Prompt Engineering - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade all three analysis tier prompts (Basic, Premium, Forensic) to emit structured clause-level data that Phase 12's UI can consume directly: per-clause certainty ratings (`confianza`), risk category tags (`categoria_riesgo`), a numeric risk score with category breakdown (`puntaje_riesgo` + `desglose_riesgo`), and a richer coverage structure for the Forensic tier.

Phase 11 is prompt-only (backend). No UI changes, no DB schema changes. New JSON fields are additive — older analysis records stored in the DB without these fields must degrade gracefully in Phase 12's UI (optional fields pattern).

</domain>

<decisions>
## Implementation Decisions

### Risk Score (0-10)

- **D-01:** The LLM computes `puntaje_riesgo` (0-10 integer) and emits it in the JSON. More nuanced than a formula — weighs severity + context. All three tier prompts must include this field.
- **D-02:** `puntaje_riesgo` and `desglose_riesgo` live at the **top level** of the JSON, alongside `nivel_riesgo_general`. Not inside `metricas`.
- **D-03:** The prompt defines explicit scoring anchors for consistent calibration:
  - 0–2: No critical findings, at most 2 amarillas
  - 3–5: 1–2 rojas OR more than 5 amarillas
  - 6–8: 3+ rojas OR 1 roja extrema
  - 9–10: Multiple extreme reds (data sale, total lawsuit waiver, fund confiscation)
  - Score MUST be consistent with `nivel_riesgo_general`.
- **D-04:** `desglose_riesgo` is a top-level object mapping each `categoria_riesgo` to a count of findings in that category (red + yellow count). Example: `{"Financiero": 3, "Datos": 2, "Derechos": 1}`.

### Certainty (confianza) per Hallazgo

- **D-05:** `confianza` represents the AI's confidence in the risk classification (not contract language clarity). Alta = AI is sure this is a real risk. Baja = vague or ambiguous clause, AI less certain it's actually problematic.
- **D-06:** All tiers include `confianza` on every `hallazgo` entry.
- **D-07:** The prompt defines explicit calibration rules for `confianza`:
  - **Alta**: Clause is explicit and unambiguous. Risk is clear without additional context. Example: "Se cobrará automáticamente al renovarse."
  - **Media**: Clause is general or conditional. Risk depends on specific circumstances. Example: "Podemos modificar los términos en cualquier momento según consideremos necesario."
  - **Baja**: Vague, incomplete, or requires legal interpretation to determine risk. Example: "Sujeto a términos adicionales aplicables."

### Risk Category Taxonomy

- **D-08:** `categoria_riesgo` on each `hallazgo` is a **controlled Spanish enum**. LLM must pick from the fixed list — no freeform values. Enables reliable `desglose_riesgo` aggregation in Phase 12.
- **D-09:** Controlled enum values:
  - `"Financiero"` — pricing, payments, penalties, renewals
  - `"Datos"` — data collection, transfer, use, retention, privacy
  - `"Derechos"` — user rights, class action waivers, data portability
  - `"Responsabilidad"` — liability limits, warranties, indemnification
  - `"Disputas"` — arbitration, jurisdiction, applicable law
  - `"Modificaciones"` — unilateral changes to terms
  - `"Otro"` — catch-all for findings that don't fit above categories
- **D-10:** GRIS (neutral/procedural) findings also get a `categoria_riesgo` field — assign the most relevant category even if the risk is neutral.

### Coverage Structure (PROMPT-03)

- **D-11:** **Forensic tier** emits a richer coverage structure with numeric fields in `metricas`:
  - `clausulas_analizadas` (number)
  - `clausulas_total` (number)
  - `porcentaje_clausulas_analizadas` (string, e.g., `"96%"`)
- **D-12:** **Basic and Premium** tiers keep the existing `porcentaje_clausulas_analizadas` string field unchanged — no structural change needed.
- **D-13:** The Forensic `_debug.coverage_verification` block already tracks `clausesAnalyzed` / `clausesTotal` — the new `metricas` fields should match those values for consistency.

### Backward Compatibility

- **D-14:** All new fields (`confianza`, `categoria_riesgo`, `puntaje_riesgo`, `desglose_riesgo`) must be added as **optional** to the TypeScript `Hallazgo` interface and `AnalysisSummary` interface in `types/index.ts`. Old stored analyses without these fields must not break Phase 12's UI.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prompt Files (primary targets for this phase)
- `server/prompts/v2/basic-analysis-prompt.txt` — Basic tier prompt (gpt-4o-mini, 25-40% coverage). Add `confianza`, `categoria_riesgo`, `puntaje_riesgo`, `desglose_riesgo`.
- `server/prompts/v2/analysis-prompt.txt` — Premium tier prompt (gpt-5-mini, 70-85% coverage). Same new fields.
- `server/prompts/v2/forensic-analysis-prompt.txt` — Forensic tier prompt (gpt-5, 95-100% coverage). Same new fields + richer `metricas.clausulas_analizadas` / `clausulas_total`.

### Type Definitions
- `types/index.ts` — `Hallazgo`, `AnalysisSummary` interfaces. New fields must be added as optional (`?`). Existing fields must not be removed.

### Analysis Processing
- `server/utils/openai-client.ts` — `analyzeContract()` function. Handles prompt loading, preprocessing, JSON parsing, and `_debug` attachment. No logic changes expected — just prompt content changes.

### Requirements
- `.planning/REQUIREMENTS.md` — PROMPT-02 and PROMPT-03 definitions (the two requirements this phase closes).
- `.planning/ROADMAP.md` — Phase 11 success criteria (all 4 criteria reference the new structured fields).

### No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/prompts/v2/` — All three prompts already use strict JSON output format with a quality checklist and token management sections. New fields slot into existing `hallazgos` array and `metricas` object.
- `types/index.ts:121` — `Hallazgo` interface. Add `confianza?: "Alta" | "Media" | "Baja"` and `categoria_riesgo?: string` as optional fields.
- `types/index.ts:52` — `AnalysisSummary` interface. Add `puntaje_riesgo?: number` and `desglose_riesgo?: Record<string, number>` at top level.

### Established Patterns
- Prompts are `.txt` files loaded via `fs.readFile` at runtime — changes take effect immediately without code deploys (only prompt file changes required).
- JSON output in prompts uses explicit `CRITICAL: JSON must always be valid` enforcement + graceful close-under-token-limit pattern. New fields must follow the same pattern (add them early in the JSON so they're emitted even if truncated).
- The `porcentaje_clausulas_analizadas` field already exists in all tiers — Forensic just adds numeric siblings.
- Token budget is tight on Basic (1,500-2,500 output). New fields are short (3-4 chars each) — minimal token impact.

### Integration Points
- `server/utils/openai-client.ts` passes the raw parsed JSON result through without field validation — new fields are transparent to the pipeline.
- `server/plugins/worker.ts` stores the raw result in Supabase — no changes needed there.
- Phase 12 will read `confianza`, `categoria_riesgo`, `puntaje_riesgo`, `desglose_riesgo` from stored analysis results. Fields are optional so old records degrade gracefully.

</code_context>

<specifics>
## Specific Ideas

- Scoring anchors in the prompt should explicitly name "extreme red" examples: data sale without opt-out, total lawsuit waiver, fund confiscation — Carlos confirmed this language in D-03.
- The `confianza` calibration examples in the prompt should use Spanish contract language patterns (not English), consistent with the existing prompts.
- `desglose_riesgo` should count findings by `categoria_riesgo` across all finding colors (red + yellow at minimum — decide at implementation time whether to include green/grey in the count or only risk-bearing findings).
- Forensic's `mapa_estructural.secciones[].riesgo` already provides a section-level color — this is separate from per-clause `categoria_riesgo` and does not need to change.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-Prompt Engineering*
*Context gathered: 2026-05-07*
