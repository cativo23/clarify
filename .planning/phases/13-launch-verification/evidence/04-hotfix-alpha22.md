# Hotfix Release v1.0.0-alpha.22

**Date:** 2026-09-29
**Trigger:** Carlos hit a dead-click bug trying to sign up a QA account for plan 13-04 —
the header's "Iniciar Sesión" link (and the two homepage login CTAs) did nothing on click,
roughly half the time, with a second click usually succeeding.

## Root cause

All three `/login` `NuxtLink`s sit inside a `v-if`/`v-else` pair keyed on `useSupabaseUser()`'s
`user` ref (guest nav vs. authenticated nav in `AppHeader.vue`; guest CTA vs. dashboard CTA in
`pages/index.vue`). A brief SSR/client mismatch in that value — the Supabase session check
resolves asynchronously on the client, while SSR resolves it synchronously — makes Vue detect a
hydration mismatch on the nav subtree and discard + remount it after initial hydration. Until that
remount lands, the server-rendered anchor is visually present but carries no Vue Router click
binding. Confirmed live: a document-level click listener showed some clicks on the link producing
*zero* DOM events anywhere, while `router.push('/login')` called directly always worked — isolating
the bug to click-binding timing, not routing itself.

## Fix

PR #51 (`fix/login-link-hydration-race` → `develop`): marked the three `/login` `NuxtLink`s
`external`, so Nuxt renders them as plain anchors outside Vue Router's client-side interception —
always clickable regardless of hydration state.

## This release

Second same-day hotfix, following the same GitFlow process verified in plan 13-03 and repeated for
v1.0.0-alpha.21.
