# Phase 5: Free Credits & Onboarding - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement user onboarding system that provides free credits and demo functionality to encourage trial while preventing abuse. Specifically: new users receive 10 credits automatically on signup (after email verification), users get 1 free Basic analysis per month regardless of credit balance, and homepage has interactive demo showing product value.

</domain>

<decisions>
## Implementation Decisions

### Free Credits Logic
- New users receive 10 free credits immediately after email verification (not on initial signup)
- Email verification only is sufficient for security (no additional verification methods needed)
- Claude will decide on expiration policy for unused free credits
- Trust users approach for abuse prevention (no checking for previous free credit usage)

### Monthly Free Analysis
- Claude will decide the reset schedule (calendar month vs. signup anniversary)
- Claude will decide notification method when monthly free analysis becomes available
- Claude will decide accumulation policy (whether unused analyses carry over)
- Free analysis applies to Basic tier only (cannot be applied to Premium or Forensic)
- Claude will decide where to display UI indicators when monthly free analysis is available

### Interactive Demo
- Claude will decide the type of demo to implement (simulation vs. sample results)
- Claude will decide whether account creation is required to access demo
- Claude will decide the interaction level (predefined examples vs. user uploads)
- Claude will decide the call-to-action after demo interaction
- Claude will decide the scope of the demo (full process vs. partial view)
- Claude will decide which document types the demo supports
- Sessions are one-time interactions (demo resets each visit)
- Claude will decide whether to include explanations of analysis sections

### Onboarding Flow
- Claude will suggest focusing on guiding users through their first analysis
- Claude will decide the format (guided tour vs. informational overlay)
- Onboarding occurs immediately after signup
- Claude will decide whether to include information about monthly free analysis during onboarding

### Claude's Discretion
- Expiration policy for unused free credits
- Reset timing for monthly free analysis (calendar vs. anniversary)
- Notification method for monthly free analysis availability
- Accumulation policy for unused monthly analyses
- Tier restriction implementation details
- UI indicator placement for available free analysis
- Demo type and implementation approach
- Demo access requirements
- Demo interaction level
- Call-to-action after demo completion
- Demo scope and content
- Supported document types for demo
- Whether to include analysis explanations in demo
- Onboarding flow format
- Whether to include monthly free analysis info in onboarding

</decisions>

<specifics>
## Specific Ideas

- The monthly free Basic analysis is a separate benefit from the 10 signup credits
- Demo should be a one-time interaction that resets on each visit
- Focus on security by requiring email verification before awarding free credits
- Trust users approach for preventing abuse rather than complex verification systems

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---
*Phase: 05-free-credits-onboarding*
*Context gathered: 2026-03-03*