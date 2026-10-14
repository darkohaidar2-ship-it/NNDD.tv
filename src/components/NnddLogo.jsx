import React from 'react';

/**
 * NNDD.TV Broadcast Vector SVG Logo
 * 
 * Features:
 * - Left Emblem: Sleek rounded play triangle framed by a thick glowing crescent 
 *   and concentric broadcast signal wave arcs on left, top-right, and bottom-right.
 * - Right Typography: Ultra-crisp heavy geometric sans-serif NNDD in glowing white, 
 *   followed by a bold dot and subscript .TV aligned to the baseline.
 * - animated prop: Sequential wave ripple/pulse effect & breathing glow on play triangle.
 * - iconOnly prop: Displays only the broadcast emblem (1:1 aspect ratio).
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
      viewBox={iconOnly ? "0 0 164 160" : "0 0 540 160"} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? `nndd-animated-logo-${uniqueId}` : ''}`}
      style={style}
      aria-label="NNDD.TV"
    >
      <defs>
        {/* Subtle Play Triangle Specular Gradient */}
        <linearGradient id={`triangleGrad_${uniqueId}`} x1="66" y1="52" x2="108" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        {/* Ambient Cyan / Blue Broadcast Glow */}
        <filter id={`neonGlow_${uniqueId}`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00E5FF" floodOpacity="0.55" />
          <feDropShadow dx="0" dy="2" stdDeviation="8" floodColor="#0284C7" floodOpacity="0.4" />
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
        </filter>

        {/* Crisp Text Drop Shadow & Glow */}
        <filter id={`textGlow_${uniqueId}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00E5FF" floodOpacity="0.35" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.75" />
        </filter>

        {/* Sequential Wave Ripple & Breathing Glow Keyframes */}
        {animated && (
          <style>{`
            .nndd-animated-logo-${uniqueId} {
              animation: nnddFloat_${uniqueId} 3.2s ease-in-out infinite;
            }
            .nndd-crescent-${uniqueId} {
              animation: nnddPulseInner_${uniqueId} 2.2s ease-in-out infinite;
            }
            .nndd-wave-mid-${uniqueId} {
              animation: nnddPulseMid_${uniqueId} 2.2s ease-in-out 0.22s infinite;
            }
            .nndd-wave-out-${uniqueId} {
              animation: nnddPulseOut_${uniqueId} 2.2s ease-in-out 0.44s infinite;
            }
            .nndd-triangle-${uniqueId} {
              animation: nnddTriangleBreathe_${uniqueId} 2.2s ease-in-out infinite;
              transform-origin: 82px 80px;
            }
            @keyframes nnddFloat_${uniqueId} {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-3px) scale(1.012); }
            }
            @keyframes nnddPulseInner_${uniqueId} {
              0%, 100% {
                opacity: 0.95;
                filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.45));
              }
              50% {
                opacity: 1;
                filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.95)) drop-shadow(0 0 18px rgba(56, 189, 248, 0.7));
              }
            }
            @keyframes nnddPulseMid_${uniqueId} {
              0%, 100% {
                opacity: 0.55;
                filter: drop-shadow(0 0 2px rgba(0, 229, 255, 0.3));
              }
              50% {
                opacity: 0.95;
                filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.85)) drop-shadow(0 0 14px rgba(56, 189, 248, 0.5));
              }
            }
            @keyframes nnddPulseOut_${uniqueId} {
              0%, 100% {
                opacity: 0.35;
                filter: drop-shadow(0 0 1px rgba(0, 229, 255, 0.2));
              }
              50% {
                opacity: 0.85;
                filter: drop-shadow(0 0 7px rgba(0, 229, 255, 0.75)) drop-shadow(0 0 12px rgba(56, 189, 248, 0.45));
              }
            }
            @keyframes nnddTriangleBreathe_${uniqueId} {
              0%, 100% {
                transform: scale(1);
                filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.4));
              }
              50% {
                transform: scale(1.025);
                filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.85)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.6));
              }
            }
          `}</style>
        )}
      </defs>

      {/* =========================================================================
          LEFT ICON GROUP: BROADCAST EMBLEM (TRIANGLE + CONCENTRIC WAVE ARCS)
         ========================================================================= */}
      <g filter={`url(#neonGlow_${uniqueId})`}>
        {/* Outermost Concentric Wave Arcs (r = 72) */}
        <g className={animated ? `nndd-wave-out-${uniqueId}` : ""} opacity="0.48">
          {/* Left Outermost Arc */}
          <path 
            d="M 35.72 135.16 A 72 72 0 0 1 35.72 24.84" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
          />
          {/* Top-Right Outermost Arc */}
          <path 
            d="M 122.26 20.31 A 72 72 0 0 1 150.48 57.75" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
          />
          {/* Bottom-Right Outermost Arc */}
          <path 
            d="M 150.48 102.25 A 72 72 0 0 1 122.26 139.69" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
          />
        </g>

        {/* Middle Concentric Wave Arcs (r = 58) */}
        <g className={animated ? `nndd-wave-mid-${uniqueId}` : ""} opacity="0.78">
          {/* Left Middle Arc */}
          <path 
            d="M 51.26 129.19 A 58 58 0 0 1 51.26 30.81" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
          />
          {/* Top-Right Middle Arc */}
          <path 
            d="M 107.43 27.87 A 58 58 0 0 1 137.16 62.08" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
          />
          {/* Bottom-Right Middle Arc */}
          <path 
            d="M 137.16 97.92 A 58 58 0 0 1 107.43 132.13" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
          />
        </g>

        {/* Inner Thick Glowing Broadcast Crescent (r = 44, stroke = 8.5) */}
        <path 
          d="M 118.48 55.40 A 44 44 0 1 0 118.48 104.60" 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="8.5" 
          strokeLinecap="round" 
          className={animated ? `nndd-crescent-${uniqueId}` : ""}
        />

        {/* Rounded Play Triangle */}
        <g className={animated ? `nndd-triangle-${uniqueId}` : ""}>
          <path 
            d="M 66 56 C 66 52.8 69.5 50.8 72.8 52.6 L 105.2 76.6 C 108 78.4 108 81.6 105.2 83.4 L 72.8 107.4 C 69.5 109.2 66 107.2 66 104 Z" 
            fill={`url(#triangleGrad_${uniqueId})`}
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* =========================================================================
          RIGHT TYPOGRAPHY GROUP: ULTRA-CRISP GEOMETRIC NNDD.TV
         ========================================================================= */}
      {!iconOnly && (
        <g fill="#FFFFFF" filter={`url(#textGlow_${uniqueId})`}>
          {/* Letter N (1) */}
          <path d="M 176 108 L 176 52 L 191 52 L 213 89 L 213 52 L 226 52 L 226 108 L 211 108 L 189 71 L 189 108 Z" />

          {/* Letter N (2) */}
          <path d="M 240 108 L 240 52 L 255 52 L 277 89 L 277 52 L 290 52 L 290 108 L 275 108 L 253 71 L 253 108 Z" />

          {/* Letter D (1) */}
          <path d="M 304 52 L 331 52 C 346 52 358 64 358 80 C 358 96 346 108 331 108 L 304 108 Z M 317 65 L 317 95 L 331 95 C 339 95 345 88 345 80 C 345 72 339 65 331 65 Z" />

          {/* Letter D (2) */}
          <path d="M 368 52 L 395 52 C 410 52 422 64 422 80 C 422 96 410 108 395 108 L 368 108 Z M 381 65 L 381 95 L 395 95 C 403 95 409 88 409 80 C 409 72 403 65 395 65 Z" />

          {/* Bold Baseline Dot (.) */}
          <rect x="432" y="96" width="12" height="12" rx="2.5" />

          {/* Subscript Letter T */}
          <path d="M 456 70 L 486 70 L 486 78 L 476 78 L 476 108 L 466 108 L 466 78 L 456 78 Z" />

          {/* Subscript Letter V */}
          <path d="M 492 70 L 502 70 L 508 97 L 514 70 L 524 70 L 513 108 L 503 108 Z" />
        </g>
      )}
    </svg>
  );
}
