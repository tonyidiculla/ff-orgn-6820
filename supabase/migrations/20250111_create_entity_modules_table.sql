-- Check if entity_modules table exists in public schema
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'entity_modules'
    ) THEN
        RAISE NOTICE 'public.entity_modules table exists';
    ELSE
        RAISE NOTICE 'public.entity_modules table does NOT exist';
    END IF;
END $$;

-- Show the current structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'entity_modules'
ORDER BY ordinal_position;

-- If the table doesn't exist or has wrong structure, create/fix it
-- DROP TABLE IF EXISTS public.entity_modules CASCADE;

CREATE TABLE IF NOT EXISTS public.entity_modules (
    id SERIAL PRIMARY KEY,
    entity_platform_id TEXT NOT NULL REFERENCES public.hospital_master(entity_platform_id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_platform_id, module_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_entity_modules_entity_id ON public.entity_modules(entity_platform_id);
CREATE INDEX IF NOT EXISTS idx_entity_modules_module_id ON public.entity_modules(module_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_modules TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.entity_modules_id_seq TO authenticated;

-- Verify the structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'entity_modules'
ORDER BY ordinal_position;
