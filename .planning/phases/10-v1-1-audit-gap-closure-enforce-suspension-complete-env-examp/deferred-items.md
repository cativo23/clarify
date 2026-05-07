# Deferred Items — Phase 10

Pre-existing typecheck errors observed during 10-01 execution (NOT introduced by this plan, NOT fixed per scope boundary rule):

- components/demo/InteractiveDemo.vue: TS18047/TS6133/TS2304 (4 errors)
- server/api/admin/funnel.get.ts: TS6133/TS7006 (3 errors) — relevant to plan 10-03
- server/api/admin/revenue.get.ts: TS2322/TS2532 (3 errors) — relevant to plan 10-04
- server/api/demo/simulate.post.ts: TS2339/TS7006 (2 errors)
- server/api/health.get.ts: TS2322/TS2367/TS2353 (5 errors)

Recommendation: triage with phase planner; plan 10-03 and 10-04 may resolve admin/* entries naturally.
