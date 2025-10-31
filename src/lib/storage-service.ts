import { supabase } from '@/lib/supabase-client';

/**
 * Storage structure:
 * - Bucket: avatars (public)
 *   - Path: organizations/{organization_platform_id}/{filename}
 *   - Path: entities/{entity_platform_id}/{filename}
 *   - Path: users/{user_platform_id}/{filename}
 *   - Path: pets/{pet_id}/{filename}
 */

export type StorageType = 'organization' | 'entity' | 'user' | 'pet';

export interface StorageMetadata {
  url: string;
  path: string;
  bucket: string;
  storage_type: 'supabase';
  uploaded_at: string;
}

interface UploadOptions {
  type: StorageType;
  id: string; // organization_platform_id, entity_platform_id, user_id, or pet_id
  file: File;
  oldPath?: string; // For deletion of old file when updating
}

/**
 * Get the bucket and path for a storage type
 */
function getStorageLocation(type: StorageType, id: string, filename: string): { bucket: string; path: string } {
  switch (type) {
    case 'organization':
      return {
        bucket: 'avatars',
        path: `organizations/${id}/${filename}`
      };
    case 'entity':
      return {
        bucket: 'avatars',
        path: `entities/${id}/${filename}`
      };
    case 'user':
      return {
        bucket: 'avatars',
        path: `users/${id}/${filename}`
      };
    case 'pet':
      return {
        bucket: 'avatars',
        path: `pets/${id}/${filename}`
      };
    default:
      throw new Error(`Invalid storage type: ${type}`);
  }
}

/**
 * Generate a unique filename
 */
function generateFilename(originalName: string): string {
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Upload a file to the appropriate bucket and path
 */
export async function uploadFile(options: UploadOptions): Promise<StorageMetadata> {
  const { type, id, file, oldPath } = options;
  
  // Debug: Log the input parameters
  console.log(`[StorageService] Upload called with:`, {
    type,
    id,
    fileName: file.name,
    fileSize: file.size,
    oldPath
  });
  
  // Validate id is not empty
  if (!id || id.trim() === '') {
    throw new Error(`Invalid id for storage type ${type}: id cannot be empty`);
  }
  
  // Generate filename
  const filename = generateFilename(file.name);
  
  // Get bucket and path
  const { bucket, path } = getStorageLocation(type, id, filename);
  
  console.log(`[StorageService] Uploading ${type} file to ${bucket}/${path}`);
  
  // Delete old file if exists
  if (oldPath) {
    try {
      const oldBucket = oldPath.split('/')[0];
      const oldFilePath = oldPath.substring(oldBucket.length + 1);
      await supabase.storage.from(oldBucket).remove([oldFilePath]);
      console.log(`[StorageService] Deleted old file: ${oldPath}`);
    } catch (error) {
      console.warn(`[StorageService] Failed to delete old file: ${oldPath}`, error);
    }
  }
  
  // Upload new file
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    console.error(`[StorageService] Upload error:`, uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  const url = urlData.publicUrl;
  
  const metadata: StorageMetadata = {
    url,
    path: `${bucket}/${path}`,
    bucket: bucket,
    storage_type: 'supabase',
    uploaded_at: new Date().toISOString()
  };
  
  console.log(`[StorageService] Upload successful:`, metadata);
  
  return metadata;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(storagePath: string): Promise<void> {
  // storagePath format: "bucket/path/to/file"
  const [bucket, ...pathParts] = storagePath.split('/');
  const path = pathParts.join('/');
  
  console.log(`[StorageService] Deleting file: ${bucket}/${path}`);
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) {
    console.error(`[StorageService] Delete error:`, error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
  
  console.log(`[StorageService] File deleted successfully`);
}

/**
 * Get public URL for a storage path
 */
export function getPublicUrl(storagePath: string): string {
  // storagePath format: "bucket/path/to/file"
  const [bucket, ...pathParts] = storagePath.split('/');
  const path = pathParts.join('/');
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Extract URL from storage metadata (handles both old and new formats)
 */
export function extractStorageUrl(storage: any): string | null {
  if (!storage) return null;
  
  // If it's already a string URL
  if (typeof storage === 'string') {
    // If it's a full URL, return it
    if (storage.startsWith('http')) {
      return storage;
    }
    // If it's a path, construct the URL
    return getPublicUrl(storage);
  }
  
  // If it's an object with url property
  if (typeof storage === 'object' && storage.url) {
    return storage.url;
  }
  
  // If it's an object with path property
  if (typeof storage === 'object' && storage.path) {
    return getPublicUrl(storage.path);
  }
  
  return null;
}

/**
 * Migrate old storage format to new format
 * Use this to update existing records to the new storage structure
 */
export async function migrateStorageFormat(
  oldStorage: any,
  type: StorageType,
  id: string
): Promise<StorageMetadata | null> {
  const url = extractStorageUrl(oldStorage);
  if (!url) return null;
  
  // Extract path from URL or use existing path
  let path = '';
  if (typeof oldStorage === 'object' && oldStorage.path) {
    path = oldStorage.path;
  } else if (typeof oldStorage === 'string' && !oldStorage.startsWith('http')) {
    path = oldStorage;
  } else {
    // Can't migrate without a path
    return null;
  }
  
  // Determine bucket from path or type
  const { bucket } = getStorageLocation(type, id, 'temp.jpg');
  
  return {
    url,
    path,
    bucket,
    storage_type: 'supabase',
    uploaded_at: new Date().toISOString()
  };
}
