# Roadmap: Clarify

## Overview

Clarify is an AI-powered contract auditing platform that analyzes legal documents and produces risk assessments. This roadmap delivers a complete MVP with 3-tier analysis (Basic/Premium/Forensic), credit-based monetization via Stripe, PDF export, and admin analytics. The journey starts with completing core analysis functionality, moves through monetization and user acquisition features, and ends with production deployment and operational visibility.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Core Analysis Foundation** - Complete 3-tier analysis backend with secure upload and async processing
- [ ] **Phase 2: Tier Selection & UX** - Users can select analysis tier and see progress during upload/analysis
- [ ] **Phase 3: PDF Export & History** - Export results as branded PDF, searchable analysis history
- [ ] **Phase 4: Stripe & Monetization** - Enable credit purchases with real payments
- [ ] **Phase 5: Free Credits & Onboarding** - 10 credits on signup + 1 free Basic analysis/month
- [ ] **Phase 6: Admin Analytics** - Revenue dashboard, conversion tracking, cost analysis, user management
- [ ] **Phase 7: Production Deployment** - Vercel deployment verified with all environments configured

## Phase Details

### Phase 1: Core Analysis Foundation
**Goal**: Complete analysis pipeline working end-to-end with all 3 tiers
**Depends on**: Nothing (first phase)
**Requirements**: TIER-01, TIER-03, UPLOAD-01, QUEUE-01, PROMPT-01
**Success Criteria** (what must be TRUE):
  1. User can upload a PDF/Word document and see it in their analysis history
  2. Forensic tier uses gpt-5 model with dedicated exhaustive analysis prompt
  3. Long-running analyses (2-5 min) complete without timeout via BullMQ queue
  4. Uploaded files are validated via magic bytes (not just extension)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Create Forensic analysis prompt (100% coverage, cross-clause analysis, exhaustive omissions)
- [x] 01-02-PLAN.md — Update OpenAI client to support Forensic tier (prompt loading, gpt-5 model, token limits)
- [x] 01-03-PLAN.md — Add database support and config-driven credit costs for Forensic tier

### Phase 2: Tier Selection & UX
**Goal**: Users can choose analysis tier and understand what they're paying for
**Depends on**: Phase 1
**Requirements**: TIER-02, UPLOAD-02
**Success Criteria** (what must be TRUE):
  1. User sees Basic/Premium/Forensic options with credit costs before upload
  2. User can see upload progress as percentage bar during file upload
  3. User understands difference between tiers (speed vs accuracy tradeoffs)
  4. User's credit balance is visible on dashboard
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Tier selector enhancement with comparison modal and token tooltips
- [x] 02-02-PLAN.md — Upload progress indicator with step display (Subiendo → Validando → Completado)
- [ ] 02-03-PLAN.md — Analysis status badge with real-time updates via Supabase Realtime

### Phase 3: PDF Export & History
**Goal**: Users can export results and revisit past analyses
**Depends on**: Phase 2
**Requirements**: PDF-01, HISTORY-01, HISTORY-02
**Success Criteria** (what must be TRUE):
  1. User can download analysis results as formatted PDF report
  2. User can search and filter their analysis history
  3. PDF report includes branded header, risk summary, and key clauses
**Plans**: TBD

Plans:
- [ ] 03-01: Implement PDF generation with pdfkit
- [ ] 03-02: Add search and filter to history page

### Phase 4: Stripe & Monetization
**Goal**: Enable credit purchases with real payments
**Depends on**: Phase 3
**Requirements**: STRIPE-01, STRIPE-02, STRIPE-03
**Success Criteria** (what must be TRUE):
  1. Stripe Price IDs configured for all credit packages (5/$4.99, 10/$8.99, 25/$19.99)
  2. User can select package, complete checkout, and receive credits automatically
  3. Webhook successfully triggers atomic credit increment via PostgreSQL RPC
  4. Transaction logged to `transactions` table with full audit trail
**Plans**: TBD

Plans:
- [ ] 04-01: Create Stripe products and Price IDs in dashboard
- [ ] 04-02: Configure Stripe webhook endpoint and secret
- [ ] 04-03: Test end-to-end purchase flow with real payment

### Phase 5: Free Credits & Onboarding
**Goal**: Remove barrier to trial with free credits while preventing abuse
**Depends on**: Phase 4 (need monetization working first)
**Requirements**: CREDIT-01, CREDIT-02, DEMO-01
**Success Criteria** (what must be TRUE):
  1. New user receives 10 credits automatically on signup
  2. User gets 1 free Basic analysis per month (regardless of credit balance)
  3. Homepage has interactive demo showing product value
  4. Email verification prevents free credit abuse
**Plans**: TBD

Plans:
- [ ] 05-01: Implement free credits on signup with email verification
- [ ] 05-02: Build monthly free Basic analysis logic
- [ ] 05-03: Create homepage interactive demo

### Phase 6: Admin Analytics
**Goal**: Operational visibility into revenue, costs, and user behavior
**Depends on**: Phase 4 (need real transaction data)
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04
**Success Criteria** (what must be TRUE):
  1. Admin sees conversion funnel (signup → purchase) with charts
  2. Admin sees revenue dashboard (daily/weekly/monthly)
  3. Admin sees cost per analysis vs profit margin
  4. Admin can add credits, suspend users, view history
**Plans**: TBD

Plans:
- [ ] 06-01: Fix admin charts (currently not rendering)
- [ ] 06-02: Add cost analysis per tier using token usage data

### Phase 7: Production Deployment
**Goal**: Verified production deployment on Vercel with all environments configured
**Depends on**: Phase 6
**Requirements**: DEPLOY-01
**Success Criteria** (what must be TRUE):
  1. Application deploys to Vercel production successfully
  2. All environment variables configured (Supabase, Stripe, OpenAI, Redis)
  3. BullMQ workers running on persistent infrastructure (Railway/Render)
  4. Production URL accessible and functional
**Plans**: TBD

Plans:
- [ ] 07-01: Deploy workers to Railway/Render (not Vercel)
- [ ] 07-02: Configure all production environment variables

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Analysis Foundation | 3/3 | Complete   | 2026-02-22 |
| 2. Tier Selection & UX | 2/3 | In progress | - |
| 3. PDF Export & History | 0/2 | Not started | - |
| 4. Stripe & Monetization | 0/3 | Not started | - |
| 5. Free Credits & Onboarding | 0/3 | Not started | - |
| 6. Admin Analytics | 0/2 | Not started | - |
| 7. Production Deployment | 0/2 | Not started | - |

## Requirement Coverage

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| TIER-01 | Forensic Tier Backend — gpt-5 model configured and working | Phase 1 | Complete |
| TIER-02 | Tier Selection UI — Users can select Basic/Premium/Forensic before analysis | Phase 2 | Complete |
| TIER-03 | 3-tier analysis strategy (Basic/Premium/Forensic) | Phase 1 | Complete |
| UPLOAD-01 | Secure file upload with magic byte validation | Phase 1 | Pending |
| UPLOAD-02 | Upload progress indicator | Phase 2 | Complete |
| QUEUE-01 | BullMQ/Upstash queue for async processing | Phase 1 | Complete |
| PROMPT-01 | Forensic Analysis Prompt — Dedicated prompt for exhaustive 100% coverage analysis | Phase 1 | Complete |
| PDF-01 | PDF Export — Export analysis results as formatted PDF | Phase 3 | Pending |
| HISTORY-01 | Searchable analysis history | Phase 3 | Pending |
| HISTORY-02 | Analysis history with filters | Phase 3 | Pending |
| STRIPE-01 | Stripe Configuration — Price IDs, webhook secret, checkout flow working | Phase 4 | Pending |
| STRIPE-02 | Credit Purchase Flow — Users can buy credit packages (5/$4.99, 10/$8.99, 25/$19.99) | Phase 4 | Pending |
| STRIPE-03 | Webhook Handling — Atomic credit increment on successful payment | Phase 4 | Pending |
| CREDIT-01 | Free Credits System — 10 credits on signup | Phase 5 | Pending |
| CREDIT-02 | Monthly Free Analysis — 1 free Basic analysis per user per month | Phase 5 | Pending |
| DEMO-01 | Homepage Demo — Interactive element to show product value | Phase 5 | Pending |
| ADMIN-01 | Admin Conversion Tracking — Signup → purchase funnel | Phase 6 | Pending |
| ADMIN-02 | Admin Revenue Dashboard — Daily/weekly/monthly revenue | Phase 6 | Pending |
| ADMIN-03 | Admin Cost Analysis — Cost per analysis vs profit margin | Phase 6 | Pending |
| ADMIN-04 | Admin User Management — Add credits, suspend, view history | Phase 6 | Pending |
| DEPLOY-01 | Vercel Deployment — Verified production deployment | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Roadmap updated: 2026-02-23 (Plan 02-02 complete)*
*Based on PROJECT.md and research/SUMMARY.md*
