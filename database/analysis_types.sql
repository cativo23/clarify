-- Migration to support Basic and Premium Analysis
-- Adds analysis_type column and updates the RPC function

-- 1. Add analysis_type column to analyses table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analyses' AND column_name='analysis_type') THEN
        ALTER TABLE analyses ADD COLUMN analysis_type TEXT DEFAULT 'premium' CHECK (analysis_type IN ('basic', 'premium'));
    END IF;
END $$;

-- 2. Update process_analysis_transaction to handle dynamic credits and analysis type
CREATE OR REPLACE FUNCTION process_analysis_transaction(
    p_user_id UUID,
    p_contract_name TEXT,
    p_file_url TEXT,
    p_analysis_type TEXT DEFAULT 'premium',
    p_credit_cost INTEGER DEFAULT 2,
    p_summary_json JSONB DEFAULT NULL,
    p_risk_level TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_analysis_id UUID;
BEGIN
    -- 1. Check if user has enough credits
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND credits >= p_credit_cost) THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- 2. Deduct credits
    UPDATE users 
    SET credits = credits - p_credit_cost 
    WHERE id = p_user_id;

    -- 3. Insert analysis
    INSERT INTO analyses (
        user_id,
        contract_name,
        file_url,
        summary_json,
        risk_level,
        status,
        credits_used,
        analysis_type,
        created_at
    ) VALUES (
        p_user_id,
        p_contract_name,
        p_file_url,
        p_summary_json,
        p_risk_level,
        'pending',
        p_credit_cost,
        p_analysis_type,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_analysis_id;

    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
