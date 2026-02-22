# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- **Vue Components**: PascalCase (e.g., `RiskCard.vue`, `AnalysisSelector.vue`, `Dropzone.vue`)
- **Server Utilities**: kebab-case (e.g., `error-handler.ts`, `file-validation.ts`, `openai-client.ts`)
- **API Endpoints**: kebab-case with HTTP method suffix (e.g., `analyze.post.ts`, `checkout.post.ts`, `index.get.ts`)
- **Composables**: `use` prefix + PascalCase (e.g., `useToast.ts`, `useSupabase.ts`, `useTimeAgo.ts`)
- **Middleware**: kebab-case (e.g., `auth.ts`, `admin.ts`)

**Functions:**
- camelCase for regular functions (e.g., `handleAnalyze`, `validateFile`, `fetchUserData`)
- PascalCase for Vue component imports
- Exports from composables use camelCase (e.g., `fetchUserProfile`, `signOut`, `useUserAnalyses`)

**Variables:**
- camelCase for local/state variables (e.g., `userProfile`, `analysisType`, `selectedFile`)
- PascalCase for types and interfaces (e.g., `Analysis`, `User`, `FileValidationResult`)
- SCREAMING_SNAKE_CASE for constants (e.g., `USER_PROFILE_CACHE_TTL`, `ALLOWED_FILE_TYPES`)

**Types:**
- PascalCase for interfaces and type aliases (e.g., `Database`, `ComprehensiveValidationResult`)
- Use explicit return types on exported functions (e.g., `export function isAdminUser(event: H3Event): Promise<boolean>`)

## Code Style

**Formatting:**
- **Tool**: ESLint (via `npm run lint`) + TypeScript strict mode
- **Indentation**: 2 spaces (Vue) and 4 spaces (TypeScript server files)
- **Semicolons**: Present
- **Quotes**: Single quotes in TypeScript, double quotes in Vue templates
- **Trailing commas**: Used in multi-line object/array literals
- **Max line length**: ~120 characters (soft limit)

**Vue Single File Components:**
```vue
<template>
  <!-- Template content -->
</template>

<script setup lang="ts">
// Imports first
import { ref, computed } from 'vue'
import type { RiskLevel } from '~/types'

// Props definition with explicit types
const props = defineProps<{
  category: string
  risk: RiskLevel
}>()

// Emits definition
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'error': [message: string]
}>()

// Reactive state
const isExpanded = ref(false)

// Computed properties
const riskLabel = computed(() => { ... })

// Methods
const handleClick = () => { ... }

// Watch effects
watch(() => props.risk, (newValue) => { ... })
</script>

<style scoped>
/* Component styles */
</style>
```

**TypeScript Configuration:**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "forceConsistentCasingInFileNames": true,
  "skipLibCheck": true
}
```

**Linting:**
- ESLint configured via `npm run lint`
- TypeScript type-checking via `npm run typecheck` (Nuxt typecheck, disabled in build for performance)

## Import Organization

**Order:**
1. Vue imports and Nuxt composables (e.g., `import { ref, computed } from 'vue'`)
2. Type imports (e.g., `import type { RiskLevel } from '~/types'`)
3. Library/third-party imports (e.g., `import { ZapIcon } from 'lucide-vue-next'`)
4. Local imports (components, composables, utilities)
5. Relative path imports

**Path Aliases:**
- `~` or `@` → project root (configured in `vitest.config.ts`)
- `~/` → project root for imports
- `#supabase/server` → aliased to mock in tests

Example from `server/api/analyze.post.ts`:
```typescript
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { getAnalysisQueue } from '../utils/queue'
import { validateSupabaseStorageUrl } from '../utils/ssrf-protection'
import { handleApiError } from '../utils/error-handler'
import { z } from 'zod'
```

## Error Handling

**Server-Side Pattern:**
Use centralized error handler with safe error messages:

```typescript
import { handleApiError, createSafeError, ErrorType } from '@/server/utils/error-handler'

export default defineEventHandler(async (event) => {
  try {
    // ... business logic
    throw createError({ statusCode: 400, message: 'Invalid input' })
  } catch (error: any) {
    handleApiError(error, {
      userId: user?.id,
      endpoint: '/api/analyze',
      operation: 'create_analysis'
    })
  }
})
```

**Error Categories:**
- `VALIDATION_ERROR` (400): Invalid user input
- `AUTHENTICATION_ERROR` (401): User not logged in
- `AUTHORIZATION_ERROR` (403): User lacks permission
- `NOT_FOUND_ERROR` (404): Resource not found
- `PAYMENT_REQUIRED_ERROR` (402): Insufficient credits
- `RATE_LIMIT_ERROR` (429): Too many requests
- `SERVER_ERROR` (500): Unexpected errors
- `EXTERNAL_SERVICE_ERROR` (503): Third-party service failure

**Input Validation:**
Use Zod schemas for request validation:
```typescript
import { z } from 'zod'

const analyzeRequestSchema = z.object({
  file_url: z.string().url('file_url must be a valid URL'),
  contract_name: z
    .string()
    .min(1, 'contract_name cannot be empty')
    .max(255, 'contract_name must be less than 255 characters'),
  analysis_type: z.enum(['basic', 'premium', 'forensic']).default('premium')
})

// In handler
const parseResult = analyzeRequestSchema.safeParse(body)
if (!parseResult.success) {
  throw createError({ statusCode: 400, message: 'Invalid request', data: { errors } })
}
```

**Client-Side Error Handling:**
```typescript
try {
  const response = await $fetch('/api/analyze', { method: 'POST', body })
} catch (error: any) {
  const errorMessage =
    error.data?.message ||
    error.message ||
    'Ocurrió un error durante el análisis'
  analyzeError.value = errorMessage
}
```

## Logging

**Framework:** Native `console` with structured prefixes

**Server Logging:**
```typescript
console.error('[SECURITY ERROR LOG]', JSON.stringify(errorDetails, null, 2))
console.warn('[SECURITY] Invalid analyze request:', { userId, errors })
console.debug('[Auth] admin_emails table query:', error.message)
console.log('[File Validation] Upload validated:', logEntry)
```

**Client Logging:**
```typescript
console.error('Error fetching user data:', error)
console.warn('[Realtime] Subscription failed:', error)
```

**Log Prefixes:**
- `[SECURITY]` - Security-related events
- `[Auth]` - Authentication events
- `[File Validation]` - Upload validation events
- `[Realtime]` - Supabase realtime events

## Comments

**When to Comment:**
- Document security fixes with references (e.g., `[SECURITY FIX #2]`)
- Explain complex business logic
- Note workarounds or technical debt
- Add JSDoc for utility functions with complex parameters

**JSDoc/TSDoc:**
```typescript
/**
 * Normalizes email for safe comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Applies Unicode NFKC normalization to prevent homograph attacks
 * @param email - The email to normalize
 * @returns Normalized email string
 */
function normalizeEmail(email: string): string { ... }

/**
 * Handle error and throw as Nuxt error with safe message
 *
 * @param error - The caught error
 * @param options - Context options
 * @throws Nuxt error with sanitized message
 */
export function handleApiError(error: any, options?: { ... }): never { ... }
```

**Security Comments:**
Security-related code should have header comments explaining the fix:
```typescript
/**
 * Secure Error Handling Utility
 *
 * [SECURITY FIX H3] Prevents information disclosure by sanitizing error messages
 * returned to clients while logging full details server-side for debugging.
 *
 * Impact: Prevents attackers from using error messages for reconnaissance.
 */
```

## Function Design

**Size:**
- Keep functions focused (under 50 lines when possible)
- Extract complex logic into named helper functions
- Use early returns to reduce nesting

**Parameters:**
- Use object destructuring for 3+ parameters
- Type all parameters explicitly
- Use optional parameters with `?` or default values

**Return Values:**
- Always use explicit return types on exported functions
- Use `Promise<T>` for async functions
- Return `never` for functions that always throw
- Use discriminated unions for complex return types

Example:
```typescript
export function validateFileByMagicBytes(
  fileBuffer: Buffer,
  fileName: string
): FileValidationResult { ... }

export async function withSafeErrorHandling<T>(
  promise: Promise<T>,
  options: { operation: string }
): Promise<T> { ... }
```

## Module Design

**Exports:**
- Named exports preferred over default exports (except for Vue components and Nuxt handlers)
- Group related exports together (functions, types, constants)
- Export types alongside their implementations

Example from `server/utils/error-handler.ts`:
```typescript
export enum ErrorType { ... }
export interface SafeError { ... }
export function sanitizeErrorMessage(message: string): string { ... }
export function createSafeError(error: any, options?: { ... }): SafeError { ... }
export function handleApiError(error: any, options?: { ... }): never { ... }
export async function withSafeErrorHandling<T>(...): Promise<T> { ... }
```

**Barrel Files:**
- Types directory uses barrel export: `export type { Analysis, User, RiskLevel } from '~/types'`
- Avoid deep barrel files for components; prefer direct imports

**Composables Pattern:**
```typescript
// useState pattern for shared state
export const useCreditsState = () => useState<number>('user-credits', () => 0)
export const useUserState = () => useState<User | null>('user-profile', () => null)

// Fetch function with caching
export const fetchUserProfile = async (forceRefresh = false) => { ... }

// Action function
export const signOut = async () => { ... }
```

## Vue Component Patterns

**Props:**
- Use `defineProps` with generic syntax for type safety
- All props should be required unless explicitly optional
- Use `?:` for optional props

```typescript
const props = defineProps<{
  modelValue: 'basic' | 'premium'
  userCredits: number
  isLoading?: boolean
}>()
```

**Emits:**
- Use `defineEmits` with typed syntax
- Event names use kebab-case in templates, camelCase in code
- Include payload types

```typescript
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'error': [message: string]
}>()
```

**v-model Pattern:**
```vue
<script setup lang="ts">
const props = defineProps<{ modelValue?: File | null }>()
const emit = defineEmits<{ 'update:modelValue': [file: File | null] }>()

const selectedFile = ref<File | null>(props.modelValue || null)

watch(() => props.modelValue, (newValue) => {
  selectedFile.value = newValue || null
})
</script>
```

## CSS/Styling Conventions

**Tailwind CSS:**
- Use utility classes directly in templates
- Custom styles via `:class` binding for dynamic classes
- Dark mode via `dark:` prefix

```vue
<div :class="[
  'border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all duration-500',
  isDragging
    ? 'border-secondary bg-secondary/5 scale-[1.02] shadow-glow'
    : 'border-slate-200 dark:border-slate-800 hover:border-secondary/50'
]">
```

**Custom Classes:**
- Use `<style scoped>` for component-specific styles
- Animation classes reference custom keyframes defined in `tailwind.config.js`

**Design Tokens (tailwind.config.js):**
- `primary`: Midnight blue brand color
- `secondary`: Nuxt green accent
- `risk`: Traffic light colors (low/medium/high)
- Custom shadows: `soft`, `premium`, `glow`
- Custom animations: `fade-in`, `slide-up`, `pulse-slow`, `float`

---

*Convention analysis: 2026-02-21*
