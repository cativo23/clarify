# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clarify is an AI-powered contract auditing platform that analyzes legal documents and produces risk assessments. Built with Nuxt 3 (full-stack), Supabase (PostgreSQL + Auth + Storage), OpenAI (GPT models), Stripe (payments), and BullMQ/Redis (job queues).

## Commands

```bash
# Development
npm run dev              # Start dev server on port 3001
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type check

# Database (Laravel-style migrations)
npm run db:init          # Show SQL to create _migrations table
npm run db:migrate       # Run pending migrations
npm run db:status        # Show migration status
npm run db:rollback      # Rollback last batch
npm run db:seed          # Run database seeders
npm run db:wipe          # Delete all data (--force required)
npm run db:refresh       # Wipe + re-migrate + seed (--force required)
npm run migrate:make     # Create new migration <name>

# Docker
docker compose up -d     # Start all services (app, postgres, redis, pgadmin)
docker compose down      # Stop all services

# Security
npm run security:audit   # Run npm audit
npm run security:fix     # Auto-fix vulnerabilities
```

## Architecture

### Directory Structure

```
├── app/                 # Nuxt app root
├── components/          # Vue components (AppHeader, RiskCard, Dropzone)
├── composables/         # Vue composables (useSupabase, shared state)
├── database/
│   ├── migrations/      # SQL migration files
│   └── seeders/         # SQL seeder files
├── docs/                # Technical documentation
├── middleware/          # Route guards (auth.ts, admin.ts)
├── pages/               # Nuxt pages (dashboard, analyze, login, admin/)
├── server/
│   ├── api/             # Nitro API endpoints
│   │   ├── admin/       # Admin-only endpoints
│   │   ├── analyses/    # Analysis-related endpoints
│   │   ├── stripe/      # Stripe webhook/checkout
│   │   └── *.ts         # Main endpoints (analyze, upload, user)
│   ├── prompts/         # AI prompt templates (v2/current, v1_deprecated)
│   └── utils/           # Server utilities (auth, queue, openai, stripe, etc.)
├── types/               # TypeScript type definitions
└── scripts/             # Utility scripts (migrate.ts, test-redis.ts)
```

### Core Flows

**Contract Analysis (Async Job Queue)**
1. Client uploads PDF to `/api/upload` → validated (magic bytes) → stored in Supabase Storage
2. Client calls `/api/analyze` with `file_url`, `analysis_type` (basic/premium/forensic)
3. Server validates input (Zod), checks SSRF protection, creates analysis record via RPC
4. Job enqueued to BullMQ/Redis → worker processes with OpenAI → results saved to DB
5. Client polls `/api/analyses/[id]/status` for completion

**Payment & Credits**
1. User initiates Stripe checkout → `/api/stripe/checkout.post.ts`
2. Payment success → Stripe webhook → `/api/stripe/webhook.post.ts`
3. Credits atomically incremented via PostgreSQL RPC (prevents race conditions)

**Authentication**
- Supabase Auth with email verification
- Middleware: `auth.ts` (require login), `admin.ts` (require admin role)
- Admin status checked via `is_admin` field in user profile + `admin_emails` table

### Analysis Tiers

| Tier | Model | Credits | Use Case |
|------|-------|---------|----------|
| Basic | gpt-4o-mini | 1 | Simple contracts, red-flag only |
| Premium | gpt-5-mini | 3 | Full reasoning, recommended |
| Forensic | gpt-5 | 10 | High-stakes, exhaustive analysis |

Configuration in `server/utils/config.ts`, overrideable via `configurations` DB table.

### Security Architecture

**Key Principles**
- Zero Trust: All inputs validated, outputs sanitized
- Scoped Supabase Clients: `WorkerSupabaseClient`, `AdminSupabaseClient`, `serverSupabaseClient`
- Atomic Operations: Credit changes via PostgreSQL RPCs only
- RLS: Row Level Security enforced on all Supabase tables

**Critical Files**
- `server/utils/auth.ts` - Admin auth with email normalization (homograph attack prevention)
- `server/utils/ssrf-protection.ts` - URL validation for Supabase Storage URLs
- `server/utils/error-handler.ts` - Centralized error sanitization
- `server/utils/rate-limit.ts` - Rate limiting presets
- `nuxt.config.ts` - Security headers (CSP, HSTS, X-Frame-Options, etc.)

**Admin Access**
- Primary: `ADMIN_EMAIL` env variable
- Secondary: `admin_emails` database table (multiple admins, soft-delete via `is_active`)
- See `server/utils/auth.ts:isAdminUser()` for defense-in-depth implementation

## Database Schema

Key tables (see `database/migrations/` for DDL):
- `users` - User profiles with `credits`, `is_admin`
- `analyses` - Contract analysis jobs (status, results, tier)
- `transactions` - Credit purchase history
- `admin_emails` - Additional admin emails beyond `ADMIN_EMAIL` env
- `configurations` - Dynamic config overrides (feature flags, pricing)
- `pricing_tables` - Model pricing for cost estimation
- `_migrations` - Migration tracking

## Environment Variables

Required (`.env` - never committed):
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyxxx...          # Anon key (client-safe)
SUPABASE_SERVICE_KEY=eyxxx...  # Service role (server-only)

# OpenAI
OPENAI_API_KEY=sk-xxx...

# Stripe
STRIPE_SECRET_KEY=sk_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
STRIPE_PUBLISHABLE_KEY=pk_xxx...

# Redis (Upstash for production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TOKEN=xxx          # Required for Upstash (triggers TLS)

# Admin
ADMIN_EMAIL=admin@example.com
```

## CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`):
- Lint & typecheck on every push/PR
- Build verification
- Vercel deployment (main → production, PR → preview)

## Testing

No formal test suite currently. Manual testing via:
- Dev server: `npm run dev`
- Redis test: `scripts/test-redis.ts`
- Health check: `GET /api/health`

## Documentation

- `docs/DEV_WALKTHROUGH.md` - MVP overview, module guide
- `docs/ARCHITECTURE.md` - Technical architecture, data flows
- `docs/ANALYSIS_TIERS.md` - Model strategy, token optimization
- `docs/SECURITY_MAINTENANCE.md` - Security tasks, incident response
- `docs/STRIPE_SETUP.md` - Stripe integration guide
