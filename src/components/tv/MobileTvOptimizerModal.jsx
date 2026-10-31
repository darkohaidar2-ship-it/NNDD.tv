import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Smartphone, 
  Zap, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X, 
  ShieldCheck, 
  Wifi,
  Sparkles,
  ArrowRight
} from 'lucide-react';

/**
 * KOBIN.tv Mobile-to-TV Wireless ADB Optimizer Modal
 * Safe CleanYourTV integration for Android Mobile Phones.
 * Connects wirelessly over ADB to optimize TV speed, purge cache, and activate KOBIN TV Launcher.
 */
export default function MobileTvOptimizerModal({
  show,
  onClose,
  language = 'ku'
}) {
  const [tvIp, setTvIp] = useState('192.168.1.');
  const [tvPort, setTvPort] = useState('5555');
  const [isRunning, setIsRunning] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);
  const [finalStatus, setFinalStatus] = useState(null); // 'success' | 'error' | null

  // Register native listener for live ADB step progress
  useEffect(() => {
    window.__onKobinOptimizerProgress = (data) => {
      if (!data) return;
      setProgressSteps(prev => {
        const next = [...prev];
        const existingIdx = next.findIndex(s => s.step === data.step);
        if (existingIdx >= 0) {
          next[existingIdx] = data;
        } else {
          next.push(data);
        }
        return next;
      });

      if (data.isComplete) {
        if (data.isError) {
          setFinalStatus('error');
        } else if (data.step >= (data.totalSteps || 6)) {
          setFinalStatus('success');
        }
        setIsRunning(false);
        setIsRestoring(false);
      }
    };

    return () => {
      window.__onKobinOptimizerProgress = null;
    };
  }, []);

  if (!show) return null;

  const handleStartOptimize = () => {
    if (!tvIp || tvIp.trim().length < 7) {
      alert('تکایە ئایپی تەلەفزیۆن بنووسە (بۆ نموونە: 192.168.1.50)');
      return;
    }
    setIsRunning(true);
    setFinalStatus(null);
    setProgressSteps([]);

    const portNum = parseInt(tvPort, 10) || 5555;

    if (window.KobinTvNative?.runTvOptimizer) {
      window.KobinTvNative.runTvOptimizer(tvIp.trim(), portNum);
    } else {
      // Simulation fallback for web browser testing
      simulateSteps();
    }
  };

  const handleRestore = () => {
    setIsRestoring(true);
    setFinalStatus(null);
    setProgressSteps([]);

    const portNum = parseInt(tvPort, 10) || 5555;

    if (window.KobinTvNative?.restoreTvDefault) {
      window.KobinTvNative.restoreTvDefault(tvIp.trim(), portNum);
    } else {
      setTimeout(() => {
        setIsRestoring(false);
        setFinalStatus('success');
      }, 1500);
    }
  };

  const simulateSteps = () => {
    const mockSteps = [
      { step: 1, totalSteps: 6, description: 'پەیوەندی کردن بە تەلەفزیۆن لە ڕێگەی ADB...' },
      { step: 2, totalSteps: 6, description: 'پشکنینی هەبوونی KOBIN.tv لەسەر تەلەفزیۆن...' },
      { step: 3, totalSteps: 6, description: 'خێراکردنی ئەنیمەیشن و ڕووی سیستەم (0.5x Scale)...' },
      { step: 4, totalSteps: 6, description: 'پاککردنەوەی کەشی کاتی و ڕێکخستنی ڕام (Safe Cache Trim)...' },
      { step: 5, totalSteps: 6, description: 'چالاککردنی لاونچەری KOBIN لەسەر تەلەفزیۆن...' },
      { step: 6, totalSteps: 6, description: 'تەواو! KOBIN.tv ئێستا لاونچەری چالاکی تەلەفزیۆنەکەتە 🚀' }
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < mockSteps.length) {
        const s = mockSteps[i];
        window.__onKobinOptimizerProgress?.({
          step: s.step,
          totalSteps: s.totalSteps,
          description: s.description,
          isComplete: i === mockSteps.length - 1,
          isError: false
        });
        i++;
      } else {
        clearInterval(interval);
      }
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-3xl bg-black/[0.9] backdrop-blur-2xl border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.9)] ring-1 ring-white/15 p-6 flex flex-col gap-4 text-start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                ئامرازی خێراکردن و لاونچەری تەلەفزیۆن
              </h3>
              <p className="text-xs text-white/60">
                پەیوەندی بێ وایەر بە تەلەفزیۆن لە مۆبایلەوە (Wireless ADB)
              </p>
            </div>
          </div>
          <button
            type="button"
            tabIndex={0}
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* IP and Port Input */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="col-span-2">
            <label className="text-[11px] font-medium text-white/70 block mb-1">
              ئایپی تەلەفزیۆن (TV IP Address)
            </label>
            <input 
              type="text"
              value={tvIp}
              onChange={(e) => setTvIp(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-white/70 block mb-1">
              پۆرت (Port)
            </label>
            <input 
              type="text"
              value={tvPort}
              onChange={(e) => setTvPort(e.target.value)}
              placeholder="5555"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/15 text-white font-mono text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Safety Guarantee Badge */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/70 leading-relaxed">
            <strong className="text-white">100% سەلامەت و بێ زیان:</strong> هیچ ئەپێکی بنەڕەتی تەلەفزیۆن ناسڕدرێتەوە. لە هەر کاتێکدا دەتوانیت بگەڕێیتەوە بۆ لاونچەری بنەڕەتی.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            disabled={isRunning || isRestoring}
            onClick={handleStartOptimize}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer outline-none"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جێبەجێ دەکرێت...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>خێراکردنی TV و چالاککردنی لاونچەر</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isRunning || isRestoring}
            onClick={handleRestore}
            className="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer outline-none"
            title="گەڕاندنەوە بۆ دۆخی ئاسایی"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">گەڕاندنەوە</span>
          </button>
        </div>

        {/* Live Step Progress */}
        {progressSteps.length > 0 && (
          <div className="mt-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 max-h-48 overflow-y-auto scrollbar-none">
            {progressSteps.map((s) => (
              <div key={s.step} className="flex items-center gap-2 text-xs">
                {s.isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span className={s.isError ? 'text-rose-300' : 'text-white/90'}>
                  {s.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
