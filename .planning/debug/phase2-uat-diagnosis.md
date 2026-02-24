---
status: resolved
trigger: "Diagnose root causes for Phase 2 UAT issues"
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

## Current Focus

Diagnostic complete. All 5 issues analyzed with root causes identified.

## Symptoms

See `.planning/phases/02-tier-selection-ux/02-UAT.md` for full UAT details.

## Eliminated

None - diagnostic session, no hypotheses tested.

## Evidence

### Issue 1: minor - Tooltip weird behavior + duplicate info

**File:** `/home/cativo23/projects/personal/clarify/components/TokenTooltip.vue`
**Lines:** 2, 10
**Finding:** Component uses `class="relative group inline-block"` with `group-hover:opacity-100 group-hover:visible` on tooltip
**Implication:** Hover on ANY child triggers ALL tooltips in group context

**File:** `/home/cativo23/projects/personal/clarify/components/AnalysisSelector.vue`
**Lines:** 389-468 (comparison table), 459-467 (modal trigger), 470-471 (modal)
**Finding:** "Comparativa de Niveles" table shows same token info as "Cuál nivel es para mí?" modal
**Implication:** Duplicate information causes user confusion

### Issue 2: major - All tooltips open together + clipped

**File:** `/home/cativo23/projects/personal/clarify/components/TokenTooltip.vue`
**Lines:** 2, 10
**Finding:** `group` class + `group-hover` causes all tooltips to trigger together when any is hovered
**Implication:** User cannot hover individual tooltips independently

**File:** `/home/cativo23/projects/personal/clarify/components/TierComparisonModal.vue`
**Line:** 31
**Finding:** Table container has `overflow-x-auto`
**Implication:** Tooltips positioned with `bottom-full` get clipped by overflow container

### Issue 3: minor - All cards expand together

**File:** `/home/cativo23/projects/personal/clarify/components/AnalysisSelector.vue`
**Line:** 495
**Finding:** `const isExpanded = ref<"basic" | "premium" | "forensic" | null>(null)` - single ref for all cards
**Lines:** 497-507
**Finding:** `toggleExpand` function toggles single state, not per-card state
**Implication:** Only one card can be expanded at a time (mutual exclusivity), but user expects independent expansion

### Issue 4: major - Payload too large error

**File:** `/home/cativo23/projects/personal/clarify/server/api/upload.post.ts`
**Line:** 27, 48
**Finding:** `readMultipartFormData(event)` called before file validation; validation allows 10MB but Nuxt default is 1MB
**Implication:** H3 framework throws "Payload too large" before custom validation runs

**File:** `/home/cativo23/projects/personal/clarify/nuxt.config.ts`
**Finding:** No `bodyLimit` configuration in nitro section
**Implication:** Uses default 1MB limit, causing error for files >1MB

### Issue 5: blocker - Status stuck on initial state

**File:** `/home/cativo23/projects/personal/clarify/database/migrations/20260216000003_add_async_analysis_support.sql`
**Line:** 15
**Finding:** `ALTER PUBLICATION supabase_realtime ADD TABLE analyses;` present but missing `ALTER TABLE analyses REPLICA IDENTITY FULL;`
**Implication:** Postgres realtime only replicates primary key by default, not full row changes

**File:** `/home/cativo23/projects/personal/clarify/pages/dashboard.vue`
**Lines:** 935-1039
**Finding:** Realtime subscription setup correct but no polling fallback
**Implication:** If realtime fails, no mechanism to refresh status

## Resolution

### Root Causes Summary

| Issue | Root Cause | Files to Fix |
|-------|------------|--------------|
| 1. minor | `group-hover` triggers all tooltips; duplicate table + modal | `TokenTooltip.vue`, `AnalysisSelector.vue` |
| 2. major | `group` class cascade + `overflow-x-auto` clips tooltips | `TokenTooltip.vue`, `TierComparisonModal.vue` |
| 3. minor | Single `isExpanded` ref instead of per-card | `AnalysisSelector.vue` |
| 4. major | Missing `bodyLimit` config (1MB default vs 10MB validation) | `nuxt.config.ts` |
| 5. blocker | Missing `REPLICA IDENTITY FULL`; no polling fallback | DB migration, `dashboard.vue` |

### Recommended Fixes

1. **Issue 5 (blocker):**
   - Create migration: `ALTER TABLE analyses REPLICA IDENTITY FULL;`
   - Add polling fallback in dashboard for pending analyses

2. **Issue 4 (major):**
   - Add to `nuxt.config.ts`: `nitro: { bodyLimit: 10 * 1024 * 1024 }`

3. **Issue 2 (major):**
   - Remove `group` class from `TokenTooltip.vue` parent
   - Change `group-hover` to `hover` on tooltip
   - Add `overflow-visible` to table containers

4. **Issue 1 (minor):**
   - Remove "Comparativa de Niveles" table from `AnalysisSelector.vue`

5. **Issue 3 (minor):**
   - Change `isExpanded` ref to `expandedTiers` object for independent state
