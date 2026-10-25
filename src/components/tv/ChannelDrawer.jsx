import React from 'react';
import { Check, Heart, Edit3, Search, X, Layers, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import CachedChannelLogo from '../CachedChannelLogo';
import { getLocalizedChannelName } from '../../data/translations';
import TriLingualKeyboard from './TriLingualKeyboard';

export default function ChannelDrawer({
  show,
  onClose,
  drawerScale = 'standard',
  isRtl = true,
  language = 'ku',
  filteredChannels = [],
  channels = [],
  selectedChannel,
  switchingChannel,
  channelCategory = 'هەموو',
  setChannelCategory,
  dynamicCategories = [],
  getCategoryDisplayName = (c) => c,
  channelFilterMode = 'all',
  setChannelFilterMode,
  isChannelEditMode = false,
  setIsChannelEditMode,
  handleEditClick,
  drawerActivePane = 'channels',
  setDrawerActivePane,
  categoryFocusedIndex = 0,
  setCategoryFocusedIndex,
  drawerFocusedIndex = 0,
  setDrawerFocusedIndex,
  drawerItemRefs,
  favoriteChannelIds = [],
  countdownRemaining = 0,
  performChannelSwitch,
  moveChannelInList,
  removeChannelFromList,
  showCategoryModal = false,
  setShowCategoryModal,
  toggleCategorySelector,
  showSearchKeyboard = false,
  setShowSearchKeyboard,
  toggleSearchKeyboard,
  cycleAspectRatio,
  cycleChannelFilter,
  showColorToast,
  keyboardLang = 'ku',
  setKeyboardLang,
  keyboardFocusedIndex = 0,
  setKeyboardFocusedIndex,
  searchQuery = '',
  setSearchQuery,
  t = (k) => k
}) {
  if (!show) return null;

  return (
    <>
      {/* Transparent click dismissal: NO black overlay or full-screen blur! */}
      <div 
        className="fixed inset-0 z-40 bg-transparent cursor-pointer"
        onClick={() => {
          onClose?.();
          setShowSearchKeyboard?.(false);
          setShowCategoryModal?.(false);
        }}
        onTouchEnd={() => {
          onClose?.();
          setShowSearchKeyboard?.(false);
          setShowCategoryModal?.(false);
        }}
      />

      {/* Floating Glass 2-Column Channel & Category List Container */}
      <div 
        className={`fixed top-6 bottom-6 ${isRtl ? 'right-4 sm:right-6 md:right-8' : 'left-4 sm:left-6 md:left-8'} z-50 ${
          drawerScale === 'compact' ? 'w-[28rem] sm:w-[32rem]' : drawerScale === 'large' ? 'w-[36rem] sm:w-[44rem]' : 'w-[32rem] sm:w-[38rem]'
        } max-w-[96vw] max-h-[calc(100vh-3rem)] rounded-none bg-slate-950/90 backdrop-blur-3xl border border-white/25 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/10 animate-fade-in cursor-default select-none overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Minimalist Glass Header: Icons Only (Sharpened) */}
        <div className="px-3.5 py-2 border-b border-white/15 flex items-center justify-between bg-transparent backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
            <span className="text-[11px] font-mono font-normal text-white bg-white/10 px-2 py-0.5 rounded-none border border-white/20">
              {filteredChannels.length}
            </span>
            <span className="text-xs font-semibold text-cyan-300">
              {getCategoryDisplayName(channelCategory)}
            </span>
            {isChannelEditMode && (
              <button
                type="button"
                tabIndex={0}
                onClick={() => setIsChannelEditMode?.(false)}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:scale-105 outline-none"
                title="تەواوکردن و قفڵکردنەوە"
              >
                <Check className="w-3 h-3 text-amber-300" />
                <span>تەواو</span>
              </button>
            )}
          </div>

          {/* Actions: ONLY ICONS (White Minimalist & Sharpened) */}
          <div className="flex items-center gap-1.5">
            {/* Favorites (White Heart Icon Only) */}
            <button
              type="button"
              tabIndex={0}
              onClick={() => {
                setChannelFilterMode?.(prev => prev === 'fav' ? 'all' : 'fav');
              }}
              className={`p-1.5 rounded-none border transition-all cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none ${
                channelFilterMode === 'fav'
                  ? 'bg-white/25 border-white/50 text-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
              title={t('favorites')}
            >
              <Heart className={`w-3.5 h-3.5 ${channelFilterMode === 'fav' ? 'fill-white text-white' : 'text-white'}`} />
            </button>

            {/* Edit (White Icon Only) */}
            <button
              type="button"
              tabIndex={0}
              onClick={handleEditClick}
              className={`p-1.5 rounded-none border transition-all cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none ${
                isChannelEditMode
                  ? 'bg-white/30 border-white/60 text-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
              title={t('edit')}
            >
              <Edit3 className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Search (White Icon Only) */}
            <button
              type="button"
              tabIndex={0}
              onClick={toggleSearchKeyboard}
              className={`p-1.5 rounded-none border transition-all cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none ${
                showSearchKeyboard
                  ? 'bg-white/25 border-white/50 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
              }`}
              title={t('search')}
            >
              <Search className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Close (White Icon Only) */}
            <button
              type="button"
              tabIndex={0}
              onClick={onClose}
              className="p-1.5 rounded-none bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer border border-white/15 active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none"
              title={t('close')}
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* 2-Column Body: Column 1 (All Categories) + Column 2 (Channels in Selected Category) */}
        <div className="flex-1 flex overflow-hidden min-h-0 divide-x divide-white/15 rtl:divide-x-reverse">
          {/* Column 1: All Categories Sidebar */}
          <div className="w-28 sm:w-36 md:w-44 shrink-0 bg-black/45 flex flex-col border-e border-white/15">
            <div className="px-2.5 py-2 border-b border-white/10 flex items-center justify-between bg-white/5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">پۆلەکان</span>
              <Layers className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none p-1 space-y-0.5">
              {dynamicCategories.map((cat, cIdx) => {
                const isCatSelected = channelCategory === cat;
                const isCatFocused = drawerActivePane === 'categories' && categoryFocusedIndex === cIdx;
                const catCount = cat === 'هەموو' 
                  ? channels.filter(c => !c.isHidden).length 
                  : channels.filter(c => !c.isHidden && c.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    tabIndex={0}
                    onClick={() => {
                      setChannelCategory?.(cat);
                      setCategoryFocusedIndex?.(cIdx);
                      setDrawerActivePane?.('channels');
                      setDrawerFocusedIndex?.(0);
                    }}
                    onFocus={() => {
                      setDrawerActivePane?.('categories');
                      setCategoryFocusedIndex?.(cIdx);
                    }}
                    className={`w-full px-2 py-2 rounded text-start transition-all cursor-pointer flex items-center justify-between gap-1 text-[11px] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:scale-105 outline-none ${
                      isCatSelected
                        ? 'bg-cyan-500/25 text-cyan-200 border-s-2 border-cyan-400 shadow-sm font-semibold'
                        : isCatFocused
                          ? 'bg-white/20 text-white border-s-2 border-white/70'
                          : 'bg-transparent text-slate-300 hover:bg-white/10 hover:text-white border-s-2 border-transparent'
                    }`}
                  >
                    <span className="truncate">{getCategoryDisplayName(cat)}</span>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 bg-white/10 px-1.5 py-0.2 rounded-full">
                      {catCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Channels in Selected Category */}
          <div className="flex-1 flex flex-col min-w-0 bg-transparent">
            {/* Continuous Glass Sheet Channel Rows */}
            <div className="flex-1 overflow-y-auto scrollbar-none py-1 px-1 space-y-0.5">
              {filteredChannels.length === 0 ? (
                <div className="p-8 text-center text-white/60 text-xs font-normal">
                  {t('noChannelsFound')}
                </div>
              ) : (
                filteredChannels.map((ch, idx) => {
                  const isSelected = selectedChannel?.id === ch.id;
                  const isSwitching = switchingChannel && (String(switchingChannel.id) === String(ch.id) || switchingChannel.id === ch.id);
                  const isRemoteFocused = drawerActivePane === 'channels' && drawerFocusedIndex === idx;
                  const isFav = favoriteChannelIds.includes(ch.id) || ch.isFavorite;

                  return (
                    <div
                      key={ch.id}
                      data-channel-row="true"
                      tabIndex={0}
                      role="button"
                      ref={el => { if (drawerItemRefs?.current) drawerItemRefs.current[idx] = el; }}
                      onFocus={() => {
                        setDrawerActivePane?.('channels');
                        setDrawerFocusedIndex?.(idx);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (isChannelEditMode) return;
                          performChannelSwitch?.(ch, true);
                          onClose?.();
                        }
                      }}
                      onClick={() => {
                        if (isChannelEditMode) return;
                        setDrawerFocusedIndex?.(idx);
                        performChannelSwitch?.(ch, true);
                        onClose?.();
                      }}
                      className={`w-full px-3 py-2 rounded-none flex items-center justify-between gap-3 text-start transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-[1.01] outline-none ${
                        isRemoteFocused
                          ? 'bg-white/25 backdrop-blur-xl border border-white/60 text-white shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                          : isSwitching
                            ? 'bg-white/20 backdrop-blur-xl border border-white/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            : isSelected 
                              ? 'bg-white/15 backdrop-blur-xl border border-white/30 text-white shadow-[0_2px_12px_rgba(255,255,255,0.12)]' 
                              : 'bg-transparent hover:bg-white/[0.08] text-white/90 hover:text-white border border-transparent'
                      }`}
                    >
                      {/* 1. Channel Number (Reset per category: idx + 1) */}
                      <span className={`font-mono text-xs font-semibold w-7 text-center shrink-0 transition-colors ${
                        isRemoteFocused || isSelected || isSwitching
                          ? 'text-cyan-300' 
                          : 'text-white/60'
                      }`}>
                        {idx + 1}
                      </span>

                      {/* 2. Channel Logo (Small Crystal Square) */}
                      <div className={`w-7 h-7 rounded-none overflow-hidden shrink-0 p-0.5 shadow-sm transition-all ${
                        isRemoteFocused || isSelected || isSwitching
                          ? 'bg-white/25 border border-white/50 scale-105'
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        <CachedChannelLogo 
                          channel={ch} 
                          className="w-full h-full object-cover rounded-none" 
                        />
                      </div>

                      {/* 3. Channel Name */}
                      <span className={`truncate flex-1 text-xs sm:text-sm tracking-wide font-normal transition-all ${
                        isRemoteFocused || isSelected || isSwitching
                          ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
                          : 'text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
                      }`}>
                        {getLocalizedChannelName(ch, language)}
                      </span>

                      {/* Reordering / Edit Mode Controls vs Normal Status Indicators */}
                      {isChannelEditMode ? (
                        ch.id === 'ch-dabin-tv-custom' ? (
                          <span className="text-[10px] text-amber-300 font-mono bg-amber-500/20 px-2 py-0.5 border border-amber-500/30 shrink-0">
                            جێگیرە 🔒
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              tabIndex={0}
                              disabled={idx <= 1}
                              onClick={() => moveChannelInList?.(ch.id, 'up')}
                              className={`p-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white active:scale-90 focus-visible:ring-2 focus-visible:ring-white outline-none ${idx <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title="جوڵاندن بۆ سەرەوە"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              tabIndex={0}
                              disabled={idx >= filteredChannels.length - 1}
                              onClick={() => moveChannelInList?.(ch.id, 'down')}
                              className={`p-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white active:scale-90 focus-visible:ring-2 focus-visible:ring-white outline-none ${idx >= filteredChannels.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                              title="جوڵاندن بۆ خوارەوە"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              tabIndex={0}
                              onClick={() => removeChannelFromList?.(ch.id)}
                              className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 active:scale-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 outline-none"
                              title="سڕینەوە"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      ) : (
                        /* Normal State: Fav Heart, Countdown Badge */
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSwitching && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-white bg-white/20 px-1.5 py-0.5 border border-white/30 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              {countdownRemaining}s
                            </span>
                          )}
                          {isFav && (
                            <Heart className="w-3.5 h-3.5 fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* TV Remote Color Keys: Minimalist, Compact & Sharpened */}
        <div className="p-2 border-t border-white/10 bg-transparent backdrop-blur-md flex items-center justify-around gap-2">
          <button
            type="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); toggleCategorySelector?.(); }}
            className="p-1.5 rounded-none bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 backdrop-blur-md transition-all cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none"
            title={t('redKey')}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] block" />
          </button>

          <button
            type="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); toggleSearchKeyboard?.(); }}
            className="p-1.5 rounded-none bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 backdrop-blur-md transition-all cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none"
            title={t('greenKey')}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] block" />
          </button>

          <button
            type="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); cycleAspectRatio?.(); }}
            className="p-1.5 rounded-none bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 backdrop-blur-md transition-all cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none"
            title={t('yellowKey')}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] block" />
          </button>

          <button
            type="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); cycleChannelFilter?.(); }}
            className="p-1.5 rounded-none bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/30 backdrop-blur-md transition-all cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-110 outline-none"
            title={t('blueKey')}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)] block" />
          </button>
        </div>
      </div>

      {/* Floating Category Picker Popup (Red Remote Key - Opens next to Channel Drawer) */}
      {showCategoryModal && (
        <div 
          className={`fixed top-8 bottom-8 ${isRtl ? 'right-[19rem] sm:right-[21.5rem]' : 'left-[19rem] sm:left-[21.5rem]'} z-50 p-3.5 rounded-none bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col gap-2 animate-scale-up select-none max-w-xs w-60 ring-1 ring-white/10`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-xs font-normal text-white">{t('categories')}</span>
            </div>
            <button
              type="button"
              tabIndex={0}
              onClick={() => setShowCategoryModal?.(false)}
              className="p-1 rounded-none text-white/50 hover:text-white hover:bg-white/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none space-y-1 p-0.5">
            {dynamicCategories.map(cat => {
              const isSelected = channelCategory === cat;
              const displayName = getCategoryDisplayName(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  tabIndex={0}
                  onClick={() => {
                    setChannelCategory?.(cat);
                    setShowCategoryModal?.(false);
                    showColorToast?.('red', `🔴 ${t('categories')}: ${displayName}`);
                  }}
                  className={`w-full px-3 py-1.5 rounded-none text-xs font-normal text-start transition-all cursor-pointer flex items-center justify-between focus-visible:ring-2 focus-visible:ring-white outline-none ${
                    isSelected 
                      ? 'bg-red-500 text-white shadow-md' 
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{displayName}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* On-Screen Mini Virtual Keyboard (Green Remote Key - Opens next to Channel Drawer) */}
      <TriLingualKeyboard
        show={showSearchKeyboard}
        isRtl={isRtl}
        keyboardLang={keyboardLang}
        setKeyboardLang={setKeyboardLang}
        keyboardFocusedIndex={keyboardFocusedIndex}
        setKeyboardFocusedIndex={setKeyboardFocusedIndex}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        channelCount={filteredChannels.length}
        onClose={() => setShowSearchKeyboard?.(false)}
        t={t}
      />
    </>
  );
}
