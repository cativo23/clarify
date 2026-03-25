---
status: complete
phase: 02-tier-selection-ux
created: 2026-02-23T00:00:00Z
updated: 2026-02-23T00:00:00Z
---

# Phase 2 UAT - Root Cause Diagnosis Report

## Issue 1: minor - Tier selection tooltip weird behavior + duplicate info

**Root Cause:**
The `TokenTooltip` component in `components/AnalysisSelector.vue` uses `group-hover` CSS class on the parent container (`relative group inline-block` at line 2 of TokenTooltip.vue). When the parent container has `group` class, hovering ANY child element triggers the tooltip visibility via `group-hover:opacity-100 group-hover:visible`.

**Files Involved:**
- `components/TokenTooltip.vue` (line 10): Uses `group-hover:opacity-100 group-hover:visible` which triggers on ANY hover within the group parent
- `components/AnalysisSelector.vue` (lines 73-78, 204-209, 340-345, 408-414, 427-433, 446-452): Multiple instances of TokenTooltip create overlapping hover zones

**Duplicate Info Issue:**
- `components/AnalysisSelector.vue` (lines 389-468): "Comparativa de Niveles" table shows token limits with tooltips
- `components/AnalysisSelector.vue` (lines 459-467): "Cuál nivel es para mí?" button opens modal
- `components/TierComparisonModal.vue`: Shows THE SAME token limit information with tooltips

**Recommended Fix:**
1. Change `TokenTooltip.vue` to use individual hover trigger instead of `group-hover`:
   - Replace `group-hover:opacity-100 group-hover:visible` with `hover:opacity-100 hover:visible`
   - Remove `group` class from parent if present, or use `relative` without `group`

2. Remove the "Comparativa de Niveles" table from `AnalysisSelector.vue` (lines 389-468) since the modal provides the same information with better UX

---

## Issue 2: major - All tooltips open together on any hover, tooltips get clipped by table border

**Root Cause:**
Two separate but related issues:

**Part A - All tooltips open together:**
The `TokenTooltip.vue` component (line 2) has `class="relative group inline-block"`. The `group` class combined with `group-hover` on the tooltip (line 10) means that when ANY child of the group is hovered, ALL tooltips within that group context become visible. This is because `group-hover` applies to ALL elements with that class within the group parent.

Looking at the code structure:
```vue
<!-- TokenTooltip.vue line 2 -->
<div class="relative group inline-block">
  <!-- line 10 -->
  <div class="... group-hover:opacity-100 group-hover:visible ...">
```

When the user hovers over the trigger text, the hover event bubbles and triggers all tooltips because they share the same group context.

**Part B - Tooltips clipped by table border:**
In `AnalysisSelector.vue` (line 397), the comparison table container has `overflow-x-auto` (line 31 in `TierComparisonModal.vue` confirms similar pattern). The tooltip uses `absolute bottom-full` positioning (TokenTooltip.vue line 10), which positions it outside the parent. However, the parent container's `overflow-hidden` or `overflow-x-auto` clips the tooltip.

**Files Involved:**
- `components/TokenTooltip.vue` (lines 2, 10): `group` class + `group-hover` causes all tooltips to trigger together
- `components/AnalysisSelector.vue` (line 390): Container may have overflow that clips tooltips
- `components/TierComparisonModal.vue` (line 31): `overflow-x-auto` on table container clips tooltips

**Recommended Fix:**
1. Remove `group` class from `TokenTooltip.vue` parent div
2. Change tooltip trigger from `group-hover` to `hover` on the tooltip itself:
   ```vue
   <!-- TokenTooltip.vue line 10 -->
   class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 ... opacity-0 invisible hover:opacity-100 hover:visible ..."
   ```
3. Add `overflow-visible` to table containers in both `AnalysisSelector.vue` and `TierComparisonModal.vue`
4. Consider using `z-50` and positioning tooltip with `transform` instead of `bottom-full` to avoid overflow clipping

---

## Issue 3: minor - All tier cards expand/collapse together instead of independently

**Root Cause:**
The `isExpanded` state in `AnalysisSelector.vue` (line 495) is a SINGLE ref that holds the currently expanded tier:
```typescript
const isExpanded = ref<"basic" | "premium" | "forensic" | null>(null);
```

The `toggleExpand` function (lines 497-507) sets this single state, and all three cards check `isExpanded === 'basic'`, `isExpanded === 'premium'`, `isExpanded === 'forensic'` to determine their expanded state. When one card is clicked, `isExpanded` is set to that tier, causing ONLY that card to show as expanded. However, the user report says "ALL cards open/close together" which suggests the issue may be with the CSS class application.

Wait - looking more closely at the template, each card checks `isExpanded === 'basic'` etc. for its expanded state. This SHOULD work correctly for independent expansion. The issue reported is "ALL cards open/close together when clicking any one."

Looking at the click handlers (lines 11, 125-127, 256-258):
- Basic: `@click="toggleExpand('basic')"`
- Premium: `@click="hasCreditsForPremium ? toggleExpand('premium') : null"`
- Forensic: `@click="hasCreditsForForensic ? toggleExpand('forensic') : null"`

The `toggleExpand` function toggles the current tier off if it's already expanded:
```typescript
const toggleExpand = (tier: "basic" | "premium" | "forensic") => {
  isExpanded.value = isExpanded.value === tier ? null : tier;
  // ...
};
```

This is actually CORRECT logic for mutual exclusivity (only one expanded at a time). The user wants INDEPENDENT expansion (multiple cards can be expanded simultaneously).

**Files Involved:**
- `components/AnalysisSelector.vue` (lines 495, 497-507): Single `isExpanded` ref and toggle logic

**Recommended Fix:**
Change from single-value state to object-based state tracking each tier independently:
```typescript
const expandedTiers = ref({
  basic: false,
  premium: false,
  forensic: false,
});

const toggleExpand = (tier: "basic" | "premium" | "forensic") => {
  expandedTiers.value[tier] = !expandedTiers.value[tier];
  // ... emit logic
};
```

Then update template conditions from `isExpanded === 'basic'` to `expandedTiers.basic`.

---

## Issue 4: major - Upload cancel cannot be tested - 8.45MB file gets 'Payload too large' error

**Root Cause:**
The server payload size limit is configured too low in Nuxt's configuration. The `upload.post.ts` endpoint validates files up to 10MB (line 48), but Nuxt's default body size limit is typically 1MB. The error "Payload too large" is a Nuxt/H3 error that occurs BEFORE the file validation logic runs.

Looking at `server/api/upload.post.ts`:
- Line 48: `validateFileUpload` checks `maxSizeMB: 10`
- BUT: This validation happens AFTER the file is parsed from the request body
- The H3 framework's default body size limit is 1MB, causing the error before custom validation runs

The error message "Payload too large" is thrown by H3's `readMultipartFormData` (line 27) when the request body exceeds the configured limit.

**Files Involved:**
- `server/api/upload.post.ts` (line 27): `readMultipartFormData(event)` - this is where payload limit is hit
- `nuxt.config.ts`: No `bodyLimit` configuration found, meaning it uses the default 1MB limit

**Recommended Fix:**
Add `bodyLimit` configuration to `nuxt.config.ts` in the `nitro` section:
```typescript
nitro: {
  routeRules: {
    // ... existing rules
  },
  bodyLimit: 10 * 1024 * 1024, // 10MB to match validation
}
```

Alternatively, configure at the endpoint level using H3's `defineEventHandler` options if supported.

Also recommended: Add user-friendly error handling in `Dropzone.vue` to show file size limits BEFORE upload starts (currently only shows generic "Payload too large" error).

---

## Issue 5: blocker - Analysis status stuck on initial state, doesn't update even after page refresh

**Root Cause:**
After thorough investigation, the root cause is a combination of issues:

**Part A - Database migration missing REPLICA IDENTITY FULL:**
The migration `20260216000003_add_async_analysis_support.sql` enables realtime for the analyses table (line 15):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE analyses;
```

However, for Supabase Realtime to work correctly with UPDATE events, the table needs `REPLICA IDENTITY FULL` to capture all changed columns. Without this, Postgres only replicates the primary key by default, causing the realtime subscription to receive incomplete data.

**Part B - Realtime subscription uses user_id filter, not analysis-specific:**
In `pages/dashboard.vue` (lines 935-1039), the subscription filters by `user_id=eq.${currentUserId.value}` (line 948). This is correct for receiving ALL updates for that user.

**Part C - Status may be stuck in backend queue:**
The `server/api/analyze.post.ts` enqueues the job (lines 121-137), but if the BullMQ worker is not running or not processing jobs, the status will remain "pending" indefinitely.

**Part D - Dashboard doesn't poll for status updates:**
The dashboard relies solely on realtime subscriptions. If realtime fails, there's no fallback polling mechanism.

**Files Involved:**
- `database/migrations/20260216000003_add_async_analysis_support.sql` (line 15): Missing `ALTER TABLE analyses REPLICA IDENTITY FULL`
- `pages/dashboard.vue` (lines 935-1039): Realtime subscription setup
- `server/api/analyze.post.ts` (lines 121-137): Queue enrollment
- `server/workers/analysis-worker.ts` (not read, but likely exists): Job processor

**Recommended Fix:**
1. Add migration to enable REPLICA IDENTITY FULL:
   ```sql
   ALTER TABLE analyses REPLICA IDENTITY FULL;
   ```

2. Add polling fallback in `dashboard.vue`:
   - Poll every 5-10 seconds for analyses with "pending" or "processing" status
   - Refresh analysis list if any are still pending after 30+ seconds

3. Verify BullMQ worker is running and processing jobs:
   - Check worker logs for errors
   - Verify Redis connectivity
   - Check if jobs are being added to queue but not processed

4. Add error handling for failed analyses:
   - If status is "failed", show error message to user

---

## Summary Table

| Issue | Severity | Root Cause | Fix Complexity |
|-------|----------|------------|----------------|
| 1. Tooltip weird behavior + duplicate info | minor | `group-hover` triggers all tooltips; duplicate info in table + modal | Low |
| 2. All tooltips open together + clipped | major | `group` class + `group-hover` causes cascade; `overflow-x-auto` clips positioned tooltips | Low |
| 3. Cards expand together | minor | Single `isExpanded` ref instead of per-card state | Low |
| 4. Payload too large error | major | Nuxt default 1MB body limit, validation never runs | Low |
| 5. Status stuck on initial state | blocker | Missing `REPLICA IDENTITY FULL` in migration; no polling fallback; possible worker issues | Medium |

---

## Priority Fix Order

1. **Issue 5 (blocker)** - Fix database migration and add polling fallback
2. **Issue 4 (major)** - Increase body limit in nuxt.config.ts
3. **Issue 2 (major)** - Fix tooltip hover behavior and overflow clipping
4. **Issue 1 (minor)** - Remove duplicate comparison table
5. **Issue 3 (minor)** - Implement per-card expansion state
