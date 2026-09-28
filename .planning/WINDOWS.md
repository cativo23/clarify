---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 0
total_count: 3
last_updated: 2026-09-26T04:10:00.000Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 12 | unrun-verify | components/RiskCard.vue |  | Task 2 human-check (long-quote collapsed-card readability) not run: requires uploading a real contract and waiting for a completed Premium/Forensic analysis in the browser, which the executor cannot judge visually headlessly. UI-SPEC line-clamp-3 backstop is on standby if it reads poorly. | open |  | 2026-09-26T03:21:37.659Z |  |
| 2 | 12 | unrun-verify | components/analysis/ReportSidebar.vue |  | Task 2 human-check (sticky positioning, scroll offset under sticky header, responsive stack below 1024px) not run headlessly; needs a completed multi-category analysis viewed in-browser at 1024px+ and below | open |  | 2026-09-26T04:01:33.861Z |  |
| 3 | 12 | unrun-verify | components/analysis/RiskScorePanel.vue |  | Task 2 human-check (visual parity of score/pills/breakdown/coverage layout against the confirmed mockup at desktop and ~375px) not run: requires a completed post-Phase-11 analysis viewed in-browser at two widths, which the executor cannot judge visually headlessly | open |  | 2026-09-26T04:10:00.000Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "12",
    "file": "components/RiskCard.vue",
    "line": null,
    "description": "Task 2 human-check (long-quote collapsed-card readability) not run: requires uploading a real contract and waiting for a completed Premium/Forensic analysis in the browser, which the executor cannot judge visually headlessly. UI-SPEC line-clamp-3 backstop is on standby if it reads poorly.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-26T03:21:37.659Z",
    "resolved_at": null,
    "milestone": "v2.0"
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "12",
    "file": "components/analysis/ReportSidebar.vue",
    "line": null,
    "description": "Task 2 human-check (sticky positioning, scroll offset under sticky header, responsive stack below 1024px) not run headlessly; needs a completed multi-category analysis viewed in-browser at 1024px+ and below",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-26T04:01:33.861Z",
    "resolved_at": null,
    "milestone": "v2.0"
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "12",
    "file": "components/analysis/RiskScorePanel.vue",
    "line": null,
    "description": "Task 2 human-check (visual parity of score/pills/breakdown/coverage layout against the confirmed mockup at desktop and ~375px) not run: requires a completed post-Phase-11 analysis viewed in-browser at two widths, which the executor cannot judge visually headlessly",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-26T04:10:00.000Z",
    "resolved_at": null,
    "milestone": "v2.0"
  }
]
````
