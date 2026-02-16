# Architecture Recommendations

> **Date:** February 16, 2026
> **Current Stack:** Nuxt 3 (Nitro) · Supabase · BullMQ/Redis · OpenAI · Stripe

## Verdict: Keep Nuxt Server Routes (Nitro)

The current monolithic full-stack architecture is a **good fit** for Clarify's scale and complexity. Migrating to a dedicated backend framework like NestJS would introduce accidental complexity without solving a real problem today.

### Why the Current Setup Works

| Aspect | How It's Handled |
|---|---|
| API routes | ~13 endpoints via `server/api/` — manageable scope |
| Auth | Supabase (not custom) |
| Database | Supabase Postgres + RLS policies |
| Async processing | BullMQ + Redis job queue |
| Payments | Stripe checkout + webhook |
| AI pipeline | OpenAI client with preprocessing & prompt versioning |
| Deployment | Docker + Traefik, Vercel-ready via Nitro preset |

### Why NestJS Would Be Overkill

- **Doubled complexity** — Two projects, two build pipelines, two containers, CORS config, separate deployments.
- **Small API surface** — ~13 endpoints with straightforward logic. NestJS earns its keep at 50+ endpoints with complex domain models.
- **Supabase offloads heavy lifting** — Auth, RLS, real-time subscriptions, storage are all handled externally.
- **BullMQ already solves async** — The analysis job queue is the only "backend-grade" infrastructure needed, and it's already working.

---

## Recommended Improvements

Instead of migrating, harden the current architecture with these changes:

### 1. Add a Services Layer

Decouple business logic from route handlers. Create `server/services/` to separate concerns.

```
server/
├── api/              # Route handlers (thin — validation + delegation)
├── services/         # Business logic (analysis, credits, billing)
├── utils/            # Infrastructure clients (OpenAI, Stripe, Redis)
└── prompts/          # AI prompt templates
```

**Example:** Move credit-checking and analysis-creation logic out of `analyze.post.ts` into an `AnalysisService` that the route handler calls.

### 2. Input Validation with Zod

Add schema-based validation on all API routes to catch bad input early and provide clear error messages.

```typescript
// server/schemas/analysis.ts
import { z } from 'zod'

export const AnalyzeRequestSchema = z.object({
  file_url: z.string().url(),
  contract_name: z.string().min(1).max(255),
  analysis_type: z.enum(['basic', 'premium']).default('premium'),
})
```

### 3. Centralized Error Handling

Create a Nitro server plugin or middleware for consistent error responses instead of try/catch in every endpoint.

```typescript
// server/plugins/error-handler.ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event }) => {
    // Structured error logging
    // Consistent error response format
  })
})
```

### 4. Integration Tests

Add tests for critical flows:

- **Analysis pipeline** — Upload → enqueue → process → complete
- **Stripe webhooks** — Payment success → credit allocation
- **Auth guards** — Unauthorized access returns 401
- **Credit deduction** — Atomic transaction with insufficient credits

Use Vitest (already compatible with Nuxt 3) with `$fetch` for API route testing.

---

## When to Reconsider a Dedicated Backend

Revisit this decision if any of these become true:

| Trigger | Why |
|---|---|
| Multiple clients need the API | Mobile app, public API, third-party integrations |
| Domain logic grows significantly | Multi-step workflows, approval chains, complex audit trails |
| Microservice extraction needed | Separating AI engine from web app |
| Team scales | Dedicated frontend and backend teams |
| Outgrowing Supabase | Need custom DB layer with Prisma/TypeORM |

> [!TIP]
> If you reach 40+ endpoints serving multiple clients, that's the natural inflection point where NestJS (or a lightweight alternative like Hono/Elysia) earns its keep.
