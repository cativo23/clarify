-- Migration: Fix Realtime REPLICA IDENTITY for analyses table
-- Date: 2026-02-23
-- Description: Enable REPLICA IDENTITY FULL for Supabase Realtime UPDATE events
-- Issue: Phase 2 UAT Issue #5 (blocker) - status not updating

-- Enable REPLICA IDENTITY FULL for analyses table
-- This ensures Postgres replicates all changed columns in UPDATE events,
-- not just the primary key
ALTER TABLE analyses REPLICA IDENTITY FULL;

-- Verify the change (optional, for debugging)
-- SELECT relname, relreplident FROM pg_class WHERE relname = 'analyses';
