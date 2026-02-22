# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
/home/cativo23/projects/personal/clarify/
├── .planning/codebase/     # AI agent documentation output
├── components/             # Vue 3 UI components
├── composables/            # Shared composable functions (state, API calls)
├── database/               # SQL migrations and seeders
├── docs/                   # Technical documentation
├── layouts/                # Vue layout components (default, admin)
├── middleware/             # Route middleware (auth guards)
├── pages/                  # File-based routing (Vue pages)
├── public/                 # Static assets (favicon, grid.svg)
├── scripts/                # Utility scripts (PDF generation, etc.)
├── server/                 # Backend code (Nitro server)
│   ├── api/                # API route handlers
│   ├── prompts/            # AI prompt templates (v2/)
│   ├── utils/              # Server utilities (auth, openai, stripe, etc.)
│   └── plugins/            # Server plugins
├── tests/                  # Test files (unit, e2e)
├── types/                  # TypeScript type definitions
├── .github/                # GitHub Actions workflows
├── .vercel/                # Vercel deployment configuration
├── app.vue                 # Root Vue component
├── nuxt.config.ts          # Nuxt configuration
├── package.json            # Dependencies and scripts
├── docker-compose.yml      # Local development infrastructure
└── Dockerfile              # Production container build
```

## Directory Purposes

**`components/`:**
- Purpose: Reusable Vue 3 UI components with `<script setup lang="ts">`
- Contains: `.vue` files for dashboard, cards, forms, navigation
- Key files: `AppHeader.vue`, `AppFooter.vue`, `AnalysisSelector.vue`, `Dropzone.vue`, `RiskCard.vue`, `ToastContainer.vue`

**`composables/`:**
- Purpose: Shared composable functions for state management and API calls
- Contains: `.ts` files exported as auto-imports by Nuxt
- Key files: `useSupabase.ts` (user state, credits, profile fetching), `useToast.ts` (toast notifications), `useTimeAgo.ts`, `useClickOutside.ts`

**`pages/`:**
- Purpose: File-based routing for application views
- Contains: `.vue` files that become routes
- Key files: `index.vue` (landing), `login.vue`, `dashboard.vue`, `credits.vue`, `history.vue`, `about.vue`, `faq.vue`

**`server/`:**
- Purpose: Backend API and server-side logic (Nitro serverless functions)
- Contains: TypeScript files for API endpoints, utilities, prompts
- Key files: See subdirectory breakdown below

**`database/`:**
- Purpose: Database schema management and seed data
- Contains: SQL migration files, seeder scripts, documentation
- Key files: `migrations/*.sql`, `seeders/*.seeder.sql`, `MIGRATIONS.md`

**`layouts/`:**
- Purpose: Wrapper components for page layouts
- Contains: `default.vue` (public pages), `admin.vue` (admin panel)
- Pattern: `<slot />` for page content, shared header/footer/sidebar

**`middleware/`:**
- Purpose: Route guards executed before page navigation
- Contains: `auth.ts` - redirects unauthenticated users to `/login`

**`types/`:**
- Purpose: Shared TypeScript type definitions
- Contains: `index.ts` (domain types: User, Analysis, Hallazgo, Transaction)

## Key File Locations

**Entry Points:**
- `/home/cativo23/projects/personal/clarify/app.vue`: Root component, sets up NuxtLayout, global meta tags, page transitions
- `/home/cativo23/projects/personal/clarify/server/api/`: Auto-scanned by Nitro for API routes
- `/home/cativo23/projects/personal/clarify/nuxt.config.ts`: Framework configuration (modules, security, runtime config)

**Configuration:**
- `/home/cativo23/projects/personal/clarify/nuxt.config.ts`: Nuxt modules, security headers, Supabase config, Nitro preset
- `/home/cativo23/projects/personal/clarify/package.json`: Dependencies, npm scripts
- `/home/cativo23/projects/personal/clarify/.env.example`: Required environment variables template
- `/home/cativo23/projects/personal/clarify/docker-compose.yml`: Local Redis, PostgreSQL infrastructure

**Core Logic:**
- `/home/cativo23/projects/personal/clarify/server/utils/openai-client.ts`: AI analysis with dynamic prompts, token management
- `/home/cativo23/projects/personal/clarify/server/utils/stripe-client.ts`: Payment sessions, webhook handling, credit updates
- `/home/cativo23/projects/personal/clarify/server/utils/queue.ts`: BullMQ queue setup with Redis connection
- `/home/cativo23/projects/personal/clarify/composables/useSupabase.ts`: User state, credits, profile fetching

**Testing:**
- `/home/cativo23/projects/personal/clarify/tests/unit/`: Unit tests for server utilities
- `/home/cativo23/projects/personal/clarify/tests/e2e/`: End-to-end tests
- `/home/cativo23/projects/personal/clarify/tests/contracts/`: Contract test files

## Naming Conventions

**Files:**
- Vue components: `PascalCase.vue` (e.g., `AnalysisSelector.vue`, `RiskCard.vue`)
- Server utilities: `kebab-case.ts` (e.g., `openai-client.ts`, `file-validation.ts`)
- API endpoints: `{route}.{method}.ts` (e.g., `analyze.post.ts`, `checkout.post.ts`)
- Dynamic routes: `[param].get.ts` or `[param]/index.get.ts` (e.g., `[id]/index.get.ts`)
- Migrations: `YYYYMMDDHHMMSS_snake_case_description.sql`
- Seeders: `NNN_description.seeder.sql`

**Directories:**
- All directories: `kebab-case` or `snake_case` (e.g., `server/api/`, `server/utils/`)
- Dynamic route params in brackets: `[id]/`, `[param]/`

**Variables and Functions:**
- Functions: `camelCase` (e.g., `analyzeContract`, `validateFileUpload`)
- Types/Interfaces: `PascalCase` (e.g., `AnalysisSummary`, `FileValidationResult`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `ALLOWED_MODELS`, `PDF_SIGNATURE`)
- Composables: `usePascalCase` (e.g., `useCreditsState`, `useUserState`)

## Where to Add New Code

**New Feature:**
- Primary code: `/home/cativo23/projects/personal/clarify/pages/{feature}.vue` for new page
- Components: `/home/cativo23/projects/personal/clarify/components/{FeatureName}.vue`
- API endpoint: `/home/cativo23/projects/personal/clarify/server/api/{feature}.post.ts`
- Composable: `/home/cativo23/projects/personal/clarify/composables/use{Feature}.ts`

**New API Endpoint:**
- Location: `/home/cativo23/projects/personal/clarify/server/api/{name}.{method}.ts`
- Method suffixes: `.get.ts`, `.post.ts`, `.put.ts`, `.delete.ts`
- Validation: Add Zod schema at top of file
- Error handling: Use `handleApiError()` from `server/utils/error-handler.ts`

**New Utility Function:**
- Location: `/home/cativo23/projects/personal/clarify/server/utils/{name}.ts`
- Export named functions for tree-shaking
- Use TypeScript interfaces for return types

**New Component:**
- Location: `/home/cativo23/projects/personal/clarify/components/{ComponentName}.vue`
- Use `<script setup lang="ts">` for Composition API
- Follow glassmorphism styling (backdrop-blur, subtle borders)

**Database Changes:**
- Migration: `npm run migrate:make {description}` creates file in `database/migrations/`
- Seeder: Add to `database/seeders/{NNN}_{description}.seeder.sql`
- Always include both UP and DOWN (as comments) in migration files

**New Composable:**
- Location: `/home/cativo23/projects/personal/clarify/composables/use{Name}.ts`
- Export functions starting with `use` prefix for Nuxt auto-import
- Use `useState()` for reactive shared state

## Special Directories

**`server/prompts/`:**
- Purpose: AI prompt templates loaded at runtime (not hardcoded)
- Generated: No - manually maintained
- Committed: Yes
- Structure: `v2/analysis-prompt.txt`, `v2/basic-analysis-prompt.txt`

**`.nuxt/`:**
- Purpose: Nuxt build output and generated types
- Generated: Yes - by `npm run dev` or `npm run build`
- Committed: No - in `.gitignore`

**`.vercel/`:**
- Purpose: Vercel serverless deployment output
- Generated: Yes - by build process
- Committed: Partially - output directory committed for deployment

**`public/`:**
- Purpose: Static assets served directly (not processed by Vite)
- Contains: `favicon.ico`, `grid.svg`, `robots.txt`
- Access: `/favicon.ico`, `/grid.svg` in browser

**`database/migrations/`:**
- Purpose: Version-controlled schema changes
- Generated: By `npm run migrate:make`
- Committed: Yes - all migrations committed
- Execution: Via `npm run db:migrate`

**`database/seeders/`:**
- Purpose: Demo/test data population
- Generated: Manually
- Committed: Yes
- Execution: Via `npm run db:seed` (development only, not production)

## Server API Structure

```
server/api/
├── analyze.post.ts           # Start async analysis job
├── upload.post.ts            # Upload contract PDF (magic byte validation)
├── check-tokens.post.ts      # Estimate token count for document
├── health.get.ts             # Health check endpoint
├── analyses/
│   ├── index.get.ts          # List user's analyses
│   └── [id]/
│       └── index.get.ts      # Get single analysis by ID
├── user/
│   └── profile.get.ts        # Get user profile with credits
├── stripe/
│   ├── checkout.post.ts      # Create Stripe checkout session
│   └── webhook.post.ts       # Handle Stripe webhooks
└── admin/
    ├── pricing.get.ts        # Get pricing configuration
    ├── config.get.ts         # Get admin configuration
    ├── config.post.ts        # Update admin configuration
    ├── users.get.ts          # List all users (admin only)
    └── user/
        └── [id]/
            └── credits.post.ts  # Add credits to user (admin only)
```

## Server Utils Structure

```
server/utils/
├── auth.ts                   # Admin authentication (isAdminUser, requireAdmin)
├── openai-client.ts          # OpenAI integration (analyzeContract)
├── stripe-client.ts          # Stripe integration (webhooks, checkout)
├── queue.ts                  # BullMQ queue setup (getAnalysisQueue)
├── config.ts                 # Prompt configuration (getPromptConfig)
├── file-validation.ts        # Magic byte validation (validateFileUpload)
├── ssrf-protection.ts        # URL validation (validateSupabaseStorageUrl)
├── rate-limit.ts             # Rate limiting (applyRateLimit, presets)
├── error-handler.ts          # Safe error handling (handleApiError)
├── analysis-security.ts      # Debug info stripping (sanitizeAnalysesList)
├── preprocessing.ts          # Document preprocessing (preprocessDocument)
├── pdf-parser.ts             # PDF text extraction (extractTextFromPDF)
├── redirect-validation.ts    # Redirect URL validation
└── worker-supabase.ts        # Worker-specific Supabase client
```

---

*Structure analysis: 2026-02-21*
