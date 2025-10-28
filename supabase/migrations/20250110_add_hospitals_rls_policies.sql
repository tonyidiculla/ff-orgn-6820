-- Enable RLS on hospital_master table if not already enabled
ALTER TABLE public.hospital_master ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "hospitals_select_policy" ON public.hospital_master;
DROP POLICY IF EXISTS "hospitals_insert_policy" ON public.hospital_master;
DROP POLICY IF EXISTS "hospitals_update_policy" ON public.hospital_master;
DROP POLICY IF EXISTS "hospitals_delete_policy" ON public.hospital_master;

-- SELECT: Allow authenticated users to view hospitals
CREATE POLICY "hospitals_select_policy" ON public.hospital_master
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Allow platform admins and users with entity_configuration access
CREATE POLICY "hospitals_insert_policy" ON public.hospital_master
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            JOIN public.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
            JOIN public.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE p.user_id = auth.uid()
            AND ura.is_active = true
            AND pr.is_active = true
            AND pr.privilege_level::INTEGER <= 3  -- Platform admin, Org admin, or Entity admin
        )
    );

-- UPDATE: Allow platform admins and users with entity_configuration access
CREATE POLICY "hospitals_update_policy" ON public.hospital_master
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            JOIN public.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
            JOIN public.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE p.user_id = auth.uid()
            AND ura.is_active = true
            AND pr.is_active = true
            AND pr.privilege_level::INTEGER <= 3  -- Platform admin, Org admin, or Entity admin
        )
    );

-- DELETE: Allow platform admins only
CREATE POLICY "hospitals_delete_policy" ON public.hospital_master
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.profiles p
            JOIN public.user_to_role_assignment ura ON p.user_platform_id = ura.user_platform_id
            JOIN public.platform_roles pr ON ura.platform_role_id = pr.id
            WHERE p.user_id = auth.uid()
            AND ura.is_active = true
            AND pr.privilege_level::INTEGER <= 2  -- Only platform admins can delete
        )
    );
