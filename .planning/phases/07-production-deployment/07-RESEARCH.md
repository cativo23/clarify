# Phase 7: Production Deployment - Research

**Researched:** 2026-03-24
**Domain:** Docker Compose production deployment with Traefik reverse proxy, BullMQ workers, and Redis queue
**Confidence:** HIGH

## Summary

This phase deploys Clarify to a production VPS environment (cativo.dev) using Docker Compose with Traefik as the reverse proxy. The architecture separates the HTTP app and BullMQ worker into distinct containers for independent scaling, with Redis serving as the queue backend.

The deployment leverages existing infrastructure: the `space-server_web` Traefik network provides automatic SSL termination via Let's Encrypt, while environment variable substitution through a `.env` file keeps configuration simple and consistent with other portfolio projects.

**Primary recommendation:** Deploy using the existing docker-compose.prod.yml configuration with separate app and worker containers, using `DISABLE_WORKER` flag to control worker initialization. Verify deployment through health endpoint `/api/health` and end-to-end analysis flow test.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Deploy to cativo.dev VPS using existing Docker/Traefik setup (not Vercel)
- **D-02:** Use `space-server_web` network for Traefik integration
- **D-03:** Domain: `clarify.cativo.dev` or `clarify.yourdomain.com`
- **D-04:** Separate containers for HTTP app and BullMQ workers
- **D-05:** Use `DISABLE_WORKER` environment flag to control worker initialization
  - `app` container: `DISABLE_WORKER=true` (HTTP only)
  - `worker` container: `DISABLE_WORKER=false` (processes jobs)
- **D-06:** Worker concurrency: 2 jobs simultaneously
- **D-07:** App: 256MB RAM, 0.5 CPU (HTTP is lightweight)
- **D-08:** Worker: 768MB RAM, 1 CPU (AI processing needs memory)
- **D-09:** Redis: 128MB with `allkeys-lru` eviction
- **D-10:** Use `.env` file with Docker Compose variable substitution
- **D-11:** Create `.env.example` as template with all required variables
- **D-12:** Support both Upstash Redis (production) and local Redis (dev)
- **D-13:** Health check endpoint: `/api/health`
- **D-14:** Test analysis through complete queue flow
- **D-15:** Verify Stripe webhook in test mode
- **D-16:** Confirm RLS policies on Supabase

### Claude's Discretion
- Exact Traefik label configuration (domain name)
- Health check intervals and timeouts
- Log retention policies

### Deferred Ideas (OUT OF SCOPE)
- CI/CD with GitHub Actions — future phase
- Multi-region deployment — after product-market fit
- Kubernetes migration — when scaling beyond Docker Compose
- Subscription billing — separate phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPLOY-01 | Vercel Deployment — Verified production deployment with all environments configured | Research supports Docker/Traefik deployment (not Vercel per user decision D-01). All deployment artifacts identified: docker-compose.prod.yml, Dockerfile, .env.example, health endpoint, worker plugin with DISABLE_WORKER guard. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bullmq | 5.70.0 (project) / 5.71.0 (latest) | Redis-based job queue for async analysis processing | Industry standard for Node.js queues, supports retries, backoff, job prioritization |
| ioredis | 5.9.3 (project) / 5.10.1 (latest) | Redis client with TypeScript support | Required by BullMQ, better performance than node-redis, TLS support for Upstash |
| Nuxt 3 | 4.3.1 | Full-stack Vue framework with Nitro server | SSR, file-based routing, serverless-ready builds |
| Docker | 24+ | Container runtime | Consistent environments, easy scaling, matches existing portfolio pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Traefik | 2.x/3.x | Reverse proxy with automatic SSL | When deploying behind existing proxy infrastructure |
| Redis | 7-alpine | Queue backend, caching | BullMQ requires Redis 6.2+ for all features |
| Node.js | 24.x | Runtime | Required by Nuxt 4.x, LTS support |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Docker Compose | Vercel serverless | Vercel: zero infra but 10-60s timeout limits break long-running analyses |
| Docker Compose | Railway/Render workers | Railway: managed infra but adds cost and complexity; current VPS already paid for |
| BullMQ | Agenda/Bull | BullMQ: actively maintained, better Redis Streams integration |
| Upstash Redis | Self-hosted Redis | Self-hosted: cheaper but requires manual backup/failover setup |

**Installation (project already has dependencies):**
```bash
# Verify current versions match latest
npm view bullmq version  # 5.71.0
npm view ioredis version # 5.10.1
# Project uses 5.70.0 and 5.9.3 - consider patch updates for production
```

**Version verification:**
- bullmq: Project uses 5.70.0, latest is 5.71.0 (minor update available)
- ioredis: Project uses 5.9.3, latest is 5.10.1 (minor update available)
- Both are stable versions, updates optional but recommended for production

## Architecture Patterns

### Recommended Project Structure

Current deployment files are correctly organized:

```
clarify/
├── docker-compose.yml          # Local development (port 3001)
├── docker-compose.prod.yml     # Production with Traefik labels
├── Dockerfile                  # Multi-stage production build
├── Dockerfile.dev              # Development with hot reload
├── .env.example                # Environment template (already exists)
├── .env                        # Actual env (gitignored)
├── DEPLOY.md                   # Deployment guide (already exists)
└── server/
    ├── plugins/
    │   └── worker.ts           # BullMQ worker with DISABLE_WORKER guard
    ├── utils/
    │   ├── queue.ts            # Redis connection helper
    │   └── worker-supabase.ts  # Scoped Supabase client for workers
    └── api/
        └── health.get.ts       # Health check endpoint
```

### Pattern 1: Separate Container Architecture

**What:** HTTP app and BullMQ worker run in separate Docker containers with independent resource limits and scaling.

**When to use:** When background job processing has different resource requirements than HTTP serving.

**Example:**
```yaml
# docker-compose.prod.yml
app:
  environment:
    - DISABLE_WORKER=true  # HTTP-only mode
  deploy:
    resources:
      limits:
        memory: 256M
        cpus: '0.5'

worker:
  environment:
    - DISABLE_WORKER=false
  deploy:
    resources:
      limits:
        memory: 768M
        cpus: '1'
```

**Source:** Project implementation in `docker-compose.prod.yml` and `server/plugins/worker.ts`

### Pattern 2: Traefik Integration via Labels

**What:** Docker labels in Compose file automatically configure Traefik routing and SSL.

**When to use:** When deploying behind existing Traefik proxy infrastructure.

**Example:**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=space-server_web"
  - "traefik.http.routers.clarify.rule=Host(`clarify.yourdomain.com`)"
  - "traefik.http.routers.clarify.tls.certresolver=letsencrypt"
```

**Source:** [Traefik Docker Labels Documentation](https://doc.traefik.io/traefik/routing/providers/docker/)

### Pattern 3: Environment Variable Substitution

**What:** Docker Compose reads `.env` file and substitutes variables at runtime.

**When to use:** Simple environment management without Docker secrets complexity.

**Example:**
```yaml
environment:
  - SUPABASE_URL=${SUPABASE_URL}
  - REDIS_TOKEN=${REDIS_TOKEN:-}  # Default empty if not set
```

**Source:** [Docker Compose variable substitution](https://docs.docker.com/compose/environment-variables/set-environment-variables/)

### Anti-Patterns to Avoid

- **Single container for app + worker:** Prevents independent scaling, causes resource contention during AI processing
- **Hardcoded environment values:** Makes multi-environment deployment impossible
- **Worker without retry logic:** transient API failures cause permanent job failures (BullMQ handles this via `defaultJobOptions`)
- **Health check without actual service verification:** Current `/api/health` has placeholder comments for actual Redis/DB ping tests

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Background job processing | Custom queue with setInterval | BullMQ | Retry logic, backoff strategies, job prioritization, Redis persistence |
| Redis connection pooling | Manual connection management | ioredis with `maxRetriesPerRequest: null` | Required by BullMQ, handles reconnection automatically |
| SSL/TLS termination | Custom nginx config | Traefik with Let's Encrypt | Automatic cert renewal, already running on cativo.dev |
| Health checks | Custom script + cron | Docker HEALTHCHECK | Native integration, orchestrator-aware |
| Environment management | Custom config loader | Docker Compose + .env | Standard pattern, IDE support, gitignore-friendly |

**Key insight:** The current implementation already follows these patterns correctly. The main gap is updating `server/plugins/worker.ts` to read `BULLMQ_CONCURRENCY` from environment instead of hardcoding `concurrency: 2`.

## Runtime State Inventory

*Not applicable for this phase — this is a greenfield deployment phase, not a rename/refactor/migration.*

## Common Pitfalls

### Pitfall 1: Worker Concurrency Not Configurable

**What goes wrong:** Worker concurrency is hardcoded to `2` in `server/plugins/worker.ts` line 149, ignoring the `BULLMQ_CONCURRENCY` environment variable set in docker-compose.prod.yml.

**Why it happens:** Environment variable defined in Compose file but not consumed in code.

**How to avoid:** Read concurrency from `process.env.BULLMQ_CONCURRENCY` with fallback:
```typescript
concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '2', 10)
```

**Warning signs:** Scaling worker replicas doesn't increase throughput as expected.

### Pitfall 2: Redis Connection Fails with Upstash

**What goes wrong:** Worker cannot connect to Upstash Redis in production, jobs pile up in queue.

**Why it happens:** Missing TLS configuration or incorrect port. Upstash requires TLS (`rediss://`) and uses the token as password.

**How to avoid:** Verify Redis configuration in `server/utils/queue.ts`:
```typescript
const redisConfig: any = {
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisToken,  // Required for Upstash
  tls: {},  // Required for Upstash TLS
  maxRetriesPerRequest: null,  // Required by BullMQ
};
```

**Warning signs:** Redis connection errors in worker logs, `ECONNRESET` or `CERT_NOT_VALID` errors.

### Pitfall 3: Health Check Reports OK But Service Unreachable

**What goes wrong:** Docker health check passes but Traefik returns 502/503 errors.

**Why it happens:** Health check only verifies HTTP response, not actual service connectivity (Redis, Supabase). The current `/api/health` endpoint has placeholder comments acknowledging this.

**How to avoid:** Implement actual connectivity checks:
```typescript
// server/api/health.get.ts
export default defineEventHandler(async () => {
  const redisStatus = await pingRedis() ? 'connected' : 'disconnected';
  const supabaseStatus = await pingSupabase() ? 'connected' : 'disconnected';
  return { status: redisStatus === 'connected' ? 'ok' : 'degraded', ... };
});
```

**Warning signs:** Container marked healthy but analysis jobs fail, 502 errors from Traefik.

### Pitfall 4: Memory Exhaustion on Forensic Tier

**What goes wrong:** Worker container OOM-kills during Forensic tier analysis (120k token context).

**Why it happens:** 768MB may be insufficient for large PDF text extraction + OpenAI response parsing.

**How to avoid:** Monitor memory usage during testing, increase to 1GB if needed:
```yaml
worker:
  deploy:
    resources:
      limits:
        memory: 1G  # Increase from 768M if OOM occurs
```

**Warning signs:** Worker restarts with exit code 137, `docker inspect` shows OOMKilled: true.

### Pitfall 5: Traefik Routing Fails Due to Network Mismatch

**What goes wrong:** Container starts but Traefik doesn't route traffic to it.

**Why it happens:** Container not connected to `space-server_web` network, or Traefik labels reference wrong network name.

**How to avoid:** Verify network configuration:
```bash
# On server, verify network exists
docker network ls | grep space-server_web

# Verify container is connected
docker inspect clarify-app-prod | grep Networks
```

**Warning signs:** Container healthy, logs show no errors, but HTTPS requests return 502.

## Code Examples

### Health Check with Actual Service Verification

```typescript
// server/api/health.get.ts
import { getRedisConnection } from "../utils/queue";

export default defineEventHandler(async () => {
  const health = {
    status: "ok" as const,
    services: {
      database: "unknown" as const,
      redis: "unknown" as const,
      ai: "active" as const,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    // Check Redis connection
    const redis = getRedisConnection();
    await redis.ping();
    health.services.redis = "connected";
  } catch {
    health.services.redis = "disconnected";
    health.status = "degraded";
  }

  // Add Supabase health check similarly

  if (health.services.redis === "disconnected") {
    throw createError({
      statusCode: 503,
      statusMessage: "Service Unhealthy",
      body: health,
    });
  }

  return health;
});
```

### Worker with Environment-Based Concurrency

```typescript
// server/plugins/worker.ts
const worker = new Worker(
  "analysis-queue",
  async (job) => {
    // ... job processing
  },
  {
    connection: getRedisConnection() as any,
    concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || "2", 10),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      timeout: 650000,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    },
  } as any,
);
```

### Docker Compose Scaling Command

```bash
# Scale workers to handle more concurrent jobs
docker compose -f docker-compose.prod.yml up -d --scale worker=3

# Verify scaling
docker compose -f docker-compose.prod.yml ps

# View worker logs
docker compose -f docker-compose.prod.yml logs -f worker
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single container (app + worker) | Separate containers with DISABLE_WORKER flag | 2024-2025 | Independent scaling, better resource isolation |
| Self-hosted Redis | Upstash (serverless Redis) | 2023-2024 | Zero maintenance, automatic failover, TLS built-in |
| Manual SSL with nginx | Traefik with Let's Encrypt | 2022-2023 | Automatic cert renewal, simpler config |
| Vercel serverless | Docker Compose on VPS | Project-specific | Avoids timeout limits for long-running AI jobs |

**Deprecated/outdated:**
- Vercel for queue workers: Serverless timeouts (10-60s) incompatible with 10-minute Forensic analyses
- BullMQ without TLS: Security risk, all production Redis should use TLS (Upstash provides this)
- Hardcoded Redis host/port: Should support environment-based configuration for flexibility

## Open Questions

1. **Health check depth:** Should `/api/health` actually ping Supabase and Redis, or is simple HTTP OK sufficient for MVP?
   - **Recommendation:** Add Redis ping (already connected for queue), skip Supabase for MVP to avoid credential exposure in health endpoint

2. **Log retention:** How long should worker logs be retained in Redis (via `removeOnComplete`/`removeOnFail`)?
   - **Current:** 100 completed, 1000 failed
   - **Recommendation:** Keep current settings, monitor Redis memory usage

3. **Domain name:** Should deployment use `clarify.cativo.dev` or `clarify.yourdomain.com`?
   - **Recommendation:** Use actual domain (clarify.cativo.dev) for production, update Traefik labels accordingly

4. **Package updates:** Should bullmq (5.70.0→5.71.0) and ioredis (5.9.3→5.10.1) be updated before deployment?
   - **Recommendation:** Minor version updates are safe, update after initial deployment verification

## Validation Architecture

> Skipping this section — `workflow.nyquist_validation` is not explicitly set in `.planning/config.json`, but this is a deployment/infrastructure phase rather than a feature implementation phase. The deployment verification is defined in CONTEXT.md section D-13 through D-16 (health endpoint, analysis flow, Stripe webhook, RLS policies).

### Manual Verification Checklist

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Containers running | `docker compose -f docker-compose.prod.yml ps` | app, worker, redis all show "healthy" |
| App responds | `curl https://clarify.yourdomain.com/api/health` | `{"status":"ok"}` |
| Worker processing | `docker compose -f docker-compose.prod.yml logs worker` | "[Worker] Analysis worker plugin initialized" |
| Redis connected | `docker compose -f docker-compose.prod.yml exec redis redis-cli ping` | "PONG" |
| SSL working | `curl -vI https://clarify.yourdomain.com` | TLS certificate valid, redirects to HTTPS |
| Analysis flow | Upload PDF via UI → Complete status | Analysis moves: pending → processing → completed |

## Sources

### Primary (HIGH confidence)
- Project files: `docker-compose.prod.yml`, `Dockerfile`, `server/plugins/worker.ts`, `server/utils/queue.ts`, `DEPLOY.md`
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Traefik Docker Provider](https://doc.traefik.io/traefik/routing/providers/docker/)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/set-environment-variables/)
- [Upstash Redis Documentation](https://upstash.com/docs/redis/overall/getstarted)

### Secondary (MEDIUM confidence)
- WebSearch: Docker Compose Traefik production deployment patterns
- WebSearch: BullMQ worker deployment best practices
- WebSearch: Nuxt 3 Docker health check patterns

### Tertiary (LOW confidence)
- WebSearch results for "2025/2026 best practices" — specific dates may not reflect actual 2026 consensus

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Verified against npm registry and project files
- Architecture: HIGH — Based on existing project implementation and user decisions
- Pitfalls: MEDIUM — Based on common patterns, not project-specific testing

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (90 days — deployment patterns are stable, but package versions should be re-verified)
