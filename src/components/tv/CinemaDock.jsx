import React from 'react';

/**
 * CinemaDock - Standalone Minimalist Apple TV / Netflix Navigation Dock
 * Features 5-second graceful morphing animation during sleep transition (خەوتنی ٥ چرکەیی).
 */
export default function CinemaDock({
  isDashboardIdle,
  setIsDashboardIdle,
  dockScale = 1,
  dockStyle = 'glass-blur',
  bottomButtons = [],
  selectedBottomIndex = 2,
  setSelectedBottomIndex,
  dashboardFocusZone = 'dock',
  setDashboardFocusZone,
  onSelectTab,
  t = (k) => k
}) {
  const waveDelays = ['0s', '0.22s', '0.44s', '0.66s', '0.88s'];

  return (
    <div className="w-full pointer-events-auto flex items-center justify-center pb-2 relative min-h-[70px]">
      
      {/* 1. Five Glowing White Dots with Ocean Wave Motion (Fades in over 10 SECONDS during sleep, returns over 7s) */}
      <div 
        onClick={() => setIsDashboardIdle(false)}
        onMouseEnter={() => setIsDashboardIdle(false)}
        title={t('clickToOpenSections')}
        className={`absolute inset-0 flex items-center justify-center gap-4 sm:gap-5 px-6 py-2.5 bg-transparent border-0 shadow-none ring-0 cursor-pointer ${
          isDashboardIdle 
            ? 'opacity-100 scale-100 pointer-events-auto transition-all duration-[10000ms] ease-in-out' 
            : 'opacity-0 scale-75 pointer-events-none transition-all duration-[7000ms] ease-out'
        }`}
      >
        {bottomButtons.map((btn, index) => (
          <button
            key={btn.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDashboardIdle(false);
              setDashboardFocusZone?.('dock');
              setSelectedBottomIndex?.(index);
              onSelectTab?.(btn.tab);
            }}
            title={btn.label}
            style={{
              animationDelay: waveDelays[index % waveDelays.length]
            }}
            className="relative z-10 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] animate-ocean-wave transition-transform duration-200 hover:scale-150 cursor-pointer active:scale-90"
          />
        ))}
      </div>

      {/* 2. Full 5 Navigation Tiles: Fades out over 10s into dots, returns over 7s with sharp modern precision edges */}
      <div 
        className={`relative flex items-center justify-center flex-wrap gap-2 sm:gap-3.5 md:gap-4 max-w-4xl mx-auto w-full bg-transparent border-0 shadow-none ring-0 ${
          isDashboardIdle
            ? 'opacity-0 scale-90 pointer-events-none transition-all duration-[10000ms] ease-in-out'
            : 'opacity-100 scale-100 pointer-events-auto transition-all duration-[7000ms] ease-out'
        }`}
        style={{
          transform: `scale(${dockScale})`,
          transformOrigin: 'bottom center'
        }}
      >
        {bottomButtons.map((btn, index) => {
          const Icon = btn.icon;
          const isSelected = selectedBottomIndex === index && dashboardFocusZone === 'dock';

          // Sharp, modern style variants per color preset
          let activeStyles = 'bg-white/20 text-white border-white/80 ring-2 ring-white shadow-[0_0_25px_rgba(255,255,255,0.4)]';
          let idleStyles = 'bg-black/50 hover:bg-white/15 text-white/80 hover:text-white border-white/15 hover:border-white/35 shadow-[0_4px_16px_rgba(0,0,0,0.6)]';

          if (dockStyle === 'neon-cyan') {
            activeStyles = 'bg-cyan-500/30 text-white border-cyan-400 ring-2 ring-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.6)]';
            idleStyles = 'bg-slate-950/80 hover:bg-cyan-950/40 text-cyan-100/80 hover:text-white border-cyan-500/25 hover:border-cyan-400/50 shadow-[0_4px_16px_rgba(2,132,199,0.3)]';
          } else if (dockStyle === 'amber-sunset') {
            activeStyles = 'bg-amber-500/30 text-white border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.6)]';
            idleStyles = 'bg-slate-950/80 hover:bg-amber-950/40 text-amber-100/80 hover:text-white border-amber-500/25 hover:border-amber-400/50 shadow-[0_4px_16px_rgba(245,158,11,0.3)]';
          } else if (dockStyle === 'emerald-green') {
            activeStyles = 'bg-emerald-500/30 text-white border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.6)]';
            idleStyles = 'bg-slate-950/80 hover:bg-emerald-950/40 text-emerald-100/80 hover:text-white border-emerald-500/25 hover:border-emerald-400/50 shadow-[0_4px_16px_rgba(16,185,129,0.3)]';
          } else if (dockStyle === 'royal-purple') {
            activeStyles = 'bg-purple-500/30 text-white border-purple-400 ring-2 ring-purple-400/80 shadow-[0_0_30px_rgba(168,85,247,0.6)]';
            idleStyles = 'bg-slate-950/80 hover:bg-purple-950/40 text-purple-100/80 hover:text-white border-purple-500/25 hover:border-purple-400/50 shadow-[0_4px_16px_rgba(168,85,247,0.3)]';
          } else if (dockStyle === 'ruby-red') {
            activeStyles = 'bg-rose-500/30 text-white border-rose-400 ring-2 ring-rose-400/80 shadow-[0_0_30px_rgba(244,63,94,0.6)]';
            idleStyles = 'bg-slate-950/80 hover:bg-rose-950/40 text-rose-100/80 hover:text-white border-rose-500/25 hover:border-rose-400/50 shadow-[0_4px_16px_rgba(244,63,94,0.3)]';
          } else if (dockStyle === 'deep-black') {
            activeStyles = 'bg-zinc-900/95 text-white border-white/60 ring-1 ring-white/80 shadow-[0_0_25px_rgba(255,255,255,0.25)]';
            idleStyles = 'bg-black/90 hover:bg-zinc-900/80 text-white/70 hover:text-white border-zinc-800 hover:border-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.8)]';
          } else if (dockStyle === 'minimal-slate') {
            activeStyles = 'bg-slate-800/90 text-white border-slate-400 ring-2 ring-slate-400/80 shadow-[0_4px_20px_rgba(0,0,0,0.8)]';
            idleStyles = 'bg-slate-900/80 hover:bg-slate-800/60 text-slate-300 hover:text-white border-slate-700/50 hover:border-slate-600 shadow-[0_4px_16px_rgba(0,0,0,0.7)]';
          }

          return (
            <button
              key={btn.id}
              type="button"
              tabIndex={isDashboardIdle ? -1 : 0}
              onClick={() => {
                setDashboardFocusZone?.('dock');
                setSelectedBottomIndex?.(index);
                onSelectTab?.(btn.tab);
              }}
              onMouseEnter={() => {
                setDashboardFocusZone?.('dock');
                setSelectedBottomIndex?.(index);
              }}
              onFocus={() => {
                setDashboardFocusZone?.('dock');
                setSelectedBottomIndex?.(index);
              }}
              className={`relative flex-1 min-w-[76px] sm:min-w-[92px] md:min-w-[110px] max-w-[130px] sm:max-w-[150px] py-2.5 sm:py-3 px-3 rounded-xl transition-all duration-200 hover:scale-105 focus:scale-105 outline-none backdrop-blur-xl flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer active:scale-95 group border ${
                isSelected ? `${activeStyles} scale-105` : idleStyles
              }`}
            >
              {Icon && (
                <Icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform duration-200 text-white ${
                  isSelected ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]' : 'group-hover:scale-105'
                }`} />
              )}
              
              <span className={`text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                isSelected ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-white/80 group-hover:text-white'
              }`}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
