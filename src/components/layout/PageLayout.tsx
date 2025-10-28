'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Centralized Page Layout Components
 * Used across all Furfield applications for consistent page structure
 */

// ============================================================================
// Main Page Wrapper
// ============================================================================

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Basic page wrapper - provides minimal structure
 * Cards sit directly on gradient background
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('min-h-screen', className)}>
      {children}
    </div>
  );
};

// ============================================================================
// Content Area Layout
// ============================================================================

interface ContentAreaProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
}

/**
 * Content area with responsive max-width and padding
 */
export const ContentArea: React.FC<ContentAreaProps> = ({ 
  children, 
  maxWidth = '7xl',
  className 
}) => {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  };

  return (
    <div className={cn(
      maxWidthClasses[maxWidth],
      'mx-auto px-4 sm:px-6 lg:px-8 py-8',
      className
    )}>
      {children}
    </div>
  );
};

// ============================================================================
// Content Card
// ============================================================================

interface ContentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

/**
 * White card component for content sections
 * Sits directly on gradient background
 */
export const ContentCard: React.FC<ContentCardProps> = ({ 
  title, 
  children, 
  className = '',
  headerActions
}) => {
  return (
    <div className={cn('bg-white shadow-sm rounded-lg border border-gray-200', className)}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {headerActions && (
            <div className="flex items-center space-x-3">
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// Metrics Grid
// ============================================================================

interface MetricsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * Responsive grid for metric cards
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({ 
  children, 
  columns = 4,
  className = '' 
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
  };

  return (
    <div className={cn('grid', gridCols[columns], 'gap-6', className)}>
      {children}
    </div>
  );
};

// ============================================================================
// Spacing Components
// ============================================================================

interface SpacingProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Vertical spacing container
 */
export const VStack: React.FC<SpacingProps> = ({ 
  children, 
  size = 'md',
  className 
}) => {
  const spacingClasses = {
    'sm': 'space-y-4',
    'md': 'space-y-8',
    'lg': 'space-y-12',
    'xl': 'space-y-16'
  };

  return (
    <div className={cn(spacingClasses[size], className)}>
      {children}
    </div>
  );
};

/**
 * Horizontal spacing container
 */
export const HStack: React.FC<SpacingProps> = ({ 
  children, 
  size = 'md',
  className 
}) => {
  const spacingClasses = {
    'sm': 'space-x-4',
    'md': 'space-x-8',
    'lg': 'space-x-12',
    'xl': 'space-x-16'
  };

  return (
    <div className={cn('flex items-center', spacingClasses[size], className)}>
      {children}
    </div>
  );
};
