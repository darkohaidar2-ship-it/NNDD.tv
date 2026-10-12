import React, { useState, useRef } from 'react';
import { 
  Tv, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Lock, 
  Unlock, 
  Star, 
  Check, 
  X, 
  Image, 
  Radio, 
  Layers, 
  Sparkles,
  ExternalLink,
  Save,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Upload,
  Link2,
  FileImage,
  RefreshCw
} from 'lucide-react';

export default function ChannelManagerTab({ channels, setChannels, onNotify }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('هەموو');
  
  // Modal states for Add / Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);

  // Logo upload state
  const [logoMode, setLogoMode] = useState('upload'); // 'upload' | 'url'
  const [uploadedLogoName, setUploadedLogoName] = useState('');
  const [uploadedLogoSize, setUploadedLogoSize] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'کوردی گشتی',
    url: '',
    backupUrl: '',
    logo: '',
    quality: '1080p HD',
    is4K: false,
    description: '',
    currentShow: '',
    nextShow: ''
  });

  const categories = ['هەموو', 'کوردی گشتی', 'هەواڵ', 'منداڵان', 'دراما و بەرنامە', 'موزیک', 'بەڵگەنامەیی', 'فیلم و سینەما', 'ئاینی', 'تورکی', 'عەرەبی و گشتی', 'هەواڵ و جیهانی'];

  const filteredChannels = channels.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ch.number.toString().includes(searchQuery) ||
                          ch.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'هەموو' || ch.category.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setUploadedLogoName('');
    setUploadedLogoSize('');
    setLogoMode('upload');
    setFormData({
      name: '',
      category: 'کوردی گشتی',
      url: '',
      backupUrl: '',
      logo: 'https://kurdtvs.net/uploads/kurdmax.png',
      quality: '1080p HD',
      is4K: false,
      description: '',
      currentShow: 'بەرنامەی پەخشی ڕاستەوخۆ',
      nextShow: 'درامای شەوانە'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (channel) => {
    setEditingChannel(channel);
    setUploadedLogoName(channel.logo?.startsWith('data:') ? 'وێنەی خەزنکراو (Local Image)' : '');
    setUploadedLogoSize('');
    setLogoMode(channel.logo?.startsWith('data:') ? 'upload' : 'url');
    setFormData({
      name: channel.name,
      category: channel.category,
      url: channel.url,
      backupUrl: channel.backupUrl || '',
      logo: channel.logo,
      quality: channel.quality || '1080p HD',
      is4K: channel.is4K || false,
      description: channel.description || '',
      currentShow: channel.epg?.currentShow || '',
      nextShow: channel.epg?.nextShow || ''
    });
  };

  const handleLogoFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify?.({
        title: 'فایلی نادروست',
        message: 'تکایە تەنها وێنەی (PNG, SVG, JPG, WebP) هەڵبژێرە.',
        type: 'error'
      });
      return;
    }

    setUploadedLogoName(file.name);
    setUploadedLogoSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      if (base64Data) {
        setFormData(prev => ({ ...prev, logo: base64Data }));
        onNotify?.({
          title: 'لۆگۆ بە سەرکەوتوویی بارکرا',
          message: `فایلی "${file.name}" ئامادەیە بۆ سەیڤکردن.`,
          type: 'success'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoFile(file);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return;

    const newChannel = {
      id: `ch-${Date.now()}`,
      number: channels.length + 1,
      name: formData.name,
      category: formData.category,
      url: formData.url,
      backupUrl: formData.backupUrl || formData.url,
      logo: formData.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(formData.name),
      fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(formData.name),
      quality: formData.is4K ? '4K Ultra HD' : formData.quality,
      is4K: formData.is4K,
      isLocked: false,
      isFavorite: false,
      description: formData.description,
      epg: {
        currentShow: formData.currentShow || 'پەخشی ڕاستەوخۆ',
        nextShow: formData.nextShow || 'بەرنامەی داهاتوو',
        timeSlot: '20:00 - 21:00',
        progress: 50
      }
    };

    setChannels([newChannel, ...channels]);
    setIsAddModalOpen(false);
    onNotify?.({
      title: 'کەناڵی نوێ زیادکرا',
      message: `کەناڵی "${newChannel.name}" خرایە یەکەم لیستی کەناڵەکان بە سەرکەوتوویی.`,
      type: 'success'
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingChannel) return;

    const updated = channels.map(ch => {
      if (ch.id === editingChannel.id) {
        return {
          ...ch,
          name: formData.name,
          category: formData.category,
          url: formData.url,
          backupUrl: formData.backupUrl,
          logo: formData.logo,
          quality: formData.is4K ? '4K Ultra HD' : formData.quality,
          is4K: formData.is4K,
          description: formData.description,
          epg: {
            ...ch.epg,
            currentShow: formData.currentShow,
            nextShow: formData.nextShow
          }
        };
      }
      return ch;
    });

    setChannels(updated);
    setEditingChannel(null);
    onNotify?.({
      title: 'کەناڵ دەستکاری کرا',
      message: `زانیارییەکانی کەناڵی "${formData.name}" بە سەرکەوتوویی نوێکرانەوە.`,
      type: 'success'
    });
  };

  const handleDeleteChannel = (id, name) => {
    if (window.confirm(`دڵنیایت لە سڕینەوەی کەناڵی "${name}"؟`)) {
      setChannels(channels.filter(ch => ch.id !== id));
      onNotify?.({
        title: 'کەناڵ سڕایەوە',
        message: `کەناڵی "${name}" لە لیستەکە لابرا.`,
        type: 'info'
      });
    }
  };

  const toggleChannelLock = (id) => {
    setChannels(channels.map(ch => {
      if (ch.id === id) {
        const nextState = !ch.isLocked;
        onNotify?.({
          title: nextState ? 'کەناڵ قفڵکرا (Parental Locked)' : 'قفڵی کەناڵ کرایەوە',
          message: `کەناڵی "${ch.name}" ${nextState ? 'بە PIN نهێنی قفڵکرا' : 'ئازادکرا'}.`,
          type: nextState ? 'info' : 'success'
        });
        return { ...ch, isLocked: nextState };
      }
      return ch;
    }));
  };

  const toggleChannelFavorite = (id) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, isFavorite: !ch.isFavorite } : ch));
  };

  // ========================================================
  // DEDICATED SEPARATE PAGE: EDIT / ADD CHANNEL VIEW (Apple Light Mode)
  // ========================================================
  if (editingChannel || isAddModalOpen) {
    const isEditing = !!editingChannel;
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in text-xs text-slate-900">
        
        {/* Top Navigation Bar with Back Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setEditingChannel(null); setIsAddModalOpen(false); }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-2 border border-slate-200 active:scale-95 transition-all shadow-xs group"
            >
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:-translate-x-1 transition-transform" />
              <span>گەڕانەوە بۆ لیستی کەناڵەکان</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-blue-600" />
                  <span>{isEditing ? `پەڕەی دەستکاریکردنی کەناڵ: ${formData.name || editingChannel.name}` : 'پەڕەی زیادکردنی کەناڵی نوێ'}</span>
                </h3>
                {formData.is4K && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black shadow-xs">
                    4K
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {isEditing ? 'دەستکاری هەموو زانیاری، لۆگۆ، سێرڤەری سەرەکی، یەدەگ و EPG بکە بەبێ دەستکاری سۆرس کۆد' : 'زانیاری و لینکی کەناڵی نوێ لێرە تۆمار بکە تا دەستبەجێ بخرێتە ناو سیستەم'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => { setEditingChannel(null); setIsAddModalOpen(false); }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-colors"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="button"
              onClick={isEditing ? handleSaveEdit : handleSaveAdd}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>پاشەکەوتکردنی گۆڕانکارییەکان</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Live Interactive Preview Box */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>پێشبینینی کەناڵەکە (Live Preview)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formData.quality || '1080p HD'}
                </span>
              </div>

              {/* Cinema Aspect Ratio Preview Box (Inside light frame) */}
              <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 overflow-hidden shadow-md group text-white">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt={formData.name}
                    className="w-20 h-20 object-contain p-2 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(formData.name || 'preview'); }}
                  />
                ) : (
                  <Tv className="w-16 h-16 text-slate-700" />
                )}

                <div className="text-center mt-2">
                  <h4 className="font-bold text-white text-sm drop-shadow-md">
                    {formData.name || 'ناوی کەناڵ بنووسە'}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {formData.category}
                  </span>
                </div>

                {formData.is4K && (
                  <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] shadow-md">
                    4K Ultra HD
                  </span>
                )}
                <span className="absolute bottom-2.5 end-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-cyan-300 font-mono text-[9px] border border-white/10">
                  {formData.quality || '1080p'}
                </span>
              </div>

              {/* Status & EPG Info Card */}
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500">بەرنامەی ئێستا (EPG):</span>
                  <span className="font-bold text-slate-800 truncate max-w-[160px]">{formData.currentShow || 'پەخشی ڕاستەوخۆ'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500">بەرنامەی داهاتوو:</span>
                  <span className="text-slate-700 truncate max-w-[160px]">{formData.nextShow || 'بەرنامەی داهاتوو'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500">دۆخی سێرڤەر:</span>
                  <span className="text-emerald-700 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ستریمی کارا (Live M3U8)</span>
                  </span>
                </div>
                {formData.backupUrl && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500">سێرڤەری یەدەگ (Backup):</span>
                    <span className="text-blue-600 font-mono font-bold">بەردەستە ✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Edit Form Fields */}
          <form onSubmit={isEditing ? handleSaveEdit : handleSaveAdd} className="lg:col-span-2 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">ناوی کەناڵ:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="بۆ نموونە: Rudaw TV 4K"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">بەش (Category):</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none text-xs"
                  >
                    {categories.filter(c => c !== 'هەموو').map(c => (
                      <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">لینکی پەخشی سەرەکی (M3U8 Stream URL):</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://.../stream.m3u8"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">لینکی سێرڤەری یەدەگ (Backup Failover URL):</label>
                <input
                  type="url"
                  value={formData.backupUrl}
                  onChange={(e) => setFormData({ ...formData, backupUrl: e.target.value })}
                  placeholder="ئەگەر ستریمی یەکەم وەستا، سیستم دەستبەجێ دەگۆڕێتە سەر ئەم بەستەرە"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none font-mono text-xs"
                />
              </div>

              {/* Logo Manager: Upload File vs Direct URL */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <FileImage className="w-4 h-4 text-blue-600" />
                    <span>لۆگۆی کەناڵ (Channel Logo):</span>
                  </label>
                  
                  {/* Selector Pills: Upload vs URL */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-[11px] shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setLogoMode('upload')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        logoMode === 'upload' 
                          ? 'bg-blue-600 text-white shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>ئەپڵۆدکردنی وێنە</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoMode('url')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        logoMode === 'url' 
                          ? 'bg-blue-600 text-white shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>بەستەری ئینتەرنێت</span>
                    </button>
                  </div>
                </div>

                {logoMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleLogoFile(e.target.files?.[0])}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
                      className="hidden"
                    />

                    {formData.logo ? (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={formData.logo}
                            alt="Logo preview"
                            className="w-12 h-12 object-contain bg-slate-50 rounded-lg p-1 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                              {uploadedLogoName || 'وێنەی هەڵبژێردراو'}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-medium">
                              ✓ لۆگۆ بە سەرکەوتوویی بارکراوە {uploadedLogoSize ? `(${uploadedLogoSize})` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            گۆڕین
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, logo: '' }));
                              setUploadedLogoName('');
                              setUploadedLogoSize('');
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                            title="سڕینەوە"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                          isDragging 
                            ? 'border-blue-500 bg-blue-50/80 scale-[1.01]' 
                            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-1.5" />
                        <div className="text-xs font-bold text-slate-800">
                          کلیک لێرە بکە بۆ ئەپڵۆدکردنی لۆگۆ لە کۆمپیوتەر یان مۆبایلەکەت
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          یان وێنەکە ڕابکێشە بۆ ئێرە (PNG, SVG, WebP, JPG)
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Resolution & 4K Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">کوالێتی (Resolution):</label>
                  <select
                    value={formData.quality}
                    onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-none text-xs"
                  >
                    <option value="4K Ultra HD" className="bg-white text-slate-900">4K Ultra HD</option>
                    <option value="1080p HD" className="bg-white text-slate-900">1080p HD</option>
                    <option value="720p HD" className="bg-white text-slate-900">720p HD</option>
                    <option value="SD 576p" className="bg-white text-slate-900">SD 576p</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is4K}
                      onChange={(e) => setFormData({ ...formData, is4K: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-800">نیشانەی تایبەتی 4K لەسەر کەناڵەکە دابنێ</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">بەرنامەی ئێستا (EPG Current):</label>
                  <input
                    type="text"
                    value={formData.currentShow}
                    onChange={(e) => setFormData({ ...formData, currentShow: e.target.value })}
                    placeholder="ناوی بەرنامەی لە پەخشدا"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">بەرنامەی داهاتوو (Next Show):</label>
                  <input
                    type="text"
                    value={formData.nextShow}
                    onChange={(e) => setFormData({ ...formData, nextShow: e.target.value })}
                    placeholder="ناوی بەرنامەی دواتر"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is4K}
                    onChange={(e) => setFormData({ ...formData, is4K: e.target.checked })}
                    className="rounded text-amber-500 bg-white border-slate-300 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">کەناڵی کوالێتی 4K Ultra HDـیە</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteChannel(editingChannel.id, editingChannel.name)}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>سڕینەوەی ئەم کەناڵە</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditingChannel(null); setIsAddModalOpen(false); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition-colors"
                  >
                    پەشیمانبوونەوە
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>پاشەکەوتکردنی گۆڕانکارییەکان</span>
                  </button>
                </div>
              </div>

            </div>
          </form>

        </div>
      </div>
    );
  }

  // ========================================================
  // MAIN CHANNELS TABLE VIEW (Apple Light Mode)
  // ========================================================
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in text-xs text-slate-900">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Tv className="w-5 h-5 text-blue-600" />
            <span>بەڕێوەبردنی کەناڵەکان و EPG (Channel Manager & CRUD)</span>
          </h3>
          <p className="text-slate-500 mt-0.5">
            دەست بنێ بە هەر کەناڵێک تا لە پەڕەیەکی تردا بکرێتەوە بۆ دەستکاریکردنی لۆگۆ، لینک و بەرنامەکان
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>زیادکردنی کەناڵی نوێ</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="گەڕان بەپێی ناوی کەناڵ یان ژمارە..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2 shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
        <span>دەست بنێ بە هەر دێڕ یان ناوی کەناڵێک بۆ ئەوەی ڕاستەوخۆ لە پەڕەیەکی تردا بکرێتەوە بۆ دەستکاریکردن.</span>
      </div>

      {/* Channels Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-medium">
              <th className="py-2.5 text-start">#</th>
              <th className="py-2.5 text-start">لۆگۆ</th>
              <th className="py-2.5 text-start">ناوی کەناڵ (کلیک بکە بۆ ئیدیت)</th>
              <th className="py-2.5 text-start">بەش (Category)</th>
              <th className="py-2.5 text-start">کوالێتی</th>
              <th className="py-2.5 text-start">بەرنامەی ئێستا (EPG)</th>
              <th className="py-2.5 text-start">دۆخ و قفڵ</th>
              <th className="py-2.5 text-end">کردارەکان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredChannels.map((ch, idx) => (
              <tr 
                key={ch.id} 
                onClick={() => openEditModal(ch)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                title="کلیک بکە بۆ کردنەوە لە پەڕەی دەستکاریکردن"
              >
                <td className="py-3 font-mono font-bold text-slate-400 group-hover:text-blue-600">
                  {idx + 1}
                </td>
                <td className="py-3">
                  <img
                    src={ch.logo}
                    alt={ch.name}
                    onError={(e) => { e.target.src = ch.fallbackLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + ch.name; }}
                    className="w-8 h-8 rounded-lg object-contain bg-slate-50 p-0.5 border border-slate-200 shadow-2xs group-hover:scale-110 transition-transform"
                  />
                </td>
                <td className="py-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                    <span>{ch.name}</span>
                    {ch.is4K && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black shadow-2xs">4K</span>
                    )}
                    <span className="text-[10px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-normal">
                      (دەستکاری) ✎
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={ch.url}>
                    {ch.url}
                  </div>
                </td>
                <td className="py-3 text-slate-600 font-medium">
                  {ch.category}
                </td>
                <td className="py-3 font-mono text-[11px] text-indigo-600 font-semibold">
                  {ch.quality || '1080p'}
                </td>
                <td className="py-3 text-slate-700">
                  <div className="truncate max-w-[160px] font-medium" title={ch.epg?.currentShow}>
                    {ch.epg?.currentShow || 'پەخشی ڕاستەوخۆ'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                    داهاتوو: {ch.epg?.nextShow || 'بەرنامەی داهاتوو'}
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleChannelLock(ch.id)}
                      className={`p-1 rounded-lg transition-colors border ${
                        ch.isLocked 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                      }`}
                      title={ch.isLocked ? 'قفڵکراو بە PIN' : 'ئازاد'}
                    >
                      {ch.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => toggleChannelFavorite(ch.id)}
                      className={`p-1 rounded-lg transition-colors border ${
                        ch.isFavorite 
                          ? 'bg-amber-50 border-amber-200 text-amber-600' 
                          : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-slate-200'
                      }`}
                      title="دڵخواز (Favorite)"
                    >
                      <Star className={`w-3.5 h-3.5 ${ch.isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>
                </td>
                <td className="py-3 text-end">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(ch)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 transition-colors"
                      title="دەستکاریکردنی کەناڵ لە پەڕەی سەربەخۆ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteChannel(ch.id, ch.name)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-200 transition-colors"
                      title="سڕینەوەی کەناڵ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
