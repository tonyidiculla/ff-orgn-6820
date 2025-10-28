-- Check if brand_name column exists and what data it has
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name = 'brand_name';

-- Check current brand_name values
SELECT 
    organization_id,
    organization_name,
    brand_name,
    updated_at
FROM public.organizations
ORDER BY updated_at DESC
LIMIT 5;
