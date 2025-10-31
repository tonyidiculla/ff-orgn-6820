'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { uploadFile } from '@/lib/storage-service';
import { supabase } from '@/lib/supabase-client';

export interface FurfieldHeaderProps {
  entityName?: string;
  entityLocation?: string;
  entityLogo?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  homeRoute?: string;
  title?: string;
  subtitle?: string;
}

export const FurfieldHeader: React.FC<FurfieldHeaderProps> = ({
  entityName,
  entityLocation,
  entityLogo,
  showSearch = false,
  onSearch,
  homeRoute = '/organization',
  title = 'FURFIELD Organization Management',
  subtitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, refreshProfile } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleAvatarClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      e.target.value = '';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[FurfieldHeader] Please upload an image file');
      e.target.value = '';
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    console.log('[FurfieldHeader] File size:', file.size, 'bytes, Max:', maxSize, 'bytes');
    if (file.size > maxSize) {
      console.error('[FurfieldHeader] Avatar file size must be less than 2MB. File size:', file.size, 'bytes');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      console.log('[FurfieldHeader] Uploading avatar for user:', user.id);
      
      // Get user's platform ID from their profile
      const { data: profile } = await supabase
        .from('profiles_with_auth')
        .select('user_platform_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.user_platform_id) {
        throw new Error('User platform ID not found');
      }

      // Upload avatar using storage service
      const result = await uploadFile({
        file,
        type: 'user',
        id: profile.user_platform_id
      });

      console.log('[FurfieldHeader] Avatar uploaded successfully:', result.url);

      // Update user profile with new avatar storage in the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_storage: {
            url: result.url,
            bucket: 'avatars',
            storage_type: 'supabase'
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Refresh profile to show new avatar
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('[FurfieldHeader] Avatar upload failed:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Generate display name and initials
  const displayName = user?.name || user?.firstName + ' ' + user?.lastName || 'User';
  const initials = displayName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-md border-b border-white/30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - FURFIELD Branding */}
        <Link href={homeRoute} className="flex items-center gap-4">
          {/* FURFIELD Logo and Title */}
          <div className="flex items-center gap-3">
            <Image 
              src="/Furfield-icon.png" 
              alt="Furfield Logo" 
              width={48}
              height={48}
              className="rounded-lg"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
        </Link>

        {/* Entity Section (if applicable) */}
        {entityName && (
          <div className="flex items-center gap-3 ml-6 pl-6 border-l border-gray-300">
            {entityLogo ? (
              <Image 
                src={entityLogo} 
                alt={`${entityName} Logo`} 
                width={40}
                height={40}
                className="rounded-lg"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {entityName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{entityName}</h2>
              {entityLocation && (
                <p className="text-xs text-gray-600">{entityLocation}</p>
              )}
            </div>
          </div>
        )}

        {/* Center Section - Search Bar (Optional) */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </form>
          </div>
        )}

        {/* Right Section - User Profile & Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Home Icon */}
              <Link 
                href={homeRoute}
                className="rounded-lg p-2 text-slate-700 transition hover:bg-sky-100 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                title="Home"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>

              {/* User Info */}
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-gray-900">{displayName}</div>
                <div className="text-[10px] text-gray-500">{user.role || 'Organization User'}</div>
              </div>
              
              {/* Avatar */}
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploading}
                className="relative w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-emerald-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                title="Click to upload avatar"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm">{initials}</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    ...
                  </div>
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          ) : (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
        </div>
      </div>

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </header>
  );
};

export default FurfieldHeader;