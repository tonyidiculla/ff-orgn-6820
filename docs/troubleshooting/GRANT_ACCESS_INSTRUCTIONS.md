# 🚀 Quick Setup: Grant public Schema Access

## Current Status

❌ Schema is exposed but **permissions not granted**

- Error: `permission denied for schema public (Code: 42501)`

## Solution: Grant Permissions

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/xnetjsifkhtbbpadwlxy
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy & Run This SQL

```sql
-- Grant USAGE on public schema to Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant SELECT permissions on all tables in public
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon, authenticated, service_role;

-- Add public to the search path for PostgREST
ALTER ROLE anon SET search_path TO public, public;
ALTER ROLE authenticated SET search_path TO public, public;

-- Reload PostgREST configuration
NOTIFY pgrst, 'reload config';
```

### Step 3: Verify Access

Run this test after applying the SQL:

```bash
node --import tsx scripts/test-schema-access.ts
```

You should see:

- ✅ Master_data schema accessible with anon key!
- ✅ Master_data schema accessible with service role!

### Step 4: Test in Your App

1. Sign in: http://localhost:3001/auth/sign-in
2. Check browser console - you should see privileges loading
3. Visit: http://localhost:3001/organization

---

## What This Does

- **GRANT USAGE** - Allows roles to access the schema
- **GRANT SELECT** - Allows reading from tables
- **ALTER DEFAULT PRIVILEGES** - Auto-grants for new tables
- **search_path** - Lets PostgREST find the schema
- **NOTIFY pgrst** - Reloads API configuration immediately

## Full SQL File Location

The complete SQL script with comments is at:
`supabase/migrations/grant_public_access.sql`
