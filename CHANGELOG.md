# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-alpha.22] - 2026-09-29

### Fixed
- The header's "Iniciar Sesión" link and the two homepage login CTAs went intermittently unresponsive (roughly 50% of clicks, uncorrelated with time since page load). Root cause: those `NuxtLink`s sit inside a `v-if`/`v-else` pair keyed on `useSupabaseUser()`'s `user` ref, and a brief SSR/client mismatch in that value triggers Vue to discard and remount the nav subtree post-hydration — until the remount lands, the server-rendered anchor carries no click binding. Fixed by marking the three `/login` links `external`, bypassing Vue Router's client-side interception entirely.

## [1.0.0-alpha.21] - 2026-09-29

### Fixed
- Restored `nuxt-security`'s `'nonce-{{nonce}}'` placeholder in the custom `script-src` CSP directive. Its absence silently disabled nonce substitution in the response header, so every inline `<script>` on the page — including Nuxt's own hydration payload — was blocked by CSP in production. This broke client-side hydration entirely (dark mode toggle and other client reactivity silently no-op'd, with `Cannot read properties of undefined (reading 'app')` in the console).

## [1.0.0-alpha.20] - 2026-09-28

### Features
- Structured clause-level prompts v2.1 for Basic, Premium, and Forensic tiers, with Forensic-only numeric coverage fields (`nota_upgrade`, `error`, coverage percentage)
- Analysis results UI: category section index with click-to-scroll navigation and keyboard/reduced-motion support, always-visible quoted clause with accessible collapse toggle, per-finding certainty pill, and a combined 0-10 risk score panel with category breakdown bars

### Security
- Suspended users are rejected at both `/api/upload` and worker job pickup (ADMIN-04), closing the v1.1 audit gap
- Removed prescriptive legal directives from the Forensic tier's example JSON prompt

### Changed
- Migrated the 3-tier analysis strategy to gpt-6-luna/sol/astra, including the pricing migration
- Fixed a 1000x unit error in the admin cost dashboard
- Funnel Stage 2 now sources from a dedicated RPC (`get_email_verified_users_in_range`) with a warn-on-fallback path
- Revenue package breakdown now maps from `credits_purchased` instead of amount-range inference, decoupling it from Stripe price changes
- Added a proprietary license

### Fixed
- Aligned the Basic tier's risk algorithm with Premium/Forensic for the single-red-finding case
- Eliminated overlapping `puntaje_riesgo` boundary values at 3 and 6
- Worker now detects `DOCUMENT_TOO_LARGE` explicitly and no longer falls back to a dead `nivel_riesgo` path

### Deploy
- First production deploy: `docker-compose.prod.yml` is aligned to the polaris2 Traefik conventions (entrypoints `web`/`websecure`, resolver `letsencryptresolver`), references the CI-built image with a `CLARIFY_IMAGE_TAG` rollback seam, and adds the full `NUXT_`-prefixed runtime env contract so the image's baked-in build-time defaults no longer apply in production
- Fixed a pre-existing production blocker found while proving the deploy locally: `pdf-parse`'s `@napi-rs/canvas` DOMMatrix polyfill was silently dropped by Nitro's build tracer, crashing every container on boot — pinned as an explicit dependency and copied into the runtime image directly
- CI Docker actions upgraded for the Node 24 GitHub Actions runner (lands through this release's merge to `main`)

---

## [1.0.0-alpha.18] - 2026-05-06

### Security
- **#33** Fix missing rate-limit import in `/api/check-tokens` (would have bypassed DoS protection at runtime)
- **#35** Replace `createRequire` with native ESM import for `pdf-parse` (restores tree-shaking)
- **#36** Unify admin authorization in `getRequestUserContext` to delegate to `isAdminUser` (NFKC normalization + `admin_emails` table lookup); secondary admins were silently losing privileges in `/api/analyses` endpoints

### Performance
- **#34** Cancel stale `/api/check-tokens` requests on rapid file selection in dashboard via `AbortController`

### Tests / Tooling
- **#37** Split vitest into `unit` and `integration` projects so the `#supabase/server` mock alias only applies to unit tests; adds `npm run test:unit` and `npm run test:integration`
- New unit tests for `getRequestUserContext` admin paths
- Extract `isAdminEmail(event, email)` helper to avoid redundant `auth.getUser()` round-trip

---

## [1.0.0-alpha.17] - 2026-05-06

### Changed
- Completed v1.1 Admin & Deploy milestone archival
- Branch sync: reconcile develop and main after v1.1 milestone

---

## [1.0.0-alpha.16] - 2026-03-25

### Changed
- CI/CD workflow matches portfolio auto-deploy structure
- Use `environment: prod` for deployment jobs
- Docker login on server before pulling images
- Use `docker compose down` before `up -d` for clean deploy

### Fixed
- Deploy workflow now uses correct secrets (`SSH_HOST`, etc.)
- Removed lint job from release pipeline (build + deploy only)

---

## [1.0.0-alpha.15] - 2026-03-25

### Added
- Auto-release GitHub Actions workflow for automated versioning
- Docker-based auto-deploy to home server via SSH
- `.env.example` template with all production environment variables
- Configurable worker concurrency via `BULLMQ_CONCURRENCY` environment variable
- Real Redis health check in `/api/health` endpoint
- Production deployment documentation (DEPLOY.md)

### Changed
- CI/CD pipeline now deploys via Docker Hub + SSH instead of Vercel
- Worker concurrency is now configurable (was hardcoded to 2)
- Health endpoint now performs actual Redis ping verification

### Fixed
- Chart rendering issues in admin analytics (using client components)
- Admin UAT tests now passing

### Documentation
- Complete production deployment guide with GitHub Actions setup
- Phase 07 planning, research, validation, and summary documents

---

## [v1.0.0-alpha.14] - 2026-03-24

### Added
- Phase 07: Production deployment readiness
- Environment configuration template
- Health check with Redis connectivity verification

### Added
- Auto-release GitHub Actions workflow for automated versioning
- Docker-based auto-deploy to home server via SSH
- `.env.example` template with all production environment variables
- Configurable worker concurrency via `BULLMQ_CONCURRENCY` environment variable
- Real Redis health check in `/api/health` endpoint
- Production deployment documentation (DEPLOY.md)

### Changed
- CI/CD pipeline now deploys via Docker Hub + SSH instead of Vercel
- Worker concurrency is now configurable (was hardcoded to 2)
- Health endpoint now performs actual Redis ping verification

### Fixed
- Chart rendering issues in admin analytics (using client components)
- Admin UAT tests now passing

### Documentation
- Complete production deployment guide with GitHub Actions setup
- Phase 07 planning, research, validation, and summary documents

---

## [v1.0.0-alpha.4] - 2026-03-24

### Added
- Phase 07: Production deployment readiness
- Environment configuration template
- Health check with Redis connectivity verification

---

## [v1.0.0-alpha.3] - 2026-03-23

### Added
- Admin analytics dashboard
- Revenue tracking charts
- Funnel analysis visualization

---

## [v1.0.0-alpha.2] - 2026-03-22

### Added
- Asynchronous analysis system
- BullMQ worker for queue processing
- Redis integration for job management

---

## [v1.0.0-alpha.1] - 2026-03-21

### Added
- Initial alpha release
- Core analysis functionality
- Basic UI with dark mode support
