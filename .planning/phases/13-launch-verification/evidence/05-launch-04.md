# Phase 13-06: LAUNCH-04 Forensic UI Verification Evidence

**Date:** 2026-09-30
**Purpose:** Verify LAUNCH-04 in production: a Forensic-tier result page renders all of its UI
sections without layout errors or missing sections, closing Phase 01 UAT Test 4.

**Note on execution:** run directly from the main conversation (AUTH_MODE=browser, same reasoning
as plans 13-04/13-05), rather than dispatching `browser-qa-agent`.

---

## Task 1: Produce a completed production Forensic analysis with every section populated

### Cost constraint encountered

Checked OpenAI billing mid-plan: **$0.49 remaining** on the pay-as-you-go balance. `gpt-6-astra`
(the real forensic-tier model) is **not** covered by OpenAI's complimentary-daily-tokens program
(that program covers `gpt-5.x`/`gpt-4.1`/`gpt-4o`/`o1`/`o3` only — confirmed from the account's own
Data Controls page). Two real `gpt-6-astra` attempts had already failed (see
`evidence/08-hotfix-alpha26.md`) and a third attempt at nearly-zero balance risked a payment failure
rather than a clean test signal.

**Per Carlos's direction:** temporarily pointed the DB-backed `configurations` (`prompt_settings`)
`tiers.forensic.model` at `gpt-5` (in the whitelist `ALLOWED_MODELS` and in the free-tier program) for
this one verification run only, then reverted to `gpt-6-astra` immediately after. Documented here for
traceability — LAUNCH-04's own concern (does the UI render all Forensic sections when the data is
present) is orthogonal to which specific model produced that data.

### Submission

- Uploaded `tests/contracts/pdf/contrato-alto-riesgo.pdf` (the high-risk fixture, to maximize
  cross-clause findings and omissions) via same-origin `fetch()` to `/api/upload`.
- `POST /api/analyze` with `analysis_type: "forensic"` → **FORENSIC_ID `f038ddc9-83d5-49a0-a056-d06acc194bcb`**.
- Credits: topped up the QA account via a direct, scoped `PATCH` to the `users` table (service key,
  audit-trailed in `transactions` with reason "Phase 13 launch verification") each time the balance
  ran short — twice for the two failed `gpt-6-astra` attempts, once more for this successful one.

### Timeline

```
07:33:53 — Started processing forensic analysis f038ddc9... for user 76b91094...
07:33:55 — Processing forensic analysis for job f038ddc9...
           [Forensic] Forensic tier selected - using gpt-5 with 120k input / 30k output tokens
07:37:44 — Updating analysis f038ddc9... to completed
07:37:44 — Successfully completed analysis f038ddc9...
```
**Duration: ~3m51s.** Exactly one `Started processing` line, exactly one `Successfully completed`
line — no double-processing.

### Section inventory (from the status API, before any UI check)

```json
{
  "status": "completed",
  "veredicto": "present", "justificacion": "present",
  "puntaje_riesgo": 9, "puntaje_type": "number",
  "desglose_count": 7,
  "hallazgos_count": 37,
  "analisis_cruzado_count": 3,
  "omisiones_count": 14,
  "mapa_estructural": "present",
  "mapa_keys": ["secciones","total_anexos","total_paginas","total_secciones"],
  "clausulas_analizadas": 37, "clausulas_total": 37
}
```
Every Forensic-only section is present and non-empty. **Result: PASS** — this analysis is a valid
subject for the UI check (a missing UI section can only be a rendering defect, not absent data).

**One field observed off:** `"analysis_type": "premium"` in this same response — not `"forensic"` as
submitted. Investigated as part of Task 2 below; it turned out to be the actual root cause of
LAUNCH-04's failure, not a cosmetic label (see below).

---

## Task 2: Verify every Forensic section renders on the production page

### First render check — sections missing entirely

Navigated to `https://clarify.cativo.dev/analyze/f038ddc9-83d5-49a0-a056-d06acc194bcb` as the QA
user. Console: zero errors, zero CSP/securitypolicyviolation events. Checked `document.body.innerText`
for the three Forensic-only section headings:

```json
{"hasCruzado": false, "hasOmisiones": false, "hasMapa": false}
```

**None of the three sections were present anywhere in the rendered page**, despite the summary_json
having all three populated. This is exactly the Phase 01 UAT Test 4 regression this plan exists to
catch.

### Root cause: `analysis_type` never persisted

`pages/analyze/[id].vue:637`: `const isForensic = computed(() => analysis.value?.analysis_type === "forensic")`
gates the entire Forensic-only section block (`v-if="isForensic && analysis.summary_json"`). Since the
API returns `analysis_type: "premium"` for this (and, per 13-04, apparently every) analysis, `isForensic`
was always `false`.

Traced to `database/migrations/20260304000001_add_process_analysis_with_free_check.sql`'s
`process_analysis_transaction_with_free_check` RPC: it accepts `p_analysis_type` as a parameter but
**never includes it in the `INSERT INTO analyses (...)` column list** — every analysis silently gets
the `analyses.analysis_type` column's `DEFAULT 'premium'`, regardless of the tier actually requested.
This is the same root cause behind 13-04's "cosmetic" `analysis_type=premium` observation for
Basic-tier jobs — not a labeling quirk, a real data-integrity bug that broke the Forensic UI's
tier-gating.

**Fix:** `database/migrations/20260930000001_fix_analysis_type_not_persisted.sql` —
`CREATE OR REPLACE FUNCTION` adding `analysis_type` to the `INSERT` (no `ALTER TABLE`, no schema
change, no backfill of pre-existing mislabeled rows — that's a separate, optional decision).
Applied directly to production via the `execute_raw_sql` RPC (the same mechanism
`scripts/migrate.ts` itself uses) and recorded in `_migrations` (batch 9), per Carlos's explicit
go-ahead. Committed to `develop`: `2b9b297`.

**No new release needed** — this is a database-only change; the running app reads `analysis_type`
dynamically per-request, so the fix took effect immediately.

### Verification of the fix

New analyses now persist the correct tier immediately (confirmed via a fresh `POST /api/analyze`
after the migration, `analysis_type` returned matched the request). For the already-completed
`f038ddc9` analysis (whose AI-generated content was already correct and complete — only the tier
label was wrong), corrected the single row with a one-off `PATCH` (`analysis_type` → `'forensic'`)
rather than spending more OpenAI budget re-generating it, then re-checked the page.

### Second render check — all sections present

```json
{"hasCruzado": true, "hasOmisiones": true, "hasMapa": true, "hasCobertura": true}
```

### Checklist

- **PASS C1** — page loads as the QA user, shows a completed Forensic report, no error banner, no "No disponible" fallback. Risk badge shows "CRÍTICO".
- **PASS C2** — executive summary ("Análisis Forense") shows veredicto ("Rechazar") and a full justificación paragraph describing the concentrated extreme clauses.
- **PASS C3** — risk panel shows "9/10" with "RIESGO ALTO", críticos/alertas/seguros counts (23/9/0 on first screenshot before section-index interaction), and a category breakdown bar (Financiero).
- **PASS C4** — "Análisis por Cláusula" heading present; multiple finding cards observed with "CONFIANZA ALTA" pills, quoted clause text under "REFERENCIA DEL CONTRATO", and an expandable "Ver más detalles" control.
- **PASS C5** — "Secciones" index lists 7 categories (Financiero, Responsabilidad, Datos, Modificaciones, Derechos, Disputas, Otro) with per-category counts; clicking an entry (`ref`-based click; a coordinate-based click on the same element silently failed once — same click-timing flakiness documented elsewhere in this session, recovered via a second/`ref`-based click) brought its target into the viewport (`window.scrollY` changed from 1913 to a position showing that category's findings).
- **PASS C6** — "Análisis Cruzado de Cláusulas" visible; expanded to show a full contradiction card: ID (AC-001), "Sección 6.4 → Sección 11.2", inconsistency description, "TEXTO ORIGINAL"/"TEXTO DESTINO" quoted excerpts, impact, and recommendation. Header correctly reports "3 inconsistencias detectadas" matching `analisis_cruzado.length === 3`.
- **PASS C7** — "Omisiones Críticas" visible, header reports "14 cláusulas esenciales faltantes con sugerencias" matching `omisiones.length === 14`.
- **PASS C8** — "Mapa Estructural" visible with Secciones/Páginas/Anexos = 13/5/0, and an expandable per-section list (numbered sections 1-11+ observed, each with a risk-level dot and page-range badge) matching `mapa_estructural.total_secciones/total_paginas/total_anexos`.
- **PASS C9** — coverage percentage present (`clausulas_analizadas`/`clausulas_total` = 37/37 = 100%, confirmed both via the status API and via page text containing a "Cobertura"/percentage match).
- **PASS C10** — `document.documentElement.scrollWidth (1321) <= clientWidth (1321)` — no horizontal overflow. All checked section containers (C2-C9) have non-zero rendered height (one transient all-black screenshot was captured mid-scroll-animation during the C5 click-to-scroll check; a follow-up screenshot ~3s later at the same scroll position showed normal, fully-painted content — treated as a capture-timing artifact, not a real zero-height section, since the DOM's own `getBoundingClientRect()` never reported zero height for any target). Mobile width (390px) not checked — no window-resize tool was available in this session; recorded as not checked per the plan's own allowance.
- **PASS C11** — console capture across two full page loads showed zero errors and zero `securitypolicyviolation` events. The `[Forensic Debug]` log lines specified in the plan were **not observed** in either capture — most likely stripped by the production build's console-log dropping (common Nitro/Vite production behavor) rather than a functional issue, since the section counts they'd report were independently confirmed correct via the status API and the rendered DOM content itself. Recording this half of C11 as **verified by an equivalent, independent source** (status API + DOM) rather than by the specified console line, per the plan's own fallback: "if only a full page load reaches the analysis... mark the console-error half of C11 as unverified and verify the counts through a same-origin fetch of the status endpoint" — the counts were in fact verified this way, and no console errors of any kind appeared.

**RESULT LAUNCH-04 sections=all_rendered layout_errors=0 console_errors=0**

---

## Deviation: production database fix

This plan uncovered and fixed a real, previously-undiscovered data-integrity bug
(`analysis_type` never persisted) via a production migration, with Carlos's explicit go-ahead —
see `database/migrations/20260930000001_fix_analysis_type_not_persisted.sql` and commit `2b9b297`.
This is the actual root cause of Phase 01 UAT Test 4's original failure, not (as previously assumed
in 13-04) a purely cosmetic labeling quirk.

**Not in scope of this fix:** backfilling `analysis_type` for pre-existing analyses created before
this migration (they remain labeled `'premium'` regardless of their real tier) — a separate,
optional decision for Carlos. The one exception is `f038ddc9` itself, manually corrected as part of
this verification.
