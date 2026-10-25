import React from 'react';
import { Search, X } from 'lucide-react';

export const KU_KEYBOARD_KEYS = [
  'ئ', 'ا', 'ب', 'پ', 'ت', 'ج', 'چ', 'ح', 'خ', 'د',
  'ر', 'ڕ', 'ز', 'ژ', 'س', 'ش', 'ع', 'غ', 'ف', 'ڤ',
  'ق', 'ک', 'گ', 'ل', 'ڵ', 'م', 'ن', 'ه', 'و', 'ۆ',
  'ی', 'ێ', '0', '1', '2', '3', '4', '5', '6', '7',
  '8', '9', 'SPACE', 'BACK', 'CLEAR', 'DONE'
];

export const AR_KEYBOARD_KEYS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
  'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ء', 'ئ',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'SPACE', 'BACK', 'CLEAR', 'DONE'
];

export const EN_KEYBOARD_KEYS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3',
  '4', '5', '6', '7', '8', '9', 'SPACE', 'BACK', 'CLEAR', 'DONE'
];

export default function TriLingualKeyboard({
  show,
  isRtl = true,
  keyboardLang = 'ku',
  setKeyboardLang,
  keyboardFocusedIndex = 0,
  setKeyboardFocusedIndex,
  searchQuery = '',
  setSearchQuery,
  channelCount = 0,
  onClose,
  t = (k) => k
}) {
  if (!show) return null;

  const currentKeys = keyboardLang === 'ku' ? KU_KEYBOARD_KEYS : keyboardLang === 'ar' ? AR_KEYBOARD_KEYS : EN_KEYBOARD_KEYS;

  return (
    <div 
      className={`fixed bottom-8 ${isRtl ? 'right-[19rem] sm:right-[21.5rem]' : 'left-[19rem] sm:left-[21.5rem]'} z-50 p-3.5 rounded-3xl bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col gap-2.5 animate-scale-up select-none max-w-sm w-80 ring-1 ring-white/10`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Keyboard Header & Live Search Preview */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Search className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono font-normal text-white bg-white/10 px-2 py-0.5 rounded-lg flex items-center justify-between">
              <span className="truncate">{searchQuery || t('searchPlaceholder')}</span>
              <span className="text-[9px] text-emerald-400 shrink-0 font-sans font-normal">
                {channelCount}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ms-1.5">
          <div className="flex items-center gap-0.5 p-0.5 bg-white/10 rounded-lg border border-white/15">
            <button
              type="button"
              onClick={() => setKeyboardLang('ku')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                keyboardLang === 'ku' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              کوردی
            </button>
            <button
              type="button"
              onClick={() => setKeyboardLang('en')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                keyboardLang === 'en' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setKeyboardLang('ar')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                keyboardLang === 'ar' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              عربي
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Keys Grid */}
      <div className="grid grid-cols-10 gap-1 text-center font-normal font-mono">
        {currentKeys.map((k, idx) => {
          const isFocused = keyboardFocusedIndex === idx;
          const isAction = ['SPACE', 'BACK', 'CLEAR', 'DONE'].includes(k);
          const colSpan = k === 'SPACE' ? 'col-span-3' : k === 'BACK' ? 'col-span-3' : k === 'CLEAR' ? 'col-span-2' : k === 'DONE' ? 'col-span-2' : 'col-span-1';
          const label = k === 'SPACE' ? t('spaceKey') : k === 'BACK' ? t('backKey') : k === 'CLEAR' ? t('clearKey') : k === 'DONE' ? t('doneKey') : k;

          return (
            <button
              key={k + idx}
              type="button"
              onClick={() => {
                setKeyboardFocusedIndex?.(idx);
                if (k === 'SPACE') setSearchQuery(prev => prev + ' ');
                else if (k === 'BACK') setSearchQuery(prev => prev.slice(0, -1));
                else if (k === 'CLEAR') setSearchQuery('');
                else if (k === 'DONE') onClose?.();
                else setSearchQuery(prev => prev + k);
              }}
              className={`${colSpan} py-1.5 rounded-lg text-[10px] transition-all cursor-pointer select-none active:scale-95 ${
                isFocused 
                  ? 'bg-[#0078D4] text-white ring-2 ring-white scale-105 shadow-md font-normal' 
                  : isAction
                    ? 'bg-white/15 text-cyan-200 hover:bg-white/25 text-[9px] font-sans font-normal'
                    : 'bg-white/10 text-white/90 hover:bg-white/25 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
