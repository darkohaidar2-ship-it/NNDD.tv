import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Folder, Film, Tv, Star } from 'lucide-react';
import {
  createCustomCategory,
  deleteCustomCategory,
  toggleItemInCustomCategory,
  isItemInCustomCategory
} from '../../data/customCategories';

/**
 * CustomCategoryModal - Minimalist Apple TV style Custom Category Builder & Item Linker
 */
export default function CustomCategoryModal({
  isOpen,
  onClose,
  customCategories = [],
  setCustomCategories,
  targetItem = null, // { type: 'channel' | 'movie' | 'series', id: string, title: string }
  onSelectCategory = null, // (categoryName) => void
  t = (k) => k
}) {
  const [newCatName, setNewCatName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e?.preventDefault();
    const clean = newCatName.trim();
    if (!clean) {
      setErrorMsg('تکایە ناوێک بۆ کەتەگۆرییەکە بنووسە');
      return;
    }
    setErrorMsg('');
    const updated = createCustomCategory(clean);
    setCustomCategories(updated);
    setNewCatName('');

    // If an item was targeted, auto-add it to the newly created category immediately!
    if (targetItem?.id) {
      const created = updated.find(c => c.name === clean);
      if (created) {
        const withItem = toggleItemInCustomCategory(created.id, {
          type: targetItem.type,
          id: targetItem.id
        });
        setCustomCategories(withItem);
      }
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updated = deleteCustomCategory(id);
    setCustomCategories(updated);
  };

  const handleToggleItem = (catId) => {
    if (!targetItem?.id) return;
    const updated = toggleItemInCustomCategory(catId, {
      type: targetItem.type,
      id: targetItem.id
    });
    setCustomCategories(updated);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-slate-950/95 border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10 flex flex-col gap-4 text-white text-right select-none transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10 border border-white/20 text-white">
              <Folder className="w-4 h-4 text-white" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                ⭐ کەتەگۆرییە تایبەتەکان من (My Lists)
              </h3>
              {targetItem?.title && (
                <p className="text-[11px] text-white/60 truncate max-w-[220px]">
                  زیادکردنی: «{targetItem.title}»
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create New Category Input */}
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => { setNewCatName(e.target.value); setErrorMsg(''); }}
            placeholder="ناوی کەتەگۆریی نوێ (وەک: یارییەکان)..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all text-right"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold flex items-center gap-1 hover:bg-white/90 active:scale-95 transition-all cursor-pointer shrink-0 shadow-md focus-visible:ring-2 focus-visible:ring-white outline-none"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950" />
            <span>+ نوێ</span>
          </button>
        </form>
        {errorMsg && <p className="text-[11px] text-rose-400 font-medium -mt-2">{errorMsg}</p>}

        {/* Categories List */}
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto scrollbar-none py-1">
          {customCategories.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-xs font-light">
              هێشتا هیچ کەتەگۆرییەکت دروست نەکردووە. لە سەرەوە ناوێک بنووسە و «+ نوێ» دابگرە.
            </div>
          ) : (
            customCategories.map((cat) => {
              const inCat = targetItem?.id ? isItemInCustomCategory(cat, targetItem) : false;
              const chCount = (cat.channelIds || []).length;
              const movieCount = (cat.vodMovieIds || []).length;
              const seriesCount = (cat.vodSeriesIds || []).length;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (targetItem?.id) {
                      handleToggleItem(cat.id);
                    } else if (onSelectCategory) {
                      onSelectCategory(cat.name);
                      onClose();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (targetItem?.id) handleToggleItem(cat.id);
                      else if (onSelectCategory) {
                        onSelectCategory(cat.name);
                        onClose();
                      }
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-white outline-none ${
                    inCat
                      ? 'bg-white/20 border-white/60 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {targetItem?.id ? (
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                        inCat ? 'bg-white border-white text-slate-950' : 'bg-transparent border-white/30 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <Folder className="w-4 h-4 text-white/70 shrink-0" />
                    )}

                    <span className="text-xs font-semibold truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Item count badges */}
                    <div className="flex items-center gap-1 text-[10px] text-white/50 font-mono">
                      {chCount > 0 && <span title="کەناڵ">{chCount}📺</span>}
                      {movieCount > 0 && <span title="فیلم">{movieCount}🎬</span>}
                      {seriesCount > 0 && <span title="زنجیرە">{seriesCount}🎞️</span>}
                      {chCount === 0 && movieCount === 0 && seriesCount === 0 && (
                        <span>بەتال</span>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(cat.id, e)}
                      title="سڕینەوەی ئەم کەتەگۆرییە"
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
          <span>کەتەگۆرییەکان لەسەر ئامێرەکەت خەزن دەکرێن</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
}
