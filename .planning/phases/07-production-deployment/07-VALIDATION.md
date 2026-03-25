---
phase_number: 7
phase_slug: production-deployment
validation_created: 2026-03-24
status: ready
---

# Phase 7: Production Deployment - Validation Strategy

**Purpose:** Define how to verify this phase is complete and working correctly.

## Dimension 1: Functional Correctness

**What to verify:** All deployment artifacts work together to serve HTTP requests and process queue jobs.

| Requirement | Validation Method | Success Criteria |
|-------------|-------------------|------------------|
| DEPLOY-01: Production deployment | Manual deployment + health check | `curl https://clarify.cativo.dev/api/health` returns `{"status":"ok"}` |
| App container HTTP-only | Check container logs, verify no worker initialization | Logs show "Worker disabled" or no worker plugin initialization |
| Worker container processes jobs | Upload test PDF, monitor job completion | Analysis moves: pending → processing → completed within 2 minutes |
| Traefik routing | Access via HTTPS | Valid SSL certificate, no 502 errors |
| Redis connectivity | Worker logs, health endpoint | No connection errors, health shows "redis: connected" |

## Dimension 2: Performance & Resource Efficiency

**What to verify:** Resource limits are appropriate and don't cause OOM or throttling.

| Metric | Target | How to Measure |
|--------|--------|----------------|
| App container memory | < 200MB of 256MB limit | `docker stats clarify-app-prod` |
| Worker container memory | < 600MB of 768MB limit (or 1GB if increased) | `docker stats clarify-worker-prod` |
| Analysis latency (Basic) | < 30 seconds | UI status update timing |
| Analysis latency (Forensic) | < 10 minutes | UI status update timing, no OOM kills |
| Redis memory | < 100MB of 128MB limit | `docker stats clarify-redis` |

## Dimension 3: Security & Authorization

**What to verify:** No secrets exposed, RLS policies enforced, secure communication.

| Check | Command/Method | Expected Result |
|-------|----------------|-----------------|
| No secrets in logs | `docker compose -f docker-compose.prod.yml logs app \| grep -i "key\|token\|secret"` | No matches |
| No secrets in error messages | Trigger error (invalid upload), check response | Generic error, no stack traces or credentials |
| RLS policies active | Attempt to access another user's analysis via API | 403 Forbidden or empty result |
| HTTPS enforced | `curl http://clarify.cativo.dev` | 301 redirect to HTTPS |
| Environment file not exposed | Check docker inspect for hardcoded values | All env vars via Compose substitution, not hardcoded |

## Dimension 4: Observability & Debugging

**What to verify:** Can diagnose issues via logs, health checks, and monitoring.

| Capability | Verification |
|------------|--------------|
| Health endpoint | `/api/health` returns actual Redis connectivity status (not just "ok") |
| Worker logs | `docker compose logs worker` shows job processing, errors, retries |
| App logs | `docker compose logs app` shows HTTP requests, errors |
| Redis monitoring | `docker stats` shows memory/CPU usage |
| Traefik dashboard | Can see routing rules, request counts (if dashboard enabled) |

## Dimension 5: Error Handling & Recovery

**What to verify:** System recovers from failures automatically.

| Failure Scenario | Expected Behavior |
|------------------|-------------------|
| Worker crashes | Docker restarts container, jobs retry (BullMQ `attempts: 3`) |
| Redis restarts | Worker reconnects automatically (ioredis `maxRetriesPerRequest: null`) |
| OpenAI API timeout | Job retries with exponential backoff (5s → 10s → 20s) |
| Invalid PDF upload | Rejected with 400 error, no job queued |
| Database connection lost | Health endpoint returns 503, alerts operator |

## Dimension 6: Resource Limits & Scalability

**What to verify:** Can scale workers independently, resource limits enforced.

| Test | Command | Expected Result |
|------|---------|-----------------|
| Scale workers | `docker compose -f docker-compose.prod.yml up -d --scale worker=3` | 3 worker containers running |
| Verify throughput | Monitor queue length during load test | Jobs processed faster with more workers |
| Memory limits enforced | `docker inspect clarify-worker-prod \| grep -A 5 Memory` | MemorySwap set, OOM killer enabled |
| CPU limits enforced | `docker stats` during heavy load | CPU % capped at limit (0.5 for app, 1 for worker) |

## Dimension 7: Data Integrity & Persistence

**What to verify:** Data survives restarts, no corruption.

| Data Type | Persistence Test |
|-----------|------------------|
| Analysis results | Restart app container → results still queryable via API |
| User accounts | Restart → users can still log in |
| Credit balances | Restart → balances unchanged |
| Queue jobs | Worker restart → incomplete jobs resume processing |
| Redis data | Redis restart → queue state preserved (AOF enabled) |

## Dimension 8: Requirement Coverage (Nyquist)

**Requirement DEPLOY-01:** Verified production deployment with all environments configured

| Success Criterion | Validation |
|-------------------|------------|
| Application deploys successfully | `docker compose ps` shows all containers "healthy" |
| Environment variables configured | `.env` file has all vars from `.env.example`, container starts without errors |
| Workers on persistent infra | Worker container runs separately from app, processes jobs |
| Production URL accessible | HTTPS works, valid SSL, no 502 errors |

## Pre-Deployment Checklist

- [ ] `.env` file created from `.env.example` with all values filled
- [ ] `SUPABASE_URL` and `SUPABASE_KEY` point to production project
- [ ] `OPENAI_API_KEY` has sufficient quota for expected usage
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` configured
- [ ] `REDIS_HOST`, `REDIS_PORT`, `REDIS_TOKEN` point to Upstash or production Redis
- [ ] `BULLMQ_CONCURRENCY` set (default: 2)
- [ ] Traefik labels updated with actual domain (`clarify.cativo.dev`)
- [ ] `space-server_web` network exists on host
- [ ] SSL certificate will be issued by Let's Encrypt (port 80/443 open)

## Rollback Plan

If deployment fails:

1. **Stop new containers:**
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

2. **Check logs for root cause:**
   ```bash
   docker compose -f docker-compose.prod.yml logs app worker
   ```

3. **If environment issue:** Fix `.env` file and restart
4. **If code issue:** Revert to previous commit, rebuild image
5. **If Redis/infra issue:** Verify connectivity, check firewall rules

## Post-Deployment Verification (UAT)

1. **Homepage loads:** `https://clarify.cativo.dev` returns 200
2. **Login works:** Existing user can authenticate
3. **Upload works:** PDF upload succeeds, shows progress
4. **Queue works:** Analysis status updates (pending → processing → completed)
5. **Results display:** Analysis results show risk assessments
6. **PDF export works:** Download analysis as PDF
7. **History works:** Can view past analyses
8. **Credit deduction works:** Balance decreases after analysis
9. **Health endpoint works:** `/api/health` returns healthy status
10. **Worker logs clean:** No repeated errors or retries

---

*Validation strategy created: 2026-03-24*
*Based on: 07-RESEARCH.md, 07-CONTEXT.md*
