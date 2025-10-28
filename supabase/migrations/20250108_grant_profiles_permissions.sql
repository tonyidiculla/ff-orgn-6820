-- Grant permissions on public.profiles table
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- Grant usage on the sequence if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'profiles_id_seq' AND relkind = 'S') THEN
        GRANT USAGE ON SEQUENCE public.profiles_id_seq TO authenticated;
        GRANT USAGE ON SEQUENCE public.profiles_id_seq TO service_role;
    END IF;
END $$;
