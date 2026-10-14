import React from 'react';

/**
 * Ultra-Sleek Luxury 3D Vector SVG Logo for NNDD.TV
 * Features:
 * - 3D crystal play prism with electric cyan / royal blue refraction facets
 * - Bold metallic chrome gradient typography (NNDD.TV)
 * - Animated prop: 3D floating pulse, neon rim shimmer, and light sweep effect
 */
export default function NnddLogo({ 
  className = "h-9 w-auto", 
  style = {}, 
  animated = false,
  iconOnly = false
}) {
  const uniqueId = React.useId().replace(/:/g, '_');

  return (
    <svg 
      viewBox={iconOnly ? "0 0 190 190" : "0 0 680 190"} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? 'nndd-animated-logo' : ''}`}
      style={style}
      aria-label="NNDD.TV"
    >
      <defs>
        {/* Crystal Prism Facet Gradients */}
        <linearGradient id={`prismFacetA_${uniqueId}`} x1="30" y1="30" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="50%" stopColor="#00A8FF" />
          <stop offset="100%" stopColor="#0052D4" />
        </linearGradient>

        <linearGradient id={`prismFacetB_${uniqueId}`} x1="40" y1="50" x2="150" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id={`prismFacetC_${uniqueId}`} x1="80" y1="95" x2="145" y2="155" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        <linearGradient id={`prismSpecular_${uniqueId}`} x1="45" y1="45" x2="140" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="35%" stopColor="#E0F2FE" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </linearGradient>

        {/* Outer Broadcast Wave Gradient */}
        <linearGradient id={`waveGrad_${uniqueId}`} x1="10" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
        </linearGradient>

        {/* Metallic Chrome Wordmark Gradient */}
        <linearGradient id={`chromeWordmark_${uniqueId}`} x1="200" y1="40" x2="680" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="75%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>

        {/* TV Badge Accent Gradient */}
        <linearGradient id={`tvBadgeGrad_${uniqueId}`} x1="600" y1="95" x2="675" y2="155" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* 3D Drop Shadow & Neon Glow */}
        <filter id={`neonGlow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00F2FE" floodOpacity="0.35" />
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.7" />
        </filter>

        <filter id={`textShadow_${uniqueId}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.75" />
        </filter>

        {/* Inline Animations when animated={true} */}
        {animated && (
          <style>{`
            .nndd-animated-logo {
              animation: nnddFloat 3.2s ease-in-out infinite;
            }
            .nndd-prism-glow {
              animation: nnddNeonPulse 2.4s ease-in-out infinite alternate;
              transform-origin: 95px 95px;
            }
            .nndd-shimmer-wave {
              animation: nnddShimmer 3s ease-in-out infinite;
            }
            @keyframes nnddFloat {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-4px) scale(1.015); }
            }
            @keyframes nnddNeonPulse {
              0% { filter: drop-shadow(0 0 10px rgba(0, 242, 254, 0.4)) drop-shadow(0 0 20px rgba(37, 99, 235, 0.2)); }
              100% { filter: drop-shadow(0 0 24px rgba(0, 242, 254, 0.8)) drop-shadow(0 0 40px rgba(37, 99, 235, 0.5)); }
            }
            @keyframes nnddShimmer {
              0%, 100% { opacity: 0.85; stroke-dashoffset: 0; }
              50% { opacity: 1; stroke-dashoffset: 40; }
            }
          `}</style>
        )}
      </defs>

      {/* =========================================================================
          PART A: 3D CRYSTAL PRISM PLAY ICON
         ========================================================================= */}
      <g className={animated ? "nndd-prism-glow" : ""} filter={`url(#neonGlow_${uniqueId})`}>
        {/* Subtle Outer Broadcast Waves (Geometric Radiating Arcs) */}
        <path 
          d="M 32 46 A 75 75 0 0 0 32 144" 
          fill="none" 
          stroke={`url(#waveGrad_${uniqueId})`} 
          strokeWidth="6" 
          strokeLinecap="round" 
          className={animated ? "nndd-shimmer-wave" : ""}
          opacity="0.8"
        />
        <path 
          d="M 16 32 A 95 95 0 0 0 16 158" 
          fill="none" 
          stroke={`url(#waveGrad_${uniqueId})`} 
          strokeWidth="4.5" 
          strokeLinecap="round" 
          opacity="0.45"
        />

        {/* Top-Right Arc */}
        <path 
          d="M 125 32 A 75 75 0 0 1 162 68" 
          fill="none" 
          stroke={`url(#waveGrad_${uniqueId})`} 
          strokeWidth="6" 
          strokeLinecap="round" 
          opacity="0.7"
        />
        {/* Bottom-Right Arc */}
        <path 
          d="M 162 122 A 75 75 0 0 1 125 158" 
          fill="none" 
          stroke={`url(#waveGrad_${uniqueId})`} 
          strokeWidth="6" 
          strokeLinecap="round" 
          opacity="0.7"
        />

        {/* 3D Crystal Prism Play Button: Main Base Diamond/Triangle Facet */}
        <path 
          d="M 58 44 C 54 41.5 50 43.5 50 48.5 L 50 141.5 C 50 146.5 54 148.5 58 146 L 140 98.5 C 144 96 144 94 140 91.5 Z" 
          fill={`url(#prismFacetA_${uniqueId})`}
        />

        {/* Upper Refraction Facet (Light Catch) */}
        <path 
          d="M 50 48.5 L 95 95 L 140 91.5 L 58 44 C 54 41.5 50 43.5 50 48.5 Z" 
          fill={`url(#prismFacetB_${uniqueId})`}
        />

        {/* Lower Deep Ocean Facet */}
        <path 
          d="M 50 141.5 L 95 95 L 140 98.5 L 58 146 C 54 148.5 50 146.5 50 141.5 Z" 
          fill={`url(#prismFacetC_${uniqueId})`}
        />

        {/* Crystal Specular Bevel Edge (Gleam) */}
        <path 
          d="M 54 48 L 136 93.5 L 95 95 Z" 
          fill={`url(#prismSpecular_${uniqueId})`}
        />

        {/* Hollow Core Neon Play Triangle Accent */}
        <path 
          d="M 68 64 L 122 95 L 68 126 Z" 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="3.5" 
          strokeLinejoin="round" 
          strokeLinecap="round" 
          opacity="0.85"
        />
        <circle cx="82" cy="95" r="5" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* =========================================================================
          PART B: BOLD METALLIC CHROME WORDMARK (NNDD.TV)
         ========================================================================= */}
      {!iconOnly && (
        <g filter={`url(#textShadow_${uniqueId})`}>
          {/* Letter N (First) */}
          <path 
            d="M 188 148 L 188 44 L 210 44 L 254 116 L 254 44 L 276 44 L 276 148 L 254 148 L 210 76 L 210 148 Z" 
            fill={`url(#chromeWordmark_${uniqueId})`}
          />
          {/* Inner Accent Line on First N */}
          <path d="M 212 50 L 252 118" stroke="#38BDF8" strokeWidth="2.5" opacity="0.4" />

          {/* Letter N (Second) */}
          <path 
            d="M 292 148 L 292 44 L 314 44 L 358 116 L 358 44 L 380 44 L 380 148 L 358 148 L 314 76 L 314 148 Z" 
            fill={`url(#chromeWordmark_${uniqueId})`}
          />
          {/* Inner Accent Line on Second N */}
          <path d="M 316 50 L 356 118" stroke="#38BDF8" strokeWidth="2.5" opacity="0.4" />

          {/* Letter D (First) */}
          <path 
            d="M 396 44 L 442 44 C 476 44 494 62 494 96 C 494 130 476 148 442 148 L 396 148 Z M 418 64 L 418 128 L 440 128 C 462 128 471 116 471 96 C 471 76 462 64 440 64 Z" 
            fill={`url(#chromeWordmark_${uniqueId})`}
          />

          {/* Letter D (Second) */}
          <path 
            d="M 508 44 L 554 44 C 588 44 606 62 606 96 C 606 130 588 148 554 148 L 508 148 Z M 530 64 L 530 128 L 552 128 C 574 128 583 116 583 96 C 583 76 574 64 552 64 Z" 
            fill={`url(#chromeWordmark_${uniqueId})`}
          />

          {/* Glowing Electric Cyan Diamond Dot . */}
          <g filter={`url(#neonGlow_${uniqueId})`}>
            <polygon points="617,144 624,136 631,144 624,152" fill="#00F2FE" />
            <polygon points="621,144 624,140 627,144 624,148" fill="#FFFFFF" />
          </g>

          {/* TV Modern Glass Pill Badge */}
          <g transform="translate(636, 88)">
            <rect 
              x="0" 
              y="0" 
              width="44" 
              height="60" 
              rx="12" 
              fill={`url(#tvBadgeGrad_${uniqueId})`}
              opacity="0.9"
            />
            <rect 
              x="0.75" 
              y="0.75" 
              width="42.5" 
              height="58.5" 
              rx="11.25" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="1.5" 
              opacity="0.5"
            />
            {/* T */}
            <path d="M 6 16 L 22 16 M 14 16 L 14 44" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            {/* V */}
            <path d="M 24 16 L 31 44 L 38 16" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      )}
    </svg>
  );
}
