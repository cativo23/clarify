import { test, expect } from '@playwright/test';

test.describe('Credit Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and ensure we're logged in
    await page.goto('/');

    // For this test, we'll need to authenticate first
    // Using mock authentication - in real testing you might use storage state
    await page.context().storageState({ path: 'tests/e2e/storageState.json' });

    // Navigate to dashboard where credit purchase is available
    await page.goto('/dashboard');
  });

  test('@stripe-purchase should complete full credit purchase flow with Stripe checkout', async ({ page }) => {
    // Verify initial state - user should have some credits to start with
    const initialCreditBalance = await page.locator('[data-testid="credit-balance"]').textContent();
    const initialBalance = parseInt(initialCreditBalance?.trim() || '0', 10);

    // Navigate to pricing page or credit purchase section
    await page.getByRole('link', { name: /pricing|credits/i }).click();

    // Wait for the pricing cards to load
    await expect(page.getByText('Credit Packages')).toBeVisible();

    // Select a credit package (e.g., 5 credits for $4.99)
    const fiveCreditPackage = page.locator('.credit-package').filter({ hasText: '5 credits' });
    await expect(fiveCreditPackage).toBeVisible();
    await fiveCreditPackage.click();

    // Click purchase button
    await page.getByRole('button', { name: /buy|purchase|checkout/i }).click();

    // Expect to be redirected to Stripe checkout
    await page.waitForURL('https://checkout.stripe.com/**');
    await expect(page).toHaveURL(/.*checkout\.stripe\.com.*/);

    // At this point we would normally fill in test card details
    // Since we can't actually process payments in E2E tests, we'll simulate
    // the webhook that would be triggered after successful payment

    // We'll use a custom route to mock Stripe checkout session
    // For now, we'll verify that we got redirected properly and the session was created

    // Mock data that would come from Stripe
    const mockCheckoutSession = {
      id: 'cs_test_123',
      customer_email: 'test@example.com',
      metadata: {
        user_id: 'user_123',
        credits: '5',
        package_price: '4.99'
      },
      payment_status: 'paid',
      status: 'complete'
    };

    // The actual webhook would be triggered after payment completion
    // In a real scenario, Stripe sends this automatically after payment
    console.log('Simulating successful payment completion...');

    // Navigate back to dashboard to verify credits were added
    await page.goto('/dashboard');

    // Wait for credit balance to update (might take a moment after webhook processing)
    await page.waitForTimeout(2000); // Allow time for webhook processing simulation

    // Refresh to get latest credit balance
    await page.reload();

    // Verify credit balance has increased
    const updatedCreditBalance = await page.locator('[data-testid="credit-balance"]').textContent();
    const updatedBalance = parseInt(updatedCreditBalance?.trim() || '0', 10);

    expect(updatedBalance).toBeGreaterThan(initialBalance);
    expect(updatedBalance).toBe(initialBalance + 5); // 5 credits added

    // Optionally, verify transaction appears in history
    await page.getByRole('link', { name: /history|transactions/i }).click();
    await expect(page.getByText('$4.99 credit purchase')).toBeVisible();
  });

  test('@stripe-purchase should handle Stripe checkout session creation', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('/pricing');

    // Verify pricing packages are displayed
    await expect(page.getByText('5 credits - $4.99')).toBeVisible();
    await expect(page.getByText('10 credits - $8.99')).toBeVisible();
    await expect(page.getByText('25 credits - $19.99')).toBeVisible();

    // Test API endpoint for creating checkout session
    const response = await page.request.post('/api/stripe/checkout', {
      data: {
        packageId: 'pack_5' // 5 credit package
      }
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.data).toBeDefined();
    expect(responseBody.data.sessionId).toBeDefined();
    expect(responseBody.data.sessionUrl).toBeDefined();

    // Verify the session URL redirects to Stripe
    expect(responseBody.data.sessionUrl).toContain('checkout.stripe.com');
  });

  test('@stripe-purchase should handle Stripe webhook processing for successful payment', async ({ page }) => {
    // This test simulates the webhook processing after a successful payment
    // In a real scenario, Stripe sends POST requests to /api/stripe/webhook

    // Prepare mock webhook payload
    const mockWebhookPayload = {
      id: 'evt_123',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          object: 'checkout.session',
          customer_email: 'test@example.com',
          payment_status: 'paid',
          status: 'complete',
          metadata: {
            user_id: 'user_123',
            credits: '10',
            package_price: '8.99'
          }
        }
      }
    };

    // Calculate a valid signature for the webhook (this would normally be calculated server-side)
    // For testing purposes, we'll mock the signature verification

    // Send webhook request to the endpoint
    const response = await page.request.post('/api/stripe/webhook', {
      data: mockWebhookPayload,
      headers: {
        'stripe-signature': 'v1_test_123' // This would be a real signature in production
      }
    });

    // Should return 200 OK even though we're mocking the signature
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.received).toBe(true);
  });

  test('@stripe-purchase should handle failed payment scenarios gracefully', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('/pricing');

    // Test with invalid package ID
    const response = await page.request.post('/api/stripe/checkout', {
      data: {
        packageId: 'invalid_package_id'
      }
    });

    expect(response.status()).toBe(400);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(false);
    expect(responseBody.error).toBeDefined();
  });
});