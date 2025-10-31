'use client';

import React from 'react';
import { FurfieldHeader } from './layout/FurfieldHeader';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {

  return (
    <FurfieldHeader
      title="FURFIELD Organization Management"
      subtitle="Manage your organizations and entities"
      homeRoute="/organization"
    />
  );
};
