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
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [youtubeTitleInput, setYoutubeTitleInput] = useState('');
  const [youtubeDurationInput, setYoutubeDurationInput] = useState(60);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageTitleInput, setImageTitleInput] = useState('');
  const [imageDurationInput, setImageDurationInput] = useState(8);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    setConfig(getDabinBroadcastConfig());
  }, []);

  const handleSave = () => {
    const success = saveDabinBroadcastConfig(config);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      onNotify?.({
        title: 'شریتی تایملاین پاشەکەوتکرا',
        message: 'ڕێکخستنەکانی تایملاینی کەناڵی دابین بە سەرکەوتوویی نوێکرانەوە و ڕاستەوخۆ کارایە.',
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

  // Reorder items on the timeline (Move left / Move right)
  const handleMoveItem = (index, direction) => {
    const items = [...(config.timelineItems || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    setConfig(prev => ({
      ...prev,
      timelineItems: items
    }));
  };

  // Delete item from timeline
  const handleDeleteItem = (id) => {
    setConfig(prev => ({
      ...prev,
      timelineItems: (prev.timelineItems || []).filter(item => item.id !== id)
    }));
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
      duration: 0, // play till finish
      isLocalUpload: true
    };

    setConfig(prev => ({
      ...prev,
      timelineItems: [...(prev.timelineItems || []), newItem]
    }));

    onNotify?.({
      title: 'ڤیدیۆ زیادکرا بۆ تایملاین',
      message: `فایلی "${file.name}" ڕیزکرا لەسەر شریتی تایملاین.`,
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
      duration: 0
    };

    setConfig(prev => ({
      ...prev,
      timelineItems: [...(prev.timelineItems || []), newItem]
    }));

    setVideoUrlInput('');
    setVideoTitleInput('');
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
      title: youtubeTitleInput.trim() || `YouTube Stream (${id})`,
      url: youtubeUrlInput.trim(),
      youtubeId: id,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      duration: parseInt(youtubeDurationInput, 10) || 60
    };

    setConfig(prev => ({
      ...prev,
      timelineItems: [...(prev.timelineItems || []), newItem]
    }));

    setYoutubeUrlInput('');
    setYoutubeTitleInput('');
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
        duration: parseInt(imageDurationInput, 10) || 8
      };

      setConfig(prev => ({
        ...prev,
        timelineItems: [...(prev.timelineItems || []), newItem]
      }));

      onNotify?.({
        title: 'وێنە زیادکرا بۆ تایملاین',
        message: `وێنەی "${file.name}" بۆ ماوەی ${newItem.duration} چرکە ڕیزکرا.`,
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
      duration: parseInt(imageDurationInput, 10) || 8
    };

    setConfig(prev => ({
      ...prev,
      timelineItems: [...(prev.timelineItems || []), newItem]
    }));

    setImageUrlInput('');
    setImageTitleInput('');
  };

  const timelineList = config.timelineItems || [];

  return (
    <div className="space-y-6 animate-fade-in p-3 sm:p-6 text-start max-w-6xl mx-auto">
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
              شریتی تایملاین بۆ ڕیزکردنی فیدیۆکان، ئەپلۆد، لینکی یوتیوب و وێنەکان بەدوای یەکدا
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
            <span>{isSaved ? 'پاشەکەوتکرا ✓' : 'پاشەکەوتکردن و پەخش'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: THE VISUAL BROADCAST TIMELINE STRIP ("شریتێکی تایملاین")
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
                  {timelineList.length} پارچە
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
              onChange={(e) => setConfig(prev => ({ ...prev, isLoop: e.target.checked }))}
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

                return (
                  <div
                    key={item.id || index}
                    className="relative shrink-0 w-64 rounded-2xl bg-slate-950/90 border border-white/15 hover:border-cyan-400/50 transition-all p-3 flex flex-col justify-between shadow-lg group"
                  >
                    {/* Step Number & Type Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-lg bg-white/15 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

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
                        <span>{item.duration > 0 ? `${item.duration}s` : 'پەخشی تەواو'}</span>
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

                    {/* Timeline Controls (Reorder Left/Right & Delete) */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
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

                      {/* Image / Clip Duration Quick Adjust */}
                      {item.type === 'image' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="2"
                            max="60"
                            value={item.duration || 8}
                            onChange={(e) => {
                              const val = Math.max(2, parseInt(e.target.value, 10) || 5);
                              const updated = [...config.timelineItems];
                              updated[index] = { ...updated[index], duration: val };
                              setConfig(prev => ({ ...prev, timelineItems: updated }));
                            }}
                            className="w-12 px-1.5 py-1 rounded bg-black/60 border border-white/15 text-[10px] text-center font-mono text-white"
                          />
                          <span className="text-[10px] text-slate-400">چرکە</span>
                        </div>
                      )}

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
          SECTION 2: ADD MEDIA DIRECTLY TO TIMELINE
         ========================================================================= */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Plus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-white">٢. پارچەی نوێ زیادبکە بۆ سەر شریتی تایملاین</h3>
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
              <span className="text-xs text-slate-400">فایلی MP4 یان WebM هەڵبژێرە، دەستبەجێ دەخرێتە سەر شریتی تایملاین</span>
            </label>
          </div>
        )}

        {/* Tab 2: Direct Video URL */}
        {activeAddTab === 'url_video' && (
          <form onSubmit={handleAddVideoUrl} className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  type="text"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://.../video.mp4"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردن بۆ تایملاین</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: YouTube Stream / Video */}
        {activeAddTab === 'youtube' && (
          <form onSubmit={handleAddYoutube} className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-300 block mb-1">لینکی ڤیدیۆ یان پەخشی YouTube:</label>
                <input
                  type="text"
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ماوەی لێدان لەسەر تایملاین (چرکە):</label>
                <input
                  type="number"
                  min="10"
                  max="7200"
                  value={youtubeDurationInput}
                  onChange={(e) => setYoutubeDurationInput(e.target.value)}
                  placeholder="60"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردنی ڤیدیۆی یوتیوب بۆ تایملاین</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Images / Photos */}
        {activeAddTab === 'image' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Upload local photo */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-dashed border-purple-500/40 text-center hover:border-purple-400 transition-all flex flex-col items-center justify-center gap-2">
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
                id="timeline_image_upload_input"
              />
              <label
                htmlFor="timeline_image_upload_input"
                className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">ئەپلۆدکردنی وێنە لە ئامێرەکەت</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WebP</span>
              </label>
            </div>

            {/* 2. Add Image by URL */}
            <form onSubmit={handleAddImageUrl} className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
              <input
                type="text"
                value={imageTitleInput}
                onChange={(e) => setImageTitleInput(e.target.value)}
                placeholder="ناوی وێنەکە..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white text-xs"
              />
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://.../photo.jpg"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white text-xs font-mono"
                dir="ltr"
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-300">ماوە:</span>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={imageDurationInput}
                    onChange={(e) => setImageDurationInput(e.target.value)}
                    className="w-12 px-2 py-1 rounded bg-slate-900 border border-white/15 text-white text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">چرکە</span>
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                >
                  زیادکردن
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: CHANNEL LOGO & TICKER SETTINGS
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Logo Watermark Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت") */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>لۆگۆی کەناڵ لەسەر پەخش (Watermark)</span>
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
              <div>
                <label className="text-xs text-slate-300 block mb-1">شوێنی لۆگۆ لەسەر شاشە:</label>
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
            </div>
          )}
        </div>

        {/* Announcement Ticker ("شریتی ئاگەداری دابنێ") */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>شریتی ئاگاداری لە خوارەوە (News Ticker)</span>
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
              <div>
                <label className="text-xs text-slate-300 block mb-1">دەقی ئاگاداری:</label>
                <textarea
                  rows={2}
                  value={config.tickerText || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, tickerText: e.target.value }))}
                  placeholder="دەقی ئاگاداری لێرە بنووسە تا بە جووڵاو لە خوارەوە پەخش بێت..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-500 transition-all custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">ناونیشانی تاگ:</label>
                  <input
                    type="text"
                    value={config.tickerBadgeText || 'ئاگاداری'}
                    onChange={(e) => setConfig(prev => ({ ...prev, tickerBadgeText: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">خێرایی جووڵە:</label>
                  <select
                    value={config.tickerSpeed || 'normal'}
                    onChange={(e) => setConfig(prev => ({ ...prev, tickerSpeed: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs cursor-pointer"
                  >
                    <option value="slow">خاو (Slow)</option>
                    <option value="normal">ئاسایی (Normal)</option>
                    <option value="fast">خێرا (Fast)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
