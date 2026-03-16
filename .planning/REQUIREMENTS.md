# Requirements: Clarify

**Defined:** 2026-02-21
**Updated:** 2026-02-22 — Added Stripe and Forensic Prompt requirements
**Core Value:** Democratizing legal advice by making contract analysis accessible and affordable for non-lawyers.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Analysis Tiers

- [x] **TIER-01**: Forensic Tier Backend — gpt-5 model configured and working
- [x] **TIER-02**: Tier Selection UI — Users can select Basic/Premium/Forensic before analysis
- [x] **TIER-03**: 3-tier analysis strategy with clear credit costs (1/3/10 credits)

### Prompt Management

- [x] **PROMPT-01**: Forensic Analysis Prompt — Dedicated prompt for exhaustive 100% coverage analysis (different from Premium)

### Upload & Queue

- [x] **UPLOAD-01**: Secure file upload with magic byte validation (not just extension)
- [x] **UPLOAD-02**: Upload progress indicator showing percentage during file transfer
- [x] **QUEUE-01**: BullMQ/Upstash queue for async processing of long-running analyses

### PDF & History

- [x] **PDF-01**: PDF Export — Export analysis results as formatted PDF report
- [x] **HISTORY-01**: Searchable analysis history with full-text search
- [x] **HISTORY-02**: Analysis history with filters (date range, tier, risk level)

### Stripe & Payments

- [x] **STRIPE-01**: Stripe Configuration — Price IDs, webhook secret, checkout flow working
- [x] **STRIPE-02**: Credit Purchase Flow — Users can buy credit packages (5/$4.99, 10/$8.99, 25/$19.99)
- [x] **STRIPE-03**: Webhook Handling — Atomic credit increment on successful payment via PostgreSQL RPC

### Credits & Onboarding

- [x] **CREDIT-01**: Free Credits System — 10 credits on signup
- [x] **CREDIT-02**: Monthly Free Analysis — 1 free Basic analysis per user per month
- [x] **DEMO-01**: Homepage Demo — Interactive element to show product value

### Admin

- [x] **ADMIN-01**: Admin Conversion Tracking — Signup → purchase funnel visualization (4-stage funnel: Signups → Email Verified → First Analysis → First Purchase)
- [x] **ADMIN-02**: Admin Revenue Dashboard — Daily/weekly/monthly/quarterly revenue charts with gross/net comparison and package breakdown
- [x] **ADMIN-03**: Admin Cost Analysis — Cost per analysis vs profit margin
- [x] **ADMIN-04**: Admin User Management — Add credits, suspend users, view history

### Deployment

- [ ] **DEPLOY-01**: Vercel Deployment — Verified production deployment with all environments configured

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **SUBS-01**: Subscription billing — Recurring monthly plans
- **COLLAB-01**: Real-time collaboration — Share analyses with team members
- **PLAYBOOK-01**: Custom playbooks — User-defined rules for contract review
- **WORD-ADDIN-01**: Word add-in integration — Analyze directly in Microsoft Word
- **MULTILANG-01**: Multi-language support — Non-English contract analysis

### Integrations

- **ESIGN-01**: eSignature integration — Sign contracts after analysis
- **MOBILE-01**: Native mobile apps — iOS/Android applications

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full CLM (Contract Lifecycle Management) | Deliberately not building; focus on pre-signature analysis only |
| Team collaboration features | Adds org model complexity; SMB focus first |
| Mobile apps (native) | Web-first validated; native costs 3x |
| Subscription billing | Credit-based first; subscriptions can be added later |
| Multi-language support | English-only for MVP; international after PMF |
| Real-time collaboration | Individual user focus for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TIER-01 | Phase 1 | ✅ Complete |
| TIER-02 | Phase 2 | ✅ Complete |
| TIER-03 | Phase 1 | ✅ Complete |
| PROMPT-01 | Phase 1 | ✅ Complete |
| UPLOAD-01 | Phase 1 | ✅ Complete |
| UPLOAD-02 | Phase 2 | ✅ Complete |
| QUEUE-01 | Phase 1 | ✅ Complete |
| PDF-01 | Phase 3 | ✅ Complete |
| HISTORY-01 | Phase 3 | ✅ Complete |
| HISTORY-02 | Phase 3 | ✅ Complete |
| STRIPE-01 | Phase 4 | ✅ Complete |
| STRIPE-02 | Phase 4 | ✅ Complete |
| STRIPE-03 | Phase 4 | ✅ Complete |
| CREDIT-01 | Phase 5 | ✅ Complete |
| CREDIT-02 | Phase 5 | ✅ Complete |
| DEMO-01 | Phase 5 | ✅ Complete |
| ADMIN-01 | Phase 6 Plan 01 | ✅ Complete |
| ADMIN-02 | Phase 6 Plan 01 | ✅ Complete |
| ADMIN-03 | Phase 6 Plan 02 | ✅ Complete |
| ADMIN-04 | Phase 6 Plan 02 | ✅ Complete |
| DEPLOY-01 | Phase 7 | ⏳ Pending |

**Coverage:**
- v1.1 requirements: 5 total (ADMIN-01/02/03/04, DEPLOY-01)
- Complete: 4 (ADMIN-01/02/03/04)
- Pending: 1 (DEPLOY-01)

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-03-15 — v1.0 MVP complete (17/20), v1.1 Admin & Deploy in progress*
