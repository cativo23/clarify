-- Migration: Add Free Credit Fields for Signup and Monthly Analysis
-- Date: March 3, 2026
-- Description: Extends the users table with fields to track free credits and monthly analysis usage.
--              Creates a trigger function that awards 10 credits to new users upon email verification.

-- Add columns to users table for tracking free credits and monthly analysis usage
ALTER TABLE users
ADD COLUMN IF NOT EXISTS free_credits_awarded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS free_credits_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS monthly_free_analysis_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS monthly_free_analysis_reset_date DATE,
ADD COLUMN IF NOT EXISTS monthly_free_analysis_counter INTEGER DEFAULT 0;

-- Create function to award free credits when email is confirmed
CREATE OR REPLACE FUNCTION award_free_credits_on_email_verification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_record RECORD;
BEGIN
    -- Check if email is being confirmed for the first time (changing from NULL to a value)
    -- This occurs when auth.users.email_confirmed_at changes from NULL to a timestamp
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        -- Find the corresponding user in the public.users table
        -- Since auth.users.id is the UUID that corresponds to public.users.id
        SELECT * INTO v_user_record
        FROM users
        WHERE id = NEW.id;

        -- If user exists in public.users and hasn't received free credits yet
        IF FOUND AND v_user_record.free_credits_awarded = FALSE THEN
            -- Award 10 free credits to the user
            UPDATE users
            SET
                credits = credits + 10,
                free_credits_awarded = TRUE,
                free_credits_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;

            -- Log the action for debugging purposes
            RAISE NOTICE 'Awarded 10 free credits to user % on email confirmation', NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users table to detect email confirmation
-- This trigger will fire when email_confirmed_at changes from NULL to a timestamp
-- Note: Supabase auth triggers require service_role permissions
DROP TRIGGER IF EXISTS trigger_award_free_credits_on_email_verification
ON auth.users;

CREATE TRIGGER trigger_award_free_credits_on_email_verification
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION award_free_credits_on_email_verification();