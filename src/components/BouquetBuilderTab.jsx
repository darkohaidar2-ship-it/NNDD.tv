import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Tv, 
  Film, 
  Layers, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Save, 
  Check, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  Sliders,
  Flame,
  Crown,
  Share2,
  Hash,
  Image as ImageIcon,
  Zap,
  Globe
} from 'lucide-react';
import { 
  fetchUpstreamLionOttCategories, 
  fetchUpstreamCategoryStreams,
  getCategoryOverrides, 
  saveCategoryOverride, 
  bulkSaveCategoryOverrides,
  getCustomCategories, 
  saveCustomCategory, 
  deleteCustomCategory,
  getChannelOverrides, 
  saveChannelOverride, 
  deleteChannelOverride,
  subscribeToBouquetsRealtime,
  processProcessedCategories,
  HARDCODED_UPSTREAM_SERVER,
  HARDCODED_TEST_USER,
  HARDCODED_TEST_PASS
} from '../data/bouquetService';

const ICON_OPTIONS = ['📺', '👑', '☀️', '⚽', '🎬', '🍿', '🌟', '💎', '🔥', '🚀', '🧒', '📰', '🎵'];

export default function BouquetBuilderTab({ onNotify, onSwitchToTv }) {
  // Navigation & Category Type: 'live' | 'movie' | 'series'
  const [categoryType, setCategoryType] = useState('live');
  const [activeSubTab, setActiveSubTab] = useState('upstream'); // 'upstream' | 'custom' | 'channel_overrides'

  // Data State
  const [upstreamCategories, setUpstreamCategories] = useState([]);
  const [categoryOverrides, setCategoryOverrides] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [channelOverrides, setChannelOverrides] = useState([]);

  // UI / Loading State
  const [isLoadingUpstream, setIsLoadingUpstream] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all' | 'visible' | 'hidden' | 'renamed'

  // Custom Category Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomCategory, setEditingCustomCategory] = useState(null);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatIcon, setCustomCatIcon] = useState('📺');
  const [customCatSortOrder, setCustomCatSortOrder] = useState(10);
  const [customCatStreamIds, setCustomCatStreamIds] = useState([]);

  // Channel Selector Modal / Search State for Virtual Bouquets
  const [isChannelPickerOpen, setIsChannelPickerOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerSelectedCategory, setPickerSelectedCategory] = useState('');
  const [availableStreams, setAvailableStreams] = useState([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);

  // Channel Overrides Modal State
  const [isChannelOverrideModalOpen, setIsChannelOverrideModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [channelCustomName, setChannelCustomName] = useState('');
  const [channelCustomLogo, setChannelCustomLogo] = useState('');
  const [channelIsHidden, setChannelIsHidden] = useState(false);

  // Load Data for active categoryType
  const loadBouquetData = async (type = categoryType) => {
    try {
      const [overrides, customCats, chanOvs] = await Promise.all([
        getCategoryOverrides(type),
        getCustomCategories(type),
        getChannelOverrides()
      ]);
      setCategoryOverrides(overrides);
      setCustomCategories(customCats);
      setChannelOverrides(chanOvs);
    } catch (err) {
      console.warn('[BouquetBuilder] Load data error:', err);
    }
  };

  useEffect(() => {
    loadBouquetData(categoryType);

    // Subscribe to realtime updates across admin sessions
    const unsub = subscribeToBouquetsRealtime(() => {
      loadBouquetData(categoryType);
    });

    return () => unsub();
  }, [categoryType]);

  // Fetch Categories from Upstream LionOTT
  const handleFetchUpstream = async () => {
    setIsLoadingUpstream(true);
    try {
      const raw = await fetchUpstreamLionOttCategories(categoryType);
      setUpstreamCategories(raw);

      onNotify?.({
        title: 'بەشەکانی LionOTT هێنران ⚡',
        message: `${raw.length} بەشی ${categoryType === 'live' ? 'کەناڵەکان' : categoryType === 'movie' ? 'فیلمەکان' : 'زنجیرەکان'} بە سەرکەوتوویی لە سێرڤەر وەرگیران.`,
        type: 'success'
      });
    } catch (err) {
      onNotify?.({
        title: 'هەڵە لە هێنانی بەشەکان',
        message: err.message,
        type: 'danger'
      });
    } finally {
      setIsLoadingUpstream(false);
    }
  };

  // Auto-fetch upstream on first mount if empty
  useEffect(() => {
    if (upstreamCategories.length === 0) {
      handleFetchUpstream();
    }
  }, [categoryType]);

  // Map of overrides by upstream_category_id for fast lookup
  const overrideMap = useMemo(() => {
    const map = new Map();
    categoryOverrides.forEach(o => {
      map.set(String(o.upstream_category_id), o);
    });
    return map;
  }, [categoryOverrides]);

  // Computed Combined List for Display
  const processedCategoryList = useMemo(() => {
    return upstreamCategories.map(cat => {
      const ov = overrideMap.get(String(cat.category_id));
      return {
        category_id: String(cat.category_id),
        original_name: cat.category_name,
        custom_name: ov?.custom_name !== undefined ? ov.custom_name : '',
        display_name: (ov && ov.custom_name && ov.custom_name.trim()) ? ov.custom_name.trim() : cat.category_name,
        is_visible: ov ? ov.is_visible !== false : true,
        sort_order: ov?.sort_order !== undefined ? ov.sort_order : 100,
        has_override: !!ov
      };
    });
  }, [upstreamCategories, overrideMap]);

  // Filtered List based on search and visibility
  const filteredCategoryList = useMemo(() => {
    let list = processedCategoryList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.original_name.toLowerCase().includes(q) || 
        c.custom_name.toLowerCase().includes(q) ||
        c.category_id.includes(q)
      );
    }

    if (visibilityFilter === 'visible') {
      list = list.filter(c => c.is_visible);
    } else if (visibilityFilter === 'hidden') {
      list = list.filter(c => !c.is_visible);
    } else if (visibilityFilter === 'renamed') {
      list = list.filter(c => c.custom_name && c.custom_name.trim() !== '');
    }

    // Sort: sort_order ASC, then alphabetical
    return [...list].sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.display_name.localeCompare(b.display_name);
    });
  }, [processedCategoryList, searchQuery, visibilityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = processedCategoryList.length;
    const visible = processedCategoryList.filter(c => c.is_visible).length;
    const hidden = total - visible;
    const renamed = processedCategoryList.filter(c => c.custom_name && c.custom_name.trim() !== '').length;
    const customCount = customCategories.length;
    return { total, visible, hidden, renamed, customCount };
  }, [processedCategoryList, customCategories]);

  // Toggle Visibility for a single category
  const handleToggleVisibility = async (cat) => {
    const nextVisible = !cat.is_visible;
    const updated = await saveCategoryOverride({
      category_type: categoryType,
      upstream_category_id: cat.category_id,
      original_name: cat.original_name,
      custom_name: cat.custom_name,
      is_visible: nextVisible,
      sort_order: cat.sort_order
    });

    setCategoryOverrides(prev => {
      const filtered = prev.filter(o => String(o.upstream_category_id) !== String(cat.category_id));
      return [...filtered, updated];
    });

    onNotify?.({
      title: nextVisible ? 'بەشەکە چالاککرا 👁️' : 'بەشەکە شاردرایەوە 🚫',
      message: `بەشی "${cat.display_name}" لە ئەپی بەکارهێنەران ${nextVisible ? 'نیشان دەدرێت' : 'شاردرایەوە'}.`,
      type: nextVisible ? 'success' : 'info'
    });
  };

  // Change Custom Name
  const handleUpdateCustomName = async (cat, newName) => {
    const updated = await saveCategoryOverride({
      category_type: categoryType,
      upstream_category_id: cat.category_id,
      original_name: cat.original_name,
      custom_name: newName,
      is_visible: cat.is_visible,
      sort_order: cat.sort_order
    });

    setCategoryOverrides(prev => {
      const filtered = prev.filter(o => String(o.upstream_category_id) !== String(cat.category_id));
      return [...filtered, updated];
    });
  };

  // Change Sort Order
  const handleUpdateSortOrder = async (cat, newSort) => {
    const parsed = parseInt(newSort, 10);
    const validSort = isNaN(parsed) ? 100 : Math.max(0, parsed);

    const updated = await saveCategoryOverride({
      category_type: categoryType,
      upstream_category_id: cat.category_id,
      original_name: cat.original_name,
      custom_name: cat.custom_name,
      is_visible: cat.is_visible,
      sort_order: validSort
    });

    setCategoryOverrides(prev => {
      const filtered = prev.filter(o => String(o.upstream_category_id) !== String(cat.category_id));
      return [...filtered, updated];
    });
  };

  // 1-Click Smart Presets
  const handlePresetKurdishTop = async () => {
    setIsSaving(true);
    const kurdishItems = processedCategoryList.filter(c => /kurd|کورد/i.test(c.original_name));
    if (kurdishItems.length === 0) {
      onNotify?.({ title: 'ئاگاداری', message: 'هیچ بەشێکی کوردی لەم بەشە نەدۆزرایەوە.', type: 'info' });
      setIsSaving(false);
      return;
    }

    const updates = kurdishItems.map((c, i) => ({
      category_type: categoryType,
      upstream_category_id: c.category_id,
      original_name: c.original_name,
      custom_name: c.custom_name || 'کەناڵە کوردییەکان (Kurdish)',
      is_visible: true,
      sort_order: i + 1
    }));

    await bulkSaveCategoryOverrides(updates, categoryType);
    await loadBouquetData(categoryType);
    setIsSaving(false);

    onNotify?.({
      title: 'کەناڵە کوردییەکان خرانە سەرەتا ☀️',
      message: `${updates.length} بەشی کوردی بە ڕیزبەندی سەرەتا دیاریکران.`,
      type: 'success'
    });
  };

  const handlePresetSportsTop = async () => {
    setIsSaving(true);
    const sportsItems = processedCategoryList.filter(c => /bein|sport|dazn|وەرزش/i.test(c.original_name));
    
    let orderIndex = 5;
    const updates = sportsItems.map(c => {
      let custom = c.custom_name;
      if (!custom) {
        if (/bein.*afc/i.test(c.original_name)) custom = 'بین سپۆرت ئاسیا (beIN AFC)';
        else if (/bein.*8k/i.test(c.original_name)) custom = 'بین سپۆرت 8K';
        else if (/bein/i.test(c.original_name)) custom = 'بین سپۆرت (beIN Sports)';
        else if (/dazn/i.test(c.original_name)) custom = 'دازن و بۆکسینگ (DAZN)';
      }
      return {
        category_type: categoryType,
        upstream_category_id: c.category_id,
        original_name: c.original_name,
        custom_name: custom || c.original_name,
        is_visible: true,
        sort_order: orderIndex++
      };
    });

    await bulkSaveCategoryOverrides(updates, categoryType);
    await loadBouquetData(categoryType);
    setIsSaving(false);

    onNotify?.({
      title: 'بەشە وەرزشییەکان ڕێکخران ⚽',
      message: `${updates.length} بەشی وەرزشی بە ڕیزبەندی لەپێشینە جێگیرکران.`,
      type: 'success'
    });
  };

  const handlePresetHideForeign = async () => {
    setIsSaving(true);
    // Keep Kurdish, Sports, Kids visible; hide foreign/others
    const updates = processedCategoryList.map(c => {
      const isImportant = /kurd|کورد|bein|sport|dazn|kids|منداڵ|cinema|movie|vip/i.test(c.original_name);
      return {
        category_type: categoryType,
        upstream_category_id: c.category_id,
        original_name: c.original_name,
        custom_name: c.custom_name,
        is_visible: isImportant,
        sort_order: c.sort_order
      };
    });

    await bulkSaveCategoryOverrides(updates, categoryType);
    await loadBouquetData(categoryType);
    setIsSaving(false);

    onNotify?.({
      title: 'بەشە بیانییەکان شاردرانەوە 🚫',
      message: 'تەنها بەشە کوردی، وەرزشی و تایبەتەکان بۆ بەکارهێنەران دەمێننەوە.',
      type: 'success'
    });
  };

  const handlePresetShowAll = async () => {
    setIsSaving(true);
    const updates = processedCategoryList.map(c => ({
      category_type: categoryType,
      upstream_category_id: c.category_id,
      original_name: c.original_name,
      custom_name: c.custom_name,
      is_visible: true,
      sort_order: c.sort_order
    }));

    await bulkSaveCategoryOverrides(updates, categoryType);
    await loadBouquetData(categoryType);
    setIsSaving(false);

    onNotify?.({
      title: 'هەموو بەشەکان نیشان دەدرێن 👁️',
      message: 'سەرجەم بەشەکانی سێرڤەر بە کراوەیی ماونەتەوە.',
      type: 'info'
    });
  };

  // Open Channel Selector for Virtual Bouquet
  const handleOpenChannelPicker = async () => {
    setIsChannelPickerOpen(true);
    setIsLoadingStreams(true);
    try {
      // Default to Kurdish category or first visible category
      const kurdCat = upstreamCategories.find(c => /kurd|کورد/i.test(c.category_name)) || upstreamCategories[0];
      const targetCatId = pickerSelectedCategory || kurdCat?.category_id;
      setPickerSelectedCategory(targetCatId);

      const streams = await fetchUpstreamCategoryStreams(categoryType, targetCatId);
      setAvailableStreams(streams);
    } catch (e) {
      console.warn('[ChannelPicker Error]:', e);
    } finally {
      setIsLoadingStreams(false);
    }
  };

  const handleCategoryChangeInPicker = async (newCatId) => {
    setPickerSelectedCategory(newCatId);
    setIsLoadingStreams(true);
    try {
      const streams = await fetchUpstreamCategoryStreams(categoryType, newCatId);
      setAvailableStreams(streams);
    } catch (e) {
      console.warn('[ChannelPicker Error]:', e);
    } finally {
      setIsLoadingStreams(false);
    }
  };

  const toggleStreamInCustomBouquet = (streamId) => {
    const sId = parseInt(streamId, 10) || streamId;
    setCustomCatStreamIds(prev => {
      const exists = prev.some(id => String(id) === String(sId));
      if (exists) {
        return prev.filter(id => String(id) !== String(sId));
      } else {
        return [...prev, sId];
      }
    });
  };

  // Save Custom Category (Virtual Bouquet)
  const handleSaveCustomCategory = async () => {
    if (!customCatName.trim()) {
      onNotify?.({ title: 'هەڵە', message: 'تکایە ناوی بەشە تایبەتەکە بنووسە.', type: 'danger' });
      return;
    }

    try {
      const bouquet = {
        id: editingCustomCategory?.id,
        category_type: categoryType,
        name: customCatName.trim(),
        icon: customCatIcon,
        is_visible: true,
        sort_order: parseInt(customCatSortOrder, 10) || 10,
        stream_ids: customCatStreamIds
      };

      await saveCustomCategory(bouquet);
      await loadBouquetData(categoryType);
      setIsCustomModalOpen(false);
      setEditingCustomCategory(null);
      setCustomCatName('');
      setCustomCatStreamIds([]);

      onNotify?.({
        title: 'بەشی تایبەت دروستکرا/نوێکرایەوە 👑',
        message: `بووکێی "${bouquet.name}" لەگەڵ ${bouquet.stream_ids.length} کەناڵ بە سەرکەوتوویی پاشەکەوتکرا.`,
        type: 'success'
      });
    } catch (err) {
      onNotify?.({ title: 'هەڵە', message: err.message, type: 'danger' });
    }
  };

  const handleDeleteCustomBouquet = async (id, name) => {
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی بووکێی "${name}"؟`)) return;
    try {
      await deleteCustomCategory(id, categoryType);
      await loadBouquetData(categoryType);
      onNotify?.({ title: 'بووکێ سڕایەوە', message: `بووکێی "${name}" سڕایەوە.`, type: 'info' });
    } catch (e) {
      onNotify?.({ title: 'هەڵە', message: e.message, type: 'danger' });
    }
  };

  // Channel Overrides Save
  const handleSaveChannelOverride = async () => {
    if (!editingChannel) return;
    try {
      await saveChannelOverride({
        stream_id: editingChannel.stream_id,
        original_name: editingChannel.name || '',
        custom_name: channelCustomName.trim(),
        custom_logo: channelCustomLogo.trim(),
        is_hidden: channelIsHidden
      });

      const chanOvs = await getChannelOverrides();
      setChannelOverrides(chanOvs);
      setIsChannelOverrideModalOpen(false);
      setEditingChannel(null);

      onNotify?.({
        title: 'دەستکاری کەناڵ پاشەکەوتکرا 📺',
        message: `گۆڕانکارییەکانی کەناڵی "${editingChannel.name}" لە سیستەم جێگیرکران.`,
        type: 'success'
      });
    } catch (e) {
      onNotify?.({ title: 'هەڵە', message: e.message, type: 'danger' });
    }
  };

  return (
    <div className="space-y-6 text-white animate-fade-in font-sans" dir="rtl">
      {/* ----------------------------------------------------------------- */}
      {/* HEADER & TOP STATS BAR                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-red-500/30 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-amber-600 to-amber-500 p-0.5 shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Layers className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-red-300">
                  بەڕێوەبەری بەشەکان و بووکێ (Bouquet Builder)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                فلتەرکردن و شاردنەوەی بەشە بێگانەکان، ناونانی کوردی، ڕیزبەندی کەناڵەکان و دروستکردنی بووکێی VIP
              </p>
            </div>
          </div>

          {/* Upstream Fetch Action Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleFetchUpstream}
              disabled={isLoadingUpstream}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUpstream ? 'animate-spin' : ''}`} />
              <span>{isLoadingUpstream ? 'هاوردەکردن لە سێرڤەر...' : 'هێنانی بەشەکان لە سێرڤەری LionOTT'}</span>
            </button>

            <button
              onClick={() => {
                setEditingCustomCategory(null);
                setCustomCatName('');
                setCustomCatIcon('👑');
                setCustomCatSortOrder(0);
                setCustomCatStreamIds([]);
                setIsCustomModalOpen(true);
              }}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ دروستکردنی بەشی تایبەت (VIP)</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">سەرجەم بەشەکان</div>
              <div className="text-xl font-black text-white font-mono">{stats.total}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-emerald-300">بەشە کراوەکان</div>
              <div className="text-xl font-black text-emerald-400 font-mono">{stats.visible}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-red-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-red-300">بەشە شاردراوەکان</div>
              <div className="text-xl font-black text-red-400 font-mono">{stats.hidden}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-amber-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-amber-300">ناوی کوردی/گۆڕدراو</div>
              <div className="text-xl font-black text-amber-400 font-mono">{stats.renamed}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-purple-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-purple-300">بووکێی تایبەت (VIP)</div>
              <div className="text-xl font-black text-purple-400 font-mono">{stats.customCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* NAVIGATION PILLS: Category Type & Sub-tabs                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Stream Type: Live TV / Movies / Series */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setCategoryType('live')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              categoryType === 'live'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>📺 کەناڵە ڕاستەوخۆکان (Live TV)</span>
          </button>

          <button
            onClick={() => setCategoryType('movie')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              categoryType === 'movie'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 فیلمەکان (VOD Movies)</span>
          </button>

          <button
            onClick={() => setCategoryType('series')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              categoryType === 'series'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🍿 زنجیرەکان (Series)</span>
          </button>
        </div>

        {/* SubTab Switcher: Upstream Categories / Custom Bouquets / Channel Overrides */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setActiveSubTab('upstream')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'upstream'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>بەشەکانی سێرڤەر ({filteredCategoryList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('custom')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'custom'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>بووکێی تایبەت ({customCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('channel_overrides')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'channel_overrides'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>دەستکاری کەناڵ و لۆگۆ ({channelOverrides.length})</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SUBTAB 1: UPSTREAM CATEGORIES FILTERING & SORTING                 */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'upstream' && (
        <div className="space-y-4">
          {/* Quick Filter & 1-Click Presets Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="گەڕان بەدوای ناوی بەش یان کۆد..."
                className="w-full pl-3 pr-10 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Visibility Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'هەموو' },
                { id: 'visible', label: 'کراوەکان' },
                { id: 'hidden', label: 'شاردراوەکان' },
                { id: 'renamed', label: 'دەستکاریکراوەکان' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setVisibilityFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    visibilityFilter === f.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 1-Click Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePresetKurdishTop}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="کەناڵە کوردییەکان بخە پلەی ١ و بە ناوی کوردی بنووسە"
              >
                <span>☀️ کوردی بخە سەرەتا</span>
              </button>

              <button
                onClick={handlePresetSportsTop}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="کەناڵە وەرزشییەکان بخە پێشەنگ"
              >
                <span>⚽ وەرزش بخە سەرەتا</span>
              </button>

              <button
                onClick={handlePresetHideForeign}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="شاردنەوەی سەرجەم بەشە ناپێویستە بیانییەکان"
              >
                <span>🚫 شاردنەوەی بێگانەکان</span>
              </button>

              <button
                onClick={handlePresetShowAll}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>👁️ هەمووی نیشان بدە</span>
              </button>
            </div>
          </div>

          {/* Categories Table */}
          <div className="rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs font-bold text-slate-400">
              <div className="flex items-center gap-4">
                <span className="w-12 text-center">ڕیزبەندی</span>
                <span className="w-16 text-center">دۆخ</span>
                <span>ناوی بەش لە سێرڤەر</span>
              </div>
              <div className="flex items-center gap-8 pl-4">
                <span>ناوی کوردی دەستکاریکراو</span>
                <span>کردارەکان</span>
              </div>
            </div>

            <div className="divide-y divide-white/5 max-h-[650px] overflow-y-auto">
              {filteredCategoryList.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Layers className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm font-bold">هیچ بەشێک نەدۆزرایەوە.</p>
                  <p className="text-xs text-slate-500 mt-1">تکایە دڵنیابە لە پەیوەستبوون بە سێرڤەری LionOTT یان فلتەرەکان پاک بکەوە.</p>
                </div>
              ) : (
                filteredCategoryList.map((cat) => (
                  <div
                    key={cat.category_id}
                    className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/[0.03] ${
                      !cat.is_visible ? 'opacity-40 bg-red-950/10' : ''
                    }`}
                  >
                    {/* Left details: Sort Order, Visibility Toggle, Original Name */}
                    <div className="flex items-center gap-3">
                      {/* Sort Order Input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={cat.sort_order}
                          onChange={(e) => handleUpdateSortOrder(cat, e.target.value)}
                          className="w-12 py-1 px-1.5 text-center bg-slate-950 border border-white/10 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Visibility Toggle Switch */}
                      <button
                        onClick={() => handleToggleVisibility(cat)}
                        className={`w-14 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          cat.is_visible
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                        title={cat.is_visible ? 'کلیک بکە بۆ شاردنەوە' : 'کلیک بکە بۆ نیشاندان'}
                      >
                        {cat.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{cat.is_visible ? 'دیار' : 'شاراوە'}</span>
                      </button>

                      {/* Original Name & ID */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300">
                          #{cat.category_id}
                        </span>
                        <span className="text-xs font-bold text-slate-200" dir="ltr">
                          {cat.original_name}
                        </span>
                      </div>
                    </div>

                    {/* Right: Inline Custom Name Edit */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={cat.custom_name}
                          onChange={(e) => handleUpdateCustomName(cat, e.target.value)}
                          placeholder="ناوی کوردی (بۆ نمونە: کەناڵە کوردییەکان)"
                          className="w-64 md:w-80 py-1.5 px-3 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                        {cat.custom_name && (
                          <button
                            onClick={() => handleUpdateCustomName(cat, '')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            title="سڕینەوەی ناوی دەستکاریکراو"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Quick Pin to Top Button */}
                      <button
                        onClick={() => handleUpdateSortOrder(cat, 1)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-all cursor-pointer"
                        title="بخە پلەی یەکەم (Sort 1)"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SUBTAB 2: CUSTOM VIRTUAL BOUQUETS                                */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'custom' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>بەشە تایبەتە دروستکراوەکان (Virtual Bouquets)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                لێرەدا دەتوانیت بەشی تایبەتی نوێ دروست بکەیت و کەناڵی دڵخوازی پێ ببەستیتەوە.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCustomCategory(null);
                setCustomCatName('');
                setCustomCatIcon('👑');
                setCustomCatSortOrder(0);
                setCustomCatStreamIds([]);
                setIsCustomModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ دروستکردنی بەشی تایبەت</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCategories.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400 rounded-3xl bg-slate-900/50 border border-white/10">
                <Crown className="w-12 h-12 mx-auto text-amber-500/50 mb-3" />
                <p className="text-sm font-bold">هیچ بەشێکی تایبەت دروست نەکراوە.</p>
                <p className="text-xs text-slate-500 mt-1">کلیک لەسەر دوگمەی سەرەوە بکە بۆ دروستکردنی یەکەم بووکێی VIP.</p>
              </div>
            ) : (
              customCategories.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-xl hover:border-amber-400/60 transition-all shadow-xl relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        {b.icon || '📺'}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">{b.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-amber-300">
                            ڕیزبەندی: #{b.sort_order}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                            {(b.stream_ids || []).length} کەناڵ
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCustomCategory(b);
                          setCustomCatName(b.name);
                          setCustomCatIcon(b.icon || '📺');
                          setCustomCatSortOrder(b.sort_order || 0);
                          setCustomCatStreamIds(b.stream_ids || []);
                          setIsCustomModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="دەستکاری"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomBouquet(b.id, b.name)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                        title="سڕینەوە"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Channel stream IDs preview */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span>کەناڵە دیاریکراوەکان:</span>
                    <span className="font-mono text-amber-300">
                      {(b.stream_ids || []).length > 0 ? `${(b.stream_ids || []).slice(0, 3).join(', ')}${(b.stream_ids || []).length > 3 ? '...' : ''}` : 'هیچ'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SUBTAB 3: CHANNEL OVERRIDES (RENAME & LOGO REPLACEMENT)          */}
      {/* ----------------------------------------------------------------- */}
      {activeSubTab === 'channel_overrides' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>دەستکاری کەناڵ و گۆڕینی لۆگۆ (Channel Overrides)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                گۆڕینی ناوی کەناڵی دیاریکراو یان دانانی بەستەری لۆگۆی تایبەت
              </p>
            </div>

            <button
              onClick={() => {
                setEditingChannel({ stream_id: '', name: '' });
                setChannelCustomName('');
                setChannelCustomLogo('');
                setChannelIsHidden(false);
                setIsChannelOverrideModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ زیادکردنی دەستکاری کەناڵ</span>
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs font-bold text-slate-400">
              <div className="flex items-center gap-4">
                <span className="w-20 text-center">Stream ID</span>
                <span>ناوی کەناڵ لە سێرڤەر</span>
              </div>
              <div className="flex items-center gap-8 pl-4">
                <span>ناوی نوێ و لۆگۆ</span>
                <span>کردار</span>
              </div>
            </div>

            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {channelOverrides.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Sliders className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm font-bold">هیچ دەستکارییەکی کەناڵ تۆمار نەکراوە.</p>
                </div>
              ) : (
                channelOverrides.map((ov) => (
                  <div key={ov.stream_id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        #{ov.stream_id}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{ov.original_name || 'کەناڵی سێرڤەر'}</div>
                        {ov.is_hidden && (
                          <span className="text-[10px] text-red-400 font-bold">🚫 شاردراوەتەوە لە پلەیەر</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {ov.custom_logo && (
                        <img 
                          src={ov.custom_logo} 
                          alt="logo" 
                          className="w-7 h-7 object-contain rounded bg-black/40 p-0.5 border border-white/10" 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        {ov.custom_name || '(ناوی نەگۆڕدراوە)'}
                      </span>

                      <button
                        onClick={async () => {
                          await deleteChannelOverride(ov.stream_id);
                          const chanOvs = await getChannelOverrides();
                          setChannelOverrides(chanOvs);
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                        title="سڕینەوە"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT CUSTOM CATEGORY (VIRTUAL BOUQUET)           */}
      {/* ----------------------------------------------------------------- */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  {editingCustomCategory ? 'دەستکاری بووکێی تایبەت' : 'دروستکردنی بووکێی تایبەتی نوێ'}
                </h3>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">ناوی بووکێ (بۆ نموونە: DABIN VIP 👑)</label>
                <input
                  type="text"
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  placeholder="ناوی بەشەکە..."
                  className="w-full py-2.5 px-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">ئایکۆنی بەشەکە</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setCustomCatIcon(icon)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center cursor-pointer transition-all ${
                        customCatIcon === icon
                          ? 'bg-amber-500/30 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)] scale-110'
                          : 'bg-slate-950 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">ڕیزبەندی لە لیست (Sort Order - سفر واتە سەرەتا)</label>
                <input
                  type="number"
                  value={customCatSortOrder}
                  onChange={(e) => setCustomCatSortOrder(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Assigned Stream IDs & Channel Picker Trigger */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    کەناڵە بەستراوەکان ({customCatStreamIds.length} کەناڵ)
                  </label>
                  <button
                    onClick={handleOpenChannelPicker}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>دیاریکردن و زیادکردنی کەناڵ لە سێرڤەر</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-white/10 min-h-[60px] max-h-[140px] overflow-y-auto flex items-center gap-2 flex-wrap">
                  {customCatStreamIds.length === 0 ? (
                    <span className="text-xs text-slate-500">هیچ کەناڵێک دیاری نەکراوە. کلیک لە دوگمەی سەرەوە بکە.</span>
                  ) : (
                    customCatStreamIds.map(sId => (
                      <span
                        key={sId}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono flex items-center gap-1.5"
                      >
                        <span>#{sId}</span>
                        <button
                          onClick={() => toggleStreamInCustomBouquet(sId)}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={handleSaveCustomCategory}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer shadow-lg"
              >
                پاشەکەوتکردنی بووکێ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: CHANNEL PICKER FOR VIRTUAL BOUQUETS                       */}
      {/* ----------------------------------------------------------------- */}
      {isChannelPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Tv className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  دیاریکردنی کەناڵەکان بۆ بووکێ ({customCatStreamIds.length} کەناڵ دیاریکراوە)
                </h3>
              </div>
              <button
                onClick={() => setIsChannelPickerOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Category selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">بەشی سێرڤەر</label>
                <select
                  value={pickerSelectedCategory}
                  onChange={(e) => handleCategoryChangeInPicker(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {upstreamCategories.map(c => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name} (#{c.category_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search in streams */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">گەڕان لە کەناڵەکان</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pickerSearchQuery}
                    onChange={(e) => setPickerSearchQuery(e.target.value)}
                    placeholder="ناوی کەناڵ..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Streams List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 border border-white/10 rounded-2xl bg-slate-950 p-2 min-h-[300px]">
              {isLoadingStreams ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
                  <p className="text-xs">هاوردەکردنی کەناڵەکان لە سێرڤەر...</p>
                </div>
              ) : availableStreams.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  هیچ کەناڵێک لەم بەشەدا نییە.
                </div>
              ) : (
                availableStreams
                  .filter(s => !pickerSearchQuery.trim() || (s.name || '').toLowerCase().includes(pickerSearchQuery.toLowerCase()))
                  .map(stream => {
                    const isSelected = customCatStreamIds.some(id => String(id) === String(stream.stream_id));
                    return (
                      <div
                        key={stream.stream_id}
                        onClick={() => toggleStreamInCustomBouquet(stream.stream_id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {stream.stream_icon ? (
                            <img
                              src={stream.stream_icon}
                              alt=""
                              className="w-8 h-8 object-contain rounded bg-black/40 p-0.5 border border-white/10"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-[10px]">
                              📺
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-white">{stream.name}</div>
                            <span className="text-[10px] font-mono text-slate-500">ID: #{stream.stream_id}</span>
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'border-white/20'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-xs text-amber-300 font-bold">
                {customCatStreamIds.length} کەناڵ دیاریکراوە بۆ ئەم بووکێیە
              </span>
              <button
                onClick={() => setIsChannelPickerOpen(false)}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer"
              >
                تەواو و جێگیرکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: CHANNEL OVERRIDE (RENAME & LOGO)                          */}
      {/* ----------------------------------------------------------------- */}
      {isChannelOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>دەستکاری کەناڵ و بەستەری لۆگۆ</span>
              </h3>
              <button
                onClick={() => setIsChannelOverrideModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Stream ID (کۆدی کەناڵ لە سێرڤەر)</label>
                <input
                  type="text"
                  value={editingChannel?.stream_id || ''}
                  onChange={(e) => setEditingChannel(prev => ({ ...prev, stream_id: e.target.value }))}
                  placeholder="بۆ نموونە: 682184"
                  className="w-full py-2.5 px-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">ناوی نوێی کوردی</label>
                <input
                  type="text"
                  value={channelCustomName}
                  onChange={(e) => setChannelCustomName(e.target.value)}
                  placeholder="بۆ نموونە: ئەژین تیڤی HD"
                  className="w-full py-2.5 px-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">بەستەری لۆگۆی تایبەت (Custom Logo URL)</label>
                <input
                  type="text"
                  value={channelCustomLogo}
                  onChange={(e) => setChannelCustomLogo(e.target.value)}
                  placeholder="https://.../logo.png"
                  className="w-full py-2.5 px-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
                {channelCustomLogo && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">پێشبینین:</span>
                    <img 
                      src={channelCustomLogo} 
                      alt="preview" 
                      className="w-8 h-8 object-contain rounded bg-black/40 p-1 border border-white/10" 
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="hideChanCheck"
                  checked={channelIsHidden}
                  onChange={(e) => setChannelIsHidden(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-white/20"
                />
                <label htmlFor="hideChanCheck" className="text-xs font-bold text-red-300 cursor-pointer">
                  شاردنەوەی ئەم کەناڵە لە ناو ئەپی کڕیاران (Hide from Player)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsChannelOverrideModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={handleSaveChannelOverride}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer shadow-lg"
              >
                پاشەکەوتکردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
