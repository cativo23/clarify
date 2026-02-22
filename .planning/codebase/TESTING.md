# Testing Patterns

**Analysis Date:** 2026-02-21

## Test Framework

**Unit Testing:**
- **Runner:** Vitest 2.1.8
- **Environment:** happy-dom (for Vue component testing)
- **Assertion Library:** Vitest built-in (Jest-compatible)
- **Config:** `vitest.config.ts`

**E2E Testing:**
- **Framework:** Playwright Test 1.49.1
- **Browsers:** Chromium, Firefox, WebKit
- **Config:** `playwright.config.ts`

**Run Commands:**
```bash
# Unit tests
npm run test              # Watch mode
npm run test:run          # Run all tests once
npm run test:ui           # Vitest UI

# E2E tests
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Playwright UI mode

# Quality checks
npm run lint              # ESLint
npm run typecheck         # TypeScript type check
```

## Test File Organization

**Location:**
- Unit tests: `tests/unit/` (mirrors source structure)
- E2E tests: `tests/e2e/`
- Mocks: `tests/mocks/`
- Setup files: `tests/setup.ts`

**Directory Structure:**
```
tests/
├── e2e/
│   ├── global-setup.ts       # Auth setup for E2E tests
│   ├── storageState.json     # Generated auth state
│   ├── admin-navigation.spec.ts
│   ├── admin-visibility.spec.ts
│   └── analysis-flow.spec.ts
├── mocks/
│   └── supabase.ts           # Supabase client mocks
├── unit/
│   ├── components/
│   │   └── ThemeToggle.test.ts
│   ├── server/
│   │   └── utils/
│   │       ├── auth.test.ts
│   │       └── openai-client.test.ts
│   ├── admin-layout.test.ts
│   └── admin-middleware.test.ts
└── setup.ts                  # Global test setup
```

**Naming:**
- Unit tests: `*.test.ts` (e.g., `auth.test.ts`, `ThemeToggle.test.ts`)
- E2E tests: `*.spec.ts` (e.g., `analysis-flow.spec.ts`)

## Test Structure

**Unit Test Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { functionToTest } from '@/path/to/module'

// Mock dependencies
const mockFunction = vi.fn()

vi.mock('@/dependency', () => ({
  exportedFunction: mockFunction
}))

// Stub globals
vi.stubGlobal('useRuntimeConfig', vi.fn())
vi.stubGlobal('createError', (err: any) => err)

describe('Module Name', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mock return values
  })

  describe('functionName', () => {
    it('should do expected behavior', () => {
      // Arrange
      mockFunction.mockReturnValue(expectedValue)

      // Act
      const result = functionToTest(input)

      // Assert
      expect(result).toBe(expectedResult)
    })

    it('should handle edge case', () => {
      // Test edge cases
    })

    it('[SECURITY] should prevent attack vector', () => {
      // Security-focused tests
    })
  })
})
```

**Component Test Pattern:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ComponentUnderTest from '@/components/Component.vue'

// Mock composables/globals
vi.stubGlobal('useColorMode', () => mockColorMode)

describe('ComponentName', () => {
  beforeEach(() => {
    // Reset mock state
  })

  it('should render correctly', () => {
    const wrapper = mount(ComponentUnderTest)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('should handle user interaction', async () => {
    const wrapper = mount(ComponentUnderTest)
    await wrapper.find('button').trigger('click')
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

**E2E Test Pattern:**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  // Use authenticated state from global setup
  test.use({ storageState: 'tests/e2e/storageState.json' })

  test('should complete happy path', async ({ page }) => {
    // 1. Mock API responses if needed
    await page.route('/api/endpoint', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // 2. Navigate to page
    await page.goto('/path')

    // 3. Perform actions
    await page.getByRole('button', { name: 'Submit' }).click()

    // 4. Assert results
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

## Mocking

**Vi Mock Pattern:**
```typescript
// Mock ES module imports
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: { create: mockChatCreate }
      }
      constructor(opts: any) { mockOpenAI(opts) }
    }
  }
})

// Mock fs/promises
vi.mock('fs/promises', async () => ({
  default: { readFile: vi.fn().mockResolvedValue('content') },
  readFile: vi.fn().mockResolvedValue('content')
}))

// Mock utility modules
vi.mock('@/server/utils/config', () => ({
  getPromptConfig: vi.fn()
}))

// Mock preprocessing utilities
vi.mock('@/server/utils/preprocessing', () => ({
  preprocessDocument: vi.fn().mockReturnValue({
    processedText: 'Processed text',
    originalTokenCount: 100,
    processedTokenCount: 80
  })
}))
```

**Mock Nuxt/Supabase Globals:**
```typescript
// In tests/setup.ts
vi.stubGlobal('defineNuxtRouteMiddleware', (cb: any) => cb)

// In test files
vi.stubGlobal('useRuntimeConfig', mockRuntimeConfig)
vi.stubGlobal('createError', (err: any) => err)
vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('useSupabaseUser', mockUseSupabaseUser)

// Mock Supabase server module
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn(),
  serverSupabaseClient: vi.fn()
}))
```

**Mock Supabase Composables:**
```typescript
// tests/mocks/supabase.ts
import { vi } from 'vitest'

export const serverSupabaseUser = vi.fn()
export const serverSupabaseClient = vi.fn()

// In test files, mock the composables:
vi.mock('~/composables/useSupabase', () => ({
  useUserState: () => mockUseUserState(),
  isUserProfileStale: () => mockIsUserProfileStale(),
  fetchUserProfile: (...args: any[]) => mockFetchUserProfile(...args)
}))
```

**What to Mock:**
- External services (OpenAI, Stripe, Supabase)
- File system operations (`fs/promises`)
- Nuxt globals (`useRuntimeConfig`, `navigateTo`, `createError`)
- Complex composables with side effects
- Time-dependent functions (use `vi.useFakeTimers()`)

**What NOT to Mock:**
- Pure utility functions (test the real implementation)
- Type definitions
- Simple helper functions without external dependencies

## Fixtures and Factories

**Test Data Pattern:**
```typescript
// Inline test data (preferred for simple cases)
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  credits: 10
}

// Factory function for complex objects
const createMockAnalysis = (overrides = {}) => ({
  id: 'analysis-123',
  contract_name: 'Test Contract',
  status: 'completed',
  risk_level: 'high',
  summary_json: { riskScore: 85 },
  created_at: new Date().toISOString(),
  ...overrides
})

// Usage in tests
const analysis = createMockAnalysis({ status: 'pending' })
```

**Location:**
- Simple mocks: Defined inline within test files
- Shared mocks: `tests/mocks/` directory (e.g., `supabase.ts`)
- E2E fixtures: `tests/e2e/storageState.json` (generated by global setup)

**E2E Storage State:**
```typescript
// tests/e2e/global-setup.ts
async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Perform login
  await page.goto(baseURL + '/login')
  await page.getByLabel('Email').fill('admin@clarify.com')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.waitForURL('**/dashboard')

  // Save signed-in state
  await page.context().storageState({ path: 'tests/e2e/storageState.json' })
  await browser.close()
}
```

## Coverage

**Requirements:** No minimum enforced currently

**View Coverage:**
```bash
# Run tests with coverage (add --coverage flag)
npm run test:run -- --coverage
```

**Coverage Config:** Add to `vitest.config.ts`:
```typescript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'tests/']
  }
}
```

## Test Types

**Unit Tests:**
- **Scope:** Individual functions, utilities, and components
- **Location:** `tests/unit/`
- **Examples:**
  - `tests/unit/server/utils/auth.test.ts` - Auth utility functions
  - `tests/unit/components/ThemeToggle.test.ts` - Vue component
  - `tests/unit/admin-middleware.test.ts` - Route middleware

**Integration Tests:**
- **Scope:** API endpoints with mocked external services
- **Location:** `tests/unit/server/`
- **Pattern:** Mock OpenAI/Stripe/Supabase, test endpoint logic

**E2E Tests:**
- **Scope:** Full user flows through the browser
- **Location:** `tests/e2e/`
- **Examples:**
  - `tests/e2e/analysis-flow.spec.ts` - Complete analysis workflow
  - `tests/e2e/admin-navigation.spec.ts` - Admin page access
  - `tests/e2e/admin-visibility.spec.ts` - Admin feature visibility

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  mockAsyncFunction.mockResolvedValue({ data: 'result' })

  const result = await asyncFunctionUnderTest()

  expect(result).toEqual({ data: 'result' })
})

it('should handle promise rejection', async () => {
  mockAsyncFunction.mockRejectedValue(new Error('Failed'))

  await expect(asyncFunctionUnderTest()).rejects.toThrow('Failed')
})
```

**Error Testing:**
```typescript
it('should throw 401 if user is not admin', async () => {
  mockUser.mockResolvedValue({ email: 'user@clarify.com' })

  await expect(requireAdmin(mockEvent)).rejects.toMatchObject({
    statusCode: 401,
    message: 'Unauthorized'
  })
})

it('[SECURITY] should throw error if model is not in whitelist', async () => {
  vi.mocked(getPromptConfig).mockResolvedValueOnce({
    tiers: { premium: { model: 'evil-model-v666' } } as any
  })

  await expect(analyzeContract('text')).rejects.toThrow(
    'Invalid AI model configuration'
  )
})
```

**Testing Vue Component Events:**
```typescript
it('should emit update event on change', async () => {
  const wrapper = mount(Component, {
    props: { modelValue: 'initial' }
  })

  await wrapper.find('button').trigger('click')

  expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  expect(wrapper.emitted('update:modelValue')![0]).toEqual(['new-value'])
})
```

**Testing with Mocked Timers:**
```typescript
it('should auto-remove toast after duration', async () => {
  vi.useFakeTimers()

  addToast({ type: 'success', message: 'Test', duration: 5000 })

  expect(toastTimeouts.size).toBe(1)

  vi.advanceTimersByTime(5000)

  expect(toastTimeouts.size).toBe(0)

  vi.useRealTimers()
})
```

**Parameterized Tests:**
```typescript
it.each([
  ['high', 'Riesgo Alto'],
  ['medium', 'Precaución'],
  ['low', 'Seguro']
])('should return correct label for risk level %s', (risk, expected) => {
  const wrapper = mount(RiskCard, { props: { risk } })
  // Assertions...
})
```

## Playwright Configuration

**Config (`playwright.config.ts`):**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/e2e/global-setup',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: 'tests/e2e/storageState.json',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

## Vitest Configuration

**Config (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    server: {
      deps: {
        inline: ['@nuxt/test-utils'],
      },
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '#supabase/server': resolve(__dirname, './tests/mocks/supabase.ts'),
    },
  },
})
```

---

*Testing analysis: 2026-02-21*
