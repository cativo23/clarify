# Hotfix Release v1.0.0-alpha.24

**Date:** 2026-09-29
**Trigger:** Plan 13-04's LAUNCH-01 verification, retried after v1.0.0-alpha.23's PDF-extraction
fix — the resubmitted job still failed, this time with a generic "An unexpected error occurred"
message and, critically, **zero worker log lines** for the job on the production container.

## Root cause

Cross-checked BullMQ's own job history directly against Redis (Upstash) from inside the app
container:

```
completed job 4 analysisId= ed338c9f-... ts= 2026-09-29T18:19:10.219Z
completed job 3 analysisId= 8f1bea54-... ts= 2026-09-29T18:07:36.614Z
```

Both of this session's test jobs show as **completed** at the BullMQ level, with timestamps
matching exactly when they were submitted — proving a worker process did pick them up and run
them to completion (no exception escaped to mark them "failed" at the queue level). But
`clarify-worker-prod`'s own logs (checked via `docker logs` and the raw
`/var/lib/docker/containers/.../*-json.log` file directly) contain **zero** lines about either
job — not even the unconditional `[Worker] Started processing...` line that is always the very
first thing the processing function logs.

Found the actual consumer: a local dev Docker container (`clarify-app`, `nuxt dev --port 3001`,
running continuously for 3 days) shares the exact same Upstash Redis instance as production — the
server's `.env` was intentionally copied from Carlos's local dev `.env` during 13-02, including
`REDIS_HOST`/`REDIS_PORT`/`REDIS_TOKEN`. Local dev runs a single combined process (no
`DISABLE_WORKER`), so it also runs the BullMQ worker in-process, competing with production's
dedicated worker container for the same unprefixed `analysis-queue`. Whichever consumer's `BRPOPLPUSH`
wins claims the job; this time it was local dev, which presumably failed it for reasons specific to
that environment (not diagnosed further — out of scope once the collision itself was identified).

## Fix

PR #57 (`fix/bullmq-queue-prefix-per-environment` → `develop`): BullMQ's built-in `prefix` option
namespaces all of its Redis keys. Added a shared `queuePrefix` constant (`"prod"` in production,
`"dev"` everywhere else, keyed off `NODE_ENV`) used identically by both the `Queue`
(`server/utils/queue.ts`) and the `Worker` (`server/plugins/worker.ts`) — they still see each
other's jobs within the same environment, but no longer collide across environments.

## This release

Fourth same-day hotfix, following the same GitFlow process verified in plan 13-03 and repeated for
v1.0.0-alpha.21, v1.0.0-alpha.22, and v1.0.0-alpha.23.
