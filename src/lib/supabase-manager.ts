import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseClientConfig {
  serviceName: string;
  storageKey: string;
  options?: any;
}

class SupabaseClientManager {
  private static instance: SupabaseClientManager;
  private clients: Map<string, SupabaseClient> = new Map();
  
  private constructor() {
    // Initialize debug monitoring in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.setupDebugMonitoring();
    }
  }
  
  static getInstance(): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager();
    }
    return SupabaseClientManager.instance;
  }
  
  getClient(config: SupabaseClientConfig): SupabaseClient {
    const { serviceName, storageKey, options = {} } = config;
    
    // Return existing client if already created
    if (this.clients.has(serviceName)) {
      return this.clients.get(serviceName)!;
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(`[${serviceName}] Missing Supabase environment variables`);
    }
    
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: storageKey,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      },
      ...options
    });
    
    this.clients.set(serviceName, client);
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${serviceName}] Supabase client initialized with storage key: ${storageKey}`);
    }
    
    return client;
  }
  
  private setupDebugMonitoring() {
    // Monitor auth state changes across all clients
    const originalGetItem = window.localStorage.getItem;
    window.localStorage.getItem = function(key: string) {
      const result = originalGetItem.call(this, key);
      if (key.includes('supabase.auth')) {
        console.log(`[Supabase Debug] LocalStorage GET ${key}:`, result ? 'found' : 'not found');
      }
      return result;
    };
  }
  
  // Helper method to clear all auth sessions (useful for debugging)
  clearAllSessions() {
    if (typeof window !== 'undefined') {
      Object.keys(window.localStorage).forEach(key => {
        if (key.includes('supabase.auth')) {
          window.localStorage.removeItem(key);
          console.log(`[Debug] Cleared storage key: ${key}`);
        }
      });
    }
  }
  
  // Get all active clients
  getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }
}

export const supabaseClientManager = SupabaseClientManager.getInstance();