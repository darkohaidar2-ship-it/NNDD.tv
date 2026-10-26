import React, { useState, useEffect } from 'react';

/**
 * KobinLaunchSplash - Press OK or Tap to Enter Splash Screen
 * Features:
 * - Electric cyan & radiant sapphire glow beams
 * - Royal KOBIN TV emblem with breathing pulse
 * - Waits for user OK / Enter key or Touch / Click to enter Dashboard
 * - Fulfills user interaction to unlock native audio autoplay permissions
 */
export default function KobinLaunchSplash({ onComplete }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleEnter = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete?.();
    }, 220);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Enter, OK (keyCode 13, 23 on Android TV remote), Space, or any navigation key
      if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
        e.preventDefault();
        handleEnter();
      } else {
        // Any key enters
        handleEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFadingOut]);

  return (
    <div
      onClick={handleEnter}
      role="button"
      tabIndex={0}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617] select-none transition-opacity duration-300 ease-out cursor-pointer outline-none ${
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
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 animate-scale-up text-center px-4">
        <div className="relative group">
          <div className="absolute -inset-6 bg-cyan-400/35 rounded-3xl blur-2xl animate-pulse" />
          <img
            src="/kobin-logo.png"
            alt="KOBIN TV"
            className="relative h-28 sm:h-36 md:h-44 w-auto object-contain filter drop-shadow-[0_0_40px_rgba(6,182,212,0.85)]"
          />
        </div>

        {/* Minimalist Typography */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest font-mono drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
            KOBIN TV
          </h1>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs sm:text-sm font-bold text-cyan-200 tracking-wider">
              PREMIUM IPTV BROADCAST
            </span>
          </div>
        </div>

        {/* Interactive Enter Prompt Badge */}
        <div className="mt-6 flex flex-col items-center gap-2 animate-bounce">
          <div className="px-6 py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center gap-3">
            <span className="text-sm sm:text-base font-bold text-white tracking-wide">
              دەست لە شاشە بدە یان کلیلی OK دابگرە بۆ چوونەژوورەوە
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-cyan-200 text-xs font-mono font-bold">OK ↵</span>
          </div>
          <span className="text-[11px] text-white/50 tracking-wider">Tap anywhere or press OK on remote</span>
        </div>
      </div>
    </div>
  );
}
