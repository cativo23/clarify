// pricing_tables stores real per-TOKEN USD rates (price_per_1M / 1_000_000 —
// see database/migrations/20260216000005_create_pricing_tables.sql), so this
// multiplies directly rather than dividing tokens by 1000 first — that stray
// division previously under-reported AI cost on the admin dashboard by 1000x
// (found and fixed 2026-09-26, server/api/admin/costs.get.ts).
export function calculateAiCost(
  inputTokens: number,
  outputTokens: number,
  price: { input: number; output: number },
): number {
  return inputTokens * price.input + outputTokens * price.output;
}
