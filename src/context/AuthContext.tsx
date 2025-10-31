'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  entity_platform_id: string | null;
  employee_entity_id: string | null;
  user_platform_id: string | null;
  avatarUrl?: string | null;
  // Organization app specific fields
  firstName?: string;
  lastName?: string;
  userPlatformId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshProfile?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      console.log('[AuthContext] Fetching user from local API...');
      console.log('[AuthContext] Current URL:', window.location.href);
      
      // Fetch user info from local organization API (avoids CORS issues)
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      console.log('[AuthContext] API response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('[AuthContext] User data from API:', userData);
        
        setUser({
          id: userData.id || '',
          name: userData.name || userData.firstName + ' ' + userData.lastName || 'User',
          email: userData.email || '',
          role: userData.role || 'user',
          entity_platform_id: userData.entity_platform_id || null,
          employee_entity_id: userData.employee_entity_id || null,
          user_platform_id: userData.user_platform_id || userData.userPlatformId || null,
          avatarUrl: userData.avatarUrl || null,
          // Keep organization app specific fields for backward compatibility
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          userPlatformId: userData.userPlatformId || userData.user_platform_id || '',
        });
        console.log('[AuthContext] User set successfully from API');
      } else {
        console.log('[AuthContext] Auth check failed, status:', response.status);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session ? 'session exists' : 'no session');
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('[AuthContext] User signed in or token refreshed, fetching user data...');
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out');
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async (): Promise<void> => {
    try {
      console.log('[AuthContext] Refreshing user profile...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('[AuthContext] Profile refreshed:', userData);
        
        setUser(prevUser => ({
          ...prevUser!,
          avatarUrl: userData.avatarUrl || prevUser?.avatarUrl || null,
          // Update any other fields that might have changed
          name: userData.name || userData.firstName + ' ' + userData.lastName || prevUser?.name || 'User',
          firstName: userData.firstName || userData.first_name || prevUser?.firstName || '',
          lastName: userData.lastName || userData.last_name || prevUser?.lastName || '',
        }));
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh profile:', error);
    }
  };

  const logout = async () => {
    console.log('[AuthContext] Logging out...');
    
    try {
      // Call the logout API endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[AuthContext] Logout API call failed:', error);
    }
    
    // Reset user state
    setUser(null);
    
    console.log('[AuthContext] Redirecting to login...');
    
    // Redirect to login page
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
