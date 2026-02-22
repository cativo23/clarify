# Clarify - MVP Roadmap

## What This Is

Clarify is an AI-powered contract auditing platform that analyzes legal documents and produces risk assessments. It translates complex legalese into plain language, helping individuals understand contracts before signing.

## Core Value

Democratizing legal advice by making contract analysis accessible and affordable for non-lawyers.

## Requirements

### Validated

- ✓ Core contract analysis working (Basic + Premium tiers)
- ✓ User authentication via Supabase
- ✓ Credit system with Stripe payments
- ✓ Admin panel exists (analytics + config)
- ✓ BullMQ/Upstash queue for async processing
- ✓ Secure file upload with magic byte validation

### Active

- [ ] **Tier Selection UI** — Users can select Basic/Premium/Forensic before analysis
- [ ] **Forensic Tier Backend** — gpt-5 model configured and working
- [ ] **PDF Export** — Export analysis results as formatted PDF
- [ ] **Homepage Demo** — Interactive element to show product value
- [ ] **Free Credits System** — 10 credits on signup
- [ ] **Monthly Free Analysis** — 1 free Basic analysis per user per month
- [ ] **Admin Conversion Tracking** — Signup → purchase funnel
- [ ] **Admin Revenue Dashboard** — Daily/weekly/monthly revenue
- [ ] **Admin Cost Analysis** — Cost per analysis vs profit margin
- [ ] **Admin User Management** — Add credits, suspend, view history
- [ ] **Vercel Deployment** — Verified production deployment

### Out of Scope

- Subscription billing — Defer until after profitability validation
- Mobile app — Web-first approach
- Real-time collaboration — Individual user focus
- Multi-language support — English only for MVP

## Context

**Current State:**
- Brownfield project with working core functionality
- 2 of 3 analysis tiers implemented (Basic + Premium)
- Admin analytics page exists but charts not rendering
- PDF generation library (pdfkit) already in devDependencies

**Technical Environment:**
- Nuxt 3.15.1 with Vue 3 Composition API
- TypeScript 5.7.3
- Supabase (PostgreSQL + Auth + Storage)
- Upstash Redis for BullMQ queue
- Stripe for payments
- OpenAI API (gpt-4o-mini, gpt-5-mini, gpt-5)

**Target User:**
Individual consumers who need to understand contracts — renters, freelancers, small business owners, anyone facing complex legal language.

## Constraints

- **Tech Stack**: Must deploy on Vercel (serverless-compatible)
- **Budget**: Micro-SaaS economics — prioritize high-impact, low-complexity features
- **Timeline**: MVP should be releasable within 4-6 phases
- **Pricing**: Credit-based model ($4.99/5, $8.99/10, $19.99/25)
- **Free Tier**: 10 credits on signup + 1 free Basic analysis/month

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Credit-based pricing over subscription | Lower commitment for users, easier to test profitability | — Pending |
| 3-tier analysis strategy | Balance cost vs accuracy, let users choose | — Pending |
| Serverless deployment (Vercel) | Zero infra management, scales automatically | — Pending |
| Async job processing (BullMQ) | Long-running AI jobs need queue, not HTTP | ✓ Confirmed working |
| PDF export for results | Users want portable, shareable reports | — Pending |

---
*Last updated: 2026-02-21 after MVP planning session*
