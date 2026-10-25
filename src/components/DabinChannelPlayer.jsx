import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  getDabinBroadcastConfig, 
  extractYouTubeVideoId,
  formatBroadcastTime,
  syncBroadcastConfigFromCloud,
  subscribeToKobinBroadcastChannel,
  KOBIN_BRAND_PROMO_STREAM_URL
} from '../data/dabinBroadcastManager';
import { getApiBaseUrl } from '../data/dabinRealtimeService';
import { getMediaBlob } from '../data/dabinMediaStorage';
import { Radio } from 'lucide-react';

/**
 * KOBIN.Tv Channel Real-Time Broadcast Player (True 100% Playout Playout Engine)
 * 
 * Features:
 * 1. True 100% Native Playout via HTML5 onEnded:
 *    - Zero premature cutoffs, zero wall-clock skip timers, and zero 25s drift interruptions.
 *    - Videos play from start to finish naturally just like real TV broadcast.
 * 2. 10-Second Preloading for Zero-Gap Playout:
 *    - In the last 10 seconds of playback, the next stream is pre-warmed in the background.
 * 3. Dedicated Brand Promo Stream:
 *    - Plays standalone promo seamlessly without Vercel live serverless limits.
 * 4. Channel Watermark Logo Overlay & Bottom Live Ticker Bar.
 */
export default function DabinChannelPlayer({ 
  isMuted = false, 
  volume = 100,
  aspectRatioMode = 'fit'
}) {
  const [config, setConfig] = useState(getDabinBroadcastConfig);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState(null);
  const [showItemNotice, setShowItemNotice] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  // Direct Extractor State for YouTube
  const [extractedStream, setExtractedStream] = useState(null);
  const [isResolvingStream, setIsResolvingStream] = useState(false);
  const [extractorFailed, setExtractorFailed] = useState(false);
  const [preloadedNextUrl, setPreloadedNextUrl] = useState(null);

  // References
  const videoRef = useRef(null);
  const preloadVideoRef = useRef(null);
  const audioRef = useRef(null);
  const ytIframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const createdObjectUrlRef = useRef(null);
  const imageTimerRef = useRef(null);
  const ytTransitionTimerRef = useRef(null);
  const [isYtTransitioning, setIsYtTransitioning] = useState(true);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Dynamic aspect ratio calculation
  const getPlayerAspectClass = () => {
    switch (aspectRatioMode) {
      case 'stretch':
        return 'w-full h-full !object-fill [object-fit:fill] scale-100';
      case 'zoom':
        return 'w-full h-full !object-cover [object-fit:cover] scale-115';
      case '16:9':
        return 'aspect-video w-full max-h-full mx-auto !object-contain scale-100';
      case '4:3':
        return 'aspect-[4/3] max-w-[133.33vh] h-full mx-auto !object-contain scale-100';
      case 'fit':
      default:
        return 'w-full h-full !object-contain [object-fit:contain] scale-100';
    }
  };

  const getYtAspectClass = () => {
    switch (aspectRatioMode) {
      case 'zoom':
        return 'w-full h-full scale-[1.32] pointer-events-none';
      case '4:3':
        return 'aspect-[4/3] max-w-[133.33vh] h-full mx-auto scale-[1.18] pointer-events-none';
      case '16:9':
        return 'aspect-video w-full max-h-full mx-auto scale-[1.18] pointer-events-none';
      case 'stretch':
        return 'w-full h-full scale-x-[1.20] scale-y-[1.25] pointer-events-none';
      case 'fit':
      default:
        return 'w-full h-full scale-[1.18] pointer-events-none';
    }
  };

  const sanitizeBroadcastTitle = (rawTitle = '') => {
    if (!rawTitle) return 'پەخشی ڕاستەوخۆ - KOBIN.Tv';
    let clean = String(rawTitle)
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/www\.[^\s]+/gi, '')
      .replace(/\b(youtube|youtu\.be|embed)\b/gi, '')
      .replace(/\([a-zA-Z0-9_-]{11}\)/g, '')
      .replace(/[-|•_:\s]+$/g, '')
      .replace(/^[-|•_:\s]+/g, '')
      .trim();
    return clean || 'پەخشی کەناڵی KOBIN.Tv';
  };

  // Sync with Admin Studio changes in real time
  useEffect(() => {
    syncBroadcastConfigFromCloud().then(cloudCfg => {
      if (cloudCfg) {
        setConfig(cloudCfg);
      }
    }).catch(() => {});

    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setConfig(prev => ({ ...prev, ...e.detail }));
      }
    };
    const unsubBroadcastChannel = subscribeToKobinBroadcastChannel((msg) => {
      if (msg?.type === 'BROADCAST_CONFIG_UPDATED' && msg.payload) {
        setConfig(prev => ({ ...prev, ...msg.payload }));
      }
    });

    window.addEventListener('dabin_broadcast_updated', handleConfigUpdate);
    window.addEventListener('kobin_broadcast_updated', handleConfigUpdate);
    return () => {
      unsubBroadcastChannel();
      window.removeEventListener('dabin_broadcast_updated', handleConfigUpdate);
      window.removeEventListener('kobin_broadcast_updated', handleConfigUpdate);
    };
  }, []);

  const timelineItems = config.timelineItems || [];
  const currentItem = timelineItems.length > 0 ? timelineItems[currentIndex % timelineItems.length] : null;
  const nextItem = timelineItems.length > 1 ? timelineItems[(currentIndex + 1) % timelineItems.length] : null;

  // Move to next program in playlist
  const advanceToNextProgram = useCallback(() => {
    if (timelineItems.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % timelineItems.length);
    setCurrentTimeSec(0);
    setDurationSec(0);
  }, [timelineItems.length]);

  // Handle image timer
  useEffect(() => {
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    if (currentItem?.type === 'image') {
      const displayMs = Math.max(5, currentItem.duration || 15) * 1000;
      imageTimerRef.current = setTimeout(() => {
        advanceToNextProgram();
      }, displayMs);
    }
    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [currentItem?.id, currentItem?.type, currentItem?.duration, advanceToNextProgram]);

  // Toast notice whenever active program changes
  useEffect(() => {
    setShowItemNotice(true);
    const timer = setTimeout(() => setShowItemNotice(false), 4500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // YouTube Stream Resolver
  const activeYtId = currentItem?.type === 'youtube'
    ? (currentItem.youtubeId || extractYouTubeVideoId(currentItem.url) || 'pKaijJRxRM8')
    : null;

  useEffect(() => {
    let isCancelled = false;

    if (currentItem?.type !== 'youtube' || !activeYtId) {
      setExtractedStream(null);
      setExtractorFailed(false);
      setIsResolvingStream(false);
      return;
    }

    setIsResolvingStream(true);
    setExtractorFailed(false);
    setIsYtTransitioning(true);

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/stream/youtube-resolve?videoId=${encodeURIComponent(activeYtId)}`)
      .then(res => res.json())
      .then(data => {
        if (isCancelled) return;
        if (data && data.success && data.streamUrl) {
          setExtractedStream(data);
          setExtractorFailed(false);
        } else {
          setExtractedStream(null);
          setExtractorFailed(true);
        }
      })
      .catch(err => {
        if (isCancelled) return;
        console.warn('[KobinPlayer] YouTube backend extractor fallback:', err.message);
        setExtractedStream(null);
        setExtractorFailed(true);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsResolvingStream(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeYtId, currentItem?.type]);

  // Resolve IndexedDB blob for local video uploads
  useEffect(() => {
    let isCancelled = false;

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
          console.warn('[KobinPlayer] Could not retrieve blob from IndexedDB:', err);
        }
      }

      if (!isCancelled && currentItem.type === 'video') {
        const streamUrl = currentItem.url || KOBIN_BRAND_PROMO_STREAM_URL;
        setResolvedBlobUrl(streamUrl);
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
  }, [currentItem?.id, currentItem?.url, currentItem?.type, currentItem?.isLocalUpload]);

  // Video metadata loaded: start playout cleanly
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDurationSec(videoRef.current.duration || 0);
    try {
      const p = videoRef.current.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
    if (audioRef.current) {
      try {
        const ap = audioRef.current.play();
        if (ap && ap.catch) ap.catch(() => {});
      } catch (e) {}
    }
  };

  // 10-Second Preloading for Zero-Gap Playout
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime || 0;
    const dur = videoRef.current.duration || 0;
    setCurrentTimeSec(cur);

    if (audioRef.current) {
      const aTime = audioRef.current.currentTime;
      if (Math.abs(cur - aTime) > 0.3) {
        audioRef.current.currentTime = cur;
      }
    }

    // Preload next stream if within last 10 seconds of program
    if (dur > 15 && cur >= dur - 10 && nextItem && nextItem.type === 'video') {
      const nextUrl = nextItem.url || KOBIN_BRAND_PROMO_STREAM_URL;
      if (preloadedNextUrl !== nextUrl) {
        setPreloadedNextUrl(nextUrl);
      }
    }
  };

  // HTML5 onEnded: instantly advance to next program without gap!
  const handleVideoEnded = () => {
    advanceToNextProgram();
  };

  const handleVideoError = (e) => {
    console.warn('[KobinPlayer] Video error encountered, advancing to next item:', e);
    setTimeout(() => {
      advanceToNextProgram();
    }, 1500);
  };

  // Watermark position & size
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

  const getTickerDuration = () => {
    switch (config.tickerSpeed) {
      case 'ultra_fast':
        return '10s';
      case 'fast':
        return '16s';
      case 'slow':
        return '40s';
      case 'normal':
      default:
        return '25s';
    }
  };

  const getTickerStyleDetails = () => {
    switch (config.tickerStyle) {
      case 'breaking_red':
        return {
          containerClass: 'bg-red-950/90 border-t-2 border-red-500 shadow-[0_-5px_25px_rgba(239,68,68,0.5)]',
          badgeClass: 'bg-red-600 text-white animate-pulse',
          textColor: '#fee2e2',
          dotColor: 'bg-white'
        };
      case 'minimal_dark':
        return {
          containerClass: 'bg-black/85 border-t border-white/10',
          badgeClass: 'bg-white/10 text-white border border-white/20',
          textColor: '#f1f5f9',
          dotColor: 'bg-white'
        };
      case 'sapphire_blue':
        return {
          containerClass: 'bg-blue-950/90 border-t-2 border-cyan-400 shadow-[0_-5px_25px_rgba(6,182,212,0.4)]',
          badgeClass: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white',
          textColor: '#e0f2fe',
          dotColor: 'bg-cyan-300'
        };
      case 'fluent_slate':
        return {
          containerClass: 'bg-slate-900/90 border-t border-slate-700',
          badgeClass: 'bg-slate-800 text-amber-400 border border-amber-400/30',
          textColor: '#f8fafc',
          dotColor: 'bg-amber-400'
        };
      case 'modern_glass':
      default:
        return {
          containerClass: 'bg-slate-950/80 border-t border-white/15 backdrop-blur-2xl shadow-[0_-5px_30px_rgba(0,0,0,0.8)]',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30',
          textColor: '#ffffff',
          dotColor: 'bg-cyan-400'
        };
    }
  };

  const getTickerFontClass = () => {
    switch (config.tickerFont) {
      case 'cairo':
        return 'font-[\'Cairo\',sans-serif]';
      case 'kufi':
        return 'font-[\'Noto_Sans_Arabic\',sans-serif]';
      case 'rabat':
        return 'font-[\'Readex_Pro\',sans-serif]';
      case 'tahoma':
        return 'font-sans';
      case 'vazirmatn':
      default:
        return 'font-[\'Vazirmatn\',sans-serif]';
    }
  };

  const tickerStyle = getTickerStyleDetails();

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden select-none pointer-events-auto">
      {/* 1. BROADCAST PROGRAM RENDERER */}
      {(!currentItem || timelineItems.length === 0) && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-radial from-slate-900 to-black text-slate-400 gap-4 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">KOBIN.Tv Channel Studio</h2>
          <p className="text-sm max-w-md text-slate-400">
            شریتی پەخشی ڕاستەوخۆ بەتاڵە. تکایە لە ئەدمین پانێڵ &gt; پەخشی کەناڵی کۆبین بەرنامە دابنێ.
          </p>
        </div>
      )}

      {/* A. DIRECT LOCAL OR URL VIDEO (100% Native Playout) */}
      {currentItem && currentItem.type === 'video' && (
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          {resolvedBlobUrl ? (
            <video
              ref={videoRef}
              key={resolvedBlobUrl}
              src={resolvedBlobUrl}
              autoPlay
              playsInline
              muted={isMuted}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              className={`transition-all duration-300 ${getPlayerAspectClass()}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse font-mono text-sm">
              هاوکاتکردنی پەخشی ڕاستەوخۆی کەناڵی KOBIN TV...
            </div>
          )}
        </div>
      )}

      {/* B. IMAGE PROGRAM */}
      {currentItem && currentItem.type === 'image' && (
        <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110"
            style={{ backgroundImage: `url(${currentItem.url})` }}
          />
          <img
            key={currentItem.id || currentItem.url}
            src={currentItem.url}
            alt={currentItem.title || 'KOBIN.Tv Broadcast'}
            className={`relative z-10 transition-all duration-300 p-2 ${getPlayerAspectClass()}`}
          />
        </div>
      )}

      {/* C. YOUTUBE PROGRAM - MODE 1: NATIVE DIRECT STREAM PLAYBACK */}
      {currentItem && currentItem.type === 'youtube' && extractedStream && !extractorFailed && (
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            key={extractedStream.streamUrl}
            src={extractedStream.format !== 'hls' ? extractedStream.streamUrl : undefined}
            autoPlay
            playsInline
            muted={isMuted}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            className={`transition-all duration-300 ${getPlayerAspectClass()}`}
          />
          {extractedStream.audioUrl && (
            <audio
              ref={audioRef}
              key={extractedStream.audioUrl}
              src={extractedStream.audioUrl}
              autoPlay
              muted={isMuted}
              preload="auto"
            />
          )}
        </div>
      )}

      {/* C. YOUTUBE PROGRAM - MODE 2: FALLBACK IFRAME */}
      {currentItem && currentItem.type === 'youtube' && (extractorFailed || isResolvingStream) && (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-black select-none">
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden pointer-events-none select-none">
            <iframe
              ref={ytIframeRef}
              id="kobin-yt-iframe"
              key={activeYtId}
              src={`https://www.youtube-nocookie.com/embed/${activeYtId}?enablejsapi=1&autoplay=1&mute=${isMuted ? 1 : 0}&start=0&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&loop=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
              title="KOBIN.Tv Broadcast Stream"
              onLoad={() => {
                try {
                  const win = ytIframeRef.current?.contentWindow;
                  if (win) {
                    win.postMessage(JSON.stringify({ event: 'command', func: 'setPlaybackQuality', args: ['hd1080'] }), '*');
                    win.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
                  }
                } catch(e) {}
                if (ytTransitionTimerRef.current) clearTimeout(ytTransitionTimerRef.current);
                ytTransitionTimerRef.current = setTimeout(() => {
                  setIsYtTransitioning(false);
                }, 1000);
              }}
              className={`border-0 pointer-events-none select-none transition-transform duration-300 ${getYtAspectClass()}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="absolute inset-0 z-20 pointer-events-auto cursor-default bg-transparent" />
        </div>
      )}

      {/* Background Preloader for Next Stream (Zero-Gap Playout) */}
      {preloadedNextUrl && (
        <video
          ref={preloadVideoRef}
          src={preloadedNextUrl}
          preload="auto"
          muted
          className="hidden pointer-events-none"
        />
      )}

      {/* 2. CHANNEL WATERMARK LOGO OVERLAY */}
      {config.showLogoOverlay && (
        <div 
          className={`absolute ${getLogoPositionClass()} z-30 pointer-events-none transition-all duration-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]`}
          style={{ opacity: config.logoOpacity ?? 0.95 }}
        >
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/35 backdrop-blur-md border border-white/10 shadow-lg">
            <img
              src={config.customLogoUrl || '/kobin-logo.png'}
              alt="KOBIN.Tv"
              className={`${getLogoSizeClass()} w-auto object-contain`}
            />
          </div>
        </div>
      )}

      {/* 3. REAL-TIME ON-AIR TOAST */}
      {currentItem && showItemNotice && (
        <div className="absolute top-6 left-6 z-30 pointer-events-none flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-white shadow-2xl animate-fade-in transition-all duration-500">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-600/30 border border-cyan-500/40 text-[10px] font-black text-cyan-300 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>KOBIN ON-AIR</span>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-white max-w-[260px] truncate">
              {sanitizeBroadcastTitle(currentItem.title)}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5 font-mono">
              <span>{formatBroadcastTime(currentTimeSec)} / {formatBroadcastTime(durationSec || currentItem.duration || 0)}</span>
              {nextItem && (
                <span className="text-slate-400 font-sans truncate max-w-[140px]">
                  • دوای ئەمە: {sanitizeBroadcastTitle(nextItem.title)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. LIVE ANNOUNCEMENT TICKER */}
      {config.showTicker && config.tickerText && (
        <div 
          className={`absolute bottom-0 inset-x-0 z-30 h-10 sm:h-12 flex items-center shadow-[0_-8px_25px_rgba(0,0,0,0.7)] backdrop-blur-xl pointer-events-none overflow-hidden ${tickerStyle.containerClass}`}
          style={config.tickerBgColor ? { backgroundColor: config.tickerBgColor } : {}}
        >
          <div className={`relative z-10 px-3 sm:px-4 h-full flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm tracking-wide shrink-0 shadow-md ${tickerStyle.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${tickerStyle.dotColor} animate-ping`} />
            <span>{config.tickerBadgeText || 'ئاگاداری'}</span>
          </div>

          <div className="relative flex-1 overflow-hidden h-full flex items-center">
            <div 
              className={`whitespace-nowrap flex items-center gap-12 font-medium text-xs sm:text-sm tracking-wider ${getTickerFontClass()}`}
              style={{
                color: tickerStyle.textColor,
                animation: `kobinMarqueeRTL ${getTickerDuration()} linear infinite`
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

      <style>{`
        @keyframes kobinMarqueeRTL {
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
