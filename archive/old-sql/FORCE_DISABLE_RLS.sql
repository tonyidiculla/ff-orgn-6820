-- FORCE DISABLE ALL RLS - Complete removal of all policies

-- Step 1: Check current RLS status
SELECT 
    'Current RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'organizations';

-- Step 2: Drop ALL existing policies (just in case there are multiple)
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organizations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', policy_record.policyname);
    END LOOP;
END $$;

-- Step 3: Disable RLS
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify it's disabled
SELECT 
    'RLS Status After Disable' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'organizations';

-- Step 5: Check if any policies still exist
SELECT 
    'Remaining Policies' as check_type,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'organizations';

SELECT '✅ RLS should now be completely disabled' as status;
