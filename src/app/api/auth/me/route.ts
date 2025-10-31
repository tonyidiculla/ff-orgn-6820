import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { extractStorageUrl } from '@/lib/storage-service';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Debug: Log all cookies
    const allCookies = cookieStore.getAll();
    console.log('[Auth API] All cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`).join(', '));
    console.log('[Auth API] Total cookies:', allCookies.length);
    
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log('[Auth API] Session check:', {
      hasSession: !!session,
      error: sessionError?.message,
      userId: session?.user?.id
    });

    if (sessionError || !session) {
      console.log('[Auth API] No session found:', sessionError?.message);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user profile from database (user_id is the PRIMARY KEY)
    const { data: profile, error: profileError } = await supabase
      .from('profiles_with_auth')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // Get user's actual role from platform_roles via user_expertise_assignment
    let userRole = 'User';
    if (profile?.user_platform_id) {
      const { data: roleData } = await supabase
        .from('user_expertise_assignment')
        .select(`
          is_active,
          platform_roles (
            role_name,
            privilege_level
          )
        `)
        .eq('user_platform_id', profile.user_platform_id)
        .eq('is_active', true)
        .single();

      if (roleData?.platform_roles && Array.isArray(roleData.platform_roles) && roleData.platform_roles.length > 0) {
        // Format role name nicely (e.g., "platform_admin" -> "Platform Admin")
        const roleName = roleData.platform_roles[0].role_name || '';
        userRole = roleName
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      } else if (roleData?.platform_roles && !Array.isArray(roleData.platform_roles)) {
        // Single object case
        const roleName = (roleData.platform_roles as any).role_name || '';
        userRole = roleName
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }

    // Parse JWT claims
    let claims = null;
    if (session.access_token) {
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        claims = {
          organizationPlatformId: payload.organizationPlatformId,
          entityPlatformId: payload.entityPlatformId,
          role: payload.role,
        };
        console.log('[Auth API] JWT Claims:', claims);
      } catch (e) {
        console.error('[Auth API] Failed to parse JWT claims:', e);
      }
    }

    // Extract name from email if not present in profile
    const email = session.user.email || '';
    const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    
    // Construct full name from profile
    const firstName = profile?.first_name || '';
    const lastName = profile?.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    // Extract avatar URL from avatar_storage field using standardized storage service
    const avatarUrl = extractStorageUrl(profile?.avatar_storage);

    console.log('[Auth API] User profile:', {
      id: session.user.id,
      email: email,
      name: fullName || nameFromEmail,
      hasProfile: !!profile,
      avatarUrl: avatarUrl
    });

    // Return user info
    return NextResponse.json({
      id: session.user.id,
      name: fullName || nameFromEmail || 'User',
      firstName: firstName || nameFromEmail.split(' ')[0] || '',
      lastName: lastName || '',
      email: email,
      role: userRole,
      entity_platform_id: claims?.entityPlatformId || null,
      entityPlatformId: claims?.entityPlatformId || null,
      user_platform_id: profile?.user_platform_id || session.user.id,
      userPlatformId: profile?.user_platform_id || session.user.id,
      avatarUrl: avatarUrl,
      organizationPlatformId: claims?.organizationPlatformId || null,
    });
  } catch (error) {
    console.error('[Auth API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
