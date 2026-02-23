-- Migration: Add Forensic Tier
-- Date: 2026-02-22
-- Description: Add 'forensic' to analysis_type CHECK constraint

-- Update analyses table CHECK constraint to include 'forensic'
ALTER TABLE analyses
DROP CONSTRAINT IF EXISTS analyses_analysis_type_check;

ALTER TABLE analyses
ADD CONSTRAINT analyses_analysis_type_check
CHECK (analysis_type IN ('basic', 'premium', 'forensic'));