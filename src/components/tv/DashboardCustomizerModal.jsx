import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SlidersHorizontal, 
  Clock, 
  LayoutGrid, 
  Type, 
  Tv, 
  RotateCcw, 
  Check, 
  X, 
  Sparkles,
  Eye,
  ChevronRight,
  ChevronLeft,
  MousePointerClick
} from 'lucide-react';
import { 
  FONT_OPTIONS, 
  DOCK_STYLE_OPTIONS, 
  DRAWER_STYLE_OPTIONS, 
  CLOCK_TIMEOUT_OPTIONS,
  DEFAULT_THEME_CONFIG,
  getSavedThemeConfig,
  saveThemeConfig
} from '../../services/kobinThemeService';

/**
 * DashboardCustomizerModal
 * Sleek Half-Screen Apple TV / macOS Cinema Side Panel (نيوەی شاشە)
 * 
 * Features:
 * 1. Half-Screen (w-full sm:w-[480px] md:w-1/2 lg:w-[46vw]) docked to side, leaving actual dashboard visible!
 * 2. Ultra-smooth vertical scrolling with TV Remote ArrowUp/Down and touch gestures.
 * 3. Double-Tap or OK/Enter confirmation to apply changes (دوو جار دەست لێدان یان OK کۆنتڕۆڵ).
 * 4. Micro 4K delicate vectors and high-contrast typography.
 */
export default function DashboardCustomizerModal({
  isOpen,
  onClose,
  currentConfig,
  onConfigChange,
  isRtl = true
}) {
  const [localConfig, setLocalConfig] = useState(() => currentConfig || getSavedThemeConfig());
  const [activeTab, setActiveTab] = useState('dock'); // 'dock' | 'clock' | 'drawer' | 'fonts'
  
  // Pending selection tracking for Double-Tap / OK confirmation
  const [pendingSelection, setPendingSelection] = useState(null);
  const [justConfirmedKey, setJustConfirmedKey] = useState(null);
  const lastTapRef = useRef({ id: null, time: 0 });
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (currentConfig) {
      setLocalConfig(currentConfig);
    }
  }, [currentConfig]);

  // Remote Control & Keyboard Navigation Listener for Side Panel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const key = e.key;
      const code = e.keyCode;

      // Escape or Back closes side panel
      if (key === 'Escape' || key === 'Back' || key === 'GoBack' || code === 27 || code === 10009 || code === 4) {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Smooth scroll using Remote PageUp / PageDown
      if (key === 'PageDown' || code === 34) {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop += 220;
      } else if (key === 'PageUp' || code === 33) {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop -= 220;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Commit and apply a setting change
  const commitSetting = (key, value) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onConfigChange?.(updated);
    saveThemeConfig(updated);
    setJustConfirmedKey(`${key}_${value}`);
    setPendingSelection(null);

    // Clear feedback glow after 1.5 seconds
    setTimeout(() => {
      setJustConfirmedKey(null);
    }, 1500);
  };

  // Double-tap or OK trigger handler
  const handleItemInteraction = (categoryKey, itemId, isExplicitCommit = false) => {
    const now = Date.now();
    const isDoubleTap = lastTapRef.current.id === itemId && (now - lastTapRef.current.time) < 450;
    lastTapRef.current = { id: itemId, time: now };

    // If explicit Enter/OK pressed, OR double tapped, OR already pending -> Commit!
    if (isExplicitCommit || isDoubleTap || pendingSelection?.id === itemId) {
      commitSetting(categoryKey, itemId);
    } else {
      // First tap / click: Mark pending and prompt user to tap again or press OK
      setPendingSelection({ category: categoryKey, id: itemId });
    }
  };

  const handleResetDefaults = () => {
    setLocalConfig(DEFAULT_THEME_CONFIG);
    onConfigChange?.(DEFAULT_THEME_CONFIG);
    saveThemeConfig(DEFAULT_THEME_CONFIG);
    setPendingSelection(null);
  };

  const currentFont = FONT_OPTIONS.find(f => f.id === localConfig.appFont) || FONT_OPTIONS[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      {/* ========================================================
          HALF-SCREEN SLIDING SIDE PANEL (نيوەی شاشە)
         ======================================================== */}
      <div 
        className={`relative w-full sm:w-[480px] md:w-1/2 lg:w-[46vw] max-w-[560px] h-full flex flex-col bg-slate-950/92 backdrop-blur-2xl border-s border-white/15 shadow-[-20px_0_60px_rgba(0,0,0,0.95)] ring-1 ring-white/10 text-white overflow-hidden animate-slide-left`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            PANEL HEADER: Compact, Delicate, 4K Micro Badge
           ======================================================== */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500/25 to-amber-500/25 border border-white/20 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.3)] shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>دەستکاری دیمەنی داشبۆرد</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">4K</span>
              </h2>
              <p className="text-[11px] text-white/50">نیوەی شاشە • دوو جار کلیک یان OK بکە بۆ هەڵبژاردن</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              title="گەڕانەوە بۆ ڕێکخستنی بنەڕەتی"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
              <span className="hidden sm:inline text-xs">بنەڕەتی</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="داخستن"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* ========================================================
            SLIM LIVE PREVIEW & HINT BAR
           ======================================================== */}
        <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-sky-500/10 via-white/[0.02] to-amber-500/10 border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-white/80">
            <MousePointerClick className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-medium text-white/90">
              ڕێنمایی: <strong className="text-amber-300 font-bold">٢ جار دابگرە</strong> یان <strong className="text-sky-300 font-bold">کلیلی OK</strong> دابگرە
            </span>
          </div>

          <div className="text-[11px] font-mono text-sky-300 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
            فۆنت: {currentFont.label.split(' ')[0]}
          </div>
        </div>

        {/* ========================================================
            NAVIGATION TABS (Dock, Clock, Drawer, Fonts)
           ======================================================== */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 border-b border-white/10 bg-black/20 overflow-x-auto no-scrollbar">
          {[
            { id: 'dock', label: 'گرەیدی ٥ بەشەکە', icon: LayoutGrid },
            { id: 'clock', label: 'کاتژمێر و خەوتن', icon: Clock },
            { id: 'drawer', label: 'شێوازی کەناڵەکان', icon: Tv },
            { id: 'fonts', label: 'فۆنتەکان', icon: Type }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPendingSelection(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-white/60'}`} strokeWidth={1.75} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================
            SCROLLABLE CONTENT AREA (بتوانم سکڕۆڵ بکەم)
           ======================================================== */}
        <div 
          ref={scrollContainerRef}
          tabIndex={0}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar outline-none focus:ring-1 focus:ring-sky-500/30"
        >

          {/* TAB 1: DOCK SETTINGS (گرەیدی پێنچ بەشەکە) */}
          {activeTab === 'dock' && (
            <div className="space-y-4 animate-fade-in">
              {/* Dock Scale Slider */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>قەبارەی گرەیدی داشبۆرد</span>
                      <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                        {Math.round(localConfig.dockScale * 100)}%
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/50">بچووک یان گەورەکردنی دوگمەکانی خوارەوە</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {[
                      { label: '80%', val: 0.8 },
                      { label: '100%', val: 1.0 },
                      { label: '120%', val: 1.2 }
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => commitSetting('dockScale', p.val)}
                        title="دەست لێبدە بۆ پەسەندکردن"
                        className={`text-xs px-2 py-0.5 rounded-lg border transition-all ${
                          Math.abs(localConfig.dockScale - p.val) < 0.03
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => commitSetting('dockScale', Math.max(0.7, localConfig.dockScale - 0.05))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-sm border border-white/15"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.70"
                    max="1.30"
                    step="0.02"
                    value={localConfig.dockScale}
                    onChange={(e) => commitSetting('dockScale', parseFloat(e.target.value))}
                    className="flex-1 accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => commitSetting('dockScale', Math.min(1.3, localConfig.dockScale + 0.05))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-sm border border-white/15"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dock Theme Styles with Double-Tap / OK */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>شێوازی دیزاینی دوگمەکان (Visual Themes)</span>
                  </h3>
                  <span className="text-[10px] text-amber-400/90 font-medium">٢ جار کلیک یان OK</span>
                </div>

                <div className="space-y-2">
                  {DOCK_STYLE_OPTIONS.map((style) => {
                    const isSelected = localConfig.dockStyle === style.id;
                    const isPending = pendingSelection?.category === 'dockStyle' && pendingSelection?.id === style.id;
                    const isConfirmedJustNow = justConfirmedKey === `dockStyle_${style.id}`;

                    return (
                      <div
                        key={style.id}
                        tabIndex={0}
                        onClick={() => handleItemInteraction('dockStyle', style.id)}
                        onDoubleClick={() => commitSetting('dockStyle', style.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
                            e.preventDefault();
                            commitSetting('dockStyle', style.id);
                          }
                        }}
                        className={`p-3 rounded-2xl transition-all duration-150 border cursor-pointer active:scale-98 flex items-center justify-between gap-3 outline-none ${
                          isConfirmedJustNow
                            ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] ring-2 ring-emerald-400'
                            : isSelected
                            ? 'bg-sky-500/20 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400'
                            : isPending
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 animate-pulse'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            <span>{style.label}</span>
                            {isPending && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                                دووبارە دابگرە یان OK
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/50 mt-0.5">{style.desc}</div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {isSelected && !isPending && (
                            <div className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </div>
                          )}
                          {isPending && (
                            <span className="text-[11px] font-mono font-bold text-amber-300 animate-pulse">OK ↵</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLOCK & IDLE SETTINGS (کاتژمێر و کاتی چاوەڕوانی) */}
          {activeTab === 'clock' && (
            <div className="space-y-4 animate-fade-in">
              {/* Normal Clock Scale */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span>قەبارەی کاتژمێر (کاتی ئاسایی)</span>
                      <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                        {Math.round(localConfig.clockNormalScale * 100)}%
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/50">گەورە و بچووککردنی کاتژمێری سەرەوە</p>
                  </div>

                  <div className="flex items-center gap-1">
                    {[
                      { label: '80%', val: 0.8 },
                      { label: '100%', val: 1.0 },
                      { label: '125%', val: 1.25 }
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => commitSetting('clockNormalScale', p.val)}
                        className={`text-xs px-2 py-0.5 rounded-lg border transition-all ${
                          Math.abs(localConfig.clockNormalScale - p.val) < 0.03
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                            : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => commitSetting('clockNormalScale', Math.max(0.7, localConfig.clockNormalScale - 0.05))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-sm border border-white/15"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.70"
                    max="1.50"
                    step="0.05"
                    value={localConfig.clockNormalScale}
                    onChange={(e) => commitSetting('clockNormalScale', parseFloat(e.target.value))}
                    className="flex-1 accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => commitSetting('clockNormalScale', Math.min(1.5, localConfig.clockNormalScale + 0.05))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-sm border border-white/15"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Idle Sleep Timeout Options (Double-Tap / OK) */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>کاتی چاوەڕوانی بۆ خەوتنی داشبۆرد</span>
                    </h3>
                    <p className="text-[11px] text-white/50">خەوتنی دوگمەکان بۆ ٥ خاڵ و هێنانە ناوەڕاستی کاتژمێر</p>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-medium">٢ جار یان OK</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {CLOCK_TIMEOUT_OPTIONS.map((opt) => {
                    const isSelected = localConfig.clockIdleTimeout === opt.value;
                    const isPending = pendingSelection?.category === 'clockIdleTimeout' && pendingSelection?.id === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleItemInteraction('clockIdleTimeout', opt.value)}
                        onDoubleClick={() => commitSetting('clockIdleTimeout', opt.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
                            e.preventDefault();
                            commitSetting('clockIdleTimeout', opt.value);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer active:scale-95 outline-none ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                            : isPending
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400 animate-pulse'
                            : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                        }`}
                      >
                        <div>{opt.label}</div>
                        {isPending && <div className="text-[10px] text-amber-300 font-bold mt-0.5">OK ↵</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sleep Clock Scale */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-white">قەبارەی کاتژمێر لەکاتی خەوتندا</h3>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {Math.round(localConfig.clockSleepScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.50"
                  step="0.05"
                  value={localConfig.clockSleepScale}
                  onChange={(e) => commitSetting('clockSleepScale', parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* TAB 3: DRAWER SETTINGS (شێوازی لیستی کەناڵەکان و شووشە) */}
          {activeTab === 'drawer' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-sky-400" />
                    <span>شێوازی شووشەی لیستی کەناڵەکان (Drawer Glass)</span>
                  </h3>
                  <span className="text-[10px] text-amber-400/90 font-medium">٢ جار کلیک یان OK</span>
                </div>

                <div className="space-y-2">
                  {DRAWER_STYLE_OPTIONS.map((style) => {
                    const isSelected = localConfig.drawerStyle === style.id;
                    const isPending = pendingSelection?.category === 'drawerStyle' && pendingSelection?.id === style.id;
                    const isConfirmedJustNow = justConfirmedKey === `drawerStyle_${style.id}`;

                    return (
                      <div
                        key={style.id}
                        tabIndex={0}
                        onClick={() => handleItemInteraction('drawerStyle', style.id)}
                        onDoubleClick={() => commitSetting('drawerStyle', style.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
                            e.preventDefault();
                            commitSetting('drawerStyle', style.id);
                          }
                        }}
                        className={`p-3 rounded-2xl transition-all duration-150 border cursor-pointer active:scale-98 flex items-center justify-between gap-3 outline-none ${
                          isConfirmedJustNow
                            ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] ring-2 ring-emerald-400'
                            : isSelected
                            ? 'bg-sky-500/20 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400'
                            : isPending
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 animate-pulse'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            <span>{style.label}</span>
                            {isPending && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                                دووبارە دابگرە یان OK
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/50 mt-0.5">{style.desc}</div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {isSelected && !isPending && (
                            <div className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </div>
                          )}
                          {isPending && (
                            <span className="text-[11px] font-mono font-bold text-amber-300 animate-pulse">OK ↵</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Width Scale */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">پانی و گەورەیی لیستی کەناڵەکان</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'کۆمپاکت' },
                    { id: 'standard', label: 'ستاندارد' },
                    { id: 'large', label: 'فراوان' }
                  ].map(scale => {
                    const isSelected = localConfig.drawerScale === scale.id;
                    return (
                      <button
                        key={scale.id}
                        type="button"
                        onClick={() => commitSetting('drawerScale', scale.id)}
                        className={`p-2 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                            : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                        }`}
                      >
                        {scale.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FONTS (فۆنتەکانی نووسین) */}
          {activeTab === 'fonts' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-sky-400" />
                    <span>فۆنتەکانی نووسین (Typography)</span>
                  </h3>
                  <p className="text-[11px] text-white/50">فۆنت بۆ سەرجەم بەشەکان دەسەپێت</p>
                </div>
                <span className="text-[10px] text-amber-400/90 font-medium">٢ جار کلیک یان OK</span>
              </div>

              <div className="space-y-2">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = localConfig.appFont === f.id;
                  const isPending = pendingSelection?.category === 'appFont' && pendingSelection?.id === f.id;
                  const isConfirmedJustNow = justConfirmedKey === `appFont_${f.id}`;

                  return (
                    <div
                      key={f.id}
                      tabIndex={0}
                      onClick={() => handleItemInteraction('appFont', f.id)}
                      onDoubleClick={() => commitSetting('appFont', f.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
                          e.preventDefault();
                          commitSetting('appFont', f.id);
                        }
                      }}
                      className={`p-3 rounded-2xl transition-all duration-150 border cursor-pointer active:scale-98 flex items-center justify-between gap-3 outline-none ${
                        isConfirmedJustNow
                          ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] ring-2 ring-emerald-400'
                          : isSelected
                          ? 'bg-sky-500/20 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400'
                          : isPending
                          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 animate-pulse'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                      }`}
                      style={{ fontFamily: f.family }}
                    >
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <span>{f.label}</span>
                          {isPending && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                              دووبارە دابگرە یان OK
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/60 mt-0.5">{f.previewText} • ١٢٣٤٥٦٧٨٩٠</div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isSelected && !isPending && (
                          <div className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </div>
                        )}
                        {isPending && (
                          <span className="text-[11px] font-mono font-bold text-amber-300 animate-pulse">OK ↵</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================
            PANEL FOOTER: Quick Dismiss & Real-Time Sync Indicator
           ======================================================== */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span className="text-[11px]">ڕاستەوخۆ دەسەپێت</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(56,189,248,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>تەواو</span>
          </button>
        </div>

      </div>
    </div>
  );
}
