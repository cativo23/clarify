# Phase 12: Analysis Results UI & Confidence Signals - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-25
**Phase:** 12-Analysis Results UI & Confidence Signals
**Areas discussed:** Card collapse behavior, Sidebar section index structure, Risk score & category breakdown display, Certainty badges & backward compatibility

---

## Card collapse behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Badge + category only | Collapsed shows icon+category+badge only; description hidden until expanded | |
| Badge + category + description | Collapsed shows everything RiskCard shows today plus the certainty badge | ✓ |

**User's choice:** Badge + category + description (current-ish)
**Notes:** Description stays visible when collapsed; only clausula/cita_textual/riesgo_real/mitigacion behavior needed further discussion (see below).

### Follow-up: quoted source clause visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible, not collapsible | cita_textual shows under the description even when collapsed | ✓ |
| Keep collapsible with other details | cita_textual stays inside the expandable details section | |

**User's choice:** Asked for Claude's recommendation ("suggestion?"), then confirmed "Always visible" after Claude recommended it.
**Notes:** Rationale: RESULT-03 requires the quote "alongside the explanation" for verification — hiding it behind a toggle undercuts the phase's confidence-signal purpose.

---

## Sidebar section index structure

| Option | Description | Selected |
|--------|-------------|----------|
| By risk category | Groups by categoria_riesgo, uniform across all 3 tiers | ✓ |
| By document structure when available, else category | Forensic uses mapa_estructural, Basic/Premium fall back to category | |

**User's choice:** By risk category (Financiero, Datos, etc.)
**Notes:** Simpler, consistent behavior across tiers since categoria_riesgo exists on every finding (Phase 11 D-08/D-09).

### Follow-up: fallback for findings without categoria_riesgo

| Option | Description | Selected |
|--------|-------------|----------|
| Group under a single 'General' bucket | | |
| Hide sidebar entirely for old records | | |

**User's choice:** Neither — "no hemos hecho deploy, asi que podemos asumir que nunca existieron" (nothing is deployed yet, so we can assume such records never existed).
**Notes:** No backward-compatibility fallback needed. Simplified D-03 in CONTEXT.md and removed the same concern from the certainty-badge discussion area.

---

## Risk score & category breakdown display

| Option | Description | Selected |
|--------|-------------|----------|
| Replace Metricas panel | Single panel: score + breakdown, no redundant counts | (superseded) |
| Add new panel beside Metricas | Two panels: new score panel + old Metricas panel kept | (superseded) |
| Combined single panel (score + severity pills + breakdown + coverage) | Claude-proposed merge after user asked "combined?" | ✓ |

**User's choice:** Combined single panel, confirmed after viewing a rendered HTML mockup (real data: puntaje_riesgo 7/10, desglose_riesgo {Financiero:3, Datos:2, Responsabilidad:1}, coverage 96%) opened locally in Brave.
**Notes:** User first asked to see the two original options as an actual rendered page rather than ASCII/text descriptions. Claude built and screenshotted an HTML mockup styled to match the app's real Tailwind tokens (`risk.high/medium/low`, `secondary` #00dc82), then opened it in the user's Brave browser via a local file:// URL. After seeing both options, user asked "combined?" — Claude proposed folding the old rojas/amarillas/verdes counts into the same panel as severity pills next to the score, built and rendered that mockup too, and the user confirmed it.

---

## Certainty badges & backward compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Inline pill next to category title | Compact header, badge and risk icon side by side | ✓ |
| Separate line under risk label | Three signals stacked vertically | |

**User's choice:** Asked for Claude's recommendation ("sugsstion?"), then confirmed "Yes, inline pill" after Claude recommended it.
**Notes:** Backward-compatibility half of this area was already resolved by the sidebar-index follow-up above (no legacy data exists pre-deploy).

---

## Claude's Discretion

- Exact bar-sizing formula for the category breakdown (relative to max vs. total).
- Whether the severity pills row wraps or the whole header stacks on narrow viewports.
- Exact certainty badge visual treatment (filled vs. outlined) — check `AnalysisStatusBadge.vue` for existing convention.

## Deferred Ideas

None — discussion stayed within phase scope.
