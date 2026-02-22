# Phase 1: Core Analysis Foundation - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete 3-tier analysis backend (Basic/Premium/Forensic) with secure file upload, async queue processing, and dedicated Forensic prompt. This phase delivers the core analysis pipeline end-to-end.

**In scope:**
- Forensic tier prompt and gpt-5 model configuration
- Magic byte file validation
- BullMQ queue for async processing (2-5 min analyses)
- User sees uploaded document in analysis history

**Out of scope:**
- Tier selection UI (Phase 2)
- Upload progress indicator (Phase 2)
- PDF export (Phase 3)
</domain>

<decisions>
## Implementation Decisions

### Forensic Prompt Design
- **Coverage:** 100% clause coverage required (vs Premium's 95%)
- **Detection:** Everything extra — omissions, inconsistencies, cross-clause analysis must be included
- **Output detail:** Claude's discretion — optimize for value vs token cost (target 15k-40k tokens)
- **Long contracts:** Claude's discretion — use optimal chunking strategy when exceeding context window
- **Use case:** Both high-value contracts ($10k+, multi-year, IP-critical) AND power users who want maximum detail

### Analysis Feedback UX
- **Processing state:** Claude's discretion — implement best UX for async 2-5 minute analyses
- **Navigation:** Fully async — users can navigate away, analysis continues in background
- **Notification:** Notify user when analysis complete (in-app notification, email optional)
- **Result page:** Clear verdict (Firmar/Negociar/Rechazar) + risk score (Alto/Medio/Bajo) with emphasis on verdict — similar to current UI but more prominent verdict
- **Findings order:** Display by severity — rojas first, then amarillas, verdes, grises

### Tier Configuration
- **Token limits:** Claude's discretion — optimize based on model capabilities (current defaults: Basic 8k/2.5k, Premium 35k/10k, Forensic 120k/30k)
- **Exceeds limits:** Keep current behavior — suggest higher tier, but if user proceeds, analysis completes with tier limitations (truncated/partial analysis)
- **Token visibility:** Show detailed token usage with tooltips explaining what tokens mean for non-technical users
- **Cost optimization:** Claude's discretion — use smart chunking, minimize API calls, cache when appropriate

### Claude's Discretion
- Exact progress indicator design during async processing
- Specific chunking algorithm for long contracts
- Token limit optimization per model
- Cost optimization strategies for Forensic tier
- Error state handling during queue processing
- Notification delivery mechanism (in-app vs email)

</decisions>

<specifics>
## Specific Ideas

- "Current UI shows verdict and risk score well — just add more emphasis on the verdict"
- Users should be able to navigate away during analysis and come back later
- Token usage should be visible but explained via tooltips for non-technical users
- Forensic tier is for both high-stakes contracts and users who want exhaustive detail

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-core-analysis-foundation*
*Context gathered: 2026-02-22*
