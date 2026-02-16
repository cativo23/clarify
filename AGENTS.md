# AGENTS.md - Clarify

> **Welcome Agent!** This document serves as your primary source of truth for working on the **Clarify** codebase. Read this carefully to understand the project structure, architectural patterns, and coding standards.

## 🧠 Project Context

**Clarify** is an AI-powered legal audit platform (Micro-SaaS) that allows users to upload PDF contracts and receive simplified, risk-focused analyses.

-   **Core Value**: Democratizing legal advice by translating complex legalese into plain language.
-   **Key Features**: PDF Upload, AI Analysis (OpenAI), Credit System (Stripe), Dashboard.

## 🛠️ Technology Stack

| Component | Technology | Notes |
| :--- | :--- | :--- |
| **Framework** | **Nuxt 3** | Vue 3, Composition API, TypeScript everywhere. |
| **Language** | **TypeScript** | Strict typing is enforced. Avoid `any`. |
| **Database** | **Supabase** | PostgreSQL. **Relies heavily on RLS (Row Level Security)**. |
| **Auth** | **Supabase Auth** | Integrated with Nuxt sidebase/supabase. |
| **AI** | **OpenAI API** | GPT-4o-mini, GPT-5-mini, and GPT-5. See 3-tier strategy. |
| **Payments** | **Stripe** | Webhook-based credit fulfillment. |
| **Styling** | **Tailwind CSS** | "Premium" aesthetic. Dark mode optimization. |

## 🏗️ 3-Tier Strategy
The system offers three analysis levels:
- **Basic**: `gpt-4o-mini` (1 credit) - Fast red-flag scan.
- **Premium**: `gpt-5-mini` (3 credits) - Reasoning-based forensic audit.
- **Forensic**: `gpt-5` (10 credits) - Exhaustive high-precision audit.

Configuration is handled in `server/utils/config.ts`.

## 📂 Architecture & Directory Structure

This is a **monorepo-style** Nuxt application.

```text
/
├── components/          # Vue UI Components (Atoms/Molecules)
│   └── ...              # Prefixed (e.g., AppHeader.vue, RiskCard.vue)
├── pages/               # File-based Routing
│   ├── index.vue        # Landing Page
│   ├── dashboard.vue    # User Dashboard
│   └── login.vue        # Auth Page
├── server/              # Nitro Backend Engine
│   ├── api/             # API Endpoints (e.g., /api/analyze)
│   │   ├── stripe/      # Stripe specific endpoints (webhooks)
│   │   └── upload.post.ts # File upload handler
│   ├── utils/           # Server-side helpers (OpenAI client, formatting)
│   └── prompts/         # Text files containing system prompts
├── types/               # TypeScript Definitions
├── docs/                # Human documentation (Architecture, Setup)
└── utils/               # Client-side helpers
```

### Key Architectural Patterns

1.  **Server-Side Heavy Processing**:
    *   PDF parsing and OpenAI calls happen strictly in `server/api` to protect API keys and manage memory.
    *   **Do not** import server-only modules (like `fs` or `openai`) in client-side components.

2.  **Supabase RLS**:
    *   Security is handled at the database level.
    *   Always ensure RL policies cover new tables.
    *   Users can only see *their own* data (`auth.uid() = user_id`).

3.  **Credit System**:
    *   Credits are deduced *atomically* on the server side after a successful analysis request.
    *   Top-ups happen asynchronously via Stripe Webhooks.

## 📝 Coding Guidelines

### TypeScript & Vue
-   Use `<script setup lang="ts">` for all components.
-   Use explicit types for props and emits.
-   **State Management**: Use `useState` (Nuxt) or `ref/computed` (Vue). avoid external state libraries unless necessary.

### Styling (Tailwind)
-   Use utility classes directly in the template.
-   Maintain the "Premium" look:
    -   Use `backdrop-blur` and semi-transparent backgrounds for glassmorphism.
    -   Use generic font families like `Inter` or `sans-serif`.
    -   **Colors**: Stick to the defined palette (likely extended in `tailwind.config.js`).

### AI & Prompts
-   Prompts are text files in `server/prompts/`.
-   **Do not hardcode prompts** in TypeScript files. Read them using `fs` in the server handler.
-   When modifying prompts, increment the version or create a new file if testing major changes.

## 🚀 Common Workflows

### Running the Project
```bash
npm run dev
# Server starts at http://localhost:3000
```

### Database Changes
If you modify the schema, ensure you update local types:
```bash
npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
```
*(Note: Check if `types/supabase.ts` exists and follow the project's specific generation pattern)*

### Adding a New API Endpoint
1.  Create file in `server/api/my-endpoint.get.ts`.
2.  Use `defineEventHandler(async (event) => { ... })`.
3.  Always handle errors with `createError({ statusCode: ... })`.

## ⚠️ Critical Reminders

1.  **Security**: Never commit `.env` files.
2.  **RLS**: If you add a table, YOU MUST ADD RLS POLICIES.
3.  **PDFs**: PDF parsing is fragile. Ensure `pdf-parse` is used only in the server context.
