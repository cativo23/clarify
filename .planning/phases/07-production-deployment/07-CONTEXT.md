# Phase 7: Production Deployment - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Verified production deployment on cativo.dev with:
- Nuxt 3 app serving HTTP requests (Traefik reverse proxy)
- BullMQ workers processing analysis jobs asynchronously
- Redis as queue backend
- All environment variables configured (Supabase, Stripe, OpenAI, Redis)

**Out of scope:**
- Subscription billing
- Multi-region deployment
- CI/CD automation (manual deploy for MVP)
</domain>

<decisions>
## Implementation Decisions

### Deployment target
- **D-01:** Deploy to cativo.dev VPS using existing Docker/Traefik setup (not Vercel)
- **D-02:** Use `space-server_web` network for Traefik integration
- **D-03:** Domain: `clarify.cativo.dev` or `clarify.yourdomain.com`

### Worker architecture
- **D-04:** Separate containers for HTTP app and BullMQ workers
- **D-05:** Use `DISABLE_WORKER` environment flag to control worker initialization
  - `app` container: `DISABLE_WORKER=true` (HTTP only)
  - `worker` container: `DISABLE_WORKER=false` (processes jobs)
- **D-06:** Worker concurrency: 2 jobs simultaneously

### Resource allocation
- **D-07:** App: 256MB RAM, 0.5 CPU (HTTP is lightweight)
- **D-08:** Worker: 768MB RAM, 1 CPU (AI processing needs memory)
- **D-09:** Redis: 128MB with `allkeys-lru` eviction

### Environment configuration
- **D-10:** Use `.env` file with Docker Compose variable substitution
- **D-11:** Create `.env.example` as template with all required variables
- **D-12:** Support both Upstash Redis (production) and local Redis (dev)

### Verification checklist
- **D-13:** Health check endpoint: `/api/health`
- **D-14:** Test analysis through complete queue flow
- **D-15:** Verify Stripe webhook in test mode
- **D-16:** Confirm RLS policies on Supabase

### Claude's Discretion
- Exact Traefik label configuration (domain name)
- Health check intervals and timeouts
- Log retention policies
</decisions>

<canonical_refs>
## Canonical References

### Deployment configuration
- `docker-compose.prod.yml` — Production service definitions, resource limits, Traefik labels
- `Dockerfile` — Multi-stage build for production image
- `.env.example` — Required environment variables template

### Worker implementation
- `server/plugins/worker.ts` — BullMQ worker plugin with DISABLE_WORKER flag
- `server/utils/queue.ts` — Redis connection and queue creation
- `server/utils/worker-supabase.ts` — Scoped Supabase client for workers

### Architecture documentation
- `docs/ARCHITECTURE.md` — System overview and component relationships
- `DEPLOY.md` — Deployment guide and troubleshooting
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/plugins/worker.ts` — Already has worker logic, just needs DISABLE_WORKER guard
- `docker-compose.prod.yml` — Already configured for Traefik, just needs worker service split
- `Dockerfile` — Production-ready with security hardening (non-root user, health checks)

### Established Patterns
- Traefik reverse proxy with `space-server_web` external network
- Redis for caching and queues (already used in portfolio projects)
- Environment variables via `.env` with Compose substitution

### Integration Points
- Traefik labels in docker-compose for routing (`clarify.yourdomain.com`)
- Supabase RLS for data access control
- Upstash Redis connection (TLS with token auth)
</code_context>

<specifics>
## Specific Ideas

- "Same pattern as portfolio-prod-app but with separate worker container"
- "Keep it simple for MVP — can optimize after validating with real users"
- "Use existing Traefik setup on cativo.dev (already has SSL, monitoring, etc.)"
</specifics>

<deferred>
## Deferred Ideas

- CI/CD with GitHub Actions — future phase
- Multi-region deployment — after product-market fit
- Kubernetes migration — when scaling beyond Docker Compose
- Subscription billing — separate phase
</deferred>

---

*Phase: 07-production-deployment*
*Context gathered: 2026-03-24*
