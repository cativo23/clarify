# Architecture Guide — Clarify

**Last Updated:** February 18, 2026

This document describes the technical architecture, core modules, and development guidelines for Clarify.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Component Architecture](#component-architecture)
4. [Core Data Flows](#core-data-flows)
5. [Analysis Tiers](#analysis-tiers)
6. [Security Architecture](#security-architecture)
7. [Deployment](#deployment)
8. [Development Guidelines](#development-guidelines)

---

## Overview

Clarify is a contract analysis platform that translates complex legal documents into visual, easy-to-understand summaries. The platform uses a multi-tier AI strategy to balance speed, cost, and analysis depth.

**Status:** 🟢 Production Ready

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Nuxt 3 / Vue 3 | SSR, Composition API |
| **UI** | Tailwind CSS | Styling, components |
| **Backend** | Nitro Engine | API endpoints |
| **Database** | Supabase (PostgreSQL) | Data storage, RLS |
| **Storage** | Supabase Storage | Encrypted PDF storage |
| **Queue** | BullMQ + Redis | Background job processing |
| **AI** | OpenAI (gpt-4o-mini, gpt-5-mini, gpt-5) | Contract analysis |
| **Payments** | Stripe | Checkout, webhooks |

---

## Component Architecture

### Frontend (Nuxt 3)

```
app/
├── pages/          # Route components
├── components/     # Reusable UI components
├── composables/    # Vue composables (state logic)
└── middleware/     # Auth middleware
```

- **Authentication:** Supabase Auth with session management
- **State:** Vue Composition API (`ref`, `computed`)
- **Realtime:** Supabase Realtime for live analysis updates

### Backend (Nitro)

```
server/
├── api/            # API endpoints
├── utils/          # Shared utilities
│   ├── auth.ts
│   ├── error-handler.ts
│   ├── file-validation.ts
│   ├── rate-limit.ts
│   ├── ssrf-protection.ts
│   └── stripe-client.ts
├── plugins/        # Server plugins (worker)
└── prompts/        # AI prompt templates
```

### Scoped Supabase Clients

| Client | Purpose | Access Level |
|--------|---------|--------------|
| `serverSupabaseClient` | User requests | RLS-enforced |
| `WorkerSupabaseClient` | Background jobs | Restricted |
| `AdminSupabaseClient` | Admin operations | Audited, service role |

---

## Core Data Flows

### Contract Analysis Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Client │ ──► │ /upload │ ──► │ Storage │ ──► │  Queue  │ ──► │ Worker  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
     ▲                                                      │
     │                                                      ▼
     │                                                ┌─────────┐
     │                                                │ OpenAI  │
     │                                                └─────────┘
     │                                                      │
     ▼                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Realtime Update                              │
└─────────────────────────────────────────────────────────────────┘
```

1. **Upload:** Client sends PDF to `/api/upload`
2. **Validation:** Magic byte verification, structural integrity check
3. **Storage:** File uploaded to Supabase Storage `contracts` bucket
4. **Queue:** Job enqueued in Redis via BullMQ
5. **Processing:** Worker picks job, calls OpenAI, parses JSON response
6. **Persistence:** Results saved to `analyses` table
7. **Notification:** Realtime subscription updates client UI

### Payment Flow

1. **Checkout:** User selects credit package, redirected to Stripe
2. **Payment:** User completes payment on Stripe
3. **Webhook:** Stripe sends `checkout.session.completed` to `/api/stripe/webhook`
4. **Fulfillment:** Signature verified, credits atomically incremented via RPC

---

## Analysis Tiers

| Tier | Model | Credits | Input Limit | Output Limit | Use Case |
|------|-------|---------|-------------|--------------|----------|
| **Basic** | gpt-4o-mini | 1 | 8,000 | 2,500 | Simple leases, ToS, privacy policies |
| **Premium** | gpt-5-mini | 3 | 35,000 | 10,000 | Business contracts (recommended) |
| **Forensic** | gpt-5 | 10 | 120,000 | 30,000 | High-value audits, complex frameworks |

### Configuration

Managed in `server/utils/config.ts` with database overrides via `configurations` table.

### Optimization Techniques

- **Semantic Preprocessing:** `js-tiktoken` (cl100k_base) prioritizes critical clauses (Liability, Termination, Indemnification)
- **Prompt Versioning:** v2 enforces strict JSON output with conciseness on low-risk items
- **Prompt Caching:** Static prefixes achieve 55-70% cache hit rates
- **Token Debug:** `features.tokenDebug = true` enables detailed logging

---

## Security Architecture

### Implemented Controls

| Control | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth with RLS |
| **Admin Auth** | `normalizeEmail()` + `admin_emails` table |
| **Rate Limiting** | Redis-based (Upstash with TLS) |
| **Input Validation** | Zod schemas on all endpoints |
| **File Security** | Magic byte validation (PDF only) |
| **SSRF Protection** | URL allowlist for Supabase storage |
| **Error Handling** | Sanitized messages, no info disclosure |
| **Security Headers** | CSP, HSTS, COEP, COOP, CORP |

### Security Files Reference

| File | Purpose |
|------|---------|
| `server/utils/auth.ts` | Admin authentication |
| `server/utils/rate-limit.ts` | Rate limiting |
| `server/utils/file-validation.ts` | Magic byte validation |
| `server/utils/ssrf-protection.ts` | SSRF prevention |
| `server/utils/error-handler.ts` | Error sanitization |
| `server/api/stripe/webhook.post.ts` | Webhook security |

**See [SECURITY.md](./SECURITY.md) for complete audit findings and maintenance procedures.**

---

## Deployment

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyxxx...
SUPABASE_SERVICE_ROLE=eyxxx...

# OpenAI
OPENAI_API_KEY=sk-xxx...

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis (Upstash)
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_TOKEN=xxx  # Required in production

# Admin
ADMIN_EMAIL=admin@example.com
```

### Infrastructure

- **Containerization:** Docker with non-root user
- **Deployment:** Vercel preset (Nitro)
- **Database:** Migrations via `scripts/migrate.ts`

---

## Development Guidelines

### Security Principles

1. **Zero Trust:** Never trust client input
2. **SSR-Only Logic:** Sensitive calculations server-side only
3. **Scoped Access:** Use most restrictive Supabase client
4. **Atomic Operations:** Credit changes via RPC only

### Code Standards

1. **Error Handling:** Use `handleApiError()` for sanitized responses
2. **Input Validation:** Zod schemas on all `server/api` routes
3. **TypeScript:** Strict mode enabled
4. **Testing:** Validate token limits, error paths

### Key Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run db:migrate   # Run database migrations
npm audit            # Security audit dependencies
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [SECURITY.md](./SECURITY.md) | Security audit & maintenance |
| [ANALYSIS_TIERS.md](./ANALYSIS_TIERS.md) | Detailed tier configuration |
| [STRIPE_SETUP.md](./STRIPE_SETUP.md) | Stripe configuration guide |

---

*Last Reviewed: February 18, 2026*
