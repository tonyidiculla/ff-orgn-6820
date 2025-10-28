-- Check the data type of privilege_level in public.platform_roles
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'platform_roles'
  AND column_name IN ('level', 'privilege_level');

-- Also check what values currently exist
SELECT DISTINCT privilege_level, COUNT(*) as count
FROM public.platform_roles
GROUP BY privilege_level
ORDER BY privilege_level;
