-- Migration: Fix Realtime Replication Identity
-- Date: 2026-02-23
-- Description: Ensure replica identity is set correctly for Supabase Realtime on analyses table

-- Set replica identity to FULL for the analyses table
-- This ensures all columns are sent in realtime events (needed for client-side updates)
ALTER TABLE analyses REPLICA IDENTITY FULL;

-- Verify the publication exists and includes the analyses table
-- (This is idempotent - safe to run multiple times)
DO $$
BEGIN
  -- Check if the publication exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Check if analyses table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND relname = 'analyses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE analyses;
  END IF;
END $$;

-- Verify configuration
-- Run this query to check: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
