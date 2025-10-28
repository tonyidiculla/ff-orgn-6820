-- CHECK AND FIX ALL RLS POLICIES (SELECT, INSERT, UPDATE, DELETE)

-- Step 1: Check what policies exist
SELECT 
    '=== Current Policies ===' as section,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'organizations'
ORDER BY cmd;

-- Step 2: Drop ALL policies
DROP POLICY IF EXISTS "organizations_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_policy_temp" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_policy_temp" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_policy_temp" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete_policy_temp" ON public.organizations;

-- Step 3: Create permissive policies for ALL operations
-- SELECT: Allow all authenticated users to view organizations
CREATE POLICY "temp_select_all" 
ON public.organizations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Allow all authenticated users to create organizations
CREATE POLICY "temp_insert_all" 
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Allow all authenticated users to update organizations
CREATE POLICY "temp_update_all" 
ON public.organizations
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Allow all authenticated users to delete organizations
CREATE POLICY "temp_delete_all" 
ON public.organizations
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Step 4: Verify new policies
SELECT 
    '=== New Policies Created ===' as section,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'organizations'
ORDER BY cmd;

-- Step 5: Test SELECT
SELECT 
    '=== Test: Can You See Organizations? ===' as section,
    COUNT(*) as organization_count
FROM public.organizations;

SELECT '✅ All operations should now be allowed for authenticated users' as status;
SELECT '⚠️  These are TEMPORARY permissive policies for development' as warning;
