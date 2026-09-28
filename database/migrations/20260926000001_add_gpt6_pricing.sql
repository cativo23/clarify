-- Migration: Add GPT-6 model pricing
-- Date: 2026-09-26
-- Description: gpt-5 and gpt-5-mini retire from the OpenAI API on 2026-12-11.
-- Tiers migrated to gpt-6-luna (basic), gpt-6-sol (premium), gpt-6-astra (forensic).
-- Adds their pricing rows; existing gpt-5/gpt-5-mini rows are left in place so
-- historical analyses still resolve a cost.

-- Seed prices (values are per-token rates = price_per_1M / 1_000_000)
INSERT INTO pricing_tables (model, input_cost, cached_input_cost, output_cost)
VALUES
  ('gpt-6-luna',  0.0000001,  0.00000001, 0.0000005),
  ('gpt-6-sol',   0.000002,   0.0000002,  0.00001),
  ('gpt-6-astra', 0.00001,    0.000001,   0.00005)
ON CONFLICT (model) DO UPDATE SET
  input_cost = EXCLUDED.input_cost,
  cached_input_cost = EXCLUDED.cached_input_cost,
  output_cost = EXCLUDED.output_cost,
  last_updated = NOW();
