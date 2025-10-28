-- Verify and ensure UPDATE permissions on public.profiles
-- Run this to check if the issue is permissions

-- Check current policies on profiles table
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- If no policies exist or they're too restrictive, disable RLS temporarily for testing
-- (You can re-enable later with proper policies)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Ensure permissions are granted
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
