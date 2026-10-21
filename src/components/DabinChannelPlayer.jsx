import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getDabinBroadcastConfig, 
  extractYouTubeVideoId 
} from '../data/dabinBroadcastManager';
import { getMediaBlob } from '../data/dabinMediaStorage';
import { Sparkles, Play, AlertCircle } from 'lucide-react';

/**
 * DABIN.Tv Channel Dynamic Broadcast Player
 * 
 * Powered by DABIN Studio:
 * - Unified Timeline Sequence Track with Multi-Media Types (Uploaded Videos, URLs, YouTube, Images)
 * - Automatic Seamless Progression & Continuous Looping ("با فیدیۆکان LOOb بێت")
 * - Channel Watermark Logo Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت")
 * - Live Scrolling Announcement Marquee / Ticker ("شریتی ئاگەداری دابنێ")
 */
export default function DabinChannelPlayer({ 
  isMuted = false, 
  volume = 100 
}) {
  const [config, setConfig] = useState(getDabinBroadcastConfig);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState(null);
  const [showItemNotice, setShowItemNotice] = useState(true);
  const videoRef = useRef(null);
  const createdObjectUrlRef = useRef(null);

  // Sync with Admin Studio changes in real time
  useEffect(() => {
    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
        if (e.detail.currentTimelineIndex !== undefined) {
          setCurrentIndex(e.detail.currentTimelineIndex);
        }
      }
    };
    window.addEventListener('dabin_broadcast_updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('dabin_broadcast_updated', handleConfigUpdate);
    };
  }, []);

  const timelineItems = config.timelineItems || [];
  
  // Safe bounds check on currentIndex
  const safeIndex = timelineItems.length > 0 
    ? Math.min(Math.max(0, currentIndex), timelineItems.length - 1)
    : 0;

  const currentItem = timelineItems[safeIndex] || null;

  // Advance to next timeline item
  const advanceToNextItem = useCallback(() => {
    if (timelineItems.length <= 1) {
      if (config.isLoop && currentItem?.type === 'video' && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    if (safeIndex + 1 < timelineItems.length) {
      setCurrentIndex(safeIndex + 1);
    } else if (config.isLoop) {
      // Loop back to start
      setCurrentIndex(0);
    }
  }, [safeIndex, timelineItems.length, config.isLoop, currentItem]);

  // Show a brief item notice toast when changing item
  useEffect(() => {
    setShowItemNotice(true);
    const timer = setTimeout(() => setShowItemNotice(false), 3800);
    return () => clearTimeout(timer);
  }, [safeIndex]);

  // Resolve IndexedDB blob for local video uploads
  useEffect(() => {
    let isCancelled = false;

    // Clean up previous blob URL
    if (createdObjectUrlRef.current) {
      URL.revokeObjectURL(createdObjectUrlRef.current);
      createdObjectUrlRef.current = null;
    }
    setResolvedBlobUrl(null);

    async function resolveSource() {
      if (!currentItem) return;

      if (currentItem.type === 'video' && currentItem.isLocalUpload) {
        try {
          const blob = await getMediaBlob(currentItem.id);
          if (!isCancelled && blob) {
            const blobUrl = URL.createObjectURL(blob);
            createdObjectUrlRef.current = blobUrl;
            setResolvedBlobUrl(blobUrl);
            return;
          }
        } catch (err) {
          console.warn('[DabinPlayer] Could not retrieve blob from IndexedDB:', err);
        }
      }

      if (!isCancelled) {
        setResolvedBlobUrl(currentItem.url || null);
      }
    }

    resolveSource();

    return () => {
      isCancelled = true;
      if (createdObjectUrlRef.current) {
        URL.revokeObjectURL(createdObjectUrlRef.current);
        createdObjectUrlRef.current = null;
      }
    };
  }, [currentItem]);

  // Update volume & muted on internal HTML5 video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [isMuted, volume, safeIndex, resolvedBlobUrl]);

  // Timer for Image items or fixed-duration items
  useEffect(() => {
    if (!currentItem) return;

    // Handle Image progression
    if (currentItem.type === 'image') {
      const displayMs = Math.max(2000, (currentItem.duration || 8) * 1000);
      const timer = setTimeout(() => {
        advanceToNextItem();
      }, displayMs);
      return () => clearTimeout(timer);
    }

    // Handle YouTube progression
    if (currentItem.type === 'youtube') {
      const displayMs = Math.max(5000, (currentItem.duration || 60) * 1000);
      const timer = setTimeout(() => {
        advanceToNextItem();
      }, displayMs);
      return () => clearTimeout(timer);
    }

    // Handle Video with fixed duration limit
    if (currentItem.type === 'video' && currentItem.duration > 0) {
      const timer = setTimeout(() => {
        advanceToNextItem();
      }, currentItem.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentItem, advanceToNextItem]);

  // Video ended callback
  const handleVideoEnded = () => {
    advanceToNextItem();
  };

  // Video error fallback (auto-advance after 3s so stream never hangs)
  const handleVideoError = (e) => {
    console.warn('[DabinPlayer] Video error on item:', currentItem?.title, e);
    const timeout = setTimeout(() => {
      advanceToNextItem();
    }, 3000);
    return () => clearTimeout(timeout);
  };

  // Watermark position classes
  const getLogoPositionClass = () => {
    switch (config.logoPosition) {
      case 'top-left':
        return 'top-6 left-6';
      case 'bottom-right':
        return 'bottom-16 right-6';
      case 'bottom-left':
        return 'bottom-16 left-6';
      case 'top-right':
      default:
        return 'top-6 right-6';
    }
  };

  // Watermark size classes
  const getLogoSizeClass = () => {
    switch (config.logoSize) {
      case 'small':
        return 'h-8 sm:h-10';
      case 'large':
        return 'h-16 sm:h-20';
      case 'medium':
      default:
        return 'h-11 sm:h-14';
    }
  };

  // Ticker speed duration
  const getTickerDuration = () => {
    switch (config.tickerSpeed) {
      case 'fast':
        return '18s';
      case 'slow':
        return '35s';
      case 'normal':
      default:
        return '25s';
    }
  };

  const activeYtId = currentItem?.type === 'youtube'
    ? (currentItem.youtubeId || extractYouTubeVideoId(currentItem.url) || 'jfKfPfyJRdk')
    : null;

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden select-none pointer-events-auto">
      {/* =========================================================================
          1. BROADCAST TIMELINE ACTIVE ITEM RENDERER
         ========================================================================= */}
      
      {/* Fallback if no timeline items */}
      {(!currentItem || timelineItems.length === 0) && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-radial from-slate-900 to-black text-slate-400 gap-4 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">DABIN.Tv Channel Studio</h2>
          <p className="text-sm max-w-md text-slate-400">
            شریتی تایملاین بەتاڵە. تکایە لە ئەدمین پانێڵ &gt; ڕێکخستنی کەناڵی DABIN ڤیدیۆ، وێنە یان لینکی یوتیوب زیاد بکە.
          </p>
        </div>
      )}

      {/* A. VIDEO ITEM (Uploaded file or Direct URL) */}
      {currentItem && currentItem.type === 'video' && (
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          {resolvedBlobUrl ? (
            <video
              ref={videoRef}
              key={resolvedBlobUrl}
              src={resolvedBlobUrl}
              autoPlay
              playsInline
              loop={timelineItems.length === 1 && config.isLoop}
              muted={isMuted}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">
              بارکردنی ڤیدیۆی پەخش...
            </div>
          )}
        </div>
      )}

      {/* B. IMAGE / PHOTO ITEM */}
      {currentItem && currentItem.type === 'image' && (
        <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
          {/* Blurred background image for full-screen ambiance */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110"
            style={{ backgroundImage: `url(${currentItem.url})` }}
          />
          {/* Foreground sharp image */}
          <img
            key={currentItem.id || currentItem.url}
            src={currentItem.url}
            alt={currentItem.title || 'DABIN.Tv Broadcast'}
            className="relative z-10 w-full h-full object-contain p-4 animate-fade-in transition-all duration-700"
          />
        </div>
      )}

      {/* C. YOUTUBE BROADCAST ITEM */}
      {currentItem && currentItem.type === 'youtube' && activeYtId && (
        <div className="w-full h-full relative pointer-events-none overflow-hidden">
          <iframe
            key={activeYtId}
            src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${activeYtId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
            title={currentItem.title || 'DABIN.Tv Channel Stream'}
            className="w-full h-full border-0 pointer-events-auto scale-105"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* =========================================================================
          2. CHANNEL WATERMARK LOGO OVERLAY ("لۆگۆی کەناڵەکە لەلایەک بێت")
         ========================================================================= */}
      {config.showLogoOverlay && (
        <div 
          className={`absolute ${getLogoPositionClass()} z-30 pointer-events-none transition-all duration-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]`}
          style={{ opacity: config.logoOpacity ?? 0.95 }}
        >
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/35 backdrop-blur-md border border-white/10 shadow-lg">
            <img
              src={config.customLogoUrl || '/dabin-logo.png'}
              alt="DABIN.Tv"
              className={`${getLogoSizeClass()} w-auto object-contain`}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          3. SUBTLE ON-AIR TOAST (Appears briefly when item switches)
         ========================================================================= */}
      {currentItem && showItemNotice && (
        <div className="absolute top-6 left-6 z-30 pointer-events-none flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-xl animate-fade-in transition-opacity duration-500">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">DABIN ON-AIR • پەخش</span>
            <span className="text-xs font-semibold text-white/95 max-w-[240px] truncate">{currentItem.title}</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white/70">
            {safeIndex + 1}/{timelineItems.length}
          </span>
        </div>
      )}

      {/* =========================================================================
          4. LIVE ANNOUNCEMENT TICKER / MARQUEE BAR ("شریتی ئاگەداری دابنێ")
         ========================================================================= */}
      {config.showTicker && config.tickerText && (
        <div 
          className="absolute bottom-0 inset-x-0 z-30 h-10 sm:h-12 border-t border-white/15 flex items-center shadow-[0_-8px_25px_rgba(0,0,0,0.7)] backdrop-blur-xl pointer-events-none overflow-hidden"
          style={{ backgroundColor: config.tickerBgColor || 'rgba(2, 6, 23, 0.85)' }}
        >
          {/* Glowing News Badge */}
          <div className="relative z-10 px-3 sm:px-4 h-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center gap-1.5 text-white font-black text-xs sm:text-sm tracking-wide shrink-0 border-l border-white/20 shadow-md">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>{config.tickerBadgeText || 'ئاگاداری'}</span>
          </div>

          {/* Continuous Smooth Scrolling Ticker Text */}
          <div className="relative flex-1 overflow-hidden h-full flex items-center">
            <div 
              className="whitespace-nowrap flex items-center gap-12 font-medium text-xs sm:text-sm tracking-wider"
              style={{
                color: config.tickerTextColor || '#ffffff',
                animation: `dabinMarqueeRTL ${getTickerDuration()} linear infinite`
              }}
            >
              <span>{config.tickerText}</span>
              <span className="opacity-40">•</span>
              <span>{config.tickerText}</span>
              <span className="opacity-40">•</span>
              <span>{config.tickerText}</span>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Marquee Scrolling */}
      <style>{`
        @keyframes dabinMarqueeRTL {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
