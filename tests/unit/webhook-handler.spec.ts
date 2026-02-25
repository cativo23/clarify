import { describe, it, expect, vi, beforeEach } from 'vitest';
import { H3Event } from 'h3';
import { readRawBody, getHeader } from 'h3';
import Stripe from 'stripe';

// Mock dependencies
vi.mock('h3', async () => {
  const actual = await vi.importActual('h3');
  return {
    ...actual,
    readRawBody: vi.fn(),
    getHeader: vi.fn(),
    createError: vi.fn((error) => new Error(error.message)),
  };
});

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

vi.mock('../../server/utils/stripe-client', () => ({
  handleWebhookEvent: vi.fn(),
}));

vi.mock('../../server/utils/rate-limit', () => ({
  applyRateLimit: vi.fn(),
  RateLimitPresets: {
    payment: { points: 10, duration: 60 }
  }
}));

vi.mock('../../server/utils/error-handler', () => ({
  handleApiError: vi.fn(),
}));

// Mock useRuntimeConfig
const mockUseRuntimeConfig = vi.fn();
vi.mock('@nuxt/bridge-schema', () => ({
  useRuntimeConfig: mockUseRuntimeConfig,
}));
vi.mock('#app', () => ({
  useRuntimeConfig: mockUseRuntimeConfig,
}));

describe('Stripe Webhook Handler', () => {
  let mockEvent: H3Event;
  let mockStripe: Stripe;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEvent = {
      context: {
        clientIp: '127.0.0.1'
      },
      node: {
        req: {
          headers: {},
        },
      },
    } as unknown as H3Event;

    mockStripe = {
      webhooks: {
        constructEvent: vi.fn(),
      },
    } as unknown as Stripe;

    // Mock runtime config
    mockUseRuntimeConfig.mockReturnValue({
      stripeSecretKey: 'sk_test_123',
      stripeWebhookSecret: 'whsec_123',
    } as any);

    // Mock the Stripe constructor to return our mock
    (vi.fn() as any).mockReturnValue(mockStripe);
  });

  it('should verify webhook signature and process valid event', async () => {
    // Mock raw body
    const rawBody = '{"id":"evt_test","object":"event","type":"checkout.session.completed"}';
    (readRawBody as vi.Mock).mockResolvedValue(rawBody);

    // Mock header
    (getHeader as vi.Mock).mockReturnValue('valid_signature');

    // Mock successful signature verification
    const mockVerifiedEvent = {
      id: 'evt_test',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test',
          metadata: {
            user_id: 'user_123',
            credits: '5',
          },
        },
      },
    };

    const { default: StripeCtor } = await import('stripe');
    vi.mocked(StripeCtor).mockReturnValue(mockStripe);
    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(mockVerifiedEvent);

    // Mock the handleWebhookEvent function
    const { handleWebhookEvent } = await import('../../server/utils/stripe-client');
    vi.mocked(handleWebhookEvent).mockResolvedValue(undefined);

    // Import and call the actual handler
    const handler = (await import('../../server/api/stripe/webhook.post')).default;

    const result = await handler(mockEvent);

    // Verify that the webhook event was processed
    expect(handleWebhookEvent).toHaveBeenCalledWith(mockVerifiedEvent);
    expect(result).toEqual({ received: true });
  });

  it('should reject invalid webhook signature', async () => {
    // Mock raw body
    const rawBody = '{"id":"evt_test","object":"event","type":"checkout.session.completed"}';
    (readRawBody as vi.Mock).mockResolvedValue(rawBody);

    // Mock header
    (getHeader as vi.Mock).mockReturnValue('invalid_signature');

    // Mock Stripe constructor
    const { default: StripeCtor } = await import('stripe');
    vi.mocked(StripeCtor).mockReturnValue(mockStripe);

    // Mock signature verification failure
    const signatureError = new Error('Signature verification failed');
    (signatureError as any).type = 'StripeSignatureVerificationError';
    vi.mocked(mockStripe.webhooks.constructEvent).mockImplementation(() => {
      throw signatureError;
    });

    // Import and call the actual handler
    const handler = (await import('../../server/api/stripe/webhook.post')).default;

    // Mock the error handler to avoid throwing
    const { handleApiError } = await import('../../server/utils/error-handler');

    await handler(mockEvent);

    // Verify error was handled appropriately
    expect(handleApiError).toHaveBeenCalled();
  });

  it('should reject request with missing body or signature', async () => {
    // Mock missing body and signature
    (readRawBody as vi.Mock).mockResolvedValue(null);
    (getHeader as vi.Mock).mockReturnValue(null);

    // Import and call the actual handler
    const handler = (await import('../../server/api/stripe/webhook.post')).default;

    await expect(async () => {
      await handler(mockEvent);
    }).rejects.toThrow('Invalid webhook request');
  });

  it('should process different event types correctly', async () => {
    // Mock raw body for payment intent event
    const rawBody = '{"id":"evt_test","object":"event","type":"payment_intent.succeeded"}';
    (readRawBody as vi.Mock).mockResolvedValue(rawBody);

    // Mock header
    (getHeader as vi.Mock).mockReturnValue('valid_signature');

    // Mock different event type
    const mockVerifiedEvent = {
      id: 'evt_test',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test',
        },
      },
    };

    const { default: StripeCtor } = await import('stripe');
    vi.mocked(StripeCtor).mockReturnValue(mockStripe);
    vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(mockVerifiedEvent);

    // Mock the handleWebhookEvent function
    const { handleWebhookEvent } = await import('../../server/utils/stripe-client');
    vi.mocked(handleWebhookEvent).mockResolvedValue(undefined);

    // Import and call the actual handler
    const handler = (await import('../../server/api/stripe/webhook.post')).default;

    await handler(mockEvent);

    // Verify that the webhook event was processed
    expect(handleWebhookEvent).toHaveBeenCalledWith(mockVerifiedEvent);
  });
});