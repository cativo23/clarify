# Phase 11: Prompt Engineering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 11-prompt-engineering
**Areas discussed:** Risk Score (0-10), Certainty (confianza), Risk Category Taxonomy, Coverage (PROMPT-03)

---

## Risk Score (0-10)

### Where should the score come from?

| Option | Description | Selected |
|--------|-------------|----------|
| LLM computes it | Prompt instructs AI to emit puntaje_riesgo (0-10). More nuanced — LLM weighs severity + context. | ✓ |
| Backend derives it | Backend computes from reds × weight + yellows × weight. Deterministic but less nuanced. | |

**User's choice:** LLM computes it

---

### Where should puntaje_riesgo and desglose_riesgo live?

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level, alongside nivel_riesgo_general | Keeps main risk signals together at top. Phase 12 finds them without drilling into metricas. | ✓ |
| Inside metricas object | Groups all numeric stats. More consistent, but Phase 12 digs deeper. | |

**User's choice:** Top-level

---

### How much scoring guidance in the prompt?

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit anchors | Defines 0-2/3-5/6-8/9-10 bands with criteria. Consistent calibration. | ✓ |
| You decide | Claude defines rough scale per prompt. | |

**User's choice:** Explicit anchors (0-2 = low, 3-5 = medium, 6-8 = high, 9-10 = critical with named extremes)

---

## Certainty (confianza)

### What should confianza represent?

| Option | Description | Selected |
|--------|-------------|----------|
| AI confidence in risk classification | Alta = sure it's a real risk. Baja = vague/ambiguous, AI less certain. | ✓ |
| Clarity of contract language | Alta = clause text is clear. More about contract quality than AI confidence. | |
| Both: risk confidence + language clarity | Two sub-fields. More granular but doubles complexity. | |

**User's choice:** AI confidence in the risk classification

---

### Should the prompt give explicit calibration rules?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — explicit calibration rules | Defines Alta/Media/Baja with criteria and Spanish examples. | ✓ |
| You decide | Claude crafts guidance as long as it maps to AI confidence. | |

**User's choice:** Explicit rules with Spanish examples for each level

---

## Risk Category Taxonomy

### Controlled enum vs freeform?

| Option | Description | Selected |
|--------|-------------|----------|
| Controlled enum — fixed Spanish list | LLM must pick from defined list. Enables consistent desglose_riesgo. | ✓ |
| Freeform | LLM decides label. Fragile aggregation ("Económico" vs "Financiero"). | |

**User's choice:** Controlled Spanish enum

---

### Is the proposed list correct?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, list is correct | Financiero, Datos, Derechos, Responsabilidad, Disputas, Modificaciones, Otro | ✓ |
| Add Privacidad separate from Datos | Split Datos into Datos + Privacidad (8 categories). | |
| You decide the final list | Claude finalizes based on prompt structure. | |

**User's choice:** The 7-category list is correct as proposed

---

## Coverage (PROMPT-03)

### Existing string vs richer Forensic structure?

| Option | Description | Selected |
|--------|-------------|----------|
| Richer structure for Forensic only | Forensic adds clausulas_analizadas + clausulas_total. Basic/Premium unchanged. | ✓ |
| Keep existing string for all tiers | porcentaje_clausulas_analizadas string is sufficient everywhere. | |

**User's choice:** Richer structure for Forensic tier only

---

## Claude's Discretion

- Whether `desglose_riesgo` counts only red+yellow findings or all finding colors (red+yellow+green+grey) — Carlos left this to implementation judgment.
- Exact token placement of new fields within prompt JSON examples (as long as they appear early enough to survive truncation).

## Deferred Ideas

None — discussion stayed within Phase 11 scope.
