---
status: partial
phase: 07-production-deployment
source: [07-VERIFICATION.md]
started: 2026-03-24T22:30:00Z
updated: 2026-03-24T22:30:00Z
---

# Phase 07: Human Verification Checklist

**Purpose:** Manual verification items for production deployment

## Current Test

Awaiting human testing on production environment

## Tests

### 1. Production URL Accessibility

**Test:** Access `https://clarify.cativo.dev` in browser or via curl

**Expected:** Returns 200 OK with valid SSL certificate from Let's Encrypt

**Result:** [pending]

---

### 2. Health Endpoint Accuracy

**Test:** `curl https://clarify.cativo.dev/api/health`

**Expected:** Returns `{"status":"ok","services":{"redis":"connected","database":"unknown","ai":"active"},"timestamp":"..."}`

**Result:** [pending]

---

### 3. Worker Job Processing

**Test:** Upload a test PDF via the UI, monitor job status

**Expected:** Job transitions: pending → processing → completed within 2 minutes (Basic tier)

**Result:** [pending]

---

### 4. Traefik HTTPS Enforcement

**Test:** `curl -v http://clarify.cativo.dev`

**Expected:** 301 redirect to HTTPS, valid TLS certificate

**Result:** [pending]

---

### 5. Container Health Status

**Test:** `docker compose -f docker-compose.prod.yml ps`

**Expected:** All containers (app, worker, redis) show "healthy" status

**Result:** [pending]

---

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

None — all code-level artifacts verified and deployment-ready
