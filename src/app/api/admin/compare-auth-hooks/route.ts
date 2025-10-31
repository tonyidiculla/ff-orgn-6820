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
    console.log('🔧 Testing both Auth Hook functions...');

    const testUserId = '89af6091-a4a9-41bc-ab83-a9184da9bbe4';
    const testEvent = {
      user_id: testUserId,
      claims: {
        sub: testUserId,
        email: 'tony@fusionduotech.com',
        role: 'authenticated'
      }
    };

    // Test the minimal working function
    console.log('1. Testing minimal function...');
    const { data: minimalResult, error: minimalError } = await supabase.rpc(
      'test_auth_hook_minimal',
      { event: testEvent }
    );

    console.log('Minimal result:', JSON.stringify(minimalResult, null, 2));

    // Test the main function
    console.log('2. Testing main function...');
    const { data: mainResult, error: mainError } = await supabase.rpc(
      'custom_access_token_hook',
      { event: testEvent }
    );

    console.log('Main result:', JSON.stringify(mainResult, null, 2));
    console.log('Main error:', mainError?.message);

    return NextResponse.json({
      success: true,
      comparison: {
        minimal: {
          result: minimalResult,
          error: minimalError?.message,
          working: !!(minimalResult?.claims?.userPlatformId)
        },
        main: {
          result: mainResult,
          error: mainError?.message,
          working: !!(mainResult?.claims?.organizationPlatformId || mainResult?.claims?.userPlatformId)
        }
      }
    });

  } catch (error) {
    console.error('Comparison test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}