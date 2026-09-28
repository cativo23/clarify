# Phase 13: Launch Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-26
**Phase:** 13-launch-verification
**Areas discussed:** Verification execution method, Production access boundary, Gap handling policy, Evidence / sign-off artifact, Deploy scope (raised mid-discussion by user)

---

## Production access boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Direct access | SSH/curl access to clarify.cativo.dev for Claude to run checks itself | ✓ |
| You run, Claude reads output | User executes checks manually, pastes results back | |
| Mixed | Claude gets read-only access, user handles destructive/credentialed actions | |

**User's choice:** Direct access.
**Notes:** None.

---

## Verification execution method

| Option | Description | Selected |
|--------|-------------|----------|
| SSH + curl/docker CLI | Command-line checks for health, worker logs, PDF API | ✓ |
| SSH + browser-qa-agent for UI | Adds visual verification of Forensic UI | ✓ |
| api-integration-tester agent | Delegate endpoint checks to the specialized agent | ✓ |

**User's choice:** All three, combined (not mutually exclusive).
**Notes:** None.

---

## Deploy scope (raised mid-discussion)

**Context:** While discussing verification method, the user interjected: "but this hasn't been deployed" — Phase 11/12 code was not yet live on clarify.cativo.dev.

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 13 includes deploy | Add a deploy step (GitFlow release → CI/CD) before verification | ✓ |
| You deploy, then Claude verifies | Deployment handled separately/manually by user | |

**User's choice:** Phase 13 includes deploy.
**Notes:** This reframes Phase 13 from "verify what's live" to "ship v2.0, then verify it." Deploy mechanism is the existing GitFlow + GitHub Actions CI/CD pipeline documented in CLAUDE.md and DEPLOY.md — no new tooling needed.

---

## Gap handling policy

| Option | Description | Selected |
|--------|-------------|----------|
| Fix inline and re-verify | Any failed check gets fixed within this phase, then re-checked | ✓ |
| Document only | Failures become a new phase/todo instead of being fixed here | |

**User's choice:** Fix inline and re-verify.
**Notes:** None.

---

## Evidence / sign-off artifact

| Option | Description | Selected |
|--------|-------------|----------|
| Generated HTML evidence page | Per user's evidence-attachments convention — real data, rendered to PNG | ✓ |
| Plain VERIFICATION.md | Markdown checklist only | |

**User's choice:** Generated HTML evidence page.
**Notes:** None.

---

## Claude's Discretion

- Exact SSH command sequence / log-grep patterns for confirming worker job processing.
- Release version numbering (`v2.0.0-alpha.N`) — follow existing tag conventions.
- Layout/styling of the generated evidence HTML page.

## Deferred Ideas

None — discussion stayed within phase scope.
