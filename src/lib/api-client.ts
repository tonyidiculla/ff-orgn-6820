/**
 * Unified API Client
 * Provides consistent API calling patterns for both HMS and Organization apps
 */

// Base API configuration
const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  timeout?: number;
}

/**
 * Unified API Client Class
 * Handles all API communications with consistent error handling and response formatting
 */
export class ApiClient {
  private static baseUrl = API_BASE_URL;
  private static defaultHeaders = {
    'Content-Type': 'application/json',
  };

  /**
   * Make API request with consistent error handling
   */
  static async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      credentials = 'include',
      timeout = 10000,
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Remove Content-Type for FormData
    if (body instanceof FormData) {
      delete (requestHeaders as any)['Content-Type'];
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
      credentials,
    };

    if (body) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: any = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`,
          data: data
        };
      }

      // Handle different response formats
      if (data && typeof data === 'object' && 'success' in data) {
        return data;
      }

      return {
        success: true,
        data: data
      };

    } catch (error: any) {
      console.error(`API request failed: ${method} ${url}`, error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout'
        };
      }

      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * GET request
   */
  static async get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  static async post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  static async put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  static async delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  static async patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * Upload file
   */
  static async upload<T = any>(endpoint: string, file: File, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData
    });
  }

  /**
   * Upload avatar
   */
  static async uploadAvatar<T = any>(file: File, token?: string): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.request<T>('/auth/api/auth/avatar', {
      method: 'POST',
      body: formData,
      headers
    });
  }
}

/**
 * Authentication API Service
 */
export class AuthApi {
  /**
   * Get current user info
   */
  static async getCurrentUser() {
    return ApiClient.get('/api/auth/me');
  }

  /**
   * Upload user avatar
   */
  static async uploadAvatar(file: File, token?: string) {
    return ApiClient.uploadAvatar(file, token);
  }

  /**
   * Logout user
   */
  static async logout() {
    // Client-side logout - clear session data
    const { clearAllSessionData } = await import('../utils/sessionUtils');
    clearAllSessionData();
    
    // Redirect to auth service
    window.location.href = 'http://localhost:6800';
  }
}

/**
 * Organization API Service
 */
export class OrganizationApi {
  /**
   * Get user's organizations
   */
  static async getUserOrganizations() {
    return ApiClient.get('/api/organizations');
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(id: string) {
    return ApiClient.get(`/api/organizations/${id}`);
  }

  /**
   * Create new organization
   */
  static async createOrganization(organizationData: any) {
    return ApiClient.post('/api/organizations', organizationData);
  }

  /**
   * Update organization
   */
  static async updateOrganization(id: string, organizationData: any) {
    return ApiClient.put(`/api/organizations/${id}`, organizationData);
  }

  /**
   * Delete organization
   */
  static async deleteOrganization(id: string) {
    return ApiClient.delete(`/api/organizations/${id}`);
  }
}

/**
 * Entity API Service
 */
export class EntityApi {
  /**
   * Get user's entities
   */
  static async getUserEntities(organizationPlatformId?: string) {
    const params = organizationPlatformId ? `?organizationPlatformId=${organizationPlatformId}` : '';
    return ApiClient.get(`/api/entities${params}`);
  }

  /**
   * Get entity by ID
   */
  static async getEntityById(id: string) {
    return ApiClient.get(`/api/entities/${id}`);
  }

  /**
   * Create new entity
   */
  static async createEntity(entityData: any) {
    return ApiClient.post('/api/entities', entityData);
  }

  /**
   * Update entity
   */
  static async updateEntity(id: string, entityData: any) {
    return ApiClient.put(`/api/entities/${id}`, entityData);
  }

  /**
   * Delete entity
   */
  static async deleteEntity(id: string) {
    return ApiClient.delete(`/api/entities/${id}`);
  }
}

/**
 * Subscription API Service (HMS specific)
 */
export class SubscriptionApi {
  /**
   * Get entity subscriptions
   */
  static async getEntitySubscriptions() {
    return ApiClient.get('/api/subscriptions');
  }

  /**
   * Update subscription
   */
  static async updateSubscription(subscriptionData: any) {
    return ApiClient.post('/api/subscriptions', subscriptionData);
  }
}

// Export unified API client and services
export default {
  ApiClient,
  AuthApi,
  OrganizationApi,
  EntityApi,
  SubscriptionApi,
};