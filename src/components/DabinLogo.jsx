import React from 'react';

/**
 * DABIN.Tv Official Brand Logo Component
 * 
 * Displays the high-resolution DABIN.Tv emblem and typography.
 * Supports animated glowing drop shadows, responsive classes, and customizable styling.
 */
export default function DabinLogo({ 
  className = "h-9 w-auto", 
  style = {}, 
  animated = false,
  iconOnly = false 
}) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className} ${animated ? 'animate-logo-float' : ''}`}
      style={style}
    >
      <img
        src="/dabin-logo.png"
        alt="DABIN.Tv"
        className="h-full w-auto max-h-full object-contain filter drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
        loading="eager"
      />
    </div>
  );
}
