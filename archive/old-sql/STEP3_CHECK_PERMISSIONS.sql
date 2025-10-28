-- Step 3: Check your role permissions

SELECT 
    pr.id,
    pr.role_name,
    pr.privilege_level,
    pr.permissions,
    pr.modules,
    pr.is_active
FROM public.profiles p
JOIN public.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
JOIN public.platform_roles pr ON ura.platform_role_id = pr.id
WHERE p.user_id = auth.uid();
