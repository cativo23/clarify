# Hotfix Release v1.0.0-alpha.23

**Date:** 2026-09-29
**Trigger:** Plan 13-04's LAUNCH-01 end-to-end verification — the first real analysis submitted
against production since the initial deploy failed immediately with `status: failed`,
`error_message: "Failed to extract text from PDF"`.

## Root cause

Worker log:
```
Error parsing PDF: Error: Setting up fake worker failed: "Cannot find module
'/app/.output/server/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs' imported from
/app/.output/server/node_modules/pdfjs-dist/legacy/build/pdf.mjs".
```

Same root cause class as the `@napi-rs/canvas`/DOMMatrix fix shipped in v1.0.0-alpha.20 (plan
13-01): `pdfjs-dist` resolves its worker script by a runtime path rather than a static
import/require, so Nitro's `node-file-trace` never follows it and silently drops it from
`.output`. This is unconditional — every single PDF analysis (Basic, Premium, Forensic) fails on
any deploy of this image, not just the QA test case.

## Fix

PR #54 (`fix/pdfjs-worker-missing-from-trace` → `develop`): copy the complete `pdfjs-dist` package
from the Docker build's `deps` stage into the runtime image, replacing the tracer's partial copy
wholesale, rather than cherry-picking individual missing files as they keep surfacing.

**Verified locally before shipping:** built the image with the fix and ran `pdf-parse`'s actual
`PDFParse().getText()` against `tests/contracts/pdf/contrato-bajo-riesgo.pdf` inside the container —
extracted 8969 characters (previously threw `MODULE_NOT_FOUND` / fake-worker-setup failure).

## This release

Third same-day hotfix, following the same GitFlow process verified in plan 13-03 and repeated for
v1.0.0-alpha.21 and v1.0.0-alpha.22.
