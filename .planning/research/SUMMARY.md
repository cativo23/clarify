# Project Research Summary

**Project:** Clarify - AI Contract Analysis Micro-SaaS
**Domain:** Legal Tech / Contract Analysis SaaS
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

Clarify is an AI-powered contract auditing platform that analyzes legal documents and produces risk assessments using a 3-tier model strategy (gpt-4o-mini, gpt-5-mini, gpt-5). Research validates that the current stack—Nuxt 3, Supabase, OpenAI, BullMQ/Upstash, and Stripe—is highly aligned with 2025 best practices for serverless legal tech micro-SaaS. The credit-based pricing model is a key differentiator in a market dominated by subscription competitors.

The recommended approach emphasizes async-first architecture (BullMQ workers on persistent infrastructure, not Vercel serverless), strict Row-Level Security for tenant isolation, and atomic PostgreSQL RPCs for all credit operations. Critical risks center on AI hallucinations, liability exposure, and infrastructure misconfiguration—mitigated through in-product disclaimers, confidence scoring, jurisdiction-aware prompts, and proper worker deployment.

Key risks requiring immediate attention: (1) AI hallucinations could destroy user trust or create liability—address via disclaimers and verification workflows; (2) RLS misconfiguration would cause catastrophic data breach—test policies explicitly before any user data storage; (3) BullMQ workers on Vercel serverless will timeout—deploy to Railway/Render; (4) Credit pricing may have negative unit economics—build cost tracking before free credits launch.

## Key Findings

### Recommended Stack

Research validates the existing technology choices as industry-standard for 2025 legal tech micro-SaaS. The stack is production-ready with minor enhancements recommended.

**Core technologies:**
- **Nuxt 3.15.x**: Full-stack Vue framework with SSR, API routes, TypeScript-first—validated optimal for Vercel deployment
- **Supabase**: PostgreSQL BaaS with Auth + Storage + RLS—the default for micro-SaaS; RLS is critical for legal document isolation
- **OpenAI API (gpt-4o-mini, gpt-5-mini, gpt-5)**: 3-tier strategy validated as best practice; verified pricing January 2026: $0.15/$1.50/$15 per 1M input tokens
- **BullMQ 5.67.x + Upstash Redis**: Essential for async analysis (Vercel 60s timeout < contract analysis time); workers must run on persistent infrastructure (Railway/Render), not Vercel Functions
- **Stripe 17.5.x**: Industry standard; webhook signature verification is mandatory
- **Zod 3.x**: 2025 standard for runtime validation + TypeScript inference; use `z.infer<Type>` to avoid duplication
- **Tailwind CSS 3.4.x**: Migration to v4 recommended for new projects; current v3 is fine for MVP
- **pdf-parse + pdfkit**: PDF text extraction and server-side report generation

**Critical architecture decisions validated:**
1. Async job queue (BullMQ) - Vercel serverless timeout (60s) cannot handle 2-5 minute gpt-5 analyses
2. Row Level Security (RLS) - Legal documents require strict tenant isolation; test with `supabase test`
3. Atomic credit operations - PostgreSQL RPC prevents race conditions in credit deduction
4. Magic byte validation - File upload is #1 attack vector; verify header bytes, not just extension

### Expected Features

**Must have (table stakes):**
- Secure user authentication with Supabase Auth + RLS—users expect enterprise-grade security for legal documents
- PDF/Word document upload with magic byte validation—core functionality; security-critical
- AI-powered risk flagging with red/green indicators—automatic identification of risky clauses
- Contract summarization with key terms extracted—executive summary for quick understanding
- Searchable contract repository—full-text search + metadata filtering for repeat users
- Export/download results (PDF)—users need to share analysis with colleagues
- Credit system with Stripe integration—monetization validation; atomic RPC required
- Free credits (10 on signup)—removes barrier to trial; key differentiator vs. paid trials
- Basic dashboard—view analysis history, credit balance, upload new contracts

**Should have (competitive differentiators):**
- Tiered AI analysis (Basic/Premium/Forensic)—unique for SMB market; competitors offer one-tier only
- PDF export with branded reports—polish matters for enterprise users
- Plain language translation—core brand promise ("democratizing legal advice")
- Monthly free analysis—retention feature; add when churn data shows drop-off
- Obligation tracking + renewal reminders—post-signature value
- Admin analytics—conversion tracking, revenue dashboards

**Defer (v2+):**
- Full CLM—deliberately not building; focus on pre-signature analysis only
- Custom playbooks—requires rule engine; enterprise feature
- Word add-in integration—high complexity; requires dedicated dev time
- Team collaboration—adds org model complexity; SMB focus first
- eSignature integration—nice-to-have; not core to analysis value
- Mobile apps (native)—web-first validated; native costs 3x
- Subscription billing—credit-based first; subscriptions can be added later
- Multi-language support—English-only for MVP; international after PMF

### Architecture Approach

The architecture follows a serverless-first pattern with async job queue for long-running AI analysis. Four distinct layers: Presentation (Nuxt 3 Vue components), API (server routes with Zod validation), Worker (BullMQ on persistent infrastructure), and Data (Supabase PostgreSQL + Storage + Upstash Redis).

**Major components:**
1. **Nuxt 3 Frontend**—UI rendering, file upload via Dropzone, tier selection UI, dashboard; communicates via HTTP/JSON to API endpoints
2. **Server Routes** (`/api/upload`, `/api/analyze`, `/api/stripe`)—request validation with Zod, business logic, error handling; uses server utils for cross-cutting concerns
3. **BullMQ Worker**—async job processing (fetch from storage, call OpenAI, update DB); must run on Railway/Render, not Vercel serverless
4. **Supabase PostgreSQL**—persistent data with RLS policies on every table; RPC functions for atomic credit operations
5. **Supabase Storage**—S3-compatible document storage with signed URLs; not Vercel Blob (no RLS integration)
6. **Upstash Redis**—HTTP-based queue management (avoids TCP connection issues in serverless); free tier: 10K commands/day

**Key architectural patterns:**
- **Async Job Queue Pattern**: Enqueue job → return analysisId immediately → frontend polls for completion
- **3-Tier Model Strategy**: gpt-4o-mini (1 credit), gpt-5-mini (3 credits), gpt-5 (10 credits)
- **Atomic Credit Transaction Pattern**: PostgreSQL RPC for check-and-deduct (prevents race conditions)
- **Defense-in-Depth Security**: Client validation → API validation → magic bytes → SSRF protection → RLS

### Critical Pitfalls

1. **AI Hallucinations in Legal Analysis**—Fabricated case citations or incorrect interpretations destroy user trust. Mitigate with prominent "Not Legal Advice" disclaimers on every results page, confidence scores for each output, human review for Forensic tier, and audit logs of all AI outputs. Address in Phase 1.

2. **Inadequate Disclaimer and Liability Protection**—Users treating AI analysis as binding legal advice creates lawsuit exposure. Mitigate with explicit in-product disclaimers (not just in ToS), checkbox acknowledgment before showing results, E&O insurance covering AI content, and careful language ("analysis" not "review/approval"). Address in Phase 1.

3. **Weak Tenant Data Isolation (RLS Failures)**—One user's contracts visible to another is catastrophic for legal tech. Mitigate by enabling RLS on EVERY table (verify with `SELECT * FROM pg_policies`), testing policies explicitly (attempt cross-tenant access), never exposing service role key to client code, and integration tests verifying tenant isolation. Address in Phase 1.

4. **AI Cost Mismanagement (Token Economics)**—Credit pricing not reflecting actual API costs leads to negative unit economics. Mitigate with token usage tracking per analysis from day one, cost monitoring dashboard (credits consumed vs. API costs), 3-5x markup over worst-case API costs, and per-analysis token limits. Address in Phase 2.

5. **Serverless Queue Limitations (BullMQ on Vercel)**—Vercel serverless has 60s max timeout; contract analysis takes 2-5 minutes. Mitigate by deploying BullMQ workers to Railway/Render (persistent containers), using Upstash HTTP API (not TCP Redis), implementing job status webhooks, and dead letter queue for failed jobs. Address in Phase 1.

6. **Jurisdiction-Agnostic AI Analysis**—AI assuming US law for non-US contracts produces incorrect analysis. Mitigate with jurisdiction selector before analysis, prompts explicitly referencing selected jurisdiction, AI identification of governing law clause, and disclaimer specifying assumed jurisdiction. Address in Phase 2.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Core Foundation (Authentication + Upload + Analysis Backend)
**Rationale:** Authentication gates everything; RLS policies must be in place before any user data is stored; async queue infrastructure is critical before any analysis functionality. These are prerequisites for all other features.
**Delivers:** Working user authentication with Supabase Auth + RLS, secure document upload with magic byte validation, async analysis pipeline (BullMQ workers on Railway/Render), basic analysis results display.
**Addresses:** User authentication, document upload, AI risk flagging, contract summarization, clause extraction, searchable repository (basic).
**Avoids:** RLS policy missing (test with `supabase test`), BullMQ on Vercel serverless (deploy to Railway/Render), AI hallucinations without disclaimers (add in-product warnings), inadequate liability protection (legal review before launch).
**Uses:** Supabase Auth, Supabase Storage, BullMQ + Upstash Redis, OpenAI API (gpt-4o-mini + gpt-5-mini), Zod validation, pdf-parse.
**Implements:** Async Job Queue Pattern, Defense-in-Depth Security, Row Level Security on all tables.

### Phase 2: Monetization & Credit System (Stripe + Tier Selection)
**Rationale:** Credit system is foundational for free credits, tiered analysis, and Stripe integration; must use atomic RPC to prevent race conditions. Cost tracking must be built before free credits launch to avoid negative unit economics.
**Delivers:** Credit system with atomic PostgreSQL RPC, Stripe integration (Checkout + webhook handling), tier selection UI (Basic/Premium/Forensic), cost monitoring dashboard, jurisdiction selector in upload flow.
**Addresses:** Credit system + Stripe integration, free credits (10 on signup), tiered AI analysis (3 tiers), basic dashboard with credit balance.
**Avoids:** AI cost mismanagement (track token usage before free credits launch), race conditions in credit deduction (always use RPC), jurisdiction-agnostic analysis (add jurisdiction selector), webhook signature bypass (verify Stripe signatures).
**Uses:** Stripe 17.5.x, PostgreSQL RPC functions, Zod inference for types, OpenAI tier configuration.
**Implements:** Atomic Credit Transaction Pattern, 3-Tier Model Strategy.

### Phase 3: Polish & Export (PDF Reports + History + UX)
**Rationale:** PDF export is expected by users for sharing results; analysis history is essential for repeat users. These features improve perceived quality and usability but don't block core value delivery.
**Delivers:** PDF export with branded reports, searchable analysis history with filters, upload progress indicators, document preview before analysis, automatic credit refunds on failed analysis.
**Addresses:** Export/download results, analysis history, upload progress indicator, document preview, credit balance visibility.
**Avoids:** Silent analysis failures (refund credits automatically), no upload progress (show percentage bar), unexportable results (add PDF export), large PDF storage bloat (cache generated PDFs in Supabase Storage).
**Uses:** pdfkit for server-side PDF generation, Supabase Storage for cached PDFs, chart.js for admin analytics.
**Implements:** PDF caching pattern, eager loading for dashboard queries.

### Phase 4: Free Credits & User Acquisition (Homepage Demo + Onboarding)
**Rationale:** Free credits drive user acquisition but require fraud prevention (email verification, rate limiting) and cost tracking. Add after core analysis pipeline is stable and unit economics are understood.
**Delivers:** Homepage with interactive demo, free credits system (10 on signup + 1 free analysis/month), email verification for fraud prevention, onboarding flow optimization.
**Addresses:** Free credits for user acquisition, monthly free analysis for retention, onboarding friction reduction.
**Avoids:** Onboarding friction (measure time from signup to first analysis), free credits abuse (email verification + rate limiting), unclear tier naming (use "Basic (1 credit, fast scan)" format).
**Uses:** Supabase Auth email verification, Redis rate limiting, usage tracking.

### Phase 5: Admin & Analytics (Compliance + Operations)
**Rationale:** Admin features require service role key access (bypassing RLS); must be carefully isolated from user-facing code. Compliance features (audit logs, AI Act transparency) are needed for enterprise customers but not MVP.
**Delivers:** Admin dashboard (revenue, user analytics, conversion tracking), admin user management (credit adjustment, suspensions), audit log for admin actions, EU AI Act compliance documentation.
**Addresses:** Admin analytics, compliance readiness, operational visibility.
**Avoids:** Service role key exposure (only in server routes), no audit log for admin actions (log to immutable table), EU AI Act non-compliance (transparency documentation).
**Uses:** Admin-specific database views, immutable audit logging, chart.js for dashboards.
**Implements:** Admin data flow with aggregated/anonymized views.

### Phase 6: Future Enhancements (v2+ Features)
**Rationale:** Defer complex features until product-market fit is validated. These features are valuable but not essential for MVP validation.
**Delivers:** Custom playbooks (rule engine), Word add-in integration, team collaboration features, eSignature integration, plain language translation.
**Addresses:** Enterprise differentiation, workflow integration, collaboration.
**Avoids:** Full CLM scope creep (focus on pre-signature analysis only), native mobile app cost (web-first), multi-language complexity (English-only for MVP).

### Phase Ordering Rationale

- **Phase 1 first because:** Authentication and RLS are prerequisites for any user data storage; async queue infrastructure must be correct before any analysis functionality. Getting RLS wrong causes catastrophic data breach; getting queue wrong causes silent failures.
- **Phase 2 second because:** Credit system is foundational for monetization and free credits; atomic RPC must be in place before any credit operations. Cost tracking must exist before free credits launch to avoid negative unit economics.
- **Phase 3 third because:** PDF export and history improve perceived quality but don't block core value. These are "table stakes" features users expect but can be added after validating core analysis works.
- **Phase 4 fourth because:** Free credits drive acquisition but require fraud prevention and cost tracking to be in place first. Add after unit economics are understood.
- **Phase 5 fifth because:** Admin features require careful isolation (service role key); compliance features are needed for enterprise but not MVP validation.
- **Phase 6 last because:** These are differentiation features, not MVP requirements. Defer until product-market fit signals are clear.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 1:** BullMQ worker deployment infrastructure—research Railway vs. Render vs. Upstash QStash for optimal cost/reliability; SSRF protection implementation patterns for storage URL validation.
- **Phase 2:** EU AI Act compliance requirements—research transparency obligations for "high-risk" AI systems; legal counsel review for AI liability protection in Terms of Service.
- **Phase 5:** SOC 2 compliance infrastructure—research audit logging requirements, access control patterns, vendor assessment documentation.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Supabase Auth integration, RLS policy setup, Zod validation—well-documented with official docs.
- **Phase 2:** Stripe Checkout + webhook handling—extensive official documentation and community examples.
- **Phase 3:** PDF generation with pdfkit, analysis history queries—established patterns.
- **Phase 4:** Email verification, rate limiting—standard Supabase/Redis patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified with official documentation (Nuxt, Supabase, OpenAI, BullMQ, Stripe, Zod) and 2025 sources. Current project stack is validated as industry-aligned. |
| Features | HIGH | Competitor analysis from multiple 2025 sources (goHeather, Definely, Signeasy, Thomson Reuters); feature prioritization based on established legal tech patterns. |
| Architecture | HIGH | Patterns verified with official docs (Nuxt server routes, BullMQ, Supabase RLS); architecture diagram aligns with serverless best practices. |
| Pitfalls | HIGH | Verified via multiple sources (legal tech post-mortems, OWASP, EU AI Act, OpenAI pricing docs, RLS security research). Specific warnings from AI liability cases. |

**Overall confidence:** HIGH

### Gaps to Address

- **Worker deployment cost modeling:** Research didn't quantify Railway vs. Render vs. Upstash QStash pricing for 1k/10k/100k analyses per month. Address during Phase 1 planning with actual usage estimates.
- **Token usage baseline:** No empirical data on actual token consumption per analysis tier (1-page NDA vs. 100-page MSA). Address in Phase 2 by logging first 100 analyses before free credits launch.
- **Legal review scope:** Research flags need for AI liability counsel but doesn't specify cost or timeline. Address before Phase 1 launch—budget $5-10K for specialized AI attorney review.
- **Jurisdiction coverage:** Research recommends jurisdiction selector but doesn't specify which jurisdictions to support initially. Address in Phase 2—start with US (all 50 states) + Canada (common law provinces), expand based on user demand.
- **EU AI Act classification:** Research mentions EU AI Act but doesn't definitively classify whether contract analysis qualifies as "high-risk." Address in Phase 5—legal review required before EU launch.

## Sources

### Primary (HIGH confidence)
- **OpenAI API Pricing** — https://platform.openai.com/docs/pricing (verified January 2026) — gpt-4o-mini, gpt-5-mini, gpt-5 pricing
- **Supabase Documentation** — https://supabase.com/docs — RLS policies, Storage, Auth patterns
- **Nuxt 3 Documentation** — https://nuxt.com/docs — v3.15 features, Vercel deployment
- **Tailwind CSS v4** — https://tailwindcss.com/docs — v4 migration guide, CSS-first configuration
- **Zod Documentation** — https://zod.dev — TypeScript inference, safeParse patterns
- **BullMQ Documentation** — https://docs.bullmq.io — v5 features, Redis requirements
- **Upstash Redis** — https://upstash.com/docs — Vercel integration, pricing
- **Vercel Functions** — https://vercel.com/docs/functions — timeout limits, fluid compute
- **Stripe Webhooks** — https://stripe.com/docs/webhooks — signature verification
- **OWASP File Upload Security** — https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html — magic byte validation

### Secondary (MEDIUM confidence)
- **goHeather / Definely / Signeasy competitor analysis** — 2025 AI contract review tool comparisons — feature landscape
- **Thomson Reuters "GenAI hallucinations are still pervasive"** — AI hallucination risks in legal filings
- **Clio "AI Hallucinations: a Costly Mistake for Lawyers"** — case study on lawyer sanctions for fake citations
- **ZeroThreat.ai "Understanding Data Breach Risks in Multi-Tenant SaaS Apps"** — RLS failure modes
- **EU AI Act Official Text** — high-risk AI system requirements, transparency obligations
- **American Bar Association "Top Six AI Legal Issues and Concerns For Legal Practitioners"** — liability, privacy, bias risks

### Tertiary (LOW confidence)
- **Legal tech post-mortems from failed startups (2023-2025 cohort)** — unnamed sources, needs validation
- **Gartner Contract Life Cycle Management Reviews** — enterprise feature expectations (paywalled, inferred from summaries)

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
