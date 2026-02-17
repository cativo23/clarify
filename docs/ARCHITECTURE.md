# Technical Architecture — Clarify

This document describes the technical design, data flows, and architectural guidelines for Clarify.

## 🧱 Component Overview

The platform is built on a modern Micro-SaaS stack using **Nuxt 3**.

### 1. Frontend (Nuxt 3 / Vue 3)
- **Framework:** Nuxt 3 with server-side rendering (SSR) capabilities.
- **UI System:** Tailwind CSS with a modular component architecture.
- **State Management:** Vue Composition API (`ref`, `computed`).
- **Authentication:** Managed by Supabase Auth with client-side session awareness.

### 2. Backend (Nitro Engine)
- **API Server:** Lightweight Nitro endpoints located in `server/api/`.
- **Worker Process:** Handles long-running AI analysis via **BullMQ** and **Redis**.
- **Scoped Client Architecture:** (New) Decoupled database access using specialized clients:
  - `WorkerSupabaseClient`: Locked-down client for background processing.
  - `AdminSupabaseClient`: Audited client for administrative operations.
  - `serverSupabaseClient`: Standard usage for authenticated user actions.
- **Security Utilities:** Centralized helpers for `auth`, `error-handler`, `file-validation`, `ssrf-protection`, and `redirect-validation`.
- **AI Integration:** Secure server-side communication with OpenAI using `gpt-4o-mini`, `gpt-5-mini`, and `gpt-5`.

### 3. Data & Storage (Supabase)
- **Database:** PostgreSQL for structured data (Users, Analyses, Transactions).
- **Storage:** Supabase Storage (S3-compatible) for encrypted contract PDFs.
- **Realtime:** Supabase Realtime for pushing analysis updates to the dashboard without polling.

---

## 🔄 Core Data Flows

### A. Contract Analysis Flow
1. **Upload**: Client sends PDF to `/api/upload`. The server validates magic bytes and structural integrity before streaming to Supabase Storage.
2. **Preprocessing**: The backend extracts text using `pdf-parse`, tokenizes it, and identifies the target model based on the selected **Analysis Tier**.
3. **Queueing**: A job is enqueued in Redis.
4. **Execution**: The worker process picks up the job, utilizes the `WorkerSupabaseClient` for secure DB access, sends payload to OpenAI, and parses the structured JSON response.
5. **Persistence**: Results are saved to the `analyses` table.
6. **Notification**: The client UI is updated via a Realtime subscription.

### B. Payment & Credits
1. **Checkout**: User initiates a Stripe Checkout session. Redirects are validated to prevent Open Redirect attacks.
2. **Success**: After successful payment, Stripe sends a secure Webhook to `/api/stripe/webhook`.
3. **Fulfillment**: The server validates the signature and atomically increments the user's credits using specialized PostgreSQL functions.

---

## 🛠️ Architectural Guidelines & Recommendations

### Security-First Engineering
Every feature must adhere to the **Zero Trust** principle:
- **Input Validation**: All uploads must pass magic byte verification.
- **SSR-Only Logic**: Sensitive calculations (credits, admin status) never happen on the client.
- **Scoped Access**: Use the most restrictive Supabase client possible for the task.

### Development Standards
1. **Error Sanitization**: Use `server/utils/error-handler.ts` to log full context server-side while returning generic "Safe" messages to users.
2. **Atomic Operations**: All credit changes must be performed via atomic PostgreSQL functions (RPCs) to prevent race conditions.
3. **Row Level Security (RLS)**: No data should be accessible without a matching RLS policy in Supabase.
4. **Zod Validation**: (Recommended) Implement Zod for input schema validation in all `server/api` routes.

---

## ⚙️ Deployment & Infrastructure
- **Containerization**: The app is dockerized with a non-root user.
- **Routing**: Traefik handles SSL termination and routing.
- **Migration System**: Laravel-style migrations for consistent schema management across environments.
