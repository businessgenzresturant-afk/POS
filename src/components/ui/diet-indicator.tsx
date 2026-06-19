import React from 'react';

interface DietIndicatorProps {
  dietType: 'VEG' | 'NON_VEG';
  className?: string;
}

export function DietIndicator({ dietType, className = '' }: DietIndicatorProps) {
  return (
    <div
      className={`inline-flex items-center justify-center w-4 h-4 rounded-sm border-2 ${
        dietType === 'VEG'
          ? 'border-green-600 bg-white dark:bg-background'
          : 'border-red-600 bg-white dark:bg-background'
      } ${className}`}
      title={dietType === 'VEG' ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          dietType === 'VEG' ? 'bg-green-600' : 'bg-red-600'
        }`}
      />
    </div>
  );
}
