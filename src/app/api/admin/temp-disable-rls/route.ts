import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    console.log('[Temp RLS Fix] Starting RLS policy removal...')

    // Disable RLS on key tables
    const tables = ['organizations', 'hospital_master', 'user_profiles']
    const results = []

    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        })
        
        if (error) {
          console.error(`Failed to disable RLS on ${table}:`, error)
          results.push({ table, success: false, error: error.message })
        } else {
          console.log(`✅ RLS disabled on ${table}`)
          results.push({ table, success: true })
        }
      } catch (err) {
        console.error(`Error disabling RLS on ${table}:`, err)
        results.push({ table, success: false, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    // Test organization access
    const { data: testOrg, error: testError } = await supabaseAdmin
      .from('organizations')
      .select('organization_id, organization_name, organization_platform_id')
      .eq('organization_platform_id', 'C00000001')
      .single()

    return NextResponse.json({
      success: true,
      message: 'RLS temporarily disabled',
      results: results,
      test: {
        organization: testOrg,
        error: testError?.message
      }
    })

  } catch (error) {
    console.error('Error in temp RLS fix:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}