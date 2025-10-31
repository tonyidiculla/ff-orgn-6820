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
    const realUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4'; // tony@fusionduotech.com
    
    console.log('🔍 Checking data for real user:', realUserId);

    // Step 1: Check if profile exists for this user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', realUserId)
      .single();

    console.log('Profile:', profile ? 'Found' : 'Not found');
    console.log('Profile error:', profileError?.message);

    if (profile) {
      console.log('User platform ID:', profile.user_platform_id);

      // Step 2: Check role assignments
      const { data: assignments, error: assignError } = await supabase
        .from('employee_seat_assignment')
        .select(`
          *,
          hospital_master (
            entity_platform_id,
            organization_platform_id,
            entity_name
          ),
          platform_roles (
            platform_role_id,
            role_name
          )
        `)
        .eq('user_platform_id', profile.user_platform_id);

      console.log('Role assignments found:', assignments?.length || 0);
      console.log('Assignment error:', assignError?.message);

      // Step 3: Test Auth Hook function manually with this user
      const { data: hookResult, error: hookError } = await supabase.rpc(
        'custom_access_token_hook',
        {
          event: {
            user_id: realUserId,
            claims: {
              sub: realUserId,
              email: 'tony@fusionduotech.com',
              role: 'authenticated'
            }
          }
        }
      );

      console.log('Manual hook test result:', JSON.stringify(hookResult, null, 2));
      console.log('Manual hook error:', hookError?.message);

      return NextResponse.json({
        success: true,
        analysis: {
          profileExists: !!profile,
          profile: profile,
          profileError: profileError?.message,
          roleAssignments: assignments?.length || 0,
          assignmentData: assignments,
          assignmentError: assignError?.message,
          hookTest: {
            result: hookResult,
            error: hookError?.message
          }
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No profile found for user',
      profileError: profileError?.message
    });

  } catch (error) {
    console.error('Real user analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}