import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Isolated Clock Display Component
 * Manages its own 1000ms tick timer so that root components (KurdLocalTvApp and Video Players)
 * NEVER re-render every second, permanently eliminating 1-second black flashes.
 */
export default function CinemaClockDisplay({
  language = 'ku',
  variant = 'dashboard', // 'dashboard' | 'header'
  isDashboardIdle = false,
  clockNormalScale = 1.0,
  clockSleepScale = 1.0
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = now.toLocaleTimeString('en-US', { hour12: false });

  let dateFormatted = '';
  try {
    if (language === 'ar') {
      dateFormatted = now.toLocaleDateString('ar-IQ', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } else if (language === 'ku') {
      dateFormatted = now.toLocaleDateString('ckb-IQ', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } else {
      dateFormatted = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {
    dateFormatted = now.toDateString();
  }

  if (variant === 'header') {
    return (
      <div className="text-end">
        <div className="text-2xl font-light tracking-tight text-white font-mono flex items-center justify-end gap-1.5 drop-shadow-md">
          <Clock className="w-5 h-5 text-blue-400 inline" />
          <span>{timeString}</span>
        </div>
        <div className="text-[11px] text-slate-300 font-medium flex items-center justify-end gap-2 mt-0.5">
          <span>{dateFormatted}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. Cinematic Clock (Pure White) with 4K Dynamic Scale */}
      <div 
        className="flex items-center gap-2 sm:gap-3 drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)] transition-transform duration-200 will-change-transform"
        style={{
          transform: `scale(${isDashboardIdle ? clockSleepScale : clockNormalScale})`,
          transformOrigin: isDashboardIdle ? 'left center' : 'right center'
        }}
      >
        <span className={`font-light font-mono tracking-tight text-white transition-all duration-250 ease-out ${
          isDashboardIdle 
            ? 'text-7xl sm:text-8xl md:text-9xl' 
            : 'text-2xl sm:text-3xl'
        }`}>
          {timeString}
        </span>
      </div>

      {/* 2. Date (Pure White) */}
      <div className={`font-medium text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)] transition-all duration-250 ease-out ${
        isDashboardIdle 
          ? 'text-lg sm:text-xl md:text-2xl mt-3 text-start' 
          : 'text-[11px] mt-0.5 text-end'
      }`}>
        <span>{dateFormatted}</span>
      </div>
    </>
  );
}
