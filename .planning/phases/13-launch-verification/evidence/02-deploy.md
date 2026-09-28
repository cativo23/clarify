# Phase 13-03: Release Cut and First Production Deploy Evidence

**Date:** 2026-09-28
**Purpose:** Record the v1.0.0-alpha.20 GitFlow release cut (Task 1) and, after Carlos's go/no-go (Task 2), the first production deploy to polaris2 (Task 3).

---

## Task 1: Cut release/v1.0.0-alpha.20 and open both GitFlow PRs

### 1. Fetch and pre-flight checks

```bash
$ git fetch origin --tags --prune
(no new refs — already up to date)

$ gh release view v1.0.0-alpha.20 -R cativo23/clarify
release not found
```
**Result:** PASS — the v1.0.0-alpha.20 release does not exist yet.

### 2. develop / origin/develop state

At the time this plan executed, local `develop`, `origin/develop`, and this worktree's HEAD were already identical (`c527e057a0447639ead1cdee9d74e755db563bc2`) — the wave-1 executor merges (plans 13-01, 13-02) had already brought `develop` up to date with `origin/develop`, and both `23174ee` (Node 24 CI docker-action upgrade) and `fde524a` (LICENSE) were already ancestors of `develop`:

```bash
$ git rev-parse HEAD
c527e057a0447639ead1cdee9d74e755db563bc2
$ git rev-parse develop
c527e057a0447639ead1cdee9d74e755db563bc2
$ git rev-parse origin/develop
c527e057a0447639ead1cdee9d74e755db563bc2

$ git merge-base --is-ancestor 23174ee develop && echo ANCESTOR
ANCESTOR
$ git merge-base --is-ancestor fde524a develop && echo ANCESTOR
ANCESTOR
```

**Result:** PASS — no merge was needed (`develop` already had everything `origin/develop` has, and the Node 24 CI upgrade + LICENSE commits are already in `develop`'s history). This worktree's own branch (`worktree-agent-a7facd3e8e68c3e41`) was already forked from this exact commit, so `develop` could not be checked out directly inside this worktree (git refuses — it's checked out in the primary repository checkout). The release branch was created directly from this worktree's HEAD, which is byte-identical to `develop`.

### 3. Release branch cut

```bash
$ git checkout -b release/v1.0.0-alpha.20
Switched to a new branch 'release/v1.0.0-alpha.20'

$ git push -u origin release/v1.0.0-alpha.20
 * [new branch]      release/v1.0.0-alpha.20 -> release/v1.0.0-alpha.20
branch 'release/v1.0.0-alpha.20' set up to track 'origin/release/v1.0.0-alpha.20'.
```

**Release branch head SHA:** `c527e057a0447639ead1cdee9d74e755db563bc2` (before this evidence commit)

### 4. Pull requests

**PR to `main`:** [#46](https://github.com/cativo23/clarify/pull/46) — `release: v1.0.0-alpha.20`

```bash
$ gh pr view 46 --json number,url,mergeable,mergeStateStatus,baseRefName,headRefName
{"baseRefName":"main","headRefName":"release/v1.0.0-alpha.20","mergeStateStatus":"CLEAN","mergeable":"MERGEABLE","number":46,"url":"https://github.com/cativo23/clarify/pull/46"}
```
**Result:** PASS — CLEAN / MERGEABLE.

**PR to `develop`:** could not be opened at first attempt — GitHub rejected it with `No commits between develop and release/v1.0.0-alpha.20`, because the release branch was cut directly from `develop`'s exact HEAD with no new commits yet. Resolved by committing this evidence file on the release branch first (this commit), which gives the branches a diff, then opening the `develop` PR immediately after. See the "Resolution" subsection below for the PR URL/number and mergeable state, appended after that commit.

<!-- gsd:write-continue -->
