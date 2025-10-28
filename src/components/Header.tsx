'use client';

import React from 'react';
import { FurfieldHeader } from './FurfieldHeader';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
  const { user, loading, logout, refreshProfile } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      console.log('📤 Starting avatar upload:', { name: file.name, size: file.size, type: file.type });
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const formData = new FormData();
      formData.append('avatar', file);

      // Import Cookies dynamically
      const Cookies = (await import('js-cookie')).default;
      const token = Cookies.get('furfield_token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      console.log('🌐 Uploading to auth service...');
      const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICES_URL || 'http://localhost:6800';
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('📥 Upload response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      console.log('✅ Avatar uploaded successfully, refreshing profile...');
      
      // Refresh profile to get new avatar URL
      await refreshProfile();
      
      console.log('✅ Profile refreshed');
      
      alert('Avatar uploaded successfully!');
    } catch (error: any) {
      console.error('❌ Avatar upload error:', error);
      alert(error.message || 'Failed to upload avatar');
    }
  };

  // Don't show guest user during initial load
  if (loading) {
    return (
      <FurfieldHeader
        userName=""
        userRole=""
        loading={true}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <FurfieldHeader
      userName={user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
      displayName={user?.role || 'Guest'}
      userAvatar={user?.avatarUrl}
      onLogout={handleLogout}
      onAvatarUpload={handleAvatarUpload}
    />
  );
};
