'use server'

import { createServiceAccountClient, parseJWTPayload } from '@/lib/supabase-service-account'
import { cookies, headers } from 'next/headers'

/**
 * Server action to update hospital entity using JWT + Service Account pattern
 * 
 * How this works:
 * 1. Extracts JWT token from request headers/cookies
 * 2. Creates service account client (bypasses anon role restrictions)  
 * 3. Passes JWT token so auth.jwt() works in RLS policies
 * 4. RLS policies can read organizationPlatformId, entityPlatformId from JWT
 */
export async function updateHospitalEntity(
  entityId: string,
  hospitalData: {
    name?: string
    address?: string
    phone?: string
    // Add other hospital fields
  }
) {
  try {
    // Extract JWT token from request
    const headersList = await headers()
    const cookieStore = await cookies()
    
    let jwtToken: string | undefined
    
    // Try Authorization header first
    const authHeader = headersList.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      jwtToken = authHeader.substring(7)
    }
    
    // Fallback: try custom cookie/header based on your auth system
    if (!jwtToken) {
      // Add your JWT extraction logic here
      // For example: jwtToken = cookieStore.get('jwt-token')?.value
      console.warn('No JWT token found in request')
    }

    // Parse JWT for logging/validation
    if (jwtToken) {
      const payload = parseJWTPayload(jwtToken)
      console.log('JWT Context for update:', {
        userId: payload?.sub,
        organizationPlatformId: payload?.organizationPlatformId,
        entityPlatformId: payload?.entityPlatformId,
        role: payload?.role
      })
    }

    // Create service account client with JWT context
    const supabase = createServiceAccountClient(jwtToken)

    // Update hospital record
    // RLS policies will have access to JWT claims via auth.jwt()
    const { data, error } = await supabase
      .from('hospital_master')
      .update({
        name: hospitalData.name,
        address: hospitalData.address,
        phone: hospitalData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId)
      .select()
      .single()

    if (error) {
      console.error('Hospital update error:', error)
      throw new Error(error.message)
    }

    console.log('Hospital updated successfully:', data)
    return { success: true, data }

  } catch (error) {
    console.error('Update hospital entity error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test function to verify JWT claims are accessible in RLS
 */
export async function testJWTAccess(jwtToken: string) {
  try {
    const supabase = createServiceAccountClient(jwtToken)
    
    // Test query that should work with proper JWT claims
    const { data, error } = await supabase
      .from('hospital_master')
      .select('id, name, organization_platform_id')
      .limit(5)

    return {
      success: !error,
      data,
      error: error?.message,
      jwtPayload: parseJWTPayload(jwtToken)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}