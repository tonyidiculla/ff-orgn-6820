import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[Auth Hook Setup] Starting setup process...')
    
    // Read and execute auth hook setup SQL
    const authHookSqlPath = join(process.cwd(), 'src/lib/sql/auth-hook-setup.sql')
    const authHookSql = readFileSync(authHookSqlPath, 'utf8')
    
    console.log('[Auth Hook Setup] Executing auth hook SQL...')
    const { error: authHookError } = await supabaseAdmin.rpc('exec_sql', {
      query: authHookSql
    })
    
    if (authHookError) {
      console.error('Auth hook setup error:', authHookError)
      // Try executing line by line for auth hook
      const authHookStatements = authHookSql.split(';').filter(stmt => stmt.trim())
      for (const statement of authHookStatements) {
        if (statement.trim()) {
          const { error } = await supabaseAdmin.rpc('exec_sql', { query: statement.trim() + ';' })
          if (error) {
            console.error(`Failed to execute: ${statement.substring(0, 100)}...`, error)
          }
        }
      }
    }

    // Read and execute RLS policies SQL
    const rlsPolicyPath = join(process.cwd(), 'src/lib/sql/updated-rls-policies.sql')
    const rlsPolicySql = readFileSync(rlsPolicyPath, 'utf8')
    
    console.log('[Auth Hook Setup] Executing RLS policies SQL...')
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      query: rlsPolicySql
    })
    
    if (rlsError) {
      console.error('RLS policies setup error:', rlsError)
      // Try executing line by line for RLS
      const rlsStatements = rlsPolicySql.split(';').filter(stmt => stmt.trim())
      for (const statement of rlsStatements) {
        if (statement.trim()) {
          const { error } = await supabaseAdmin.rpc('exec_sql', { query: statement.trim() + ';' })
          if (error) {
            console.error(`Failed to execute: ${statement.substring(0, 100)}...`, error)
          }
        }
      }
    }

    // Test the setup by checking if we can query with proper auth
    const { data: testData, error: testError } = await supabaseAdmin
      .from('organizations')
      .select('organization_id, organization_name, organization_platform_id')
      .limit(1)

    return NextResponse.json({
      success: true,
      message: 'Auth Hook and RLS policies setup completed',
      authHookError: authHookError?.message || null,
      rlsError: rlsError?.message || null,
      testQuery: {
        data: testData,
        error: testError?.message || null
      },
      nextSteps: [
        '1. Go to Supabase Dashboard > Authentication > Hooks',
        '2. Enable "Custom Access Token" hook',
        '3. Select the "custom_access_token_hook" function',
        '4. Test authentication with the new endpoint'
      ]
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}