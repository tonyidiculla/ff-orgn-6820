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
    console.log('🔍 Checking existing data in database...');

    // Check what tables actually exist and their structures
    const tables = ['profiles', 'hospital_master', 'platform_roles', 'employee_seat_assignment'];
    const results = {};

    for (const tableName of tables) {
      console.log(`Checking ${tableName}...`);
      
      try {
        // Get column info
        const { data: columns, error: columnError } = await supabase.rpc('sql', {
          query: `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = '${tableName}'
            ORDER BY ordinal_position;
          `
        });

        // Get row count and sample data
        const { data: sampleData, error: dataError } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);

        results[tableName] = {
          exists: !columnError && !dataError,
          columns: columns || [],
          columnError: columnError?.message,
          sampleData: sampleData || [],
          dataError: dataError?.message,
          rowCount: sampleData?.length || 0
        };

      } catch (error) {
        results[tableName] = {
          exists: false,
          error: error.message
        };
      }
    }

    // Try to find any user with complete data chain
    console.log('Looking for users with complete data...');
    
    const { data: usersWithData, error: userError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        user_platform_id,
        email,
        first_name,
        last_name
      `)
      .not('user_platform_id', 'is', null)
      .limit(10);

    return NextResponse.json({
      success: true,
      tableAnalysis: results,
      usersWithProfiles: usersWithData?.length || 0,
      sampleUsers: usersWithData || [],
      userError: userError?.message
    });

  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}