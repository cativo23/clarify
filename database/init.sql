-- Clarify Database Schema
-- This script initializes the PostgreSQL database for local development

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (mirrors Supabase Auth in local development)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    summary_json JSONB,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_id TEXT,
    credits_purchased INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_id ON transactions(stripe_payment_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a demo user for testing (password: demo123)
INSERT INTO users (email, credits) 
VALUES ('demo@clarify.app', 10)
ON CONFLICT (email) DO NOTHING;

-- Function to process analysis and deduct credit atomically
-- Uses FOR UPDATE lock to prevent race conditions
CREATE OR REPLACE FUNCTION process_analysis_transaction(
    p_contract_name TEXT,
    p_file_url TEXT,
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
        p_file_url,
        p_summary_json,
        p_risk_level,
        'pending',
        p_credit_cost,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_analysis_id;

    RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable Realtime for the analyses table
ALTER PUBLICATION supabase_realtime ADD TABLE analyses;

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Clarify database initialized successfully!';
    RAISE NOTICE 'Demo user created: demo@clarify.app with 10 credits';
END $$;
