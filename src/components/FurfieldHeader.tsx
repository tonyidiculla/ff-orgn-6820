'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

export interface FurfieldHeaderProps {
  userName?: string;
  displayName?: string;
  onLogout?: () => void;
  onAvatarUpload?: (file: File) => void;
  userAvatar?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  loading?: boolean;
  userRole?: string;
}

export const FurfieldHeader: React.FC<FurfieldHeaderProps> = ({
  userName = 'Loading...',
  displayName = 'Loading...',
  onLogout,
  onAvatarUpload,
  userAvatar,
  showSearch = false,
  onSearch,
  loading = false,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-md shadow-md border-b border-white/30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - FURFIELD Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Image 
              src="/Furfield-icon.png" 
              alt="Furfield Logo" 
              width={40}
              height={40}
              className="rounded-lg"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FURFIELD</h1>
              <p className="text-sm text-gray-500">Organization Management</p>
            </div>
          </div>
        </div>

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
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </form>
          </div>
        )}

        {/* Right Section - User Profile & Logout */}
        <div className="flex items-center gap-4">
          {/* User Info */}
          {!loading && (
            <div className="text-right">
              <div className="font-medium text-gray-900">{userName}</div>
              <div className="text-sm text-gray-500">{displayName || userRole}</div>
            </div>
          )}
          
          {/* Avatar */}
          {!loading && (
            <div 
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:shadow-lg transition-shadow"
              onClick={onAvatarUpload ? handleAvatarClick : undefined}
            >
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-sm">
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          )}

          {/* Logout Button */}
          {onLogout && !loading && (
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input for avatar upload */}
      {onAvatarUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </header>
  );
};

export default FurfieldHeader;
