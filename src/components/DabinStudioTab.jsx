import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Video, 
  Film, 
  Images, 
  Upload, 
  Play, 
  Repeat, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Sliders, 
  Radio, 
  Globe, 
  FileVideo, 
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { 
  getDabinBroadcastConfig, 
  saveDabinBroadcastConfig, 
  extractYouTubeVideoId,
  calculateCurrentBroadcastState,
  formatBroadcastTime,
  DEFAULT_DABIN_BROADCAST_CONFIG 
} from '../data/dabinBroadcastManager';
import { saveMediaBlob } from '../data/dabinMediaStorage';

function YoutubeIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function DabinStudioTab({ onNotify }) {
  const [config, setConfig] = useState(getDabinBroadcastConfig);
  const [isSaved, setIsSaved] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState('upload_video'); // 'upload_video' | 'url_video' | 'youtube' | 'image'

  // Input states for Add form
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [videoDurationInput, setVideoDurationInput] = useState(120);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [youtubeTitleInput, setYoutubeTitleInput] = useState('');
  const [youtubeDurationInput, setYoutubeDurationInput] = useState(60);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageTitleInput, setImageTitleInput] = useState('');
  const [imageDurationInput, setImageDurationInput] = useState(12);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Real-time ticking on-air broadcast clock
  const [liveState, setLiveState] = useState(() => calculateCurrentBroadcastState(getDabinBroadcastConfig()));

  useEffect(() => {
    setConfig(getDabinBroadcastConfig());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveState(calculateCurrentBroadcastState(config));
    }, 1000);
    return () => clearInterval(timer);
  }, [config]);

  const handleSave = (updatedConfig = null) => {
    const toSave = updatedConfig || config;
    const success = saveDabinBroadcastConfig(toSave);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      onNotify?.({
        title: 'پەخشی کەناڵی دابین پاشەکەوتکرا',
        message: 'کاتی پەخشی ڕاستەوخۆ و ڕێکخستنەکان بە سەرکەوتوویی نوێکرانەوە.',
        type: 'success'
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('دڵنیایت لە گەڕانەوە بۆ ڕێکخستنی بنەڕەتی تایملاین؟')) {
      setConfig({ ...DEFAULT_DABIN_BROADCAST_CONFIG });
      saveDabinBroadcastConfig(DEFAULT_DABIN_BROADCAST_CONFIG);
      onNotify?.({
        title: 'گەڕێنرایەوە',
        message: 'ڕێکخستنەکانی تایملاین گەڕێنرانەوە بۆ باری بنەڕەتی.',
        type: 'info'
      });
    }
  };

  // Start broadcast from now (resync linear timeline cycle to 00:00 right now)
  const handleStartBroadcastFromNow = () => {
    const now = Date.now();
    const updated = {
      ...config,
      broadcastStartTime: now
    };
    setConfig(updated);
    saveDabinBroadcastConfig(updated);
    onNotify?.({
      title: 'خولی پەخش لە ئێستاوە دەستی پێکرد 🔴',
      message: 'کاتی دەستپێکی پەخش ڕێکخرایەوە بۆ ئەم چرکەیە و کەناڵەکە لە بڕگەی یەکەمەوە لەسەر هەموو شاشەکان پەخش دەکرێت.',
      type: 'success'
    });
  };

  // Reorder items on the timeline (Move left / Move right)
  const handleMoveItem = (index, direction) => {
    const items = [...(config.timelineItems || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    const updated = {
      ...config,
      timelineItems: items
    };
    setConfig(updated);
    saveDabinBroadcastConfig(updated);
  };

  // Delete item from timeline
  const handleDeleteItem = (id) => {
    const updated = {
      ...config,
      timelineItems: (config.timelineItems || []).filter(item => item.id !== id)
    };
    setConfig(updated);
    saveDabinBroadcastConfig(updated);
  };

  // Update item duration
  const handleUpdateItemDuration = (index, newSeconds) => {
    const val = Math.max(2, parseInt(newSeconds, 10) || 10);
    const updatedItems = [...(config.timelineItems || [])];
    if (!updatedItems[index]) return;
    updatedItems[index] = { ...updatedItems[index], duration: val };
    const updated = { ...config, timelineItems: updatedItems };
    setConfig(updated);
    saveDabinBroadcastConfig(updated);
  };

  // Upload video from local computer
  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const id = `tl-vid-${Date.now()}`;
    const blobUrl = URL.createObjectURL(file);

    // Save to IndexedDB persistently
    await saveMediaBlob(id, file, { name: file.name, type: file.type });

    const newItem = {
      id,
      type: 'video',
      title: file.name.replace(/\.[^/.]+$/, ''),
      url: blobUrl,
      thumbnail: '/dabin-logo.png',
      duration: 120, // default 2 minutes until loaded
      isLocalUpload: true
    };

    // Auto-detect video duration from metadata
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = blobUrl;
      tempVideo.onloadedmetadata = () => {
        const detected = Math.round(tempVideo.duration);
        if (detected > 0) {
          setConfig(prev => {
            const items = (prev.timelineItems || []).map(item => 
              item.id === id ? { ...item, duration: detected } : item
            );
            const updatedWithDur = { ...prev, timelineItems: items };
            saveDabinBroadcastConfig(updatedWithDur);
            return updatedWithDur;
          });
        }
      };
    } catch(e) {}

    const updated = {
      ...config,
      timelineItems: [...(config.timelineItems || []), newItem]
    };
    setConfig(updated);
    saveDabinBroadcastConfig(updated);

    onNotify?.({
      title: 'ڤیدیۆ زیادکرا بۆ شریتی پەخش',
      message: `فایلی "${file.name}" خرایە ناو خولی پەخشی ڕاستەوخۆ.`,
      type: 'success'
    });
  };

  // Add Video by direct URL
  const handleAddVideoUrl = (e) => {
    e.preventDefault();
    if (!videoUrlInput.trim()) return;

    const newItem = {
      id: `tl-vid-${Date.now()}`,
      type: 'video',
      title: videoTitleInput.trim() || `ڤیدیۆی ${(config.timelineItems || []).length + 1}`,
      url: videoUrlInput.trim(),
      thumbnail: '/dabin-logo.png',
      duration: parseInt(videoDurationInput, 10) || 120
    };

    const updated = {
      ...config,
      timelineItems: [...(config.timelineItems || []), newItem]
    };
    setConfig(updated);
    saveDabinBroadcastConfig(updated);

    setVideoUrlInput('');
    setVideoTitleInput('');
    setVideoDurationInput(120);

    onNotify?.({
      title: 'ڤیدیۆ زیادکرا',
      message: 'ڤیدیۆکە زیادکرا بۆ شریتی پەخشی کەناڵی دابین.',
      type: 'success'
    });
  };

  // Add YouTube to timeline
  const handleAddYoutube = (e) => {
    e.preventDefault();
    const id = extractYouTubeVideoId(youtubeUrlInput);
    if (!id) {
      alert('تکایە لینکێکی تەواوی ڤیدیۆی یوتیوب بنووسە.');
      return;
    }

    const newItem = {
      id: `tl-yt-${Date.now()}`,
      type: 'youtube',
      title: youtubeTitleInput.trim() || `بڕگەی پەخشی DABIN.Tv (${(config.timelineItems || []).length + 1})`,
      url: youtubeUrlInput.trim(),
      youtubeId: id,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      duration: parseInt(youtubeDurationInput, 10) || 60
    };

    const updated = {
      ...config,
      timelineItems: [...(config.timelineItems || []), newItem]
    };
    setConfig(updated);
    saveDabinBroadcastConfig(updated);

    setYoutubeUrlInput('');
    setYoutubeTitleInput('');
    setYoutubeDurationInput(60);

    onNotify?.({
      title: 'یوتیوب زیادکرا',
      message: 'کلیپی یوتیوب زیادکرا بۆ خولی پەخش.',
      type: 'success'
    });
  };

  // Upload or Add Image to timeline
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (!dataUrl) return;

      const newItem = {
        id: `tl-img-${Date.now()}`,
        type: 'image',
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: dataUrl,
        thumbnail: dataUrl,
        duration: parseInt(imageDurationInput, 10) || 12
      };

      const updated = {
        ...config,
        timelineItems: [...(config.timelineItems || []), newItem]
      };
      setConfig(updated);
      saveDabinBroadcastConfig(updated);

      onNotify?.({
        title: 'وێنە زیادکرا بۆ تایملاین',
        message: `وێنەی "${file.name}" بۆ ماوەی ${newItem.duration} چرکە خرایە پەخشەوە.`,
        type: 'success'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    const newItem = {
      id: `tl-img-${Date.now()}`,
      type: 'image',
      title: imageTitleInput.trim() || `وێنەی ${(config.timelineItems || []).length + 1}`,
      url: imageUrlInput.trim(),
      thumbnail: imageUrlInput.trim(),
      duration: parseInt(imageDurationInput, 10) || 12
    };

    const updated = {
      ...config,
      timelineItems: [...(config.timelineItems || []), newItem]
    };
    setConfig(updated);
    saveDabinBroadcastConfig(updated);

    setImageUrlInput('');
    setImageTitleInput('');
    setImageDurationInput(12);

    onNotify?.({
      title: 'وێنە زیادکرا',
      message: 'وێنەکە خرایە سەر شریتی تایملاین.',
      type: 'success'
    });
  };

  const timelineList = config.timelineItems || [];
  const currentOnAirItem = liveState?.currentItem;

  return (
    <div className="space-y-6 animate-fade-in p-3 sm:p-6 text-start max-w-6xl mx-auto">
      {/* =========================================================================
          TOP BANNER
         ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900/80 to-slate-900/90 border border-blue-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(37,99,235,0.5)] shrink-0 border border-white/20">
            <Tv className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                کۆنترۆڵی پەخشی DABIN.Tv Channel
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                کەناڵی #1
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              پەخشی ڕاستەوخۆ لە ئەدمین دیاری دەکرێت و بۆ بینەران لە سەرەتاوە دەستپێناکات، بەڵکو بەپێی کاتی ڕاستەقینەی کەناڵ بەردەوام دەبێت.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بنەڕەتی</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/30'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'پاشەکەوتکرا ✓' : 'پاشەکەوتکردنی گۆڕانکارییەکان'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: LIVE BROADCAST MASTER CONTROL ROOM (ژووری کۆنترۆڵی کاتی پەخش)
         ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-900/90 border border-red-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-400/30 relative">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute top-2 right-2" />
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-red-400 uppercase">
                  MASTER CONTROL ROOM
                </span>
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] animate-pulse">
                  ON-AIR LIVE
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                چاودێری و کۆنترۆڵی پەخشی ڕاستەوخۆ لەسەر شاشەی بینەران
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Start From Now Button */}
            <button
              type="button"
              onClick={handleStartBroadcastFromNow}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer active:scale-95 transition-all"
              title="سەرلەنوێ خولی پەخشەکە لە خولەکی 00:00 دەستپێبکە لەم چرکەیەوە"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>دەستپێکردنەوەی پەخش لە ئێستاوە</span>
            </button>
          </div>
        </div>

        {/* Live On-Air Monitor Widget */}
        {currentOnAirItem ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Thumbnail */}
              <div className="relative w-24 sm:w-32 aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                <img
                  src={currentOnAirItem.thumbnail || currentOnAirItem.url || '/dabin-logo.png'}
                  alt={currentOnAirItem.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-white">
                  {currentOnAirItem.type}
                </span>
              </div>

              {/* Program Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-red-400">لەم چرکەیەدا لەسەر شاشە دەڕوات:</span>
                  <span className="font-mono text-xs text-white/70">
                    (بڕگەی {liveState.itemIndex + 1} لە {timelineList.length})
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                  {currentOnAirItem.title}
                </h4>

                {/* Progress Bar */}
                <div className="mt-2 space-y-1">
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-red-500 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, (liveState.seekSeconds / Math.max(1, liveState.itemDuration)) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span className="text-cyan-400 font-bold">{formatBroadcastTime(liveState.seekSeconds)}</span>
                    <span className="text-slate-400">کۆی بەرنامە: {formatBroadcastTime(liveState.itemDuration)}</span>
                    <span className="text-amber-400">ماوە: {Math.round(liveState.remainingSeconds)} چرکە</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Show Info */}
            {liveState.nextItem && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0 max-w-xs text-start md:text-end">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">بەرنامەی دواتر:</span>
                <span className="text-xs font-bold text-white block truncate">{liveState.nextItem.title}</span>
                <span className="text-[10px] text-cyan-300 block font-mono mt-0.5">
                  دوای {Math.round(liveState.remainingSeconds)} چرکە پەخش دەبێت
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            هیچ بەرنامەیەک لە پەخشدانییە. تکایە لە خوارەوە ڤیدیۆ یان وێنە زیادبکە.
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: THE VISUAL BROADCAST TIMELINE STRIP ("شریتێکی تایملاین")
         ========================================================================= */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-400/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>شریتی تایملاینی پەخش (Broadcast Timeline Track)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {timelineList.length} بڕگە
                </span>
                <span className="text-xs font-normal text-slate-400">
                  (کۆی خول: {formatBroadcastTime(liveState.totalCycleDuration)})
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                تەواوی ڤیدیۆ و وێنەکان لێرە بەدوای یەکدا ڕیز دەبن و یەک لە دوای یەک پەخش دەکرێن
              </p>
            </div>
          </div>

          {/* Loop Switch Toggle ("با فیدیۆکان LOOb بێت") */}
          <label className="flex items-center gap-2.5 cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/15 transition-all">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Repeat className={`w-4 h-4 ${config.isLoop ? 'text-cyan-400 animate-spin-slow' : 'text-slate-400'}`} />
              <span>با هەمووی بەدوای یەکدا Loop بێت</span>
            </span>
            <input
              type="checkbox"
              checked={config.isLoop ?? true}
              onChange={(e) => {
                const updated = { ...config, isLoop: e.target.checked };
                setConfig(updated);
                saveDabinBroadcastConfig(updated);
              }}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>

        {/* The Horizontal Timeline Strip (Scrollable Track) */}
        {timelineList.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-white/15 rounded-2xl text-center space-y-2">
            <Film className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">شریتی تایملاین بەتاڵە</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              لە بەشی خوارەوە فایلی ڤیدیۆ ئەپلۆد بکە، لینکی ڤیدیۆ یان وێنە یان لینکی یوتیوب دابنێ تا بخرێتە سەر شریتەکە.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Scrollable Timeline Reel */}
            <div className="flex items-stretch gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1 px-1">
              {timelineList.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === timelineList.length - 1;
                const isOnAir = liveState?.itemIndex === index;

                return (
                  <div
                    key={item.id || index}
                    className={`relative shrink-0 w-64 rounded-2xl transition-all p-3 flex flex-col justify-between shadow-lg group ${
                      isOnAir 
                        ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-red-950/40 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)] ring-2 ring-red-500/20' 
                        : 'bg-slate-950/90 border border-white/15 hover:border-cyan-400/50'
                    }`}
                  >
                    {/* Step Number & Type Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                          isOnAir ? 'bg-red-600 text-white shadow-md' : 'bg-white/15 text-white'
                        }`}>
                          {index + 1}
                        </span>
                        {isOnAir && (
                          <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            ON-AIR
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.type === 'video' && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            ڤیدیۆ
                          </span>
                        )}
                        {item.type === 'youtube' && (
                          <span className="px-2 py-0.5 rounded-md bg-red-600/20 text-red-300 border border-red-400/30 text-[10px] font-bold flex items-center gap-1">
                            <YoutubeIcon className="w-3 h-3" />
                            یوتیوب
                          </span>
                        )}
                        {item.type === 'image' && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold flex items-center gap-1">
                            <Images className="w-3 h-3" />
                            وێنە
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thumbnail Preview */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/10 mb-2 flex items-center justify-center">
                      {item.type === 'image' || item.thumbnail ? (
                        <img
                          src={item.thumbnail || item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Film className="w-8 h-8 text-blue-400 opacity-60" />
                      )}

                      {/* Duration Tag */}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 border border-white/10">
                        <Clock className="w-2.5 h-2.5 text-cyan-400" />
                        <span>{formatBroadcastTime(item.duration)} ({item.duration}s)</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="mb-3">
                      <span className="text-xs font-bold text-white block truncate" title={item.title}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate font-mono" dir="ltr">
                        {item.url}
                      </span>
                    </div>

                    {/* Timeline Controls (Reorder Left/Right, Duration Edit, Delete) */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-2 gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveItem(index, -1)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isFirst 
                              ? 'opacity-30 border-transparent cursor-not-allowed text-slate-600' 
                              : 'bg-white/5 hover:bg-white/15 text-white border-white/10 cursor-pointer active:scale-90'
                          }`}
                          title="بردنە پێشەوە لە تایملاین"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveItem(index, 1)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isLast 
                              ? 'opacity-30 border-transparent cursor-not-allowed text-slate-600' 
                              : 'bg-white/5 hover:bg-white/15 text-white border-white/10 cursor-pointer active:scale-90'
                          }`}
                          title="بردنە دواوە لە تایملاین"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Duration Quick Adjust */}
                      <div className="flex items-center gap-1" title="ماوەی پەخش بە چرکە">
                        <input
                          type="number"
                          min="2"
                          max="3600"
                          value={item.duration || 60}
                          onChange={(e) => handleUpdateItemDuration(index, e.target.value)}
                          className="w-14 px-1.5 py-1 rounded bg-black/70 border border-white/20 text-[11px] text-center font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                        <span className="text-[10px] text-slate-400">چرکە</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer active:scale-90"
                        title="سڕینەوە لە تایملاین"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: ADD MEDIA TO BROADCAST TIMELINE
         ========================================================================= */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Plus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-white">٣. زیادکردنی ڤیدیۆ و وێنەی نوێ بۆ شریتی پەخش</h3>
          </div>

          {/* Add Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveAddTab('upload_video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeAddTab === 'upload_video'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ئەپلۆدی ڤیدیۆ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAddTab('url_video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeAddTab === 'url_video'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>لینکی ڤیدیۆ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAddTab('youtube')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeAddTab === 'youtube'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <YoutubeIcon className="w-3.5 h-3.5" />
              <span>یوتیوب</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAddTab('image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeAddTab === 'image'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>وێنە</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Video File Upload */}
        {activeAddTab === 'upload_video' && (
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-dashed border-blue-500/40 text-center hover:border-blue-400 transition-all space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="video/mp4,video/webm,video/ogg"
              onChange={handleVideoFileUpload}
              className="hidden"
              id="timeline_video_upload_input"
            />
            <label
              htmlFor="timeline_video_upload_input"
              className="flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shadow-lg border border-blue-400/30">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white">فایلی ڤیدیۆ لە کۆمپیوتەرەکەت هەڵبژێرە</span>
              <span className="text-xs text-slate-400">فایلی MP4 یان WebM هەڵبژێرە، دەستبەجێ دەخرێتە ناو خولی پەخشی ڕاستەوخۆ</span>
            </label>
          </div>
        )}

        {/* Tab 2: Direct Video URL */}
        {activeAddTab === 'url_video' && (
          <form onSubmit={handleAddVideoUrl} className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">ناونیشانی ڤیدیۆ:</label>
                <input
                  type="text"
                  value={videoTitleInput}
                  onChange={(e) => setVideoTitleInput(e.target.value)}
                  placeholder="ناوی کورت یان ڕاپۆرت..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">لینکی ڕاستەوخۆ (MP4 / M3U8):</label>
                <input
                  type="url"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ماوەی پەخش (چرکە):</label>
                <input
                  type="number"
                  min="5"
                  max="7200"
                  value={videoDurationInput}
                  onChange={(e) => setVideoDurationInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>زیادکردنی ڤیدیۆ بۆ پەخش</span>
            </button>
          </form>
        )}

        {/* Tab 3: YouTube Stream */}
        {activeAddTab === 'youtube' && (
          <form onSubmit={handleAddYoutube} className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">ناونیشانی پەخش یان کلیپ:</label>
                <input
                  type="text"
                  value={youtubeTitleInput}
                  onChange={(e) => setYoutubeTitleInput(e.target.value)}
                  placeholder="پەخشی ڕاستەوخۆی یوتیوب..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">لینکی یوتیوب:</label>
                <input
                  type="text"
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ماوەی پەخش (چرکە):</label>
                <input
                  type="number"
                  min="5"
                  max="7200"
                  value={youtubeDurationInput}
                  onChange={(e) => setYoutubeDurationInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>زیادکردنی یوتیوب بۆ تایملاین</span>
            </button>
          </form>
        )}

        {/* Tab 4: Image Upload / URL */}
        {activeAddTab === 'image' && (
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image File Upload */}
              <div className="p-4 rounded-xl border border-dashed border-purple-500/40 text-center flex flex-col items-center justify-center gap-2 hover:border-purple-400 transition-all">
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageFileUpload}
                  className="hidden"
                  id="timeline_img_upload_input"
                />
                <label htmlFor="timeline_img_upload_input" className="cursor-pointer space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto mb-1">
                    <Images className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white block">ئەپلۆدکردنی وێنە لە کۆمپیوتەر</span>
                  <span className="text-[11px] text-slate-400 block">ماوە: {imageDurationInput} چرکە</span>
                </label>
              </div>

              {/* Image URL Form */}
              <form onSubmit={handleAddImageUrl} className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-0.5">ناونیشانی وێنە:</label>
                  <input
                    type="text"
                    value={imageTitleInput}
                    onChange={(e) => setImageTitleInput(e.target.value)}
                    placeholder="کارت یان ڕیکلام..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-0.5">لینکی وێنە (URL):</label>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/banner.png"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white text-xs font-mono"
                    dir="ltr"
                    required
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] text-slate-300">ماوە (چرکە):</label>
                    <input
                      type="number"
                      min="2"
                      max="120"
                      value={imageDurationInput}
                      onChange={(e) => setImageDurationInput(e.target.value)}
                      className="w-14 px-2 py-1 rounded bg-slate-900 border border-white/15 text-xs text-center font-mono text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>زیادکردن</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 4: CHANNEL WATERMARK LOGO OVERLAY ("لۆگۆی کەناڵەکە لەلایەک بێت")
         ========================================================================= */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">٤. لۆگۆی کەناڵ لەسەر پەخش (Watermark Logo)</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            <span className="text-xs font-bold text-white">پیشاندانی لۆگۆ</span>
            <input
              type="checkbox"
              checked={config.showLogoOverlay ?? true}
              onChange={(e) => {
                const updated = { ...config, showLogoOverlay: e.target.checked };
                setConfig(updated);
                saveDabinBroadcastConfig(updated);
              }}
              className="w-4 h-4 rounded text-blue-500 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="text-xs text-slate-300 block mb-1.5">شوێنی لۆگۆ:</label>
            <select
              value={config.logoPosition || 'top-right'}
              onChange={(e) => {
                const updated = { ...config, logoPosition: e.target.value };
                setConfig(updated);
                saveDabinBroadcastConfig(updated);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs cursor-pointer"
            >
              <option value="top-right">سەرەوە لای ڕاست (Top Right)</option>
              <option value="top-left">سەرەوە لای چەپ (Top Left)</option>
              <option value="bottom-right">خوارەوە لای ڕاست (Bottom Right)</option>
              <option value="bottom-left">خوارەوە لای چەپ (Bottom Left)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1.5">قەبارەی لۆگۆ:</label>
            <select
              value={config.logoSize || 'medium'}
              onChange={(e) => {
                const updated = { ...config, logoSize: e.target.value };
                setConfig(updated);
                saveDabinBroadcastConfig(updated);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs cursor-pointer"
            >
              <option value="small">بچووک (Small)</option>
              <option value="medium">ناوەند (Medium)</option>
              <option value="large">گەورە (Large)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1.5">ڕوونی لۆگۆ (Opacity):</label>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={config.logoOpacity ?? 0.95}
              onChange={(e) => {
                const updated = { ...config, logoOpacity: parseFloat(e.target.value) };
                setConfig(updated);
                saveDabinBroadcastConfig(updated);
              }}
              className="w-full cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: LIVE ANNOUNCEMENT TICKER ("شریتی ئاگەداری دابنێ")
         ========================================================================= */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">٥. شریتی ئاگاداری ڕاکردوو لە خوارەوەی کەناڵ (News Ticker)</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            <span className="text-xs font-bold text-white">پیشاندانی شریت</span>
            <input
              type="checkbox"
              checked={config.showTicker ?? true}
              onChange={(e) => {
                const updated = { ...config, showTicker: e.target.checked };
                setConfig(updated);
                saveDabinBroadcastConfig(updated);
              }}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs text-slate-300 block mb-1">دەقی ئاگاداری کە بەردەوام دەسوڕێتەوە:</label>
            <textarea
              rows={2}
              value={config.tickerText || ''}
              onChange={(e) => {
                const updated = { ...config, tickerText: e.target.value };
                setConfig(updated);
                saveDabinBroadcastConfig(updated);
              }}
              placeholder="بەخێربێن بۆ کەناڵی تایبەتی DABIN.Tv..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">دەقی باجی گڵۆپدار:</label>
              <input
                type="text"
                value={config.tickerBadgeText || 'ئاگاداری'}
                onChange={(e) => {
                  const updated = { ...config, tickerBadgeText: e.target.value };
                  setConfig(updated);
                  saveDabinBroadcastConfig(updated);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">خێرایی سوڕانەوە:</label>
              <select
                value={config.tickerSpeed || 'normal'}
                onChange={(e) => {
                  const updated = { ...config, tickerSpeed: e.target.value };
                  setConfig(updated);
                  saveDabinBroadcastConfig(updated);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs cursor-pointer"
              >
                <option value="slow">هێواش (35 چرکە)</option>
                <option value="normal">ئاسایی (25 چرکە)</option>
                <option value="fast">خێرا (18 چرکە)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
