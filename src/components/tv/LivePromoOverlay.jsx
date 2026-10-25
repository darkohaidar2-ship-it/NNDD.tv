import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Phone, Send, X, Sparkles } from 'lucide-react';
import {
  getKobinBroadcastConfig,
  subscribeToKobinBroadcastChannel
} from '../../data/dabinBroadcastManager';

/**
 * LivePromoOverlay - Standalone Periodic Center Screen Promo & Commercial Overlay
 * 
 * 100% Isolated Component:
 * - Manages its own internal visibility and interval timers.
 * - Does NOT trigger re-renders in KurdLocalTvApp or restart Hls.js/mpegts.js players.
 * - Video continues playing uninterrupted in the background with ZERO black screens.
 */
export default function LivePromoOverlay({ isLiveActive = true }) {
  const [config, setConfig] = useState(() => getKobinBroadcastConfig());
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const hideTimeoutRef = useRef(null);
  const intervalTimerRef = useRef(null);

  // 1. Sync configuration when updated from Admin Studio or cross-device broadcast
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

    const dur = Math.max(4, Number(durationSec || config.promoDisplaySeconds) || 12);
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

  // 4. Force trigger for testing (called by "تێستکردنی پڕۆمۆ لەسەر کەناڵ" button)
  const triggerPromoNow = () => {
    showPromo(config.promoDisplaySeconds || 15);
  };

  useEffect(() => {
    const handleTestTrigger = () => {
      triggerPromoNow();
    };
    window.addEventListener('trigger_kobin_promo_test', handleTestTrigger);
    return () => window.removeEventListener('trigger_kobin_promo_test', handleTestTrigger);
  }, [config.promoDisplaySeconds]);

  // 5. Periodic Timer based on selected Frequency
  useEffect(() => {
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }

    // Only run periodic timer if promo is active and user is in Live TV
    if (!config.showPromoOverlay || !isLiveActive) {
      if (!isLiveActive && isVisible) {
        dismissPromo();
      }
      return;
    }

    const intervalMinutes = Math.max(1, Number(config.promoIntervalMinutes) || 10);
    const intervalMs = intervalMinutes * 60 * 1000;

    intervalTimerRef.current = setInterval(() => {
      showPromo();
    }, intervalMs);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
    };
  }, [config.showPromoOverlay, config.promoIntervalMinutes, config.promoDisplaySeconds, isLiveActive]);

  // Clean up hide timeout on unmount
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

  const whatsappNum = config.promoContactWhatsapp || '+964 750 0004444';
  const phoneNum = config.promoContactPhone || '+964 770 000 0000';
  const telegramHandle = config.promoContactTelegram || '@kobin_tv';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md transition-opacity duration-250 ease-out pointer-events-auto select-none ${
        isFadingOut ? 'opacity-0' : 'opacity-100 animate-fade-in'
      }`}
      dir="rtl"
      onClick={dismissPromo}
    >
      <div
        className="relative max-w-2xl w-full rounded-3xl bg-gradient-to-br from-[#070B14] via-[#0E1526] to-[#040711] border-2 border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.35)] text-center space-y-5 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Background Glows */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={dismissPromo}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-white"
          title="داخستن"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Prominent Large KOBIN.Tv Logo & Titles */}
        <div className="flex flex-col items-center justify-center gap-2">
          <img
            src={config.customLogoUrl || '/kobin-logo.png'}
            alt="KOBIN.Tv"
            className="h-14 sm:h-18 w-auto object-contain filter drop-shadow-[0_0_25px_rgba(2,132,199,0.6)] animate-pulse"
          />
          <h3 className="text-base sm:text-lg font-black text-white tracking-wide mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {config.promoTitle || 'KOBIN TV - تایبەتمەندترین پلاتفۆرمی پەخشی کەناڵەکان'}
          </h3>
          <p className="text-xs text-cyan-300 max-w-lg font-medium drop-shadow-md">
            {config.promoSubtitle || 'بۆ بەشداریکردن و کاراکردنی کۆدی MAC پەیوەندی بە ڕیسێلەرەکانمانەوە بکەن'}
          </p>
        </div>

        {/* Subscription Packages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                idx === 3
                  ? 'bg-gradient-to-b from-amber-500/25 to-amber-950/50 border-amber-400 shadow-[0_0_20px_rgba(251,146,60,0.35)] ring-1 ring-amber-400/50 scale-[1.02]'
                  : 'bg-white/5 border-white/15 hover:border-cyan-400/50'
              }`}
            >
              <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                {pkg.tag || 'پاکێج'}
              </span>
              <div className="text-xs font-black text-white tracking-wide">{pkg.name}</div>
              <div className="text-xs sm:text-sm font-mono font-black text-cyan-300 mt-1">{pkg.price}</div>
            </div>
          ))}
        </div>

        {/* Contact Methods Badges */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap pt-2 border-t border-white/10">
          {whatsappNum && (
            <a
              href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono hover:bg-emerald-500/30 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="پەیوەندی لە واتسئاپ"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>واتسئاپ:</span>
              <span dir="ltr">{whatsappNum}</span>
            </a>
          )}

          {phoneNum && (
            <a
              href={`tel:${phoneNum.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold font-mono hover:bg-blue-500/30 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="پەیوەندی تەلەفۆنی"
            >
              <Phone className="w-4 h-4 text-blue-400" />
              <span>تەلەفۆن:</span>
              <span dir="ltr">{phoneNum}</span>
            </a>
          )}

          {telegramHandle && (
            <a
              href={`https://t.me/${telegramHandle.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold font-mono hover:bg-sky-500/30 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="پەیوەندی لە تێلیگرام"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>تێلیگرام:</span>
              <span dir="ltr">{telegramHandle}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
