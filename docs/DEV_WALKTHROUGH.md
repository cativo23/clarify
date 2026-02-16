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
- **Dockerized Environment**: Optimized for Node 20 and PostgreSQL. [docker-compose.yml](../docker-compose.yml) manages the full stack.
- **Persistence Layer**: Relational schema with trigram indices for fast analysis searches. [database/init.sql](../database/init.sql).

### 3. 💳 Financial Infrastructure
- **Stripe Integration**: Complete Checkout and Webhook flow. Ensures credits are granted only after Stripe confirmation.
- **Atomic Billing**: Credit deductions are performed via PostgreSQL RPCs to prevent race conditions.
- **Reference**: See [Stripe Setup](STRIPE_SETUP.md).

### 4. 📊 User & Admin Dashboards
- **User Dashboard**: Real-time status updates via Supabase Realtime and drag-and-drop file uploads.
- **Admin Analytics**: Private dashboard for monitoring token costs, model performance, and user growth.
- **Risk Visualization**: The "Traffic Light" indicator system (`RiskCard.vue`) provides an executive summary of legal risks.

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
- [ ] **Whitelisting**: Add production origins to "Allowed Domains" in Supabase Auth and Stripe settings.
- [ ] **Webhooks**: Confirm the production Stripe Webhook Secret is correctly set.
- [ ] **Admin Security**: Ensure the `ADMIN_EMAIL` environment variable matches the intended administrator account.

---

*This project follows **Clean Architecture** and **TypeScript-First** principles to ensure long-term maintainability and scalability.*
