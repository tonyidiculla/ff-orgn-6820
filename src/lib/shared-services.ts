/**
 * Shared Organization and Entity Services
 * Provides unified data access patterns for both HMS and Organization apps
 */

import { createClient } from '@supabase/supabase-js';
import { 
  getOrganizationById, 
  getHospitalById, 
  getHospitalsByOrganization,
  getOrganizationsByOwner 
} from './database-service';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Organization types
export interface Organization {
  id?: string;
  organization_id?: string;
  organization_platform_id: string;
  organization_name: string;
  brand_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  is_active?: boolean | string;
  owner_platform_id?: string;
  logo_storage?: any;
  created_at?: string;
  updated_at?: string;
}

// Entity types
export interface Entity {
  entity_id?: string;
  entity_platform_id: string;
  entity_name: string;
  entity_type?: string;
  organization_id?: string;
  organization_platform_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  post_code?: string;
  is_active?: boolean;
  created_at?: string;
  manager_email_id?: string;
  manager_phone_number?: string;
}

/**
 * Organization Service
 * Handles organization-related data operations
 */
export class OrganizationService {
  /**
   * Get organizations owned by a user
   */
  static async getUserOrganizations(userPlatformId: string): Promise<Organization[]> {
    try {
      const result = await getOrganizationsByOwner(userPlatformId);
      if (!result.success) {
        console.error('[OrganizationService] Error:', result.error);
        return [];
      }
      return result.data || [];
    } catch (error) {
      console.error('[OrganizationService] Error fetching user organizations:', error);
      return [];
    }
  }

  /**
   * Get organization by platform ID
   */
  static async getOrganizationByPlatformId(platformId: string): Promise<Organization | null> {
    try {
      const result = await getOrganizationById(platformId);
      if (!result.success) {
        console.error('[OrganizationService] Error:', result.error);
        return null;
      }
      return result.data;
    } catch (error) {
      console.error('[OrganizationService] Error fetching organization:', error);
      return null;
    }
  }

  /**
   * Get all organizations (admin function)
   */
  static async getAllOrganizations(): Promise<Organization[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .is('deleted_at', null)
        .order('organization_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[OrganizationService] Error fetching all organizations:', error);
      return [];
    }
  }
}

/**
 * Entity Service
 * Handles entity-related data operations
 */
export class EntityService {
  /**
   * Get entities for user's organizations
   */
  static async getUserEntities(userPlatformId: string): Promise<Entity[]> {
    try {
      // First get user's organizations
      const organizations = await OrganizationService.getUserOrganizations(userPlatformId);
      const orgPlatformIds = organizations.map(org => org.organization_platform_id);

      if (orgPlatformIds.length === 0) {
        return [];
      }

      // Then get entities for those organizations
      const { data, error } = await supabase
        .from('global_organization_entity')
        .select(`
          entity_id,
          entity_platform_id,
          entity_name,
          entity_type,
          organization_id,
          email,
          phone,
          city,
          state,
          country,
          is_active,
          created_at
        `)
        .in('organization_id', orgPlatformIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[EntityService] Error fetching user entities:', error);
      return [];
    }
  }

  /**
   * Get entities for a specific organization
   */
  static async getOrganizationEntities(organizationPlatformId: string): Promise<Entity[]> {
    try {
      const result = await getHospitalsByOrganization(organizationPlatformId);
      if (!result.success) {
        console.error('[EntityService] Error:', result.error);
        return [];
      }
      return result.data || [];
    } catch (error) {
      console.error('[EntityService] Error fetching organization entities:', error);
      return [];
    }
  }

  /**
   * Get entity by platform ID
   */
  static async getEntityByPlatformId(platformId: string): Promise<Entity | null> {
    try {
      const result = await getHospitalById(platformId);
      if (!result.success) {
        console.error('[EntityService] Error:', result.error);
        return null;
      }
      return result.data;
    } catch (error) {
      console.error('[EntityService] Error fetching entity:', error);
      return null;
    }
  }

  /**
   * Get entities with subscription data (HMS specific)
   */
  static async getEntitiesWithSubscriptions(userEntityPlatformId?: string): Promise<any[]> {
    try {
      if (!userEntityPlatformId) {
        return [];
      }

      // This would typically call HMS-specific subscription logic
      // For now, return basic entity data
      const entity = await this.getEntityByPlatformId(userEntityPlatformId);
      return entity ? [entity] : [];
    } catch (error) {
      console.error('[EntityService] Error fetching entities with subscriptions:', error);
      return [];
    }
  }
}

/**
 * Avatar/File Upload Service
 * Handles file uploads for avatars and other assets
 */
export class FileUploadService {
  /**
   * Upload avatar for authenticated user
   */
  static async uploadAvatar(file: File, token: string): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Please select an image file' };
      }

      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Image size must be less than 5MB' };
      }

      // Create form data
      const formData = new FormData();
      formData.append('avatar', file);

      // Upload to auth service
      const response = await fetch('/auth/api/auth/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to upload avatar' };
      }

      return { success: true, avatarUrl: result.avatarUrl };
    } catch (error) {
      console.error('[FileUploadService] Avatar upload error:', error);
      return { success: false, error: 'Network error during upload' };
    }
  }
}

export default {
  OrganizationService,
  EntityService,
  FileUploadService,
};