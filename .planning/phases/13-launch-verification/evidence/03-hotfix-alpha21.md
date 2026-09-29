# Hotfix Release v1.0.0-alpha.21

**Date:** 2026-09-29
**Trigger:** After v1.0.0-alpha.20's first production deploy, Carlos reported the dark mode toggle
broken plus console errors: two CSP `script-src` violations and
`Uncaught TypeError: Cannot read properties of undefined (reading 'app')`.

## Root cause

`nuxt.config.ts`'s custom `security.headers.contentSecurityPolicy["script-src"]` override (added to
allow Stripe/Cloudflare domains) omitted the literal placeholder string `'nonce-{{nonce}}'` that
`nuxt-security`'s `50-updateCsp.js` Nitro plugin looks for verbatim to substitute the real per-request
nonce into the response CSP header. Confirmed live: the header's `script-src` carried zero
`'nonce-*'` sources across repeated requests to `https://clarify.cativo.dev/`, while the HTML's own
`nonce="..."` attribute on every `<script>` tag correctly rotated per request — proving the
substitution never ran. Every inline script, including Nuxt's own `__NUXT_DATA__` hydration payload,
was blocked by the browser, breaking client-side hydration (and with it, any client-only reactivity
such as the dark mode toggle).

## Fix

PR #48 (`fix/csp-nonce-script-src` → `develop`): added `"'nonce-{{nonce}}'"` back into the `script-src`
array in `nuxt.config.ts`.

## This release

Same-day hotfix following v1.0.0-alpha.20's tracer deploy. Repeats the same GitFlow release process
(D-02) verified working in plan 13-03.
