import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Phone, Send, X, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  getKobinBroadcastConfig,
  subscribeToKobinBroadcastChannel
} from '../../data/dabinBroadcastManager';

/**
 * LivePromoOverlay - Standalone Half-Screen Aqua Liquid-Glass Promo Overlay
 * 
 * 100% Isolated Component:
 * - Manages its own internal visibility and interval timers.
 * - Does NOT trigger re-renders in KurdLocalTvApp or restart Hls.js/mpegts.js players.
 * - Video continues playing uninterrupted in the background with ZERO black screens.
 * - Aqua Liquid-Glass half-screen card:
 *   w-[90vw] md:w-[55vw] max-w-3xl min-h-[42vh]
 *   bg-gradient-to-br from-cyan-500/25 via-sky-600/20 to-blue-950/40 backdrop-blur-2xl
 *   border border-cyan-300/40 rounded-3xl p-8 shadow-[0_20px_70px_rgba(6,182,212,0.35)]
 */
export default function LivePromoOverlay({ isLiveActive = true }) {
  const [config, setConfig] = useState(() => {
    try {
      const cfg = getKobinBroadcastConfig();
      const customPromo = localStorage.getItem('kobin_center_promo_config');
      if (customPromo) {
        const parsed = JSON.parse(customPromo);
        return { ...cfg, ...parsed };
      }
      return cfg;
    } catch (e) {
      return getKobinBroadcastConfig();
    }
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const hideTimeoutRef = useRef(null);
  const intervalTimerRef = useRef(null);

  // 1. Sync configuration when updated from Admin Studio or custom triggers
  useEffect(() => {
    const handleConfigUpdate = (e) => {
      const updated = e.detail;
      if (updated && typeof updated === 'object') {
        setConfig(prev => ({ ...prev, ...updated }));
      } else {
        setConfig(getKobinBroadcastConfig());
      }
    };

    window.addEventListener('kobin_broadcast_updated', handleConfigUpdate);
    window.addEventListener('dabin_broadcast_updated', handleConfigUpdate);

    // Cross-tab / cross-window sync via BroadcastChannel
    const unsubscribeChannel = subscribeToKobinBroadcastChannel((msg) => {
      if (msg.type === 'BROADCAST_CONFIG_UPDATED' && msg.payload) {
        setConfig(prev => ({ ...prev, ...msg.payload }));
      } else if (msg.type === 'TRIGGER_PROMO_TEST') {
        triggerPromoNow();
      }
    });

    return () => {
      window.removeEventListener('kobin_broadcast_updated', handleConfigUpdate);
      window.removeEventListener('dabin_broadcast_updated', handleConfigUpdate);
      if (typeof unsubscribeChannel === 'function') unsubscribeChannel();
    };
  }, []);

  // 2. Show Promo Helper
  const showPromo = (durationSec = null) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsFadingOut(false);
    setIsVisible(true);

    const dur = Math.max(4, Number(durationSec || config.durationSeconds || config.promoDisplaySeconds) || 15);
    hideTimeoutRef.current = setTimeout(() => {
      dismissPromo();
    }, dur * 1000);
  };

  // 3. Dismiss Promo with smooth 250ms fade-out
  const dismissPromo = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsFadingOut(false);
    }, 250);
  };

  // 4. Force trigger for testing
  const triggerPromoNow = () => {
    showPromo(config.durationSeconds || config.promoDisplaySeconds || 15);
  };

  useEffect(() => {
    const handleTestTrigger = (e) => {
      const customDur = e?.detail?.duration || config.durationSeconds || config.promoDisplaySeconds || 15;
      showPromo(customDur);
    };

    window.addEventListener('kobin_test_promo', handleTestTrigger);
    window.addEventListener('trigger_kobin_promo_test', handleTestTrigger);

    return () => {
      window.removeEventListener('kobin_test_promo', handleTestTrigger);
      window.removeEventListener('trigger_kobin_promo_test', handleTestTrigger);
    };
  }, [config.durationSeconds, config.promoDisplaySeconds]);

  // 5. Periodic Timer based on selected Frequency
  useEffect(() => {
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }

    const isEnabled = config.enabled ?? config.showPromoOverlay;
    if (!isEnabled || !isLiveActive) {
      if (!isLiveActive && isVisible) {
        dismissPromo();
      }
      return;
    }

    const freqMinutes = Math.max(1, Number(config.frequencyMinutes || config.promoIntervalMinutes) || 10);
    const intervalMs = freqMinutes * 60 * 1000;

    intervalTimerRef.current = setInterval(() => {
      showPromo();
    }, intervalMs);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
    };
  }, [config.enabled, config.showPromoOverlay, config.frequencyMinutes, config.promoIntervalMinutes, config.durationSeconds, config.promoDisplaySeconds, isLiveActive]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!isVisible && !isFadingOut) return null;

  const packages = Array.isArray(config.promoPackages) && config.promoPackages.length > 0
    ? config.promoPackages
    : [
        { name: 'پاکێجی ١ مانگ', price: '10,000 IQD', tag: 'تێست و مانگانە' },
        { name: 'پاکێجی ٣ مانگ', price: '25,000 IQD', tag: 'داشکاندنی وەرز' },
        { name: 'پاکێجی ٦ مانگ', price: '45,000 IQD', tag: 'نیوەی ساڵ' },
        { name: 'پاکێجی ١ ساڵە (VIP)', price: '75,000 IQD', tag: 'باشترین نرخ ⭐' }
      ];

  const whatsappNum = config.whatsapp || config.promoContactWhatsapp || '+964 750 0004444';
  const phoneNum = config.phone || config.promoContactPhone || '+964 770 000 0000';
  const telegramHandle = config.telegram || config.promoContactTelegram || '@kobin_tv';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-250 ease-out select-none pointer-events-auto ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-fade-in'
      }`}
      dir="rtl"
      onClick={dismissPromo}
    >
      {/* Half-Screen Aqua Liquid-Glass Container */}
      <div
        className="relative w-[90vw] md:w-[55vw] max-w-3xl min-h-[42vh] rounded-3xl bg-gradient-to-br from-cyan-500/25 via-sky-600/20 to-blue-950/40 backdrop-blur-2xl border border-cyan-300/40 p-6 sm:p-8 shadow-[0_20px_70px_rgba(6,182,212,0.35)] text-center space-y-5 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Aurora Glow Lights */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Minimalist Close Button */}
        <button
          type="button"
          onClick={dismissPromo}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
          title="داخستن"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Royal KOBIN.TV Emblem & Branding Header */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative">
            <img
              src={config.customLogoUrl || '/kobin-logo.png'}
              alt="KOBIN.Tv"
              className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-[0_0_30px_rgba(6,182,212,0.7)] animate-pulse"
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-base sm:text-xl font-black text-white tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {config.promoTitle || 'KOBIN TV - تایبەتمەندترین پلاتفۆرمی پەخشی کەناڵەکان'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-cyan-200/90 max-w-lg font-medium drop-shadow-md">
            {config.promoSubtitle || 'بۆ بەشداریکردن و کاراکردنی کۆدی MAC پەیوەندی بە بریکارەکانمانەوە بکەن'}
          </p>
        </div>

        {/* Subscription Packages Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                idx === 3
                  ? 'bg-gradient-to-b from-amber-500/25 to-amber-950/50 border-amber-400/80 shadow-[0_0_25px_rgba(251,146,60,0.4)] ring-1 ring-amber-400/60 scale-[1.02]'
                  : 'bg-white/10 hover:bg-white/15 border-white/20 hover:border-cyan-400/60 shadow-lg backdrop-blur-xl'
              }`}
            >
              <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                {pkg.tag || 'پاکێج'}
              </span>
              <div className="text-xs sm:text-sm font-black text-white tracking-wide">{pkg.name}</div>
              <div className="text-xs sm:text-sm font-mono font-black text-cyan-300 mt-1">{pkg.price}</div>
            </div>
          ))}
        </div>

        {/* Interactive Aqua Liquid-Glass Contact Pills */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap pt-2 border-t border-cyan-400/20">
          {whatsappNum && (
            <a
              href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.25)] backdrop-blur-xl"
              title="پەیوەندی لە ڕێگەی واتسئاپ"
            >
              <MessageCircle className="w-4 h-4 text-emerald-300" />
              <span>واتسئاپ:</span>
              <span dir="ltr">{whatsappNum}</span>
            </a>
          )}

          {phoneNum && (
            <a
              href={`tel:${phoneNum.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer shadow-[0_4px_15px_rgba(59,130,246,0.25)] backdrop-blur-xl"
              title="پەیوەندی تەلەفۆنی ڕاستەوخۆ"
            >
              <Phone className="w-4 h-4 text-blue-300" />
              <span>تەلەفۆن:</span>
              <span dir="ltr">{phoneNum}</span>
            </a>
          )}

          {telegramHandle && (
            <a
              href={`https://t.me/${telegramHandle.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer shadow-[0_4px_15px_rgba(14,165,233,0.25)] backdrop-blur-xl"
              title="پەیوەندی لە ڕێگەی تێلیگرام"
            >
              <Send className="w-4 h-4 text-sky-300" />
              <span>تێلیگرام:</span>
              <span dir="ltr">{telegramHandle}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
