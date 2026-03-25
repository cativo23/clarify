-- Migration: Award Free Credits RPC Function
-- Date: March 15, 2026
-- Description: Creates an atomic RPC function to award 10 free credits to verified users.
--              This is called from profile.get.ts when a user verifies their email.

-- Create function to award free credits (atomic, prevents race conditions)
CREATE OR REPLACE FUNCTION award_free_credits(user_id uuid)
RETURNS json AS $$
DECLARE
    v_current_credits INTEGER;
    v_free_credits_awarded BOOLEAN;
    v_result json;
BEGIN
    -- Lock the user row to prevent race conditions
    SELECT credits, COALESCE(free_credits_awarded, FALSE)
    INTO v_current_credits, v_free_credits_awarded
    FROM users
    WHERE id = user_id
    FOR UPDATE;

    -- Only award if free_credits_awarded is FALSE or NULL
    IF v_free_credits_awarded = FALSE THEN
        -- Update the user with 10 additional credits and set the award flags
        UPDATE users
        SET
            credits = credits + 10,
            free_credits_awarded = TRUE,
            free_credits_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = user_id;

        -- Return success result
        v_result := json_build_object(
            'success', true,
            'credits_awarded', 10,
            'new_total', v_current_credits + 10,
            'user_id', user_id
        );
    ELSE
        -- User already received credits
        v_result := json_build_object(
            'success', false,
            'reason', 'already_awarded',
            'user_id', user_id
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users (they can only award credits to themselves via RLS)
GRANT EXECUTE ON FUNCTION award_free_credits(uuid) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '20260315000001 Migration: Award free credits RPC function created';
    RAISE NOTICE '- Created atomic function award_free_credits(uuid)';
    RAISE NOTICE '- Uses FOR UPDATE lock to prevent race conditions';
    RAISE NOTICE '- Grants execute to authenticated users';
END $$;
