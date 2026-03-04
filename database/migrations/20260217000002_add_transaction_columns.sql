-- Migration: Add missing columns to transactions table
-- Date: 2026-02-17
-- Description: Add type and description columns to transactions table for Stripe integration

-- Add type and description columns to transactions table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='transactions' AND column_name='type'
    ) THEN
        ALTER TABLE transactions
        ADD COLUMN type TEXT DEFAULT 'purchase' CHECK (type IN ('purchase', 'refund', 'adjustment'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='transactions' AND column_name='description'
    ) THEN
        ALTER TABLE transactions
        ADD COLUMN description TEXT;
    END IF;
END $$;