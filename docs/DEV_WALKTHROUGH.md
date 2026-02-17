# Developer Walkthrough & MVP Guide

Welcome to the **Clarify** technical guide. This document describes the architecture, core modules, and implementation status of the MVP to help onboard new developers.

## 🏁 Current Status: MVP Feature-Complete

The project has completed the foundational phases of infrastructure, business logic, and Premium UI. It is currently in a production-ready state (Staging/Master).

---

## 🛠️ Key Modules

### 1. 🧪 Hybrid AI Engine (3-Tier Strategy)
Our core value proposition is the multi-tier analysis system:
- **Tiers**: Basic (`gpt-4o-mini`), Premium (`gpt-5-mini`), and Forensic (`gpt-5`).
- **Dynamic Config**: Managed via `server/utils/config.ts` and remote database overrides.
- **Optimization**: Uses prompt versioning (v2) with high cache efficiency and semantic text preprocessing.
- **Reference**: See [Analysis Tiers & Strategy](ANALYSIS_TIERS.md).

### 2. 🏗️ Tech Stack & Infrastructure
- **Nuxt 3 (Fullstack)**: Single-origin deployment using Nitro.
- **Scoped Client Architecture**: Decoupled database access using `WorkerSupabaseClient` and `AdminSupabaseClient` for enhanced security.
- **Dockerized Environment**: Managed via [docker-compose.yml](../docker-compose.yml).
- **Migration System**: Laravel-style migrations for consistent schema management. [scripts/migrate.ts](../scripts/migrate.ts).

### 3. 💳 Financial Infrastructure
- **Stripe Integration**: Complete Checkout and Webhook flow.
- **Atomic Billing**: Credit deductions are performed via PostgreSQL RPCs to prevent race conditions.
- **Reference**: See [Stripe Setup](STRIPE_SETUP.md).

### 4. 🔐 Security & Hardening
- **Centralized Validation**: Strict file magic byte verification and URL redirect validation.
- **Error Sanitization**: Centralized error handler prevents information disclosure via generic safe messages.
- **SSRF Protection**: Hostname whitelisting and protocol enforcement for external requests.

---

## 🧭 Codebase Navigation

To dive deep into the implementation, follow these documents in order:

1.  🏗️ [Technical Architecture](ARCHITECTURE.md)
2.  🗄️ [Infrastructure Setup (Supabase)](SUPABASE_SETUP.md)
3.  🧪 [Analysis Strategy & Tiers](ANALYSIS_TIERS.md)
4.  🔐 [Security Consolidated Report](SECURITY_CONSOLIDATED_REPORT.md)

---

## 🚀 Deployment Checklist

Before moving to production, ensure these critical steps are completed:

- [ ] **Domain Setup**: Point DNS to your hosting provider (Vercel/Self-hosted).
- [ ] **Secret Management**: Configure the 7+ mandatory environment variables (OpenAI, Stripe, Supabase).
- [ ] **Database Setup**: Run `npm run db:init` and apply the generated SQL to create the migrations table.
- [ ] **Migrations**: Execute all pending migrations to set up the schema.
- [ ] **Admin Security**: Ensure the `ADMIN_EMAIL` environment variable matches the intended administrator account.

---

*This project follows **Clean Architecture** and **TypeScript-First** principles to ensure long-term maintainability and scalability.*
