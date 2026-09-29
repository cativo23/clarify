# Hotfix Release v1.0.0-alpha.25

**Date:** 2026-09-29
**Trigger:** Plan 13-04's LAUNCH-01 verification, retried after v1.0.0-alpha.24's BullMQ
queue-prefix fix let a job finally reach production's own worker — which then failed with
"System configuration error" every time.

## Root cause

Worker log:
```
CRITICAL: Failed to load prompt from /app/server/prompts/v2/basic-analysis-prompt.txt
```

`server/utils/openai-client.ts` reads system prompts from `server/prompts/{version}/{file}.txt`
via `fs.readFile` at runtime, resolved from `process.cwd()` (`/app` in the runner container) —
per CLAUDE.md's own convention ("Prompt Management: Do not hardcode prompts in TS; use
`server/prompts/`"). Since these are plain text data files, not statically imported by any code
path, Nitro's build never bundles them into `.output`. The Dockerfile's production runner stage
only ever copied `.output` and `package.json` — nothing under `/app/server` at all — so this path
never existed in any image built from this Dockerfile, going back to before this phase started.

## Fix

PR #60 (`fix/missing-server-prompts-in-image` → `develop`): copy `server/prompts` from the
builder stage into the runner stage at the same relative path the code expects.

**Verified locally before shipping:** built the image with the fix and confirmed
`/app/server/prompts/v2/*.txt` exist and are readable inside the container.

## This release

Fifth same-day hotfix, following the same GitFlow process verified in plan 13-03 and repeated for
v1.0.0-alpha.21 through v1.0.0-alpha.24.
