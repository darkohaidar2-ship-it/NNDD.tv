import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Tv, 
  AlertTriangle,
  FolderPlus
} from 'lucide-react';

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories = [],
  channels = [],
  onAddCategory,
  onDeleteCategory,
  onRenameCategory
}) {
  const [newCatName, setNewCatName] = useState('');
  const [editingCatName, setEditingCatName] = useState(null);
  const [editingCatValue, setEditingCatValue] = useState('');
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) return;
    onAddCategory(clean);
    setNewCatName('');
  };

  const startRename = (cat) => {
    setEditingCatName(cat);
    setEditingCatValue(cat);
  };

  const submitRename = (oldName) => {
    const clean = editingCatValue.trim();
    if (clean && clean !== oldName) {
      onRenameCategory(oldName, clean);
    }
    setEditingCatName(null);
    setEditingCatValue('');
  };

  // Helper to count channels in each category
  const getChannelCount = (catName) => {
    if (!Array.isArray(channels)) return 0;
    return channels.filter(c => c.category?.trim() === catName?.trim()).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900/95 border border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-400/30">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">
                بەڕێوەبردنی بەشەکان (Category Management)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                زیادکردن، سڕینەوە و دەستکاریکردنی ناوی بەشەکانی کەناڵ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Add Category Input */}
          <form onSubmit={handleAdd} className="bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 space-y-2">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-purple-400" />
              <span>زیادکردنی بەشی نوێ:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="ناوی بەشەکە بنووسە (بۆ نموونە: وەرزش، منداڵان، بەڵگەنامەیی...)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-purple-400 focus:bg-white/10 outline-none text-xs"
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-purple-400/30 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردن</span>
              </button>
            </div>
          </form>

          {/* Delete Confirmation Alert Banner */}
          {confirmDeleteCat && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2.5 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>دڵنیایت لە سڕینەوەی بەشی "{confirmDeleteCat}"؟</span>
              </div>
              <p className="text-[11px] text-slate-300">
                ئەگەر ئەم بەشە بسڕیتەوە، {getChannelCount(confirmDeleteCat)} کەناڵی ناو ئەم بەشە بەشێوەی ئۆتۆماتیک دەگوازرێنەوە بۆ بەشێکی تر و ناسڕێنەوە.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteCat(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCategory(confirmDeleteCat);
                    setConfirmDeleteCat(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>بەڵێ، بیسڕەوە</span>
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-bold text-slate-300">لیستی بەشە چالاکەکان ({categories.length} بەش):</span>
              <span className="text-[11px]">کرتە لەسەر قەڵەم بکە بۆ گۆڕینی ناو</span>
            </div>

            <div className="divide-y divide-white/5 border border-white/10 rounded-2xl bg-slate-950/40 overflow-hidden">
              {categories.map((cat, idx) => {
                const isEditing = editingCatName === cat;
                const count = getChannelCount(cat);

                return (
                  <div
                    key={cat}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono text-slate-400 shrink-0">
                        {idx + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                          <input
                            type="text"
                            value={editingCatValue}
                            onChange={(e) => setEditingCatValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitRename(cat);
                              if (e.key === 'Escape') setEditingCatName(null);
                            }}
                            autoFocus
                            className="flex-1 px-2.5 py-1 rounded-lg border border-purple-400 bg-slate-900 text-white text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => submitRename(cat)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                            title="پاشەکەوتکردن"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatName(null)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                            title="پەشیمانبوونەوە"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-white text-xs truncate">
                            {cat}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-slate-300 flex items-center gap-1">
                        <Tv className="w-3 h-3 text-cyan-400" />
                        <span>{count} کەناڵ</span>
                      </span>

                      {!isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={() => startRename(cat)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="دەستکاریکردنی ناوی بەش"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCat(cat)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="سڕینەوەی ئەم بەشە"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-950/40">
          <span className="text-xs text-slate-400">
            هەموو گۆڕانکارییەکان ڕاستەوخۆ لە ئەپ و تیڤی جێبەجێ دەبن.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
}
