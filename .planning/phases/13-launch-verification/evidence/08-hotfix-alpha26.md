# Hotfix Release v1.0.0-alpha.26

**Date:** 2026-09-30
**Trigger:** Plan 13-06's LAUNCH-04 verification — two consecutive Forensic-tier analysis
submissions both failed with "Request timed out" from OpenAI.

## Root cause

Worker log timestamps for the second attempt:
```
20:23:57.305 — request sent (gpt-6-astra, 120k input / 30k output limits)
20:39:00.813 — "Error analyzing contract with OpenAI: Request timed out."
```
~15 minutes elapsed, despite `server/utils/openai-client.ts` configuring a 10-minute timeout for
the forensic tier. The OpenAI Node SDK defaults to `maxRetries: 2` — on a timeout, it retries, and
each retry re-waits the full configured timeout, turning what looks like a single 10-minute ceiling
into a multi-attempt sequence that can run well past it before the final error surfaces.

## Fix

PR #63 (`fix/openai-forensic-retry-timeout` → `develop`):
- `maxRetries: 0` on the OpenAI client — a single, expensive, non-idempotent generation call gets
  no benefit from automatic retries, and they were the actual cause of the multiplied wait.
- Forensic timeout raised 10 → 12 minutes (a request this large may legitimately need more headroom
  even on one clean attempt).
- BullMQ queue/worker job timeouts raised 650s → 780s (13 min) to stay safely above the new
  12-minute OpenAI timeout.

**Verified locally before shipping:** built the image with the fix; full end-to-end behavior
(does a Forensic analysis now complete) verified after deploy — see the continuation of
`evidence/05-launch-04.md`.

## This release

Sixth hotfix stemming from live LAUNCH-verification testing today, following the same GitFlow
process verified in plan 13-03 and repeated for v1.0.0-alpha.21 through v1.0.0-alpha.25.
