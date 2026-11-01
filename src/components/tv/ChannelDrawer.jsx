import React from 'react';
import { Check, Heart, Star, Edit3, Search, X, Layers, ChevronUp, ChevronDown, Trash2, Plus, Folder, Calendar } from 'lucide-react';
import CachedChannelLogo from '../CachedChannelLogo';
import { getLocalizedChannelName } from '../../data/translations';
import TriLingualKeyboard from './TriLingualKeyboard';
import EpgBar from './EpgBar';

export default function ChannelDrawer({
  show,
  onClose,
  onSelectChannel,
  drawerScale = 'standard',
  drawerStyle = 'glass-frosted',
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
  toggleFavoriteChannel,
  countdownRemaining = 0,
  performChannelSwitch,
  moveChannelInList,
  removeChannelFromList,
  showCategoryModal = false,
  setShowCategoryModal,
  toggleCategorySelector,
  openCustomCategoryModal,
  customCategories = [],
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
  onOpenScheduleModal = null,
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

      {/* Floating Glass Channel Drawer Container (13% Translucent Cinema Glass) */}
      <div 
        className={`fixed top-3 bottom-3 ${isRtl ? 'right-2 sm:right-4 md:right-5' : 'left-2 sm:left-4 md:left-5'} z-50 ${
          drawerScale === 'compact' ? 'w-80 sm:w-88' : drawerScale === 'large' ? 'w-96 sm:w-[28rem] md:w-[30rem]' : 'w-84 sm:w-96 md:w-[27rem]'
        } max-w-[94vw] max-h-[calc(100vh-1.5rem)] rounded-3xl ${
          drawerStyle === 'pure-black'
            ? 'bg-slate-950 border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.98)] ring-1 ring-white/10'
            : drawerStyle === 'glass-crystal'
            ? 'bg-black/[0.08] backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] ring-1 ring-white/20'
            : drawerStyle === 'glass-smoked'
            ? 'bg-black/[0.22] backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10'
            : 'bg-slate-950 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)]'
        } flex flex-col animate-fade-in cursor-default select-none overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            1. TOP CATEGORY HEADER & HORIZONTAL SELECTOR PILLS
           ======================================================== */}
        <div className={`border-b ${drawerStyle === 'pure-black' ? 'border-slate-800 bg-slate-950' : 'border-white/10 bg-white/[0.02] backdrop-blur-md'}`}>
          {/* Header Row: Active Category Title + Badges + Close */}
          <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {getCategoryDisplayName(channelCategory)}
              </h3>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-400/30 shrink-0">
                {filteredChannels.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Custom Category Button */}
              <button
                type="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  openCustomCategoryModal?.();
                }}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold border border-white/15 active:scale-95"
                title="دروستکردنی کەتەگۆریی نوێ"
              >
                <Plus className="w-3 h-3 text-white" />
                <span className="hidden sm:inline">+ نوێ</span>
              </button>

              {/* Edit Mode Done Button */}
              {isChannelEditMode && (
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setIsChannelEditMode?.(false)}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                  title="تەواوکردن و قفڵکردنەوە"
                >
                  <Check className="w-3 h-3 text-amber-300" />
                  <span>تەواو</span>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                tabIndex={0}
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer border border-white/15 active:scale-90"
                title={t('close')}
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrollable Category Pills Bar */}
          <div className="px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {dynamicCategories.map((cat, cIdx) => {
              const isSelected = channelCategory === cat;
              const displayName = getCategoryDisplayName(cat);

              return (
                <button
                  key={cat}
                  type="button"
                  tabIndex={0}
                  onClick={() => {
                    setChannelCategory?.(cat);
                    setCategoryFocusedIndex?.(cIdx);
                    setDrawerFocusedIndex?.(0);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)] border border-cyan-400'
                      : 'bg-white/[0.04] hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            2. FULL-WIDTH CHANNELS LIST (No sidebar constraint!)
           ======================================================== */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
          {filteredChannels.length === 0 ? (
            <div className="py-16 text-center text-white/50 text-xs font-normal">
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
                          if (onSelectChannel) {
                            onSelectChannel(ch);
                          } else {
                            performChannelSwitch?.(ch, true);
                            onClose?.();
                          }
                        }
                      }}
                      onClick={() => {
                        if (isChannelEditMode) return;
                        setDrawerFocusedIndex?.(idx);
                        if (onSelectChannel) {
                          onSelectChannel(ch);
                        } else {
                          performChannelSwitch?.(ch, true);
                          onClose?.();
                        }
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2.5 text-start transition-all duration-150 cursor-pointer outline-none ${
                        isRemoteFocused
                          ? 'bg-sky-500/25 border border-sky-400 text-white ring-2 ring-sky-400 scale-[1.02] shadow-[0_0_20px_rgba(56,189,248,0.4)]'
                          : isSwitching
                            ? 'bg-amber-500/20 border border-amber-400/60 text-white shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                            : isSelected 
                              ? 'bg-slate-900 border border-sky-500/40 text-white shadow-sm' 
                              : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/90 hover:text-white border border-transparent'
                      }`}
                    >
                      {/* 1. Channel Number (Reset per category: idx + 1) */}
                      <span className={`font-mono text-xs font-bold w-6 text-center shrink-0 transition-colors ${
                        isRemoteFocused || isSelected || isSwitching
                          ? 'text-cyan-300' 
                          : 'text-white/60'
                      }`}>
                        {idx + 1}
                      </span>

                      {/* 2. Channel Logo (Small Crystal Square with Clean SVG Fallback) */}
                      <div className={`w-6 h-6 rounded-lg overflow-hidden shrink-0 p-0.5 shadow-sm transition-all ${
                        isRemoteFocused || isSelected || isSwitching
                          ? 'bg-white/25 border border-white/60'
                          : 'bg-white/10 border border-white/15'
                      }`}>
                        <CachedChannelLogo 
                          channel={ch} 
                          className="w-full h-full object-cover rounded-md" 
                        />
                      </div>

                      {/* 3. Channel Name + EPG */}
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className={`truncate text-xs sm:text-sm font-medium tracking-wide transition-all ${
                          isRemoteFocused || isSelected || isSwitching
                            ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
                            : 'text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
                        }`}>
                          {getLocalizedChannelName(ch, language)}
                        </span>
                        {!isChannelEditMode && (
                          <EpgBar channel={ch} />
                        )}
                      </div>

                      {/* Reordering / Edit Mode Controls vs Normal Status Indicators */}
                      {isChannelEditMode ? (
                        ch.id === 'ch-dabin-tv-custom' ? (
                          <span className="text-[10px] text-amber-300 font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
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
                        /* Normal State: Fav Star, Countdown Badge, Add to Custom List */
                        <div className="flex items-center gap-1 shrink-0">
                          {isSwitching && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-white bg-white/20 px-1.5 py-0.5 rounded-lg border border-white/30 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              {countdownRemaining}s
                            </span>
                          )}
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomCategoryModal?.({
                                type: 'channel',
                                id: ch.id,
                                title: getLocalizedChannelName(ch, language)
                              });
                            }}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer text-white/40 hover:text-white"
                            title="زیادکردن بۆ کەتەگۆریی تایبەت"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteChannel?.(ch.id);
                            }}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                            title="Toggle Favorite"
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'text-white/25 hover:text-white'} shrink-0`} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

        {/* ========================================================
            3. DEDICATED SEPARATED BOTTOM CONTROL DOCK (بەشی خوارەوەی جیاکراوە)
           ======================================================== */}
        <div className={`border-t ${drawerStyle === 'pure-black' ? 'border-slate-800 bg-slate-950' : 'border-white/15 bg-black/50 backdrop-blur-2xl'} p-2.5 space-y-2`}>
          {/* Row 1: Action Quick Buttons */}
          <div className="flex items-center justify-between gap-1.5">
            {/* Search Button */}
            <button
              type="button"
              tabIndex={0}
              onClick={toggleSearchKeyboard}
              className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                showSearchKeyboard
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">{t('search')}</span>
            </button>

            {/* Favorites Toggle Button */}
            <button
              type="button"
              tabIndex={0}
              onClick={() => {
                setChannelFilterMode?.(prev => prev === 'fav' ? 'all' : 'fav');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                channelFilterMode === 'fav'
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${channelFilterMode === 'fav' ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
              <span className="text-[11px]">{t('favorites')}</span>
            </button>

            {/* EPG 7-Day Schedule Guide Button */}
            <button
              type="button"
              tabIndex={0}
              onClick={() => onOpenScheduleModal?.(selectedChannel)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">EPG خشتە</span>
            </button>

            {/* Edit Mode Toggle Button */}
            <button
              type="button"
              tabIndex={0}
              onClick={handleEditClick}
              className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isChannelEditMode
                  ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px]">{t('edit')}</span>
            </button>
          </div>

          {/* Row 2: 4 TV Remote Color Keys with Clear Labels */}
          <div className="pt-1.5 border-t border-white/10 flex items-center justify-around gap-1.5 text-[10px]">
            <button
              type="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); toggleCategorySelector?.(); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 transition-all cursor-pointer active:scale-95"
              title={t('redKey')}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <span>پۆلەکان</span>
            </button>

            <button
              type="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); toggleSearchKeyboard?.(); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 transition-all cursor-pointer active:scale-95"
              title={t('greenKey')}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>گەڕان</span>
            </button>

            <button
              type="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); cycleAspectRatio?.(); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 transition-all cursor-pointer active:scale-95"
              title={t('yellowKey')}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              <span>ڕەهەند</span>
            </button>

            <button
              type="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); cycleChannelFilter?.(); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-200 transition-all cursor-pointer active:scale-95"
              title={t('blueKey')}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
              <span>فلتەر</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Category Picker Popup (Red Remote Key - Opens next to Channel Drawer) */}
      {showCategoryModal && (
        <div 
          className={`fixed top-8 bottom-8 ${isRtl ? 'right-[19rem] sm:right-[21.5rem]' : 'left-[19rem] sm:left-[21.5rem]'} z-50 p-3.5 rounded-2xl bg-black/[0.13] backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.45)] flex flex-col gap-2 animate-scale-up select-none max-w-xs w-60 ring-1 ring-white/15`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-xs font-semibold text-white">{t('categories')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                tabIndex={0}
                onClick={() => {
                  setShowCategoryModal?.(false);
                  openCustomCategoryModal?.();
                }}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold flex items-center gap-1 border border-white/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
                title="دروستکردنی کەتەگۆریی نوێ"
              >
                <Plus className="w-3 h-3 text-white" />
                <span>+ نوێ</span>
              </button>
              <button
                type="button"
                tabIndex={0}
                onClick={() => setShowCategoryModal?.(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
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
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-normal text-start transition-all cursor-pointer flex items-center justify-between focus-visible:ring-2 focus-visible:ring-white outline-none ${
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
