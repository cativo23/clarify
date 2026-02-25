import { describe, it, expect, vi, beforeEach } from 'vitest';
import { H3Event } from 'h3';
import { serverSupabaseClient } from '#supabase/server';
import { readBody, createError } from 'h3';

// Mock dependencies
vi.mock('#supabase/server', () => ({
  serverSupabaseClient: vi.fn(),
}));

vi.mock('h3', async () => {
  const actual = await vi.importActual('h3');
  return {
    ...actual,
    readBody: vi.fn(),
    createError: vi.fn((error) => new Error(error.message)),
  };
});

vi.mock('../../server/utils/redirect-validation', () => ({
  createSafeRedirectUrl: vi.fn((path, params) => `${path}?${new URLSearchParams(params)}`),
}));

vi.mock('../../server/utils/stripe-client', () => ({
  createCheckoutSession: vi.fn(),
  CREDIT_PACKAGES: [
    { id: 'pack_5', credits: 5, price: 4.99, priceId: 'price_5credits' },
    { id: 'pack_10', credits: 10, price: 8.99, priceId: 'price_10credits' },
    { id: 'pack_25', credits: 25, price: 19.99, priceId: 'price_25credits' },
  ],
}));

describe('Stripe Checkout Endpoint', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
  };

  let mockEvent: H3Event;
  let mockSupabaseClient: any;
  let mockSupabaseAuth: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseAuth = {
      getUser: vi.fn(),
    };

    mockSupabaseClient = {
      auth: mockSupabaseAuth,
    };

    (serverSupabaseClient as vi.Mock).mockReturnValue(mockSupabaseClient);

    mockEvent = {
      context: {},
    } as unknown as H3Event;
  });

  it('should create a checkout session for valid credit package', async () => {
    // Mock authenticated user
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // Mock request body
    (readBody as vi.Mock).mockResolvedValue({ packageId: 'pack_5' });

    // Mock checkout session creation
    const mockCheckoutSession = {
      id: 'cs_test_abc123',
      url: 'https://checkout.stripe.com/pay/cs_test_abc123',
    };

    const { createCheckoutSession } = await import('../../server/utils/stripe-client');
    vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession);

    // Import and call the actual handler
    const handler = (await import('../../server/api/stripe/checkout.post')).default;

    const result = await handler(mockEvent);

    expect(result).toEqual({
      success: true,
      data: {
        sessionId: 'cs_test_abc123',
        sessionUrl: 'https://checkout.stripe.com/pay/cs_test_abc123',
      },
    });
  });

  it('should reject unauthorized access', async () => {
    // Mock unauthenticated user
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } });

    const handler = (await import('../../server/api/stripe/checkout.post')).default;

    await expect(async () => {
      await handler(mockEvent);
    }).rejects.toThrow('Unauthorized');
  });

  it('should reject missing packageId parameter', async () => {
    // Mock authenticated user
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // Mock empty request body
    (readBody as vi.Mock).mockResolvedValue({});

    const handler = (await import('../../server/api/stripe/checkout.post')).default;

    await expect(async () => {
      await handler(mockEvent);
    }).rejects.toThrow('Missing required fields');
  });

  it('should reject invalid credit package', async () => {
    // Mock authenticated user
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // Mock request body with invalid package
    (readBody as vi.Mock).mockResolvedValue({ packageId: 'invalid_package' });

    // Import and mock the checkout session to throw an error
    const { createCheckoutSession } = await import('../../server/utils/stripe-client');
    vi.mocked(createCheckoutSession).mockRejectedValue(new Error('Invalid package'));

    const handler = (await import('../../server/api/stripe/checkout.post')).default;

    await expect(async () => {
      await handler(mockEvent);
    }).rejects.toThrow('Invalid package');
  });
});