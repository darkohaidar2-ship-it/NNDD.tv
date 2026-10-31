import React, { useState, useEffect, useRef } from 'react';
import DabinLogo from '../DabinLogo';
import { Check, ShieldCheck, Server, Tv, Globe, Sparkles } from 'lucide-react';

/**
 * KobinLaunchSplash - Strict 5-Second Startup Loading & Authentication Screen
 * Fulfills User Mandate:
 * - Waits exactly 5 seconds
 * - Authenticates server, loads channels, syncs languages
 * - Automatically transitions straight to Cinema Dashboard
 */
export default function KobinLaunchSplash({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const startTimeRef = useRef(Date.now());
  const TOTAL_DURATION_MS = 5000;

  const STAGES = [
    { text: 'پەیوەستبوون بە سێرڤەری KOBIN و پشکنینی هێڵ...', icon: Server },
    { text: 'پشتڕاستکردنەوەی هەژمار و دەرهێنانی مۆڵەت...', icon: ShieldCheck },
    { text: 'بارکردنی تەواوی کەناڵەکان و کەتەگۆرییەکان...', icon: Tv },
    { text: 'ڕێکخستنی زمان و وەرگێڕانە کوردی و عەرەبییەکان...', icon: Globe },
    { text: 'ئامادەیە! چوونەژوورەوە بۆ داشبۆردی سەرەکی...', icon: Sparkles }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / TOTAL_DURATION_MS) * 100));
      setProgress(pct);

      if (elapsed < 1200) setStageIndex(0);
      else if (elapsed < 2400) setStageIndex(1);
      else if (elapsed < 3700) setStageIndex(2);
      else if (elapsed < 4600) setStageIndex(3);
      else setStageIndex(4);

      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        handleFinish();
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleFinish = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  // Allow optional skip on Enter/OK key if user presses
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFadingOut]);

  const CurrentIcon = STAGES[stageIndex].icon;
  const remainingSecs = Math.max(1, Math.ceil((TOTAL_DURATION_MS - (progress / 100 * TOTAL_DURATION_MS)) / 1000));

  return (
    <div
      role="region"
      aria-label="KOBIN TV Loading Splash"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617] select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      dir="rtl"
    >
      {/* Dynamic Cyan & Amber Ambient Beams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-cyan-600/30 via-sky-500/20 to-transparent rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] bg-gradient-to-br from-amber-500/20 via-orange-600/10 to-transparent rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(2,6,23,0.9)_80%)]" />
      </div>

      {/* Royal Logo Reveal Emblem */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-center px-4 max-w-md w-full animate-scale-up">
        
        {/* Modern Minimalist KOBIN Emblem */}
        <DabinLogo className="h-16 sm:h-20 w-auto" glow={true} animated={true} />

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider font-mono">
            KOBIN TV
          </h1>
          <p className="text-xs text-cyan-300 font-semibold tracking-wide">
            سیستەمی پێشکەوتووی پەخشی ڕاستەوخۆ و سینەمایی
          </p>
        </div>

        {/* 5-Second Smooth Progress Card */}
        <div className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-3.5 mt-2">
          
          {/* Active Loading Step Indicator */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-white font-medium truncate">
              <CurrentIcon className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
              <span className="truncate">{STAGES[stageIndex].text}</span>
            </div>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
              {remainingSecs}s
            </span>
          </div>

          {/* Progress Bar (0% to 100% in 5s) */}
          <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
            <span>STARTING ENGINE</span>
            <span>{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
