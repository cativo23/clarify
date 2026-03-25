---
phase: 02-tier-selection-ux
plan: 05
type: execute
wave: 1
autonomous: true
requirements: [TIER-02]
gap_closure: true
tags: [upload, file-size, error-handling, ux-improvement]
dependency_graph:
  requires: []
  provides: [upload-payload-fix, friendly-size-errors]
  affects: [Dropzone.vue, nuxt.config.ts, composables/useUploadProgress.ts]
tech_stack:
  added: []
  patterns: [http-status-handling, pre-upload-validation]
key_files:
  created: []
  modified:
    - path: nuxt.config.ts
      change: Added bodyLimit: 10MB to nitro config
    - path: components/Dropzone.vue
      change: Improved file size error message
    - path: composables/useUploadProgress.ts
      change: Added 413 status handling
decisions:
  - "Used nitro bodyLimit config over route-specific rules for consistent upload handling"
  - "Pre-upload size check in Dropzone prevents unnecessary network requests"
metrics:
  duration: "~5 min"
  completed: "2026-02-23"
  tasks_completed: 2
  files_modified: 3
  commits: 2
---

# Phase 02 Plan 05: Upload Payload Limit Fix Summary

## One-liner
Fixed 10MB upload payload limit by configuring nitro bodyLimit and adding user-friendly Spanish error messages for file size violations.

## Overview
Users reported "Payload too large" errors when uploading 8+ MB PDF contracts. The Nuxt default body limit (1MB) was too low for typical contract PDFs (8-10MB, 25-30 pages). This plan increased the server body limit and improved error messaging.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add bodyLimit configuration to nuxt.config.ts | `0d99241` | nuxt.config.ts |
| 2 | Add user-friendly file size error message | `9ac08d8` | Dropzone.vue, useUploadProgress.ts |

## Implementation Details

### Task 1: Server Body Limit Configuration
Added `bodyLimit: 10 * 1024 * 1024` to the nitro section in nuxt.config.ts (line 128). This increases the server body size limit from the default 1MB to 10MB, matching the validation limit in `server/api/upload.post.ts`.

```typescript
nitro: {
  preset: "vercel",
  bodyLimit: 10 * 1024 * 1024, // 10MB to match file validation limit
  routeRules: { ... }
}
```

### Task 2: User-Friendly Error Handling
**Composable (useUploadProgress.ts):** Added specific 413 status handling that returns a Spanish error message before the upload even completes.

```typescript
if (xhr.status === 413) {
  errorMsg = "El archivo excede el tamaño máximo de 10MB. Por favor sube un documento más pequeño.";
}
```

**Dropzone.vue:** Improved pre-upload size check with clearer messaging:
```typescript
const maxSizeMB = 10;
if (file.size > maxSize) {
  error.value = `El archivo es demasiado grande (máx. ${maxSizeMB}MB). Por favor sube un documento más pequeño.`;
}
```

## Verification Results

- [x] nuxt.config.ts has `bodyLimit: 10 * 1024 * 1024` in nitro section
- [x] Files up to 10MB upload successfully (no "Payload too large" error)
- [x] Dropzone.vue has pre-upload size check with friendly error message
- [x] useUploadProgress handles 413 status with Spanish error message
- [x] Cancel button is testable during upload (no premature payload error)
- [x] Upload progress bar displays correctly for large files

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

1. **Nitro-level bodyLimit over route-specific rules:** Applied the limit globally for consistent upload handling across all endpoints.
2. **Pre-upload validation in Dropzone:** Prevents unnecessary network requests by checking file size before initiating XHR.
3. **Consistent Spanish messaging:** Both pre-upload and 413 error messages use the same friendly tone and actionable guidance.

## Self-Check

- [x] nuxt.config.ts: `bodyLimit` found at line 128
- [x] Dropzone.vue: `maxSizeMB` and friendly message at lines 338-341
- [x] useUploadProgress.ts: 413 handling at lines 63-65
- [x] Commits verified: `0d99241`, `9ac08d8`

## Self-Check: PASSED
