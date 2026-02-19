import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3001';
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Perform login
    // Note: We are using a test account credentials. In a real CI, these should be env vars.
    // For this local env, we'll use the hardcoded admin credentials commonly used in dev.
    try {
        await page.goto(baseURL + '/login');
        await page.getByLabel('Email').fill('admin@clarify.com');
        await page.getByLabel('Contraseña').fill('password123');
        await page.getByRole('button', { name: 'Ingresar' }).click();

        // Wait for redirect to dashboard to ensure cookie is set
        await page.waitForURL('**/dashboard');

        // Save signed-in state to 'storageState.json'.
        await page.context().storageState({ path: 'tests/e2e/storageState.json' });
    } catch (error) {
        console.error('Global setup failed:', error);
        // Don't throw, enabling tests to try anyway (or fail individually)
    }

    await browser.close();
}

export default globalSetup;
