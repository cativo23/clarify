-- Migration: Add Async Analysis Support
-- Date: 2026-02-16
-- Description: Add status columns and enable realtime for async job processing

-- 1. Add status and error_message columns to analyses table (if not exist)
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 2. Allow summary_json and risk_level to be null initially (while pending)
ALTER TABLE analyses ALTER COLUMN summary_json DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN risk_level DROP NOT NULL;

-- 3. Enable Realtime for the analyses table
-- This allows the frontend to listen for changes via Supabase subscribe()
ALTER PUBLICATION supabase_realtime ADD TABLE analyses;
