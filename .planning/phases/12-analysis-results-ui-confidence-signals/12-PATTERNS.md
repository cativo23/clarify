# Phase 12: Analysis Results UI & Confidence Signals - Pattern Map

**Mapped:** 2026-09-25
**Files analyzed:** 4 (2 modified, 1-2 new components)
**Analogs found:** 4 / 4 (all in-place modifications or near-identical siblings — no true "no analog" files this phase)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `components/RiskCard.vue` (modified) | component | request-response (props-in, template-out) | itself (existing file, in-place edit) | exact |
| `pages/analyze/[id].vue` (modified — Métricas panel replaced, sidebar added) | component (page) | request-response | itself (existing file, in-place edit) | exact |
| `components/CertaintyBadge.vue` (new, likely name) | component | request-response | `components/AnalysisStatusBadge.vue` | exact (pill/badge role) |
| `components/analysis/RiskScorePanel.vue` or inline block in page (new — combined score+breakdown+coverage panel) | component | request-response (transform: `desglose_riesgo` → bar widths) | `pages/analyze/[id].vue` Métricas panel (lines 397-484, being replaced) + `components/analysis/CrossClauseAnalysis.vue` (panel chrome precedent) | role-match |
| Sidebar section index (new — likely `components/analysis/ReportSidebar.vue` or inline in page) | component | request-response (transform: group `hallazgos` by `categoria_riesgo`) | No direct grouped-nav analog exists; closest structural precedent is the Métricas panel's `slate-900` card chrome and `RiskCard`'s label typography | partial (see "No Analog Found") |

## Pattern Assignments

### `components/RiskCard.vue` (component, request-response) — MODIFY

**Analog:** itself, current state at `/home/cativo23/projects/personal/clarify/components/RiskCard.vue`

**Props pattern** (lines 184-193):
```typescript
const props = defineProps<{
  category: string;
  description: string;
  risk: RiskLevel;
  clausula?: string | undefined;
  citaTextual?: string | undefined;
  riesgoReal?: string | undefined;
  mitigacion?: string | undefined;
  details?: string | undefined;
}>();
```
Add `confianza?: "Alta" | "Media" | "Baja" | undefined` following the exact same optional-prop convention.

**Header row where the certainty pill must be inserted inline next to category title** (lines 51-64):
```html
<div class="flex-1">
  <h3 class="text-xl font-black text-slate-900 dark:text-white mb-1">
    {{ category }}
  </h3>
  <p :class="['text-xs font-black uppercase tracking-widest', riskColorClasses.text]">
    {{ riskLabel }}
  </p>
</div>
```
Per D-07, the pill goes next to the title (same row), not stacked — wrap `{{ category }}` and a new `<CertaintyBadge :confianza="confianza" />` in a flex row inside the `<h3>`'s parent.

**cita_textual block to relocate out of the collapsible `v-if="isExpanded"` section** (lines 141-164): this exact markup (the quote-mark SVG + italic quoted text block) must move to always-visible, directly under the description paragraph (after line 69), per D-05. Leave the `v-if="props.citaTextual"` guard (covers the "partial" UI-spec case — omit entirely when absent, no placeholder).

**Description block, insertion point for the always-visible quote** (lines 66-69):
```html
<p class="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-lg">
  {{ description }}
</p>
```

**Details/collapsible pattern to leave unchanged** (lines 72-176): `clausula`, `riesgoReal`, `mitigacion` stay inside the existing `v-if="isExpanded"` block per D-06 — do not touch this structure beyond removing the `citaTextual` sub-block.

**Risk color computed pattern** (lines 210-233) — reuse verbatim as the model for any new risk-based color computed properties elsewhere:
```typescript
const riskColorClasses = computed(() => {
  switch (props.risk) {
    case "high": return { bg: "bg-risk-high", text: "text-risk-high" };
    case "medium": return { bg: "bg-risk-medium", text: "text-risk-medium" };
    case "low": return { bg: "bg-risk-low", text: "text-risk-low" };
    default: return { bg: "bg-primary-500", text: "text-primary-500" };
  }
});
```

---

### `components/CertaintyBadge.vue` (new component, request-response)

**Analog:** `components/AnalysisStatusBadge.vue`

**Full pill structure to copy** (lines 1-14):
```html
<template>
  <span
    class="inline-flex items-center gap-2 rounded-full font-black uppercase tracking-wider"
    :class="[sizeClasses, statusBgClass, statusTextClass]"
  >
    <span class="rounded-full" :class="[dotSizeClass, statusColorClass, pulseClass]"></span>
    <span class="whitespace-nowrap">{{ statusLabel }}</span>
  </span>
</template>
```
Per UI-SPEC, the new certainty badge drops the status dot (not a live/active-state indicator) — omit the dot `<span>` and the pulse logic entirely. Keep the outer pill `<span>` structure and class-binding pattern.

**Size variant pattern to reuse exactly** (lines 46-57, `sm` case only is needed):
```typescript
const sizeClasses = computed(() => {
  switch (props.size) {
    case "sm": return "px-2 py-0.5 text-[9px]";
    // ...
  }
});
```
UI-SPEC mandates the `sm` variant (`px-2 py-0.5 text-[9px]`) since the badge sits inline next to the RiskCard title — hardcode this rather than building a full size-variant system (no other size is used in this phase).

**Props pattern to follow** (lines 27-37) — adapt for a single `confianza` prop, no `size`/`showPulse` needed since only `sm` is used:
```typescript
const props = defineProps<{ confianza: "Alta" | "Media" | "Baja" }>();
```

**Color mapping — do NOT reuse `useAnalysisStatus` composable** (lines 17-23, 40-43); certainty colors are a new, phase-specific mapping (per UI-SPEC "Certainty badge color mapping" table), computed locally in the new component:
```typescript
// Alta:  bg-accent-indigo/10 text-accent-indigo dark:text-indigo-300
// Media: bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300
// Baja:  border border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500
```

---

### `pages/analyze/[id].vue` — Combined Risk Panel (component, request-response) — REPLACES Métricas panel

**Analog:** the very panel being replaced, `/home/cativo23/projects/personal/clarify/pages/analyze/[id].vue` lines 397-484 (dark-chrome card + bar-per-metric pattern) — reuse its visual chrome and bar-rendering mechanics, restructure per D-08 layout.

**Panel chrome to keep** (lines 397-407):
```html
<div class="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
  <div class="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
  <h3 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">
    Métricas
  </h3>
  ...
</div>
```
Note: per D-08 the header becomes the score+label+severity-pills row (not a centered "Métricas" title) — the outer card chrome (`bg-slate-900 rounded-3xl border-slate-800 shadow-2xl` + blur decoration) is reused, but internal header structure changes.

**Bar-rendering mechanics to copy and adapt for category breakdown** (lines 408-471 — one bar block shown, repeat pattern per row):
```html
<div class="flex justify-between items-center group">
  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Críticos</span>
  <div class="flex items-center gap-3">
    <div class="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div class="h-full bg-risk-high" :style="{ width: `${pct}%` }"></div>
    </div>
    <span class="text-sm font-black text-white">{{ count }}</span>
  </div>
</div>
```
For the new category-breakdown bars (`desglose_riesgo`), swap `bg-risk-high` for `bg-secondary` fill on `bg-slate-800` track per D-10, and compute `width` as `count / max(...) * 100` with a 6% floor (per UI-SPEC zero-one-many resolution), iterating `Object.entries(summary.desglose_riesgo)` with `v-for` instead of three hardcoded rows.

**Coverage row to keep at the bottom, unchanged copy/binding** (lines 472-483):
```html
<div class="pt-6 border-t border-slate-800 flex justify-between items-center">
  <span class="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Cobertura</span>
  <span class="text-xl font-black text-secondary">{{ summary.metricas.porcentaje_clausulas_analizadas }}</span>
</div>
```
Reuse verbatim, just repositioned to sit after the divider below the breakdown bars per D-08 layout order.

**New header row (score + label + severity pills)** — no direct analog exists in the current panel; compose from:
- Display-size number: use `text-[48px] font-black` per UI-SPEC typography table (new — no existing 48px usage in this panel, will be the first Display-role element).
- Risk label color: reuse `riskColorClasses`-style computed from `RiskCard.vue` (lines 210-233) keyed off `puntaje_riesgo`/`nivel_riesgo_general` instead of `props.risk`.
- Severity pills (Críticos/Alertas/Seguros counts): reuse the old bar-row's count display (`text-sm font-black text-white`) but render as pills — `AnalysisStatusBadge.vue`'s pill shell (lines 1-14, dot removed) is the closest existing pill-shape precedent.
- `flex-wrap` on the pills row per UI-SPEC point 2 (severity pills wrap <640px, score/label block does not).

**RiskCard loop invocation to modify** (lines 530-546) — add `:confianza="hallazgo.confianza"` prop:
```html
<RiskCard
  v-for="(hallazgo, index) in summary.hallazgos"
  :key="index"
  :category="hallazgo.titulo"
  :description="hallazgo.explicacion"
  :risk="hallazgo.color === 'rojo' ? 'high' : hallazgo.color === 'amarillo' ? 'medium' : 'low'"
  :clausula="hallazgo.clausula"
  :cita-textual="hallazgo.cita_textual"
  :riesgo-real="hallazgo.riesgo_real"
  :mitigacion="hallazgo.mitigacion"
  :confianza="hallazgo.confianza"
/>
```

---

### Sidebar Section Index (new — component or inline block)

**No direct analog** for a grouped-navigation sidebar exists anywhere in the codebase (confirmed via search of `components/` and `pages/analyze/`). Build from:
- Panel chrome precedent: `components/analysis/CrossClauseAnalysis.vue` / `CriticalOmissions.vue` / `StructuralMap.vue` establish `rounded-[2rem]`, `border-slate-100 dark:border-slate-800`, `shadow-soft` panel styling (per CONTEXT.md code_context) — read one of these three for the exact panel-wrapper markup before building the sidebar container.
- Label typography: reuse `text-[10px] font-black uppercase tracking-widest text-slate-400` (seen throughout `RiskCard.vue` lines 385-387, 411-412, etc.) for `{categoria_riesgo} ({count})` link labels.
- Scroll-to-anchor interaction (D-02): no existing `scrollIntoView` usage in the page — implement fresh using `summary.hallazgos.find(h => h.categoria_riesgo === category)` plus a `ref`/`id` per finding in the `v-for` loop (line 530 area), matching `animate-fade-in`/`animate-slide-up` motion classes already used elsewhere in the page (lines 45, 218, 490, 109 in RiskCard.vue).

## Shared Patterns

### Panel Chrome (dark variant)
**Source:** `pages/analyze/[id].vue` lines 397-401
**Apply to:** Combined risk panel
```html
<div class="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
  <div class="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
```

### Panel Chrome (light/card variant)
**Source:** `components/RiskCard.vue` line 3
**Apply to:** Sidebar container, any new light-surface panel
```html
class="bg-white dark:bg-slate-900 rounded-[2rem] shadow-soft hover:shadow-premium transition-all duration-300 p-8 border border-slate-100 dark:border-slate-800"
```

### Label Typography
**Source:** used throughout `RiskCard.vue` and the Métricas panel (e.g. lines 385-387, 411-412, 475-477)
**Apply to:** sidebar labels, certainty badge text, breakdown-bar category names, coverage caption
```
text-[10px] font-black uppercase tracking-widest text-slate-400
```

### Risk-color-to-Tailwind-class switch pattern
**Source:** `components/RiskCard.vue` lines 210-233 (`riskColorClasses` computed)
**Apply to:** Combined risk panel's score/label color, any new risk-keyed color logic
```typescript
computed(() => {
  switch (riskKey) {
    case "high": return "risk-high";
    case "medium": return "risk-medium";
    case "low": return "risk-low";
  }
});
```

### Pill/Badge Shell (dot-less variant)
**Source:** `components/AnalysisStatusBadge.vue` lines 1-14, 46-57
**Apply to:** `CertaintyBadge.vue`
```html
<span class="inline-flex items-center gap-2 rounded-full font-black uppercase tracking-wider" :class="[sizeClasses, bgClass, textClass]">
  <span class="whitespace-nowrap">{{ label }}</span>
</span>
```
sizeClasses `sm`: `px-2 py-0.5 text-[9px]`

### Conditional-section omit pattern (no placeholder)
**Source:** `components/RiskCard.vue` lines 111, 121, 131, 141, 166 (`v-if="props.X"` per optional field)
**Apply to:** `cita_textual` always-visible block (omit entirely when absent, per UI-SPEC "partial" resolution), sidebar (only render categories present in `desglose_riesgo`)

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Sidebar section index (grouped-by-category nav) | component | request-response + scroll-interaction | No existing grouped/anchor-nav component in codebase; compose from panel chrome + label typography patterns above and the D-02/UI-SPEC scroll-interaction spec directly — RESEARCH.md not available this phase (skipped), so no external reference either. |

## Metadata

**Analog search scope:** `components/`, `components/analysis/`, `pages/analyze/[id].vue`, `types/index.ts`, `tailwind.config.js`
**Files scanned:** `RiskCard.vue`, `AnalysisStatusBadge.vue`, `pages/analyze/[id].vue`, `CrossClauseAnalysis.vue` (referenced, not deep-read — chrome precedent only), `types/index.ts`, `tailwind.config.js`
**Pattern extraction date:** 2026-09-25
