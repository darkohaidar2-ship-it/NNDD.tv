import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Heart, 
  Search, 
  Star, 
  Sparkles,
  Tv,
  Check,
  Flame,
  Radio
} from 'lucide-react';
import CachedChannelLogo from './CachedChannelLogo';
import { useDevice } from '../context/DeviceContext';
import { getLocalizedChannelName, getSavedLanguage } from '../data/translations';

export default function PaginatedChannelGrid({
  channels = [],
  selectedChannel,
  onSelectChannel,
  favoriteChannelIds = [],
  onToggleFavorite,
  isEditMode = false,
  onMoveChannel,
  onRemoveChannel,
  className = '',
  initialOnlyFavorites = false,
  autoFocusSearch = false,
  channelHealthMap = {}
}) {
  const { isTv, isTablet, isPhone } = useDevice();
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Pagination & Layout Dimension State
  const [gridDimensions, setGridDimensions] = useState({
    cols: isPhone ? 2 : isTablet ? 3 : 4,
    rows: isPhone ? 4 : isTablet ? 4 : 4,
    pageSize: 12
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const kurd = channels.find(c => (c.category || '').includes('کورد') || (c.category || '') === 'ڕووداو');
    return kurd ? kurd.category : 'کوردی';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(initialOnlyFavorites);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    setOnlyFavorites(initialOnlyFavorites);
    setCurrentPage(0);
  }, [initialOnlyFavorites]);

  useEffect(() => {
    if (autoFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocusSearch]);

  // Category Tabs Pagination (Hard Rule: No horizontal scrolling strip)
  const [categoryPage, setCategoryPage] = useState(0);

  // Extract unique categories from channels (Kurdish first, 'all' at the very bottom/end)
  const allCategories = useMemo(() => {
    const set = new Set();
    channels.forEach(ch => {
      if (ch.category) set.add(ch.category);
    });
    const PREFERRED = ['کوردی', 'هەواڵەکان کوردی', 'ڕووداو', 'وەرزش', 'منداڵان', 'ئاینی', 'سینەما'];
    const sorted = [];
    PREFERRED.forEach(p => {
      if (set.has(p)) {
        sorted.push(p);
        set.delete(p);
      }
    });
    set.forEach(c => {
      if (c !== 'all' && c !== 'هەموو') sorted.push(c);
    });
    // 'all' placed at the very end
    sorted.push('all');
    return sorted;
  }, [channels]);

  // Max visible categories based on screen
  const visibleCategoriesCount = isPhone ? 3 : isTablet ? 5 : 7;
  const totalCategoryPages = Math.ceil(allCategories.length / visibleCategoriesCount);
  const visibleCategories = useMemo(() => {
    const start = categoryPage * visibleCategoriesCount;
    return allCategories.slice(start, start + visibleCategoriesCount);
  }, [allCategories, categoryPage, visibleCategoriesCount]);

  // Active language state
  const [activeLang, setActiveLang] = useState(() => getSavedLanguage());
  useEffect(() => {
    const onLangChanged = (e) => {
      if (e?.detail?.lang) setActiveLang(e.detail.lang);
    };
    window.addEventListener('nndd_language_changed', onLangChanged);
    return () => window.removeEventListener('nndd_language_changed', onLangChanged);
  }, []);

  // Filter channels according to search, category, and favorites
  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      const chKu = getLocalizedChannelName(ch, 'ku');
      const chAr = getLocalizedChannelName(ch, 'ar');
      const chEn = getLocalizedChannelName(ch, 'en');
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (ch.name && ch.name.toLowerCase().includes(q)) ||
        (chKu && chKu.toLowerCase().includes(q)) ||
        (chAr && chAr.toLowerCase().includes(q)) ||
        (chEn && chEn.toLowerCase().includes(q)) ||
        String(ch.number).includes(q);
      
      const matchesCategory = selectedCategory === 'all' || ch.category === selectedCategory;
      const isFav = favoriteChannelIds.includes(ch.id) || ch.isFavorite;
      const matchesFav = !onlyFavorites || isFav;

      return matchesSearch && matchesCategory && matchesFav;
    });
  }, [channels, searchQuery, selectedCategory, onlyFavorites, favoriteChannelIds]);

  // ResizeObserver to calculate exact cols x rows that fit without ANY scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) continue;

        // Target card dimensions:
        // Phone: ~150px width, ~64px height
        // Tablet/TV: ~200px width, ~76px height
        const targetCardWidth = isPhone ? 140 : isTablet ? 170 : 210;
        const targetCardHeight = isPhone ? 62 : isTablet ? 72 : 82;

        const cols = Math.max(1, Math.floor((width - 8) / targetCardWidth));
        const rows = Math.max(1, Math.floor((height - 8) / targetCardHeight));
        const pageSize = Math.max(1, cols * rows);

        setGridDimensions({ cols, rows, pageSize });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [isPhone, isTablet, isTv]);

  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / gridDimensions.pageSize));

  // Ensure currentPage is clamped
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  // Current page channel slice
  const displayedChannels = useMemo(() => {
    const start = currentPage * gridDimensions.pageSize;
    return filteredChannels.slice(start, start + gridDimensions.pageSize);
  }, [filteredChannels, currentPage, gridDimensions.pageSize]);

  // Touch Swipe Gesture for Page Navigation
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      
      // Horizontal swipe (swipe left/right changes page in RTL)
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          // Swipe Right (in RTL: goes to previous page)
          setCurrentPage(prev => Math.max(0, prev - 1));
        } else {
          // Swipe Left (in RTL: goes to next page)
          setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
        }
      }
    }
  };

  // TV D-Pad Arrow Navigation & Auto-Page Turning
  const handleKeyDown = (e, index) => {
    const { cols } = gridDimensions;
    const pageItemCount = displayedChannels.length;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      // In RTL, ArrowRight moves to preceding item or previous page
      if (index % cols === 0) {
        if (currentPage > 0) {
          setCurrentPage(prev => prev - 1);
          setFocusedIndex(cols - 1);
        }
      } else {
        setFocusedIndex(Math.max(0, index - 1));
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // In RTL, ArrowLeft moves to next item or next page
      if ((index + 1) % cols === 0 || index === pageItemCount - 1) {
        if (currentPage < totalPages - 1) {
          setCurrentPage(prev => prev + 1);
          setFocusedIndex(0);
        }
      } else {
        setFocusedIndex(Math.min(pageItemCount - 1, index + 1));
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const target = index + cols;
      if (target < pageItemCount) {
        setFocusedIndex(target);
      } else if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
        setFocusedIndex(index % cols);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const target = index - cols;
      if (target >= 0) {
        setFocusedIndex(target);
      } else if (currentPage > 0) {
        setCurrentPage(prev => prev - 1);
        setFocusedIndex(Math.min(pageItemCount - 1, target + gridDimensions.pageSize));
      }
    } else if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13) {
      e.preventDefault();
      const targetCh = displayedChannels[index];
      if (targetCh) onSelectChannel?.(targetCh);
    }
  };

  return (
    <div 
      className={`h-full w-full overflow-hidden flex flex-col select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. TOP TOOLBAR: Search, Category Tabs Pagination & Filters (ZERO SCROLL) */}
      <div className="shrink-0 flex items-center justify-between gap-2 p-2 sm:p-2.5 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        {/* Search Input (Compact with auto-truncate) */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="گەڕان بۆ کەناڵ..."
            className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all truncate"
          />
        </div>

        {/* Paginated Category Tabs (NO Horizontal Scroll Strip) */}
        <div className="flex items-center gap-1">
          {totalCategoryPages > 1 && (
            <button
              onClick={() => setCategoryPage(prev => Math.max(0, prev - 1))}
              disabled={categoryPage === 0}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white transition-all cursor-pointer"
              title="پۆلی پێشوو"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1">
            {visibleCategories.map(cat => {
              const isSelected = selectedCategory === cat;
              const label = (cat === 'all' || cat === 'هەموو') ? 'هەمووی' : cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-normal transition-all truncate max-w-[90px] sm:max-w-[120px] ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {totalCategoryPages > 1 && (
            <button
              onClick={() => setCategoryPage(prev => Math.min(totalCategoryPages - 1, prev + 1))}
              disabled={categoryPage >= totalCategoryPages - 1}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white transition-all cursor-pointer"
              title="پۆلی دواتر"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Favorites Filter Button */}
          <button
            onClick={() => {
              setOnlyFavorites(prev => !prev);
              setCurrentPage(0);
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              onlyFavorites
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="دڵخوازەکان"
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. MAIN PAGINATED CHANNEL GRID CONTAINER (MEASURED BY RESIZEOBSERVER) */}
      <div ref={containerRef} className="flex-1 w-full p-2 sm:p-2.5 overflow-hidden">
        {displayedChannels.length > 0 ? (
          <div 
            className="h-full w-full grid gap-1.5 sm:gap-2"
            style={{
              gridTemplateColumns: `repeat(${gridDimensions.cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridDimensions.rows}, minmax(0, 1fr))`
            }}
          >
            {displayedChannels.map((ch, idx) => {
              const isActive = selectedChannel?.id === ch.id;
              const isFav = favoriteChannelIds.includes(ch.id) || ch.isFavorite;
              const isFocused = isTv && focusedIndex === idx;

              return (
                <div
                  key={ch.id}
                  tabIndex={0}
                  onFocus={() => setFocusedIndex(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onClick={() => onSelectChannel?.(ch)}
                  className={`group relative h-full w-full rounded-2xl border transition-all duration-150 flex flex-col justify-between overflow-hidden cursor-pointer active:scale-95 backdrop-blur-xl ${
                    isFocused
                      ? 'bg-blue-600 text-white font-normal ring-2 ring-white scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.6)] z-10 border-white/40'
                      : isActive
                        ? 'bg-white/20 text-white font-normal ring-1 ring-white/40 shadow-md border-white/30'
                        : 'bg-white/[0.06] hover:bg-white/[0.14] text-slate-100 hover:text-white border-white/15'
                  }`}
                >
                  {/* Top Body: Logo, Category, Quality Badge & Favorite */}
                  <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0 p-0.5 overflow-hidden shadow-sm">
                        <CachedChannelLogo channel={ch} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-300 font-mono tracking-wider truncate block">
                          {ch.category || 'Live TV'}
                        </span>
                        {ch.is4K && (
                          <span className="text-[8px] font-normal px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 shadow-xs inline-block">
                            4K
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(ch.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 active:scale-90 transition-transform shrink-0"
                      title={isFav ? 'Remove Favorite' : 'Add Favorite'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    </button>
                  </div>

                  {/* Dedicated Frosted Glass Bottom Title Bar */}
                  <div className="backdrop-blur-md bg-black/45 border-t border-white/10 px-2.5 py-1.5 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 text-start">
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      ) : channelHealthMap[ch.id] === 'offline' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shrink-0" />
                      )}
                      <span className="font-normal text-xs sm:text-sm tracking-wide truncate leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                        {getLocalizedChannelName(ch, activeLang)}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-white font-normal px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 shrink-0">
                      {ch.number}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
            <Radio className="w-10 h-10 text-slate-500 mb-2 animate-pulse" />
            <p className="text-sm font-normal text-slate-300">هیچ کەناڵێک نەدۆزرایەوە</p>
            <p className="text-xs text-slate-500 mt-1">تکایە فلتەر یان وشەی گەڕانەکەت بگۆڕە</p>
          </div>
        )}
      </div>

      {/* 3. BOTTOM PAGINATION CONTROLS (HARD RULE: "Page X of Y" + Arrows + Dots) */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 sm:py-2 border-t border-white/10 bg-black/40 backdrop-blur-2xl">
        {/* Previous Page Button (In RTL: Points Right) */}
        <button
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white font-normal text-xs transition-all active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
          <span>پێشوو</span>
        </button>

        {/* Page Dots & Numbers */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-normal text-white tracking-wider">
            لاپەڕە {currentPage + 1} لە {totalPages}
          </span>
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(8, totalPages) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  currentPage === i ? 'w-4 bg-blue-500' : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Next Page Button (In RTL: Points Left) */}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
          disabled={currentPage >= totalPages - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white font-normal text-xs transition-all active:scale-95 cursor-pointer"
        >
          <span>دواتر</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
