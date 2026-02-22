-- Migration: Add Forensic Tier
-- Date: 2026-02-22
-- Description: Add 'forensic' to analysis_type CHECK constraint

-- Update analyses table CHECK constraint to include 'forensic'
ALTER TABLE analyses
DROP CONSTRAINT IF EXISTS analyses_analysis_type_check;

ALTER TABLE analyses
ADD CONSTRAINT analyses_analysis_type_check
CHECK (analysis_type IN ('basic', 'premium', 'forensic'));

-- Update transactions table CHECK constraint to include 'forensic' for credit_pack_type
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_credit_pack_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_credit_pack_type_check
CHECK (credit_pack_type IN ('standard', 'forensic'));
