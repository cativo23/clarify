-- Migration: create pricing_tables
CREATE TABLE IF NOT EXISTS pricing_tables (
    id serial PRIMARY KEY,
    model text UNIQUE NOT NULL,
    input_cost numeric NOT NULL DEFAULT 0,
    cached_input_cost numeric NOT NULL DEFAULT 0,
    output_cost numeric NOT NULL DEFAULT 0,
    last_updated timestamptz NOT NULL DEFAULT now()
);

-- Seed prices (values are per-token rates = price_per_1M / 1_000_000)
-- Using the 'Standard' pricing tier as baseline for these models.
INSERT INTO pricing_tables (model, input_cost, cached_input_cost, output_cost)
VALUES
  ('gpt-5',        0.00000125, 0.000000125, 0.00001),  -- 1.25 / 0.125 / 10.00 per 1M
  ('gpt-5-mini',   0.00000025, 0.000000025, 0.000002), -- 0.25 / 0.025 / 2.00 per 1M
  ('gpt-4o',       0.00000250, 0.000001250, 0.00001),  -- 2.50 / 1.25 / 10.00 per 1M
  ('gpt-4o-mini',  0.00000015, 0.000000075, 0.0000006) -- 0.15 / 0.075 / 0.60 per 1M
ON CONFLICT (model) DO NOTHING;
