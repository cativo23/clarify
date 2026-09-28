# Phase 12: Analysis Results UI & Confidence Signals - Context

**Gathered:** 2026-09-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the flat analysis report (`pages/analyze/[id].vue`) into a navigable, trust-building reading experience: a sidebar section index, collapsible clause finding cards with always-visible quoted source text, an overall risk score with category breakdown, per-clause certainty badges, and a visible coverage percentage. Consumes the structured fields Phase 11 added to the analysis JSON (`confianza`, `categoria_riesgo`, `puntaje_riesgo`, `desglose_riesgo`).

No backend/prompt changes in this phase — pure frontend consumption of fields Phase 11 already emits. No analyses have been deployed to production yet, so there is no legacy-record backward-compatibility concern to design for.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Section Index (RESULT-01)

- **D-01:** The sidebar index groups findings by `categoria_riesgo` (Financiero, Datos, Derechos, Responsabilidad, Disputas, Modificaciones, Otro) — not by document structure. This is uniform across all three tiers since every finding has `categoria_riesgo` (Phase 11, D-08/D-09), unlike `mapa_estructural` which is Forensic-only.
- **D-02:** Clicking a category in the sidebar scrolls the report to the first finding in that category.
- **D-03:** No fallback design needed for findings without `categoria_riesgo` — nothing is deployed yet, so no pre-Phase-11 records exist to degrade gracefully.

### Clause Finding Card Collapse Behavior (RESULT-02)

- **D-04:** Collapsed card shows: risk-color icon, category title, description (current RiskCard content) plus the new certainty badge — same visible content as today's card, just with the badge added.
- **D-05:** `cita_textual` (AI-quoted source clause) moves OUT of the collapsible details section and is always visible under the description, even when collapsed. Rationale: RESULT-03 requires the quote to sit "alongside the explanation" so users can verify the AI's claim without an extra click — hiding it behind a toggle undercuts the confidence-signal purpose of this phase.
- **D-06:** `clausula`, `riesgo_real`, and `mitigacion` (interpretation/mitigation — not source evidence) stay behind the existing "Ver más detalles" collapsible toggle, unchanged from today.

### Certainty Badge (CONF-02)

- **D-07:** The certainty badge (Alta/Media/Baja from `confianza`) renders as an inline pill next to the category title in the card header — not stacked on a separate line. Risk color/icon (severity) and the certainty pill (confidence) are independent signals that read fine side by side; stacking them adds vertical bulk without adding clarity.

### Risk Score & Category Breakdown (CONF-01, CONF-03)

- **D-08:** The existing "Métricas" panel is replaced by a single combined panel — confirmed against a rendered mockup. Layout, top to bottom:
  1. Header row: `puntaje_riesgo` (0–10, large number) + risk label (e.g. "⚠ Riesgo Alto", colored per Phase 11 D-03 anchors) on the left; three severity pills (Críticos / Alertas / Seguros — the old rojas/amarillas/verdes counts) on the right.
  2. Category breakdown: one bar per `desglose_riesgo` category, sized relative to the max category count, with the count shown at the end of each bar.
  3. Divider, then coverage percentage (`porcentaje_clausulas_analizadas`) pinned at the bottom.
- **D-09:** No information from the old Métricas panel is lost — the rojas/amarillas/verdes counts persist as the severity pills in the new panel's header row.
- **D-10:** Color/style tokens: risk label and pills use the existing `risk.high` (#ef4444) / `risk.medium` (#f59e0b) / `risk.low` (#10b981) Tailwind tokens (`tailwind.config.js`); breakdown bars use `secondary` (#00dc82, Nuxt Green) fills on `slate-800` tracks, matching the existing panel's visual language exactly.

### Claude's Discretion

- Exact bar-sizing formula for the category breakdown (relative to max count vs. relative to total findings) — pick whichever renders better with real data ranges.
- Whether the severity pills row wraps to a second line on narrow viewports, or the whole header row stacks vertically (mockup handles this at ~500px, but implementation may refine further).
- Exact badge visual treatment for `confianza` (background-filled pill vs. outlined) — pick whichever the existing badge/pill conventions in the codebase already establish (check `AnalysisStatusBadge.vue` for precedent).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 11 output (data contract this phase consumes)
- `.planning/phases/11-prompt-engineering/11-CONTEXT.md` — full field definitions: `confianza` calibration (D-05/D-06), `categoria_riesgo` enum (D-08/D-09), `puntaje_riesgo` scoring anchors (D-01/D-03), `desglose_riesgo` structure (D-04).
- `types/index.ts` — `Hallazgo` and `AnalysisSummary` interfaces; new fields are optional (`confianza?`, `categoria_riesgo?`, `puntaje_riesgo?`, `desglose_riesgo?`).

### Requirements
- `.planning/REQUIREMENTS.md` — RESULT-01/02/03, CONF-01/02/03 definitions.
- `.planning/ROADMAP.md` — Phase 12 section, success criteria.

### Design tokens
- `tailwind.config.js` — `risk.high/medium/low`, `secondary` color tokens; `soft`/`premium`/`glow` shadow tokens used throughout the report page.

No external specs beyond the above — requirements and design decisions are fully captured here and in Phase 11's CONTEXT.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pages/analyze/[id].vue` — the report page. Métricas panel (~lines 395-478) is replaced per D-08. `RiskCard` loop (~lines 531-545) needs the certainty badge prop and `cita_textual` relocated to always-visible.
- `components/RiskCard.vue` — already has expand/collapse (`isExpanded`) for `clausula`/`citaTextual`/`riesgoReal`/`mitigacion`. Needs: certainty badge prop + inline pill rendering (D-07), `citaTextual` pulled out of the `v-if` details block into always-visible markup (D-05).
- `components/AnalysisStatusBadge.vue` — existing badge/pill component; check its styling convention before building the new certainty pill (Claude's Discretion above).
- `components/analysis/CrossClauseAnalysis.vue`, `CriticalOmissions.vue`, `StructuralMap.vue` — Forensic-only sections rendered after the main findings grid; unaffected by this phase's scope but establish the existing panel styling pattern (`rounded-[2rem]`, `border-slate-100 dark:border-slate-800`, `shadow-soft`).

### Established Patterns
- Panels use `bg-white dark:bg-slate-900 rounded-[2rem] border ... shadow-soft`, section labels use `text-[10px] font-black uppercase tracking-widest text-slate-400`.
- Risk color classes come from Tailwind's `risk.high/medium/low` tokens (`tailwind.config.js`), already used for bars and icons in the current Métricas panel and RiskCard.
- `summary.hallazgos` is the array driving the findings grid; `summary.metricas` holds the existing counts/coverage; new top-level fields (`puntaje_riesgo`, `desglose_riesgo`) sit alongside `nivel_riesgo_general` per Phase 11 D-02.

### Integration Points
- The sidebar index (new) needs a way to scroll to and highlight a given category's first finding — likely an anchor/ref per category on the findings grid, since findings aren't currently grouped by category in the DOM (they render in `summary.hallazgos` array order).
- `isForensic` flag already gates Forensic-only sections; the new combined risk panel and sidebar are tier-agnostic (all fields are shared per Phase 11 D-06, D-08/D-09).

</code_context>

<specifics>
## Specific Ideas

- Combined risk panel layout was validated against a rendered HTML mockup (score + risk label left, severity pills right, category breakdown bars, coverage at bottom) — Carlos confirmed this exact layout after seeing it rendered in-browser with real data (puntaje_riesgo 7/10, desglose_riesgo {Financiero: 3, Datos: 2, Responsabilidad: 1}, coverage 96%).
- Quoted source clause text must be verifiable without a click — this was the deciding rationale for pulling `cita_textual` out of the collapsible section.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-Analysis Results UI & Confidence Signals*
*Context gathered: 2026-09-25*
