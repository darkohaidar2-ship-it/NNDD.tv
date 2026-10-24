import React from 'react';

/**
 * KOBIN.Tv Official Brand Logo Component (Aliased for DabinLogo)
 * 
 * Displays the high-resolution KOBIN.Tv emblem and typography.
 * Supports animated glowing drop shadows, responsive classes, and customizable styling.
 */
export default function DabinLogo({ 
  className = "h-9 w-auto", 
  style = {}, 
  animated = false,
  glow = false,
  iconOnly = false 
}) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className} ${
        animated ? 'animate-logo-float' : ''
      }`}
      style={style}
    >
      <img
        src="/kobin-logo.png"
        alt="KOBIN.Tv"
        className={`h-full w-auto max-h-full object-contain filter transition-all duration-300 ${
          glow 
            ? 'animate-dabin-glow' 
            : 'drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] drop-shadow-[0_0_14px_rgba(2,132,199,0.25)]'
        }`}
        loading="eager"
        onError={(e) => {
          if (e.target.src !== window.location.origin + '/kobin-logo-raw.png') {
            e.target.src = '/kobin-logo-raw.png';
          }
        }}
      />
    </div>
  );
}

export const KobinLogo = DabinLogo;
