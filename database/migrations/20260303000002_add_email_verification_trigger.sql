-- Migration: Email Verification Trigger for Free Credits
-- Date: March 3, 2026
-- Description: Implements a PostgreSQL trigger function to award 10 free credits when a user verifies their email.
--              Uses atomic operations to prevent race conditions and ensures users only get awarded once.

-- Create function to award free credits when email is confirmed
CREATE OR REPLACE FUNCTION award_free_credits_on_email_verification()
RETURNS TRIGGER AS $$
DECLARE
    v_current_credits INTEGER;
    v_free_credits_awarded BOOLEAN;
BEGIN
    -- Check if email is being confirmed for the first time (changing from NULL to a value)
    -- This occurs when auth.users.email_confirmed_at changes from NULL to a timestamp
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        -- Lock the user row to prevent race conditions
        -- Select current credits and free_credits_awarded status with FOR UPDATE lock
        SELECT credits, COALESCE(free_credits_awarded, FALSE)
        INTO v_current_credits, v_free_credits_awarded
        FROM users
        WHERE id = NEW.id
        FOR UPDATE;

        -- Only award if free_credits_awarded is FALSE or NULL (hasn't been awarded yet)
        IF v_free_credits_awarded = FALSE THEN
            -- Update the user with 10 additional credits and set the award flags
            UPDATE users
            SET
                credits = credits + 10,
                free_credits_awarded = TRUE,
                free_credits_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;

            -- Log the action for debugging purposes
            RAISE NOTICE 'Awarded 10 free credits to user % on email confirmation', NEW.id;
        ELSE
            -- Log that user was already awarded credits
            RAISE NOTICE 'User % already received free credits, skipping award', NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users table to detect email confirmation
-- This trigger will fire when email_confirmed_at changes from NULL to a timestamp
-- Note: Supabase auth triggers require service_role permissions
DROP TRIGGER IF EXISTS trigger_award_free_credits_on_email_verification ON auth.users;

CREATE TRIGGER trigger_award_free_credits_on_email_verification
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION award_free_credits_on_email_verification();

-- Grant execute permission to service_role (Supabase auth triggers run with service_role)
GRANT EXECUTE ON FUNCTION award_free_credits_on_email_verification() TO service_role;

DO $$
BEGIN
    RAISE NOTICE '20260303000002 Migration: Email verification trigger created';
    RAISE NOTICE '- Created atomic function award_free_credits_on_email_verification';
    RAISE NOTICE '- Added FOR UPDATE lock to prevent race conditions';
    RAISE NOTICE '- Added trigger on auth.users.email_confirmed_at update';
END $$;
