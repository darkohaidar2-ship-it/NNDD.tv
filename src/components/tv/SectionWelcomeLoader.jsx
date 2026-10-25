import React, { useEffect, useState } from 'react';
import { Tv, Film, Clapperboard, Sparkles } from 'lucide-react';

/**
 * SectionWelcomeLoader - 1.5-Second Aqua-Glass Transition Loader
 * Rendered during navigation transitions to Live TV, Movies, or Series.
 */
export default function SectionWelcomeLoader({ section = 'live', onComplete }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1300);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const getSectionDetails = () => {
    switch (section) {
      case 'movies':
        return {
          title: 'سینەما و فیلمەکان',
          subtitle: 'KOBIN VOD CINEMA 4K',
          icon: <Film className="w-8 h-8 text-amber-400" />,
          glow: 'from-amber-500/20 to-orange-600/10'
        };
      case 'series':
        return {
          title: 'زنجیرە دراماکان',
          subtitle: 'KOBIN EPISODES & SEASONS',
          icon: <Clapperboard className="w-8 h-8 text-cyan-400" />,
          glow: 'from-cyan-500/20 to-blue-600/10'
        };
      case 'live':
      default:
        return {
          title: 'پەخشی ڕاستەوخۆ',
          subtitle: 'KOBIN LIVE BROADCAST',
          icon: <Tv className="w-8 h-8 text-sky-400" />,
          glow: 'from-sky-500/20 to-cyan-600/10'
        };
    }
  };

  const info = getSectionDetails();

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xl transition-opacity duration-200 select-none pointer-events-none ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative px-8 py-6 rounded-3xl bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-blue-950/70 border border-cyan-400/30 shadow-[0_10px_40px_rgba(6,182,212,0.25)] flex flex-col items-center gap-3 text-center animate-scale-up">
        {/* Glow */}
        <div className={`absolute -inset-2 bg-gradient-to-r ${info.glow} rounded-3xl blur-xl pointer-events-none`} />

        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
          {info.icon}
        </div>

        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-black text-white tracking-wide">{info.title}</h2>
          <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-widest">{info.subtitle}</span>
        </div>

        <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden mt-1">
          <div className="h-full bg-cyan-400 rounded-full animate-marquee" />
        </div>
      </div>
    </div>
  );
}
