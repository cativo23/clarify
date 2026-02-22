# Requirements: Clarify

**Defined:** 2026-02-21
**Core Value:** Democratizing legal advice by making contract analysis accessible and affordable for non-lawyers.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Analysis Tiers

- [ ] **TIER-01**: Forensic Tier Backend — gpt-5 model configured and working
- [ ] **TIER-02**: Tier Selection UI — Users can select Basic/Premium/Forensic before analysis
- [ ] **TIER-03**: 3-tier analysis strategy with clear credit costs (1/3/10 credits)

### Upload & Queue

- [ ] **UPLOAD-01**: Secure file upload with magic byte validation (not just extension)
- [ ] **UPLOAD-02**: Upload progress indicator showing percentage during file transfer
- [ ] **QUEUE-01**: BullMQ/Upstash queue for async processing of long-running analyses

### PDF & History

- [ ] **PDF-01**: PDF Export — Export analysis results as formatted PDF report
- [ ] **HISTORY-01**: Searchable analysis history with full-text search
- [ ] **HISTORY-02**: Analysis history with filters (date range, tier, risk level)

### Credits & Onboarding

- [ ] **CREDIT-01**: Free Credits System — 10 credits on signup
- [ ] **CREDIT-02**: Monthly Free Analysis — 1 free Basic analysis per user per month
- [ ] **DEMO-01**: Homepage Demo — Interactive element to show product value

### Admin

- [ ] **ADMIN-01**: Admin Conversion Tracking — Signup → purchase funnel visualization
- [ ] **ADMIN-02**: Admin Revenue Dashboard — Daily/weekly/monthly revenue charts
- [ ] **ADMIN-03**: Admin Cost Analysis — Cost per analysis vs profit margin
- [ ] **ADMIN-04**: Admin User Management — Add credits, suspend users, view history

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
| TIER-01 | Phase 1 | Pending |
| TIER-02 | Phase 2 | Pending |
| TIER-03 | Phase 1 | Pending |
| UPLOAD-01 | Phase 1 | Pending |
| UPLOAD-02 | Phase 2 | Pending |
| QUEUE-01 | Phase 1 | Pending |
| PDF-01 | Phase 3 | Pending |
| HISTORY-01 | Phase 3 | Pending |
| HISTORY-02 | Phase 3 | Pending |
| CREDIT-01 | Phase 4 | Pending |
| CREDIT-02 | Phase 4 | Pending |
| DEMO-01 | Phase 4 | Pending |
| ADMIN-01 | Phase 5 | Pending |
| ADMIN-02 | Phase 5 | Pending |
| ADMIN-03 | Phase 5 | Pending |
| ADMIN-04 | Phase 5 | Pending |
| DEPLOY-01 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 after roadmap creation*
