/**
 * Utility functions for session management and cookie handling
 * Provides comprehensive session cleanup for FURFIELD authentication system
 */

import Cookies from 'js-cookie';

/**
 * Comprehensive cookie clearing function using js-cookie
 * Clears cookies across multiple domains and paths to ensure complete cleanup
 */
export const clearCookie = (name: string): void => {
  // Remove using js-cookie for current domain/path
  Cookies.remove(name);
  
  // Remove for specific paths and domains
  Cookies.remove(name, { path: '/' });
  Cookies.remove(name, { path: '/', domain: 'localhost' });
  Cookies.remove(name, { path: '/', domain: window.location.hostname });
  
  // Clear for root domain (if subdomain)
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length > 1) {
    const rootDomain = parts.slice(-2).join('.');
    Cookies.remove(name, { path: '/', domain: `.${rootDomain}` });
  }
};

/**
 * Clear all FURFIELD-related cookies
 * Removes all known authentication and session cookies
 */
export const clearAllFurfieldCookies = (): void => {
  console.log('[SessionUtils] Clearing all FURFIELD session cookies...');
  
  // Main authentication cookies
  clearCookie('furfield_token');
  clearCookie('furfield_refresh_token');
  
  // Legacy cookies (may exist from previous versions)
  clearCookie('furfield_user');
  clearCookie('furfield_session');
  
  // Framework cookies that might be set
  clearCookie('next-auth.session-token');
  clearCookie('__Secure-next-auth.session-token');
  clearCookie('__Host-next-auth.csrf-token');
  
  // Supabase auth cookies (in case they're used anywhere)
  clearCookie('sb-access-token');
  clearCookie('sb-refresh-token');
  clearCookie('supabase-auth-token');
  
  console.log('[SessionUtils] All cookies cleared');
};

/**
 * Clear all browser storage
 * Clears localStorage and sessionStorage completely
 */
export const clearAllStorage = (): void => {
  console.log('[SessionUtils] Clearing all browser storage...');
  
  // Clear localStorage
  try {
    localStorage.clear();
    console.log('[SessionUtils] localStorage cleared');
  } catch (error) {
    console.warn('[SessionUtils] Could not clear localStorage:', error);
  }
  
  // Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('[SessionUtils] sessionStorage cleared');
  } catch (error) {
    console.warn('[SessionUtils] Could not clear sessionStorage:', error);
  }
};

/**
 * Complete session cleanup
 * Performs comprehensive cleanup of all session data
 */
export const clearAllSessionData = (): void => {
  console.log('[SessionUtils] Performing complete session cleanup...');
  
  clearAllFurfieldCookies();
  clearAllStorage();
  
  console.log('[SessionUtils] Complete session cleanup finished');
};

/**
 * Get all cookies as an object (for debugging)
 */
export const getAllCookies = (): Record<string, string> => {
  return document.cookie
    .split(';')
    .reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
      return cookies;
    }, {} as Record<string, string>);
};

/**
 * Debug function to log all current cookies
 */
export const logAllCookies = (): void => {
  const cookies = getAllCookies();
  console.log('[SessionUtils] Current cookies:', cookies);
  console.log('[SessionUtils] Cookie count:', Object.keys(cookies).length);
};