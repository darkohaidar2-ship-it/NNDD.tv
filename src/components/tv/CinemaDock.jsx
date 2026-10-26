import React from 'react';

/**
 * CinemaDock - Standalone Minimalist Apple TV / Netflix Navigation Dock
 * Zero clutter: Crisp white icons, clean labels, glowing white focus ring
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
    <div className="w-full pointer-events-auto flex items-center justify-center pb-2">
      {isDashboardIdle ? (
        /* 5 Glowing White Dots with Ocean Wave Motion (Strict Rule 6 preserved) */
        <div 
          onClick={() => setIsDashboardIdle(false)}
          onMouseEnter={() => setIsDashboardIdle(false)}
          title={t('clickToOpenSections')}
          className="relative flex items-center justify-center gap-4 sm:gap-5 px-6 py-2.5 bg-transparent border-0 shadow-none ring-0 cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 ease-out group"
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
      ) : (
        /* Full 5 Glassmorphic Navigation Tiles: Zero Clutter, Apple TV / Netflix style */
        <div 
          className="relative flex items-center justify-center flex-wrap gap-2.5 sm:gap-4 md:gap-5 max-w-4xl mx-auto w-full bg-transparent border-0 shadow-none ring-0 transition-all duration-200 ease-out"
          style={{
            transform: `scale(${dockScale})`,
            transformOrigin: 'bottom center'
          }}
        >
          {bottomButtons.map((btn, index) => {
            const Icon = btn.icon;
            const isSelected = selectedBottomIndex === index && dashboardFocusZone === 'dock';

            return (
              <button
                key={btn.id}
                type="button"
                tabIndex={0}
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
                className={`relative flex-1 min-w-[72px] sm:min-w-[88px] md:min-w-[108px] max-w-[125px] sm:max-w-[145px] py-2.5 sm:py-3.5 px-3 rounded-2xl transition-all duration-200 hover:scale-105 focus:scale-105 outline-none backdrop-blur-xl flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer active:scale-95 group ${
                  isSelected
                    ? dockStyle === 'neon-cyan'
                      ? 'bg-sky-500/30 text-white border border-sky-400 ring-2 ring-amber-400/80 scale-105 shadow-[0_0_30px_rgba(56,189,248,0.5),inset_0_1px_2px_rgba(251,146,60,0.5)]'
                      : dockStyle === 'minimal-slate'
                      ? 'bg-slate-800/90 text-white border border-slate-500 ring-2 ring-slate-400 scale-105 shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
                      : dockStyle === 'deep-black'
                      ? 'bg-black text-white border border-white/70 ring-2 ring-white/90 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                      : 'bg-white/20 text-white border border-white/70 ring-2 ring-white scale-105 shadow-[0_0_25px_rgba(255,255,255,0.4),inset_0_1px_2px_rgba(255,255,255,0.5)]'
                    : dockStyle === 'neon-cyan'
                    ? 'bg-slate-950/70 hover:bg-sky-950/40 text-sky-100/80 hover:text-white border border-sky-500/20 hover:border-sky-400/50 shadow-[0_8px_25px_rgba(2,132,199,0.3)]'
                    : dockStyle === 'minimal-slate'
                    ? 'bg-slate-900/80 hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600 shadow-[0_6px_18px_rgba(0,0,0,0.7)]'
                    : dockStyle === 'deep-black'
                    ? 'bg-[#070b14] hover:bg-[#0f172a] text-white/70 hover:text-white border border-slate-800/80 hover:border-slate-700 shadow-[0_8px_20px_rgba(0,0,0,0.9)]'
                    : 'bg-black/40 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 hover:border-white/30 shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
                }`}
              >
                {Icon && (
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 text-white ${
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
      )}
    </div>
  );
}
