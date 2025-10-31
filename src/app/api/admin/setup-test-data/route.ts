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
    console.log('🛠️ Creating test data for Auth Hook to work...');

    const testUserPlatformId = 'test-user-001';

    // Step 1: Get or create a test hospital/entity
    console.log('1. Getting/creating test hospital...');
    
    let { data: hospital, error: hospitalError } = await supabase
      .from('hospital_master')
      .select('*')
      .eq('entity_name', 'Test Hospital')
      .single();

    if (!hospital) {
      console.log('Creating test hospital...');
      const { data: newHospital, error: createHospitalError } = await supabase
        .from('hospital_master')
        .insert({
          entity_platform_id: 'test-entity-001',
          organization_platform_id: 'test-org-001',
          entity_name: 'Test Hospital',
          entity_type: 'hospital',
          address: '123 Test St',
          city: 'Test City',
          state: 'CA',
          postal_code: '12345',
          country: 'United States',
          is_active: true
        })
        .select()
        .single();

      hospital = newHospital;
      hospitalError = createHospitalError;
    }

    console.log('Hospital:', hospital?.entity_name);
    console.log('Hospital error:', hospitalError?.message);

    // Step 2: Get or create a test role
    console.log('2. Getting/creating test role...');
    
    let { data: role, error: roleError } = await supabase
      .from('platform_roles')
      .select('*')
      .eq('role_name', 'test_admin')
      .single();

    if (!role) {
      console.log('Creating test role...');
      const { data: newRole, error: createRoleError } = await supabase
        .from('platform_roles')
        .insert({
          platform_role_id: 'test-role-001',
          role_name: 'test_admin',
          display_name: 'Test Administrator',
          description: 'Test role for Auth Hook testing',
          is_active: true
        })
        .select()
        .single();

      role = newRole;
      roleError = createRoleError;
    }

    console.log('Role:', role?.role_name);
    console.log('Role error:', roleError?.message);

    // Step 3: Create role assignment for test user
    console.log('3. Creating role assignment...');
    
    const { data: assignment, error: assignmentError } = await supabase
      .from('employee_seat_assignment')
      .upsert({
        user_platform_id: testUserPlatformId,
        entity_platform_id: hospital?.entity_platform_id,
        platform_role_id: role?.platform_role_id,
        employee_entity_id: 'test-emp-001',
        is_active: true,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'user_platform_id,entity_platform_id'
      })
      .select()
      .single();

    console.log('Assignment:', assignment);
    console.log('Assignment error:', assignmentError?.message);

    // Step 4: Test Auth Hook again with complete data
    console.log('4. Testing Auth Hook with complete data...');
    
    const { data: hookResult, error: hookError } = await supabase.rpc(
      'custom_access_token_hook',
      {
        event: {
          user_id: 'f08f2a27-c9ff-47f2-b60f-f62cbe04aed5',
          claims: {
            sub: 'f08f2a27-c9ff-47f2-b60f-f62cbe04aed5',
            email: 'test@furfield.org',
            role: 'authenticated'
          }
        }
      }
    );

    console.log('Hook result with data:', JSON.stringify(hookResult, null, 2));
    console.log('Hook error:', hookError?.message);

    // Step 5: Test actual authentication flow
    console.log('5. Testing full auth flow...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@furfield.org',
      password: 'test123456',
    });

    if (signInData?.session?.access_token) {
      const parts = signInData.session.access_token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      const customClaims = {
        organizationPlatformId: payload.organizationPlatformId,
        entityPlatformId: payload.entityPlatformId,
        userPlatformId: payload.userPlatformId,
        role: payload.role
      };

      console.log('Real JWT custom claims:', customClaims);

      return NextResponse.json({
        success: true,
        setup: {
          hospital: hospital?.entity_name,
          role: role?.role_name,
          assignment: !!assignment,
          hospitalError: hospitalError?.message,
          roleError: roleError?.message,
          assignmentError: assignmentError?.message
        },
        hookTest: {
          result: hookResult,
          error: hookError?.message
        },
        realAuth: {
          customClaims,
          authHookWorking: !!(payload.organizationPlatformId || payload.userPlatformId)
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to authenticate test user',
      signInError: signInError?.message
    });

  } catch (error) {
    console.error('Setup test data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}