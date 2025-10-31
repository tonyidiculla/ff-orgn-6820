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
    console.log('🔍 Investigating why Auth Hook is not adding claims...');

    const testUserId = 'f08f2a27-c9ff-47f2-b60f-f62cbe04aed5'; // From previous test

    // Step 1: Check if profile exists for test user
    console.log('1. Checking if profile exists...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    console.log('Profile data:', profileData);
    console.log('Profile error:', profileError?.message);

    // Step 2: Check Auth Hook function logs/execution
    console.log('2. Testing Auth Hook function manually...');
    
    const { data: hookResult, error: hookError } = await supabase.rpc(
      'custom_access_token_hook',
      {
        event: {
          user_id: testUserId,
          claims: {
            sub: testUserId,
            email: 'test@furfield.org',
            role: 'authenticated'
          }
        }
      }
    );

    console.log('Manual hook test result:', hookResult);
    console.log('Manual hook test error:', hookError?.message);

    // Step 3: If no profile, create one with test data
    let createdProfile = null;
    if (!profileData) {
      console.log('3. Creating test profile...');
      
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          user_id: testUserId,
          user_platform_id: 'test-user-001',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@furfield.org'
        })
        .select()
        .single();

      console.log('Created profile:', newProfile);
      console.log('Create profile error:', createProfileError?.message);
      createdProfile = newProfile;
    }

    // Step 4: Check if role assignment exists
    const userPlatformId = profileData?.user_platform_id || createdProfile?.user_platform_id;
    
    if (userPlatformId) {
      console.log('4. Checking role assignment...');
      
      const { data: roleAssignment, error: roleError } = await supabase
        .from('employee_seat_assignment')
        .select(`
          *,
          hospital_master (
            organization_platform_id,
            entity_name
          ),
          platform_roles (
            role_name
          )
        `)
        .eq('user_platform_id', userPlatformId);

      console.log('Role assignment:', roleAssignment);
      console.log('Role assignment error:', roleError?.message);
    }

    // Step 5: Test hook again after creating profile
    console.log('5. Testing Auth Hook function again after profile creation...');
    
    const { data: hookResult2, error: hookError2 } = await supabase.rpc(
      'custom_access_token_hook',
      {
        event: {
          user_id: testUserId,
          claims: {
            sub: testUserId,
            email: 'test@furfield.org',
            role: 'authenticated'
          }
        }
      }
    );

    console.log('Second hook test result:', hookResult2);
    console.log('Second hook test error:', hookError2?.message);

    return NextResponse.json({
      success: true,
      investigation: {
        profileExists: !!profileData,
        profileData: profileData || createdProfile,
        profileError: profileError?.message,
        hookTest1: {
          result: hookResult,
          error: hookError?.message
        },
        hookTest2: {
          result: hookResult2,
          error: hookError2?.message
        },
        userPlatformId
      }
    });

  } catch (error) {
    console.error('Investigation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}