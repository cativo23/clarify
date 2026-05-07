/**
 * Funnel Stage 2 RPC smoke test (Plan 10-02 / ADMIN-01)
 *
 * Verifies that admin funnel.get.ts now reflects real
 * email-verification counts via the get_email_verified_users_in_range
 * RPC, AND that when the RPC fails the fallback path emits an
 * actionable console.warn (so operators can spot the
 * fabricated 100% verification rate symptom).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Mock Nuxt server globals at definition time ---
// funnel.get.ts uses defineEventHandler/getQuery/createError as globals.
const queryRef: { value: Record<string, string> } = { value: { range: "30d" } };

vi.stubGlobal(
  "defineEventHandler",
  (handler: (event: unknown) => unknown) => handler,
);
vi.stubGlobal("getQuery", (_event: unknown) => queryRef.value);
vi.stubGlobal("createError", (opts: { statusCode?: number; message?: string }) => {
  const err = new Error(opts.message || "error");
  (err as any).statusCode = opts.statusCode;
  return err;
});

// --- Mock auth + admin client wrappers ---
vi.mock("../../../server/utils/auth", () => ({
  requireAdmin: vi.fn(async () => ({ id: "admin-1", email: "admin@example.com" })),
}));

vi.mock("../../../server/utils/admin-supabase", () => ({
  getAdminSupabaseClient: vi.fn(() => ({
    getConfig: vi.fn(async () => ({ data: null })),
  })),
}));

// --- Mock @supabase/supabase-js with a chainable stub ---
// State container the test mutates per-case before invoking the handler.
type RpcResult = { data: unknown; error: unknown };
type FromResult = { data: unknown; error: unknown };

const supabaseState: {
  rpcResult: RpcResult;
  fromResults: Record<string, FromResult>;
} = {
  rpcResult: { data: [], error: null },
  fromResults: {
    users: { data: [], error: null },
    analyses: { data: [], error: null },
    transactions: { data: [], error: null },
  },
};

function makeChain(table: string) {
  // Each .from(...).select().gte().lte() chain ends in a thenable that
  // resolves to the seeded fromResults entry.
  const result = supabaseState.fromResults[table] || { data: [], error: null };
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    gte: () => chain,
    lte: () => chain,
    order: () => chain,
    then: (resolve: (v: FromResult) => void) => resolve(result),
  };
  return chain;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(async (_name: string, _args: unknown) => supabaseState.rpcResult),
    from: vi.fn((table: string) => makeChain(table)),
  })),
}));

// --- Helpers ---
function resetState() {
  supabaseState.rpcResult = { data: [], error: null };
  supabaseState.fromResults = {
    users: { data: [], error: null },
    analyses: { data: [], error: null },
    transactions: { data: [], error: null },
  };
  queryRef.value = { range: "30d" };
}

async function invokeHandler() {
  // Re-import each call so the handler binds against current mocks.
  const mod = await import("../../../server/api/admin/funnel.get");
  const handler = mod.default as (event: unknown) => Promise<any>;
  return handler({} as unknown);
}

describe("Funnel Stage 2 RPC integration", () => {
  beforeEach(() => {
    resetState();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_KEY = "test-service-key";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports Stage 1 (Signups) count from users table", async () => {
    supabaseState.fromResults.users = {
      data: Array.from({ length: 10 }, (_v, i) => ({
        id: `user-${i + 1}`,
        created_at: "2026-04-01T00:00:00Z",
      })),
      error: null,
    };
    supabaseState.rpcResult = {
      data: Array.from({ length: 5 }, (_v, i) => ({
        id: `user-${i + 1}`,
        email_confirmed_at: "2026-04-02T00:00:00Z",
      })),
      error: null,
    };

    const res = await invokeHandler();
    const signups = res.funnel.find((s: any) => s.stage === "Signups");
    expect(signups).toBeDefined();
    expect(signups.count).toBe(10);
  });

  it("reports Stage 2 (Email Verified) count from RPC, distinct from Stage 1", async () => {
    supabaseState.fromResults.users = {
      data: Array.from({ length: 10 }, (_v, i) => ({
        id: `user-${i + 1}`,
        created_at: "2026-04-01T00:00:00Z",
      })),
      error: null,
    };
    supabaseState.rpcResult = {
      data: Array.from({ length: 5 }, (_v, i) => ({
        id: `user-${i + 1}`,
        email_confirmed_at: "2026-04-02T00:00:00Z",
      })),
      error: null,
    };

    const res = await invokeHandler();
    const verified = res.funnel.find((s: any) => s.stage === "Email Verified");
    const verifiedCount = verified.count;
    expect(verifiedCount).toBe(5);
  });

  it("Stage 2 count < Stage 1 count when mixed seed (asserts ADMIN-01 closed)", async () => {
    supabaseState.fromResults.users = {
      data: Array.from({ length: 10 }, (_v, i) => ({
        id: `user-${i + 1}`,
        created_at: "2026-04-01T00:00:00Z",
      })),
      error: null,
    };
    supabaseState.rpcResult = {
      data: Array.from({ length: 5 }, (_v, i) => ({
        id: `user-${i + 1}`,
        email_confirmed_at: "2026-04-02T00:00:00Z",
      })),
      error: null,
    };

    const res = await invokeHandler();
    const stage1 = res.funnel.find((s: any) => s.stage === "Signups").count;
    const stage2 = res.funnel.find((s: any) => s.stage === "Email Verified").count;
    expect(stage2).toBeLessThan(stage1);
  });

  it("warns and falls back to created_at when RPC errors (operator-actionable log)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    supabaseState.fromResults.users = {
      data: Array.from({ length: 7 }, (_v, i) => ({
        id: `user-${i + 1}`,
        created_at: "2026-04-01T00:00:00Z",
      })),
      error: null,
    };
    supabaseState.rpcResult = {
      data: null,
      error: { message: "function get_email_verified_users_in_range does not exist" },
    };

    const res = await invokeHandler();

    // console.warn was emitted with the migration ID and fallback message
    expect(warnSpy).toHaveBeenCalled();
    const warnArgs = warnSpy.mock.calls.flat().join(" ");
    expect(warnArgs).toContain("RPC failed; falling back");
    expect(warnArgs).toContain("20260506000001");

    // Fallback executed: Stage 2 count equals Stage 1 (degraded but logged).
    const stage1 = res.funnel.find((s: any) => s.stage === "Signups").count;
    const stage2 = res.funnel.find((s: any) => s.stage === "Email Verified").count;
    expect(stage2).toBe(stage1);
  });
});
