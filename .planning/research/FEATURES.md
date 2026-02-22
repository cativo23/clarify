# Feature Landscape

**Domain:** Legal Tech / Contract Analysis SaaS
**Researched:** 2026-02-21
**Confidence:** HIGH

## Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Secure user authentication | Legal documents are confidential; users expect enterprise-grade security | MEDIUM | Supabase Auth with RLS is standard; SOC 2 compliance expected for enterprise |
| PDF/document upload | Core functionality—users must be able to upload contracts for analysis | LOW | Must support PDF + Word formats; magic byte validation required for security |
| AI-powered risk flagging | "AI contract review" means automatic identification of risky clauses | MEDIUM | Red/green light indicators; must flag non-standard terms, missing clauses |
| Contract summarization | Users want quick understanding of long documents without reading entirely | MEDIUM | Executive summary with key terms extracted (parties, dates, obligations) |
| Clause extraction | Users expect to find specific clauses quickly (termination, liability, renewal) | MEDIUM | NLP-based extraction; must handle varied language, not just keyword matching |
| Searchable contract repository | Users accumulate contracts and need to find them later | MEDIUM | Full-text search + metadata filtering; essential for repeat users |
| Basic security (encryption, access controls) | Legal documents contain sensitive business information | MEDIUM | Encryption at rest + in transit; role-based permissions minimum |
| Export/download results | Users need to share analysis with colleagues or save for records | LOW | PDF export is standard expectation; some expect Word redlines |
| Clear pricing structure | Credit-based or per-user pricing must be transparent upfront | LOW | Hidden pricing = mistrust; credit systems common for AI products |
| Responsive UI (mobile-friendly) | Professionals review contracts anywhere—airports, meetings, home | MEDIUM | Not full CLM complexity, but must work on tablet/phone for review |

## Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable for positioning.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Tiered AI analysis (Basic/Premium/Forensic)** | Users can balance cost vs. depth; competitors typically offer one-tier analysis | MEDIUM | gpt-4o-mini, gpt-5-mini, gpt-5 strategy; unique for SMB market |
| **Microsoft Word add-in integration** | Lawyers work in Word; browser-only tools create friction | HIGH | Requires deep Word API integration; Definely/Spellbook win here |
| **Custom playbooks** | Companies have specific risk tolerances; generic AI misses their standards | HIGH | Requires rule engine + training data; LegalOn has 50+ pre-built |
| **Free tier (10 credits + 1 free analysis/month)** | Removes barrier to trial; users can validate before paying | LOW | Credit system already built; differentiator vs. paid trials |
| **PDF export with branded reports** | Users want shareable, professional-looking analysis outputs | LOW-MEDIUM | pdfkit already in stack; polish matters for enterprise users |
| **Obligation tracking + renewal reminders** | Post-signature value—contracts don't end at execution | HIGH | Requires calendar integration + notification system |
| **Counterparty benchmarking** | "Is this clause market-standard?"—answers negotiation questions | HIGH | Requires proprietary dataset; Litera Kira, Gavel Exec lead here |
| **Plain language translation** | Core brand promise—"democratizing legal advice" | MEDIUM | Side-by-side legalese/plain English; differentiates for SMB users |
| **Integration with eSignature (DocuSign, etc.)** | Review → sign workflow continuity | MEDIUM | API integrations required; expected by commercial teams |
| **Team collaboration features** | Multiple stakeholders review same contract | MEDIUM | Comments, annotations, approval workflows |

## Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full Contract Lifecycle Management (CLM)** | Users ask for "end-to-end" contract management | Requires years of development; enterprise sales cycles; crowded market (Ironclad, Icertis, etc.) | Focus on pre-signature analysis only; integrate with CLMs instead |
| **Real-time collaboration** | Users want Google Docs-style simultaneous editing | Technical complexity (WebSockets, conflict resolution); not core value prop | Async review + comments; good enough for target market |
| **Multi-language support** | International users request non-English contracts | AI accuracy varies by language; legal terminology is jurisdiction-specific | English-only for MVP; add languages after PMF |
| **Subscription billing** | Users prefer predictable monthly pricing | Locks into recurring revenue model before validating unit economics | Credit-based model first; subscriptions can be added later |
| **Mobile app (native iOS/Android)** | Users want "contract review on the go" | 3x development cost; web-first approach sufficient for MVP | Responsive web app; native apps after validation |
| **AI that negotiates automatically** | "Can't AI just fix the contract for me?" | Liability risk; requires deep understanding of business context | AI suggests redlines; human approves (human-in-the-loop) |
| **On-premise deployment** | Enterprise security teams request self-hosted | Breaks SaaS model; support nightmare; conflicts with Vercel deployment | Cloud security certs (SOC 2) instead; VPC peering if needed |
| **Custom AI model training per customer** | "Train it on OUR contracts specifically" | Requires ML infrastructure; long onboarding; defeats LLM economics | Pre-built playbooks + prompt customization instead |
| **Litigation support features** | Law firms want discovery, case management | Completely different product category; dilutes focus | Stay focused on transactional/contract review only |
| **Blockchain smart contracts** | "Future-proof" feature request | No market demand yet; regulatory uncertainty | Monitor trend; build when standards emerge |

## Feature Dependencies

```
Contract Upload
    └──requires──> User Authentication
                        └──requires──> Database Schema (users, organizations)

AI Analysis (Basic/Premium/Forensic)
    └──requires──> Document Upload
    └──requires──> Credit System
                        └──requires──> Stripe Integration
                        └──requires──> Atomic Credit Deduction (RPC)

PDF Export
    └──requires──> Analysis Results
    └──requires──> Template System

Custom Playbooks
    └──requires──> AI Analysis
    └──requires──> Rule Engine
    └──enhances──> Risk Flagging Accuracy

Obligation Tracking
    └──requires──> Clause Extraction
    └──requires──> Notification System
    └──enhances──> Renewal Management

Team Collaboration
    └──requires──> User Authentication
    └──requires──> Organization/Team Model
    └──enhances──> Contract Review Workflow

Word Add-in Integration
    └──requires──> API Endpoints
    └──requires──> OAuth/Auth Integration
    └──conflicts──> Browser-Only Architecture

Free Credits (10 on signup)
    └──requires──> Credit System
    └──enhances──> User Acquisition

Monthly Free Analysis
    └──requires──> Credit System
    └──requires──> Usage Tracking
    └──enhances──> User Retention
```

### Dependency Notes

- **Credit System is foundational:** Free credits, tiered analysis, and Stripe integration all depend on atomic credit tracking. This must be built early.
- **Authentication gates everything:** RLS policies, organization membership, and access controls must be in place before any document handling.
- **AI Analysis requires uploaded documents:** Document storage (Supabase Storage) + magic byte validation must precede AI features.
- **Word Add-in conflicts with browser-only:** If pursuing Word integration, architecture must support API-first design (not browser-only UI).
- **Free credits drive acquisition but require fraud prevention:** Need abuse detection (email verification, rate limiting) before launching free tier.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **User Authentication (Supabase)** — Required for any document handling; RLS ensures security
- [ ] **Document Upload (PDF/Word)** — Core functionality; magic byte validation for security
- [ ] **AI Analysis — Basic + Premium tiers** — gpt-4o-mini + gpt-5-mini; validates 3-tier model hypothesis
- [ ] **Credit System + Stripe** — Atomic RPC for credit deduction; monetization validation
- [ ] **Risk Flagging + Summarization** — Core AI value prop; must work reliably
- [ ] **Free Credits (10 on signup)** — User acquisition; removes trial barrier
- [ ] **Basic Dashboard** — View analysis history, credit balance, upload new contracts

### Add After Validation (v1.x)

Features to add once product-market fit signals are clear.

- [ ] **Forensic Tier (gpt-5)** — Add when users request higher-accuracy analysis
- [ ] **PDF Export** — When users ask to share results with colleagues
- [ ] **Monthly Free Analysis** — Retention feature; add when churn data shows drop-off
- [ ] **Plain Language Translation** — Brand differentiator; add for marketing/positioning
- [ ] **Obligation Tracking** — When users request post-signature value
- [ ] **Admin Analytics** — Conversion tracking, revenue dashboards (currently exists but charts broken)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Custom Playbooks** — Requires rule engine; enterprise feature
- [ ] **Word Add-in Integration** — High complexity; requires dedicated dev time
- [ ] **Team Collaboration** — Adds org model complexity; SMB focus first
- [ ] **eSignature Integration** — Nice-to-have; not core to analysis value
- [ ] **Counterparty Benchmarking** — Requires proprietary dataset; competitive moat but expensive
- [ ] **Mobile Apps (Native)** — Web-first validated; native apps cost 3x
- [ ] **Multi-language Support** — English-only until international demand proven

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User Authentication | HIGH | LOW | P1 |
| Document Upload | HIGH | LOW | P1 |
| AI Risk Flagging | HIGH | MEDIUM | P1 |
| Credit System | HIGH | MEDIUM | P1 |
| Basic + Premium Tiers | HIGH | MEDIUM | P1 |
| Free Credits (10 signup) | MEDIUM | LOW | P1 |
| Dashboard/History | MEDIUM | LOW | P1 |
| PDF Export | MEDIUM | LOW | P2 |
| Forensic Tier | MEDIUM | LOW | P2 |
| Monthly Free Analysis | MEDIUM | LOW | P2 |
| Plain Language Translation | MEDIUM | MEDIUM | P2 |
| Admin Analytics | LOW | LOW | P2 |
| Obligation Tracking | MEDIUM | HIGH | P3 |
| Custom Playbooks | HIGH | HIGH | P3 |
| Word Add-in | HIGH | HIGH | P3 |
| Team Collaboration | MEDIUM | MEDIUM | P3 |
| eSignature Integration | LOW | MEDIUM | P3 |
| Mobile Apps | LOW | HIGH | P3 |
| Full CLM | MEDIUM | VERY HIGH | P4 (Anti-feature) |
| Subscription Billing | MEDIUM | MEDIUM | P4 (Defer) |

**Priority key:**
- P1: Must have for launch (MVP)
- P2: Should have, add when possible (v1.x)
- P3: Nice to have, future consideration (v2+)
- P4: Deliberately deferred or anti-feature

## Competitor Feature Analysis

| Feature | goHeather | LegalOn | Definely | Signeasy AI | Our Approach |
|---------|-----------|---------|----------|-------------|--------------|
| **Word Add-in** | Yes | Yes | Yes (native) | No | P3 (future) |
| **AI Tiers** | No | No | No | No | **Yes (3 tiers)** |
| **Credit-based Pricing** | No | No | No | No | **Yes (key differentiator)** |
| **Free Tier** | Limited trial | No | No | No | **Yes (10 credits + 1/month)** |
| **Custom Playbooks** | Yes | 50+ pre-built | Yes | No | P3 (future) |
| **PDF Export** | No | Yes | Yes | Yes | P2 (add post-launch) |
| **eSignature** | No | No | No | Yes (bundled) | Anti-feature (integrate instead) |
| **Full CLM** | No | No | No | Yes | **Anti-feature (focus on analysis)** |
| **Plain Language** | No | No | No | No | **P2 (brand differentiator)** |
| **Pricing Model** | $99/mo flat | Enterprise | Enterprise | $20/user/mo | **Credits ($5-20 one-time)** |

### Key Insights from Competitor Analysis

1. **Credit-based pricing is unique:** All competitors use subscription (per-user or flat monthly). Credit model appeals to low-volume users (SMB, freelancers).
2. **Word integration is table stakes for enterprise:** Definely, LegalOn, goHeather all offer Word add-ins. This is a gap for SMB-focused products.
3. **Free tiers are rare:** Most offer paid trials only. Free credits remove friction for trial.
4. **Plain language translation is missing:** No competitor emphasizes "legalese to plain English" as core value prop.
5. **Enterprise pricing is opaque:** All enterprise tools require "contact sales." Transparent pricing is a differentiator for SMB market.
6. **CLM bundling is common:** Signeasy, Ironclad, Icertis bundle eSignature + CLM. We differentiate by focusing on analysis only.

## Sources

- [10 Best AI Contract Review Tools for 2026 (goHeather)](https://www.goheather.io/post/the-9-best-ai-contract-review-tools-for-2026)
- [6 Best AI Contract Review Software Tools (Definely)](https://www.definely.com/blogs/ai-contract-review-software)
- [10 Best AI Contract Review Software for 2026 (Signeasy)](https://signeasy.com/blog/business/ai-contract-review-software)
- [Buyer's guide: AI for legal contract review (Thomson Reuters)](https://legal.thomsonreuters.com/blog/buyers-guide-artificial-intelligence-in-contract-review-software/)
- [20 Essential Contract Management Software Features (Leah/ContractPodAi)](https://leahai.com/blog/essential-contract-management-software-features)
- [Gartner Contract Life Cycle Management Reviews](https://www.gartner.com/reviews/market/contract-life-cycle-management)
- [Contract Lifecycle Management Software: What to Look for in 2026 (monday.com)](https://monday.com/blog/crm-and-sales/contract-lifecycle-management-software/)

---
*Feature research for: Legal Tech / Contract Analysis SaaS*
*Researched: 2026-02-21*
