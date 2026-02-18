-- Migration: Create Admin Views
-- Date: 2026-02-16
-- Description: Create views for admin dashboard analytics

-- Admin users summary view
CREATE OR REPLACE VIEW admin_users_summary AS
SELECT
  u.id,
  u.email,
  u.credits,
  COUNT(a.id) AS analyses_count,
  MAX(a.created_at) AS last_analysis_at
FROM users u
LEFT JOIN analyses a ON a.user_id = u.id
GROUP BY u.id, u.email, u.credits;

-- Enable RLS on the view (inherits from base tables)
-- Admin access is controlled via API layer (requireAdmin middleware)
