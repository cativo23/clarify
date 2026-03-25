# Phase 2: Tier Selection & UX - Research

**Researched:** 2026-02-22
**Domain:** Vue 3/Nuxt 3 UI components, file upload progress tracking, real-time status polling, tier comparison UX
**Confidence:** HIGH

## Summary

Phase 2 focuses on implementing user-facing UX improvements for tier selection, upload progress visualization, and analysis status tracking. The backend infrastructure (Phase 1) already handles file upload, validation, and async analysis via BullMQ queue. This phase makes the process visible and understandable to users.

The existing codebase already has partial implementations:
- `AnalysisSelector.vue` - Tier cards with credit validation
- `Dropzone.vue` - File upload with basic progress bar
- `dashboard.vue` - Uses Supabase Realtime for live analysis updates

This research identifies the libraries, patterns, and implementation strategies needed to enhance these components for a polished UX.

**Primary recommendation:** Leverage existing Supabase Realtime subscriptions for status updates, enhance Dropzone with axios/fetch progress events, and expand tier education with a comparison modal.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Medium information density on cards: name, credit cost, 2-3 key features, one-liner description
- Premium tier has subtle "Recomendado" badge (not prominent highlight)
- Comparison table lives below the cards for detailed feature comparison
- Cards use expand-on-click interaction to reveal more details
- Display both percentage progress bar and step indicators for upload
- Inline placement within dropzone component for contextual feedback
- Simple 3-step flow: "Uploading" → "Validating" → "Complete"
- Auto-advance to tier selector and analysis form after upload completes
- Detailed 5-state status: Pending → Queued → Analyzing → Finalizing → Complete
- Fully async experience: users can navigate away, analysis continues in background
- Analysis appears in history list with real-time status updates
- Recommendation engine runs after upload based on file size/complexity
- Comparison modal includes both feature matrix (checkmarks) AND use cases ("Best for...")
- Token limits shown prominently with tooltips explaining what tokens mean for non-technical users
- Modal triggered by "Which tier is right for me?" button/link near tier selector

### Claude's Discretion
- Exact color scheme, typography, and spacing for tier cards
- Progress bar animation style and easing
- Modal animation (slide-in, fade-in, scale)
- Exact tooltip content for token explanation
- Error state styling (upload failures, analysis failures)
- Mobile responsive breakpoints and behavior
- Polling frequency (recommend 5 seconds) and exact status component design
- Insufficient credits handling (recommend disable + "Comprar créditos" CTA)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TIER-02 | Tier Selection UI — Users can select Basic/Premium/Forensic before analysis | AnalysisSelector.vue already exists; needs comparison modal, tooltip education, expand-on-click details |
| UPLOAD-02 | Upload progress indicator showing percentage during file transfer | Dropzone.vue has basic progress; needs step indicators, better animation, cancellation |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | Built-in (Nuxt 3) | UI components with Composition API | Project standard |
| Nuxt 3 | ^4.3.1 | Framework with auto-imports, SSR | Project standard |
| Tailwind CSS | ^6.14.0 (@nuxtjs/tailwindcss) | Styling with glassmorphism support | Project standard |
| Supabase Client | ^2.0.4 (@nuxtjs/supabase) | Realtime subscriptions, auth | Project standard |
| Lucide Icons | ^0.575.0 (lucide-vue-next) | Icon library | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| native fetch/FormData | Browser API | File upload with progress events | Upload progress tracking |
| computed/watch | Vue 3 | Reactive state management | Credit validation, tier comparison |
| supabase.channel() | Supabase Realtime | Live status updates | Analysis status polling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Realtime | Polling API every 5s | Realtime is more efficient, less latency |
| Native fetch progress | axios | axios has built-in onUploadProgress but adds dependency |
| Tailwind animations | GSAP/FRMotion | Overkill for simple progress animations |

## Architecture Patterns

### Recommended Project Structure

```
components/
├── AnalysisSelector.vue       # Tier cards (existing - enhance)
├── TierComparisonModal.vue    # NEW: Detailed comparison modal
├── Dropzone.vue               # Upload with progress (existing - enhance)
├── UploadProgress.vue         # NEW: Step indicator component (optional)
├── AnalysisStatusBadge.vue    # NEW: Status display with polling
└── TokenTooltip.vue           # NEW: Token explanation tooltip

composables/
├── useAnalysisStatus.ts       # NEW: Status polling logic
├── useUploadProgress.ts       # NEW: Upload progress composable
└── useTierRecommendation.ts   # NEW: Tier suggestion logic

pages/
├── dashboard.vue              # Main upload/analysis flow (existing - enhance)
└── analyze/[id].vue           # Results page (existing)
```

### Pattern 1: File Upload with Progress Events

**What:** Track upload percentage using fetch with ReadableStream or XMLHttpRequest

**When to use:** Any file upload requiring user feedback

**Example:**
```typescript
// Source: Adapted from Nuxt 3 patterns
export const uploadFileWithProgress = async (
  file: File,
  onProgress: (percent: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  return new Promise<{ success: boolean; file_url: string }>((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject(new Error(xhr.statusText));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
};
```

### Pattern 2: Supabase Realtime Subscription for Status Updates

**What:** Listen to database changes via Supabase Realtime channels

**When to use:** Real-time status updates without polling overhead

**Example (already in use in dashboard.vue):**
```typescript
// Source: /home/cativo23/projects/personal/clarify/pages/dashboard.vue
let realtimeChannel: RealtimeChannel | null = null;

const setupRealtimeSubscription = () => {
  if (realtimeChannel || !currentUserId.value) return;

  realtimeChannel = supabase
    .channel("analyses-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "analyses",
        filter: `user_id=eq.${currentUserId.value}`,
      },
      async (payload) => {
        const updatedAnalysis = payload.new as Analysis;
        // Update UI with new status
        analyses.value[index] = { ...analyses.value[index], ...updatedAnalysis };
      }
    )
    .subscribe();
};
```

### Pattern 3: Expandable Card with v-model

**What:** Card that expands on click to show more details

**When to use:** Tier selection with progressive disclosure

**Example:**
```vue
<template>
  <div
    :class="[
      'rounded-3xl border-2 transition-all duration-300 cursor-pointer',
      isExpanded ? 'ring-4 ring-secondary/10' : 'hover:border-secondary/50'
    ]"
    @click="isExpanded = !isExpanded"
  >
    <!-- Compact view -->
    <div v-if="!isExpanded">
      <h3>{{ tier.name }}</h3>
      <p>{{ tier.oneLiner }}</p>
    </div>

    <!-- Expanded view -->
    <div v-else>
      <h3>{{ tier.name }}</h3>
      <ul>
        <li v-for="feature in tier.features" :key="feature">
          {{ feature }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const isExpanded = ref(false);
</script>
```

### Pattern 4: Modal with Teleport and Transition

**What:** Accessible modal dialog using Vue's Teleport and Transition

**When to use:** Tier comparison modal, education overlays

**Example:**
```vue
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

        <!-- Modal Content -->
        <div class="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.3s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
```

### Pattern 5: Tooltip with Popper.js (or simple CSS)

**What:** Hover tooltip for token explanation

**When to use:** Inline help text without cluttering UI

**Example (simple CSS - recommended for this use case):**
```vue
<template>
  <div class="relative group inline-block">
    <span class="underline decoration-dashed cursor-help">
      <slot />
    </span>

    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-slate-900 text-white text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 shadow-xl z-50">
      <slot name="content" />

      <!-- Arrow -->
      <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900" />
    </div>
  </div>
</template>
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upload progress | Custom websocket for progress | XMLHttpRequest/fetch with progress events | Browser APIs already provide this |
| Real-time status | Custom polling with setInterval | Supabase Realtime | Built-in, efficient, already configured |
| Modal animations | Custom keyframe animations | Vue Transition + CSS | Simpler, lighter, accessible |
| Tooltips | Popper.js from scratch | Simple CSS hover tooltips | Overkill to add Popper for one tooltip |
| Expand animations | Custom JS height animation | Tailwind + CSS transitions | Native CSS is smoother |

**Key insight:** The project already uses Supabase Realtime and has basic upload progress. Enhancement should build on these patterns rather than introducing new libraries.

## Common Pitfalls

### Pitfall 1: Blocking UI During Upload
**What goes wrong:** User can't navigate away or cancel upload
**Why it happens:** Upload is treated as atomic operation without cancellation support
**How to avoid:**
- Provide cancel button during upload
- Allow navigation away (upload continues in background)
- Store upload state in composable for persistence across navigation

**Warning signs:**
- `analyzing.value = true` blocks all interactions
- No abort controller for fetch/XHR

### Pitfall 2: Polling Too Frequently
**What goes wrong:** Excessive API calls drain resources and hit rate limits
**Why it happens:** Aggressive polling interval (e.g., 1 second)
**How to avoid:**
- Use Supabase Realtime instead of polling when possible
- If polling required, use exponential backoff (5s → 10s → 30s)
- Debounce rapid status checks

**Warning signs:**
- `setInterval(pollStatus, 1000)` without cleanup
- No unsubscribe in onUnmounted

### Pitfall 3: Token Explanation Too Technical
**What goes wrong:** Non-technical users don't understand "tokens"
**Why it happens:** Developer-centric language
**How to avoid:**
- Use analogies: "~4 characters" or "2-3 pages ≈ 8K tokens"
- Show concrete examples
- Visual comparison (pages/tokens)

**Warning signs:**
- "Tokens are subword units used by transformers"
- No real-world comparison

### Pitfall 4: Insufficient Credits UX Confusion
**What goes wrong:** Users don't understand why tier is disabled
**Why it happens:** Visual feedback doesn't communicate reason
**How to avoid:**
- Show "Faltan créditos" text with credits needed
- Provide quick link to credits page
- Auto-suggest affordable tier

**Warning signs:**
- Grayed out card with no explanation
- No "Comprar créditos" CTA

### Pitfall 5: Progress Bar Without Steps
**What goes wrong:** Users don't know what's happening during upload
**Why it happens:** Progress bar shows percentage but not context
**How to avoid:**
- Add step labels: "Subiendo" → "Validando" → "Completado"
- Show current step highlighted
- Animate transition between steps

**Warning signs:**
- Only percentage displayed
- No step indicators

## Code Examples

### Upload Progress with Steps (Enhance Dropzone.vue)

```typescript
// Source: Adapted from existing Dropzone.vue pattern
const uploadSteps = [
  { key: 'uploading', label: 'Subiendo', threshold: 0 },
  { key: 'validating', label: 'Validando', threshold: 90 },
  { key: 'complete', label: 'Completado', threshold: 100 },
];

const currentStep = computed(() => {
  const progress = uploadProgress.value || 0;
  return uploadSteps.slice().reverse().find(s => progress >= s.threshold) || uploadSteps[0];
});

const uploadFileWithProgress = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.response);
        resolve(response.file_url);
      } else {
        reject(new Error(xhr.statusText));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
};
```

### Tier Comparison Modal

```vue
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

        <div class="relative bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white">
              Compara los Niveles de Análisis
            </h2>
            <button @click="close" class="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <XIcon class="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <!-- Feature Comparison Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800">
                  <th class="text-left p-4 text-sm font-black text-slate-500 uppercase">Característica</th>
                  <th class="text-center p-4">
                    <span class="block text-xs font-bold text-slate-700 dark:text-slate-300">Básico</span>
                    <span class="block text-[10px] text-slate-400">1 crédito</span>
                  </th>
                  <th class="text-center p-4 bg-secondary/5">
                    <span class="block text-xs font-bold text-secondary">Premium</span>
                    <span class="block text-[10px] text-slate-400">3 créditos</span>
                  </th>
                  <th class="text-center p-4">
                    <span class="block text-xs font-bold text-slate-700 dark:text-slate-300">Forensic</span>
                    <span class="block text-[10px] text-slate-400">10 créditos</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="feature in comparisonFeatures" :key="feature.name" class="border-b border-slate-100 dark:border-slate-800">
                  <td class="p-4 text-sm font-bold text-slate-700 dark:text-slate-300">{{ feature.name }}</td>
                  <td class="text-center p-4">{{ getFeatureIcon(feature.basic) }}</td>
                  <td class="text-center p-4 bg-secondary/5">{{ getFeatureIcon(feature.premium) }}</td>
                  <td class="text-center p-4">{{ getFeatureIcon(feature.forensic) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Use Cases -->
          <div class="mt-8 grid md:grid-cols-3 gap-6">
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <h3 class="text-sm font-black text-slate-500 uppercase mb-2">Mejor para Básico</h3>
              <p class="text-sm text-slate-700 dark:text-slate-300">Escaneos rápidos, alertas rojas, contratos simples de bajo valor</p>
            </div>
            <div class="p-4 rounded-2xl bg-secondary/5 border border-secondary/20">
              <h3 class="text-sm font-black text-secondary uppercase mb-2">Mejor para Premium</h3>
              <p class="text-sm text-slate-700 dark:text-slate-300">Contratos estándar, mejor costo-beneficio, antes de firmar</p>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <h3 class="text-sm font-black text-slate-500 uppercase mb-2">Mejor para Forensic</h3>
              <p class="text-sm text-slate-700 dark:text-slate-300">Contratos de alto valor (> $10k), propiedad intelectual, exhaustividad</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```

### Token Tooltip Content

```vue
<template>
  <div class="relative group inline-block">
    <span class="underline decoration-dashed decoration-secondary/50 cursor-help text-slate-500 dark:text-slate-400 text-xs font-bold">
      ~8K tokens
    </span>

    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-72 shadow-xl z-50">
      <p class="font-bold mb-2">¿Qué es un token?</p>
      <p class="text-xs leading-relaxed mb-2">
        Piensa en tokens como ~4 caracteres cada uno.
      </p>
      <p class="text-xs leading-relaxed font-bold">
        8K tokens ≈ 2-3 páginas de contrato
      </p>

      <!-- Arrow -->
      <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-white" />
    </div>
  </div>
</template>
```

### Analysis Status Badge with Realtime

```typescript
// composable/useAnalysisStatus.ts
export const useAnalysisStatus = () => {
  const supabase = useSupabaseClient();
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Analizando...',
    completed: 'Completado',
    failed: 'Fallido',
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-slate-400',
    processing: 'bg-secondary animate-pulse',
    completed: 'bg-risk-low',
    failed: 'bg-red-500',
  };

  const subscribeToAnalysis = (
    analysisId: string,
    userId: string,
    callback: (analysis: Analysis) => void
  ) => {
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analyses',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          callback(payload.new as Analysis);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    statusMap,
    statusColor,
    subscribeToAnalysis,
  };
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling every N seconds | Supabase Realtime subscriptions | 2024+ | Lower latency, less API calls |
| XMLHttpRequest | fetch + ReadableStream | Modern browsers | Cleaner API, but XHR still better for progress |
| Custom modals | Teleport + Transition | Vue 3 | Better accessibility, simpler |
| Popper.js for tooltips | CSS hover tooltips | N/A | Lighter for simple use cases |

**Deprecated/outdated:**
- setInterval polling without cleanup: Memory leaks, use Supabase Realtime
- Blocking UI during upload: Poor UX, allow background upload

## Open Questions

1. **Should we implement upload cancellation?**
   - What we know: XMLHttpRequest supports abort
   - What's unclear: User expectation - should uploaded-but-not-yet-validated files be deleted?
   - Recommendation: Implement cancel button, but note in planning that cleanup of partially uploaded files is deferred to Phase 3

2. **Should tier recommendation be automatic or manual?**
   - What we know: CONTEXT.md says "recommendation engine runs after upload based on file size/complexity"
   - What's unclear: Exact algorithm for recommendation (token count only or complexity signals?)
   - Recommendation: Start with token-count based recommendation (fits in Basic vs needs Premium), add complexity signals in future phase

3. **Should analysis status polling use Realtime or API polling?**
   - What we know: dashboard.vue already uses Supabase Realtime successfully
   - What's unclear: None - Realtime is the correct choice
   - Recommendation: Use Supabase Realtime (already proven in codebase)

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns from `/home/cativo23/projects/personal/clarify/pages/dashboard.vue`
- Existing codebase patterns from `/home/cativo23/projects/personal/clarify/components/Dropzone.vue`
- Existing codebase patterns from `/home/cativo23/projects/personal/clarify/components/AnalysisSelector.vue`
- Supabase Realtime documentation (via existing implementation)
- Nuxt 3 built-in fetch patterns

### Secondary (MEDIUM confidence)
- Vue 3 Teleport and Transition patterns (official docs)
- XMLHttpRequest progress events (MDN)
- Tailwind CSS transition patterns (official docs)

### Tertiary (LOW confidence)
- None - all patterns verified with existing codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Project already uses Vue 3, Nuxt 3, Tailwind, Supabase
- Architecture: HIGH - Patterns extracted from existing successful implementations
- Pitfalls: HIGH - Based on common UX anti-patterns observed in similar applications
- Code examples: HIGH - Adapted from existing codebase patterns

**Research date:** 2026-02-22
**Valid until:** 2026-05-22 (3 months - stable UI patterns)

---

## Summary for Planning

**Key findings for Phase 2 planning:**

1. **Leverage existing infrastructure:**
   - Supabase Realtime already working in dashboard.vue
   - Dropzone has basic progress bar (needs step indicators)
   - AnalysisSelector has tier cards (needs comparison modal)

2. **New components needed:**
   - TierComparisonModal.vue (feature matrix + use cases)
   - TokenTooltip.vue (explain tokens to non-technical users)
   - Optional: UploadProgress.vue for step indicators

3. **New composables needed:**
   - useUploadProgress.ts (upload with progress events)
   - useAnalysisStatus.ts (Realtime subscription wrapper)
   - useTierRecommendation.ts (recommend tier based on token count)

4. **UX priorities from CONTEXT.md:**
   - Google Drive-like upload progress (percentage + steps)
   - Token explanation: "~4 chars = 8K tokens ≈ 2-3 pages"
   - Premium badge: subtle "Recomendado"
   - 5-state status display: Pending → Queued → Analyzing → Finalizing → Complete
   - Expand-on-click tier cards
   - Modal for detailed comparison

5. **Requirements coverage:**
   - TIER-02: Enhanced AnalysisSelector + comparison modal + tooltips
   - UPLOAD-02: Enhanced Dropzone with step indicators + better progress animation
