# Phase 13-02: Production Pre-flight Evidence

**Date:** 2026-09-28
**Purpose:** Confirm the production host and GitHub repo are ready to accept the first-ever deploy of Clarify (RESEARCH P1-P3, P6). No production secret values appear anywhere in this file — only names, dates, and fingerprints.

---

## Task 1: Pre-flight facts and server scaffolding

### 1. DNS resolution

```bash
$ getent hosts clarify.cativo.dev
167.235.52.161  clarify.cativo.dev

$ getent hosts cativo.dev
167.235.52.161  cativo.dev
```

**Result:** PASS — both hostnames resolve to `167.235.52.161`. `cativo.dev` matches, so `SSH_HOST` will be set to `cativo.dev` (not the literal IP) in Task 3.

### 2. Port reachability (from this machine, 8s timeout via `/dev/tcp`)

```bash
$ timeout 8 bash -c 'echo > /dev/tcp/cativo.dev/52222' && echo OPEN || echo CLOSED/TIMEOUT
PORT_52222: OPEN

$ timeout 8 bash -c 'echo > /dev/tcp/cativo.dev/22' && echo OPEN || echo CLOSED/TIMEOUT
PORT_22: CLOSED/TIMEOUT
```

**Result:** PASS — port 52222 is open, port 22 is closed/times out, confirming RESEARCH P6. All SSH/SCP commands in this plan and in GitHub secrets must use port 52222.

### 3. Server-side checks (read-only, over `ssh -p 52222 cativo23@cativo.dev`)

**Traefik container running:**
```bash
$ docker ps --filter name=^traefik$
CONTAINER ID   IMAGE             COMMAND                  CREATED      STATUS                PORTS                                                                          NAMES
8a1d2eb807bc   traefik:v3.6.25   "/entrypoint.sh trae…"   3 days ago   Up 3 days (healthy)   0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp   traefik
```
**Result:** PASS — traefik container is up and healthy.

**External network exists:**
```bash
$ docker network inspect space-server_web --format "{{.Name}}: {{.Driver}} scope={{.Scope}}"
space-server_web: bridge scope=local
```
**Result:** PASS — `space-server_web` network exists.

**Traefik entrypoint/resolver names (only these two lines printed, nothing else from the file):**
```bash
$ grep -E 'websecure:|letsencryptresolver:' /home/cativo23/space-server/traefik/traefik.yml
  websecure:
  letsencryptresolver:
```
**Result:** PASS — both `websecure` entrypoint and `letsencryptresolver` cert resolver names exist, matching what `docker-compose.prod.yml`'s Traefik labels will need to reference.

**No clarify containers exist yet:**
```bash
$ docker ps -a --filter name=clarify
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```
**Result:** PASS (empty, as expected) — confirms this is genuinely the first-ever deploy, consistent with RESEARCH's "Critical Finding."

**Free disk space:**
```bash
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        75G   49G   24G  68% /
```
**Result:** PASS — 24G available, comfortably enough for the Clarify image + volumes.

### 4. Deploy directory and env template

```bash
$ ssh -p 52222 cativo23@cativo.dev 'mkdir -p /home/cativo23/deploy/clarify-deploy && chmod 700 /home/cativo23/deploy/clarify-deploy && stat -c "%a %n" /home/cativo23/deploy/clarify-deploy'
700 /home/cativo23/deploy/clarify-deploy

$ scp -P 52222 .env.example cativo23@cativo.dev:/home/cativo23/deploy/clarify-deploy/.env.example
(no output, exit 0)

$ ssh -p 52222 cativo23@cativo.dev 'chmod 644 /home/cativo23/deploy/clarify-deploy/.env.example && stat -c "%a %n %s bytes" /home/cativo23/deploy/clarify-deploy/.env.example'
644 /home/cativo23/deploy/clarify-deploy/.env.example 3232 bytes
```

**Result:** PASS — `/home/cativo23/deploy/clarify-deploy` created with mode 700; `.env.example` copied in at mode 644 (3232 bytes, matches repo's template — this is the only env-shaped file the agent wrote, and it contains no secret values, only placeholder text). This is the only file the agent placed in the deploy directory.

### 5. Material for Carlos's key check (names/dates/fingerprints only — no values, no key contents)

**GitHub secrets on `cativo23/clarify` (names + last-updated dates):**
```bash
$ gh secret list -R cativo23/clarify
DOCKER_PASSWORD   2026-03-25T05:17:42Z
DOCKER_USERNAME   2026-03-25T05:17:54Z
RELEASE_PAT       2026-04-23T05:12:04Z
SSH_PRIVATE_KEY   2026-03-25T05:20:23Z
SSH_USERNAME      2026-03-25T05:20:34Z
```
**Result:** As RESEARCH predicted — `SSH_HOST` and `SSH_PORT` are missing (closed in Task 3, after Carlos's confirmation in Task 2). All 5 existing secrets are present.

**Authorized keys on the server (fingerprints + comments only, no key material):**
```bash
$ ssh -p 52222 cativo23@cativo.dev 'ssh-keygen -lf ~/.ssh/authorized_keys'
256 SHA256:zWDYWxO+yVNXaKURkeJ8w8+6SEx7tZEmauTjMZVFse4 cativo23.kt@gmail.com (ED25519)
256 SHA256:OzrCxFB6muPeUKbqQNIKxEJLgxqRIV9edNSfOoagTHw nova-id-cd-deploy@github-actions (ED25519)
256 SHA256:uCUM2aN7exfDanQSJNaTcv5EYjUUCsjAPXcxmZGvIk8 tcg-vault-deploy-ci (ED25519)
```
**Result:** No `clarify`-named key is present among the three authorized keys (personal key, `nova-id-cd-deploy`, `tcg-vault-deploy-ci`). Carlos must confirm in Task 2 whether the current `SSH_PRIVATE_KEY` GitHub secret corresponds to one of these three (most likely the personal `cativo23.kt@gmail.com` key, matching the pattern used for the portfolio repo per D-03), or re-set it from his own machine.

---

## Task 3: Deploy secrets and server env readiness (appended after Carlos's "done" in Task 2)

Carlos completed Task 2 directly: filled `.env` on the server, updated Supabase Auth URL Configuration, and coordinated the SSH deploy key rotation with the orchestrator (fresh dedicated ed25519 keypair generated, public key installed in the server's `authorized_keys`, connectivity verified, `SSH_PRIVATE_KEY` rotated). `SSH_USERNAME` was already correct and did not need changes.

**Note on secret values (not agent-set, reported by Carlos, recorded for traceability only):** production `.env` was seeded from local dev values against the same Supabase project used for dev (a separate DB reset is planned as a later, independent step); Stripe keys are test-mode since Stripe has never been exercised in prod. Per the coordinator this is intentional and not a blocker for this plan — LAUNCH-01 verification (plan 13-0X) will need to account for test-mode Stripe if payment flows are checked there.

### 1/2. `SSH_HOST` and `SSH_PORT` GitHub secrets

Both were set by the orchestrator during the Task 2 key rotation (not by this executor in a separate step, since the key rotation and host/port secrets were handled together):

```bash
$ gh secret list -R cativo23/clarify
DOCKER_PASSWORD   2026-03-25T05:17:42Z
DOCKER_USERNAME   2026-03-25T05:17:54Z
RELEASE_PAT       2026-04-23T05:12:04Z
SSH_HOST          2026-09-28T21:44:23Z
SSH_PORT          2026-09-28T21:44:24Z
SSH_PRIVATE_KEY   2026-09-28T21:44:22Z
SSH_USERNAME      2026-03-25T05:20:34Z
```

**Result:** PASS — `SSH_HOST=cativo.dev` (matches the DNS resolution confirmed in Task 1, no IP fallback needed) and `SSH_PORT=52222` are now set. `SSH_PRIVATE_KEY` shows an update timestamp of `2026-09-28T21:44:22Z`, confirming it was re-set today as part of the key rotation — not the original, unverified key.

### 3. Secret completeness check

```bash
$ gh secret list -R cativo23/clarify --json name --jq '. | length'
7
```

**Result:** PASS — exactly 7 secrets exist: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `RELEASE_PAT`, `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME`, `SSH_PRIVATE_KEY` — every secret name read by `.github/workflows/ci-cd.yml` and `auto-release.yml`.

### 4. Server env file check (metadata only — file contents never read, printed, or transmitted by the agent)

```bash
$ ssh -p 52222 cativo23@cativo.dev 'find /home/cativo23/deploy/clarify-deploy -maxdepth 1 -type f -perm 600 -size +0c -printf "%m %f %s bytes\n"'
600 .env 1542 bytes
```

**Result:** PASS — exactly one non-empty, mode-600 file (`.env`, 1542 bytes) exists in the deploy directory. The mode-644 `.env.example` template from Task 1 correctly does not match this filter (only `.env` does), confirming Carlos created the real file as instructed.

### Summary

All deploy prerequisites (RESEARCH P1, P2, P3, P6) are now resolved:

| Gap | Status |
|-----|--------|
| P1 — `SSH_HOST` secret | Resolved — `cativo.dev` |
| P2 — `SSH_PORT` secret | Resolved — `52222` |
| P3 — deploy dir + `.env` on server | Resolved — mode 700 dir, mode 600 non-empty `.env` |
| P6 — SSH command needs `-p 52222` | Resolved — confirmed and used throughout this plan |

No secret value was ever printed, read, or transmitted by the agent in either task. The SSH private key material was generated and installed by the orchestrator directly with the server and GitHub, never passing through this executor's transcript.
