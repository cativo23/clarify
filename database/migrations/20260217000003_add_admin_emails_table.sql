-- Migration: Add admin_emails table for multi-admin support
-- Created: 2026-02-17
-- Purpose: Support multiple admins without hardcoding emails in config
-- Security: Part of HIGH priority fix for admin authentication bypass

-- Create admin_emails table
CREATE TABLE IF NOT EXISTS admin_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_emails_email_active
ON admin_emails(email)
WHERE is_active = true;

-- Add RLS (Row Level Security) policies
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read (needed for admin check)
CREATE POLICY "Authenticated users can read admin_emails"
ON admin_emails
FOR SELECT
TO authenticated
USING (true);

-- Only existing admins can modify admin_emails
CREATE POLICY "Admins can insert admin_emails"
ON admin_emails
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_emails ae
        JOIN auth.users u ON u.email = ae.email
        WHERE ae.is_active = true
        AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- Only existing admins can update admin_emails
CREATE POLICY "Admins can update admin_emails"
ON admin_emails
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_emails ae
        JOIN auth.users u ON u.email = ae.email
        WHERE ae.is_active = true
        AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- Only existing admins can delete admin_emails
CREATE POLICY "Admins can delete admin_emails"
ON admin_emails
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_emails ae
        JOIN auth.users u ON u.email = ae.email
        WHERE ae.is_active = true
        AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_admin_emails_updated_at
    BEFORE UPDATE ON admin_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant access to service role (for backend operations)
GRANT ALL ON admin_emails TO service_role;

-- Comment documenting the security purpose
COMMENT ON TABLE admin_emails IS
    'Stores admin user emails for authentication. Used with config.adminEmail for defense-in-depth admin auth.';

COMMENT ON COLUMN admin_emails.is_active IS
    'Soft delete support - set to false instead of deleting records for audit trail.';
