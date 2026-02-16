CREATE VIEW admin_users_summary AS
SELECT
  u.id,
  u.email,
  u.credits,
  COUNT(a.id) AS analyses_count,
  MAX(a.created_at) AS last_analysis_at
FROM users u
LEFT JOIN analyses a ON a.user_id = u.id
GROUP BY u.id, u.email, u.credits;
