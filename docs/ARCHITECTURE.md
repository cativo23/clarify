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
- **Services Layer:** (Recommended) Business logic should be decoupled from route handlers into helper utilities or classes.
- **AI Integration:** Secure server-side communication with OpenAI using `gpt-4o-mini`, `gpt-5-mini`, and `gpt-5`.

### 3. Data & Storage (Supabase)
- **Database:** PostgreSQL for structured data (Users, Analyses, Transactions).
- **Storage:** Supabase Storage (S3-compatible) for encrypted contract PDFs.
- **Realtime:** Supabase Realtime for pushing analysis updates to the dashboard without polling.

---

## 🔄 Core Data Flows

### A. Contract Analysis Flow
1. **Upload**: Client sends PDF to `/api/upload`. The server streams it to Supabase Storage in a user-isolated folder.
2. **Preprocessing**: The backend extracts text using `pdf-parse`, tokenizes it, and identifies the target model based on the selected **Analysis Tier**.
3. **Queueing**: A job is enqueued in Redis.
4. **Execution**: The worker process picks up the job, sends the payload to OpenAI, and parses the structured JSON response.
5. **Persistence**: Results are saved to the `analyses` table.
6. **Notification**: The client UI is updated via a Realtime subscription.

### B. Payment & Credits
1. **Checkout**: User initiates a Stripe Checkout session.
2. **Success**: After successful payment, Stripe sends a secure Webhook to `/api/stripe/webhook`.
3. **Fulfillment**: The server validates the signature and atomically increments the user's credits in the database.

---

## 🛠️ Architectural Guidelines & Recommendations

### Keep It Lean (Nitro vs NestJS)
The current monolithic architecture (one Nuxt project) is optimal for the current scale (~15-20 endpoints). Moving to a separate backend (like NestJS) is deemed **overkill** until the API surface exceeds 50+ endpoints or multiple clients (Mobile, Public API) are introduced.

### Development Standards
1. **Zod Validation**: (Recommended) Implement Zod for input schema validation in all `server/api` routes.
2. **Atomic Operations**: All credit changes must be performed via atomic PostgreSQL functions (RPCs) to prevent race conditions.
3. **Row Level Security (RLS)**: No data should be accessible without a matching RLS policy in Supabase.
4. **Error Masking**: Raw database or AI errors must be masked. Log the full error server-side, but return generic messages to the client.

---

## ⚙️ Deployment & Infrastructure
- **Containerization**: The app is dockerized with a non-root user for security.
- **Routing**: Traefik handles SSL termination and routing.
- **Scaling**: The worker process can be scaled independently of the web tier to handle analysis load spikes.
