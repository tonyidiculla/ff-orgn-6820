-- ============================================================================
-- Grant Access to public Schema
-- ============================================================================
-- This script grants necessary permissions to access public schema
-- through Supabase PostgREST API
-- ============================================================================

-- Grant USAGE on public schema to Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant SELECT permissions on all tables in public
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant SELECT on specific tables (explicit for clarity)
GRANT SELECT ON public.platform_roles TO anon, authenticated, service_role;
GRANT SELECT ON public.user_to_role_assignment TO anon, authenticated, service_role;

-- If you want to allow INSERT/UPDATE/DELETE for authenticated users
-- Uncomment the following lines:
-- GRANT INSERT, UPDATE, DELETE ON public.user_to_role_assignment TO authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO anon, authenticated, service_role;

-- Add public to the search path for PostgREST
ALTER ROLE anon SET search_path TO public, public;
ALTER ROLE authenticated SET search_path TO public, public;

-- Reload PostgREST configuration
NOTIFY pgrst, 'reload config';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this after applying the above to verify:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   array_agg(privilege_type) as privileges
-- FROM information_schema.table_privileges
-- WHERE grantee IN ('anon', 'authenticated', 'service_role')
--   AND schemaname = 'public'
-- GROUP BY schemaname, tablename
-- ORDER BY tablename;
-- ============================================================================
