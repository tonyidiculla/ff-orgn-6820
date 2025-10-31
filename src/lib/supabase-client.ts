import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client for authentication with SSR cookie support
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

// Server-side admin client for privileged operations
export const createAdminClient = () => {
  const serviceRoleKey = process.env.NEXT_SUPABASE_SECRET_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error('Missing NEXT_SUPABASE_SECRET_ROLE_KEY environment variable')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  })
}

// Helper to get current user session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}