# Clarify - AI-Powered Contract Auditing

> **Clarify** is an AI-powered platform designed to democratize access to legal advice. It enables users to upload complex legal contracts and receive detailed risk assessments in plain language, identifying risks, benefits, and critical clauses in seconds.

![Nuxt 3](https://img.shields.io/badge/Nuxt%203-00DC82?style=for-the-badge&logo=nuxtdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

---

## Features

- 📄 **PDF Analysis** - Secure document upload with magic byte validation and text extraction
- 👨‍⚖️ **AI Legal Audit** - Dynamic prompts specialized in consumer protection and abusive clause detection
- 📊 **User Dashboard** - Analysis history, document management, and credit tracking
- 💳 **Credit System** - Pay-per-analysis model integrated with Stripe
- 🔐 **Secure Authentication** - Supabase Auth with Row Level Security (RLS)
- ⚡ **Async Processing** - BullMQ/Redis job queue for reliable analysis processing
- 🐳 **Docker Ready** - Local development with Docker Compose

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Framework** | [Nuxt 3](https://nuxt.com/) | Vue 3, Composition API, TypeScript |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL with Row Level Security |
| **AI** | [OpenAI API](https://openai.com/) | GPT-4o, GPT-5-mini, GPT-5 (3-tier strategy) |
| **Payment Gateway** | [Stripe](https://stripe.com/) | Webhook-based credit fulfillment |
| **Queue System** | [BullMQ](https://docs.bullmq.io/) + Redis | Async job processing |
| **Styling** | Tailwind CSS | Premium aesthetic with glassmorphism |

---

## 🏁 Quick Start

### Prerequisites

- Node.js 24+ **or** Docker + Docker Compose
- Accounts on OpenAI, Stripe, and Supabase
- Redis instance (local or cloud via Upstash)

### 1️⃣ Clone and Configure

```bash
git clone <repository-url>
cd clarify
```

### 2️⃣ Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Redis (Upstash or local)
REDIS_HOST=...
REDIS_PORT=...
REDIS_TOKEN=...

# Admin
ADMIN_EMAIL=your-email@example.com
```

### 3️⃣ Running the Application

#### Option A: Docker (Local Development)

Start the entire stack locally with a single command:

```bash
docker compose up -d --build
```

The application will be available at `http://localhost:3001`.

#### Option B: Local Development (npm)

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

**Critical for AI Agents:** All commands must be executed inside the Docker container to avoid host environment conflicts.

```bash
docker compose exec app <command>
```

Example usage:
```bash
docker compose exec app npm install
docker compose exec app npm run dev
docker compose exec app npm run db:migrate
```

### 4️⃣ Database Setup

Apply database migrations:

```bash
npm run db:migrate
```

To reset and seed the database:

```bash
npm run db:refresh
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test:run       # Run once
npm run test           # Watch mode
npm run test:ui        # Graphical UI

# E2E tests
npm run test:e2e       # Run all E2E tests
npm run test:e2e:ui    # With UI
```

For detailed testing documentation, see [Testing Guide](docs/TESTING.md).

---

## 📂 Project Structure

```text
clarify/
├── components/          # Reusable UI components (AppHeader, RiskCard, etc.)
├── docs/                # Technical documentation
├── pages/               # Application views (Dashboard, Login, Analysis)
├── server/
│   ├── api/             # API endpoints (analyze, upload, Stripe webhooks)
│   ├── prompts/         # Configurable AI prompts (legal analysis)
│   └── utils/           # Server utilities (OpenAI, Stripe, PDF parser)
├── database/            # SQL migrations and seeders
├── types/               # TypeScript definitions
├── public/              # Static assets
└── scripts/             # Utility scripts
```

---

## 📊 Analysis Tiers

Clarify uses a 3-tier AI analysis strategy:

| Tier | Model | Credits | Use Case |
|------|-------|---------|----------|
| **Basic** | gpt-4o-mini | 1 | Fast red-flag scan |
| **Premium** | gpt-5-mini | 3 | Reasoning-based audit (Recommended) |
| **Forensic** | gpt-5 | 10 | Exhaustive high-precision audit |

Learn more about our AI strategy in [3-Tier Strategy](docs/3_TIER_STRATEGY.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture and system design |
| [3-Tier Strategy](docs/3_TIER_STRATEGY.md) | AI strategy and 3-tier configuration |
| [Security](docs/SECURITY.md) | Security practices and risk assessment |
| [Stripe Setup](docs/STRIPE_SETUP.md) | Payment integration guide |
| [Testing Guide](docs/TESTING.md) | Testing strategies and commands |
| [Code Review](docs/CODE_REVIEW_2026-02-21.md) | Latest code review report |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Git Workflow

This project follows [GitFlow](https://nvie.com/posts/a-successful-git-branching-model/) with [Conventional Commits](https://www.conventionalcommits.org/) and [Gitmoji](https://gitmoji.dev/).

Commit format: `<gitmoji> <type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `security`, `cleanup`, `perf`, `style`, `test`

---

## 📄 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ to simplify the legal world.
