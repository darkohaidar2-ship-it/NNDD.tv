import React from 'react';

/**
 * KOBIN.Tv Modern Minimalist Brand Logo Component
 * Sleek, high-contrast, uncluttered design tailored for 4K displays and mobile.
 */
export default function DabinLogo({ 
  className = "h-9 w-auto", 
  style = {}, 
  animated = false,
  glow = false,
  iconOnly = false,
  useLegacyImage = false 
}) {
  if (useLegacyImage) {
    return (
      <div 
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={style}
      >
        <img
          src="/kobin-logo.png"
          alt="KOBIN TV"
          className="h-full w-auto max-h-full object-contain filter drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative inline-flex items-center gap-2 select-none ${className} ${
        animated ? 'animate-logo-float' : ''
      }`}
      style={style}
    >
      {/* Sleek Minimalist Geometric Emblem */}
      <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-amber-500 flex items-center justify-center border border-white/25 shrink-0 ${
        glow 
          ? 'shadow-[0_0_20px_rgba(56,189,248,0.6)] ring-1 ring-cyan-300/40' 
          : 'shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
      }`}>
        <span className="font-mono font-black text-slate-950 text-base sm:text-lg tracking-tighter drop-shadow-sm select-none">
          K
        </span>
        <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
      </div>

      {/* Clean Minimalist Typography */}
      {!iconOnly && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-mono font-black tracking-wider text-white text-base sm:text-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            KOBIN
          </span>
          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-cyan-500/25 text-cyan-300 border border-cyan-400/35 tracking-wider shadow-sm">
            TV
          </span>
        </div>
      )}
    </div>
  );
}

export const KobinLogo = DabinLogo;
