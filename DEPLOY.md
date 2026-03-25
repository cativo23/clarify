# Production Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docker Compose (Traefik reverse proxy)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  app (256MB RAM)                                    │
│  ┌─────────────────────────────────────┐           │
│  │ Nuxt 3 HTTP Server                  │           │
│  │ - API endpoints                     │           │
│  │ - Static assets                     │           │
│  │ - DISABLE_WORKER=true               │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  worker (768MB RAM)                                 │
│  ┌─────────────────────────────────────┐           │
│  │ BullMQ Worker                       │           │
│  │ - Processes analysis jobs           │           │
│  │ - DISABLE_WORKER=false              │           │
│  │ - Concurrency: 2 jobs               │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  redis (128MB RAM)                                  │
│  ┌─────────────────────────────────────┐           │
│  │ Redis 7 (queue backend)             │           │
│  └─────────────────────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker & Docker Compose installed
- Traefik reverse proxy running with `space-server_web` network
- SSL certificates configured (Let's Encrypt)

## Deployment Steps

### 1. Clone repository on server

```bash
ssh cativo23@cativo.dev
cd ~
git clone https://github.com/cativo23/clarify.git
cd clarify
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with production values
nano .env
```

Required variables:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_TOKEN` (Upstash) or local Redis
- `BASE_URL` (e.g., `https://clarify.cativo.dev`)

### 3. Build and deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Verify deployment

```bash
# Check containers are running
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f worker

# Test health endpoint
curl https://clarify.cativo.dev/api/health
```

### 5. Scale workers (if needed)

If queue processing is slow:

```bash
# Scale to 2 worker replicas
docker compose -f docker-compose.prod.yml up -d --scale worker=2
```

## Local Development

```bash
# Use docker-compose.yml (not prod)
docker compose up

# Access at http://localhost:3001
```

## Troubleshooting

### Worker not processing jobs

1. Check Redis connection:
```bash
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

2. Check worker logs:
```bash
docker compose -f docker-compose.prod.yml logs worker
```

3. Verify `DISABLE_WORKER=false` in worker environment

### App container unhealthy

1. Check health endpoint:
```bash
curl http://localhost:3000/api/health
```

2. Check app logs:
```bash
docker compose -f docker-compose.prod.yml logs app
```

### Memory issues

Adjust limits in `docker-compose.prod.yml`:

```yaml
worker:
  deploy:
    resources:
      limits:
        memory: 1G  # Increase if Forensic tier OOM
```

## Resource Allocation

| Service | CPU Limit | Memory Limit | Purpose |
|---------|-----------|--------------|---------|
| app | 0.5 | 256MB | HTTP server |
| worker | 1.0 | 768MB | Queue processing |
| redis | - | 128MB | Queue backend |
| **Total** | **1.5** | **~1.1GB** | |

## Scaling Guidelines

| Scenario | Action |
|----------|--------|
| High HTTP traffic | Scale `app` to 2-3 replicas |
| Slow queue processing | Scale `worker` to 2-3 replicas |
| Forensic tier timeouts | Increase worker memory to 1GB |
| Redis memory full | Increase redis maxmemory |

