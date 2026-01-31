-- Migration to support asynchronous analysis
-- Run this in your Supabase SQL Editor

-- 1. Add status and error_message columns to analyses table
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 2. Allow summary_json and risk_level to be null initially (while pending)
ALTER TABLE analyses ALTER COLUMN summary_json DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN risk_level DROP NOT NULL;

-- 3. Update the transaction function to handle the new status
CREATE OR REPLACE FUNCTION process_analysis_transaction(
    p_user_id UUID,
    p_contract_name TEXT,
    p_file_url TEXT,
    p_summary_json JSONB DEFAULT NULL,
    p_risk_level TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_analysis_id UUID;
BEGIN
    -- 1. Check if user has credits
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND credits >= 1) THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- 2. Deduct credit
    UPDATE users 
    SET credits = credits - 1 
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
        created_at
    ) VALUES (
        p_user_id,
        p_contract_name,
        p_file_url,
        p_summary_json,
        p_risk_level,
        'pending',
        1,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_analysis_id;

    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Realtime for the analyses table
-- This allows the frontend to listen for changes via Supabase subscribe()
ALTER PUBLICATION supabase_realtime ADD TABLE analyses;
