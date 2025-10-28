-- Add subscription-related columns to hospital_master table
-- This allows storing selected modules and subscription information directly

ALTER TABLE public.hospital_master
ADD COLUMN IF NOT EXISTS subscribed_modules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'trial', 'expired')),
ADD COLUMN IF NOT EXISTS monthly_subscription_cost NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS one_time_costs NUMERIC(10, 2) DEFAULT 0.00;

-- Add comments for documentation
COMMENT ON COLUMN public.hospital_master.subscribed_modules IS 
'JSONB array of module IDs and their details. Format: [{"module_id": "uuid", "module_name": "text", "activated_at": "timestamp"}]';

COMMENT ON COLUMN public.hospital_master.subscription_start_date IS 
'Date when the hospital subscription started';

COMMENT ON COLUMN public.hospital_master.subscription_end_date IS 
'Date when the hospital subscription ends (null for ongoing subscriptions)';

COMMENT ON COLUMN public.hospital_master.subscription_status IS 
'Current status of the hospital subscription: active, inactive, suspended, trial, or expired';

COMMENT ON COLUMN public.hospital_master.monthly_subscription_cost IS 
'Total monthly cost for all subscribed modules';

COMMENT ON COLUMN public.hospital_master.one_time_costs IS 
'Total one-time costs for all subscribed modules';

-- Create an index on subscription_status for faster queries
CREATE INDEX IF NOT EXISTS idx_hospitals_subscription_status ON public.hospital_master(subscription_status);

-- Create a GIN index on subscribed_modules for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_hospitals_subscribed_modules ON public.hospital_master USING GIN (subscribed_modules);
