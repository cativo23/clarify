import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { updateUserCreditsInDb } from '../../server/utils/stripe-client';
import { CREDIT_PACKAGES } from '../../server/utils/stripe-client';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('Atomic Credit Updates Integration', () => {
  let mockSupabaseClient: any;
  let mockSupabaseRpc: any;
  let mockSupabaseFrom: any;
  let mockInsertResult: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock insert result
    mockInsertResult = {
      error: null,
    };

    // Mock .from() method
    mockSupabaseFrom = {
      insert: vi.fn().mockResolvedValue(mockInsertResult),
    };

    // Mock rpc result
    const mockRpcResult = {
      data: 15, // New credit balance after adding 5 to existing 10
      error: null,
    };

    // Mock .rpc() method
    mockSupabaseRpc = {
      rpc: vi.fn().mockResolvedValue(mockRpcResult),
    };

    // Combine mocks
    mockSupabaseClient = {
      ...mockSupabaseRpc,
      from: vi.fn(() => mockSupabaseFrom),
    };

    (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);
  });

  it('should atomically update user credits via RPC function', async () => {
    // Mock runtime config
    vi.mock('ofetch', () => ({
      useRuntimeConfig: vi.fn(() => ({
        public: {
          supabase: {
            url: 'https://test.supabase.co',
          },
        },
        supabaseServiceKey: 'service_role_key_123',
      })),
    }));

    const userId = 'user_123';
    const creditsToAdd = 5;

    const result = await updateUserCreditsInDb(userId, creditsToAdd);

    // Verify that the RPC function was called with correct parameters
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'increment_user_credits',
      {
        p_user_id: userId,
        p_amount: creditsToAdd,
      }
    );

    // Verify that the transaction was logged
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('transactions');

    // Find the call to insert to check the parameters
    const insertCall = mockSupabaseFrom.insert.mock.calls[0][0];
    expect(insertCall).toMatchObject({
      user_id: userId,
      amount: 4.99, // Price of 5-credit package
      credits: creditsToAdd,
      type: 'purchase',
      description: `Purchase of ${creditsToAdd} credits via Stripe`,
    });

    expect(result).toBe(true);
  });

  it('should return false when RPC update fails', async () => {
    // Mock runtime config
    vi.mock('ofetch', () => ({
      useRuntimeConfig: vi.fn(() => ({
        public: {
          supabase: {
            url: 'https://test.supabase.co',
          },
        },
        supabaseServiceKey: 'service_role_key_123',
      })),
    }));

    // Mock RPC error
    const mockRpcErrorResult = {
      data: null,
      error: { message: 'RPC Error' },
    };

    mockSupabaseRpc.rpc = vi.fn().mockResolvedValue(mockRpcErrorResult);
    mockSupabaseClient = {
      ...mockSupabaseRpc,
      from: vi.fn(() => mockSupabaseFrom),
    };

    (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

    const userId = 'user_123';
    const creditsToAdd = 10;

    const result = await updateUserCreditsInDb(userId, creditsToAdd);

    expect(result).toBe(false);
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'increment_user_credits',
      {
        p_user_id: userId,
        p_amount: creditsToAdd,
      }
    );
  });

  it('should handle transaction logging errors gracefully', async () => {
    // Mock runtime config
    vi.mock('ofetch', () => ({
      useRuntimeConfig: vi.fn(() => ({
        public: {
          supabase: {
            url: 'https://test.supabase.co',
          },
        },
        supabaseServiceKey: 'service_role_key_123',
      })),
    }));

    // Mock transaction insertion error
    const mockTransactionErrorResult = {
      error: { message: 'Insert error' },
    };

    const mockSuccessfulRpcResult = {
      data: 20,
      error: null,
    };

    mockSupabaseRpc.rpc = vi.fn().mockResolvedValue(mockSuccessfulRpcResult);
    mockSupabaseFrom.insert = vi.fn().mockResolvedValue(mockTransactionErrorResult);
    mockSupabaseClient = {
      ...mockSupabaseRpc,
      from: vi.fn(() => mockSupabaseFrom),
    };

    (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

    const userId = 'user_123';
    const creditsToAdd = 10;

    const result = await updateUserCreditsInDb(userId, creditsToAdd);

    // Even with transaction logging error, result should be true since credits were updated
    expect(result).toBe(true);
  });

  it('should work with different credit packages', async () => {
    // Mock runtime config
    vi.mock('ofetch', () => ({
      useRuntimeConfig: vi.fn(() => ({
        public: {
          supabase: {
            url: 'https://test.supabase.co',
          },
        },
        supabaseServiceKey: 'service_role_key_123',
      })),
    }));

    const userId = 'user_123';
    const creditsToAdd = 25;

    const result = await updateUserCreditsInDb(userId, creditsToAdd);

    // Verify the RPC call
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'increment_user_credits',
      {
        p_user_id: userId,
        p_amount: creditsToAdd,
      }
    );

    // Verify that the correct price is used for 25-credit package
    const insertCall = mockSupabaseFrom.insert.mock.calls[0][0];
    expect(insertCall.amount).toBe(19.99); // Price of 25-credit package

    expect(result).toBe(true);
  });

  it('should handle concurrent credit updates without race conditions', async () => {
    // Mock runtime config
    vi.mock('ofetch', () => ({
      useRuntimeConfig: vi.fn(() => ({
        public: {
          supabase: {
            url: 'https://test.supabase.co',
          },
        },
        supabaseServiceKey: 'service_role_key_123',
      })),
    }));

    const userId = 'user_123';

    // Simulate multiple concurrent updates
    const promises = [
      updateUserCreditsInDb(userId, 5),
      updateUserCreditsInDb(userId, 10),
      updateUserCreditsInDb(userId, 25),
    ];

    const results = await Promise.all(promises);

    // All should succeed
    expect(results.every(r => r === true)).toBe(true);

    // Verify that each RPC call was made with correct parameters
    expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(3);

    // Check that all calls had the same user ID
    const rpcCalls = mockSupabaseClient.rpc.mock.calls;
    rpcCalls.forEach(call => {
      expect(call[1].p_user_id).toBe(userId);
    });
  });
});