-- Migration: Create Pricing Tables
-- Date: 2026-02-16
-- Description: Add pricing configuration for AI models

CREATE TABLE IF NOT EXISTS pricing_tables (
    id SERIAL PRIMARY KEY,
    model TEXT UNIQUE NOT NULL,
    input_cost NUMERIC NOT NULL DEFAULT 0,
    cached_input_cost NUMERIC NOT NULL DEFAULT 0,
    output_cost NUMERIC NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pricing_tables ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read pricing
CREATE POLICY "pricing_tables_select_authenticated" ON pricing_tables
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed prices (values are per-token rates = price_per_1M / 1_000_000)
INSERT INTO pricing_tables (model, input_cost, cached_input_cost, output_cost)
VALUES
  ('gpt-5',        0.00000125, 0.000000125, 0.00001),
  ('gpt-5-mini',   0.00000025, 0.000000025, 0.000002),
  ('gpt-5.1',      0.00000133, 0.000000133, 0.0000107),
  ('gpt-5.2',      0.00000167, 0.000000167, 0.0000133),
  ('gpt-4o',       0.00000250, 0.000001250, 0.00001),
  ('gpt-4o-mini',  0.00000015, 0.000000075, 0.0000006),
  ('gpt-4.1',      0.00000200, 0.000001000, 0.000008),
  ('o1',           0.00001500, 0.000007500, 0.00006),
  ('o1-mini',      0.00000300, 0.000001500, 0.000012),
  ('o3',           0.00002000, 0.000010000, 0.00008),
  ('o3-mini',      0.00000400, 0.000002000, 0.000016)
ON CONFLICT (model) DO NOTHING;
