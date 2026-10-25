import React, { useRef, useEffect } from 'react';

/**
 * CinematicBackground - Apple TV / Netflix Dark Cinema Ambient Engine
 * Features:
 * 1. Ultra-lightweight looping cinematic background (with video support + dark CSS aurora canvas)
 * 2. autoPlay, muted, loop, playsInline
 * 3. Dark glass-morphism overlay (bg-black/60 backdrop-blur-md) for zero visual distraction
 * 4. 60fps GPU-accelerated motion with zero CPU strain
 */
export default function CinematicBackground({
  videoSrc = null,
  onWakeup = null
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback if browser requires user gesture
        });
      }
    }
  }, [videoSrc]);

  return (
    <div 
      onClick={onWakeup}
      className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-auto bg-[#030712]"
      title="KOBIN TV Cinema Experience"
    >
      {/* 1. Video Element (when videoSrc is provided) */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover transform-gpu scale-105 filter brightness-75 contrast-125"
        />
      )}

      {/* 2. Fluid Dark Cinema Ambient Aurora Mesh (Deep Sapphire, Electric Cyan, Warm Ember) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu">
        {/* Deep Sapphire / Cyan Orb 1 (Top-Left Drift) */}
        <div 
          className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full bg-gradient-to-br from-cyan-600/30 via-sky-800/20 to-transparent blur-[100px] sm:blur-[140px] transform-gpu animate-aurora-1 will-change-transform" 
        />

        {/* Warm Cinematic Amber Orb 2 (Bottom-Right Drift) */}
        <div 
          className="absolute -bottom-[25%] -right-[15%] w-[70vw] h-[70vw] max-w-[950px] max-h-[950px] rounded-full bg-gradient-to-tl from-amber-600/25 via-orange-900/15 to-transparent blur-[120px] sm:blur-[160px] transform-gpu animate-aurora-2 will-change-transform" 
        />

        {/* Deep Indigo Midnight Orb 3 (Center-Floating) */}
        <div 
          className="absolute top-[25%] left-[25%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-r from-blue-950/40 via-indigo-900/20 to-transparent blur-[90px] sm:blur-[130px] transform-gpu animate-aurora-3 will-change-transform" 
        />

        {/* Subtle Cinematic Vignette Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_20%,rgba(3,7,18,0.75)_85%)]" />
      </div>

      {/* 3. Dark Glass-morphism Overlay (Strict requirement: bg-black/60 backdrop-blur-md) */}
      <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-md transition-opacity duration-500" />
    </div>
  );
}
