import React, { useState, useMemo } from 'react';
import { 
  Film, 
  Tv, 
  Eye, 
  EyeOff, 
  Sliders, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  Plus, 
  Play, 
  Check, 
  Search, 
  Star, 
  RotateCcw, 
  Save, 
  Sparkles, 
  Layers,
  ChevronRight,
  Clock,
  Calendar,
  Filter
} from 'lucide-react';

export default function VodManagerTab({
  series = [],
  setSeries,
  movies = [],
  setMovies,
  onNotify
}) {
  const [activeSubTab, setActiveSubTab] = useState('series'); // 'series' | 'movies' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Display limits configuration (persisted in localStorage)
  const [vodConfig, setVodConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('nndd_vod_config');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      maxSeriesDisplay: 0, // 0 means ALL
      maxMoviesDisplay: 0, // 0 means ALL
      autoPlayTrailers: true,
      enableCinemaAmbientBackdrop: true,
      featuredSeriesId: null,
      featuredMovieId: null
    };
  });

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    rating: '9.0',
    year: '2026',
    poster: '',
    backdropUrl: '',
    duration: '',
    description: '',
    streamUrl: ''
  });

  // Preview Stream Player Modal State
  const [previewStreamUrl, setPreviewStreamUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // Save VOD Config to localStorage
  const updateVodConfig = (newConfig) => {
    setVodConfig(newConfig);
    try {
      localStorage.setItem('nndd_vod_config', JSON.stringify(newConfig));
    } catch(e) {}
    onNotify?.({
      title: 'ڕێکخستنەکان سەیڤ کران',
      message: 'شێوازی پیشاندانی زنجیرە و فیلمەکان لە ئەپەکەدا نوێکرایەوە.',
      type: 'success'
    });
  };

  // Toggle Visibility (Show/Hide) for a Series
  const toggleSeriesVisibility = (id) => {
    const updated = series.map(s => {
      if (s.id === id) {
        const isHidden = !s.isHidden;
        return { ...s, isHidden };
      }
      return s;
    });
    setSeries(updated);
    try {
      localStorage.setItem('nndd_cached_vod_series', JSON.stringify(updated));
    } catch(e) {}
    onNotify?.({
      title: 'دۆخی زنجیرە گۆڕدرا',
      message: 'دۆخی دیاربوون یان شاردنەوەی زنجیرەکە بە سەرکەوتوویی سەیڤکرا.',
      type: 'info'
    });
  };

  // Toggle Visibility for a Movie
  const toggleMovieVisibility = (id) => {
    const updated = movies.map(m => {
      if (m.id === id) {
        const isHidden = !m.isHidden;
        return { ...m, isHidden };
      }
      return m;
    });
    setMovies(updated);
    try {
      localStorage.setItem('nndd_cached_vod_movies', JSON.stringify(updated));
    } catch(e) {}
    onNotify?.({
      title: 'دۆخی فیلم گۆڕدرا',
      message: 'دۆخی دیاربوون یان شاردنەوەی فیلمەکە بە سەرکەوتوویی سەیڤکرا.',
      type: 'info'
    });
  };

  // Move Item Up in List
  const moveItem = (type, index, direction) => {
    const list = type === 'series' ? [...series] : [...movies];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    if (type === 'series') {
      setSeries(list);
      try { localStorage.setItem('nndd_cached_vod_series', JSON.stringify(list)); } catch(e) {}
    } else {
      setMovies(list);
      try { localStorage.setItem('nndd_cached_vod_movies', JSON.stringify(list)); } catch(e) {}
    }
  };

  // Open Edit Modal
  const startEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setEditForm({
      title: item.title || '',
      category: item.category || item.genre || '',
      rating: item.rating || '9.0',
      year: item.year || '2026',
      poster: item.poster || '',
      backdropUrl: item.backdropUrl || '',
      duration: item.duration || '',
      description: item.description || '',
      streamUrl: item.streamUrl || ''
    });
  };

  // Save Edit Form
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.type === 'series') {
      const updated = series.map(s => {
        if (s.id === editingItem.id) {
          return {
            ...s,
            title: editForm.title,
            category: editForm.category,
            rating: editForm.rating,
            year: editForm.year,
            poster: editForm.poster,
            backdropUrl: editForm.backdropUrl,
            description: editForm.description
          };
        }
        return s;
      });
      setSeries(updated);
      try { localStorage.setItem('nndd_cached_vod_series', JSON.stringify(updated)); } catch(e) {}
    } else {
      const updated = movies.map(m => {
        if (m.id === editingItem.id) {
          return {
            ...m,
            title: editForm.title,
            genre: editForm.category,
            rating: editForm.rating,
            year: editForm.year,
            duration: editForm.duration,
            poster: editForm.poster,
            backdropUrl: editForm.backdropUrl,
            description: editForm.description,
            streamUrl: editForm.streamUrl
          };
        }
        return m;
      });
      setMovies(updated);
      try { localStorage.setItem('nndd_cached_vod_movies', JSON.stringify(updated)); } catch(e) {}
    }

    setEditingItem(null);
    onNotify?.({
      title: 'زانیارییەکان سەیڤ کران',
      message: `گۆڕانکارییەکانی "${editForm.title}" بە سەرکەوتوویی جێبەجێکران.`,
      type: 'success'
    });
  };

  // Reset all to default server JSON
  const handleResetToServerOriginal = async () => {
    if (!window.confirm('دڵنیایت لە گەڕانەوە بۆ زانیارییە بنەڕەتییەکانی سێرڤەر؟ هەموو ڕێکخستنە دەستییەکان پاک دەبنەوە.')) return;
    try {
      const res = { ok: false };
      if (res.ok) {
        const data = await res.json();
        if (data.series) {
          setSeries(data.series);
          localStorage.setItem('nndd_cached_vod_series', JSON.stringify(data.series));
        }
        if (data.movies) {
          setMovies(data.movies);
          localStorage.setItem('nndd_cached_vod_movies', JSON.stringify(data.movies));
        }
        localStorage.removeItem('nndd_vod_config');
        setVodConfig({
          maxSeriesDisplay: 0,
          maxMoviesDisplay: 0,
          autoPlayTrailers: true,
          enableCinemaAmbientBackdrop: true,
          featuredSeriesId: null,
          featuredMovieId: null
        });
        onNotify?.({
          title: 'گەڕێنرایەوە',
          message: 'هەموو زنجیرە و فیلمەکان گەڕێنرانەوە بۆ زانیارییە سەرەکییەکانی سێرڤەر.',
          type: 'success'
        });
      }
    } catch(e) {
      alert('هەڵە لە گەڕاندنەوە: ' + e.message);
    }
  };

  // Filtered lists
  const filteredSeriesList = useMemo(() => {
    return series.filter(s => {
      const matchSearch = (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || (s.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [series, searchQuery, categoryFilter]);

  const filteredMoviesList = useMemo(() => {
    return movies.filter(m => {
      const matchSearch = (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.genre || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || (m.genre || '').toLowerCase().includes(categoryFilter.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [movies, searchQuery, categoryFilter]);

  const totalVisibleSeries = series.filter(s => !s.isHidden).length;
  const totalVisibleMovies = movies.filter(m => !m.isHidden).length;
  const totalEpisodesCount = series.reduce((sum, s) => sum + (s.episodes?.length || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner & Quick Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -end-10 -bottom-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -start-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs font-bold mb-3 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <Film className="w-3.5 h-3.5" />
              <span>NNDD VOD Studio • کۆنترۆڵی پێشکەوتووی زنجیرە و فیلمەکان</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              بەڕێوەبردنی زنجیرەکان و فیلمە سینەمایییەکان
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-light leading-relaxed">
              دیاریکردنی ژمارەی ئەو زنجیرە و فیلمانەی لە ئەپەکەدا دیار دەبن، ڕێکخستنی دەستکاری پۆستەر، دۆخی شاردنەوە و ئاشکراکردن، و تێستکردنی ستریمەکان.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetToServerOriginal}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="گەڕانەوە بۆ سێرڤەری سەرەکی"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>گەڕانەوە بۆ ڕەسەنی سێرڤەر</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-400 block">کۆی زنجیرەکان</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{series.length}</span>
              <span className="text-xs text-blue-400 font-bold font-mono">({totalVisibleSeries} دیارن)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-400 block">کۆی فیلمەکان</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{movies.length}</span>
              <span className="text-xs text-rose-400 font-bold font-mono">({totalVisibleMovies} دیارن)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-400 block">کۆی ئەڵقەکان (Episodes)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{totalEpisodesCount}</span>
              <span className="text-xs text-emerald-400 font-bold font-mono">ئامادەن</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] font-semibold text-slate-400 block">سنووری پیشاندان لە ئەپ</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-bold text-amber-300">
                {vodConfig.maxSeriesDisplay === 0 ? 'هەموو' : `${vodConfig.maxSeriesDisplay} زنجیرە`} / {vodConfig.maxMoviesDisplay === 0 ? 'هەموو' : `${vodConfig.maxMoviesDisplay} فیلم`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Bar (Series | Movies | Display Settings) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => { setActiveSubTab('series'); setCategoryFilter('all'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'series'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>بەڕێوەبردنی زنجیرەکان ({series.length})</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('movies'); setCategoryFilter('all'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'movies'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>بەڕێوەبردنی فیلمەکان ({movies.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>سنووردارکردن و شێوازی پیشاندان</span>
          </button>
        </div>

        {activeSubTab !== 'settings' && (
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="گەڕان بەدوای ناو یان ژانەر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-white/15 rounded-xl ps-9 pe-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          TAB 1: SERIES MANAGEMENT
         ========================================================= */}
      {activeSubTab === 'series' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>پیشاندانی {filteredSeriesList.length} لە کۆی {series.length} زنجیرە</span>
            <span className="text-slate-500">دەتوانیت هەر زنجیرەیەک بشاریتەوە، ڕیزبەندی بگۆڕیت یان زانیاری دەستکاری بکەیت</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSeriesList.map((item, index) => {
              const isHidden = item.isHidden;
              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/90 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                    isHidden 
                      ? 'border-white/5 opacity-55 hover:opacity-85' 
                      : 'border-white/10 hover:border-blue-500/40 shadow-xl'
                  }`}
                >
                  <div className="p-4 flex gap-3.5">
                    {/* Poster Thumbnail */}
                    <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/10">
                      <img 
                        src={item.poster} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=300';
                        }}
                      />
                      <div className="absolute top-1 end-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-amber-300 font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-300" />
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 truncate">
                            {item.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.year}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate" title={item.title}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {item.seasons} وەرز • {item.episodesCount || item.episodes?.length || 0} ئەڵقە
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2">
                        {/* Visibility Pill */}
                        <button
                          onClick={() => toggleSeriesVisibility(item.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            isHidden
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                          }`}
                        >
                          {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{isHidden ? 'شاراوەیە لە ئەپ' : 'دیارە لە ئەپ'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="px-4 py-2.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveItem('series', index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 hover:text-white transition-colors"
                        title="Move Up ⬆"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveItem('series', index, 'down')}
                        disabled={index === series.length - 1}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 hover:text-white transition-colors"
                        title="Move Down ⬇"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.episodes && item.episodes[0] && (
                        <button
                          onClick={() => {
                            setPreviewStreamUrl(item.episodes[0].streamUrl);
                            setPreviewTitle(`${item.title} - ${item.episodes[0].title}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[11px] font-bold border border-blue-500/30 flex items-center gap-1 transition-all"
                          title="تێستی ستریم"
                        >
                          <Play className="w-3 h-3 fill-blue-300" />
                          <span>تێست</span>
                        </button>
                      )}

                      <button
                        onClick={() => startEdit(item, 'series')}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                        title="دەستکاری"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>دەستکاری</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: MOVIES MANAGEMENT
         ========================================================= */}
      {activeSubTab === 'movies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>پیشاندانی {filteredMoviesList.length} لە کۆی {movies.length} فیلم</span>
            <span className="text-slate-500">کۆنترۆڵی کام فیلم لە ئەپەکە پیشانبدرێت، دەستکاری زانیاری و لێدانی ڕاستەوخۆ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMoviesList.map((item, index) => {
              const isHidden = item.isHidden;
              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/90 border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                    isHidden 
                      ? 'border-white/5 opacity-55 hover:opacity-85' 
                      : 'border-white/10 hover:border-rose-500/40 shadow-xl'
                  }`}
                >
                  <div className="p-4 flex gap-3.5">
                    {/* Poster Thumbnail */}
                    <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/10">
                      <img 
                        src={item.poster} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300';
                        }}
                      />
                      <div className="absolute top-1 end-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-amber-300 font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-300" />
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 truncate">
                            {item.genre}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.year}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate" title={item.title}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>{item.duration}</span>
                          <span>•</span>
                          <span className="text-cyan-400 font-bold">{item.quality || '4K'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2">
                        {/* Visibility Pill */}
                        <button
                          onClick={() => toggleMovieVisibility(item.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            isHidden
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                          }`}
                        >
                          {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{isHidden ? 'شاراوەیە لە ئەپ' : 'دیارە لە ئەپ'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="px-4 py-2.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveItem('movies', index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 hover:text-white transition-colors"
                        title="Move Up ⬆"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveItem('movies', index, 'down')}
                        disabled={index === movies.length - 1}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 hover:text-white transition-colors"
                        title="Move Down ⬇"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.streamUrl && (
                        <button
                          onClick={() => {
                            setPreviewStreamUrl(item.streamUrl);
                            setPreviewTitle(item.title);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-bold border border-rose-500/30 flex items-center gap-1 transition-all"
                          title="تێستی ستریم"
                        >
                          <Play className="w-3 h-3 fill-rose-300" />
                          <span>تێست</span>
                        </button>
                      )}

                      <button
                        onClick={() => startEdit(item, 'movies')}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                        title="دەستکاری"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>دەستکاری</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: DISPLAY SETTINGS & CONTROLS (سنووردارکردن)
         ========================================================= */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>کۆنترۆڵی ژمارەی پیشاندانی زنجیرە و فیلمەکان لە ئەپەکە</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              لێرە دەتوانیت دیاری بکەیت ئەپەکە بە یەک جار چەند دانە لە زنجیرەکان و فیلمەکان پیشان بدات تا ئەپەکە زۆر خێرا بێت و بۆ بەکارهێنەر جوانتر بێت.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Series Display Limit */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-blue-400" />
                  <span>سنووری پیشاندانی زنجیرەکان</span>
                </span>
                <span className="text-xs font-mono font-bold text-blue-300 px-2 py-0.5 rounded bg-blue-500/20">
                  {vodConfig.maxSeriesDisplay === 0 ? 'هەموو زنجیرەکان' : `${vodConfig.maxSeriesDisplay} زنجیرە`}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[0, 4, 8, 12, 16, 24].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateVodConfig({ ...vodConfig, maxSeriesDisplay: num })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      vodConfig.maxSeriesDisplay === num
                        ? 'bg-blue-600 text-white border border-blue-400 shadow-md shadow-blue-500/30'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {num === 0 ? 'هەموو' : `${num} دانە`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                ئەگەر لەسەر (هەموو) دابنرێت، تەواوی زنجیرە چالاکەکان لە تابی زنجیرەکان دەردەکەون.
              </p>
            </div>

            {/* Movies Display Limit */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-400" />
                  <span>سنووری پیشاندانی فیلمەکان</span>
                </span>
                <span className="text-xs font-mono font-bold text-rose-300 px-2 py-0.5 rounded bg-rose-500/20">
                  {vodConfig.maxMoviesDisplay === 0 ? 'هەموو فیلمەکان' : `${vodConfig.maxMoviesDisplay} فیلم`}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[0, 6, 12, 18, 24, 36].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateVodConfig({ ...vodConfig, maxMoviesDisplay: num })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      vodConfig.maxMoviesDisplay === num
                        ? 'bg-rose-600 text-white border border-rose-400 shadow-md shadow-rose-500/30'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {num === 0 ? 'هەموو' : `${num} دانە`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                فیلمەکان بەپێی ڕیزبەندی پێشەوە پیشاندەدرێن. دەتوانیت فیلمە گرنگەکان بهێنیتە سەرەوە لە تابی فیلمەکان.
              </p>
            </div>
          </div>

          {/* Cinema Ambient Background Controls */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>تایبەتمەندییە سینەمایییەکانی ئەپی NNDD TV</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <span className="text-xs font-bold text-white block">باکدراپی جوڵاوی کین بۆرنز (Ken Burns Motion)</span>
                  <span className="text-[11px] text-slate-400">وێنەی پشتەوەی سینەمایی بە بلوری و بە هێواشی بجوڵێت</span>
                </div>
                <input
                  type="checkbox"
                  checked={vodConfig.enableCinemaAmbientBackdrop}
                  onChange={(e) => updateVodConfig({ ...vodConfig, enableCinemaAmbientBackdrop: e.target.checked })}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <span className="text-xs font-bold text-white block">خەزنکردنی شوێنی وەستانی فیلم و زنجیرە</span>
                  <span className="text-[11px] text-slate-400">کاتێک بینەر دەگەڕێتەوە لە هەمان خولەک دەست پێ بکاتەوە</span>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: EDIT ITEM DETAILS
         ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>دەستکاریکردنی {editingItem.type === 'series' ? 'زنجیرە' : 'فیلم'}: {editingItem.title}</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">ناونیشان (Title)</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">بەش یان ژانەر (Category/Genre)</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ڕەیتینگ (TMDB Rating)</label>
                  <input
                    type="text"
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ساڵ (Year)</label>
                  <input
                    type="text"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                {editingItem.type === 'movies' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">ماوەی فیلم (Duration)</label>
                    <input
                      type="text"
                      value={editForm.duration}
                      onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">بەستەری پۆستەر (Poster URL)</label>
                <input
                  type="text"
                  value={editForm.poster}
                  onChange={(e) => setEditForm({ ...editForm, poster: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">بەستەری باکدراپ (Backdrop URL)</label>
                <input
                  type="text"
                  value={editForm.backdropUrl}
                  onChange={(e) => setEditForm({ ...editForm, backdropUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-400"
                />
              </div>

              {editingItem.type === 'movies' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">بەستەری ستریم (Stream URL)</label>
                  <input
                    type="text"
                    value={editForm.streamUrl}
                    onChange={(e) => setEditForm({ ...editForm, streamUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">کورتەباس (Description)</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/30"
                >
                  <Check className="w-4 h-4" />
                  <span>سەیڤکردن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: STREAM PREVIEW PLAYER
         ========================================================= */}
      {previewStreamUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-5 max-w-2xl w-full space-y-3 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>پێشبینینی ڕاستەوخۆ: {previewTitle}</span>
              </h4>
              <button 
                onClick={() => setPreviewStreamUrl(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border border-white/10">
              <video
                src={previewStreamUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="font-mono truncate">{previewStreamUrl}</span>
              <button
                onClick={() => setPreviewStreamUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
