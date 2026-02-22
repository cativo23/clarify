import { test, expect } from '@playwright/test';

test.describe('Analysis Flow', () => {
    // Use the authenticated state from global setup
    test.use({ storageState: 'tests/e2e/storageState.json' });

    test('should complete analysis successfully with mock API', async ({ page }) => {
        // 1. Mock the API response
        await page.route('/api/analyze', async route => {
            // Small delay to test loading state if needed
            await new Promise(resolve => setTimeout(resolve, 500));

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    riskScore: 85,
                    summary: 'This contract contains several high-risk clauses related to liability and termination.',
                    sections: [
                        { title: 'Liability', risk: 'High', content: 'Unlimited liability clause...' }
                    ]
                })
            });
        });

        // 2. Go to dashboard
        await page.goto('/dashboard');

        // 3. Upload a file
        // We need to simulate a file upload.
        // Create a dummy PDF buffer
        const buffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000157 00000 n \n0000000307 00000 n \n0000000394 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n492\n%%EOF');

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'test-contract.pdf',
            mimeType: 'application/pdf',
            buffer: buffer
        });

        // 4. Verify file selection
        await expect(page.getByText('test-contract.pdf')).toBeVisible();

        // 5. Trigger Analysis (assuming there is a button, or it auto-starts?)
        // Looking at previous context, Dropzone usually just selects. 
        // We likely need to click "Analizar" button on the dashboard.
        // Let's assume there is a button with text "Analizar" or similar.
        // Based on typical flows, it's often "Analizar Contrato"

        const analyzeButton = page.getByRole('button', { name: /Analizar|Analyze/i });
        await expect(analyzeButton).toBeVisible();
        await analyzeButton.click();

        // 6. Verify Loading State
        // Expect some loading indicator or text
        await expect(page.getByText(/Analizando|Analyzing/i)).toBeVisible();

        // 7. Verify Results
        // We expect to be redirected to /analysis/results or see results on page
        // Let's wait for the risk score "85" to appear
        await expect(page.getByText('85')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('high-risk clauses')).toBeVisible();
    });
});
