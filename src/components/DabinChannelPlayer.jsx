import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  getDabinBroadcastConfig, 
  extractYouTubeVideoId,
  calculateCurrentBroadcastState,
  formatBroadcastTime,
  syncBroadcastConfigFromCloud,
  subscribeToKobinBroadcastChannel
} from '../data/dabinBroadcastManager';
import { getApiBaseUrl } from '../data/dabinRealtimeService';
import { getMediaBlob } from '../data/dabinMediaStorage';
import { Sparkles, Radio, Phone, Send, MessageCircle } from 'lucide-react';

/**
 * KOBIN.Tv Channel Real-Time Linear TV Player (Upgraded YouTube Engine)
 * 
 * Features:
 * 1. Backend YouTube Direct Stream Extractor (Zero Ads, Native HTML5 <video> playback).
 * 2. Fallback IFrame "TV Shield" & Autoplay Unlocker:
 *    - Scale 1.18x cropping out all YouTube titles/watermarks.
 *    - Full-screen transparent overlay shield preventing clicks/pause.
 *    - Automatic end-screen prevention by transitioning 1s before video ends.
 *    - Official YouTube IFrame API integration with instant playVideo() & unMute().
 * 3. Master Broadcast Clock Synchronization & Continuous Linear TV Looping.
 * 4. Channel Watermark Logo Overlay & Bottom Live Ticker Bar (Multi-Style, Multi-Font, Multi-Speed).
 * 5. Center Screen Periodic Commercial / Promo Overlay with Packages & Contacts.
 */
export default function DabinChannelPlayer({ 
  isMuted = false, 
  volume = 100,
  aspectRatioMode = 'fit'
}) {
  const [config, setConfig] = useState(getDabinBroadcastConfig);
  const [liveState, setLiveState] = useState(() => calculateCurrentBroadcastState(getDabinBroadcastConfig()));
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState(null);
  const [showItemNotice, setShowItemNotice] = useState(true);

  // Periodic Center Promo Overlay State
  const [isPromoVisible, setIsPromoVisible] = useState(false);

  // Direct Extractor State for YouTube
  const [extractedStream, setExtractedStream] = useState(null);
  const [isResolvingStream, setIsResolvingStream] = useState(false);
  const [extractorFailed, setExtractorFailed] = useState(false);

  // References
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const ytIframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const hlsInstanceRef = useRef(null);
  const pendingSeekRef = useRef(0);
  const createdObjectUrlRef = useRef(null);
  const nextProgramTimerRef = useRef(null);
  const ytTransitionTimerRef = useRef(null);
  const [isYtTransitioning, setIsYtTransitioning] = useState(true);

  // Dynamic aspect ratio calculation based on yellow remote key
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

  // Scaled Fallback IFrame (1.18x) to crop out YouTube titles, share icons & watermarks
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

  /**
   * Sanitize broadcast item title so that NO external branding appears in TV HUD
   */
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

  // Sync with Admin Studio changes in real time & fetch cloud broadcast config on mount
  useEffect(() => {
    syncBroadcastConfigFromCloud().then(cloudCfg => {
      if (cloudCfg) {
        setConfig(cloudCfg);
        const newState = calculateCurrentBroadcastState(cloudCfg);
        setLiveState(newState);
        pendingSeekRef.current = newState.seekSeconds;
      }
    }).catch(() => {});

    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
        const newState = calculateCurrentBroadcastState(e.detail);
        setLiveState(newState);
        pendingSeekRef.current = newState.seekSeconds;
      }
    };
    const unsubBroadcastChannel = subscribeToKobinBroadcastChannel((msg) => {
      if (msg?.type === 'BROADCAST_CONFIG_UPDATED' && msg.payload) {
        setConfig(msg.payload);
        const newState = calculateCurrentBroadcastState(msg.payload);
        setLiveState(newState);
        pendingSeekRef.current = newState.seekSeconds;
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

  // Sync to master broadcast clock
  const syncToCurrentLiveBroadcast = useCallback(() => {
    const state = calculateCurrentBroadcastState(config);
    setLiveState(state);
    pendingSeekRef.current = state.seekSeconds;

    if (videoRef.current) {
      const dur = videoRef.current.duration;
      const targetSeek = dur && !isNaN(dur) 
        ? Math.min(state.seekSeconds, Math.max(0, dur - 0.5)) 
        : state.seekSeconds;
      
      if (Math.abs(videoRef.current.currentTime - targetSeek) > 2) {
        videoRef.current.currentTime = Math.max(0, targetSeek);
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, targetSeek);
        }
      }
      videoRef.current.play().catch(() => {});
      if (audioRef.current) audioRef.current.play().catch(() => {});
    }

    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(state.seekSeconds, true);
        ytPlayerRef.current.playVideo();
      } catch (e) {}
    }
  }, [config]);

  // Set up timer for program transition (Early 1s cutoff to prevent YouTube end-screens)
  useEffect(() => {
    if (!liveState || !liveState.currentItem) return;

    if (nextProgramTimerRef.current) {
      clearTimeout(nextProgramTimerRef.current);
    }

    const remaining = Math.max(1, (liveState.remainingSeconds || 10) - 1);
    const waitMs = remaining * 1000;

    nextProgramTimerRef.current = setTimeout(() => {
      syncToCurrentLiveBroadcast();
    }, waitMs);

    return () => {
      if (nextProgramTimerRef.current) {
        clearTimeout(nextProgramTimerRef.current);
      }
    };
  }, [liveState.itemIndex, liveState.remainingSeconds, syncToCurrentLiveBroadcast]);

  // Periodic drift check & page visibility return check
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncToCurrentLiveBroadcast();
      }
    };

    const interval = setInterval(() => {
      syncToCurrentLiveBroadcast();
    }, 25000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [syncToCurrentLiveBroadcast]);

  // Toast notice whenever active program changes
  useEffect(() => {
    setShowItemNotice(true);
    const timer = setTimeout(() => setShowItemNotice(false), 4500);
    return () => clearTimeout(timer);
  }, [liveState.itemIndex]);

  // =========================================================================
  // PERIODIC CENTER SCREEN PROMO OVERLAY TIMER
  // =========================================================================
  useEffect(() => {
    if (!config.showPromoOverlay) {
      setIsPromoVisible(false);
      return;
    }

    const intervalMinutes = Math.max(1, Number(config.promoIntervalMinutes) || 10);
    const displaySeconds = Math.max(4, Number(config.promoDisplaySeconds) || 12);
    const intervalMs = intervalMinutes * 60 * 1000;

    const timer = setInterval(() => {
      setIsPromoVisible(true);
      setTimeout(() => {
        setIsPromoVisible(false);
      }, displaySeconds * 1000);
    }, intervalMs);

    const handleTestTrigger = () => {
      setIsPromoVisible(true);
      setTimeout(() => {
        setIsPromoVisible(false);
      }, displaySeconds * 1000);
    };
    window.addEventListener('trigger_kobin_promo_test', handleTestTrigger);

    return () => {
      clearInterval(timer);
      window.removeEventListener('trigger_kobin_promo_test', handleTestTrigger);
    };
  }, [config.showPromoOverlay, config.promoIntervalMinutes, config.promoDisplaySeconds]);

  const currentItem = liveState.currentItem;
  const timelineItems = config.timelineItems || [];

  // =========================================================================
  // BACKEND YOUTUBE DIRECT STREAM RESOLVER (ZERO ADS & NATIVE PLAYBACK)
  // =========================================================================
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
  }, [currentItem?.id, currentItem?.url, currentItem?.type, currentItem?.isLocalUpload]);

  // Video metadata loaded
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    const targetSeek = dur && !isNaN(dur)
      ? Math.min(pendingSeekRef.current, Math.max(0, dur - 0.5))
      : pendingSeekRef.current;
    
    videoRef.current.currentTime = Math.max(0, targetSeek);
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, targetSeek);
    }
    videoRef.current.play().catch(() => {});
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !audioRef.current) return;
    const vTime = videoRef.current.currentTime;
    const aTime = audioRef.current.currentTime;
    if (Math.abs(vTime - aTime) > 0.3) {
      audioRef.current.currentTime = vTime;
    }
  };

  const handleVideoEnded = () => {
    syncToCurrentLiveBroadcast();
  };

  const handleVideoError = (e) => {
    console.warn('[KobinPlayer] HTML5 video error, resyncing:', e);
    setTimeout(() => {
      syncToCurrentLiveBroadcast();
    }, 1500);
  };

  const ytSeekSeconds = Math.max(0, Math.floor(pendingSeekRef.current));

  // Watermark position
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

  // Watermark size
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
      case 'ultra_fast':
        return '10s';
      case 'fast':
        return '16s';
      case 'slow':
        return '45s';
      case 'normal':
      default:
        return '25s';
    }
  };

  // Ticker design styles
  const getTickerStyleDetails = () => {
    switch (config.tickerStyle) {
      case 'breaking_red':
        return {
          containerClass: 'bg-[#2A0A10]/95 border-t border-red-500/40 text-[#FEF08A]',
          badgeClass: 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-l border-red-400/30',
          textColor: config.tickerTextColor || '#FEF08A',
          dotColor: 'bg-amber-400'
        };
      case 'minimal_dark':
        return {
          containerClass: 'bg-black/90 border-t border-white/20 text-white',
          badgeClass: 'bg-white text-slate-950 border-l border-white/30 font-black',
          textColor: config.tickerTextColor || '#FFFFFF',
          dotColor: 'bg-cyan-400'
        };
      case 'sapphire_blue':
        return {
          containerClass: 'bg-[#031533]/95 border-t border-sky-500/40 text-cyan-200',
          badgeClass: 'bg-gradient-to-r from-sky-600 to-blue-700 text-white border-l border-sky-400/30',
          textColor: config.tickerTextColor || '#BAE6FD',
          dotColor: 'bg-sky-400'
        };
      case 'fluent_slate':
        return {
          containerClass: 'bg-[#111726]/95 border-t border-[#2B3A56] text-slate-100',
          badgeClass: 'bg-[#0078D4] text-white border-l border-white/20',
          textColor: config.tickerTextColor || '#FFFFFF',
          dotColor: 'bg-emerald-400'
        };
      case 'modern_glass':
      default:
        return {
          containerClass: 'bg-slate-950/85 border-t border-cyan-500/30 text-white',
          badgeClass: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-l border-white/20',
          textColor: config.tickerTextColor || '#FFFFFF',
          dotColor: 'bg-white'
        };
    }
  };

  // Ticker font
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
      {/* =========================================================================
          1. REAL-TIME BROADCAST PROGRAM RENDERER
         ========================================================================= */}
      
      {/* Empty State */}
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

      {/* A. DIRECT LOCAL OR URL VIDEO (Live Seek Positioned) */}
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
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              className={`transition-all duration-300 ${getPlayerAspectClass()}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">
              هاوکاتکردنی پەخشی ڕاستەوخۆ لەگەڵ کاتی کەناڵی KOBIN.Tv...
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

      {/* C. YOUTUBE PROGRAM - MODE 1: NATIVE DIRECT STREAM PLAYBACK (100% Zero Ads & Native Video) */}
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

      {/* C. YOUTUBE PROGRAM - MODE 2: FALLBACK IFRAME "TV SHIELD" & AUTOPLAY UNLOCKER */}
      {currentItem && currentItem.type === 'youtube' && (extractorFailed || isResolvingStream) && (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-black select-none">
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden pointer-events-none select-none">
            <iframe
              ref={ytIframeRef}
              id="kobin-yt-iframe"
              key={activeYtId}
              src={`https://www.youtube-nocookie.com/embed/${activeYtId}?enablejsapi=1&autoplay=1&mute=${isMuted ? 1 : 0}&start=${ytSeekSeconds}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&loop=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
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

          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10" />

          <div 
            className="absolute inset-0 z-20 pointer-events-auto cursor-default bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      )}

      {/* Cinema Broadcast Transition Curtain */}
      <div 
        className={`absolute inset-0 bg-black flex flex-col items-center justify-center transition-opacity duration-700 pointer-events-none z-25 ${
          isYtTransitioning && currentItem?.type === 'youtube' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <img 
            src="/kobin-logo.png" 
            alt="KOBIN.Tv" 
            className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-[0_0_24px_rgba(6,182,212,0.5)] animate-pulse" 
          />
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-bold text-white tracking-widest font-mono">
              {isResolvingStream ? 'OPTIMIZING DIRECT TV STREAM' : 'KOBIN HD 1080p BROADCAST'}
            </span>
          </div>
        </div>
      </div>

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
              src={config.customLogoUrl || '/kobin-logo.png'}
              alt="KOBIN.Tv"
              className={`${getLogoSizeClass()} w-auto object-contain`}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          3. REAL-TIME ON-AIR TOAST (Clean Authentic Live TV Schedule Info)
         ========================================================================= */}
      {currentItem && showItemNotice && (
        <div className="absolute top-6 left-6 z-30 pointer-events-none flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-white shadow-2xl animate-fade-in transition-all duration-500">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/30 border border-red-500/40 text-[10px] font-black text-red-300 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>LIVE TV</span>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-white max-w-[260px] truncate">
              {sanitizeBroadcastTitle(currentItem.title)}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5 font-mono">
              <span>{formatBroadcastTime(liveState.seekSeconds)} / {formatBroadcastTime(liveState.itemDuration)}</span>
              {liveState.nextItem && (
                <span className="text-slate-400 font-sans truncate max-w-[140px]">
                  • دوای ئەمە: {sanitizeBroadcastTitle(liveState.nextItem.title)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. LIVE ANNOUNCEMENT TICKER (Multi-Style, Multi-Font, Multi-Speed)
         ========================================================================= */}
      {config.showTicker && config.tickerText && (
        <div 
          className={`absolute bottom-0 inset-x-0 z-30 h-10 sm:h-12 flex items-center shadow-[0_-8px_25px_rgba(0,0,0,0.7)] backdrop-blur-xl pointer-events-none overflow-hidden ${tickerStyle.containerClass}`}
          style={config.tickerBgColor ? { backgroundColor: config.tickerBgColor } : {}}
        >
          {/* Glowing News Badge */}
          <div className={`relative z-10 px-3 sm:px-4 h-full flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm tracking-wide shrink-0 shadow-md ${tickerStyle.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${tickerStyle.dotColor} animate-ping`} />
            <span>{config.tickerBadgeText || 'ئاگاداری'}</span>
          </div>

          {/* Continuous Smooth Scrolling Ticker Text */}
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

      {/* =========================================================================
          5. PERIODIC CENTER SCREEN COMMERCIAL / PROMO OVERLAY ("لە نیوەی شاشەکە بە گەورەیی")
         ========================================================================= */}
      {isPromoVisible && config.showPromoOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in pointer-events-auto" dir="rtl">
          <div className="relative max-w-2xl w-full rounded-3xl bg-gradient-to-br from-[#070B14] via-[#0E1526] to-[#040711] border-2 border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.35)] text-center space-y-5 animate-scale-up overflow-hidden">
            
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setIsPromoVisible(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center text-xs font-bold"
              title="داخستن"
            >
              ✕
            </button>

            {/* Prominent Large KOBIN.Tv Logo */}
            <div className="flex flex-col items-center justify-center gap-2">
              <img
                src={config.customLogoUrl || '/kobin-logo.png'}
                alt="KOBIN.Tv"
                className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-[0_0_25px_rgba(2,132,199,0.5)] animate-pulse"
              />
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide mt-1">
                {config.promoTitle || 'KOBIN.Tv - تایبەتمەندترین پلاتفۆرمی پەخشی کەناڵەکان'}
              </h3>
              <p className="text-xs text-cyan-300 max-w-lg">
                {config.promoSubtitle || 'بۆ بەشداریکردن و کاراکردنی کۆدی MAC پەیوەندی بە ڕیسێلەرەکانمانەوە بکەن'}
              </p>
            </div>

            {/* Subscription Packages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(config.promoPackages || []).map((pkg, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                    idx === 3 
                      ? 'bg-gradient-to-b from-amber-500/20 to-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(251,146,60,0.3)] ring-1 ring-amber-400/30' 
                      : 'bg-white/5 border-white/10 hover:border-cyan-400/40'
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                    {pkg.tag || 'پاکێج'}
                  </span>
                  <div className="text-xs font-black text-white">{pkg.name}</div>
                  <div className="text-sm font-mono font-black text-cyan-300 mt-1">{pkg.price}</div>
                </div>
              ))}
            </div>

            {/* Contact Methods Badges */}
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2 border-t border-white/10">
              {config.promoContactWhatsapp && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>واتسئاپ:</span>
                  <span dir="ltr">{config.promoContactWhatsapp}</span>
                </div>
              )}
              {config.promoContactPhone && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold font-mono">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span>تەلەفۆن:</span>
                  <span dir="ltr">{config.promoContactPhone}</span>
                </div>
              )}
              {config.promoContactTelegram && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold font-mono">
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>تێلیگرام:</span>
                  <span dir="ltr">{config.promoContactTelegram}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Global CSS for Marquee Scrolling */}
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
