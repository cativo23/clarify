-- Migration: Fix analysis_type not persisted by process_analysis_transaction_with_free_check
-- Date: September 30, 2026
-- Description: The RPC function that creates every analysis row accepts p_analysis_type
--               as a parameter but never includes it in the INSERT statement, so every
--               analysis silently gets the analyses.analysis_type column's DEFAULT value
--               ('premium') regardless of what tier was actually requested (basic, premium,
--               or forensic). Discovered live during plan 13-06's LAUNCH-04 verification:
--               a completed Forensic analysis with a fully populated summary_json
--               (analisis_cruzado, omisiones, mapa_estructural all non-empty) rendered
--               none of its three Forensic-only UI sections, because
--               pages/analyze/[id].vue's `isForensic` computed checks
--               `analysis.analysis_type === "forensic"`, which was never true.
--
-- This is a CREATE OR REPLACE FUNCTION only — no ALTER TABLE, no column changes, no data
-- migration of existing rows (out of scope here; existing mislabeled rows are a separate,
-- optional backfill decision for Carlos).

CREATE OR REPLACE FUNCTION process_analysis_transaction_with_free_check(
    p_user_id UUID,
    p_contract_name TEXT,
    p_storage_path TEXT,
    p_analysis_type TEXT DEFAULT 'basic',
    p_credit_cost INTEGER DEFAULT 0,
    p_is_free BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_analysis_id UUID;
    v_current_credits INTEGER;
    v_monthly_free_used BOOLEAN;
    v_reset_date DATE;
    v_current_month_start DATE;
BEGIN
    -- Ensure user is authenticated and matches the provided user_id
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: User ID mismatch';
    END IF;

    -- Validate that free analysis only applies to basic tier
    IF p_is_free = TRUE AND p_analysis_type != 'basic' THEN
        RAISE EXCEPTION 'Free analysis only available for basic tier';
    END IF;

    -- Get current month start date
    SELECT DATE_TRUNC('month', CURRENT_DATE)::DATE INTO v_current_month_start;

    -- Lock the user row FOR UPDATE to prevent race conditions
    SELECT credits, monthly_free_analysis_used, monthly_free_analysis_reset_date
    INTO v_current_credits, v_monthly_free_used, v_reset_date
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    -- If this is a free analysis, verify user qualifies
    IF p_is_free = TRUE THEN
        -- Check if user already used their free analysis this month
        IF v_monthly_free_used = TRUE THEN
            RAISE EXCEPTION 'Monthly free analysis already used';
        END IF;

        -- Verify we're still in the same reset period (or reset if new month)
        IF v_reset_date IS NULL OR v_reset_date < v_current_month_start THEN
            -- Reset the monthly flag for the new month
            UPDATE users
            SET monthly_free_analysis_used = FALSE,
                monthly_free_analysis_reset_date = v_current_month_start
            WHERE id = p_user_id;

            v_monthly_free_used := FALSE;
        END IF;

        -- Double-check after potential reset
        IF v_monthly_free_used = TRUE THEN
            RAISE EXCEPTION 'Monthly free analysis already used';
        END IF;
    ELSE
        -- Paid analysis - verify user has enough credits
        IF v_current_credits IS NULL OR v_current_credits < p_credit_cost THEN
            RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', p_credit_cost, v_current_credits;
        END IF;

        -- Deduct credits for paid analysis
        UPDATE users
        SET credits = credits - p_credit_cost,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id;
    END IF;

    -- If this is a free analysis, mark it as used atomically (row is still locked)
    IF p_is_free = TRUE THEN
        UPDATE users
        SET monthly_free_analysis_used = TRUE,
            monthly_free_analysis_reset_date = v_current_month_start,
            monthly_free_analysis_counter = monthly_free_analysis_counter + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id;
    END IF;

    -- Insert analysis record
    -- FIX: analysis_type is now persisted from p_analysis_type (was previously
    -- omitted, silently falling back to the column's DEFAULT 'premium').
    INSERT INTO analyses (
        user_id,
        contract_name,
        file_url,
        analysis_type,
        summary_json,
        risk_level,
        status,
        credits_used,
        created_at
    ) VALUES (
        p_user_id,
        p_contract_name,
        p_storage_path,
        p_analysis_type,
        NULL,
        NULL,
        'pending',
        p_credit_cost,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_analysis_id;

    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users (unchanged from original migration)
GRANT EXECUTE ON FUNCTION process_analysis_transaction_with_free_check(UUID, TEXT, TEXT, TEXT, INTEGER, BOOLEAN) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE 'process_analysis_transaction_with_free_check function updated';
    RAISE NOTICE '- analysis_type is now persisted on every new analysis row';
    RAISE NOTICE '- Existing rows are NOT backfilled by this migration';
END $$;
