-- Migration: Add INSERT policy for users table
-- Date: February 17, 2026
-- Description: Allows authenticated users to create their own profile
--              Required for email verification flow

-- Allow users to insert their own profile during signup
-- This policy works with Supabase Auth which creates the user first,
-- then our trigger/hook inserts the profile
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Also allow service role to create user profiles (for admin creation, etc)
-- Service role bypasses RLS anyway, but this is explicit
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

COMMENT ON POLICY "Users can insert own profile" ON public.users IS 
'Allows authenticated users to create their own profile during signup. Works with email verification.';
