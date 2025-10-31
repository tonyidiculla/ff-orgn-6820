import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = new Set<string>(['/healthcheck', '/auth/login', '/auth/callback', '/auth/signup'])

async function getSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession()

  return { session, supabase, response: supabaseResponse }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip proxy for Next.js internal routes and static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static')) {
    return NextResponse.next()
  }

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  console.log('[Organization Proxy] Request:', pathname);
  
  // Get Supabase session
  const { session, response } = await getSupabaseSession(request)
  
  console.log('[Organization Proxy] Session found:', !!session);
  
  if (!session) {
    console.log('[Organization Proxy] No session found, redirecting to login');
    // No session - redirect to login page
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  console.log('[Organization Proxy] Valid session, allowing access');
  // Valid session - allow access
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)|site.webmanifest).*)'],
}
