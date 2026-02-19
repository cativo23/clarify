# 🧪 Testing Guide - Clarify

Comprehensive testing documentation for the Clarify project.

---

## Quick Start

```bash
# Run all unit tests
npm run test:run

# Run tests in watch mode (re-runs on file changes)
npm run test

# Run tests with graphical UI
npm run test:ui

# Run E2E tests (from host machine)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

---

## Test Types

### 1. Unit Tests (Vitest)

Unit tests verify individual components and functions in isolation.

**Configuration:** `vitest.config.ts`

**Test Files:**

| File | Description |
|------|-------------|
| `tests/unit/admin-layout.test.ts` | Admin layout structure & navigation links |
| `tests/unit/admin-middleware.test.ts` | Admin auth & redirection logic |
| `tests/unit/server/utils/auth.test.ts` | Server-side auth utilities |
| `tests/unit/server/utils/openai-client.test.ts` | AI client tests (whitelisting, refusals) |
| `tests/unit/components/*.test.ts` | Vue component tests |

### 2. E2E Tests (Playwright)

End-to-end tests verify complete user flows in a real browser.

**Configuration:** `playwright.config.ts`

**Test Files:**

| File | Description |
|------|-------------|
| `tests/e2e/admin-navigation.spec.ts` | Admin area navigation flows |
| `tests/e2e/admin-visibility.spec.ts` | Admin UI element visibility |

**Supported Browsers:**
- Chromium (Chrome)
- Firefox
- WebKit (Safari)

---

## Setup

### Prerequisites

1. **Node.js** v18+ or Docker Desktop
2. **Playwright browsers** (for E2E tests only)

### Install Playwright Browsers

> ⚠️ **Note:** The app Docker container uses Alpine Linux which does **not support Playwright**. Run E2E tests from your host machine.

```bash
# From host machine (recommended)
npx playwright install --with-deps chromium

# Or install all browsers
npx playwright install
```

### Run Tests Against Local Server

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e
```

---

## Test Coverage

### Run with Coverage Report

```bash
npx vitest run --coverage
```

Reports are generated to `coverage/` in multiple formats:
- `text` - Console output
- `json` - Machine-readable
- `html` - Browser-friendly

### Coverage Configuration

Edit `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['components/**/*', 'composables/**/*', 'layouts/**/*', 'pages/**/*'],
  exclude: ['**.d.ts', 'tests/**'],
}
```

---

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should render correctly', () => {
    expect(true).toBe(true)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should display admin button', async ({ page }) => {
  await page.goto('/dashboard')
  const adminButton = page.locator('a[href="/admin/analytics"]')
  await expect(adminButton).toBeVisible()
})
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run unit tests
        run: npm run test:run

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Troubleshooting

### Tests fail in CI but pass locally

1. **Check environment variables** - Ensure all required `.env` values are set in CI
2. **Increase timeouts** - CI environments may be slower
3. **Disable server reuse** - Set `reuseExistingServer: false` in `playwright.config.ts`

### Playwright cannot connect to server

1. **Verify dev server is running** - Check `http://localhost:3001`
2. **Check port configuration** - Ensure `baseURL` matches in `playwright.config.ts`
3. **Increase webServer timeout** - Default is 120s, may need more for cold starts

### Unit tests fail with import errors

1. **Regenerate Nuxt types** - Run `npx nuxi prepare`
2. **Clear cache** - Delete `.nuxt/` and `node_modules/`, then reinstall
3. **Check vitest config** - Ensure aliases are correctly configured

---

## Manual Testing

For scenarios that cannot be automated, see:

- 📋 [Manual Test Checklist](../MANUAL_TEST_CHECKLIST.md) - Step-by-step QA checklist for the Admin feature

---

## Test Files Structure

```
tests/
├── e2e/
│   ├── admin-navigation.spec.ts    # Admin navigation flows
│   ├── admin-visibility.spec.ts    # Admin UI visibility
│   ├── global-setup.ts             # Global test setup
│   └── storageState.json           # Auth state for tests
├── unit/
│   ├── admin-layout.test.ts        # Layout tests
│   ├── admin-middleware.test.ts    # Middleware tests
│   ├── components/                 # Component tests
│   └── server/                     # Server utility tests
└── setup.ts                        # Test setup & mocks
```

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Nuxt Testing Guide](https://nuxt.com/docs/getting-started/testing)
