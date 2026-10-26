import React, { useState, useEffect } from 'react';
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
  Layers,
  ChevronRight,
  ChevronLeft
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
 * Ultra-luxurious 4K Glassmorphic Dashboard & UI Customizer
 * Features:
 * - Real-time Interactive Live Preview window
 * - 5 Dock Buttons Grid Scale & Theme Styles
 * - Normal Clock Scale & Sleep Idle Screensaver Timing & Scale
 * - Channel Drawer Glass Themes & Scale
 * - Kurdish / Arabic 4K Typography Selector
 * - 2-Way Realtime Sync with Admin Panel and Settings
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
  const [previewIdle, setPreviewIdle] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setLocalConfig(currentConfig);
    }
  }, [currentConfig]);

  if (!isOpen) return null;

  const updateSetting = (key, value) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onConfigChange?.(updated);
    saveThemeConfig(updated);
  };

  const handleResetDefaults = () => {
    setLocalConfig(DEFAULT_THEME_CONFIG);
    onConfigChange?.(DEFAULT_THEME_CONFIG);
    saveThemeConfig(DEFAULT_THEME_CONFIG);
  };

  const currentFont = FONT_OPTIONS.find(f => f.id === localConfig.appFont) || FONT_OPTIONS[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/80 backdrop-blur-xl animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950/90 border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.95)] ring-1 ring-white/10 overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            MODAL HEADER: 4K Crisp Emblem & Navigation
           ======================================================== */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500/30 to-amber-500/30 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <SlidersHorizontal className="w-5 h-5 text-sky-400" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>دەستکاری دیمەن و شێوازی داشبۆرد</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">4K UHD</span>
              </h2>
              <p className="text-xs text-white/60">ڕێکخستنی قەبارەی گرەید، کاتژمێر، شێوازی شووشە و فۆنتەکان</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              title="گەڕانەوە بۆ ڕێکخستنی بنەڕەتی"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
              <span className="hidden sm:inline">بنەڕەتی</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* ========================================================
            INTERACTIVE LIVE PREVIEW BOX (پریڤیوی ڕاستەوخۆ)
           ======================================================== */}
        <div className="px-5 sm:px-7 pt-4 pb-2 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
              <Eye className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
              <span>پریڤیوی ڕاستەوخۆ (Live 4K Cinema Preview)</span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewIdle(!previewIdle)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 flex items-center gap-1 transition-all"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{previewIdle ? 'کاتی ئاسایی پیشان بدە' : 'کاتی خەوتن (Screensaver) پیشان بدە'}</span>
            </button>
          </div>

          {/* Mini 16:9 Screen Simulation */}
          <div 
            className="relative w-full h-32 sm:h-36 md:h-40 rounded-2xl overflow-hidden border border-white/20 shadow-inner bg-cover bg-center flex flex-col justify-between p-3.5 transition-all duration-300"
            style={{
              backgroundImage: "url('/dabin-cinema-curtain-ambient.png'), linear-gradient(135deg, #070b14 0%, #0b1528 50%, #020617 100%)",
              fontFamily: currentFont.family
            }}
          >
            {/* Top Bar of Preview */}
            <div className="flex items-center justify-between w-full">
              {/* Logo Preview */}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                <span className="text-xs font-bold tracking-wider text-white">KOBIN<span className="text-amber-400">.TV</span></span>
              </div>

              {/* Clock Preview */}
              <div 
                className="transition-all duration-300 text-white font-mono font-light text-end"
                style={{
                  transform: previewIdle 
                    ? `scale(${localConfig.clockSleepScale * 1.5})` 
                    : `scale(${localConfig.clockNormalScale})`,
                  transformOrigin: 'top right'
                }}
              >
                <div className="text-base sm:text-lg font-bold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {previewIdle ? '21:45:00' : '21:45'}
                </div>
                <div className="text-[9px] text-white/70 font-sans">
                  {previewIdle ? 'دۆخی خەوتن' : 'ئەمڕۆ • سلێمانی'}
                </div>
              </div>
            </div>

            {/* Bottom Dock Preview */}
            <div className="w-full flex items-center justify-center pb-1">
              {previewIdle ? (
                /* 5 Wave Dots Preview */
                <div className="flex items-center gap-3 py-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <span 
                      key={i} 
                      className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff] animate-ocean-wave"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              ) : (
                /* 5 Dock Buttons Preview */
                <div 
                  className="flex items-center justify-center gap-1.5 transition-all duration-200"
                  style={{
                    transform: `scale(${localConfig.dockScale * 0.95})`,
                    transformOrigin: 'bottom center'
                  }}
                >
                  {['لایف تیڤی', 'فیلم', 'زنجیرە', 'دڵخوازەکان', 'ڕێکخستن'].map((name, idx) => {
                    const isSelected = idx === 0;
                    return (
                      <div
                        key={name}
                        className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all flex flex-col items-center gap-0.5 ${
                          localConfig.dockStyle === 'neon-cyan'
                            ? (isSelected ? 'bg-sky-500/40 text-white border border-sky-400 shadow-[0_0_12px_#38bdf8]' : 'bg-slate-900/60 text-white/70 border border-sky-500/20')
                            : localConfig.dockStyle === 'minimal-slate'
                            ? (isSelected ? 'bg-slate-700 text-white border border-slate-500' : 'bg-slate-900/80 text-white/70 border border-slate-800')
                            : localConfig.dockStyle === 'deep-black'
                            ? (isSelected ? 'bg-black text-white border border-white/70' : 'bg-[#080d1a] text-white/60 border border-slate-900')
                            : (isSelected ? 'bg-white/30 text-white border border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)] backdrop-blur-md' : 'bg-black/40 text-white/80 border border-white/10 backdrop-blur-sm')
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white/40 flex items-center justify-center text-[7px]">●</span>
                        <span className="truncate max-w-[50px]">{name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            CATEGORY TABS: Dock, Clock, Drawer, Typography
           ======================================================== */}
        <div className="flex items-center gap-2 px-5 sm:px-7 pt-3 pb-1 border-b border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'dock', label: 'گرەیدی پێنچ بەشەکە', icon: LayoutGrid },
            { id: 'clock', label: 'کاتژمێر و کاتی خەوتن', icon: Clock },
            { id: 'drawer', label: 'لیستی کەناڵەکان', icon: Tv },
            { id: 'fonts', label: 'فۆنتەکانی نووسین', icon: Type }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
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
            TAB CONTENT PANELS
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-scrollbar">

          {/* TAB 1: DOCK (قەبارە و گرەیدی ٥ دوگمەکە) */}
          {activeTab === 'dock' && (
            <div className="space-y-5 animate-fade-in">
              {/* Dock Scale Slider */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>قەبارەی دوگمەکانی داشبۆرد (Dock Scale)</span>
                      <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                        {Math.round(localConfig.dockScale * 100)}%
                      </span>
                    </h3>
                    <p className="text-xs text-white/60">بچووک یان گەورەکردنی پێنچ بەشەکەی خوارەوە بە شێوەیەکی نەرم</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'بچووک 80%', val: 0.8 },
                      { label: 'بنەڕەتی 100%', val: 1.0 },
                      { label: 'گەورە 120%', val: 1.2 }
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => updateSetting('dockScale', p.val)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          Math.abs(localConfig.dockScale - p.val) < 0.03
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                            : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateSetting('dockScale', Math.max(0.7, localConfig.dockScale - 0.05))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-base border border-white/15"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.70"
                    max="1.30"
                    step="0.02"
                    value={localConfig.dockScale}
                    onChange={(e) => updateSetting('dockScale', parseFloat(e.target.value))}
                    className="flex-1 accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => updateSetting('dockScale', Math.min(1.3, localConfig.dockScale + 0.05))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-base border border-white/15"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dock Theme Styles */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>شێواز و دیزاینی دوگمەکان (Visual Style)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DOCK_STYLE_OPTIONS.map((style) => {
                    const isSelected = localConfig.dockStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => updateSetting('dockStyle', style.id)}
                        className={`p-3.5 rounded-2xl text-start transition-all duration-150 border cursor-pointer active:scale-95 flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            {style.label}
                          </div>
                          <div className="text-[11px] text-white/60 mt-0.5">{style.desc}</div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLOCK & SLEEP (کاتژمێر و کاتی چاوەڕوانی) */}
          {activeTab === 'clock' && (
            <div className="space-y-5 animate-fade-in">
              {/* Normal Clock Scale */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span>قەبارەی کاتژمێر لە کاتی ئاساییدا</span>
                      <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                        {Math.round(localConfig.clockNormalScale * 100)}%
                      </span>
                    </h3>
                    <p className="text-xs text-white/60">گەورە و بچووککردنی کاتژمێر و بەرواری گۆشەی سەرەوە</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'ورد 80%', val: 0.8 },
                      { label: 'ئاسایی 100%', val: 1.0 },
                      { label: 'گەورە 125%', val: 1.25 }
                    ].map(p => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => updateSetting('clockNormalScale', p.val)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
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

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateSetting('clockNormalScale', Math.max(0.7, localConfig.clockNormalScale - 0.05))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-base border border-white/15"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.70"
                    max="1.50"
                    step="0.05"
                    value={localConfig.clockNormalScale}
                    onChange={(e) => updateSetting('clockNormalScale', parseFloat(e.target.value))}
                    className="flex-1 accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => updateSetting('clockNormalScale', Math.min(1.5, localConfig.clockNormalScale + 0.05))}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-base border border-white/15"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Idle Screensaver Timeout */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>کاتی چاوەڕوانی بۆ دۆخی خەوتنی داشبۆرد (Idle Sleep Timeout)</span>
                  </h3>
                  <p className="text-xs text-white/60">دوای چەند چرکە لە دەست لێنەدان، دوگمەکان ببنە ٥ خاڵی شەپۆلدار و کاتژمێر بێتە ناوەڕاست</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CLOCK_TIMEOUT_OPTIONS.map((opt) => {
                    const isSelected = localConfig.clockIdleTimeout === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateSetting('clockIdleTimeout', opt.value)}
                        className={`p-2.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                            : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sleep Clock Scale */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">قەبارەی کاتژمێر لە دۆخی خەوتندا</h3>
                    <p className="text-xs text-white/60">گەورەیی کاتژمێر لە ناوەڕاستی شاشە کاتێک دەچێتە دۆخی ئارامبوونەوە</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {Math.round(localConfig.clockSleepScale * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.80"
                    max="1.50"
                    step="0.05"
                    value={localConfig.clockSleepScale}
                    onChange={(e) => updateSetting('clockSleepScale', parseFloat(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DRAWER (شێوازی لیستی کەناڵەکان و شووشە) */}
          {activeTab === 'drawer' && (
            <div className="space-y-5 animate-fade-in">
              {/* Drawer Style Selector */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-sky-400" />
                  <span>شێوازی شووشە و دیزاینی لیستی کەناڵەکان (Channel Glass Theme)</span>
                </h3>
                <p className="text-xs text-white/60">هەڵبژاردنی جۆری شووشەیی (گلاسی) یان مات و ڕەشی تاریک بۆ لیستی کەناڵەکان</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {DRAWER_STYLE_OPTIONS.map((style) => {
                    const isSelected = localConfig.drawerStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => updateSetting('drawerStyle', style.id)}
                        className={`p-3.5 rounded-2xl text-start transition-all duration-150 border cursor-pointer active:scale-95 flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">{style.label}</div>
                          <div className="text-[11px] text-white/60 mt-0.5">{style.desc}</div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Width Scale */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white">پانی و گەورەیی لیستی کەناڵەکان</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'compact', label: 'کۆمپاکت (بچووک)' },
                    { id: 'standard', label: 'ستاندارد (مامناوەند)' },
                    { id: 'large', label: 'پان و فراوان (گەورە)' }
                  ].map(scale => {
                    const isSelected = localConfig.drawerScale === scale.id;
                    return (
                      <button
                        key={scale.id}
                        type="button"
                        onClick={() => updateSetting('drawerScale', scale.id)}
                        className={`p-2.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
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
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-sky-400" />
                  <span>فۆنتی فەرمی ئەپڵیکەیشن (Typography)</span>
                </h3>
                <p className="text-xs text-white/60">فۆنتێک هەڵبژێرە کە لە تەواوی سیستەم، ناوی کەناڵەکان و کاتژمێردا ڕاستەوخۆ دەردەکەوێت</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = localConfig.appFont === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateSetting('appFont', f.id)}
                      className={`p-3.5 rounded-2xl text-start transition-all duration-150 border cursor-pointer active:scale-95 flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                      }`}
                      style={{ fontFamily: f.family }}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{f.label}</div>
                        <div className="text-xs text-white/70 mt-1 font-medium">{f.previewText} • ١٢٣٤٥٦٧٨٩٠</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================
            MODAL FOOTER: Done Button & Real-time Indicator
           ======================================================== */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span>گۆڕانکارییەکان ڕاستەوخۆ دەسەپێن و دەپارێزرێن</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
            <span>تەواو و بەستنەوە</span>
          </button>
        </div>

      </div>
    </div>
  );
}
