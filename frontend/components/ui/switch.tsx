/**
 * Switch Component
 *
 * A beautiful toggle switch component with enhanced UI and accessibility.
 * Optimized for both light and dark modes with smooth animations and mobile-friendly design.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Switch({ 
  checked, 
  onCheckedChange, 
  disabled = false, 
  className,
  size = 'md'
}: SwitchProps) {
  const sizeClasses = {
    sm: {
      track: 'h-5 w-9', // Increased for better mobile touch
      thumb: 'h-4 w-4',
      translate: checked ? 'translate-x-4' : 'translate-x-0.5',
      touchTarget: 'p-1' // Extra padding for touch
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: checked ? 'translate-x-5' : 'translate-x-0.5',
      touchTarget: 'p-1.5'
    },
    lg: {
      track: 'h-7 w-13', // Slightly wider for better mobile experience
      thumb: 'h-6 w-6',
      translate: checked ? 'translate-x-6' : 'translate-x-0.5',
      touchTarget: 'p-2'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        // Base styles with mobile-friendly touch target
        "relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900",
        "disabled:cursor-not-allowed disabled:opacity-50",
        
        // Mobile-optimized interactions
        "hover:shadow-md active:scale-95 touch-manipulation",
        "min-h-[44px] min-w-[44px] flex justify-center items-center", // iOS/Android minimum touch target
        
        // Touch target padding
        currentSize.touchTarget,
        
        className
      )}
    >
      {/* Actual switch track */}
      <div className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out",
        
        // Size classes
        currentSize.track,
        
        // Color states - enhanced green theme for better visibility
        checked 
          ? "bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25" 
          : "bg-gray-300 dark:bg-gray-600 shadow-inner",
        
        // Hover states
        !disabled && (checked 
          ? "hover:from-green-600 hover:to-green-700" 
          : "hover:bg-gray-400 dark:hover:bg-gray-500"),
      )}>
        {/* Track inner shadow for depth */}
        <div className={cn(
          "absolute inset-0 rounded-full",
          !checked && "shadow-inner"
        )} />
        
        {/* Thumb */}
        <span
          className={cn(
            "pointer-events-none relative block rounded-full transition-all duration-200 ease-in-out",
            "shadow-lg ring-0",
            
            // Size classes
            currentSize.thumb,
            currentSize.translate,
            
            // Color and shadow - enhanced for mobile visibility
            "bg-white dark:bg-gray-100",
            checked 
              ? "shadow-lg shadow-black/20" 
              : "shadow-md shadow-black/10 dark:shadow-black/30"
          )}
        >
          {/* Inner highlight for premium look */}
          <div className={cn(
            "absolute inset-0.5 rounded-full bg-gradient-to-br",
            "from-white/80 to-white/20 dark:from-gray-50/80 dark:to-gray-50/20"
          )} />
          
          {/* Subtle indicator dot when checked - green theme */}
          {checked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full opacity-70" />
            </div>
          )}
        </span>
        
        {/* Ripple effect on click - optimized for touch */}
        <span className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-150",
          "bg-current opacity-0 hover:opacity-10 active:opacity-20"
        )} />
      </div>
    </button>
  );
}
