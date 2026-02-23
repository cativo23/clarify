# Phase 2: Tier Selection & UX - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

UI/UX improvements for tier selection and progress visibility. Users can choose between Basic/Premium/Forensic tiers with clear differentiation, see upload progress, and track analysis status. Upload and analysis backend already works (Phase 1) — this phase makes it visible and understandable to users.

**In scope:**
- Tier selector UI with clear differentiation
- Upload progress indicator (percentage + steps)
- Analysis status polling and display
- Tier education (comparison modal, recommendations)
- Token limit display with explanations

**Out of scope:**
- PDF export (Phase 3)
- Credit purchase flow (Phase 4)
- New analysis features or backend changes

</domain>

<decisions>
## Implementation Decisions

### Tier Display
- Medium information density on cards: name, credit cost, 2-3 key features, one-liner description
- Premium tier has subtle "Recomendado" badge (not prominent highlight)
- Comparison table lives below the cards for detailed feature comparison
- Cards use expand-on-click interaction to reveal more details
- Claude's discretion: exact layout, spacing, and visual design for best UX

### Upload Progress
- Display both percentage progress bar and step indicators
- Inline placement within dropzone component for contextual feedback
- Simple 3-step flow: "Uploading" → "Validating" → "Complete"
- Auto-advance to tier selector and analysis form after upload completes
- Claude's discretion: cancel button behavior and exact progress bar styling

### Analysis Progress Display
- Detailed 5-state status: Pending → Queued → Analyzing → Finalizing → Complete
- Fully async experience: users can navigate away, analysis continues in background
- Analysis appears in history list with real-time status updates
- Claude's discretion: polling frequency (recommend 5 seconds) and exact status component design

### Tier Education
- Recommendation engine runs after upload based on file size/complexity
- Comparison modal includes both feature matrix (checkmarks) AND use cases ("Best for...")
- Token limits shown prominently with tooltips explaining what tokens mean for non-technical users
- Modal triggered by "Which tier is right for me?" button/link near tier selector
- Claude's discretion: insufficient credits handling (recommend disable + "Comprar créditos" CTA)

### Claude's Discretion
- Exact color scheme, typography, and spacing for tier cards
- Progress bar animation style and easing
- Modal animation (slide-in, fade-in, scale)
- Exact tooltip content for token explanation
- Error state styling (upload failures, analysis failures)
- Mobile responsive breakpoints and behavior

</decisions>

<specifics>
## Specific Ideas

- "Progress should feel like Google Drive upload — clear percentage + simple steps"
- "Token explanation should be like 'Think of tokens as ~4 characters each — 8K tokens ≈ 2-3 pages'"
- Tier comparison should help users understand speed vs accuracy tradeoffs
- Premium badge should be subtle, not pushy

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-tier-selection-ux*
*Context gathered: 2026-02-22*
