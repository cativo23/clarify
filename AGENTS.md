# 🧠 AI Agent Instructions

This document provides guidance for AI agents working in the **Clarify** repository.

## 🚀 Project Overview
Clarify is an AI-powered contract auditing platform (Micro-SaaS) that analyzes legal documents and produces risk assessments. Democratizing legal advice by translating legalese into plain language.

### Technology Stack
| Component | Technology | Notes |
| :--- | :--- | :--- |
| **Framework** | **Nuxt 3** | Vue 3, Composition API, TypeScript everywhere. |
| **Database** | **Supabase** | PostgreSQL. **Strict Row Level Security (RLS)**. |
| **AI** | **OpenAI API** | 3-tier strategy (gpt-4o-mini, gpt-5-mini, gpt-5). |
| **Payments** | **Stripe** | Webhook-based credit fulfillment. |
| **Queue** | **BullMQ/Redis** | Async job processing (Upstash in production). |
| **Styling** | **Tailwind CSS** | "Premium" aesthetic (glassmorphism/dark mode). |

## 🏗️ Architecture & Core Flows

### 3-Tier Analysis Strategy
- **Basic**: `gpt-4o-mini` (1 credit) - Fast red-flag scan.
- **Premium**: `gpt-5-mini` (3 credits) - Reasoning-based audit (Recommended).
- **Forensic**: `gpt-5` (10 credits) - Exhaustive high-precision audit.

### Core Flows
1.  **Analysis**: Client upload -> `/api/upload` (Magic Byte Validation) -> Supabase Storage -> BullMQ Task -> OpenAI -> DB.
2.  **Credits**: Stripe Checkout -> Webhook -> **Atomic PostgreSQL RPC** (prevents race conditions).
3.  **Authentication**: Supabase Auth with RLS. Admin checks use `is_admin` + `admin_emails` table.

## 📂 Directory Structure
```text
├── components/          # Vue UI Components (<script setup lang="ts">)
├── pages/               # File-based routing (dashboard, login, admin/)
├── server/              # Backend
│   ├── api/             # Endpoints (Zod validation, error handling)
│   ├── prompts/         # AI Prompts (Read via fs, do not hardcode)
│   └── utils/           # Helpers (auth, openai, stripe, redis)
├── database/            # SQL Migrations & Seeders
├── types/               # TypeScript definitions
└── docs/                # Technical documentation
```

## 🔐 Security & Coding Guidelines
- **Strict RLS**: Every table MUST have Row Level Security.
- **Atomic Ops**: All credit/financial changes must use PostgreSQL RPCs to avoid race conditions.
- **TypeScript**: Use `<script setup lang="ts">`. Avoid `any`. Strict typing is mandatory.
- **Style**: Use glassmorphism (`backdrop-blur`), subtle borders, and `Inter` typography.
- **Server Safety**: Never import Node modules (`fs`, `path`) or service-role keys in client code.

### Git Guidelines
Follow [Conventional Commits](https://www.conventionalcommits.org/) with [Gitmoji](https://gitmoji.dev/).
Format: `<gitmoji> <type>(<scope>): <description>`
Types: `feat` ✨, `fix` 🐛, `docs` 📝, `refactor` ♻️, `chore` 🔧, `security` 🔐, `cleanup` 🔥, `perf` ⚡, `style` 🎨, `test` ✅.

### GitFlow Release Process
For alpha releases, follow GitFlow workflow using GitHub CLI:

```bash
# 1. Create release branch from feature branch
git checkout -b release/v1.0.0-alpha.X
git push -u origin release/v1.0.0-alpha.X

# 2. Create PRs to develop and main
gh pr create --base develop --head release/v1.0.0-alpha.X --title "release: v1.0.0-alpha.X" --body "Release notes..."
gh pr create --base main --head release/v1.0.0-alpha.X --title "release: v1.0.0-alpha.X" --body "Release notes..."

# 3. Merge PRs (after any required reviews)
gh pr merge <PR_NUMBER> --merge --admin

# 4. Create and push tag
git checkout main && git pull origin main
git tag -a v1.0.0-alpha.X -m "Release v1.0.0-alpha.X - Description"
git push origin v1.0.0-alpha.X

# 5. Create GitHub release
gh release create v1.0.0-alpha.X --title "v1.0.0-alpha.X" --notes "Changelog..." --prerelease

# 6. Cleanup release branch
git push origin --delete release/v1.0.0-alpha.X
git branch -D release/v1.0.0-alpha.X
```

**Key Rules:**
- All merges between branches MUST be done via GitHub PRs
- PRs must be created and accepted via GitHub CLI (`gh pr create`, `gh pr merge`)
- Tags and releases are created using GitHub CLI (`gh release create`)
- Release branches follow naming convention: `release/v1.0.0-alpha.X`
- All releases are pre-release (`--prerelease` flag) until stable

## 🐳 Docker Execution
AI Agents MUST execute all commands inside the Docker container to ensure environment consistency. DO NOT run npm or database commands directly on the host machine.

```bash
docker compose exec app <command>
```

## 🛠️ Common Commands
```bash
# Development
npm run dev              # Starts dev server on port 3001
npm run lint / typecheck # Quality checks

# Database
npm run db:migrate       # Apply migrations
npm run db:status        # Show migration status
npm run migrate:make     # Create new migration
npm run db:refresh       # Wipe + re-migrate + seed (--force required)

# Security & Infrastructure
npm run security:audit   # Check vulnerabilities
docker compose up -d     # Start development infra
scripts/test-redis.ts    # Verify Redis connectivity
```

## ⚙️ Environment Variables
Required in `.env`: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_TOKEN`, `ADMIN_EMAIL`.

## ⚠️ Critical Reminders
1.  **Never commit .env files**.
2.  **Prompt Management**: Do not hardcode prompts in TS; use `server/prompts/`.
3.  **Error Handling**: Use Nuxt `createError({ statusCode: ..., message: ... })`.
4.  **Documentation**: See `docs/SECURITY.md` for operational security standards.
