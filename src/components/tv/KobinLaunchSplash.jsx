import React, { useState, useEffect } from 'react';

/**
 * KobinLaunchSplash - 2.5-Second Motion Graphic Intro Splash
 * Features:
 * - Electric cyan & radiant sapphire glow beams
 * - Royal KOBIN TV emblem reveal with smooth scale & pulse
 * - Auto-dismisses smoothly after 2.5 seconds
 * - Can be skipped immediately on user key press / click
 */
export default function KobinLaunchSplash({ onComplete }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 2.25s start fade out, 2.5s complete
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2250);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    const handleSkip = () => {
      setIsFadingOut(true);
      setTimeout(() => {
        onComplete?.();
      }, 200);
    };

    window.addEventListener('keydown', handleSkip);
    window.addEventListener('click', handleSkip);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      window.removeEventListener('keydown', handleSkip);
      window.removeEventListener('click', handleSkip);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617] select-none transition-opacity duration-300 ease-out pointer-events-auto ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dynamic Cyan & Amber Ambient Beams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-cyan-600/30 via-sky-500/20 to-transparent rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-gradient-to-br from-amber-500/20 via-orange-600/10 to-transparent rounded-full blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(2,6,23,0.85)_80%)]" />
      </div>

      {/* Royal Logo Reveal Emblem */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-5 animate-scale-up">
        <div className="relative">
          <div className="absolute -inset-4 bg-cyan-400/30 rounded-3xl blur-2xl animate-pulse" />
          <img
            src="/kobin-logo.png"
            alt="KOBIN TV"
            className="relative h-24 sm:h-32 w-auto object-contain filter drop-shadow-[0_0_35px_rgba(6,182,212,0.8)]"
          />
        </div>

        {/* Minimalist Typography */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest font-mono drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            KOBIN TV
          </h1>
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-bold text-cyan-200 tracking-wider">
              PREMIUM BROADCAST CINEMA
            </span>
          </div>
        </div>
      </div>

      {/* Loading Progress Bar */}
      <div className="absolute bottom-12 inset-x-0 flex justify-center z-10">
        <div className="w-48 sm:w-64 h-1 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-500 rounded-full animate-marquee" />
        </div>
      </div>
    </div>
  );
}
