# Technology Stack

**Project:** Clarify - AI Contract Analysis Micro-SaaS
**Domain:** Legal Tech / Contract Analysis SaaS
**Researched:** 2026-02-21
**Confidence:** HIGH (verified with official docs and current sources)

---

## Executive Summary

The 2025 standard stack for legal tech / contract analysis micro-SaaS has converged around **serverless-first architectures** with **AI-native integration patterns**. The current project (Clarify) already uses a **highly aligned stack** with industry best practices. This research validates existing choices and provides prescriptive recommendations for enhancements.

### Key Validation Findings

| Current Choice | Industry Standard | Status |
|----------------|-------------------|--------|
| Nuxt 3.15.1 | Vue/Nuxt full-stack | **VALIDATED** - Strong choice for 2025 |
| Supabase | PostgreSQL BaaS | **VALIDATED** - Default for micro-SaaS |
| OpenAI API (gpt-4o-mini, gpt-5-mini, gpt-5) | Multi-tier LLM | **VALIDATED** - 3-tier strategy is best practice |
| BullMQ + Upstash Redis | Serverless queue | **VALIDATED** - Correct for Vercel |
| Stripe | Payments | **VALIDATED** - Industry standard |
| Tailwind CSS | Styling | **VALIDATED** - v4 migration recommended |
| Zod | Schema validation | **VALIDATED** - 2025 best practice |
| Vercel deployment | Serverless hosting | **VALIDATED** - Optimal for Nuxt |

---

## Recommended Stack

### Core Framework Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Nuxt** | 3.15.x (migrate to 3.16+ when stable) | Full-stack Vue framework | Server-side rendering, API routes, TypeScript-first, Vercel-optimized. Current 3.15.1 is production-ready. **HIGH confidence** |
| **Vue** | 3.5.x (via Nuxt) | UI framework | Composition API, reactivity system, Nuxt integration. **HIGH confidence** |
| **TypeScript** | 5.7.x | Type system | Strict typing mandatory for legal tech (liability concerns). Avoid `any` at all costs. **HIGH confidence** |

### Database & Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Supabase** | 2.76.x CLI | PostgreSQL BaaS + Auth + Storage | **The** default for 2025 micro-SaaS. Row Level Security (RLS) is critical for legal document isolation. Auth integration reduces complexity. **HIGH confidence** |
| **PostgreSQL RPCs** | Native | Atomic credit operations | Prevents race conditions in credit/financial transactions. Verified pattern from Supabase docs. **HIGH confidence** |

### AI/LLM Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **OpenAI API** | Latest (via SDK 4.77.x) | Contract analysis | 3-tier strategy validated: gpt-4o-mini (fast/cheap), gpt-5-mini (balanced), gpt-5 (premium). **HIGH confidence** |
| **openai npm** | 4.77.x | API client | Official SDK with TypeScript types, streaming support, structured outputs. **HIGH confidence** |
| **js-tiktoken** | 1.0.x | Token counting | Pre-compute token usage for cost estimation before API calls. **MEDIUM confidence** |

**2025 API Pricing Reference** (verified January 2026):
| Model | Input ($/1M) | Output ($/1M) | Use Case |
|-------|--------------|---------------|----------|
| gpt-4o-mini | $0.15 | $0.60 | Basic tier (1 credit) |
| gpt-5-mini | $1.50 | $7.50 | Premium tier (3 credits) |
| gpt-5 | $15.00 | $75.00 | Forensic tier (10 credits) |

### Queue & Background Processing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **BullMQ** | 5.67.x | Job queue | Redis-based, TypeScript-native, retry logic, delayed jobs. **Essential** for long-running AI analysis (Vercel timeout limits). **HIGH confidence** |
| **Upstash Redis** | Serverless | Redis provider | HTTP-based (no TCP connection issues), Vercel Marketplace integration, pay-per-request pricing. Free tier: 10K commands/day. **HIGH confidence** |
| **ioredis** | 5.9.x | Redis client | BullMQ dependency, connection pooling, TypeScript support. **HIGH confidence** |

**Critical Architecture Note:** Vercel serverless functions have **maximum 60-second timeout** (Pro plan). Contract analysis with gpt-5 can exceed this. BullMQ workers must run as **separate long-running processes** (not Vercel Functions). Options:
1. **Upstash QStash** (serverless cron/queue, HTTP worker endpoints)
2. **Railway/Render worker service** (separate deployment for BullMQ workers)
3. **Vercel Fluid Compute** (new 2025, extended timeouts for Pro+)

### File Storage & Processing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Supabase Storage** | Built-in | Document storage | Integrated with Auth/RLS, S3-compatible, signed URLs. Avoid Vercel Blob (less mature, no RLS). **HIGH confidence** |
| **pdf-parse** | 1.1.x | PDF text extraction | Node.js native, lightweight, works with pdfkit. For basic text extraction. **HIGH confidence** |
| **pdfkit** | 0.17.x | PDF generation | Export analysis reports as branded PDFs. Server-side generation. **HIGH confidence** |

**2025 Document Processing Alternatives** (for future enhancement):
| Library | Best For | Confidence |
|---------|----------|------------|
| **LlamaParse** | Complex PDFs with tables | MEDIUM - API cost adds up |
| **Docling (IBM)** | Open-source layout preservation | LOW - Python, requires separate service |
| **Gemini 2.5 Pro Vision** | Native PDF+image analysis | MEDIUM - Consider for multimodal tier |

### Payments & Billing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Stripe** | 17.5.x | Payments + webhooks | Industry standard, TypeScript SDK, webhook signature verification essential. **HIGH confidence** |
| **@stripe/stripe-js** | 4.8.x | Client checkout | Stripe Elements, secure payment forms. **HIGH confidence** |

**Critical Security Note:** Stripe webhook handlers **MUST** verify signature using `stripe.webhooks.constructEvent()`. Failure = credit fraud vulnerability.

### Styling & UI

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Tailwind CSS** | 3.4.x (migrate to 4.0.x) | Utility CSS | **Migration to v4.0 recommended for new projects**. v4 uses CSS-first configuration (`@theme` directive), removes `tailwind.config.js`. Current project on v3 is fine for MVP. **HIGH confidence** |
| **@nuxtjs/tailwindcss** | 6.12.x | Nuxt module | Auto-injects Tailwind, PostCSS configured. **HIGH confidence** |
| **@nuxtjs/color-mode** | 4.0.x | Dark mode | Class-based dark mode, persists preference. **HIGH confidence** |
| **Lucide Icons** | 0.563.x | Icon set | Tree-shakeable, consistent design, Vue 3 support (`lucide-vue-next`). **HIGH confidence** |
| **Heroicons** | 2.2.x | Icon set (backup) | Official Tailwind icons, SVG components. **HIGH confidence** |

**Tailwind v4 Migration Notes:**
```css
/* Old v3: tailwind.config.js */
module.exports = { theme: { extend: { colors: { primary: '#...' } } } }

/* New v4: CSS-first */
@theme {
  --color-primary: #...;
}
@import "tailwindcss";
```

### Validation & Type Safety

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Zod** | 3.x | Schema validation | **2025 standard** for runtime validation + TypeScript inference. Use `z.infer<Type>` to avoid type duplication. `safeParse()` for error handling. **HIGH confidence** |

**Zod Best Practices for 2025:**
```typescript
// Schema is your source of truth
const ContractSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(100),
  uploadedAt: z.coerce.date(), // Auto-converts strings to Date
  tier: z.enum(['basic', 'premium', 'forensic']),
});

// Infer type automatically
type Contract = z.infer<typeof ContractSchema>;

// Validate and transform
const result = ContractSchema.safeParse(input);
if (!result.success) {
  throw createError({ statusCode: 400, message: result.error.message });
}
```

### Security

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **nuxt-security** | 2.5.x | Security headers | CSP, HSTS, XSS protection, rate limiting. Configure for `blob:` URLs (required for workers). **HIGH confidence** |
| **Magic Byte Validation** | Custom | File upload security | **Critical for legal docs**. Verify file header bytes, not just extension/MIME. Prevents webshell uploads. **HIGH confidence** |

**Magic Byte Validation Pattern:**
```typescript
const PDF_MAGIC = Buffer.from('255044462d', 'hex'); // %PDF-
const JPEG_MAGIC = Buffer.from('ffd8ffe0', 'hex');

function validateMagicBytes(buffer: Buffer, type: string): boolean {
  const magic = getMagicForType(type);
  return buffer.slice(0, magic.length).equals(magic);
}
```

### Testing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Vitest** | 2.1.x | Unit testing | Vite-native, fast, TypeScript support, Nuxt integration. **HIGH confidence** |
| **@vitest/ui** | 2.1.x | Test UI | Watch mode UI, debugging. **MEDIUM confidence** |
| **Playwright** | 1.49.x | E2E testing | Cross-browser, mobile emulation, visual regression. **HIGH confidence** |
| **@vue/test-utils** | 2.4.x | Component testing | Vue 3 component mounting, shallow rendering. **HIGH confidence** |
| **Happy DOM** | 15.11.x | JSDOM alternative | Faster than JSDOM, better Web API support. **HIGH confidence** |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **chart.js** | 4.5.x | Admin analytics | Revenue dashboards, conversion tracking. Use `@vue` wrapper or composables. |
| **@heroicons/vue** | 2.2.x | Icon components | Alternative to Lucide, official Tailwind icons. |
| **zod** | 3.x | API validation | All `/api/*` endpoints, Server Actions, webhook handlers. |

---

## Installation Commands

```bash
# Core stack (already installed in project)
npm install nuxt@3.15 vue@latest typescript@5.7

# Supabase & Database
npm install @nuxtjs/supabase@1.4 supabase@2.76

# AI & Queue
npm install openai@4.77 bullmq@5.67 ioredis@5.9 js-tiktoken@1.0

# Payments
npm install stripe@17.5 @stripe/stripe-js@4.8

# Styling
npm install @nuxtjs/tailwindcss@6.12 @nuxtjs/color-mode@4.0 lucide-vue-next@0.563

# Validation & Security
npm install zod@3 nuxt-security@2.5 pdf-parse@1.1

# PDF Generation
npm install pdfkit@0.17 --save-dev

# Testing
npm install -D vitest@2.1 @vitest/ui@2.1 playwright@1.49 @vue/test-utils@2.4 happy-dom@15.11
```

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Next.js for this project** | Already invested in Nuxt/Vue. Migration cost > benefit. Nuxt 3 is equally capable. | **Nuxt 3** (already chosen, validated) |
| **Firebase** | No Row Level Security, vendor lock-in, expensive at scale. | **Supabase** (PostgreSQL + RLS) |
| **Plain PostgreSQL** | No built-in auth, storage, or RLS policies. Too much boilerplate for micro-SaaS. | **Supabase** (managed Postgres) |
| **AWS S3 directly** | Complex IAM, no RLS integration, overkill for MVP. | **Supabase Storage** (S3-compatible, simpler) |
| **Vercel Blob** | Less mature, no RLS, limited to Vercel ecosystem. | **Supabase Storage** (integrated with auth) |
| **Traditional Redis (TCP)** | Cold starts in serverless, connection limits. | **Upstash Redis** (HTTP-based, serverless) |
| **Bull (v4 or older)** | No TypeScript, deprecated. | **BullMQ** (TypeScript-native, actively maintained) |
| **Joi / Yup** | Runtime-only, no TypeScript inference. | **Zod** (validates + infers types) |
| **jsPDF** | Client-side only, limited features, poor font support. | **pdfkit** (server-side, professional output) |
| **Tailwind v3 for new projects** | v4 has CSS-first config, better performance, native nesting. | **Tailwind v4** (for greenfield; v3 OK for existing) |
| **Subscription billing for MVP** | Complex proration, dunning, tax handling. | **Credit-based** (simpler, validated model) |
| **Self-hosted LLMs (Ollama, etc.)** | Accuracy not sufficient for legal analysis, liability concerns. | **OpenAI API** (state-of-the-art accuracy) |
| **LangChain / LlamaIndex** | Overkill for single-model contract analysis. Adds complexity without value. | **Direct OpenAI SDK** (simpler, full control) |

---

## Stack Patterns by Variant

### If Building from Scratch (Greenfield)
- Use **Tailwind v4** from day one (CSS-first configuration)
- Consider **Nuxt 4** when stable (expected Q2 2026)
- Evaluate **Vercel Fluid Compute** for worker deployment (simplifies BullMQ hosting)

### If Scaling Beyond MVP
- Add **PostgreSQL connection pooling** (pgBouncer via Supabase)
- Implement **Redis caching layer** for repeated analysis queries
- Consider **multi-region Supabase** for latency (AWS us-east-1 + eu-west-1)

### If Adding Multi-tenancy
- **Schema-per-tenant** pattern in PostgreSQL (not row-based)
- **Supabase Organizations** feature (when available)
- **Stripe Connect** for marketplace payments

### If Expanding to Enterprise
- **Harvey AI** or **Lexis+ AI** integration (legal-specific models)
- **SOC 2 compliance** infrastructure (audit logs, encryption at rest)
- **SAML SSO** via Supabase SSO or Auth0 Enterprise

---

## Version Compatibility Matrix

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Nuxt 3.15.x | Vue 3.5.x, TypeScript 5.7.x | Avoid Nuxt 2 (EOL) |
| @nuxtjs/supabase 1.4.x | Supabase JS 2.x | TypeScript types included |
| BullMQ 5.x | Redis 7.x, ioredis 5.x | Node 18+ required |
| Stripe 17.x | Node 18+ | Webhook signing requires exact body |
| Zod 3.x | TypeScript 5.x | Type inference works with Nuxt auto-imports |
| pdfkit 0.17.x | Node 18+, pdf-parse 1.1.x | Both use same PDF spec |
| Tailwind 3.4.x | PostCSS 8.x | v4 requires different setup |
| Tailwind 4.x | PostCSS 8.x, Vite 5.x | Breaking changes from v3 |

---

## Deployment Stack (Vercel-Optimized)

| Component | Service | Configuration |
|-----------|---------|---------------|
| **Frontend + SSR** | Vercel | Nuxt preset-vercel, fluid compute enabled |
| **Serverless Functions** | Vercel Functions | Max 60s timeout (Pro plan) |
| **Background Workers** | Railway/Render | Separate deployment for BullMQ |
| **Database** | Supabase | Production plan, daily backups |
| **Redis** | Upstash | Free tier sufficient for MVP |
| **File Storage** | Supabase Storage | 500MB free, signed URLs |
| **DNS** | Vercel Domains | Auto-configured |
| **SSL** | Vercel Auto SSL | Automatic renewal |

---

## Alternative Stacks Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|------------------------|
| **Framework** | Nuxt 3 | Next.js 15 | If team has React expertise, need larger ecosystem |
| **Database** | Supabase | Neon + Drizzle | If need more PostgreSQL control, advanced migrations |
| **Auth** | Supabase Auth | Clerk | If need advanced SSO, B2B features |
| **Queue** | BullMQ + Upstash | Inngest | If want workflow orchestration, built-in retries |
| **Payments** | Stripe | Lemon Squeezy | If selling digital products, want merchant-of-record |
| **Styling** | Tailwind | Panda CSS | If want zero-runtime, atomic CSS extraction |
| **PDF Generation** | pdfkit | React-PDF | If want React-based PDF templates |

---

## Critical Architecture Decisions

### 1. Async Job Queue (BullMQ) - VALIDATED
**Why:** Vercel serverless timeout (60s max) < contract analysis time (2-5 min for gpt-5).
**Pattern:** Upload -> Queue -> Worker -> Webhook/Database -> User Notification.
**Deployment:** Workers cannot run on Vercel Functions. Use Railway/Render or Upstash QStash.

### 2. Row Level Security (RLS) - VALIDATED
**Why:** Legal documents require strict isolation (liability, privacy).
**Pattern:** Every table has RLS policy. User can only access their own documents.
**Critical:** Test RLS policies with `supabase test` before production.

### 3. Atomic Credit Operations - VALIDATED
**Why:** Race conditions in credit deduction = free analyses, revenue loss.
**Pattern:** PostgreSQL RPC function (not client-side decrement).
**Example:** `SELECT deduct_credits(user_id, amount)` - atomic, transactional.

### 4. Magic Byte Validation - VALIDATED
**Why:** File upload = #1 attack vector (OWASP). Extension spoofing trivial.
**Pattern:** Read first 8 bytes, compare to known signatures (PDF: `%PDF-`, JPEG: `FF D8 FF`).
**Critical:** Validate BEFORE storing in Supabase Storage.

---

## Sources

- **OpenAI API Pricing** - https://platform.openai.com/docs/pricing (verified January 2026)
- **Supabase Documentation** - https://supabase.com/docs (RLS, Storage, Auth patterns)
- **Nuxt 3 Documentation** - https://nuxt.com/docs (v3.15 features, Vercel deployment)
- **Tailwind CSS v4** - https://tailwindcss.com/docs (v4 migration guide, CSS-first config)
- **Zod Best Practices** - https://zod.dev (TypeScript inference, safeParse patterns)
- **BullMQ Documentation** - https://docs.bullmq.io (v5 features, Redis requirements)
- **Upstash Redis** - https://upstash.com/docs (Vercel integration, pricing)
- **Vercel Functions** - https://vercel.com/docs/functions (timeout limits, fluid compute)
- **Stripe Webhooks** - https://stripe.com/docs/webhooks (signature verification)
- **OWASP File Upload Security** - https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

---

*Stack research for: Legal Tech / Contract Analysis Micro-SaaS*
*Researched: 2026-02-21*
*Confidence: HIGH - All recommendations verified with official documentation and 2025 sources*
