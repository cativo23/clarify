# Roadmap: Clarify

## Overview

Clarify is an AI-powered contract auditing platform that analyzes legal documents and produces risk assessments. This roadmap delivers a complete MVP with 3-tier analysis (Basic/Premium/Forensic), credit-based monetization via Stripe, PDF export, and admin analytics. The journey starts with completing core analysis functionality, moves through monetization and user acquisition features, and ends with production deployment and operational visibility.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core Analysis Foundation** - Complete 3-tier analysis backend with secure upload and async processing
- [ ] **Phase 2: Tier Selection & UX** - Users can select analysis tier and see progress during upload/analysis
- [ ] **Phase 3: PDF Export & History** - Export results as branded PDF, searchable analysis history
- [ ] **Phase 4: Free Credits & Onboarding** - 10 credits on signup + 1 free Basic analysis/month with fraud prevention
- [ ] **Phase 5: Admin Analytics** - Revenue dashboard, conversion tracking, cost analysis, user management
- [ ] **Phase 6: Production Deployment** - Vercel deployment verified with all environments configured

## Phase Details

### Phase 1: Core Analysis Foundation
**Goal**: Complete analysis pipeline working end-to-end with Forensic tier
**Depends on**: Nothing (first phase)
**Requirements**: TIER-01, UPLOAD-01, QUEUE-01
**Success Criteria** (what must be TRUE):
  1. User can upload a PDF/Word document and see it in their analysis history
  2. User can select Forensic tier and receive analysis using gpt-5 model
  3. Long-running analyses (2-5 min) complete without timeout via BullMQ queue
  4. Uploaded files are validated via magic bytes (not just extension)
**Plans**: TBD

Plans:
- [ ] 01-01: [TBD]
- [ ] 01-02: [TBD]
- [ ] 01-03: [TBD]

### Phase 2: Tier Selection & UX
**Goal**: Users can choose analysis tier and understand what they're paying for
**Depends on**: Phase 1
**Requirements**: TIER-02, TIER-03, UPLOAD-02
**Success Criteria** (what must be TRUE):
  1. User sees Basic/Premium/Forensic options with credit costs before upload
  2. User can see upload progress as percentage bar during file upload
  3. User understands difference between tiers (speed vs accuracy tradeoffs)
  4. User's credit balance is visible on dashboard
**Plans**: TBD

Plans:
- [ ] 02-01: [TBD]
- [ ] 02-02: [TBD]

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
- [ ] 03-01: [TBD]
- [ ] 03-02: [TBD]

### Phase 4: Free Credits & Onboarding
**Goal**: Remove barrier to trial with free credits while preventing abuse
**Depends on**: Phase 3
**Requirements**: CREDIT-01, CREDIT-02, DEMO-01
**Success Criteria** (what must be TRUE):
  1. New user receives 10 credits automatically on signup
  2. User gets 1 free Basic analysis per month (regardless of credit balance)
  3. Homepage has interactive demo showing product value
  4. Email verification prevents free credit abuse
**Plans**: TBD

Plans:
- [ ] 04-01: [TBD]
- [ ] 04-02: [TBD]
- [ ] 04-03: [TBD]

### Phase 5: Admin Analytics
**Goal**: Operational visibility into revenue, costs, and user behavior
**Depends on**: Phase 4
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04
**Success Criteria** (what must be TRUE):
  1. Admin sees conversion funnel (signup → purchase) with charts
  2. Admin sees revenue dashboard (daily/weekly/monthly)
  3. Admin sees cost per analysis vs profit margin
  4. Admin can add credits, suspend users, view user history
**Plans**: TBD

Plans:
- [ ] 05-01: [TBD]
- [ ] 05-02: [TBD]

### Phase 6: Production Deployment
**Goal**: Verified production deployment on Vercel with all environments configured
**Depends on**: Phase 5
**Requirements**: DEPLOY-01
**Success Criteria** (what must be TRUE):
  1. Application deploys to Vercel production successfully
  2. All environment variables configured (Supabase, Stripe, OpenAI, Redis)
  3. BullMQ workers running on persistent infrastructure (Railway/Render)
  4. Production URL accessible and functional
**Plans**: TBD

Plans:
- [ ] 06-01: [TBD]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Analysis Foundation | 0/3 | Not started | - |
| 2. Tier Selection & UX | 0/2 | Not started | - |
| 3. PDF Export & History | 0/2 | Not started | - |
| 4. Free Credits & Onboarding | 0/3 | Not started | - |
| 5. Admin Analytics | 0/2 | Not started | - |
| 6. Production Deployment | 0/1 | Not started | - |

## Requirement Coverage

| ID | Requirement | Phase | Status |
|----|-------------|-------|--------|
| TIER-01 | Forensic Tier Backend — gpt-5 model configured and working | Phase 1 | Pending |
| TIER-02 | Tier Selection UI — Users can select Basic/Premium/Forensic before analysis | Phase 2 | Pending |
| TIER-03 | 3-tier analysis strategy (Basic/Premium/Forensic) | Phase 1 | Pending |
| UPLOAD-01 | Secure file upload with magic byte validation | Phase 1 | Pending |
| UPLOAD-02 | Upload progress indicator | Phase 2 | Pending |
| QUEUE-01 | BullMQ/Upstash queue for async processing | Phase 1 | Pending |
| PDF-01 | PDF Export — Export analysis results as formatted PDF | Phase 3 | Pending |
| HISTORY-01 | Searchable analysis history | Phase 3 | Pending |
| HISTORY-02 | Analysis history with filters | Phase 3 | Pending |
| CREDIT-01 | Free Credits System — 10 credits on signup | Phase 4 | Pending |
| CREDIT-02 | Monthly Free Analysis — 1 free Basic analysis per user per month | Phase 4 | Pending |
| DEMO-01 | Homepage Demo — Interactive element to show product value | Phase 4 | Pending |
| ADMIN-01 | Admin Conversion Tracking — Signup → purchase funnel | Phase 5 | Pending |
| ADMIN-02 | Admin Revenue Dashboard — Daily/weekly/monthly revenue | Phase 5 | Pending |
| ADMIN-03 | Admin Cost Analysis — Cost per analysis vs profit margin | Phase 5 | Pending |
| ADMIN-04 | Admin User Management — Add credits, suspend, view history | Phase 5 | Pending |
| DEPLOY-01 | Vercel Deployment — Verified production deployment | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Roadmap created: 2026-02-21*
*Based on PROJECT.md and research/SUMMARY.md*
