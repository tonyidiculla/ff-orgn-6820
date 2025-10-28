-- Test if RLS is blocking hospital_master access

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'hospitals';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'hospitals';

-- Try to select hospital_master directly
SELECT entity_platform_id, entity_name, organization_platform_id, is_active
FROM public.hospital_master
WHERE organization_platform_id = 'C00jvdgrP';

-- Check if the user has a valid session
SELECT auth.uid() as current_user_id;

-- Check user's role assignments
SELECT ura.*, pr.role_name, pr.privilege_level
FROM public.profiles p
JOIN public.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN public.platform_roles pr ON ura.platform_role_id = pr.id
WHERE p.user_id = auth.uid();
