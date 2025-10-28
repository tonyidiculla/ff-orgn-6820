import React from 'react';
import { cn } from '@/lib/utils';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard Furfield content container with gradient-friendly styling
 * Use this for main content sections, forms, and data displays
 * 
 * This is the centralized container component used across all Furfield apps
 * to ensure consistent styling and prevent design drift.
 * 
 * Cards sit directly on gradient backgrounds with solid white backgrounds.
 */
export const ContentContainer: React.FC<ContentContainerProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div 
      className={cn(
        // Standard Furfield container styling - solid white on gradient
        'rounded-3xl',
        'border border-gray-200',
        'bg-white',
        'px-12 py-8',
        'shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Compact variant for smaller sections
 */
export const CompactContainer: React.FC<ContentContainerProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div 
      className={cn(
        'rounded-2xl',
        'border border-gray-200',
        'bg-white',
        'p-6',
        'shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Form variant with adjusted padding
 */
export const FormContainer: React.FC<ContentContainerProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div 
      className={cn(
        'rounded-3xl',
        'border border-gray-200',
        'bg-white',
        'p-8',
        'shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
};
