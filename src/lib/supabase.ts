import { supabaseClientManager } from './supabase-manager';

// Get the Organization Management client with proper isolation
export const supabase = supabaseClientManager.getClient({
  serviceName: 'ff-orgn-6700',
  storageKey: 'supabase.auth.organization',
  options: {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
});

// Helper functions for ff-orgn-6700
export async function getUserOrganizations(userId: string) {
  const { data, error } = await supabase
    .from('user_organizations')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);
    
  if (error) {
    console.error('[ff-orgn-6700] Error fetching user organizations:', error);
    return [];
  }
  
  return data || [];
}

export async function getOrganizationDetails(orgId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
    
  if (error) {
    console.error('[ff-orgn-6700] Error fetching organization details:', error);
    return null;
  }
  
  return data;
}

export async function getOrganizationMembers(orgId: string) {
  const { data, error } = await supabase
    .from('user_organizations')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true);
    
  if (error) {
    console.error('[ff-orgn-6700] Error fetching organization members:', error);
    return [];
  }
  
  return data || [];
}
