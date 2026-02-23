# Code Review: `develop` vs `main`

**Date:** 2026-02-22 · **Commits:** 21 · **Files Changed:** 23 · **Lines:** +2,943 / -151

---

## Summary

This branch introduces the **Forensic analysis tier** (the third tier alongside Basic and Premium), rewrites the README to English, and fixes dashboard error handling. The bulk of the diff (+1,853 lines) is planning docs and UAT documentation, which are not reviewed here—this focuses on the **source code changes**.

---

## 🟢 What Looks Good

### Config-Driven Credit Costs
The move from a hardcoded ternary (`analysis_type === "premium" ? 3 : 1`) to `config.tiers[analysis_type]?.credits` in [analyze.post.ts](file:///home/cativo23/projects/personal/clarify/server/api/analyze.post.ts) is a solid improvement. Credit costs are now driven by [config.ts](file:///home/cativo23/projects/personal/clarify/server/utils/config.ts), which is the single source of truth.

### Clean Tier Extension in OpenAI Client
The [openai-client.ts](file:///home/cativo23/projects/personal/clarify/server/utils/openai-client.ts) changes are well-structured: the union type was expanded to `"basic" | "premium" | "forensic"`, prompt file selection uses a clear conditional chain, and the forensic tier gets a larger preprocessing buffer (5k vs 2k) with a good inline comment explaining why.

### Improved Dashboard Error Handling
The [dashboard.vue](file:///home/cativo23/projects/personal/clarify/pages/dashboard.vue) error message was moved outside the `v-if="selectedFile"` guard so errors are visible even when the file is cleared. The error extraction now properly handles Nuxt/h3 error structures (`error.data?.message`).

### Database Migration
The [migration](file:///home/cativo23/projects/personal/clarify/database/migrations/20260222000001_add_forensic_tier.sql) safely drops and recreates CHECK constraints to add `'forensic'`. Clean and idempotent.

### README Rewrite
Translated from Spanish to English, modernized formatting with tables, added the 3-tier strategy docs, and improved the Quick Start section. Looks professional.

---

## 🟡 Suggestions (Non-critical)

### 1. Hardcoded Credit Costs in UI — [AnalysisSelector.vue](file:///home/cativo23/projects/personal/clarify/components/AnalysisSelector.vue)

The component hardcodes `10 Créditos` in the template and uses `props.userCredits >= 10` for the computed check, while the backend uses config-driven values.

```vue
<!-- Hardcoded in template -->
<span>10 Créditos</span>

<!-- Hardcoded in script -->
const hasCreditsForForensic = computed(() => props.userCredits >= 10);
```

> [!TIP]
> Consider exposing the tier config to the frontend (via an API or runtime config) so credit costs stay in sync. If the forensic price changes to 15 in the DB config, the UI would still say "10 Créditos".

### 2. Fallback in `analyze.post.ts` Defaults to 3

```typescript
const creditCost = config.tiers[analysis_type]?.credits || 3;
```

If `analysis_type` is `"basic"`, this correctly returns `1`. But if an unknown tier were somehow passed, the fallback is `3` (premium cost). This is fine given Zod validation upstream, but `?? 3` (nullish coalescing) would be slightly safer since `|| 3` would also catch a `0` value if one ever existed.

### 3. Excessive Debug Logging in Production — [openai-client.ts](file:///home/cativo23/projects/personal/clarify/server/utils/openai-client.ts)

The forensic tier adds multiple `console.log` statements:

```typescript
console.log("[Forensic] Forensic tier selected - using gpt-5...");
console.log("[Forensic] Preprocessing buffer: 5k tokens...");
console.log("[Forensic] Token usage:", { ... });
```

> [!TIP]
> These are useful during development but should be guarded by `config.features.tokenDebug` or a `DEBUG` env var for production. The same applies to the `console.log` in `analyze.post.ts` and the extra logging in `worker.ts`.

### 4. UI Text is Spanish-only — [AnalysisSelector.vue](file:///home/cativo23/projects/personal/clarify/components/AnalysisSelector.vue)

The forensic card uses hardcoded Spanish text (`"Máximo Detalle"`, `"Auditoría Forense"`, `"Faltan créditos"`, etc.). If the README was moved to English, is i18n planned?

---

## 🔴 Potential Issues

### 1. PDF Parser Change May Be a Breaking Change — [pdf-parser.ts](file:///home/cativo23/projects/personal/clarify/server/utils/pdf-parser.ts)

```diff
-const pdfParse = require("pdf-parse");
+const { PDFParse } = require("pdf-parse");

-const data = await pdfParse(fileBuffer);
-return data.text;
+const parser = new PDFParse({ data: fileBuffer });
+const result = await parser.getText();
+return result.text;
```

> [!CAUTION]
> The `pdf-parse` npm package (v1.x) exports a function, not a `PDFParse` class. This API change (`new PDFParse({ data: fileBuffer })` / `.getText()`) doesn't match the published `pdf-parse` package API. This will work only if:
> - You've upgraded to a different version that uses this class-based API, or
> - You've switched to a different package with the same name.
>
> **Verify this still works correctly on the Docker container.** If the package hasn't changed in `package.json`, this will throw at runtime.

### 2. `transactions` CHECK Constraint — [migration](file:///home/cativo23/projects/personal/clarify/database/migrations/20260222000001_add_forensic_tier.sql)

The migration adds `'forensic'` to `credit_pack_type` on the `transactions` table:

```sql
CHECK (credit_pack_type IN ('standard', 'forensic'))
```

But `credit_pack_type` currently only has `'standard'`. Is `'forensic'` actually used as a credit pack type in the Stripe flow? If this was meant to future-proof the `analysis_type` column on `analyses`, it's already handled above. If `credit_pack_type` is a separate concept from `analysis_type`, adding `'forensic'` here might be semantically incorrect.

### 3. Missing Zod Validation for `"forensic"` Type — [analyze.post.ts](file:///home/cativo23/projects/personal/clarify/server/api/analyze.post.ts)

The diff doesn't show the Zod schema being updated. If the request schema still validates `analysis_type` as `z.enum(["basic", "premium"])`, then `"forensic"` requests will be rejected at the validation layer before reaching the credit logic.

> [!IMPORTANT]
> Confirm that the Zod `analysisSchema` includes `"forensic"` in the enum. If not, this needs to be added.

---

## 📋 Checklist for Merge

| Item | Status |
|------|--------|
| Forensic tier in config, OpenAI client, DB | ✅ |
| AnalysisSelector UI card | ✅ |
| Dashboard error visibility fix | ✅ |
| README rewrite | ✅ |
| Forensic analysis prompt (647 lines) | ✅ Added |
| Zod schema includes `"forensic"` | ⚠️ Verify |
| `pdf-parser.ts` works with current `pdf-parse` package | ⚠️ Verify |
| `credit_pack_type` constraint semantics | ⚠️ Review intent |
| Debug logging guarded for production | 💡 Suggested |
| UI credit costs synced with backend config | 💡 Suggested |
