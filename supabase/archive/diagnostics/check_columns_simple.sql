-- Get ALL column information for hospital_master table
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'hospitals'
ORDER BY ordinal_position;
