import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.NEXT_SUPABASE_SECRET_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checking platform_roles table structure...');

    // Get all data from platform_roles to see the structure
    const { data: roles, error: roleError } = await supabase
      .from('platform_roles')
      .select('*')
      .limit(5);

    console.log('Platform roles data:', roles);
    console.log('Platform roles error:', roleError?.message);

    // Also check the specific role ID we're looking for
    const targetRoleId = '98c07fc3-7f6f-4fc4-a2e8-d06c3e32bca2';
    
    // Try different possible column names
    const possibleColumns = ['id', 'role_id', 'platform_role_id', 'uuid'];
    const results: any = {};
    
    for (const colName of possibleColumns) {
      try {
        const { data, error } = await supabase
          .from('platform_roles')
          .select(`${colName}, role_name`)
          .eq(colName, targetRoleId)
          .limit(1);
        
        results[colName] = {
          found: data && data.length > 0,
          data: data,
          error: error?.message
        };
      } catch (e) {
        results[colName] = {
          found: false,
          error: 'Column does not exist'
        };
      }
    }

    return NextResponse.json({
      success: true,
      investigation: {
        allRoles: roles,
        roleError: roleError?.message,
        targetRoleId,
        columnTests: results
      }
    });

  } catch (error) {
    console.error('Platform roles check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}