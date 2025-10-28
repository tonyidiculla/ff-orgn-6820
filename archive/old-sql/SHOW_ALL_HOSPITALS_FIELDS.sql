-- Show all fields from the hospital_master (entities) table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'hospitals'
ORDER BY ordinal_position;

-- Also show a sample record to see the data
SELECT *
FROM public.hospital_master
LIMIT 1;
