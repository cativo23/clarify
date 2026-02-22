# Technology Stack

**Analysis Date:** 2026-02-21

## Languages

**Primary:**
- **TypeScript 5.7.3** - All application code, server utilities, API endpoints, and Vue components
- **Vue 3** - Frontend component framework with Composition API

**Secondary:**
- **SQL (PostgreSQL)** - Database queries, migrations, and Row Level Security policies
- **HTML/CSS** - Templates and styling with Tailwind CSS

## Runtime

**Environment:**
- **Node.js 20.x** - Server-side runtime (specified in CI/CD)
- **npm 10.x** - Package management with lockfile v3

**Package Manager:**
- **npm** with `package-lock.json` (lockfileVersion: 3)
- Scripts use `tsx` for TypeScript execution in migration scripts

## Frameworks

**Core:**
- **Nuxt 3.15.1** - Full-stack Vue framework with SSR/SSG capabilities
- **Vue 3 (latest)** - Reactive frontend framework

**Styling:**
- **Tailwind CSS 6.12.2** - Utility-first CSS framework via `@nuxtjs/tailwindcss`
- **Custom theme** - Premium dark mode aesthetic with glassmorphism

**Testing:**
- **Vitest 2.1.8** - Unit testing framework with Happy-DOM environment
- **Playwright 1.49.1** - E2E testing across Chromium, Firefox, WebKit
- **@vue/test-utils 2.4.6** - Vue component testing utilities

**Build/Dev:**
- **Vite** - Bundler (via Nuxt)
- **TypeScript 5.7.3** - Type checking
- **ESLint** - Linting (via `npm run lint`)

## Key Dependencies

**Critical:**
| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | 4.77.3 | AI contract analysis with 3-tier model strategy |
| `stripe` | 17.5.0 | Payment processing and webhook handling |
| `@nuxtjs/supabase` | 1.4.0 | Database client and authentication |
| `bullmq` | 5.67.2 | Job queue for async analysis processing |
| `ioredis` | 5.9.2 | Redis client for queue backend |
| `pdf-parse` | 1.1.1 | PDF text extraction for contract analysis |
| `zod` | 3.x | Runtime type validation and schema parsing |
| `js-tiktoken` | 1.0.21 | Token counting for OpenAI API limits |

**Infrastructure:**
| Package | Version | Purpose |
|---------|---------|---------|
| `@stripe/stripe-js` | 4.8.0 | Stripe.js client for checkout |
| `lucide-vue-next` | 0.563.0 | Icon library |
| `@heroicons/vue` | 2.2.0 | Additional icon set |
| `chart.js` | 4.5.1 | Data visualization |
| `pdfkit` | 0.17.2 | PDF generation (dev) |
| `@nuxtjs/color-mode` | 4.0.0 | Dark/light theme switching |
| `nuxt-security` | 2.5.1 | Security headers and CSP management |

**Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `@nuxt/test-utils` | 3.15.1 | Nuxt testing utilities |
| `happy-dom` | 15.11.7 | Fast DOM implementation for tests |
| `tsx` | 4.21.0 | TypeScript execution for scripts |
| `supabase` | 2.76.9 | Supabase CLI and local development |

## Configuration

**Environment Variables:** (`.env` required, not committed)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` - Database/auth
- `OPENAI_API_KEY` - AI analysis
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` - Payments
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_TOKEN` - Queue (Upstash in production)
- `ADMIN_EMAIL` - Admin authentication
- `BASE_URL` - Application URL

**Build Configuration:**
- `nuxt.config.ts` - Main Nuxt configuration with security headers, CSP, runtime config
- `tailwind.config.js` - Custom theme, colors, animations
- `tsconfig.json` - Strict TypeScript settings (extends `.nuxt/tsconfig.json`)
- `vitest.config.ts` - Test configuration with Vue plugin and path aliases
- `playwright.config.ts` - E2E test configuration

**Runtime Config:** (`nuxt.config.ts`)
```typescript
runtimeConfig: {
  openaiApiKey, stripeSecretKey, stripeWebhookSecret,
  supabaseServiceKey, redisHost, redisPort, redisToken,
  adminEmail,
  public: { baseUrl, stripePublishableKey }
}
```

## Platform Requirements

**Development:**
- Node.js 20.x
- Docker & Docker Compose (for local PostgreSQL/Redis)
- `.env` file with all required environment variables

**Local Development Stack:**
- PostgreSQL 15 (via `docker-compose.yml` on port 5433)
- Redis 7 (via `docker-compose.yml` on port 6379)
- Nuxt dev server on port 3001

**Production:**
- **Hosting:** Vercel (serverless functions via Nitro preset)
- **Database:** Supabase (managed PostgreSQL)
- **Redis:** Upstash (serverless Redis with TLS)
- **Storage:** Supabase Storage (S3-compatible)

**Deployment Targets:**
- **CI/CD:** GitHub Actions (lint, typecheck, build, deploy)
- **Preview:** Vercel previews for pull requests
- **Production:** Vercel production deployment from `main` branch

---

*Stack analysis: 2026-02-21*
