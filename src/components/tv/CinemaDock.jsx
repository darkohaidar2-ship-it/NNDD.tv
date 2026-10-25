import React from 'react';

/**
 * CinemaDock - Standalone Minimalist Apple TV / Netflix Navigation Dock
 * Zero clutter: Crisp white icons, clean labels, glowing white focus ring
 */
export default function CinemaDock({
  isDashboardIdle,
  setIsDashboardIdle,
  dockScale = 1,
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
                className={`relative flex-1 min-w-[72px] sm:min-w-[88px] md:min-w-[108px] max-w-[125px] sm:max-w-[145px] py-2.5 sm:py-3.5 px-3 rounded-2xl transition-all duration-200 hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-white outline-none backdrop-blur-xl flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer active:scale-95 group ${
                  isSelected
                    ? 'bg-white/20 text-white border border-white/70 ring-2 ring-white scale-105 shadow-[0_0_25px_rgba(255,255,255,0.4),inset_0_1px_2px_rgba(255,255,255,0.5)]'
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
