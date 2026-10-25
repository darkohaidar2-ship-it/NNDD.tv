import React from 'react';

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
    <div className="w-full pointer-events-auto flex items-center justify-center pb-1">
      {isDashboardIdle ? (
        /* 5 Glowing White Dots with Ocean Wave Motion (Crisp & Pure White - Not Blurry) */
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
        /* Full 5 Glassmorphic Navigation Tiles: Standalone, Fast 200ms TV Snapping */
        <div 
          className="relative flex items-center justify-center flex-wrap gap-2.5 sm:gap-3.5 md:gap-4 max-w-4xl mx-auto w-full bg-transparent border-0 shadow-none ring-0 transition-all duration-200 ease-out"
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
                className={`relative flex-1 min-w-[62px] sm:min-w-[76px] md:min-w-[92px] max-w-[110px] sm:max-w-[130px] py-2 sm:py-2.5 md:py-3 px-2 rounded-2xl transition-all duration-200 backdrop-blur-md flex flex-col items-center justify-center gap-1.5 text-center border cursor-pointer active:scale-95 group focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none ${
                  isSelected
                    ? 'bg-white/25 text-white border-white/70 ring-2 ring-white/90 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.35),inset_0_1px_2px_rgba(255,255,255,0.5)]'
                    : 'bg-slate-900/40 hover:bg-white/15 text-white/80 hover:text-white border-white/10 hover:border-white/30 shadow-[0_8px_20px_rgba(0,0,0,0.3)]'
                }`}
              >
                {/* Badge if any (e.g. FREE or PRO) */}
                {btn.badge && (
                  <span className={`absolute top-1.5 end-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold tracking-wider ${
                    btn.badge === 'FREE' 
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {btn.badge}
                  </span>
                )}

                {Icon && (
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                    isSelected ? 'scale-110 text-white' : 'text-white/80 group-hover:text-white'
                  }`} />
                )}
                
                <span className={`text-[11px] sm:text-xs font-semibold tracking-wide transition-colors ${
                  isSelected ? 'text-white' : 'text-white/85 group-hover:text-white'
                }`}>
                  {btn.label}
                </span>

                {btn.sub && (
                  <span className="text-[9px] text-white/50 hidden sm:block truncate max-w-[85px]">
                    {btn.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
