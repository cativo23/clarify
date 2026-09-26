---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-09-26T03:21:37.659Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 12 | unrun-verify | components/RiskCard.vue |  | Task 2 human-check (long-quote collapsed-card readability) not run: requires uploading a real contract and waiting for a completed Premium/Forensic analysis in the browser, which the executor cannot judge visually headlessly. UI-SPEC line-clamp-3 backstop is on standby if it reads poorly. | open |  | 2026-09-26T03:21:37.659Z |  |

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
  }
]
````
