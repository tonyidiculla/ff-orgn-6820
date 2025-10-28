-- Complete permissions grant for all public tables
-- This ensures authenticated users have the base permissions
-- RLS policies will control which specific rows they can access

-- Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Grant permissions on platform_roles table (read-only for regular users)
GRANT SELECT ON public.platform_roles TO authenticated;

-- Grant permissions on user_to_role_assignment table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_to_role_assignment TO authenticated;

-- Grant permissions on organizations table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;

-- Grant permissions on location_currency table (read-only for regular users)
GRANT SELECT ON public.location_currency TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.location_currency TO authenticated;

-- Grant USAGE on the public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify all grants
SELECT 
    table_name,
    STRING_AGG(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND grantee = 'authenticated'
GROUP BY table_name
ORDER BY table_name;
