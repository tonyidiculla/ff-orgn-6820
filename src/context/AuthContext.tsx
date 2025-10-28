'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  userPlatformId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICES_URL || 'http://localhost:6800';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check if user is authenticated on mount
  useEffect(() => {
    // Add a small delay to ensure cookie is set by middleware
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get('furfield_token');
    
    console.log('[AuthContext] Checking auth, token exists:', !!token);
    
    if (!token) {
      console.log('[AuthContext] No token found, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('[AuthContext] Fetching profile from:', `${AUTH_SERVICE_URL}/api/auth/profile`);
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      
      console.log('[AuthContext] Profile response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.data?.user || response.data.user;
        console.log('[AuthContext] User data:', userData);
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error: any) {
      // Silently handle auth errors - middleware will handle redirects
      console.error('[AuthContext] Auth check failed:', error.response?.data || error.message);
      console.log('Auth check failed, but keeping cookie for middleware to handle');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { token, refreshToken: refreshTokenValue, user: userData } = response.data;
        
        // Store tokens in cookies
        Cookies.set('furfield_token', token, { expires: 1 }); // 1 day
        Cookies.set('furfield_refresh_token', refreshTokenValue, { expires: 7 }); // 7 days
        
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    Cookies.remove('furfield_token');
    Cookies.remove('furfield_refresh_token');
    setUser(null);
    // Redirect to central auth service logout page to clear all auth data
    window.location.href = 'http://localhost:6800/logout';
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = Cookies.get('furfield_refresh_token');
      if (!refreshTokenValue) {
        return false;
      }

      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/refresh`, {
        refreshToken: refreshTokenValue,
      });

      if (response.data.success) {
        const { token, refreshToken: newRefreshToken, user: userData } = response.data;
        
        Cookies.set('furfield_token', token, { expires: 1 });
        Cookies.set('furfield_refresh_token', newRefreshToken, { expires: 7 });
        
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    const token = Cookies.get('furfield_token');
    if (!token) return;

    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      
      if (response.data.success) {
        const userData = response.data.data?.user || response.data.user;
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Profile refresh failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      refreshToken,
      refreshProfile,
      isAuthenticated,
    }}>
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
