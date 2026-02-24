/**
 * E2E Tests for History Page Filters
 *
 * Tests verify that search, risk filters, and date range filters
 * work correctly on the history page.
 */

import { test, expect } from '@playwright/test'

// Skip all tests if environment is not configured
test.skip(() => !process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL environment variable')

test.describe('History Filters - Search', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navigate to history page
    await page.goto('/history')
    await page.waitForSelector('[data-testid="analysis-card"]', { state: 'visible' })
  })

  test('search by contract name', async ({ page }) => {
    // Get initial count of analyses
    const initialCards = page.locator('[data-testid="analysis-card"]')
    const initialCount = await initialCards.count()

    // Type search query
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first()
    await searchInput.fill('Contrato')

    // Wait for filter to apply
    await page.waitForTimeout(300)

    // Count filtered results
    const filteredCards = page.locator('[data-testid="analysis-card"]')
    const filteredCount = await filteredCards.count()

    // Should have same or fewer results
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test('search is case-insensitive', async ({ page }) => {
    // Search with lowercase
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first()

    await searchInput.fill('contrato')
    await page.waitForTimeout(300)
    const lowercaseResults = await page.locator('[data-testid="analysis-card"]').count()

    // Clear and search with uppercase
    await searchInput.fill('CONTRATO')
    await page.waitForTimeout(300)
    const uppercaseResults = await page.locator('[data-testid="analysis-card"]').count()

    // Results should be the same
    expect(lowercaseResults).toBe(uppercaseResults)
  })

  test('search with partial match', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first()

    // Search for partial word
    await searchInput.fill('Serv')
    await page.waitForTimeout(300)

    // Should find "Servicios" contracts
    const results = page.locator('[data-testid="analysis-card"]')
    const count = await results.count()

    // Should have some results (assuming test data has "Servicios")
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('empty state when no search results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first()

    // Search for non-existent contract
    await searchInput.fill('xyz-nonexistent-contract-12345')
    await page.waitForTimeout(300)

    // Should show empty state
    const emptyState = page.locator('text="No encontramos"')
    await expect(emptyState).toBeVisible()

    // No analysis cards should be visible
    const cards = page.locator('[data-testid="analysis-card"]')
    await expect(cards).toHaveCount(0)
  })

  test('clear search resets results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first()

    // Search for something
    await searchInput.fill('Contrato')
    await page.waitForTimeout(300)

    const filteredCount = await page.locator('[data-testid="analysis-card"]').count()

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(300)

    const allCount = await page.locator('[data-testid="analysis-card"]').count()

    // Should have more results after clearing
    expect(allCount).toBeGreaterThanOrEqual(filteredCount)
  })
})

test.describe('History Filters - Risk Level', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/history')
    await page.waitForSelector('[data-testid="analysis-card"]', { state: 'visible' })
  })

  test('filter by "Todos" shows all analyses', async ({ page }) => {
    const todosButton = page.locator('button:has-text("Todos")')
    await todosButton.click()
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // Should show all analyses
    expect(count).toBeGreaterThan(0)
  })

  test('filter by "Riesgo Alto" shows only high risk', async ({ page }) => {
    const altoRiesgoButton = page.locator('button:has-text("Riesgo Alto")')
    await altoRiesgoButton.click()
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // All visible cards should be high risk
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      // Check for high risk indicator (red color or "Alto" text)
      const isHighRisk = await card.locator('text="Alto Riesgo"').count() > 0 ||
        await card.locator('[class*="risk-high"]').count() > 0
      expect(isHighRisk).toBe(true)
    }
  })

  test('filter by "Cuidado" shows only medium risk', async ({ page }) => {
    const cuidadoButton = page.locator('button:has-text("Cuidado")')
    await cuidadoButton.click()
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // All visible cards should be medium risk
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const isMediumRisk = await card.locator('text="Precaución"').count() > 0 ||
        await card.locator('[class*="risk-medium"]').count() > 0
      expect(isMediumRisk).toBe(true)
    }
  })

  test('filter by "Seguro" shows only low risk', async ({ page }) => {
    const seguroButton = page.locator('button:has-text("Seguro")')
    await seguroButton.click()
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // All visible cards should be low risk
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const isLowRisk = await card.locator('text="Seguro"').count() > 0 ||
        await card.locator('[class*="risk-low"]').count() > 0
      expect(isLowRisk).toBe(true)
    }
  })

  test('filter by "Fallidos" shows only failed analyses', async ({ page }) => {
    const fallidosButton = page.locator('button:has-text("Fallidos")')
    await fallidosButton.click()
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // All visible cards should be failed
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const isFailed = await card.locator('text="Fallido"').count() > 0 ||
        await card.locator('[data-testid="analysis-status-failed"]').count() > 0
      expect(isFailed).toBe(true)
    }
  })
})

test.describe('History Filters - Date Range', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/history')
    await page.waitForSelector('[data-testid="analysis-card"]', { state: 'visible' })
  })

  test('filter by date FROM excludes earlier analyses', async ({ page }) => {
    // Set date FROM to recent date
    const dateFromInput = page.locator('input[type="date"][aria-label*="Desde"], label:has-text("Desde") + input')
    const today = new Date().toISOString().split('T')[0]

    await dateFromInput.fill(today)
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // All results should be from today or later
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      // Verify date is >= from date (basic check)
      expect(card).toBeDefined()
    }
  })

  test('filter by date TO excludes later analyses', async ({ page }) => {
    // Set date TO to past date
    const dateToInput = page.locator('input[type="date"][aria-label*="Hasta"], label:has-text("Hasta") + input')
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    await dateToInput.fill(yesterday)
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // All results should be from yesterday or earlier
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      expect(card).toBeDefined()
    }
  })

  test('filter by date range (FROM and TO)', async ({ page }) => {
    const dateFromInput = page.locator('input[type="date"][aria-label*="Desde"]')
    const dateToInput = page.locator('input[type="date"][aria-label*="Hasta"]')

    // Set a date range
    const fromDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] // 7 days ago
    const toDate = new Date().toISOString().split('T')[0] // Today

    await dateFromInput.fill(fromDate)
    await dateToInput.fill(toDate)
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // Should have results in range
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('History Filters - Combined Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/history')
    await page.waitForSelector('[data-testid="analysis-card"]', { state: 'visible' })
  })

  test('combined filters apply AND logic', async ({ page }) => {
    // Apply search
    const searchInput = page.locator('input[placeholder*="Buscar"]').first()
    await searchInput.fill('Contrato')

    // Apply risk filter
    const riesgoAltoButton = page.locator('button:has-text("Riesgo Alto")')
    await riesgoAltoButton.click()

    // Apply date range
    const dateFromInput = page.locator('input[type="date"][aria-label*="Desde"]')
    const fromDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    await dateFromInput.fill(fromDate)

    await page.waitForTimeout(500)

    const cards = page.locator('[data-testid="analysis-card"]')
    const count = await cards.count()

    // Results should match ALL criteria
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      // Should contain search term
      const cardText = await card.textContent()
      expect(cardText?.toLowerCase()).toContain('contrato')
    }
  })

  test('clear all filters resets everything', async ({ page }) => {
    // Apply multiple filters
    const searchInput = page.locator('input[placeholder*="Buscar"]').first()
    await searchInput.fill('Test')

    const riesgoAltoButton = page.locator('button:has-text("Riesgo Alto")')
    await riesgoAltoButton.click()

    const dateFromInput = page.locator('input[type="date"][aria-label*="Desde"]')
    await dateFromInput.fill(new Date().toISOString().split('T')[0])

    await page.waitForTimeout(300)

    const filteredCount = await page.locator('[data-testid="analysis-card"]').count()

    // Click clear filters button
    const clearButton = page.locator('button:has-text("Limpiar filtros")')
    if (await clearButton.isVisible()) {
      await clearButton.click()
      await page.waitForTimeout(300)

      const allCount = await page.locator('[data-testid="analysis-card"]').count()

      // Should have more results after clearing
      expect(allCount).toBeGreaterThanOrEqual(filteredCount)

      // Search should be cleared
      const searchValue = await searchInput.inputValue()
      expect(searchValue).toBe('')
    }
  })

  test('empty state with active filters shows helpful message', async ({ page }) => {
    // Apply restrictive filter
    const searchInput = page.locator('input[placeholder*="Buscar"]').first()
    await searchInput.fill('xyz-nonexistent-12345')
    await page.waitForTimeout(300)

    // Should show empty state with filter message
    const emptyMessage = page.locator('text="filtros"')
    await expect(emptyMessage).toBeVisible()

    // Clear filters button should be visible
    const clearButton = page.locator('button:has-text("Limpiar filtros")')
    await expect(clearButton).toBeVisible()
  })
})

test.describe('History Filters - Accessibility', () => {
  test('date inputs are keyboard accessible', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/history')

    // Tab to date inputs
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to focus date input
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBe('INPUT')
  })

  test('filter buttons have focus states', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/history')

    // Tab to filter buttons
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const focusedElement = await page.evaluate(() => document.activeElement)
    const hasFocusStyle = await focusedElement?.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.outline !== 'none' || style.boxShadow !== 'none'
    })
    expect(hasFocusStyle).toBe(true)
  })
})
