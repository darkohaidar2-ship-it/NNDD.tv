import React, { useState, useRef, useMemo } from 'react';
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
  UploadCloud,
  Upload,
  Link2,
  FileImage,
  RefreshCw,
  Server,
  Zap,
  Eye,
  EyeOff,
  Table,
  CheckSquare,
  Square,
  Copy,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { 
  DEFAULT_SERVER_CONFIG, 
  importTargetServerChannels 
} from '../data/serverImporter';
import { saveChannelToSupabase } from '../data/supabaseClient';
import { getStoredServers, getStoredServerSettings } from '../data/serverManager';
import { getLocalizedChannelName } from '../data/translations';

export default function ChannelManagerTab({ channels, setChannels, onNotify }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('هەموو');
  
  // Google Sheets ERP Mode states
  const [viewMode, setViewMode] = useState('sheets'); // 'sheets' | 'table'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'visible' | 'hidden'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [lastSavedId, setLastSavedId] = useState(null);

  // Modal states for Add / Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);

  // Server Import State
  const [isImportingServer, setIsImportingServer] = useState(false);
  const [importProgress, setImportProgress] = useState(null);

  // Logo upload state
  const [logoMode, setLogoMode] = useState('upload'); // 'upload' | 'url'
  const [uploadedLogoName, setUploadedLogoName] = useState('');
  const [uploadedLogoSize, setUploadedLogoSize] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Form state with trilingual names (Kurdish, Arabic, English)
  const [formData, setFormData] = useState({
    name: '',
    nameKu: '',
    nameAr: '',
    nameEn: '',
    category: 'کوردی',
    serverId: 'srv-nndd-free',
    url: '',
    backupUrl: '',
    logo: '',
    quality: '1080p HD',
    is4K: false,
    description: '',
    currentShow: '',
    nextShow: ''
  });

  // Dynamic Categories including server categories
  const categories = useMemo(() => {
    const set = new Set(['هەموو', 'ڕووداو', 'هەواڵەکان کوردی', 'کوردی', 'beIN Sports', 'وەرزش', 'MBC', 'OSN', 'Shahid VIP', 'عێراق', 'ئاینی', 'منداڵان', 'کەناڵەکانی تر']);
    channels.forEach(ch => {
      if (ch.category?.trim()) set.add(ch.category.trim());
    });
    return Array.from(set);
  }, [channels]);

  // Filter channels based on Status (Visible / Hidden), Category, and Search
  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      // Status filter (Visible vs Hidden)
      if (statusFilter === 'visible' && ch.isHidden) return false;
      if (statusFilter === 'hidden' && !ch.isHidden) return false;

      // Category filter
      const matchesCategory = selectedCategory === 'هەموو' || (ch.category && ch.category.includes(selectedCategory));
      if (!matchesCategory) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const chKu = getLocalizedChannelName(ch, 'ku');
      const chAr = getLocalizedChannelName(ch, 'ar');
      const chEn = getLocalizedChannelName(ch, 'en');
      return (ch.name && ch.name.toLowerCase().includes(q)) ||
             (chKu && chKu.toLowerCase().includes(q)) ||
             (chAr && chAr.toLowerCase().includes(q)) ||
             (chEn && chEn.toLowerCase().includes(q)) ||
             ch.number?.toString().includes(q) ||
             (ch.category && ch.category.toLowerCase().includes(q)) ||
             (ch.url && ch.url.toLowerCase().includes(q));
    });
  }, [channels, statusFilter, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredChannels.length / pageSize) || 1;
  const paginatedChannels = useMemo(() => {
    if (pageSize >= 9999) return filteredChannels;
    const start = (currentPage - 1) * pageSize;
    return filteredChannels.slice(start, start + pageSize);
  }, [filteredChannels, currentPage, pageSize]);

  // Reset page when filters change
  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const openAddModal = () => {
    const activeServer = getStoredServers().find(s => s.isPrimary) || getStoredServers()[0];
    setUploadedLogoName('');
    setUploadedLogoSize('');
    setLogoMode('upload');
    setFormData({
      name: '',
      nameKu: '',
      nameAr: '',
      nameEn: '',
      category: 'کوردی',
      serverId: activeServer?.id || 'srv-nndd-free',
      url: '',
      backupUrl: '',
      logo: 'https://kurdtvs.net/uploads/rudawhd.png',
      quality: '1080p HD',
      is4K: false,
      description: '',
      currentShow: 'بەرنامەی پەخشی ڕاستەوخۆ',
      nextShow: 'درامای شەوانە'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (channel) => {
    const activeServer = getStoredServers().find(s => s.isPrimary) || getStoredServers()[0];
    setEditingChannel(channel);
    setUploadedLogoName(channel.logo?.startsWith('data:') ? 'وێنەی خەزنکراو (Local Image)' : '');
    setUploadedLogoSize('');
    setLogoMode(channel.logo?.startsWith('data:') ? 'upload' : 'url');
    setFormData({
      name: channel.name,
      nameKu: channel.nameKu || getLocalizedChannelName(channel, 'ku'),
      nameAr: channel.nameAr || getLocalizedChannelName(channel, 'ar'),
      nameEn: channel.nameEn || getLocalizedChannelName(channel, 'en'),
      category: channel.category,
      serverId: channel.serverId || activeServer?.id || 'srv-nndd-free',
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

  const handleImportXtreamChannels = async () => {
    setIsImportingServer(true);
    setImportProgress({ category: 'پشکنینی سێرڤەر...', current: 0, total: 4 });

    try {
      const serverChannels = await importTargetServerChannels(DEFAULT_SERVER_CONFIG, (prog) => {
        setImportProgress(prog);
      });

      if (serverChannels && serverChannels.length > 0) {
        setChannels(serverChannels);
        try {
          localStorage.setItem('nndd_cached_channels', JSON.stringify(serverChannels));
        } catch (e) {}

        // Try syncing to Supabase in background
        serverChannels.slice(0, 10).forEach(ch => {
          saveChannelToSupabase(ch).catch(() => {});
        });

        onNotify?.({
          title: 'هاوردەکردن تەواو بوو! 🎉',
          message: `کۆی ${serverChannels.length} کەناڵی 4K و کوردستان و بین سپۆرت بە سەرکەوتوویی لە سێرڤەرەوە هاوردە کران.`,
          type: 'success'
        });
      } else {
        throw new Error('هیچ کەناڵێک نەدۆزرایەوە');
      }
    } catch (err) {
      onNotify?.({
        title: 'هەڵە لە هاوردەکردن',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsImportingServer(false);
      setImportProgress(null);
    }
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    const resolvedName = (formData.nameKu || formData.nameEn || formData.name || '').trim();
    if (!resolvedName || !formData.url) return;

    const newChannel = {
      id: `ch-${Date.now()}`,
      number: channels.length + 1,
      name: resolvedName,
      nameKu: (formData.nameKu || resolvedName).trim(),
      nameAr: (formData.nameAr || resolvedName).trim(),
      nameEn: (formData.nameEn || resolvedName).trim(),
      category: formData.category,
      serverId: formData.serverId || 'srv-nndd-free',
      url: formData.url,
      backupUrl: formData.backupUrl || formData.url,
      logo: formData.logo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(resolvedName),
      fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(resolvedName),
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

    const newChannels = [newChannel, ...channels];
    setChannels(newChannels);
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(newChannels));
    } catch(e) {}
    setIsAddModalOpen(false);
    onNotify?.({
      title: 'کەناڵی نوێ زیادکرا',
      message: `کەناڵی "${newChannel.nameKu || newChannel.name}" بە سەرکەوتوویی بە هەرسێ زمان زیادکرا.`,
      type: 'success'
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingChannel) return;

    const resolvedName = (formData.nameKu || formData.nameEn || formData.name || editingChannel.name || '').trim();

    const updated = channels.map(ch => {
      if (ch.id === editingChannel.id) {
        return {
          ...ch,
          name: resolvedName,
          nameKu: (formData.nameKu || resolvedName).trim(),
          nameAr: (formData.nameAr || resolvedName).trim(),
          nameEn: (formData.nameEn || resolvedName).trim(),
          category: formData.category,
          serverId: formData.serverId || ch.serverId || 'srv-nndd-free',
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
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(updated));
    } catch(e) {}
    setEditingChannel(null);
    onNotify?.({
      title: 'کەناڵ نوێکرایەوە',
      message: `زانیارییەکانی کەناڵی "${formData.nameKu || resolvedName}" بە هەرسێ زمان نوێکرایەوە.`,
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

  // Toggle Single Channel Visibility (Show / Hide in viewer app)
  const toggleChannelVisibility = (id) => {
    const updated = channels.map(ch => {
      if (ch.id === id) {
        const nextHidden = !ch.isHidden;
        onNotify?.({
          title: nextHidden ? 'کەناڵ شاردرایەوە (Hidden)' : 'کەناڵ دیارە لە ئەپ (Visible)',
          message: `کەناڵی "${ch.nameKu || ch.name}" ${nextHidden ? 'لە ئەپەکەدا شاردرایەوە و بینەران نایبینن' : 'لە ئەپەکەدا نیشان دەدرێت'}.`,
          type: nextHidden ? 'info' : 'success'
        });
        return { ...ch, isHidden: nextHidden };
      }
      return ch;
    });
    setChannels(updated);
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(updated));
    } catch(e) {}
  };

  // Bulk actions for selected channels
  const handleBulkVisibility = (hide) => {
    if (selectedIds.size === 0) return;
    const updated = channels.map(ch => {
      if (selectedIds.has(ch.id)) {
        return { ...ch, isHidden: hide };
      }
      return ch;
    });
    setChannels(updated);
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(updated));
    } catch(e) {}
    onNotify?.({
      title: 'نوێکردنەوەی بەکۆمەڵ (Bulk Update)',
      message: `${selectedIds.size} کەناڵ بە سەرکەوتوویی ${hide ? 'شاردرانەوە لە ئەپ' : 'نیشان دران لە ئەپ'}.`,
      type: 'success'
    });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`دڵنیایت لە سڕینەوەی ${selectedIds.size} کەناڵی هەڵبژێردراو؟`)) {
      const updated = channels.filter(ch => !selectedIds.has(ch.id));
      setChannels(updated);
      try {
        localStorage.setItem('nndd_cached_channels', JSON.stringify(updated));
      } catch(e) {}
      onNotify?.({
        title: 'کەناڵەکان سڕانەوە',
        message: `${selectedIds.size} کەناڵ بە یەکجاری لە لیستەکە لابردران.`,
        type: 'info'
      });
      setSelectedIds(new Set());
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedChannels.length && paginatedChannels.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedChannels.map(c => c.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Direct Inline Cell Edit (Google Sheets Real-time editing)
  const handleInlineFieldChange = (id, field, value) => {
    const updated = channels.map(ch => {
      if (ch.id === id) {
        const next = { ...ch, [field]: value };
        if (field === 'nameKu' && (!ch.name || ch.name === ch.nameKu)) {
          next.name = value;
        }
        return next;
      }
      return ch;
    });
    setChannels(updated);
    setLastSavedId(id);
    setTimeout(() => setLastSavedId(null), 1500);
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(updated));
    } catch(e) {}
  };

  // ========================================================
  // DEDICATED SEPARATE PAGE: EDIT / ADD CHANNEL VIEW (Dark Cinema Glass)
  // ========================================================
  if (editingChannel || isAddModalOpen) {
    const isEditing = !!editingChannel;
    return (
      <div className="bg-slate-900/65 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in text-xs text-white ring-1 ring-white/5">
        
        {/* Top Navigation Bar with Back Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setEditingChannel(null); setIsAddModalOpen(false); }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold flex items-center gap-2 border border-white/10 active:scale-95 transition-all shadow-xs group cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              <span>گەڕانەوە بۆ لیستی کەناڵەکان</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Tv className="w-4 h-4" />
                  </span>
                  <span>{isEditing ? `پەڕەی دەستکاریکردنی کەناڵ: ${formData.name || editingChannel.name}` : 'پەڕەی زیادکردنی کەناڵی نوێ'}</span>
                </h3>
                {formData.is4K && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                    4K
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {isEditing ? 'دەستکاری هەموو زانیاری، لۆگۆ، سێرڤەری سەرەکی، یەدەگ و EPG بکە بەبێ دەستکاری سۆرس کۆد' : 'زانیاری و لینکی کەناڵی نوێ لێرە تۆمار بکە تا دەستبەجێ بخرێتە ناو سیستەم'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => { setEditingChannel(null); setIsAddModalOpen(false); }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold border border-white/10 transition-colors cursor-pointer"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="button"
              onClick={isEditing ? handleSaveEdit : handleSaveAdd}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-all border border-cyan-400/30 cursor-pointer"
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
            <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 shadow-inner space-y-4 ring-1 ring-white/5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>پێشبینینی کەناڵەکە (Live Preview)</span>
                </span>
                <span className="text-[10px] text-cyan-300 font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                  {formData.quality || '1080p HD'}
                </span>
              </div>

              {/* Cinema Aspect Ratio Preview Box */}
              <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-white/10 flex flex-col items-center justify-center p-4 overflow-hidden shadow-2xl group text-white">
                <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt={formData.name}
                    className="w-20 h-20 object-contain p-2 filter drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-110 relative z-10"
                    onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(formData.name || 'preview'); }}
                  />
                ) : (
                  <Tv className="w-16 h-16 text-slate-700 relative z-10" />
                )}

                <div className="text-center mt-2 relative z-10">
                  <h4 className="font-bold text-white text-sm drop-shadow-md">
                    {formData.name || 'ناوی کەناڵ بنووسە'}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {formData.category}
                  </span>
                </div>

                {formData.is4K && (
                  <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] shadow-[0_0_8px_rgba(245,158,11,0.5)] z-10">
                    4K Ultra HD
                  </span>
                )}
                <span className="absolute bottom-2.5 end-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-cyan-300 font-mono text-[9px] border border-white/15 z-10">
                  {formData.quality || '1080p'}
                </span>
              </div>

              {/* Status & EPG Info Card */}
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-2xs">
                  <span className="text-slate-400">بەرنامەی ئێستا (EPG):</span>
                  <span className="font-bold text-white truncate max-w-[160px]">{formData.currentShow || 'پەخشی ڕاستەوخۆ'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-2xs">
                  <span className="text-slate-400">بەرنامەی داهاتوو:</span>
                  <span className="text-slate-300 truncate max-w-[160px]">{formData.nextShow || 'بەرنامەی داهاتوو'}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-2xs">
                  <span className="text-slate-400">دۆخی سێرڤەر:</span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                    <span>ستریمی کارا (Live M3U8)</span>
                  </span>
                </div>
                {formData.backupUrl && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-2xs">
                    <span className="text-slate-400">سێرڤەری یەدەگ (Backup):</span>
                    <span className="text-cyan-300 font-mono font-bold">بەردەستە ✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Edit Form Fields */}
          <form onSubmit={isEditing ? handleSaveEdit : handleSaveAdd} className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-inner space-y-4 ring-1 ring-white/5">
              
              {/* Trilingual Channel Names Section */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    ناوی کەناڵ بە هەر سێ زمان (Trilingual Channel Names)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    بە پێی زمانی بەکارهێنەر بە جیاوازی نیشان دەدرێت
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Kurdish Name */}
                  <div>
                    <label className="font-bold text-slate-200 block mb-1 text-[11px]">
                      ☀️ ناو بە کوردی:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nameKu}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        nameKu: e.target.value,
                        name: e.target.value || formData.name 
                      })}
                      placeholder="بۆ نموونە: ڕووداو"
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-amber-400 focus:bg-white/10 focus:ring-1 focus:ring-amber-400/30 outline-none text-xs font-medium"
                    />
                  </div>

                  {/* 2. Arabic Name */}
                  <div>
                    <label className="font-bold text-slate-200 block mb-1 text-[11px]">
                      🌙 الاسم بالعربية:
                    </label>
                    <input
                      type="text"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="مثال: رووداو"
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-emerald-400 focus:bg-white/10 focus:ring-1 focus:ring-emerald-400/30 outline-none text-xs font-medium"
                    />
                  </div>

                  {/* 3. English Name */}
                  <div>
                    <label className="font-bold text-slate-200 block mb-1 text-[11px]">
                      🌐 English Name:
                    </label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        nameEn: e.target.value,
                        name: formData.nameKu || e.target.value || formData.name 
                      })}
                      placeholder="e.g. Rudaw TV HD"
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/10 focus:ring-1 focus:ring-cyan-400/30 outline-none text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">بەش (Category):</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-cyan-400 outline-none text-xs"
                  >
                    {categories.filter(c => c !== 'هەموو').map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>سێرڤەری سەرچاوە:</span>
                  </label>
                  <select
                    value={formData.serverId || 'srv-nndd-free'}
                    onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-cyan-400 outline-none text-xs"
                  >
                    {getStoredServers().map(srv => (
                      <option key={srv.id} value={srv.id} className="bg-slate-900 text-white">
                        {srv.name} {srv.isPrimary ? '★ (سەرەکی)' : ''} ({srv.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">لینکی پەخشی سەرەکی (M3U8 Stream URL):</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://.../stream.m3u8"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/10 outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">لینکی سێرڤەری یەدەگ (Backup Failover URL):</label>
                <input
                  type="url"
                  value={formData.backupUrl}
                  onChange={(e) => setFormData({ ...formData, backupUrl: e.target.value })}
                  placeholder="ئەگەر ستریمی یەکەم وەستا، سیستم دەستبەجێ دەگۆڕێتە سەر ئەم بەستەرە"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-cyan-400 focus:bg-white/10 outline-none font-mono text-xs"
                />
              </div>

              {/* Logo Manager: Upload File vs Direct URL */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-bold text-white text-xs flex items-center gap-1.5">
                    <FileImage className="w-4 h-4 text-cyan-400" />
                    <span>لۆگۆی کەناڵ (Channel Logo):</span>
                  </label>
                  
                  {/* Selector Pills: Upload vs URL */}
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setLogoMode('upload')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        logoMode === 'upload' 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-white'
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
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-white'
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
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={formData.logo}
                            alt="Logo preview"
                            className="w-12 h-12 object-contain bg-slate-900 rounded-lg p-1 border border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate max-w-[220px]">
                              {uploadedLogoName || 'وێنەی هەڵبژێردراو'}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-medium">
                              ✓ لۆگۆ بە سەرکەوتوویی بارکراوە {uploadedLogoSize ? `(${uploadedLogoSize})` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
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
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
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
                            ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]' 
                            : 'border-white/15 hover:border-cyan-400/50 bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                      >
                        <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-1.5" />
                        <div className="text-xs font-bold text-white">
                          کلیک لێرە بکە بۆ ئەپڵۆدکردنی لۆگۆ لە کۆمپیوتەر یان مۆبایلەکەت
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-cyan-400 outline-none font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Resolution & 4K Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">کوالێتی (Resolution):</label>
                  <select
                    value={formData.quality}
                    onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:border-cyan-400 outline-none text-xs"
                  >
                    <option value="4K Ultra HD" className="bg-slate-900 text-white">4K Ultra HD</option>
                    <option value="1080p HD" className="bg-slate-900 text-white">1080p HD</option>
                    <option value="720p HD" className="bg-slate-900 text-white">720p HD</option>
                    <option value="SD 576p" className="bg-slate-900 text-white">SD 576p</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is4K}
                      onChange={(e) => setFormData({ ...formData, is4K: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 bg-white/10 border-white/20 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-bold text-white">نیشانەی تایبەتی 4K لەسەر کەناڵەکە دابنێ</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">بەرنامەی ئێستا (EPG Current):</label>
                  <input
                    type="text"
                    value={formData.currentShow}
                    onChange={(e) => setFormData({ ...formData, currentShow: e.target.value })}
                    placeholder="ناوی بەرنامەی لە پەخشدا"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-cyan-400 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1.5">بەرنامەی داهاتوو (Next Show):</label>
                  <input
                    type="text"
                    value={formData.nextShow}
                    onChange={(e) => setFormData({ ...formData, nextShow: e.target.value })}
                    placeholder="ناوی بەرنامەی دواتر"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-cyan-400 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteChannel(editingChannel.id, editingChannel.name)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>سڕینەوەی ئەم کەناڵە</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setEditingChannel(null); setIsAddModalOpen(false); }}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold border border-white/10 transition-colors cursor-pointer"
                  >
                    پەشیمانبوونەوە
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-all border border-cyan-400/30 cursor-pointer"
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
  // MAIN CHANNELS VIEW (Google Sheets ERP & Standard Table)
  // ========================================================
  const visibleCount = channels.filter(c => !c.isHidden).length;
  const hiddenCount = channels.filter(c => c.isHidden).length;

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-fade-in text-xs text-white ring-1 ring-white/5">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Table className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>بەڕێوەبردنی کەناڵەکان وەک گۆگڵ شێت (Google Sheets ERP)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  Live Sync
                </span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                تەواوی کەناڵەکانی ئەم سێرڤەرە دەستکاری بکە، چی دیار بێت و چی بشاردرێتەوە بە یەک کلیک دیاری بکە
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('sheets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'sheets'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border border-emerald-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>خشتەی گۆگڵ شێت (Sheets)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>لیستی ستاندارد</span>
            </button>
          </div>

          <button
            onClick={handleImportXtreamChannels}
            disabled={isImportingServer}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-bold flex items-center gap-2 border border-white/10 transition-all text-xs cursor-pointer"
            title="نوێکردنەوە و هێنانی کەناڵەکانی سێرڤەر"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isImportingServer ? 'animate-spin' : ''}`} />
            <span>{isImportingServer ? `هاوردەکردن...` : 'هاوردەکردنی سێرڤەر'}</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] active:scale-95 transition-all text-xs cursor-pointer border border-cyan-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>زیادکردنی کەناڵ</span>
          </button>
        </div>
      </div>

      {/* Sheets Metric & Status Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleFilterChange('all')}
          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'all'
              ? 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'bg-slate-950/60 border-white/10 hover:bg-white/5'
          }`}
        >
          <div>
            <div className="text-[11px] text-slate-400 font-medium">کۆی کەناڵەکانی سێرڤەر</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">{channels.length} کەناڵ</div>
          </div>
          <span className="p-2 rounded-xl bg-white/5 text-cyan-400 border border-white/10">
            <Tv className="w-4 h-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('visible')}
          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'visible'
              ? 'bg-emerald-500/20 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'bg-slate-950/60 border-white/10 hover:bg-white/5'
          }`}
        >
          <div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>دیارە لە ئەپ (بینەر دەتوانێت بیبینێت)</span>
            </div>
            <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">{visibleCount} کەناڵ</div>
          </div>
          <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            ✓ کارا
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('hidden')}
          className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'hidden'
              ? 'bg-rose-500/20 border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'bg-slate-950/60 border-white/10 hover:bg-white/5'
          }`}
        >
          <div>
            <div className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5" />
              <span>شاراوەیە لە ئەپ (بینەر نایبینێت)</span>
            </div>
            <div className="text-lg font-black text-rose-300 font-mono mt-0.5">{hiddenCount} کەناڵ</div>
          </div>
          <span className="p-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30">
            🚫 شاردراوە
          </span>
        </button>
      </div>

      {/* Filter, Search, and Category Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="گەڕان بەپێی ناو، ژمارە، بەستەر یان کاتیگۆری..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:bg-white/10 focus:border-emerald-400 outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)] border border-emerald-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Floating Ribbon (When rows are checked) */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-teal-950/90 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white text-xs">
              {selectedIds.size} کەناڵ دیاریکراوە بۆ کرداری بەکۆمەڵ (Bulk Action):
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleBulkVisibility(false)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>نیشاندان لە ئەپ (Show All)</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkVisibility(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer text-xs"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>شاردنەوە لە ئەپ (Hide All)</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>سڕینەوەی دیاریکراوەکان</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold transition-all cursor-pointer text-xs"
            >
              پەشیمانبوونەوە
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: GOOGLE SHEETS SPREADSHEET TABLE */}
      {viewMode === 'sheets' && (
        <div className="space-y-3">
          {/* Formula / Status Ribbon */}
          <div className="flex items-center justify-between bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                fx
              </span>
              <span>دەستکاری ڕاستەوخۆ بکە لە هەر خانەیەک (Cell)، خۆکارانە خەزن دەبێت</span>
            </div>
            <div className="flex items-center gap-2">
              {lastSavedId ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  ✓ گۆڕانکارییەکان پاشەکەوت کران
                </span>
              ) : (
                <span className="text-slate-500">
                  خەزنکردنی بەردەوام: کارایە ✓
                </span>
              )}
            </div>
          </div>

          {/* Spreadsheet Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 shadow-inner">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-950/40 border-b border-emerald-500/30 text-slate-300 font-mono text-[11px]">
                  <th className="p-2.5 text-center w-10 border-e border-white/10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      title="دیاریکردنی هەمووی ئەم پەڕەیە"
                    >
                      {selectedIds.size === paginatedChannels.length && paginatedChannels.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-2.5 text-center w-12 border-e border-white/10 text-emerald-400 font-bold">A: #</th>
                  <th className="p-2.5 text-center w-36 border-e border-white/10 text-emerald-300 font-bold">B: دیارە لە ئەپ؟</th>
                  <th className="p-2.5 text-center w-14 border-e border-white/10 text-emerald-300">C: لۆگۆ</th>
                  <th className="p-2.5 text-start min-w-[170px] border-e border-white/10 text-emerald-300 font-bold">D: ناوی کوردی (Kurdish)</th>
                  <th className="p-2.5 text-start min-w-[150px] border-e border-white/10 text-emerald-300">E: ناوی عەرەبی (Arabic)</th>
                  <th className="p-2.5 text-start min-w-[150px] border-e border-white/10 text-emerald-300">F: ناوی ئینگلیزی (English)</th>
                  <th className="p-2.5 text-start min-w-[140px] border-e border-white/10 text-emerald-300 font-bold">G: بەش (Category)</th>
                  <th className="p-2.5 text-start min-w-[110px] border-e border-white/10 text-emerald-300">H: کوالێتی</th>
                  <th className="p-2.5 text-start min-w-[200px] border-e border-white/10 text-emerald-300 font-mono">I: بەستەری ستریم (URL)</th>
                  <th className="p-2.5 text-center w-24 border-e border-white/10 text-emerald-300">J: قفڵ/دڵخواز</th>
                  <th className="p-2.5 text-center w-20 text-emerald-300">K: کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {paginatedChannels.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-12 text-slate-400 text-xs">
                      هیچ کەناڵێک بەپێی ئەم فلتەرە نەدۆزرایەوە.
                    </td>
                  </tr>
                ) : (
                  paginatedChannels.map((ch, idx) => {
                    const isSelected = selectedIds.has(ch.id);
                    const isJustSaved = lastSavedId === ch.id;
                    const rowIndex = (currentPage - 1) * pageSize + idx + 1;
                    const isHidden = Boolean(ch.isHidden);

                    return (
                      <tr
                        key={ch.id}
                        className={`transition-colors group ${
                          isSelected 
                            ? 'bg-emerald-950/30' 
                            : isHidden 
                              ? 'bg-rose-950/15 opacity-75 hover:opacity-100 hover:bg-rose-950/25' 
                              : 'hover:bg-white/[0.04]'
                        } ${isJustSaved ? 'bg-emerald-500/15' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="p-2 text-center border-e border-white/5">
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(ch.id)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Row Index */}
                        <td className="p-2 text-center font-mono text-slate-500 border-e border-white/5 font-bold">
                          {rowIndex}
                        </td>

                        {/* Visibility Toggle Button (Show/Hide in App) */}
                        <td className="p-2 text-center border-e border-white/5">
                          <button
                            type="button"
                            onClick={() => toggleChannelVisibility(ch.id)}
                            className={`w-full py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[11px] border ${
                              isHidden
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            }`}
                            title={isHidden ? 'کلیک بکە بۆ نیشاندانی کەناڵ لە ئەپەکە' : 'کلیک بکە بۆ شاردنەوەی کەناڵ لە ئەپەکە'}
                          >
                            {isHidden ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                                <span>شاراوەیە ✗</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                <span>دیارە لە ئەپ ✓</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Logo Thumbnail */}
                        <td className="p-1.5 text-center border-e border-white/5">
                          <div className="relative group/logo inline-block">
                            <img
                              src={ch.logo}
                              alt={ch.name}
                              onError={(e) => { e.target.src = ch.fallbackLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + ch.name; }}
                              className="w-7 h-7 rounded-lg object-contain bg-slate-900 p-0.5 border border-white/10 mx-auto"
                            />
                          </div>
                        </td>

                        {/* Kurdish Name (Inline Input) */}
                        <td className="p-1.5 border-e border-white/5">
                          <input
                            type="text"
                            value={ch.nameKu ?? ch.name ?? ''}
                            onChange={(e) => handleInlineFieldChange(ch.id, 'nameKu', e.target.value)}
                            placeholder="ناوی کوردی"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-white/5 focus:bg-slate-950 focus:ring-1 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 text-white font-bold outline-none text-xs"
                          />
                        </td>

                        {/* Arabic Name (Inline Input) */}
                        <td className="p-1.5 border-e border-white/5">
                          <input
                            type="text"
                            value={ch.nameAr ?? ''}
                            onChange={(e) => handleInlineFieldChange(ch.id, 'nameAr', e.target.value)}
                            placeholder="الاسم بالعربية"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-white/5 focus:bg-slate-950 focus:ring-1 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 text-slate-200 outline-none text-xs"
                          />
                        </td>

                        {/* English Name (Inline Input) */}
                        <td className="p-1.5 border-e border-white/5">
                          <input
                            type="text"
                            value={ch.nameEn ?? ''}
                            onChange={(e) => handleInlineFieldChange(ch.id, 'nameEn', e.target.value)}
                            placeholder="English Name"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-white/5 focus:bg-slate-950 focus:ring-1 focus:ring-emerald-400 border border-transparent focus:border-emerald-400 text-slate-200 font-mono outline-none text-xs"
                          />
                        </td>

                        {/* Category (Inline Select) */}
                        <td className="p-1.5 border-e border-white/5">
                          <select
                            value={ch.category || 'کەناڵەکانی تر'}
                            onChange={(e) => handleInlineFieldChange(ch.id, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-slate-200 focus:border-emerald-400 outline-none text-xs cursor-pointer"
                          >
                            {categories.filter(c => c !== 'هەموو').map(cat => (
                              <option key={cat} value={cat} className="bg-slate-900 text-white">
                                {cat}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Quality (Inline Select) */}
                        <td className="p-1.5 border-e border-white/5">
                          <select
                            value={ch.quality || '1080p HD'}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleInlineFieldChange(ch.id, 'quality', val);
                              if (val.includes('4K')) handleInlineFieldChange(ch.id, 'is4K', true);
                              else handleInlineFieldChange(ch.id, 'is4K', false);
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-cyan-300 font-mono focus:border-emerald-400 outline-none text-xs cursor-pointer"
                          >
                            <option value="4K Ultra HD" className="bg-slate-900 text-white">4K UHD</option>
                            <option value="1080p HD" className="bg-slate-900 text-white">1080p HD</option>
                            <option value="720p HD" className="bg-slate-900 text-white">720p HD</option>
                            <option value="SD 576p" className="bg-slate-900 text-white">SD</option>
                          </select>
                        </td>

                        {/* Stream URL (Inline Input + Copy) */}
                        <td className="p-1.5 border-e border-white/5">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={ch.url || ''}
                              onChange={(e) => handleInlineFieldChange(ch.id, 'url', e.target.value)}
                              placeholder="http://..."
                              className="w-full px-2 py-1.5 rounded-lg bg-transparent hover:bg-white/5 focus:bg-slate-950 border border-transparent focus:border-emerald-400 text-slate-300 font-mono text-[11px] outline-none"
                              title={ch.url}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(ch.url || '');
                                onNotify?.({ title: 'کۆپی کرا', message: 'بەستەری ستریمەکە کۆپی کرا.', type: 'info' });
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="کۆپیکردنی بەستەر"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Lock / Favorite */}
                        <td className="p-1.5 text-center border-e border-white/5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleChannelLock(ch.id)}
                              className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                                ch.isLocked 
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                              }`}
                              title={ch.isLocked ? 'قفڵکراوە' : 'ئازادە'}
                            >
                              {ch.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleChannelFavorite(ch.id)}
                              className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                                ch.isFavorite 
                                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-300'
                              }`}
                              title="دڵخواز"
                            >
                              <Star className={`w-3 h-3 ${ch.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="p-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(ch)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 hover:text-cyan-300 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                              title="کردنەوەی تەواوی فۆرمی دەستکاری لەگەڵ EPG و لۆگۆ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChannel(ch.id, ch.name)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/10 transition-colors cursor-pointer"
                              title="سڕینەوە"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: STANDARD DETAILED TABLE */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
          <table className="w-full text-start">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-medium bg-white/[0.02]">
                <th className="py-2.5 px-3 text-start">#</th>
                <th className="py-2.5 px-2 text-start">لۆگۆ</th>
                <th className="py-2.5 px-3 text-start">ناوی کەناڵ (کلیک بکە بۆ ئیدیت)</th>
                <th className="py-2.5 px-3 text-start">بەش (Category)</th>
                <th className="py-2.5 px-2 text-start">کوالێتی</th>
                <th className="py-2.5 px-3 text-center">دۆخ لە ئەپ</th>
                <th className="py-2.5 px-2 text-start">بەرنامەی ئێستا (EPG)</th>
                <th className="py-2.5 px-3 text-end">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedChannels.map((ch, idx) => {
                const isHidden = Boolean(ch.isHidden);
                return (
                  <tr 
                    key={ch.id} 
                    onClick={() => openEditModal(ch)}
                    className={`transition-colors cursor-pointer group ${
                      isHidden ? 'bg-rose-950/10 opacity-70 hover:opacity-100' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-500 group-hover:text-cyan-400">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-2">
                      <img
                        src={ch.logo}
                        alt={ch.name}
                        onError={(e) => { e.target.src = ch.fallbackLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + ch.name; }}
                        className="w-8 h-8 rounded-lg object-contain bg-slate-900/80 p-0.5 border border-white/10 shadow-xs group-hover:scale-110 transition-transform"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                        <span className="text-white text-xs">{getLocalizedChannelName(ch, 'ku')}</span>
                        {ch.nameEn && ch.nameEn !== getLocalizedChannelName(ch, 'ku') && (
                          <span className="text-[10px] text-slate-400 font-normal font-mono">({ch.nameEn})</span>
                        )}
                        {ch.is4K && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.5)]">4K</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-amber-300/80">کورد: {getLocalizedChannelName(ch, 'ku')}</span>
                        <span>•</span>
                        <span className="text-emerald-300/80">عەر: {getLocalizedChannelName(ch, 'ar')}</span>
                        <span>•</span>
                        <span className="text-cyan-300/80 font-mono">EN: {getLocalizedChannelName(ch, 'en')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {ch.category}
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-cyan-300 font-semibold">
                      {ch.quality || '1080p'}
                    </td>
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleChannelVisibility(ch.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isHidden 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {isHidden ? 'شاراوە ✗' : 'دیارە ✓'}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-slate-300">
                      <div className="truncate max-w-[150px] font-medium" title={ch.epg?.currentShow}>
                        {ch.epg?.currentShow || 'پەخشی ڕاستەوخۆ'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(ch)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 hover:text-cyan-300 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                          title="دەستکاریکردن"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteChannel(ch.id, ch.name)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/10 transition-colors cursor-pointer"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination & Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
        <div className="text-slate-400 text-[11px]">
          نیشاندانی {filteredChannels.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} بۆ {Math.min(currentPage * pageSize, filteredChannels.length)} لە کۆی <span className="font-bold text-white font-mono">{filteredChannels.length}</span> کەناڵ
        </div>

        <div className="flex items-center gap-3">
          {/* Page size selector */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="px-2 text-slate-400">قەبارەی پەیج:</span>
            {[25, 50, 100, 9999].map(size => (
              <button
                key={size}
                type="button"
                onClick={() => { setPageSize(size); setCurrentPage(1); }}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  pageSize === size 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {size === 9999 ? 'هەمووی' : size}
              </button>
            ))}
          </div>

          {/* Page Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/10 text-white transition-all cursor-pointer"
                title="پەڕەی پێشوو"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 font-mono text-xs">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/10 text-white transition-all cursor-pointer"
                title="پەڕەی داهاتوو"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
