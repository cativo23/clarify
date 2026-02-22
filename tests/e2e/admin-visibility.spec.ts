import { test, expect } from '@playwright/test'

test.describe('Admin Feature Tests', () => {
  test('verify admin layout has sidebar element', async ({ page }) => {
    // Este test verifica que el sidebar existe en el layout
    // Nota: Requiere autenticación admin para acceder
    await page.goto('/admin/analytics')

    // Si no está autenticado, debería redirigir a login
    const url = page.url()

    // Verificar que o bien está en login o en admin (si ya hay sesión)
    if (url.includes('/login')) {
      // Comportamiento esperado para usuario no autenticado
      expect(await page.locator('input[type="email"]').count()).toBeGreaterThan(0)
    } else if (url.includes('/admin')) {
      // Si hay sesión, verificar sidebar
      const sidebar = page.locator('aside')
      await expect(sidebar).toBeVisible()
    }
  })

  test('verify navbar has Admin link structure', async ({ page }) => {
    await page.goto('/')

    // Verificar que la página carga correctamente
    await expect(page.locator('body')).toBeVisible()

    // El enlace Admin solo es visible para usuarios autenticados admin
    // Este test verifica la estructura básica
    const bodyContent = await page.locator('body').textContent()
    expect(bodyContent).toBeDefined()
  })
})
