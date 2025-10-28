-- Check ALL policies on hospital_master table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'hospitals';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'hospitals';

-- Check for any custom functions in public schema
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    p.prokind as function_kind
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 't')  -- Regular functions and trigger functions only
ORDER BY p.proname;
