'use client';

import React from 'react';
import { PageWrapper, ContentArea } from './PageLayout';

interface StandardPageWrapperProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
  className?: string;
}

/**
 * Standard page wrapper that combines PageWrapper and ContentArea
 * Provides consistent page structure across the organization app
 */
export const StandardPageWrapper: React.FC<StandardPageWrapperProps> = ({
  children,
  maxWidth = '6xl',
  color = 'cyan',  // Organization theme
  className
}) => {
  return (
    <PageWrapper color={color} className={className}>
      <ContentArea maxWidth={maxWidth}>
        {children}
      </ContentArea>
    </PageWrapper>
  );
};

export default StandardPageWrapper;