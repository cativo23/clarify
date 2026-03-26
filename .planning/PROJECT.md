# Clarify - Project Overview

## Current State

**v1.1 Admin & Deploy: SHIPPED** ✅ (2026-03-25)

Clarify is a shipped AI-powered contract analysis platform with 3-tier pricing, Stripe payments, free credits onboarding, interactive demo, and admin analytics dashboard.

**Next Milestone: v2.0** — TBD (planning required)

---

## What This Is

Clarify is an AI-powered contract auditing platform that analyzes legal documents and produces risk assessments. It translates complex legalese into plain language, helping individuals understand contracts before signing.

## Core Value

Democratizing legal advice by making contract analysis accessible and affordable for non-lawyers.

## Requirements

### Validated (v1.0)

- ✓ TIER-01: Forensic Tier Backend — gpt-5 model configured and working
- ✓ TIER-02: Tier Selection UI — Users can select Basic/Premium/Forensic before analysis
- ✓ TIER-03: 3-tier analysis strategy with clear credit costs (1/3/10 credits)
- ✓ PROMPT-01: Forensic Analysis Prompt — Dedicated prompt for exhaustive 100% coverage
- ✓ UPLOAD-01: Secure file upload with magic byte validation
- ✓ UPLOAD-02: Upload progress indicator showing percentage during file transfer
- ✓ QUEUE-01: BullMQ/Upstash queue for async processing
- ✓ PDF-01: PDF Export — Export analysis results as formatted PDF report
- ✓ HISTORY-01: Searchable analysis history with full-text search
- ✓ HISTORY-02: Analysis history with filters (date range, tier, risk level)
- ✓ STRIPE-01: Stripe Configuration — Price IDs, webhook secret, checkout flow working
- ✓ STRIPE-02: Credit Purchase Flow — Users can buy credit packages (5/$4.99, 10/$8.99, 25/$19.99)
- ✓ STRIPE-03: Webhook Handling — Atomic credit increment on successful payment via RPC
- ✓ CREDIT-01: Free Credits System — 10 credits on signup
- ✓ CREDIT-02: Monthly Free Analysis — 1 free Basic analysis per user per month
- ✓ DEMO-01: Homepage Demo — Interactive element to show product value

### Validated (v1.1)

- ✓ ADMIN-01: Admin Conversion Tracking — Signup → purchase funnel visualization (4-stage funnel) — v1.1
- ✓ ADMIN-02: Admin Revenue Dashboard — Daily/weekly/monthly/quarterly revenue charts with gross/net comparison — v1.1
- ✓ ADMIN-03: Admin Cost Analysis — Cost per analysis vs profit margin by tier — v1.1
- ✓ ADMIN-04: Admin User Management — Add credits, suspend users, view history with audit trail — v1.1
- ✓ DEPLOY-01: Vercel Deployment — Production infrastructure ready (live verification pending) — v1.1

### Out of Scope

- Subscription billing — Defer until after profitability validation
- Mobile app — Web-first approach
- Real-time collaboration — Individual user focus
- Multi-language support — English only for MVP
- Full CLM (Contract Lifecycle Management) — Focus on pre-signature analysis only

## Context

**Shipped v1.0:** 2026-03-15 with 22 plans across 5 phases, 95+ tests, 17/20 requirements complete.
**Shipped v1.1:** 2026-03-25 with 4 plans across 2 phases, 43 admin tests, 5/5 requirements (DEPLOY-01 partial).

**Technical Environment:**
- Nuxt 3.15.1 with Vue 3 Composition API
- TypeScript 5.7.3
- Supabase (PostgreSQL + Auth + Storage) with RLS
- Upstash Redis for BullMQ queue
- Stripe for payments
- OpenAI API (gpt-4o-mini, gpt-5-mini, gpt-5)

**Target User:**
Individual consumers who need to understand contracts — renters, freelancers, small business owners, anyone facing complex legal language.

## Constraints

- **Tech Stack**: Must deploy on Vercel (serverless-compatible)
- **Budget**: Micro-SaaS economics — prioritize high-impact, low-complexity features
- **Pricing**: Credit-based model ($4.99/5, $8.99/10, $19.99/25)
- **Free Tier**: 10 credits on signup + 1 free Basic analysis/month

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Credit-based pricing over subscription | Lower commitment for users, easier to test profitability | ✓ Validated v1.0 |
| 3-tier analysis strategy (Basic/Premium/Forensic) | Balance cost vs accuracy, let users choose | ✓ Validated v1.0 |
| Serverless deployment (Vercel) | Zero infra management, scales automatically | ✓ Confirmed v1.0 |
| Async job processing (BullMQ + Upstash) | Long-running AI jobs need queue, not HTTP | ✓ Working v1.0 |
| PDF export for results (pdfkit, cached in Storage) | Users want portable, shareable reports | ✓ Validated v1.0 |
| Forensic tier buffer allocation (5k tokens) | Maximize 120k context window for exhaustive analysis | ✓ Implemented v1.0 |
| Email verification for free credits | Prevent abuse while removing trial barriers | ✓ Validated v1.0 |
| Demo rate limiting (5 req/day per IP) | Balance UX with abuse prevention | ✓ Adjusted per user feedback |
| Horizontal bar chart for conversion funnel | Easier to read stage names and compare widths | ✓ Validated v1.1 |
| Gross vs net as solid vs dashed lines | Visual distinction without relying solely on color | ✓ Validated v1.1 |
| Package inference from amount ranges | Avoids schema changes; uses amount ranges to determine tier | ✓ Validated v1.1 |
| Credit adjustments logged as type='adjustment' with amount=0 | Audit trail without monetary value | ✓ Validated v1.1 |
| Suspension requires mandatory reason field | Compliance and accountability | ✓ Validated v1.1 |

---
*Last updated: 2026-03-25 after v1.1 Admin & Deploy milestone*
