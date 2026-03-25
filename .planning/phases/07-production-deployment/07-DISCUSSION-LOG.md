# Phase 7: Production Deployment - Discussion Log

> **Audit trail only.** Decisions are captured in CONTEXT.md.

**Date:** 2026-03-24
**Phase:** 07-production-deployment
**Areas discussed:** Deployment target, Worker architecture, Resource allocation, Environment configuration

---

## Deployment target

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel (serverless) | Zero infra management, but timeout limits (10-60s) | |
| Docker/Traefik VPS | Existing setup on cativo.dev, full control | ✓ |

**User's choice:** Docker/Traefik VPS (existing setup on cativo.dev)
**Notes:** Already have Traefik with SSL, monitoring, etc.

---

## Worker architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Single container | App + Worker together (simpler) | |
| Separate containers | DISABLE_WORKER flag, independent scaling | ✓ |

**User's choice:** Separate containers with DISABLE_WORKER flag
**Notes:** Prevents HTTP/worker resource contention, allows independent scaling

---

## Resource allocation

| Option | Description | Selected |
|--------|-------------|----------|
| Equal split | 512MB app + 512MB worker | |
| Worker-heavy | 256MB app + 768MB worker | ✓ |
| App-heavy | 768MB app + 256MB worker | |

**User's choice:** Worker-heavy (256MB app + 768MB worker)
**Notes:** AI processing needs memory for Forensic tier

---

## Environment configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Docker secrets | More secure, complex setup | |
| .env file | Simple, matches existing workflow | ✓ |
| Platform env vars | Vercel/Railway dashboard | |

**User's choice:** .env file with Docker Compose substitution
**Notes:** Consistent with existing portfolio projects

---

## Verification checklist

Decided on:
- Health check endpoint (`/api/health`)
- Test analysis through queue
- Stripe webhook test (test mode)
- RLS policy verification

---

## Deferred Ideas

- CI/CD automation — future phase
- Multi-region deployment — after PMF
- Kubernetes migration — when scaling
- Subscription billing — separate phase

---

*Discussion log created: 2026-03-24*
