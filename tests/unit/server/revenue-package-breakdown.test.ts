/**
 * Revenue by_package breakdown invariance test (Plan 10-04 / ADMIN-02)
 *
 * Verifies that admin/revenue.get.ts now derives the by_package
 * breakdown from credit_transactions.credits_purchased rather than
 * from inferred amount price-bands. The load-bearing assertion is
 * Test 2 (price-change invariance): identical credits_purchased
 * with mutated amounts must produce identical by_package shape —
 * proving Stripe price changes cannot silently drift the breakdown.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Mock Nuxt server globals at definition time ---
const queryRef: { value: Record<string, string> } = { value: { range: "month" } };

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
type FromResult = { data: unknown; error: unknown };

const supabaseState: {
  fromResults: Record<string, FromResult>;
} = {
  fromResults: {
    transactions: { data: [], error: null },
  },
};

function makeChain(table: string) {
  const result = supabaseState.fromResults[table] || { data: [], error: null };
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    gte: () => chain,
    lte: () => chain,
    order: () => Promise.resolve(result),
  };
  return chain;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => makeChain(table)),
  })),
}));

type Tx = {
  id: string;
  user_id: string;
  type: "purchase" | "refund" | "adjustment";
  status: "completed";
  amount: number;
  credits_purchased: number | null;
  created_at: string;
};

function buildTx(partial: Partial<Tx> & Pick<Tx, "id" | "amount" | "credits_purchased">): Tx {
  return {
    user_id: "user-1",
    type: "purchase",
    status: "completed",
    created_at: new Date().toISOString(),
    ...partial,
  } as Tx;
}

function seed(transactions: Tx[]) {
  supabaseState.fromResults.transactions = { data: transactions, error: null };
}

async function invokeHandler() {
  const mod = await import("../../../server/api/admin/revenue.get");
  const handler = mod.default as (event: unknown) => Promise<any>;
  return handler({} as unknown);
}

function packageMap(byPackage: Array<{ package: string; count: number }>): Record<string, number> {
  return byPackage.reduce<Record<string, number>>((acc, p) => {
    acc[p.package] = p.count;
    return acc;
  }, {});
}

function sortByName(byPackage: Array<{ package: string }>) {
  return [...byPackage].sort((a, b) => a.package.localeCompare(b.package));
}

describe("Revenue by_package breakdown — credits_purchased mapping (ADMIN-02)", () => {
  beforeEach(() => {
    supabaseState.fromResults = { transactions: { data: [], error: null } };
    queryRef.value = { range: "month" };
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_KEY = "test-service-key";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Test 1: standard prices map to canonical buckets via credits_purchased", async () => {
    seed([
      buildTx({ id: "t1", credits_purchased: 5, amount: 4.99 }),
      buildTx({ id: "t2", credits_purchased: 10, amount: 9.99 }),
      buildTx({ id: "t3", credits_purchased: 25, amount: 19.99 }),
    ]);

    const res = await invokeHandler();
    const counts = packageMap(res.by_package);

    expect(counts["5 credits"]).toBe(1);
    expect(counts["10 credits"]).toBe(1);
    expect(counts["25 credits"]).toBe(1);
    expect(res.by_package).toHaveLength(3);
  });

  it("Test 2: price-change invariance — mutated amounts (99.00/199.00/299.00) produce identical buckets", async () => {
    // Run A: real prices
    seed([
      buildTx({ id: "a1", credits_purchased: 5, amount: 4.99 }),
      buildTx({ id: "a2", credits_purchased: 10, amount: 9.99 }),
      buildTx({ id: "a3", credits_purchased: 25, amount: 19.99 }),
    ]);
    const resA = await invokeHandler();
    const shapeA = JSON.stringify(
      sortByName(resA.by_package).map((p: any) => ({ package: p.package, count: p.count })),
    );

    // Run B: simulate a Stripe price hike — amounts wildly changed,
    // credits_purchased stable. The invariant: same buckets, same counts.
    seed([
      buildTx({ id: "b1", credits_purchased: 5, amount: 99.00 }),
      buildTx({ id: "b2", credits_purchased: 10, amount: 199.00 }),
      buildTx({ id: "b3", credits_purchased: 25, amount: 299.00 }),
    ]);
    const resB = await invokeHandler();
    const shapeB = JSON.stringify(
      sortByName(resB.by_package).map((p: any) => ({ package: p.package, count: p.count })),
    );

    expect(shapeB).toBe(shapeA);
    // Sanity: amounts above (99.00, 199.00, 299.00) would all bucket as
    // "other" under the legacy amount-band logic — this assertion only
    // passes because the new logic keys on credits_purchased.
    const countsB = packageMap(resB.by_package);
    expect(countsB["5 credits"]).toBe(1);
    expect(countsB["10 credits"]).toBe(1);
    expect(countsB["25 credits"]).toBe(1);
    expect(countsB["other"]).toBeUndefined();
  });

  it("Test 3: row with credits_purchased: null buckets as 'other' (no crash)", async () => {
    seed([
      buildTx({ id: "n1", credits_purchased: null, amount: 4.99 }),
    ]);

    const res = await invokeHandler();
    const counts = packageMap(res.by_package);
    expect(counts["other"]).toBe(1);
    expect(counts["5 credits"]).toBeUndefined();
  });

  it("Test 4: row with unknown credits_purchased (7) buckets as 'other'", async () => {
    seed([
      buildTx({ id: "u1", credits_purchased: 7, amount: 6.99 }),
    ]);

    const res = await invokeHandler();
    const counts = packageMap(res.by_package);
    expect(counts["other"]).toBe(1);
  });

  it("Test 5: refund/adjustment rows are excluded from by_package (existing behavior preserved)", async () => {
    seed([
      buildTx({ id: "p1", credits_purchased: 5, amount: 4.99, type: "purchase" }),
      buildTx({ id: "r1", credits_purchased: 5, amount: 4.99, type: "refund" }),
      buildTx({ id: "a1", credits_purchased: 0, amount: 0, type: "adjustment" }),
    ]);

    const res = await invokeHandler();
    const counts = packageMap(res.by_package);
    // Only the purchase contributes to by_package
    expect(counts["5 credits"]).toBe(1);
    // Total purchase rows in by_package = 1 (refund + adjustment excluded)
    const totalPurchaseCount = res.by_package.reduce((s: number, p: any) => s + p.count, 0);
    expect(totalPurchaseCount).toBe(1);
  });
});
