-- Migration: Fix H4 - Non-Atomic Credit Updates (Stripe)
-- Date: February 17, 2026
-- Description: Adds a secure, atomic function to increment user credits
--              preventing race conditions during webhook processing.

CREATE OR REPLACE FUNCTION increment_user_credits(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_new_credits INTEGER;
BEGIN
    -- Perform atomic update and return the new balance
    UPDATE users
    SET credits = credits + p_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id
    RETURNING credits INTO v_new_credits;

    RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- This function is intended to be called by the Stripe webhook (service role)
-- but we can grant execute to the service_role specifically if needed.
-- In Supabase, the service_role can execute any SECURITY DEFINER function.
