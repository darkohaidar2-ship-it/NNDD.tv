import React, { useState, useEffect } from 'react';
import DabinLogo from './DabinLogo';
import { 
  X, 
  Download, 
  Smartphone, 
  Tv, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  PlusSquare, 
  ShieldCheck, 
  Apple, 
  FileCheck,
  HardDrive
} from 'lucide-react';

export default function InstallAppModal({ isOpen, onClose, deferredPrompt }) {
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
      }
    } else {
      alert('بۆ دامەزراندنی وەک PWA لە کۆمپیوتەر یان مۆبایل، دەتوانیت لە مینیوی براوسەرەکەت (سێ خاڵەکە) کلیک لە "Install NNDD TV" یان "Add to Home Screen" بکەیت.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in" dir="rtl">
      <div className="bg-slate-900/95 rounded-3xl shadow-2xl border border-white/15 w-full max-w-2xl overflow-hidden animate-slide-up text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(2,132,199,0.35)] flex items-center justify-center">
              <DabinLogo className="h-10 w-auto" glow={true} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                داگرتن و دامەزراندنی ئەپی DABIN.Tv
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                فایلی ڕاستەقینەی APK بۆ ئەندرۆید و تیڤی، لەگەڵ وەشانی مۆدێرنی PWA بۆ هەموو ئامێرەکان
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* OPTION 1: DOWNLOAD ANDROID APK */}
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  فایلی فەرمی ئەندرۆید (APK)
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>داگرتنی kobin-tv.apk</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  فایلی APKـی تەواو کۆمپاڵکراو ئامادەیە بۆ دامەزراندن لەسەر مۆبایلی ئەندرۆید، تابلێت، یان تەلەفزیۆنی زیرەک (Android TV / Google TV / Mi Box).
                </p>
                <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-2">
                  <span>قەبارە: ٨.٥ مێگابایت (پڕۆ و خێرا)</span>
                  <span>•</span>
                  <span>وەشان: 2.0 (KOBIN.Tv PRO)</span>
                </div>
              </div>

              <a
                href="/kobin-tv.apk"
                download="kobin-tv.apk"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50 active:scale-95 transition-all flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>داگرتنی فایلی APK</span>
              </a>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>پەڕگەکە لەسەر کۆمپیوتەرەکەشت پاشەکەوتکراوە لە: <code className="text-emerald-200">kobin-tv.apk</code></span>
            </div>
          </div>

          {/* OPTION 2: PWA INSTALLATION (PROGRESSIVE WEB APP) */}
          <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-950/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40">
                  وەشانی PWA (بێ پێویستی دابەزاندنی فایل)
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-blue-400" />
                  <span>دامەزراندنی ڕاستەوخۆ وەک ئەپی سەربەخۆ (PWA)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  بە یەک کلیک لەسەر شاشەی سەرەکی دابنێ؛ کار دەکات لەسەر iPhone، iPad، کۆمپیوتەر، مۆبایل و براوسەری تەلەفزیۆن بێ بەستەری براوسەر بە پەنجەرەی تەواوی سەربەخۆ.
                </p>
              </div>

              <button
                onClick={handleInstallPwa}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50 active:scale-95 transition-all flex-shrink-0"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>دامەزراندنی PWA</span>
              </button>
            </div>

            {/* Platform Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-blue-500/20 text-[11px] text-slate-300">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-white/10">
                <strong className="text-white block mb-0.5">بۆ ئایفۆن و ئایپاد (iOS):</strong>
                لە Safari کلیک لە دوگمەی <strong>Share</strong> بکە و پاشان <strong>"Add to Home Screen"</strong> هەڵبژێرە.
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-white/10">
                <strong className="text-white block mb-0.5">بۆ کۆمپیوتەر و ئەندرۆید:</strong>
                لە گۆشەی سەرەوەی وێبگەڕ کلیک لە ئایکۆنی دامەزراندن یان <strong>"Install DABIN.Tv"</strong> بکە.
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            DABIN.Tv • وەشانی فەرمیی ئەپ
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs active:scale-95 transition-all border border-white/10"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
}
