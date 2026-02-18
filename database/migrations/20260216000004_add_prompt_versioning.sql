-- Migration: Add Prompt Versioning & Configuration
-- Date: 2026-02-16
-- Description: Create configurations table for dynamic prompt settings

-- Create configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- Enable RLS
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- Policies for Admin access
CREATE POLICY "Allow admins to read configurations" ON configurations
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin'
  );

CREATE POLICY "Allow admins to update configurations" ON configurations
  FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin'
  );

CREATE POLICY "Allow admins to insert configurations" ON configurations
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON configurations
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Seed default configuration
INSERT INTO configurations (key, value, description)
VALUES (
  'prompt_settings',
  '{
    "promptVersion": "v2",
    "tiers": {
      "basic": {
        "model": "gpt-4o-mini",
        "credits": 1,
        "tokenLimits": { "input": 8000, "output": 2500 }
      },
      "premium": {
        "model": "gpt-5-mini",
        "credits": 3,
        "tokenLimits": { "input": 35000, "output": 10000 }
      },
      "forensic": {
        "model": "gpt-5",
        "credits": 10,
        "tokenLimits": { "input": 120000, "output": 30000 }
      }
    },
    "features": {
      "preprocessing": true,
      "tokenDebug": false
    }
  }'::jsonb,
  'Global settings for prompt versions, models, and token limits'
)
ON CONFLICT (key) DO NOTHING;
