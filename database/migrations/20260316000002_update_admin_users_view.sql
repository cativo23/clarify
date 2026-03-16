-- Migration: Update Admin Users Summary View
-- Date: 2026-03-16
-- Description: Add suspension fields to admin users summary view

-- Drop existing view first (cannot change column structure with OR REPLACE)
DROP VIEW IF EXISTS admin_users_summary CASCADE;

-- Recreate view with suspension fields
CREATE VIEW admin_users_summary AS
SELECT
  u.id,
  u.email,
  u.credits,
  u.is_suspended,
  u.suspension_reason,
  u.suspended_at,
  u.created_at,
  COUNT(a.id) AS analyses_count,
  MAX(a.created_at) AS last_analysis_at
FROM users u
LEFT JOIN analyses a ON a.user_id = u.id
GROUP BY u.id, u.email, u.credits, u.is_suspended, u.suspension_reason, u.suspended_at, u.created_at;
