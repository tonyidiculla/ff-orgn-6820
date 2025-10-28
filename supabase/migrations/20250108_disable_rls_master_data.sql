-- Check and disable RLS on public tables for testing
-- This allows authenticated users to read from these tables

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Disable RLS on user_to_role_assignment
ALTER TABLE public.user_to_role_assignment DISABLE ROW LEVEL SECURITY;

-- Disable RLS on platform_roles  
ALTER TABLE public.platform_roles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
