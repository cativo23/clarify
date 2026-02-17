-- Migration: Fix C1 - Race Condition in Credit Deduction (TOCTOU)
-- Date: February 16, 2026
-- Description: Updates process_analysis_transaction to accept p_credit_cost parameter
--              and use FOR UPDATE lock to prevent race conditions

-- Drop the old function (if exists with old signature)
DROP FUNCTION IF EXISTS process_analysis_transaction(UUID, TEXT, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS process_analysis_transaction(UUID, TEXT, TEXT, TEXT, INTEGER, JSONB, TEXT);
DROP FUNCTION IF EXISTS process_analysis_transaction(TEXT, TEXT, TEXT, INTEGER, JSONB, TEXT);

-- Create the updated function with atomic credit handling and IDOR protection
CREATE OR REPLACE FUNCTION process_analysis_transaction(
    p_contract_name TEXT,
    p_storage_path TEXT,
    p_analysis_type TEXT DEFAULT 'premium',
    p_credit_cost INTEGER DEFAULT 3,
    p_summary_json JSONB DEFAULT NULL,
    p_risk_level TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_analysis_id UUID;
    v_current_credits INTEGER;
BEGIN
    -- [SECURITY FIX] Get user ID securely from the session
    v_user_id := auth.uid();
    
    -- Ensure user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User must be logged in';
    END IF;

    -- 1. Lock the user row FOR UPDATE to prevent concurrent modifications
    SELECT credits INTO v_current_credits
    FROM users
    WHERE id = v_user_id
    FOR UPDATE;

    -- 2. Check if user has enough credits
    IF v_current_credits IS NULL OR v_current_credits < p_credit_cost THEN
        RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', p_credit_cost, v_current_credits;
    END IF;

    -- 3. Deduct credits atomically (row is still locked)
    UPDATE users
    SET credits = credits - p_credit_cost,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_user_id;

    -- 4. Insert analysis with actual credit cost
    INSERT INTO analyses (
        user_id,
        contract_name,
        file_url,
        summary_json,
        risk_level,
        status,
        credits_used,
        created_at
    ) VALUES (
        v_user_id,
        p_contract_name,
        p_storage_path,
        p_summary_json,
        p_risk_level,
        'pending',
        p_credit_cost,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_analysis_id;

    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_analysis_transaction(TEXT, TEXT, TEXT, INTEGER, JSONB, TEXT) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE 'C1 Migration: process_analysis_transaction updated with atomic credit handling';
    RAISE NOTICE '- Added FOR UPDATE lock to prevent race conditions';
    RAISE NOTICE '- Function now accepts and uses p_credit_cost parameter';
    RAISE NOTICE '- Added search_path = public for SECURITY DEFINER safety';
END $$;
