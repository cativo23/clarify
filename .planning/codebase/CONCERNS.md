# Codebase Concerns

**Analysis Date:** 2026-02-21

## Tech Debt

### Type Safety: Database Types Not Defined

**Issue:** The database types file exports `any`, completely bypassing TypeScript's type safety for all database operations.

**Files:** `types/database.types.ts`

**Impact:**
- No type checking on database queries throughout the application
- Potential runtime errors from incorrect field access
- Loss of IDE autocomplete and refactoring support
- Increased risk of bugs in credit/financial operations

**Fix approach:** Generate proper Supabase types using:
```bash
npx supabase gen types typescript --project-id <your-project-id>
```

---

### Worker Plugin Error Recovery

**Issue:** The background worker catches errors but doesn't implement proper retry logic for transient failures. If OpenAI API is temporarily unavailable, jobs fail permanently instead of retrying.

**Files:** `server/plugins/worker.ts` (lines 83-104)

**Impact:**
- Temporary API outages cause permanent job failures
- Users lose credits for failed analyses
- Poor reliability during brief service disruptions

**Fix approach:** Add retry logic that distinguishes between retryable errors (API timeouts, connection errors) and permanent failures:
```typescript
const isRetryable = error.message?.includes('API') ||
                    error.message?.includes('timeout') ||
                    error.code?.startsWith('ECONN')

if (isRetryable && job.attemptsMade < 3) {
    throw error // Let BullMQ retry
}
```

---

### Comment Noise with Issue References

**Issue:** Code contains comments like `[SECURITY FIX H3]`, `[SECURITY FIX M4]` that reference issue numbers not tracked in this repository.

**Files:** Multiple files across `server/` directory

**Impact:**
- References are meaningless without external tracking system
- Adds noise without providing actionable context
- Makes code harder to understand for new contributors

**Fix approach:** Move security fix references to git commit messages and `docs/SECURITY_CHANGES.md`. Keep code comments focused on _why_ not _what issue number_.

---

### Magic Numbers in Risk Calculations

**Issue:** Risk level mappings and weights are duplicated across multiple files instead of being centralized.

**Files:** `pages/dashboard.vue`, `server/plugins/worker.ts`

**Examples:**
```typescript
// dashboard.vue - line 351
const weights = { low: 100, medium: 50, high: 0 }

// worker.ts - lines 58-65
const riskMapping: Record<string, string> = {
    'Alto': 'high', 'Medio': 'medium', 'Bajo': 'low',
    'PELIGROSO': 'high', 'PRECAUCIÓN': 'medium', 'ACEPTABLE': 'low'
}
```

**Impact:**
- Risk of inconsistency if mappings diverge
- Changes require updates in multiple locations
- Harder to test and verify correctness

**Fix approach:** Centralize in `constants/risk-levels.ts` with exported constants.

---

## Known Bugs

### Error Handler Variable Scope Bug

**Issue:** In the upload endpoint, the `user` variable is referenced in the catch block but is only defined in the try block scope.

**Files:** `server/api/upload.post.ts` (lines 93-100)

**Symptoms:** If an error occurs before user authentication (e.g., multipart parsing fails), the catch block will reference an undefined variable, potentially causing a crash or losing the original error context.

**Trigger:** Any error occurring before `const user = await serverSupabaseUser(event)` succeeds.

**Workaround:** None - this is a latent bug that may cause unhandled errors.

**Fix approach:** Declare `let userId: string | undefined` before the try block and assign it after successful authentication.

---

### PDF Export Not Implemented

**Issue:** The PDF download button shows an alert instead of actually exporting the analysis.

**Files:** `pages/analyze/[id].vue` (line 330)

**Symptoms:** Users clicking "Descargar Reporte (PDF)" receive an alert: "Funcionalidad de descarga en desarrollo"

**Trigger:** Clicking the download button on any analysis results page.

**Fix approach:** Implement PDF generation using a library like `jspdf` or server-side PDF generation endpoint.

---

## Security Considerations

### Missing Rate Limiting on Cost-Affecting Endpoints

**Issue:** The Stripe webhook has rate limiting, but the analyze and upload endpoints (which directly impact credit deduction and AI costs) do not.

**Files:** `server/api/analyze.post.ts`, `server/api/upload.post.ts`

**Risk:**
- Users could rapidly consume credits through automated requests
- AI API costs could spike from abuse
- Denial of service through resource exhaustion

**Current mitigation:** Basic authentication required, but no request frequency limits.

**Recommendations:** Add rate limiting using existing `RateLimitPresets`:
```typescript
await applyRateLimit(event, RateLimitPresets.standard, 'user')
```

---

### TypeScript Type Checking Disabled

**Issue:** Type checking is disabled in build configuration despite strict tsconfig settings.

**Files:** `nuxt.config.ts` (line 90)

**Risk:**
- Type errors may slip through during builds
- False sense of type safety
- Runtime errors from unchecked type mismatches

**Current mitigation:** Manual `npm run typecheck` runs (but `typeCheck: false` means build succeeds even with errors)

**Recommendations:** Enable `typeCheck: true` in development and CI. If build performance is a concern, run type checking as a separate CI step.

---

### Service Role Key Usage

**Issue:** The application uses Supabase service role key in server code, which bypasses Row Level Security.

**Files:** `server/utils/admin-supabase.ts`, `server/utils/worker-supabase.ts`

**Risk:** If service role key is ever exposed to client, attackers gain full database access.

**Current mitigation:** Keys only used in server utilities, never imported in client code.

**Recommendations:** Continue current approach but add explicit documentation and potentially runtime checks to ensure service client is never exposed to client-side code.

---

## Performance Bottlenecks

### Large Dashboard Component

**Issue:** The dashboard component is 740 lines with complex nested computed properties and mixed concerns.

**Files:** `pages/dashboard.vue`

**Cause:** Single file contains UI, data fetching, realtime subscriptions, and business logic all together.

**Impact:**
- Slower component rendering and updates
- Harder to test individual features
- Difficult to maintain and extend

**Improvement path:** Split into smaller components:
```
components/dashboard/
  UserProfileCard.vue
  SecuritySummaryCard.vue
  RiskDistributionChart.vue
  NewAnalysisForm.vue
  RecentAnalysesList.vue
```

---

### Prompt File I/O on Every Request

**Issue:** AI prompts are loaded from filesystem on every analysis request without caching.

**Files:** `server/utils/openai-client.ts`, `server/utils/config.ts`

**Cause:** `fs.promises.readFile()` called in `getPromptConfig()` without memoization.

**Impact:** Unnecessary I/O overhead on every AI analysis request.

**Improvement path:** Add in-memory caching with invalidation on config changes.

---

### Missing Composite Database Indexes

**Issue:** Database has indexes on individual columns but lacks composite indexes for common query patterns.

**Files:** `database/migrations/20260216000000_create_core_schema.sql`

**Cause:** Only single-column indexes created (`user_id`, `created_at`).

**Impact:** Queries filtering by both user and status must scan more rows than necessary.

**Improvement path:** Add composite index:
```sql
CREATE INDEX idx_analyses_user_status ON analyses(user_id, status);
```

---

## Fragile Areas

### Worker Plugin Single-Instance Design

**Issue:** The worker plugin runs inside the Nuxt server process and won't scale horizontally.

**Files:** `server/plugins/worker.ts`, `server/utils/queue.ts`

**Why fragile:**
- Tied to Nuxt application lifecycle
- Cannot scale workers independently
- Server restart interrupts job processing
- Not suitable for serverless deployments

**Safe modification:** For production scaling, extract worker to separate deployment:
1. Move `server/plugins/worker.ts` to standalone script
2. Deploy as separate worker service
3. Use same Redis queue for coordination

**Test coverage:** Minimal - no tests for worker plugin behavior.

---

### Analysis Status Page Navigation Guard

**Issue:** The analysis results page has an alert-based navigation guard that's easy to bypass.

**Files:** `pages/analyze/[id].vue` (lines 343-347)

**Why fragile:**
- Uses `alert()` which blocks UI
- Client-side only check (can be bypassed)
- No server-side status enforcement

**Safe modification:** Add server-side status check in API endpoint and return 400 for pending/processing analyses.

---

## Scaling Limits

### Redis Connection Not Shared Across Instances

**Issue:** Redis connection is created per-instance without connection pooling considerations.

**Files:** `server/utils/queue.ts`

**Current capacity:** Single server instance with one connection.

**Limit:** Multiple server instances will each create their own Redis connection, potentially exceeding Upstash connection limits.

**Scaling path:** Implement connection pooling and share connection across worker instances.

---

### BullMQ Job Retention Settings

**Issue:** Job retention is set to keep 100 completed and 1000 failed jobs.

**Files:** `server/utils/queue.ts` (lines 41-42)

**Current capacity:** 100 completed, 1000 failed jobs stored in Redis.

**Limit:** High-volume usage will cause Redis memory growth and potential performance degradation.

**Scaling path:** Reduce retention counts or implement periodic cleanup job for production.

---

## Dependencies at Risk

### Type Checking Performance Trade-off

**Issue:** TypeScript type checking disabled for performance reasons.

**Files:** `nuxt.config.ts` (line 90)

**Risk:** Faster builds at cost of potential type errors reaching production.

**Impact:** May introduce subtle bugs that only manifest at runtime.

**Migration plan:** Enable type checking in CI pipeline as separate step, not part of build.

---

### pdf-parse Library Limitations

**Issue:** Application relies on `pdf-parse` which may not handle all PDF formats.

**Files:** `server/utils/pdf-parser.ts`

**Risk:** Image-only PDFs or non-standard PDFs may fail to extract text.

**Impact:** Users with certain PDF formats cannot get analysis.

**Migration plan:** Consider fallback to alternative PDF extraction library or OCR for problematic files.

---

## Missing Critical Features

### No Health Check Monitoring Integration

**Issue:** Health endpoint exists but is not integrated with monitoring/alerting.

**Files:** `server/api/health.get.ts`

**Problem:** No automated alerting when service becomes unhealthy.

**Blocks:** Proactive incident response and uptime monitoring.

---

### No User Notification System

**Issue:** Users must manually check dashboard for analysis completion.

**Problem:** No email or push notifications when analysis completes.

**Blocks:** Improved user experience for long-running forensic analyses.

---

## Test Coverage Gaps

### No Tests for Critical Security Utilities

**Untested area:** File validation, SSRF protection, and error handler utilities.

**Files:** `server/utils/file-validation.ts`, `server/utils/ssrf-protection.ts`, `server/utils/error-handler.ts`

**Risk:** Security-critical code could have undetected vulnerabilities.

**Priority:** HIGH

---

### No Integration Tests for API Endpoints

**Untested area:** API endpoint validation, authentication, and credit deduction.

**Files:** `server/api/analyze.post.ts`, `server/api/upload.post.ts`, `server/api/stripe/webhook.post.ts`

**Risk:** Endpoint bugs or regressions may reach production.

**Priority:** HIGH

---

### No Tests for Worker Plugin

**Untested area:** Background job processing, retry logic, and error handling.

**Files:** `server/plugins/worker.ts`

**Risk:** Job processing failures may go undetected.

**Priority:** MEDIUM

---

### E2E Tests Not Written

**Untested area:** Full user flows including analysis, credit purchase, and authentication.

**Files:** `tests/e2e/` directory has scaffolding but no tests.

**Risk:** User-facing bugs and regressions.

**Priority:** MEDIUM

---

*Concerns audit: 2026-02-21*
