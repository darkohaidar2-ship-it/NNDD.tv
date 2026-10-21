import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { 
  getDabinBroadcastConfig, 
  saveDabinBroadcastConfig, 
  extractYouTubeVideoId,
  DEFAULT_DABIN_BROADCAST_CONFIG 
} from '../data/dabinBroadcastManager';

function YoutubeIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function DabinStudioTab({ onNotify }) {
  const [config, setConfig] = useState(getDabinBroadcastConfig);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Sync on mount
  useEffect(() => {
    setConfig(getDabinBroadcastConfig());
  }, []);

  const handleSave = () => {
    const success = saveDabinBroadcastConfig(config);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      onNotify?.({
        title: 'پەخشی DABIN.Tv پاشەکەوتکرا',
        message: 'ڕێکخستنەکانی کەناڵی ژمارە یەک بە سەرکەوتوویی نوێکرانەوە و ڕاستەوخۆ کارایە.',
        type: 'success'
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('دڵنیایت لە گەڕانەوە بۆ ڕێکخستنی بنەڕەتی پەخشی دابین؟')) {
      setConfig({ ...DEFAULT_DABIN_BROADCAST_CONFIG });
      saveDabinBroadcastConfig(DEFAULT_DABIN_BROADCAST_CONFIG);
      onNotify?.({
        title: 'گەڕێنرایەوە',
        message: 'ڕێکخستنەکانی پەخش گەڕێنرانەوە بۆ باری بنەڕەتی.',
        type: 'info'
      });
    }
  };

  // Add video by URL
  const handleAddVideo = (e) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;
    const newItem = {
      id: `vid-${Date.now()}`,
      title: newVideoTitle.trim() || `ڤیدیۆی ژمارە ${(config.videoPlaylist?.length || 0) + 1}`,
      url: newVideoUrl.trim()
    };
    setConfig(prev => ({
      ...prev,
      videoPlaylist: [...(prev.videoPlaylist || []), newItem]
    }));
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  // Upload video from local device (creates local Blob URL)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const newItem = {
      id: `vid-upload-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      url: blobUrl,
      isLocalBlob: true
    };
    setConfig(prev => ({
      ...prev,
      sourceType: 'video',
      videoPlaylist: [...(prev.videoPlaylist || []), newItem]
    }));
    onNotify?.({
      title: 'ڤیدیۆ بارکرا',
      message: `فایلی "${file.name}" بە سەرکەوتوویی بۆ پەخش زیادکرا.`,
      type: 'success'
    });
  };

  // Remove video from playlist
  const handleRemoveVideo = (id) => {
    setConfig(prev => ({
      ...prev,
      videoPlaylist: (prev.videoPlaylist || []).filter(v => v.id !== id)
    }));
  };

  // Add photo to album
  const handleAddPhoto = (e) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    const newItem = {
      id: `img-${Date.now()}`,
      title: newPhotoTitle.trim() || `وێنەی ${(config.albumPhotos?.length || 0) + 1}`,
      url: newPhotoUrl.trim()
    };
    setConfig(prev => ({
      ...prev,
      albumPhotos: [...(prev.albumPhotos || []), newItem]
    }));
    setNewPhotoUrl('');
    setNewPhotoTitle('');
  };

  // Upload photo from device
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (!dataUrl) return;
      const newItem = {
        id: `img-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: dataUrl
      };
      setConfig(prev => ({
        ...prev,
        sourceType: 'album',
        albumPhotos: [...(prev.albumPhotos || []), newItem]
      }));
    };
    reader.readAsDataURL(file);
  };

  // Remove photo from album
  const handleRemovePhoto = (id) => {
    setConfig(prev => ({
      ...prev,
      albumPhotos: (prev.albumPhotos || []).filter(p => p.id !== id)
    }));
  };

  const parsedYtId = extractYouTubeVideoId(config.youtubeUrl);

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 text-start max-w-6xl mx-auto">
      {/* Top Banner */}
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
              دیاریکردنی ڤیدیۆی یوتیوب، ڤیدیۆی ئەپلۆدکراو، ئەلبومی وێنە، لۆگۆی کەناڵ و شریتی ئاگاداری
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
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/30'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'پاشەکەوتکرا ✓' : 'پاشەکەوتکردن'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Broadcast Source & Media (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Broadcast Source Selector */}
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">١. جۆری پەخشی کەناڵەکە هەڵبژێرە</h3>
              </div>
              <span className="text-[11px] text-slate-400">سەرچاوەی پەخشی ڕاستەوخۆ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option A: YouTube */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, sourceType: 'youtube' }))}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col gap-2 ${
                  config.sourceType === 'youtube'
                    ? 'bg-red-500/15 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
                  <YoutubeIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">ڤیدیۆی یوتیوب</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">پەخشی ڕاستەوخۆ یان ڤیدیۆی YouTube</div>
                </div>
              </button>

              {/* Option B: Direct Video / Upload */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, sourceType: 'video' }))}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col gap-2 ${
                  config.sourceType === 'video'
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">ڤیدیۆ یان ئەپلۆد</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">فایلی MP4، پەخش یان ئەپلۆد</div>
                </div>
              </button>

              {/* Option C: Photo Album */}
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, sourceType: 'album' }))}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col gap-2 ${
                  config.sourceType === 'album'
                    ? 'bg-purple-500/15 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Images className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs">ئەلبومی وێنەکان</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">پێشکەشکردنی وێنە بە جووڵەی سلاید</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Source-Specific Controls */}
          
          {/* YOUTUBE CONTROLS */}
          {config.sourceType === 'youtube' && (
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <YoutubeIcon className="w-5 h-5" />
                <span>لینکی ڤیدیۆی یوتیوب (YouTube Link)</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                  لینکی ڤیدیۆ یان پەخشی ڕاستەوخۆ لە YouTube دابنێ:
                </label>
                <input
                  type="text"
                  value={config.youtubeUrl || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const id = extractYouTubeVideoId(val);
                    setConfig(prev => ({
                      ...prev,
                      youtubeUrl: val,
                      youtubeVideoId: id || prev.youtubeVideoId
                    }));
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/15 text-white text-xs focus:outline-none focus:border-red-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>

              {parsedYtId ? (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center gap-4">
                  <img
                    src={`https://img.youtube.com/vi/${parsedYtId}/hqdefault.jpg`}
                    alt="YouTube Preview"
                    className="w-28 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      لینکی پەسەندکراوە (ID: {parsedYtId})
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      ئەم ڤیدیۆیە بە خۆکاری بە شێوازی Loop و کوالێتی بەرز لە کەناڵی دابین پەخش دەکرێت.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>تکایە لینکێکی تەواوی یوتیوب داخڵ بکە.</span>
                </div>
              )}
            </div>
          )}

          {/* VIDEO PLAYLIST CONTROLS */}
          {config.sourceType === 'video' && (
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Film className="w-5 h-5" />
                  <span>لیستی پەخشی ڤیدیۆکان (Video Playlist)</span>
                </div>

                {/* Loop Switch ("و با فیدیۆکان LOOb بێت") */}
                <label className="flex items-center gap-2.5 cursor-pointer bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 transition-all">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                    با ڤیدیۆکان Loop بێت (دووبارەبوونەوە)
                  </span>
                  <input
                    type="checkbox"
                    checked={config.isLoop ?? true}
                    onChange={(e) => setConfig(prev => ({ ...prev, isLoop: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

              {/* Add Video Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Upload Video from device */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-white/20 text-center hover:border-blue-500/50 transition-all">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="dabin_video_upload_input"
                  />
                  <label
                    htmlFor="dabin_video_upload_input"
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white">ئەپلۆدکردنی ڤیدیۆ لە کۆمپیوتەر</span>
                    <span className="text-[10px] text-slate-400">فایلی MP4 یان WebM دیاریبکە</span>
                  </label>
                </div>

                {/* 2. Add Video by URL */}
                <form onSubmit={handleAddVideo} className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white block">یان لینکی ڕاستەوخۆی ڤیدیۆ دانێ:</span>
                  <input
                    type="text"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="ناونیشانی ڤیدیۆ..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://.../video.mp4"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-mono"
                      dir="ltr"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      زیادکردن
                    </button>
                  </div>
                </form>
              </div>

              {/* Video Playlist Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  ڤیدیۆکانی ناو پەخش ({(config.videoPlaylist || []).length} ڤیدیۆ):
                </span>
                {(config.videoPlaylist || []).length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    هیچ ڤیدیۆیەک زیاد نەکراوە. فایلی ڤیدیۆ ئەپلۆد بکە یان لینک دابنێ.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {config.videoPlaylist.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-white/10"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <FileVideo className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-white block truncate">{v.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate" dir="ltr">{v.url}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(v.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer shrink-0"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PHOTO ALBUM CONTROLS */}
          {config.sourceType === 'album' && (
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Images className="w-5 h-5" />
                  <span>ئەلبومی وێنەکان (Photo Album Slideshow)</span>
                </div>

                {/* Duration Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">ماوەی هەر وێنەیەک:</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                    {config.slideDurationSeconds || 6} چرکە
                  </span>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={config.slideDurationSeconds || 6}
                    onChange={(e) => setConfig(prev => ({ ...prev, slideDurationSeconds: parseInt(e.target.value, 10) }))}
                    className="w-24 accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Upload or Add Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-white/20 text-center hover:border-purple-500/50 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="dabin_photo_upload_input"
                  />
                  <label
                    htmlFor="dabin_photo_upload_input"
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white">ئەپلۆدکردنی وێنە لە ئامێرەکەت</span>
                    <span className="text-[10px] text-slate-400">فایلی PNG, JPG, WebP</span>
                  </label>
                </div>

                <form onSubmit={handleAddPhoto} className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white block">یان لینکی وێنە داخڵ بکە:</span>
                  <input
                    type="text"
                    value={newPhotoTitle}
                    onChange={(e) => setNewPhotoTitle(e.target.value)}
                    placeholder="ناونیشانی وێنە..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="https://.../photo.jpg"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-mono"
                      dir="ltr"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      زیادکردن
                    </button>
                  </div>
                </form>
              </div>

              {/* Photos Gallery */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  وێنەکانی ئەلبوم ({(config.albumPhotos || []).length} وێنە):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {(config.albumPhotos || []).map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="relative group rounded-xl overflow-hidden border border-white/10 bg-slate-950 aspect-video flex items-center justify-center"
                    >
                      <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Logo Overlay & Announcement Ticker (1 col wide) */}
        <div className="space-y-6">
          {/* 3. Channel Watermark Logo ("لۆگۆی کەناڵەکە لەلایەک بێت") */}
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>لۆگۆی کەناڵ لەسەر شاشە</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showLogoOverlay ?? true}
                  onChange={(e) => setConfig(prev => ({ ...prev, showLogoOverlay: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            {config.showLogoOverlay && (
              <div className="space-y-3.5 pt-2 border-t border-white/10">
                {/* Logo Position Selector */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1">شوێنی لۆگۆ:</label>
                  <select
                    value={config.logoPosition || 'top-right'}
                    onChange={(e) => setConfig(prev => ({ ...prev, logoPosition: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs cursor-pointer"
                  >
                    <option value="top-right">سەرەوە - لای ڕاست (Top Right)</option>
                    <option value="top-left">سەرەوە - لای چەپ (Top Left)</option>
                    <option value="bottom-right">خوارەوە - لای ڕاست (Bottom Right)</option>
                    <option value="bottom-left">خوارەوە - لای چەپ (Bottom Left)</option>
                  </select>
                </div>

                {/* Logo Size */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1">قەبارەی لۆگۆ:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['small', 'medium', 'large'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, logoSize: sz }))}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          config.logoSize === sz
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz === 'small' ? 'بچووک' : sz === 'medium' ? 'مامناوەند' : 'گەورە'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Opacity Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>ڕوونی (Opacity):</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {Math.round((config.logoOpacity ?? 0.95) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.0"
                    step="0.05"
                    value={config.logoOpacity ?? 0.95}
                    onChange={(e) => setConfig(prev => ({ ...prev, logoOpacity: parseFloat(e.target.value) }))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Announcement Ticker ("شریتی ئاگەداری دابنێ") */}
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>شریتی ئاگاداری (News Ticker)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showTicker ?? true}
                  onChange={(e) => setConfig(prev => ({ ...prev, showTicker: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            {config.showTicker && (
              <div className="space-y-3.5 pt-2 border-t border-white/10">
                {/* Ticker Text */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1">دەقی ئاگاداری:</label>
                  <textarea
                    rows={3}
                    value={config.tickerText || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, tickerText: e.target.value }))}
                    placeholder="دەقی ئاگاداری لێرە بنووسە تا بە جووڵاو لە خوارەوە پەخش بێت..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500 transition-all custom-scrollbar"
                  />
                </div>

                {/* Ticker Badge Text */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1">ناونیشانی تاگ (Badge):</label>
                  <input
                    type="text"
                    value={config.tickerBadgeText || 'ئاگاداری'}
                    onChange={(e) => setConfig(prev => ({ ...prev, tickerBadgeText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-bold"
                  />
                </div>

                {/* Ticker Speed */}
                <div>
                  <label className="text-xs text-slate-300 block mb-1">خێرایی جووڵەی شریت:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'slow', label: 'خاو' },
                      { key: 'normal', label: 'ئاسایی' },
                      { key: 'fast', label: 'خێرا' }
                    ].map((sp) => (
                      <button
                        key={sp.key}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, tickerSpeed: sp.key }))}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          config.tickerSpeed === sp.key
                            ? 'bg-cyan-600/20 border-cyan-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
