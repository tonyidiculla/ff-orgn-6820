'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface DatabaseOperationResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Create a Supabase client for server actions with cookie support
 */
async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

/**
 * Get organizations for the current authenticated user
 */
export async function getOrganizations(): Promise<DatabaseOperationResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No authenticated session found')
    }

    console.log('[DB] Getting organizations for user:', session.user.email)

    const { data, error } = await supabase
      .from('organizations')
      .select('*')

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }

  } catch (error) {
    console.error('[DB] Error getting organizations:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(organizationPlatformId: string): Promise<DatabaseOperationResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No authenticated session found')
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_platform_id', organizationPlatformId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }

  } catch (error) {
    console.error('[DB] Error getting organization:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get hospitals/entities by organization platform ID
 */
export async function getHospitalsByOrganization(organizationPlatformId: string): Promise<DatabaseOperationResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No authenticated session found')
    }

    const { data, error } = await supabase
      .from('hospital_master')
      .select('*')
      .eq('organization_platform_id', organizationPlatformId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }

  } catch (error) {
    console.error('[DB] Error getting hospitals:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get hospital/entity by entity platform ID
 */
export async function getHospitalById(entityPlatformId: string): Promise<DatabaseOperationResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No authenticated session found')
    }

    const { data, error } = await supabase
      .from('hospital_master')
      .select('*')
      .eq('entity_platform_id', entityPlatformId)
      .eq('is_active', true)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }

  } catch (error) {
    console.error('[DB] Error getting hospital by ID:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update hospital status
 */
export async function updateHospitalStatus(entityPlatformId: string, isActive: boolean): Promise<DatabaseOperationResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No authenticated session found')
    }

    const { data, error } = await supabase
      .from('hospital_master')
      .update({ is_active: isActive })
      .eq('entity_platform_id', entityPlatformId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }

  } catch (error) {
    console.error('[DB] Error updating hospital status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Soft delete hospital
 */
export async function softDeleteHospital(entityPlatformId: string): Promise<DatabaseOperationResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('No authenticated session found')
    }

    const { data, error } = await supabase
      .from('hospital_master')
      .update({ 
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('entity_platform_id', entityPlatformId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }

  } catch (error) {
    console.error('[DB] Error soft deleting hospital:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
