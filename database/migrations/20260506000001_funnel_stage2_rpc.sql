-- Migration: Funnel Stage 2 RPC — get_email_verified_users_in_range
-- Date: May 6, 2026
-- Description: Creates the missing SECURITY DEFINER RPC consumed by
--              server/api/admin/funnel.get.ts:75-81 so admin funnel
--              Stage 2 ("Email Verified") reflects real verification
--              counts from auth.users.email_confirmed_at instead of
--              falling back to public.users.created_at (which makes
--              Stage 2 always equal Stage 1 → fabricated 100% rate).
--              Closes ADMIN-01 audit gap (v1.1-MILESTONE-AUDIT.md).

-- Drop any prior definition with a conflicting signature so re-runs are idempotent.
DROP FUNCTION IF EXISTS public.get_email_verified_users_in_range(timestamptz, timestamptz);

-- Parameter names MUST match call site: { start_date, end_date }
-- Returned columns MUST include `id` (call site reads `verifiedData?.length`
-- and `verifiedData.map(u => u.id)` at funnel.get.ts:99-100).
CREATE OR REPLACE FUNCTION public.get_email_verified_users_in_range(
    start_date timestamptz,
    end_date   timestamptz
)
RETURNS TABLE (
    id uuid,
    email_confirmed_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT u.id, au.email_confirmed_at
    FROM public.users u
    JOIN auth.users au ON au.id = u.id
    WHERE au.email_confirmed_at IS NOT NULL
      AND au.email_confirmed_at >= start_date
      AND au.email_confirmed_at <= end_date;
$$;

-- Lock down default PUBLIC execute, then grant only the principals that
-- legitimately call this function: the API uses the service_role key,
-- and we keep `authenticated` for resilience (admin gate enforced at API layer).
REVOKE ALL ON FUNCTION public.get_email_verified_users_in_range(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_verified_users_in_range(timestamptz, timestamptz) TO authenticated, service_role;

DO $$
BEGIN
    RAISE NOTICE '20260506000001 Migration: Funnel Stage 2 RPC created';
    RAISE NOTICE '- Created public.get_email_verified_users_in_range(timestamptz, timestamptz)';
    RAISE NOTICE '- LANGUAGE sql, SECURITY DEFINER, search_path = public, auth';
    RAISE NOTICE '- Granted EXECUTE to authenticated, service_role';
    RAISE NOTICE '- Closes ADMIN-01 audit gap (Stage 2 fabricated 100% rate)';
END $$;
