-- Migration: Add User Suspension Fields
-- Date: 2026-03-16
-- Description: Add suspension fields to users table for admin user management

-- Add suspension fields to users table
DO $$
BEGIN
    -- Add is_suspended column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_suspended'
    ) THEN
        ALTER TABLE users
        ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;

    -- Add suspension_reason column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='suspension_reason'
    ) THEN
        ALTER TABLE users
        ADD COLUMN suspension_reason TEXT;
    END IF;

    -- Add suspended_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='suspended_at'
    ) THEN
        ALTER TABLE users
        ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add index for suspended users lookup
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended);
