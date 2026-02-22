# External Integrations

**Analysis Date:** 2026-02-21

## APIs & External Services

**AI / Machine Learning:**
- **OpenAI API** - Contract analysis with 3-tier strategy
  - SDK: `openai` package v4.77.3
  - Auth: `OPENAI_API_KEY` environment variable
  - Models: `gpt-4o-mini` (Basic), `gpt-5-mini` (Premium), `gpt-5` (Forensic)
  - Location: `server/utils/openai-client.ts`
  - Features: JSON response format, token counting, prompt versioning

**Payments:**
- **Stripe** - Credit purchases and payment processing
  - SDK: `stripe` package v17.5.0, `@stripe/stripe-js` v4.8.0
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Webhook endpoint: `/api/stripe/webhook` (POST)
  - Checkout endpoint: `/api/stripe/checkout` (POST)
  - Location: `server/utils/stripe-client.ts`, `server/api/stripe/`
  - Credit packages: 5 credits ($4.99), 10 credits ($8.99), 25 credits ($19.99)

## Data Storage

**Database:**
- **Supabase (PostgreSQL)** - Primary database with Row Level Security
  - Connection: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
  - Client: `@nuxtjs/supabase` v1.4.0
  - RLS: Enabled on all tables with user-based policies
  - Location: `server/utils/auth.ts`, `server/api/**/*.ts`

**Tables:**
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User accounts and credits | `id`, `email`, `credits` |
| `analyses` | Contract analysis results | `user_id`, `contract_name`, `summary_json`, `risk_level`, `status` |
| `transactions` | Payment history | `user_id`, `stripe_payment_id`, `credits_purchased`, `amount` |
| `admin_emails` | Admin user registry | `email`, `is_active` |
| `pricing` | Tier configuration | `name`, `credits`, `price` |

**File Storage:**
- **Supabase Storage** - Contract PDF uploads
  - Bucket: `contracts`
  - Access: Private with signed URLs
  - SSRF Protection: `server/utils/ssrf-protection.ts` validates all storage URLs
  - Upload endpoint: `/api/upload` with magic byte validation

**Caching:**
- **Upstash Redis** (Production) - Job queue backend
  - Connection: `REDIS_HOST`, `REDIS_PORT`, `REDIS_TOKEN`
  - TLS enabled via `rediss://` protocol
  - Client: `ioredis` v5.9.2, `bullmq` v5.67.2
  - Queue: `analysis-queue` with exponential backoff

**Local Development:**
- **Redis 7** (Docker) - Local queue for testing
  - Port: 6379
  - No authentication required locally

## Authentication & Identity

**Auth Provider:**
- **Supabase Auth** - User authentication and session management
  - Implementation: JWT-based sessions via `@nuxtjs/supabase`
  - Functions: `serverSupabaseUser`, `serverSupabaseClient` from `#supabase/server`
  - Location: `server/utils/auth.ts`

**Admin Authentication:**
- Dual-check system:
  1. `ADMIN_EMAIL` config variable
  2. `admin_emails` database table (multiple admins support)
- Email normalization with Unicode NFKC (prevents homograph attacks)
- Location: `server/utils/auth.ts` (`isAdminUser`, `requireAdmin`)

## Monitoring & Observability

**Error Tracking:**
- **Console logging** with structured error messages
- Server-side error handler: `server/utils/error-handler.ts`
- Security alerts logged for webhook failures, rate limit violations

**Logs:**
- File upload validation logged for security auditing
- Analysis job failures tracked in queue configuration
- Stripe webhook signature failures trigger security alerts

## CI/CD & Deployment

**Hosting:**
- **Vercel** - Serverless deployment
  - Nitro preset: `vercel` (configured in `nuxt.config.ts`)
  - Preview deployments for pull requests
  - Production deployment from `main` branch

**CI Pipeline:**
- **GitHub Actions** (`.github/workflows/ci-cd.yml`)
  - Jobs: Lint & Typecheck → Build → Deploy
  - Node.js 20.x with npm caching
  - Artifacts: `.output` directory (7-day retention)

**Secrets Management:**
- GitHub Secrets: `SUPABASE_*`, `OPENAI_API_KEY`, `STRIPE_*`, `VERCEL_*`
- Environment variables injected at build/deploy time

## Environment Configuration

**Required Environment Variables:**
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis (Upstash in production)
REDIS_HOST=your-host.upstash.io
REDIS_PORT=6379
REDIS_TOKEN=your_token

# Application
BASE_URL=https://your-domain.com
ADMIN_EMAIL=admin@example.com
ALLOWED_REDIRECT_ORIGINS=https://your-domain.com
```

**Secrets Location:**
- Development: `.env` file (gitignored)
- Production: Vercel environment variables / GitHub Secrets

## Webhooks & Callbacks

**Incoming Webhooks:**
- **Stripe Webhook** - `POST /api/stripe/webhook`
  - Signature verification via `STRIPE_WEBHOOK_SECRET`
  - Rate limited (payment preset)
  - Events handled:
    - `checkout.session.completed` - Credit fulfillment via atomic RPC
    - `payment_intent.succeeded` - Logging only
  - Location: `server/api/stripe/webhook.post.ts`

**Outgoing Webhooks:**
- None detected (application is webhook receiver only)

## Security Integrations

**CSP (Content Security Policy):**
- Configured via `nuxt-security` module
- Allowed origins: `js.stripe.com`, `challenges.cloudflare.com`, `api.openai.com`, `api.stripe.com`
- Supabase WebSocket connections: `wss://*.supabase.co`

**Rate Limiting:**
- Custom implementation: `server/utils/rate-limit.ts`
- Applied to webhook endpoints and analysis endpoints

**SSRF Protection:**
- Supabase Storage URL validation: `server/utils/ssrf-protection.ts`
- Private IP blocking for external URL requests

---

*Integration audit: 2026-02-21*
