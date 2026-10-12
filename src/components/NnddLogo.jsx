import React from 'react';

/**
 * Pure white, precision vector SVG representation of the official NNDD.TV logo.
 * Completely transparent background, crisp geometry, infinite scaling.
 */
export default function NnddLogo({ className = "h-9 w-auto", style = {} }) {
  return (
    <svg 
      viewBox="0 0 685 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="NNDD.TV"
    >
      <defs>
        <filter id="nnddLogoDropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#nnddLogoDropShadow)">
        {/* Play Triangle Frame (Rounded hollow play button) */}
        <path 
          d="M 68 50 L 132 94 A 7.5 7.5 0 0 1 132 106 L 68 150 A 7.5 7.5 0 0 1 56 143.5 L 56 56.5 A 7.5 7.5 0 0 1 68 50 Z" 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="13.5" 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
        
        {/* Left Broadcast Arcs */}
        <path d="M 40 54 A 62 62 0 0 0 40 146" fill="none" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" />
        <path d="M 21 40 A 85 85 0 0 0 21 160" fill="none" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" />
        
        {/* Top-Right Broadcast Arcs */}
        <path d="M 98 38 A 62 62 0 0 1 146 64" fill="none" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" />
        <path d="M 110 18 A 85 85 0 0 1 170 50" fill="none" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" />
        
        {/* Bottom-Right Broadcast Arcs */}
        <path d="M 146 136 A 62 62 0 0 1 98 162" fill="none" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" />
        <path d="M 170 150 A 85 85 0 0 1 110 182" fill="none" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" />
        
        {/* Wordmark: NNDD */}
        {/* N 1 */}
        <path d="M 192 148 L 192 52 L 213 52 L 251 122 L 251 52 L 271 52 L 271 148 L 250 148 L 213 78 L 213 148 Z" fill="#FFFFFF"/>
        {/* N 2 */}
        <path d="M 284 148 L 284 52 L 305 52 L 343 122 L 343 52 L 363 52 L 363 148 L 342 148 L 305 78 L 305 148 Z" fill="#FFFFFF"/>
        {/* D 1 */}
        <path d="M 378 52 L 422 52 C 456 52 472 70 472 100 C 472 130 456 148 422 148 L 378 148 Z M 399 70 L 399 130 L 420 130 C 441 130 451 120 451 100 C 451 80 441 70 420 70 Z" fill="#FFFFFF"/>
        {/* D 2 */}
        <path d="M 486 52 L 530 52 C 564 52 580 70 580 100 C 580 130 564 148 530 148 L 486 148 Z M 507 70 L 507 130 L 528 130 C 549 130 559 120 559 100 C 559 80 549 70 528 70 Z" fill="#FFFFFF"/>
        
        {/* Dot . */}
        <circle cx="598" cy="142" r="7" fill="#FFFFFF" />
        
        {/* T */}
        <path d="M 612 106 L 638 106 L 638 116 L 629 116 L 629 148 L 621 148 L 621 116 L 612 116 Z" fill="#FFFFFF"/>
        
        {/* V */}
        <path d="M 641 106 L 650 106 L 658 139 L 666 106 L 675 106 L 663 148 L 653 148 Z" fill="#FFFFFF"/>
      </g>
    </svg>
  );
}
