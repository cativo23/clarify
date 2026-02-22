import { test, expect } from '@playwright/test'

test.describe('Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Ir al login antes de cada test
    await page.goto('/login')
  })

  test('should display Admin button in navbar for admin users', async ({ page }) => {
    // Login como admin (ajustar credenciales según tu entorno de test)
    await page.fill('input[type="email"]', 'admin@clarify.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Esperar navegación al dashboard
    await page.waitForURL('/dashboard')

    // Verificar que el botón Admin está visible en el navbar
    const adminButton = page.locator('a[href="/admin/analytics"]').first()
    await expect(adminButton).toBeVisible()
    await expect(adminButton).toContainText('Admin')
  })

  test('should navigate to analytics page when clicking Admin button', async ({ page }) => {
    // Login como admin
    await page.fill('input[type="email"]', 'admin@clarify.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Click en Admin
    await page.click('a[href="/admin/analytics"]').first()

    // Esperar que la URL cambie a analytics
    await page.waitForURL('/admin/analytics')
    await expect(page).toHaveURL('/admin/analytics')

    // Verificar que el título de Analytics está visible
    await expect(page.locator('h1')).toContainText(/Analytics|Admin/i)
  })

  test('should display sidebar with Analytics and Config links', async ({ page }) => {
    // Login como admin
    await page.fill('input[type="email"]', 'admin@clarify.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Navegar a analytics
    await page.click('a[href="/admin/analytics"]').first()
    await page.waitForURL('/admin/analytics')

    // Verificar que el sidebar existe
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // Verificar enlace de Analytics en sidebar
    const analyticsLink = sidebar.locator('a[href="/admin/analytics"]')
    await expect(analyticsLink).toBeVisible()
    await expect(analyticsLink).toContainText('Analytics')

    // Verificar enlace de Configuración en sidebar
    const configLink = sidebar.locator('a[href="/admin/config"]')
    await expect(configLink).toBeVisible()
    await expect(configLink).toContainText(/Config|Configuración/i)

    // Verificar enlace para volver al Dashboard
    const dashboardLink = sidebar.locator('a[href="/dashboard"]')
    await expect(dashboardLink).toBeVisible()
    await expect(dashboardLink).toContainText(/Dashboard/i)
  })

  test('should navigate from Analytics to Config using sidebar', async ({ page }) => {
    // Login como admin
    await page.fill('input[type="email"]', 'admin@clarify.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Ir a Analytics
    await page.click('a[href="/admin/analytics"]').first()
    await page.waitForURL('/admin/analytics')

    // Click en Configuración en el sidebar
    const configLink = page.locator('aside a[href="/admin/config"]')
    await configLink.click()

    // Esperar navegación a Config
    await page.waitForURL('/admin/config')
    await expect(page).toHaveURL('/admin/config')

    // Verificar que estamos en la página de configuración
    await expect(page.locator('h1')).toContainText(/Config|Configuración/i)
  })

  test('should navigate back to Dashboard from admin section', async ({ page }) => {
    // Login como admin
    await page.fill('input[type="email"]', 'admin@clarify.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Ir a Analytics
    await page.click('a[href="/admin/analytics"]').first()
    await page.waitForURL('/admin/analytics')

    // Click en Volver al Dashboard
    const dashboardLink = page.locator('aside a[href="/dashboard"]')
    await dashboardLink.click()

    // Esperar navegación al dashboard
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should redirect non-admin users from admin pages', async ({ page }) => {
    // Login como usuario normal
    await page.fill('input[type="email"]', 'user@clarify.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Intentar acceder directamente a /admin/analytics
    await page.goto('/admin/analytics')

    // Debería ser redirigido al dashboard o home
    await expect(page).not.toHaveURL('/admin/analytics')
  })

  test('should not display Admin button for non-admin users', async ({ page }) => {
    // Login como usuario normal
    await page.fill('input[type="email"]', 'user@clarify.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Verificar que el botón Admin NO está visible
    const adminButton = page.locator('a[href="/admin/analytics"]').first()
    await expect(adminButton).not.toBeVisible()
  })

  test('should highlight active sidebar item based on current route', async ({ page }) => {
    // Login como admin
    await page.fill('input[type="email"]', 'admin@clarify.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Ir a Analytics
    await page.click('a[href="/admin/analytics"]').first()
    await page.waitForURL('/admin/analytics')

    // Verificar que Analytics tiene clase activa
    const analyticsLink = page.locator('aside a[href="/admin/analytics"]')
    await expect(analyticsLink).toHaveClass(/bg-secondary/)

    // Ir a Config
    const configLink = page.locator('aside a[href="/admin/config"]')
    await configLink.click()
    await page.waitForURL('/admin/config')

    // Verificar que Config tiene clase activa
    await expect(configLink).toHaveClass(/bg-secondary/)
  })
})
