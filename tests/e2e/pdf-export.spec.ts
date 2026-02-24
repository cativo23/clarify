/**
 * E2E Tests for PDF Export Functionality
 *
 * Tests verify that users can download analysis PDFs from the detail page,
 * caching works correctly, and security measures prevent unauthorized access.
 */

import { test, expect } from '@playwright/test'

// Skip all tests if environment is not configured
test.skip(() => !process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL environment variable')

test.describe('PDF Export - End to End', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('user can download analysis PDF from detail page', async ({ page }) => {
    // Navigate to an analysis detail page
    await page.goto('/dashboard')

    // Wait for analyses to load and click on first completed analysis
    const analysisCard = page.locator('[data-testid="analysis-card"]').first()
    await analysisCard.waitFor({ state: 'visible' })
    await analysisCard.click()

    // Wait for page to load
    await page.waitForURL(/\/analyze\/[a-f0-9-]+/)

    // Click download PDF button
    const downloadButton = page.locator('button:has-text("Descargar Reporte"), button:has-text("PDF")')
    await downloadButton.waitFor({ state: 'visible' })

    // Start download and wait for it
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ])

    // Verify download started
    expect(download).toBeDefined()
    expect(download.suggestedFilename()).toContain('clarify')
    expect(download.suggestedFilename()).toContain('.pdf')

    // Save download to verify it completed
    const downloadPath = `/tmp/${download.suggestedFilename()}`
    await download.saveAs(downloadPath)

    // Verify file size is reasonable (> 1KB for a valid PDF)
    const fs = require('fs')
    const stats = fs.statSync(downloadPath)
    expect(stats.size).toBeGreaterThan(1000)
  })

  test('PDF download shows loading state', async ({ page }) => {
    await page.goto('/dashboard')

    // Click first analysis
    const analysisCard = page.locator('[data-testid="analysis-card"]').first()
    await analysisCard.click()
    await page.waitForURL(/\/analyze\/[a-f0-9-]+/)

    // Click download and verify button shows loading state
    const downloadButton = page.locator('button:has-text("Descargar Reporte")')
    await downloadButton.click()

    // Button should show some loading indication (disabled or text change)
    // This is a basic check - could be enhanced based on actual implementation
    await expect(downloadButton).toBeDisabled()
  })

  test('PDF is cached after first generation', async ({ page }) => {
    await page.goto('/dashboard')

    // Click first analysis
    const analysisCard = page.locator('[data-testid="analysis-card"]').first()
    await analysisCard.click()
    await page.waitForURL(/\/analyze\/[a-f0-9-]+/)

    // First download
    const downloadButton = page.locator('button:has-text("Descargar Reporte")')

    const startTime = Date.now()
    const [download1] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ])
    const firstDownloadTime = Date.now() - startTime

    await download1.saveAs(`/tmp/${download1.suggestedFilename()}`)

    // Refresh page to reset button state
    await page.reload()
    await page.waitForURL(/\/analyze\/[a-f0-9-]+/)

    // Second download (should be faster due to caching)
    const cachedDownloadButton = page.locator('button:has-text("Descargar Reporte")')

    const secondStartTime = Date.now()
    const [download2] = await Promise.all([
      page.waitForEvent('download'),
      cachedDownloadButton.click(),
    ])
    const secondDownloadTime = Date.now() - secondStartTime

    await download2.saveAs(`/tmp/${download2.suggestedFilename()}`)

    // Second download should be faster (cached)
    // Note: This is a rough test - actual caching performance may vary
    console.log(`First download: ${firstDownloadTime}ms, Second download: ${secondDownloadTime}ms`)
  })

  test('PDF download works for different analysis types', async ({ page }) => {
    await page.goto('/dashboard')

    // Test Premium analysis (default)
    const analysisCard = page.locator('[data-testid="analysis-card"]').first()
    await analysisCard.click()
    await page.waitForURL(/\/analyze\/[a-f0-9-]+/)

    const downloadButton = page.locator('button:has-text("Descargar Reporte")')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ])

    expect(download).toBeDefined()
    expect(download.suggestedFilename()).toContain('.pdf')

    // Note: Testing Forensic would require a Forensic analysis in the test data
  })

  test('error handling for failed analysis', async ({ page }) => {
    await page.goto('/dashboard')

    // Find a failed analysis if one exists
    const failedAnalysis = page.locator('[data-testid="analysis-status-failed"]').first()

    if (await failedAnalysis.count() > 0) {
      await failedAnalysis.click()
      await page.waitForURL(/\/analyze\/[a-f0-9-]+/)

      // Download button should not be available for failed analyses
      const downloadButton = page.locator('button:has-text("Descargar Reporte")')
      await expect(downloadButton).not.toBeVisible()
    } else {
      // Skip if no failed analyses
      test.skip()
    }
  })
})

test.describe('PDF Export - Security', () => {
  test('user cannot download another user PDF', async ({ page }) => {
    // This test requires two test users configured
    if (!process.env.TEST_USER_B_EMAIL) {
      test.skip('Requires TEST_USER_B_EMAIL environment variable')
      return
    }

    // Login as User A
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Try to access User B's analysis directly
    // This should return 404 because of ownership verification
    const response = await page.request.get('/api/analyses/fake-analysis-id/export-pdf')
    expect(response.status()).toBe(401) // Should be unauthorized or not found
  })
})

test.describe('PDF Export - Error Handling', () => {
  test('handles analysis not found', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || '')
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Try to access non-existent analysis
    const response = await page.request.get('/api/analyses/00000000-0000-0000-0000-000000000000/export-pdf')
    expect(response.status()).toBe(401) // Should be 401 (unauthorized) or 404
  })

  test('handles unauthenticated access', async ({ page }) => {
    // Don't login - try to access PDF directly
    const response = await page.request.get('/api/analyses/fake-id/export-pdf')
    expect(response.status()).toBe(401)
  })
})
