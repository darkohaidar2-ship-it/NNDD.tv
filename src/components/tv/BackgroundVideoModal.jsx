import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, 
  Sparkles, 
  Image as ImageIcon, 
  Palette, 
  Play, 
  Check, 
  X, 
  RotateCcw, 
  Cloud, 
  CloudCheck, 
  Copy, 
  AlertCircle, 
  ExternalLink,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle2,
  Upload,
  HardDrive
} from 'lucide-react';
import { 
  saveThemeToSupabase, 
  checkSupabaseThemeStatus, 
  SQL_SCHEMA_SNIPPET 
} from '../../services/kobinSupabaseThemeService';
import { 
  DEFAULT_THEME_CONFIG, 
  getSavedThemeConfig 
} from '../../services/kobinThemeService';
import { uploadBackgroundMediaToSupabase } from '../../data/supabaseClient';
import { saveCustomBackground } from '../../data/backgroundStorage';

// Curated Ultra-Reliable 4K / HD Looping Ambient Videos
export const VIDEO_PRESETS = [
  {
    id: 'ocean',
    title: 'شەپۆلی ئۆقیانووسی قووڵ (Deep Ocean)',
    desc: 'شەپۆلی شینی ئارام و سینەمایی',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumb: '🌊',
    quality: '4K/HD'
  },
  {
    id: 'sintel-cinema',
    title: 'تاریکی و ڕۆشنایی سینەمایی (Cinema Twilight)',
    desc: 'دیمەنی مۆدێرنی تاریک و شەوانە',
    url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
    thumb: '🎬',
    quality: '1080p'
  },
  {
    id: 'ambient-flower',
    title: 'هێمنی سروشت (Calm Nature Macro)',
    desc: 'تەنۆلکە و جووڵەی ئارامی سروشتی',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumb: '🌸',
    quality: 'HD'
  }
];

// Curated 4K Wallpaper Presets
export const IMAGE_PRESETS = [
  {
    id: 'cinema-aurora',
    title: 'ئۆڕۆرا و تیشکی شین (Sapphire Aurora)',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2560&auto=format&fit=crop',
    color: '#0284c7'
  },
  {
    id: 'deep-space',
    title: 'گەردوونی قووڵ و ئەستێرەکان (Deep Cosmos)',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2560&auto=format&fit=crop',
    color: '#312e81'
  },
  {
    id: 'dark-nebula',
    title: 'تەمومژی شەوانەی مۆر (Dark Nebula)',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2560&auto=format&fit=crop',
    color: '#581c87'
  },
  {
    id: 'oled-black',
    title: 'ڕەشی قووڵی کریستاڵی (OLED Carbon Wave)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop',
    color: '#09090b'
  }
];

export const COLOR_PRESETS = [
  { hex: '#020617', name: 'تاریکی قووڵ (Cinema Deep)' },
  { hex: '#000000', name: 'ڕەشی تەواو (OLED Pure Black)' },
  { hex: '#0a192f', name: 'شینی دەریایی (Navy Ocean)' },
  { hex: '#170b29', name: 'مۆری شەوانە (Midnight Purple)' },
  { hex: '#1a0b0b', name: 'سووری خەڵوز (Cinema Crimson)' },
  { hex: '#0b1d16', name: 'سەوزی زومڕوت (Emerald Deep)' },
  { hex: '#18181b', name: 'خۆڵەمێشی مۆدێرن (Matte Slate)' },
  { hex: '#040d1a', name: 'نیلی ئاسمانی (Sapphire Night)' }
];

export default function BackgroundVideoModal({
  isOpen,
  onClose,
  currentConfig = null,
  onConfigApplied = null
}) {
  const [config, setConfig] = useState(() => currentConfig || getSavedThemeConfig());
  const [activeMode, setActiveMode] = useState(() => config.dashboardBgType || 'video');
  const [videoUrlInput, setVideoUrlInput] = useState(() => config.dashboardBgVideoUrl || '');
  const [imageUrlInput, setImageUrlInput] = useState(() => config.dashboardBgImageUrl || '');
  const [colorInput, setColorInput] = useState(() => config.dashboardBgColor || '#020617');
  
  const [supabaseStatus, setSupabaseStatus] = useState({ status: 'checking', message: 'خەریکی پشکنینی Supabase...' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const previewVideoRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setPreviewError(false);

    try {
      // 1. Immediately save into IndexedDB for 0ms local offline playback
      await saveCustomBackground({
        type: activeMode === 'image' ? 'image' : 'video',
        blob: file,
        url: null
      });

      // 2. Try to upload to Supabase Storage Bucket for Universal Sync
      const cloudUrl = await uploadBackgroundMediaToSupabase(file, activeMode === 'image' ? 'image' : 'video');
      if (cloudUrl) {
        if (activeMode === 'image') {
          setImageUrlInput(cloudUrl);
        } else {
          setVideoUrlInput(cloudUrl);
        }
        setSaveToast({
          type: 'success',
          message: 'فایلی 4K لە Supabase بارکرا و بە سەرکەوتوویی ئامادە کرا ☁️'
        });
      } else {
        // Fallback to local Object URL
        const localBlobUrl = URL.createObjectURL(file);
        if (activeMode === 'image') {
          setImageUrlInput(localBlobUrl);
        } else {
          setVideoUrlInput(localBlobUrl);
        }
        setSaveToast({
          type: 'info',
          message: 'فایلەکە لەسەر کۆمپیوتەرەکەت (IndexedDB) خەزن کرا و کارا کرا 💾'
        });
      }
    } catch (err) {
      console.warn('File upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Sync incoming config
  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
      setActiveMode(currentConfig.dashboardBgType || 'video');
      setVideoUrlInput(currentConfig.dashboardBgVideoUrl || '');
      setImageUrlInput(currentConfig.dashboardBgImageUrl || '');
      setColorInput(currentConfig.dashboardBgColor || '#020617');
    }
  }, [currentConfig]);

  // Check Supabase connection when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    checkSupabaseThemeStatus().then((res) => {
      if (isMounted) setSupabaseStatus(res);
    });
    return () => { isMounted = false; };
  }, [isOpen]);

  // Handle ESC or Back key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Back' || e.keyCode === 27 || e.keyCode === 10009) {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyPresetVideo = (preset) => {
    setVideoUrlInput(preset.url);
    setActiveMode('video');
    setPreviewError(false);
  };

  const handleApplyPresetImage = (preset) => {
    setImageUrlInput(preset.url);
    setActiveMode('image');
  };

  const handleApplyPresetColor = (preset) => {
    setColorInput(preset.hex);
    setActiveMode('color');
  };

  const handleCopySql = () => {
    try {
      navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 3000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleSaveAndSync = async () => {
    setIsSaving(true);
    const updated = {
      ...config,
      dashboardBgType: activeMode,
      dashboardBgVideoUrl: activeMode === 'video' ? videoUrlInput.trim() : config.dashboardBgVideoUrl,
      dashboardBgImageUrl: activeMode === 'image' ? imageUrlInput.trim() : config.dashboardBgImageUrl,
      dashboardBgColor: activeMode === 'color' ? colorInput : config.dashboardBgColor
    };

    setConfig(updated);
    onConfigApplied?.(updated);

    const result = await saveThemeToSupabase(updated);
    setIsSaving(false);

    setSaveToast({
      type: result.isSupabase ? 'success' : 'info',
      message: result.message
    });

    setTimeout(() => {
      setSaveToast(null);
      onClose?.();
    }, 1800);
  };

  const handleResetToDefault = () => {
    setActiveMode('video');
    setVideoUrlInput('https://vjs.zencdn.net/v/oceans.mp4');
    setImageUrlInput('');
    setColorInput('#020617');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950/95 border border-white/20 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.95)] overflow-hidden animate-scale-up text-white"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* ========================================================
            HEADER
           ======================================================== */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-amber-500/30 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.35)] shrink-0">
              <Film className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>ڤیدیۆ و پاشبنەمای 4K داشبۆرد</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SUPABASE SYNC
                </span>
              </h2>
              <p className="text-xs text-white/50">
                گۆڕینی ڕاستەوخۆی ڤیدیۆی باکگراوند • پاشەکەوتکردن لە هەوری Supabase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              title="گەڕانەوە بۆ ڤیدیۆی بنەڕەتی"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">بنەڕەتی</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="داخستن"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            SUPABASE LIVE STATUS BANNER
           ======================================================== */}
        <div className="px-5 sm:px-7 py-2.5 bg-gradient-to-r from-cyan-950/40 via-slate-900/40 to-slate-950/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              supabaseStatus.status === 'connected' 
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' 
                : 'bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]'
            }`} />
            <span className="text-white/80 font-medium">
              دۆخی پەیوەندی بە Supabase:
            </span>
            <span className={`font-bold ${
              supabaseStatus.status === 'connected' ? 'text-emerald-300' : 'text-amber-300'
            }`}>
              {supabaseStatus.status === 'connected'
                ? 'پەیوەستە (Real-time Cloud Sync چاڵاکە) 🟢'
                : 'لە ناوخۆدا چاڵاکە (ئامادەی بەستنەوە بە SQL)'}
            </span>
          </div>

          {supabaseStatus.status !== 'connected' && (
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Copy className="w-3 h-3" />
              <span>{sqlCopied ? 'کۆپی کرا! لە SQL Editor داینێ' : 'کۆپیکردنی کۆدی SQL بۆ سوپابەیس'}</span>
            </button>
          )}
        </div>

        {/* ========================================================
            BODY (Scrollable)
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* 1. Mode Switcher (Video / Image / Color) */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-2">
              جۆری پاشبنەمای دڵخوازی خۆت دیاری بکە:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'video', label: '🎬 ڤیدیۆی 4K ئەنیمەیشن', desc: 'Looping Video' },
                { id: 'image', label: '🖼️ وێنەی 4K سینەمایی', desc: '4K Wallpaper' },
                { id: 'color', label: '🎨 ڕەنگی تاریکی OLED', desc: 'Dark Cinema Color' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMode(tab.id)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    activeMode === tab.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-cyan-400'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold">{tab.label}</div>
                  <div className="text-[10px] text-white/50 mt-0.5">{tab.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================
              MODE A: 4K VIDEO ENGINE
             ======================================================== */}
          {activeMode === 'video' && (
            <div className="space-y-4 animate-fade-in">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2 flex items-center justify-between">
                  <span>ڤیدیۆ ئامادەکراوەکانی 4K (یەک کلیک بۆ چالاککردن):</span>
                  <span className="text-[10px] text-cyan-400 font-mono">3 Presets Ready</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {VIDEO_PRESETS.map((p) => {
                    const isSelected = videoUrlInput === p.url;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleApplyPresetVideo(p)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/25 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-cyan-400'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{p.thumb}</span>
                          <div>
                            <div className="text-xs font-bold text-white">{p.title}</div>
                            <div className="text-[10px] text-white/50">{p.desc}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Local File Upload / Selector (کۆمپیوتەر بۆ Vercel / Supabase) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-cyan-950/30 to-slate-900/40 border border-cyan-500/25 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      بارکردنی فایلی ڤیدیۆی 4K لە کۆمپیوتەرەکەت (Local File / Cloud Sync):
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono">Full Quality 4K</span>
                </div>
                <p className="text-[11px] text-white/50">
                  فایلی ڤیدیۆی فوول کوالێتی لەسەر کۆمپیوتەرەکەت هەڵبژێرە؛ لەسەر ئامێرەکەت بەبێ لەگ پەخش دەبێت و هاوکات لە Supabase پاشەکەوت دەکرێت.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span>خەریکی بارکردنە...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>هەڵبژاردنی ڤیدیۆ لە کۆمپیوتەر 📁</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-white/40">فۆرمات: MP4 یان WEBM</span>
                </div>
              </div>

              {/* Custom Video URL Input */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white flex items-center justify-between">
                  <span>یان بەستەری ڤیدیۆی دڵخوازی خۆت بنووسە:</span>
                  <span className="text-[10px] text-white/50 font-mono">MP4, WEBM, M3U8</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={videoUrlInput}
                    onChange={(e) => {
                      setVideoUrlInput(e.target.value);
                      setPreviewError(false);
                    }}
                    placeholder="https://example.com/loop_video.mp4"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                  {videoUrlInput && (
                    <button
                      type="button"
                      onClick={() => setVideoUrlInput('')}
                      className="px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all"
                    >
                      سڕینەوە
                    </button>
                  )}
                </div>
              </div>

              {/* Live 16:9 Video Player Preview */}
              {videoUrlInput && (
                <div className="rounded-2xl border border-white/15 overflow-hidden bg-black/80 relative shadow-2xl">
                  <div className="absolute top-2.5 right-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>پێشبینینی ڕاستەوخۆ (Live 4K Preview)</span>
                  </div>
                  <video
                    ref={previewVideoRef}
                    key={videoUrlInput}
                    src={videoUrlInput}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={() => setPreviewError(true)}
                    className="w-full h-44 sm:h-56 object-cover filter brightness-90 contrast-110"
                  />
                  {previewError && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-2 text-rose-300 p-4 text-center">
                      <AlertCircle className="w-6 h-6 text-rose-400" />
                      <span className="text-xs font-bold">بەستەری ڤیدیۆکە ناکرێتەوە یان فۆرماتی ڤیدیۆکە گونجاو نییە.</span>
                      <span className="text-[10px] text-white/60">تکایە دڵنیابە لەوەی بەستەرەکە کۆتاییەکەی .mp4 یان بەستەری ڕاستەوخۆ بێت.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              MODE B: 4K IMAGE / WALLPAPERS
             ======================================================== */}
          {activeMode === 'image' && (
            <div className="space-y-4 animate-fade-in">
              <label className="block text-xs font-bold text-white/80 mb-1">
                وێنە سەرنجڕاکێشەکانی 4K (یەک کلیک بۆ هەڵبژاردن):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {IMAGE_PRESETS.map((img) => {
                  const isSelected = imageUrlInput === img.url;
                  return (
                    <div
                      key={img.id}
                      onClick={() => handleApplyPresetImage(img)}
                      className={`relative rounded-2xl overflow-hidden border cursor-pointer active:scale-95 transition-all aspect-video group ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img 
                        src={img.url} 
                        alt={img.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter brightness-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[11px] font-bold text-white truncate w-full">{img.title}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Image URL Input */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white">بەستەری وێنەی تایبەت (Custom Image URL):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/wallpaper_4k.jpg"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono outline-none focus:border-cyan-400"
                  />
                  {imageUrlInput && (
                    <button
                      type="button"
                      onClick={() => setImageUrlInput('')}
                      className="px-3 py-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold"
                    >
                      سڕینەوە
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              MODE C: DARK COLOR PRESETS
             ======================================================== */}
          {activeMode === 'color' && (
            <div className="space-y-4 animate-fade-in">
              <label className="block text-xs font-bold text-white/80 mb-1">
                ڕەنگە تاریک و سینەماییەکان:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COLOR_PRESETS.map((col) => {
                  const isSelected = colorInput === col.hex;
                  return (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => handleApplyPresetColor(col)}
                      className={`p-3 rounded-2xl border text-center transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-500/20'
                          : 'border-white/10 hover:border-white/20 bg-white/[0.03]'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full border border-white/30 shrink-0 shadow-inner" style={{ backgroundColor: col.hex }} />
                      <span className="text-xs font-bold text-white truncate">{col.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Picker */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <input
                  type="color"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="w-36 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono outline-none"
                />
                <span className="text-xs text-white/60">ڕەنگی دڵخوازی خۆت هەڵبژێرە</span>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================
            FOOTER ACTION BAR
           ======================================================== */}
        <div className="px-5 sm:px-7 py-4 border-t border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
          {saveToast ? (
            <div className={`flex items-center gap-2 text-xs font-bold ${
              saveToast.type === 'success' ? 'text-emerald-300' : 'text-cyan-300'
            } animate-fade-in`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveToast.message}</span>
            </div>
          ) : (
            <div className="text-xs text-white/50 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>دەستبەجێ لەسەر داشبۆرد و ئامێرەکان کارا دەبێت</span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer"
            >
              پاشگەزبوونەوە
            </button>
            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>خەریکی پاشەکەوتکردنە...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>پاشەکەوتکردن لە Supabase و سەپاندن</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
