# Architecture Research

**Domain:** Legal Tech / Contract Analysis SaaS
**Researched:** 2026-02-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Landing    │  │  Dashboard   │  │  Analysis    │  │    Admin     │   │
│  │     Page     │  │    (Vue)     │  │   Results    │  │   Panel      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (Nuxt 3 Server Routes)
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ /upload  │  │ /analyze │  │ /stripe  │  │  /admin  │  │  /user   │    │
│  │  (POST)  │  │  (POST)  │  │ (webhook)│  │   (GET)  │  │  (GET)   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴─────────────┴───────────┤
│                         SERVER UTILITIES                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │    Auth     │  │    File     │  │    OpenAI   │  │   Rate Limit    │  │
│  │  (Supabase) │  │  Validation │  │   Client    │  │    (Redis)      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │    Queue    │  │   SSRF      │  │    Error    │  │  Preprocessing  │  │
│  │  (BullMQ)   │  │ Protection  │  │   Handler   │  │   (Text)        │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ASYNC WORKER LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                           BullMQ Worker                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Job: analyze-contract                                              │   │
│  │    → Fetch contract from storage                                    │   │
│  │    → Preprocess text (chunking, deduplication)                      │   │
│  │    → Call OpenAI API (tier-based model)                             │   │
│  │    → Parse & validate JSON response                                 │   │
│  │    → Update analysis record in DB                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   Supabase       │  │   Supabase       │  │   Upstash        │         │
│  │   PostgreSQL     │  │   Storage        │  │   Redis          │         │
│  │   (Database)     │  │   (S3-compatible)│  │   (Queue/BullMQ) │         │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤         │
│  │ • users          │  │ • contracts/     │  │ • Job queues     │         │
│  │ • analyses       │  │   {userId}/      │  │ • Rate limits    │         │
│  │ • credit_trans.  │  │   {timestamp}.   │  │ • Sessions       │         │
│  │ • configurations │  │    pdf           │  │                  │         │
│  │ • admin views    │  │                  │  │                  │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   OpenAI     │  │    Stripe    │  │  Supabase    │  │   Vercel     │   │
│  │     API      │  │   Checkout   │  │   Storage    │  │  (Hosting)   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **Nuxt 3 Frontend** | UI rendering, user interactions, file upload | API endpoints, Supabase Auth |
| **Server Routes** | Request validation, business logic, error handling | Server utils, DB, Queue, External APIs |
| **Server Utils** | Cross-cutting concerns (auth, validation, rate limiting) | Internal only, called by server routes |
| **BullMQ Worker** | Async job processing (long-running AI analysis) | Redis, OpenAI API, Database |
| **Supabase PostgreSQL** | Persistent data storage with RLS | Server routes, Worker |
| **Supabase Storage** | PDF file storage (S3-compatible) | Server routes (upload/download) |
| **Upstash Redis** | Queue management, rate limiting, caching | BullMQ worker, rate-limit utils |
| **OpenAI API** | Contract analysis (3-tier model strategy) | Server utils (openai-client.ts) |
| **Stripe** | Payment processing, credit fulfillment | Server routes (webhook), Frontend (checkout) |

## Recommended Project Structure

```
clarify/
├── components/           # Vue 3 UI components
│   ├── analysis/       # Analysis-specific components
│   │   ├── AnalysisSelector.vue   # Tier selection UI
│   │   ├── RiskCard.vue           # Risk display component
│   │   └── Dropzone.vue           # File upload component
│   ├── dashboard/      # Dashboard components
│   ├── admin/          # Admin panel components
│   └── shared/         # Reusable components (Header, Footer, etc.)
│
├── pages/              # File-based routing
│   ├── index.vue       # Landing page
│   ├── login.vue       # Authentication
│   ├── dashboard.vue   # User dashboard
│   ├── credits.vue     # Credit purchase
│   ├── history.vue     # Analysis history
│   └── admin/          # Admin panel pages
│
├── server/             # Backend (Nitro server)
│   ├── api/            # API endpoints
│   │   ├── upload.post.ts      # File upload endpoint
│   │   ├── analyze.post.ts     # Analysis trigger endpoint
│   │   ├── check-tokens.post.ts # Token count endpoint
│   │   ├── health.get.ts       # Health check
│   │   ├── stripe/             # Stripe webhooks
│   │   ├── admin/              # Admin endpoints
│   │   ├── analyses/           # Analysis CRUD
│   │   └── user/               # User endpoints
│   │
│   ├── utils/          # Server utilities (shared logic)
│   │   ├── auth.ts             # Supabase auth helpers
│   │   ├── file-validation.ts  # Magic byte validation
│   │   ├── openai-client.ts    # OpenAI API wrapper
│   │   ├── queue.ts            # BullMQ queue setup
│   │   ├── worker-supabase.ts  # Worker DB client
│   │   ├── rate-limit.ts       # Rate limiting logic
│   │   ├── ssrf-protection.ts  # SSRF prevention
│   │   ├── preprocessing.ts    # Text preprocessing
│   │   ├── error-handler.ts    # Centralized error handling
│   │   ├── admin-supabase.ts   # Admin DB queries
│   │   ├── analysis-security.ts # Analysis security checks
│   │   ├── config.ts           # Config loaders
│   │   ├── pdf-parser.ts       # PDF text extraction
│   │   └── stripe-client.ts    # Stripe API wrapper
│   │
│   ├── prompts/        # AI prompts (versioned)
│   │   └── v2/         # Prompt version 2
│   │       ├── analysis-prompt.txt      # Premium tier prompt
│   │       └── basic-analysis-prompt.txt # Basic tier prompt
│   │
│   └── plugins/        # Server plugins
│
├── database/           # Database migrations & seeds
│   ├── migrations/     # SQL migrations (versioned)
│   ├── seeders/        # Seed data scripts
│   └── init.sql        # Initial schema setup
│
├── types/              # TypeScript definitions
│   └── index.ts        # Shared types
│
├── composables/        # Vue composables (shared logic)
├── layouts/            # App layouts
└── public/             # Static assets
```

### Structure Rationale

- **server/api/**: Follows Nuxt 3 conventions for server routes. File name pattern `{name}.{method}.ts` (e.g., `upload.post.ts`) maps to HTTP methods.
- **server/utils/**: Shared server-side logic isolated from routes for testability and reusability. No direct route handling here.
- **server/prompts/**: Separated from code to allow non-developer editing (PMs can tune prompts without code changes). Versioned (v2/) for A/B testing.
- **database/migrations/**: Sequential SQL files with timestamps for ordered execution. Each migration is idempotent and rollback-capable.
- **components/**: Organized by domain (analysis, dashboard, admin) rather than atomic/molecular for better discoverability.
- **pages/**: Flat structure for main routes, nested for admin section. Matches URL structure.

## Architectural Patterns

### Pattern 1: Async Job Queue Pattern

**What:** Long-running AI analysis operations are offloaded to a background queue instead of blocking HTTP requests.

**When to use:** Operations that exceed HTTP timeout limits (e.g., AI API calls taking 30-120 seconds), or operations that can complete asynchronously with progress tracking.

**Trade-offs:**
- **Pros:** No HTTP timeouts, better UX with progress updates, retry logic, fault tolerance
- **Cons:** Added complexity, eventual consistency (analysis not immediately available), requires queue infrastructure

**Example Flow:**
```typescript
// 1. API endpoint enqueues job (returns immediately)
const queue = getAnalysisQueue()
await queue.add('analyze-contract', {
    analysisId,
    userId: user.id,
    storagePath,
    analysisType: 'premium'
}, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })

// 2. Worker processes job asynchronously
// worker/process-analysis.ts
const job = queue.process('analyze-contract', async (job) => {
    const { analysisId, storagePath, analysisType } = job.data

    // Fetch contract text from storage
    const contractText = await fetchFromStorage(storagePath)

    // Call OpenAI API
    const result = await analyzeContract(contractText, analysisType)

    // Update database with results
    await updateAnalysisRecord(analysisId, result)
})
```

### Pattern 2: 3-Tier Model Strategy

**What:** Different AI models are used based on analysis tier (Basic/Premium/Forensic), balancing cost vs. accuracy.

**When to use:** When serving different customer segments with varying willingness to pay and accuracy requirements.

**Trade-offs:**
- **Pros:** Cost optimization, market segmentation, user choice, predictable margins
- **Cons:** Complexity in prompt management, potential confusion on tier differences

**Example Configuration:**
```typescript
// Tier configuration (loaded from prompts/config)
const tiers = {
    basic: { model: 'gpt-4o-mini', creditCost: 1, tokenLimits: { input: 8000, output: 800 } },
    premium: { model: 'gpt-5-mini', creditCost: 3, tokenLimits: { input: 16000, output: 2000 } },
    forensic: { model: 'gpt-5', creditCost: 10, tokenLimits: { input: 32000, output: 4000 } }
}
```

### Pattern 3: Atomic Credit Transaction Pattern

**What:** All credit operations use PostgreSQL stored procedures (RPC) to ensure atomicity and prevent race conditions.

**When to use:** Financial operations, credit systems, inventory management where concurrent requests could cause overspending or double-spending.

**Trade-offs:**
- **Pros:** ACID compliance, no race conditions, single source of truth, audit trail
- **Cons:** Database coupling, harder to scale horizontally, requires PostgreSQL expertise

**Example:**
```sql
-- RPC function ensures atomic check-and-deduct
CREATE OR REPLACE FUNCTION process_analysis_transaction(
    p_user_id uuid,
    p_credit_cost integer
) RETURNS bigint AS $$
DECLARE
    v_analysis_id bigint;
    v_credits integer;
BEGIN
    -- Check credits (locked row)
    SELECT credits INTO v_credits FROM user_credits
    WHERE user_id = p_user_id FOR UPDATE;

    IF v_credits < p_credit_cost THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- Deduct credits
    UPDATE user_credits SET credits = credits - p_credit_cost
    WHERE user_id = p_user_id;

    -- Create analysis record
    INSERT INTO analyses (...) VALUES (...) RETURNING id INTO v_analysis_id;

    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql;
```

### Pattern 4: Defense-in-Depth Security

**What:** Multiple layers of validation at each system boundary (client, API, storage, external calls).

**When to use:** Systems handling sensitive user data, financial transactions, or user-uploaded content.

**Trade-offs:**
- **Pros:** Robust against attacks, fails safely at multiple points, audit logging at each layer
- **Cons:** Complexity, potential performance overhead, more code to maintain

**Layers in this system:**
1. **Client-side**: File type validation, size limits
2. **API boundary**: Zod schema validation, Content-Type checks
3. **File validation**: Magic byte verification (not just extension)
4. **Storage**: SSRF protection (validate URLs are from trusted storage)
5. **AI model**: Whitelist validation (prevent unauthorized model usage)
6. **Database**: RLS policies, stored procedures for atomicity
7. **Error handling**: Safe error messages (no internal details leaked)

## Data Flow

### Upload → Analysis Flow

```
[User selects file]
    ↓
[Frontend Dropzone.vue]
    ↓ (multipart/form-data)
[POST /api/upload]
    ↓
[file-validation.ts] → Magic byte check, size validation
    ↓
[Supabase Storage] → Upload to contracts/{userId}/{timestamp}.pdf
    ↓
[Return publicUrl]
    ↓
[Frontend]
    ↓ (JSON: { file_url, contract_name, analysis_type })
[POST /api/analyze]
    ↓
[Zod validation] → Input sanitization
    ↓
[SSRF protection] → Validate file_url is from trusted storage
    ↓
[process_analysis_transaction RPC] → Atomic credit check + deduction
    ↓
[BullMQ Queue] → Enqueue job (returns analysisId immediately)
    ↓
[Frontend polling] → Poll /api/analyses/:id for status
    ↓
[Worker (async)]
    ↓
[Fetch from Storage] → Download PDF
    ↓
[Preprocessing] → Text extraction, chunking, deduplication
    ↓
[OpenAI API] → Tier-based model call
    ↓
[Parse & validate JSON] → Ensure valid response structure
    ↓
[Update analyses table] → Store results
    ↓
[Frontend receives update] → Display results
```

### Credit Purchase Flow (Stripe)

```
[User selects credit package]
    ↓
[Frontend calls Stripe Checkout]
    ↓
[Stripe redirects user to payment page]
    ↓
[User completes payment]
    ↓
[Stripe sends webhook to /api/stripe]
    ↓
[Webhook signature verification]
    ↓
[Parse checkout session]
    ↓
[Atomic credit increment RPC]
    ↓
[Acknowledge webhook to Stripe]
    ↓
[Frontend polling detects credit update]
```

### Key Data Flows

1. **Analysis Request Flow:** Synchronous validation → Atomic credit transaction → Async job queue → Worker processing → Database update → Frontend polling.

2. **File Upload Flow:** Client validation → Magic byte verification → Supabase Storage → SSRF-safe URL generation → Queue reference (not file data).

3. **Credit Transaction Flow:** Always uses PostgreSQL RPC for atomicity. No in-application credit calculations that could have race conditions.

4. **Admin Data Flow:** Separate admin-specific database views (`admin_supabase.ts`) that aggregate data across users (bypassing RLS with service role key, but only for aggregated/anonymized data).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Current architecture is optimal. Monolithic Nuxt app, single Upstash Redis plan, Supabase Free/Pro tier. |
| **1k-10k users** | Add caching layer (Redis) for frequent queries. Separate worker process onto dedicated infrastructure. Consider read replicas for analytics queries. |
| **10k-100k users** | Split Nuxt frontend from API backend. Dedicated worker autoscaling. Database connection pooling (PgBouncer). CDN for static analysis results. |
| **100k+ users** | Consider microservices (upload service, analysis service, payment service). Multi-region Supabase. Queue prioritization (premium users get faster processing). |

### Scaling Priorities

1. **First bottleneck: AI API rate limits and latency.** OpenAI has rate limits per organization. Fix: Implement request queuing with priorities, consider multi-account failover.

2. **Second bottleneck: Database connections under load.** Serverless functions create new connections per request. Fix: Implement PgBouncer connection pooling, or move to dedicated API server with persistent connections.

3. **Third bottleneck: Storage egress costs.** Large PDFs and results served from Supabase Storage. Fix: Implement CDN caching (CloudFront/Cloudflare) for public analysis results.

## Anti-Patterns

### Anti-Pattern 1: Direct AI API Calls from Frontend

**What people do:** Call OpenAI API directly from Vue components to save backend complexity.

**Why it's wrong:**
- Exposes API keys (even with edge functions, keys can leak)
- No rate limiting per user
- No audit logging of requests
- No centralized error handling
- Cannot implement credit billing

**Do this instead:** All AI calls go through server routes (`openai-client.ts`). Frontend only calls `/api/analyze`.

### Anti-Pattern 2: Storing Files in Database (BLOBs)

**What people do:** Store uploaded PDFs as base64 or bytea in PostgreSQL.

**Why it's wrong:**
- Database bloat, slower backups
- Expensive to serve (DB egress > Storage egress)
- No CDN integration
- Hit database size limits

**Do this instead:** Store files in object storage (Supabase Storage, S3). Store only metadata and URLs in database.

### Anti-Pattern 3: Synchronous AI Processing

**What people do:** Wait for OpenAI response in the same HTTP request as analysis trigger.

**Why it's wrong:**
- HTTP timeouts (Vercel: 60s, OpenAI: can take 2+ minutes for large docs)
- No retry logic possible
- Poor UX (no progress indication)
- Wasted compute if user navigates away

**Do this instead:** Use async job queue (BullMQ). Return job ID immediately. Poll for completion.

### Anti-Pattern 4: Row Level Security (RLS) Bypass Without Justification

**What people do:** Disable RLS "for performance" or use service role key everywhere "for convenience".

**Why it's wrong:**
- Users can access each other's data
- No audit trail of who accessed what
- Violates compliance requirements (SOC 2, GDPR)

**Do this instead:** Use RLS everywhere. For admin features, use service role key ONLY in server routes that aggregate/anonymize data. Never expose service role key to frontend.

### Anti-Pattern 5: Hardcoded AI Prompts

**What people do:** Embed prompts directly in TypeScript code.

**Why it's wrong:**
- Requires redeployment to tune prompts
- No A/B testing capability
- Mixes configuration with logic
- Harder to version and review changes

**Do this instead:** Store prompts in external files (`server/prompts/v2/`). Load at runtime. Version prompts (v1, v2, v3) for A/B testing.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OpenAI** | Server-side API client with model whitelist | Never call from frontend. Implement retry logic with exponential backoff. |
| **Stripe** | Webhook + Checkout redirect | Webhook signature verification is critical. Use atomic credit increment on webhook success. |
| **Supabase Auth** | Nuxt module (`@nuxtjs/supabase`) | Use `serverSupabaseUser()` in server routes. Never use client session server-side. |
| **Supabase Storage** | Direct upload from server routes | Validate file type with magic bytes. Use unique file paths (`{userId}/{timestamp}.pdf`). |
| **Upstash Redis** | BullMQ connection with TLS | Use token auth (not password). Enable TLS for production (rediss://). |
| **Vercel** | Serverless deployment preset | Configure route rules for security headers. Set appropriate timeouts for long routes. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Frontend ↔ API** | HTTP (JSON) | Strict TypeScript types on both sides. Zod validation at API boundary. |
| **API ↔ Queue** | BullMQ job objects | Only pass IDs and metadata (not file content). Files in storage. |
| **Worker ↔ Database** | PostgreSQL (via Supabase client) | Use service role key (RLS bypass necessary for workers). |
| **API ↔ OpenAI** | OpenAI SDK | Model whitelist validation before API call. JSON response parsing with fallbacks. |
| **API ↔ Stripe** | Stripe SDK + webhooks | Webhook secret verification. Idempotent credit handling. |

## Compliance & Security Considerations

### Data Protection Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Encryption at rest** | Supabase Storage (AES-256), PostgreSQL (TDE) |
| **Encryption in transit** | TLS 1.3 for all connections |
| **Access logging** | Supabase audit logs, custom logging in API routes |
| **Data minimization** | Store only necessary contract data, allow deletion |
| **User isolation** | Row Level Security (RLS) policies on all tables |

### SOC 2 / Compliance Readiness

For legal tech handling sensitive contracts, consider:
1. **Access controls**: Implement MFA for admin accounts
2. **Audit logging**: Log all data access (who, what, when)
3. **Data retention**: Implement automatic deletion policies
4. **Vendor assessment**: Document all subprocessors (OpenAI, Supabase, Stripe, Vercel)
5. **Incident response**: Create runbook for data breach scenarios

## Build Order Implications

Based on component dependencies, recommended build order:

### Phase 1: Foundation
- **Database schema** (users, analyses, credit_transactions tables)
- **Supabase Auth** (login, signup, session management)
- **Basic file upload** (upload to Supabase Storage)

### Phase 2: Core Analysis
- **OpenAI integration** (basic prompt, gpt-4o-mini)
- **Analysis queue** (BullMQ setup, worker process)
- **Analysis results display** (JSON rendering in frontend)

### Phase 3: Monetization
- **Credit system** (user_credits table, atomic RPC functions)
- **Stripe integration** (Checkout, webhook handling)
- **Tier selection UI** (Basic/Premium/Forensic options)

### Phase 4: Security Hardening
- **Row Level Security** (RLS policies on all tables)
- **Input validation** (Zod schemas, magic byte validation)
- **SSRF protection** (URL validation for storage access)
- **Error handling** (safe error messages, no internal leaks)

### Phase 5: Admin & Analytics
- **Admin dashboard** (revenue, user analytics)
- **Admin user management** (credit adjustment, suspensions)
- **Conversion tracking** (signup → purchase funnel)

### Phase 6: Polish & Export
- **PDF export** (formatted analysis reports)
- **Homepage demo** (interactive product showcase)
- **Free credits system** (signup bonus, monthly free analysis)

## Sources

- [InfoQ: Beyond OCR - AI Document Processing Architecture](https://www.infoq.com/articles/ocr-ai-document-processing/)
- [Extend: Document Ingestion Guide (December 2025)](https://www.extend.ai/resources/document-ingestion-ai-processing-guide)
- [V7 Labs: AI Document Analysis Complete Guide](https://www.v7labs.com/blog/ai-document-analysis-complete-guide)
- [Vertex AI Legal Document Review System Tutorial](https://oneuptime.com/blog/post/2026-02-17-how-to-build-a-legal-document-review-system-with-vertex-ai-search-and-gemini/view)
- [SOC 2 Compliance Explained (Aikido)](https://www.aikido.dev/learn/compliance/compliance-frameworks/soc-2)
- [Contract Management Security (Concord)](https://www.concord.com/contract-management-security/)
- [SaaS Compliance Guide (Drata)](https://drata.com/blog/saas-compliance)

---

*Architecture research for: Legal Tech / Contract Analysis SaaS*
*Researched: 2026-02-21*
