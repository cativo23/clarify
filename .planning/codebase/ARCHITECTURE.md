# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** Nuxt 3 SSRW with Serverless API Architecture

**Key Characteristics:**
- Nuxt 3 framework with Vue 3 Composition API and TypeScript
- Serverless deployment on Vercel with Nitro preset
- Async job processing via BullMQ/Redis queue
- Supabase for authentication, database (PostgreSQL), and storage
- Strict Row Level Security (RLS) enforced at database level
- Atomic PostgreSQL RPCs for credit/financial operations (race condition prevention)

## Layers

**Frontend Layer:**
- Purpose: User interface and client-side state management
- Location: `/home/cativo23/projects/personal/clarify/` (root)
- Contains: Vue components (`components/`), pages (`pages/`), composables (`composables/`), layouts (`layouts/`)
- Depends on: Nuxt modules (@nuxtjs/supabase, @nuxtjs/tailwindcss), Tailwind CSS
- Used by: End users via browser

**Server API Layer:**
- Purpose: Backend business logic, API endpoints, security enforcement
- Location: `/home/cativo23/projects/personal/clarify/server/api/`
- Contains: Route handlers (.post.ts, .get.ts), Zod validation, error handling
- Depends on: Server utilities (`server/utils/`), Supabase service client, OpenAI SDK, Stripe SDK
- Used by: Frontend components via `$fetch` calls

**Server Utilities Layer:**
- Purpose: Reusable backend logic (auth, AI, payments, security, queue)
- Location: `/home/cativo23/projects/personal/clarify/server/utils/`
- Contains: `auth.ts`, `openai-client.ts`, `stripe-client.ts`, `queue.ts`, `file-validation.ts`, `ssrf-protection.ts`, `rate-limit.ts`, `error-handler.ts`
- Depends on: External SDKs (OpenAI, Stripe, BullMQ, ioredis)
- Used by: API endpoints

**Data Layer:**
- Purpose: Persistence, authentication, file storage
- Location: Supabase Cloud (PostgreSQL + Storage + Auth)
- Contains: Tables (`users`, `analyses`, `transactions`, `configurations`, `admin_emails`), Storage bucket (`contracts`)
- Depends on: PostgreSQL with RLS policies
- Used by: Server utilities via Supabase client

## Data Flow

**Contract Analysis Flow:**

1. User uploads PDF via `/api/upload` endpoint
2. Server validates file with magic byte checking (`validateFileUpload` in `file-validation.ts`)
3. File stored in Supabase Storage (`contracts` bucket)
4. User submits analysis request to `/api/analyze` with file_url, contract_name, analysis_type
5. Endpoint validates input (Zod schema), checks SSRF protection (`validateSupabaseStorageUrl`)
6. PostgreSQL RPC `process_analysis_transaction` atomically checks/deducts credits and creates analysis record
7. Job enqueued to BullMQ `analysis-queue` via `getAnalysisQueue()`
8. Queue worker (separate process) consumes job, calls `analyzeContract` in `openai-client.ts`
9. OpenAI processes with dynamic prompt from `server/prompts/v2/`
10. Results saved to `analyses` table, user notified

**Credit Purchase Flow:**

1. User selects credit package on `/credits` page
2. Frontend calls `/api/stripe/checkout` to create session
3. Stripe redirects user to payment page
4. On success, Stripe sends webhook to `/api/stripe/webhook`
5. Webhook verifies signature, calls `handleWebhookEvent`
6. `updateUserCreditsInDb` uses atomic RPC `increment_user_credits` to add credits
7. Transaction logged to `transactions` table

**Authentication Flow:**

1. User logs in via `/login` page using Supabase Auth
2. Auth state managed by `@nuxtjs/supabase` module
3. Protected routes guarded by `middleware/auth.ts`
4. Admin routes check `admin_emails` table + config via `isAdminUser()` in `server/utils/auth.ts`
5. User profile cached in composables state with 5-minute TTL

**State Management:**
- User state and credits stored in `useState()` composables (`useCreditsState`, `useUserState`)
- Cache TTL: 5 minutes for user profile
- Supabase client injected via `useSupabaseClient()` and `useSupabaseUser()`
- Server-side: Runtime config via `useRuntimeConfig()` for environment variables

## Key Abstractions

**Analysis Tiers:**
- Purpose: Encapsulate 3-tier AI analysis strategy (Basic, Premium, Forensic)
- Examples: `server/utils/config.ts` defines `PromptConfig` interface with `tiers` object
- Pattern: Configuration-driven tier definition (model, credits, token limits)

**Queue Jobs:**
- Purpose: Async processing of long-running analysis tasks
- Examples: `server/utils/queue.ts` exports `getAnalysisQueue()` returning BullMQ Queue
- Pattern: Job data contains `analysisId`, `userId`, `storagePath`, `analysisType`

**Security Guards:**
- Purpose: Centralized security enforcement across all endpoints
- Examples:
  - `server/utils/ssrf-protection.ts` - URL validation for Supabase storage
  - `server/utils/file-validation.ts` - Magic byte validation for uploads
  - `server/utils/rate-limit.ts` - Redis-based rate limiting
  - `server/utils/error-handler.ts` - Safe error messages (no info disclosure)

**Atomic RPCs:**
- Purpose: Prevent race conditions in credit operations
- Examples:
  - `process_analysis_transaction` - Check and deduct credits atomically
  - `increment_user_credits` - Safe credit addition after payment
- Pattern: PostgreSQL stored procedures with transaction isolation

## Entry Points

**Application Entry:**
- Location: `/home/cativo23/projects/personal/clarify/app.vue`
- Triggers: Nuxt hydration, sets up global meta tags and transitions
- Responsibilities: Root layout, page transitions, global styles

**Server Entry:**
- Location: `/home/cativo23/projects/personal/clarify/server/` (Nitro auto-scanned)
- Triggers: HTTP requests to `/api/*` routes
- Responsibilities: Route handling, middleware, plugin initialization

**Queue Worker:**
- Location: BullMQ worker (runs as separate process/serverless function)
- Triggers: Job added to `analysis-queue` Redis key
- Responsibilities: Contract text extraction, OpenAI API calls, result persistence

**Stripe Webhook:**
- Location: `/home/cativo23/projects/personal/clarify/server/api/stripe/webhook.post.ts`
- Triggers: Stripe POST request with `stripe-signature` header
- Responsibilities: Signature verification, credit fulfillment, transaction logging

## Error Handling

**Strategy:** Safe error messages with full server-side logging

**Patterns:**
- `handleApiError()` in `server/utils/error-handler.ts` - Centralized error handler
- `createSafeError()` - Sanitizes messages (removes paths, SQL, credentials)
- Error categorization via `ErrorType` enum (VALIDATION, AUTHENTICATION, PAYMENT_REQUIRED, etc.)
- Zod schema validation at API entry points with structured error responses
- HTTP status codes mapped to error types (400, 401, 402, 403, 404, 429, 500, 503)

**Security-focused error handling:**
- Never expose file paths, database schema, or API keys
- Generic messages for external service failures (OpenAI, Stripe)
- `[SECURITY FIX H3]` pattern: Log full details server-side, return safe message to client

## Cross-Cutting Concerns

**Logging:** `console.log/error/warn` with structured JSON output. Security events prefixed with `[SECURITY]`. Error handler logs full details to `[SECURITY ERROR LOG]` with timestamp, userId, endpoint, stack trace.

**Validation:** Multi-layer validation approach:
- Client-side: Form validation in Vue components
- API layer: Zod schemas (e.g., `analyzeRequestSchema` in `analyze.post.ts`)
- Security: Magic byte validation, SSRF protection, file type enforcement
- Database: RLS policies, check constraints, foreign key constraints

**Authentication:** Supabase Auth with JWT sessions:
- Client: `useSupabaseUser()` composable for auth state
- Server: `serverSupabaseUser(event)` for session verification
- Admin: Dual check via `ADMIN_EMAIL` config + `admin_emails` table
- Rate limiting on auth endpoints (10 attempts per 15 minutes)

**Authorization:** Row Level Security (RLS) enforced on all tables:
- Users can only access their own analyses
- Service role key bypasses RLS for server operations (credit updates, admin queries)
- Admin routes check `isAdminUser()` before allowing access

**Rate Limiting:** Redis-based distributed rate limiting:
- Presets: `analyze` (3/min), `upload` (5/min), `standard` (30/min), `auth` (10/15min), `payment` (5/min)
- Key types: user ID or IP address
- Fallback to memory store if Redis unavailable
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`

---

*Architecture analysis: 2026-02-21*
