import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function handleLogout() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors
            }
          },
        },
      }
    );

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Logout API] Error signing out:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Logout API] Successfully signed out');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Logout API] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}
