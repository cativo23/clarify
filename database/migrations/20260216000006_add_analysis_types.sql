-- Migration: Add Analysis Types (Basic/Premium)
-- Date: 2026-02-16
-- Description: Add analysis_type column and update RPC function

-- 1. Add analysis_type column to analyses table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='analyses' AND column_name='analysis_type'
    ) THEN
        ALTER TABLE analyses 
        ADD COLUMN analysis_type TEXT DEFAULT 'premium' 
        CHECK (analysis_type IN ('basic', 'premium'));
    END IF;
END $$;

-- 2. Add analysis_type column to transactions (for tracking purchase type)
DO $$
BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='transactions' AND column_name='credit_pack_type'
    ) THEN
        ALTER TABLE transactions 
        ADD COLUMN credit_pack_type TEXT DEFAULT 'standard';
    END IF;
END $$;
