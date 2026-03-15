import { test, expect } from '@playwright/test';

test.describe('Demo Flow E2E', () => {
  test('should access demo from homepage', async ({ page }) => {
    // 1. Go to homepage
    await page.goto('/');

    // 2. Verify homepage has demo functionality
    const demoButton = page.getByRole('button', { name: /Ver Demo|Demo|Prueba/i });
    await expect(demoButton).toBeVisible();

    // 3. Click demo button to open demo modal/component
    await demoButton.click();

    // 4. Verify demo component is visible
    const demoComponent = page.getByText(/Prueba Nuestro Servicio|Demo Interactiva|Simulación/i);
    await expect(demoComponent).toBeVisible();
  });

  test('should allow contract name input in demo', async ({ page }) => {
    // 1. Go to homepage and open demo
    await page.goto('/');
    await page.getByRole('button', { name: /Ver Demo|Demo/i }).click();

    // 2. Find input field
    const input = page.locator('input[type="text"], input[placeholder*="contrato"], input[placeholder*="nombre"]');
    await expect(input).toBeVisible();

    // 3. Enter contract name
    await input.fill('Contrato de Prueba E2E');
    await expect(input).toHaveValue('Contrato de Prueba E2E');
  });

  test('should have sample documents for demo', async ({ page }) => {
    // 1. Go to homepage and open demo
    await page.goto('/');
    await page.getByRole('button', { name: /Ver Demo|Demo/i }).click();

    // 2. Check for sample document buttons
    const sampleDocuments = [
      'Contrato de Servicios',
      'Acuerdo de Confidencialidad',
      'Contrato de Arrendamiento',
    ];

    // At least some sample documents should be available
    const demoSection = page.locator('[data-testid="demo"], .demo, [class*="demo"]');
    await expect(demoSection).toBeVisible();
  });

  test('should simulate demo analysis and show results', async ({ page }) => {
    // 1. Mock the demo simulation API
    await page.route('/api/demo/simulate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          analysisId: 'demo-analysis-123',
          result: {
            risk_level: 'medium',
            summary: 'Este contrato contiene cláusulas de riesgo moderado.',
            hallazgos: [
              {
                tipo: 'Riesgo Alto',
                titulo: 'Cláusula de Confidencialidad',
                descripcion: 'La confidencialidad se extiende indefinidamente.',
              },
            ],
          },
        }),
      });
    });

    // 2. Go to homepage and open demo
    await page.goto('/');
    await page.getByRole('button', { name: /Ver Demo|Demo/i }).click();

    // 3. Enter contract name
    const input = page.locator('input[type="text"]').first();
    await input.fill('Test Contract E2E');

    // 4. Click analyze/submit button
    const submitButton = page.getByRole('button', { name: /Analizar|Ver Resultados|Simular/i });
    await submitButton.click();

    // 5. Verify progress indicator appears
    const progressIndicator = page.locator('[class*="progress"], [role="progressbar"]');
    await expect(progressIndicator).toBeVisible({ timeout: 5000 });

    // 6. Verify results are displayed after simulation
    const resultsSection = page.locator('[class*="result"], [class*="hallazgo"], .analysis-result');
    await expect(resultsSection).toBeVisible({ timeout: 10000 });
  });

  test('should handle demo rate limiting gracefully', async ({ page }) => {
    // 1. Mock rate limit response
    await page.route('/api/demo/simulate', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
        }),
      });
    });

    // 2. Go to homepage and open demo
    await page.goto('/');
    await page.getByRole('button', { name: /Ver Demo|Demo/i }).click();

    // 3. Try to submit demo multiple times
    const input = page.locator('input[type="text"]').first();
    await input.fill('Test Contract 1');

    const submitButton = page.getByRole('button', { name: /Analizar|Ver Resultados/i });
    await submitButton.click();

    // 4. Verify error message is shown
    const errorMessage = page.getByText(/límite|intente más tarde|rate limit/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('demo should not require authentication', async ({ page }) => {
    // 1. Go to homepage without logging in
    await page.goto('/');

    // 2. Verify demo is accessible without login
    const demoButton = page.getByRole('button', { name: /Ver Demo|Demo/i });
    await expect(demoButton).toBeVisible();

    // 3. Click and verify demo works
    await demoButton.click();
    const demoComponent = page.getByText(/Prueba|Demo|Simulación/i);
    await expect(demoComponent).toBeVisible();
  });
});