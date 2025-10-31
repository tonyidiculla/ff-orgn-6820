import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface JWTPayload {
  sub: string // user ID
  organizationPlatformId?: string
  entityPlatformId?: string
  role?: string
  exp?: number
  iat?: number
  // Add other JWT claims as needed
}

/**
 * Creates a Supabase client that uses service account authentication
 * but passes JWT context for RLS policy access via auth.jwt()
 * 
 * This enables:
 * 1. Service account bypasses anon/authenticated role restrictions
 * 2. JWT claims are accessible in RLS policies via auth.jwt()
 * 3. Organizational context (organizationPlatformId, entityPlatformId) available to policies
 */
export function createServiceAccountClient(jwtToken?: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.NEXT_SUPABASE_SECRET_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration for service account')
  }

  // Create client with service role key
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Use service account by default
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: jwtToken ? {
        // Pass JWT token in Authorization header for auth.jwt() access
        // This allows RLS policies to read JWT claims via auth.jwt()
        'Authorization': `Bearer ${jwtToken}`
      } : {}
    }
  })

  return client
}

/**
 * Extracts and validates JWT payload for logging/debugging
 * Note: In production, use proper JWT verification with your secret
 */
export function parseJWTPayload(jwtToken: string): JWTPayload | null {
  try {
    const parts = jwtToken.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload as JWTPayload
  } catch (error) {
    console.error('Failed to parse JWT:', error)
    return null
  }
}

/**
 * Creates service account client with user context from request
 * Extracts JWT from Authorization header or other sources
 */
export function createContextualServiceClient(request?: Request): SupabaseClient {
  let jwtToken: string | undefined

  if (request) {
    // Extract JWT from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      jwtToken = authHeader.substring(7)
    }
  }

  // Fallback: try to get from other sources (cookies, etc.)
  // Add your JWT extraction logic here based on your auth system

  return createServiceAccountClient(jwtToken)
}

/**
 * Utility to verify JWT token has required claims for operation
 */
export function verifyJWTClaims(jwtToken: string, requiredClaims: string[]): boolean {
  const payload = parseJWTPayload(jwtToken)
  if (!payload) return false

  return requiredClaims.every(claim => 
    payload[claim as keyof JWTPayload] !== undefined
  )
}