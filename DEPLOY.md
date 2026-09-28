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

## Automated Deployment (Recommended)

Clarify uses GitHub Actions for automated deployments. When you create a release:

1. **Auto-release workflow** creates versioned releases from commits to `main`
2. **CI/CD workflow** builds Docker image and deploys to your home server

### Setup GitHub Secrets

Go to `Settings → Secrets and variables → Actions` and add:

#### 1. Create RELEASE_PAT (Required for auto-deploy)

The `RELEASE_PAT` is a Personal Access Token that allows the auto-release workflow to trigger the deploy workflow. Without it, releases created by Actions won't trigger downstream workflows.

```bash
# Go to https://github.com/settings/tokens/new
# Scope: repo (full control of private repositories)
# Token name: clarify-release-pat
# Expiration: No expiration (or set as needed)

# Copy the token and add as secret:
gh secret set RELEASE_PAT <<< "ghp_your-token-here"
```

#### 2. Docker Hub & SSH Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `RELEASE_PAT` | Personal Access Token with `repo` scope (triggers deploy workflow) | `ghp_xxx` |
| `DOCKER_USERNAME` | Docker Hub username | `cativo23` |
| `DOCKER_PASSWORD` | Docker Hub token (not password) | `dckr_pat_xxx` |
| `SSH_HOST` | Your server IP/hostname | `cativo.dev` |
| `SSH_USERNAME` | SSH username | `cativo23` |
| `SSH_PRIVATE_KEY` | SSH private key for deployment | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PORT` | SSH port — polaris2 accepts SSH only on `52222`; port 22 is closed | `52222` |

### Create Docker Hub Token

```bash
# Go to https://hub.docker.com/settings/security
# Create access token with Read, Write, Delete permissions
# Copy and save as DOCKER_PASSWORD secret
```

### Setup SSH Key for GitHub Actions

```bash
# Generate dedicated deploy key
ssh-keygen -t ed25519 -f github-deploy -C "github-actions-deploy"

# Copy public key to server
ssh-copy-id -p 52222 -i github-deploy.pub cativo23@cativo.dev

# Add private key as GitHub secret
cat github-deploy | gh secret set SSH_PRIVATE_KEY

# Cleanup
rm github-deploy github-deploy.pub
```

### Configure GitHub Variables (optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `DEPLOY_DIR` | Deployment directory on server | `/home/cativo23/deploy/clarify-deploy` |

### First-Time Server Setup

```bash
# SSH into your server
ssh -p 52222 cativo23@cativo.dev

# Create deployment directory
mkdir -p /home/cativo23/deploy/clarify-deploy
cd /home/cativo23/deploy/clarify-deploy

# Clone or copy docker-compose.prod.yml here
# (The GitHub Actions workflow will copy this file automatically)

# Create .env from template and fill in real values
cp /path/to/clarify/.env.example .env
nano .env  # Edit with production values
```

### Runtime environment contract

The image is built without env, so Nuxt's `runtimeConfig` only honors `NUXT_`-prefixed
variables at runtime (see `nuxt.config.ts`'s `process.env` defaults, which are frozen at
build time). `docker-compose.prod.yml` maps these from the plain names, so the server
`.env` file keeps the plain names already documented in `.env.example` — you do not need
to add `NUXT_`-prefixed keys to `.env` yourself. Omitting the `REDIS_*` lines selects the
bundled `redis` container instead of an external one (e.g. Upstash).

`CLARIFY_IMAGE_TAG` pins the deployed image to a specific tag, or rolls back to a prior
one, without cutting a new release: set it in the server's `.env` (e.g.
`CLARIFY_IMAGE_TAG=v1.0.0-alpha.19`), then run
`docker compose -f docker-compose.prod.yml up -d`.

### Traefik conventions on polaris2

- Entrypoints: `web` (`:80`, redirects globally to `websecure` at the Traefik static
  config level — no per-project scheme-redirect middleware needed) and `websecure`
  (`:443`, TLS termination)
- ACME certificate resolver: `letsencryptresolver`
- Docker network: `space-server_web` (external, shared with every other project on the
  host)
- Every router, middleware, and service name this project defines via Docker labels is
  `clarify`-prefixed, to avoid colliding with the ~20 other projects sharing the same
  Traefik instance

### Trigger a Deployment

**Option 1: Auto-release on push to main**

```bash
# Make your changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Auto-release workflow creates a patch release
# CI/CD workflow deploys automatically
```

**Option 2: Manual release with version control**

```bash
# Go to GitHub Actions → Auto Release → Run workflow
# Select version type: patch, minor, or major
# This creates a release and triggers deployment
```

**Option 3: Manual GitHub Release**

```bash
# Go to GitHub → Releases → Create new release
# Create a new tag (e.g., v1.0.0)
# Publish release
# CI/CD workflow triggers automatically
```

### Monitor Deployment

```bash
# In GitHub Actions, watch the CI/CD workflow run
# Check "Deploy to Home Server" job output

# On server, check deployment status
ssh -p 52222 cativo23@cativo.dev
docker compose -f /home/cativo23/deploy/clarify-deploy/docker-compose.prod.yml ps
docker compose -f /home/cativo23/deploy/clarify-deploy/docker-compose.prod.yml logs -f
```

---

## Manual Deployment (Alternative)

### Prerequisites

- Docker & Docker Compose installed
- Traefik reverse proxy running with `space-server_web` network
- SSL certificates configured (Let's Encrypt)

### Deployment Steps

#### 1. Clone repository on server

```bash
ssh -p 52222 cativo23@cativo.dev
cd ~
git clone https://github.com/cativo23/clarify.git
cd clarify
```

#### 2. Configure environment variables

```bash
cp .env.example .env
nano .env  # Edit with production values
```

Required variables:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_TOKEN` (Upstash) or local Redis
- `BASE_URL` (e.g., `https://clarify.cativo.dev`)

#### 3. Build and deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

#### 4. Verify deployment

```bash
# Check containers are running
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f worker

# Test health endpoint
curl https://clarify.cativo.dev/api/health
```

#### 5. Scale workers (if needed)

```bash
# Scale to 2 worker replicas
docker compose -f docker-compose.prod.yml up -d --scale worker=2
```

---

## Local Development

```bash
# Use docker-compose.yml (not prod)
docker compose up

# Access at http://localhost:3001
```

---

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

### Deployment fails with ".env not found"

The GitHub Actions workflow copies `.env.example` to the server. On first deploy:

```bash
ssh -p 52222 cativo23@cativo.dev
cd /home/cativo23/deploy/clarify-deploy
cp .env.example .env
nano .env  # Fill in real values
docker compose -f docker-compose.prod.yml up -d
```

---

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
