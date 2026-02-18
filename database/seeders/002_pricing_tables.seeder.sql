-- Database Seeder: Pricing Tables
-- Purpose: Initialize AI model pricing configuration
-- Run: npm run db:seed

-- Pricing for different AI models
-- Costs are per 1000 tokens (standard pricing format)

INSERT INTO pricing_tables (model, input_cost, output_cost, tier, created_at)
VALUES 
    -- GPT-5 Models (Latest)
    ('gpt-5', 0.000075, 0.000300, 'premium', CURRENT_TIMESTAMP),
    ('gpt-5-mini', 0.000015, 0.000060, 'standard', CURRENT_TIMESTAMP),
    ('gpt-5.1', 0.000080, 0.000320, 'premium', CURRENT_TIMESTAMP),
    ('gpt-5.2', 0.000100, 0.000400, 'premium', CURRENT_TIMESTAMP),
    
    -- O-Series Reasoning Models
    ('o1', 0.000150, 0.000600, 'premium', CURRENT_TIMESTAMP),
    ('o1-mini', 0.000030, 0.000120, 'standard', CURRENT_TIMESTAMP),
    ('o3', 0.000200, 0.000800, 'premium', CURRENT_TIMESTAMP),
    ('o3-mini', 0.000040, 0.000160, 'standard', CURRENT_TIMESTAMP),
    
    -- GPT-4 Legacy Models
    ('gpt-4o', 0.000050, 0.000150, 'legacy', CURRENT_TIMESTAMP),
    ('gpt-4o-mini', 0.000015, 0.000060, 'legacy', CURRENT_TIMESTAMP),
    ('gpt-4.1', 0.000080, 0.000240, 'legacy', CURRENT_TIMESTAMP)
ON CONFLICT (model) DO UPDATE SET
    input_cost = EXCLUDED.input_cost,
    output_cost = EXCLUDED.output_cost,
    tier = EXCLUDED.tier;
