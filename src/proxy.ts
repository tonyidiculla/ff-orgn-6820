import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set<string>(['/healthcheck'])

// Simple in-memory cache for token verification (valid for 30 seconds)
const tokenCache = new Map<string, { valid: boolean; expires: number }>();

async function verifyToken(token: string): Promise<boolean> {
  // Check cache first
  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) {
    console.log('[Organization Middleware] Using cached token verification');
    return cached.valid;
  }

  try {
    // Verify token with ff-auth service (the single source of truth)
    const response = await fetch('http://localhost:6800/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const isValid = response.ok;
    
    // Cache the result for 30 seconds
    tokenCache.set(token, {
      valid: isValid,
      expires: Date.now() + 30000,
    });
    
    return isValid;
  } catch (error) {
    console.error('[Organization Middleware] Token verification failed:', error);
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Skip proxy for Next.js internal routes and static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static')) {
    return NextResponse.next()
  }

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  console.log('[Organization Proxy] Request:', pathname);
  
  // Check for authentication token in cookies OR URL query parameter
  let token = request.cookies.get('furfield_token')?.value;
  const tokenFromUrl = searchParams.get('token');
  
  // If token in URL but not in cookie, use URL token and set cookie
  if (!token && tokenFromUrl) {
    token = tokenFromUrl;
    console.log('[Organization Proxy] Token found in URL, will set cookie');
  }
  
  console.log('[Organization Proxy] Token found:', !!token);
  
  if (!token) {
    console.log('[Organization Proxy] No token found, redirecting to auth');
    // No token - redirect to ff-auth with return URL
    const returnUrl = encodeURIComponent(request.url);
    const loginUrl = new URL(`http://localhost:6800/login?returnUrl=${returnUrl}`);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify token
  const isValid = await verifyToken(token);
  console.log('[Organization Proxy] Token valid:', isValid);
  
  if (!isValid) {
    console.log('[Organization Proxy] Invalid token, redirecting to auth');
    // Invalid token - clear cookies and redirect to ff-auth
    const returnUrl = encodeURIComponent(request.url);
    const loginUrl = new URL(`http://localhost:6800/login?returnUrl=${returnUrl}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('furfield_token');
    response.cookies.delete('furfield_refresh_token');
    return response;
  }
  
  console.log('[Organization Proxy] Token valid, allowing access');
  
  // If token was from URL, set it as cookie and redirect to clean URL
  if (tokenFromUrl) {
    console.log('[Organization Proxy] Token from URL, setting cookie and redirecting');
    const response = NextResponse.redirect(new URL(pathname, request.url));
    response.cookies.set('furfield_token', token, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: false,
      sameSite: 'lax',
      secure: false,
    });
    console.log('[Organization Proxy] Cookie set, redirecting to:', pathname);
    return response;
  }
  
  console.log('[Organization Proxy] Token from cookie, allowing access');
  // Valid token - allow access
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)|site.webmanifest).*)'],
}
