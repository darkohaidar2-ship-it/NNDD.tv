import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getDabinBroadcastConfig, 
  extractYouTubeVideoId,
  calculateCurrentBroadcastState,
  formatBroadcastTime
} from '../data/dabinBroadcastManager';
import { getMediaBlob } from '../data/dabinMediaStorage';
import { Sparkles, Radio } from 'lucide-react';

/**
 * DABIN.Tv Channel Real-Time Linear TV Player
 * 
 * Functions strictly as an authentic broadcast TV station:
 * - Does NOT restart videos from 00:00 when viewer tunes in ("با وەک کانڵێک وابێت فیدیۆکە ، نەک کە چوە سەری انجا فیدیۆکە پلەی بکات")
 * - Synchronized to the Master Broadcast Clock controlled from Admin Panel
 * - Plays at the exact current live second into the scheduled program
 * - Automatically advances to the next program when scheduled time arrives
 * - Channel Watermark Logo Overlay & Bottom Live Ticker Bar
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

  const videoRef = useRef(null);
  const ytIframeRef = useRef(null);
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

  const getYtAspectClass = () => {
    // We scale the YouTube iframe by at least 1.38x to completely crop off
    // YouTube's top title/channel banner and bottom YouTube watermark logo
    // ("با لە پەخشدا بە هیچ جۆرێ ناوی چەناڵێ یوتوبەکە و لینکەکەی دەرنەکەوێ")
    switch (aspectRatioMode) {
      case 'zoom':
        return 'w-full h-full scale-[1.55] pointer-events-none';
      case '4:3':
        return 'aspect-[4/3] max-w-[133.33vh] h-full mx-auto scale-[1.38] pointer-events-none';
      case '16:9':
        return 'aspect-video w-full max-h-full mx-auto scale-[1.38] pointer-events-none';
      case 'stretch':
        return 'w-full h-full scale-x-[1.4] scale-y-[1.45] pointer-events-none';
      case 'fit':
      default:
        return 'w-full h-full scale-[1.38] pointer-events-none';
    }
  };

  /**
   * Sanitize broadcast item title so that NO YouTube channel names,
   * video IDs, URLs, or external branding ever appear in TV HUD / toasts.
   */
  const sanitizeBroadcastTitle = (rawTitle = '') => {
    if (!rawTitle) return 'پەخشی ڕاستەوخۆ - DABIN.Tv';
    let clean = String(rawTitle)
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/www\.[^\s]+/gi, '')
      .replace(/\b(youtube|youtu\.be|embed)\b/gi, '')
      .replace(/\([a-zA-Z0-9_-]{11}\)/g, '')
      .replace(/[-|•_:\s]+$/g, '')
      .replace(/^[-|•_:\s]+/g, '')
      .trim();
    return clean || 'پەخشی کەناڵی DABIN.Tv';
  };

  // Sync with Admin Studio changes in real time
  useEffect(() => {
    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
        const newState = calculateCurrentBroadcastState(e.detail);
        setLiveState(newState);
        pendingSeekRef.current = newState.seekSeconds;
      }
    };
    window.addEventListener('dabin_broadcast_updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('dabin_broadcast_updated', handleConfigUpdate);
    };
  }, []);

  // Sync to master broadcast clock
  const syncToCurrentLiveBroadcast = useCallback(() => {
    const state = calculateCurrentBroadcastState(config);
    setLiveState(state);
    pendingSeekRef.current = state.seekSeconds;

    if (videoRef.current && state.currentItem?.type === 'video') {
      const dur = videoRef.current.duration;
      const targetSeek = dur && !isNaN(dur) 
        ? Math.min(state.seekSeconds, dur - 0.5) 
        : state.seekSeconds;
      
      // If drift is more than 2 seconds, resync
      if (Math.abs(videoRef.current.currentTime - targetSeek) > 2) {
        videoRef.current.currentTime = Math.max(0, targetSeek);
      }
      videoRef.current.play().catch(() => {});
    }
  }, [config]);

  // Set up timer for when the currently airing program ends and next starts
  useEffect(() => {
    if (!liveState || !liveState.currentItem) return;

    if (nextProgramTimerRef.current) {
      clearTimeout(nextProgramTimerRef.current);
    }

    const waitMs = Math.max(500, (liveState.remainingSeconds || 10) * 1000);
    nextProgramTimerRef.current = setTimeout(() => {
      syncToCurrentLiveBroadcast();
    }, waitMs);

    return () => {
      if (nextProgramTimerRef.current) {
        clearTimeout(nextProgramTimerRef.current);
      }
    };
  }, [liveState.itemIndex, liveState.remainingSeconds, syncToCurrentLiveBroadcast]);

  // Periodic drift check & page visibility return check (e.g. switching back to tab/channel)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncToCurrentLiveBroadcast();
      }
    };

    const interval = setInterval(() => {
      syncToCurrentLiveBroadcast();
    }, 25000); // Check every 25 seconds for network / background clock drift

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

  const currentItem = liveState.currentItem;
  const timelineItems = config.timelineItems || [];

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
  }, [currentItem?.id, currentItem?.url, currentItem?.type, currentItem?.isLocalUpload]);

  // Update volume & muted on internal HTML5 video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [isMuted, volume, liveState.itemIndex, resolvedBlobUrl]);

  // When video metadata loads, perform the live broadcast instant seek
  const handleLoadedMetadata = (e) => {
    const video = e.target;
    if (!video) return;

    video.muted = isMuted;
    video.volume = isMuted ? 0 : volume / 100;

    const targetSeek = pendingSeekRef.current || liveState.seekSeconds || 0;
    if (targetSeek > 0) {
      const safeSeek = video.duration && !isNaN(video.duration)
        ? Math.min(targetSeek, Math.max(0, video.duration - 0.5))
        : targetSeek;
      video.currentTime = safeSeek;
    }

    video.play().catch(() => {});
  };

  // Video ended callback
  const handleVideoEnded = () => {
    syncToCurrentLiveBroadcast();
  };

  // Video error fallback
  const handleVideoError = (e) => {
    console.warn('[DabinPlayer] Video error on item:', currentItem?.title, e);
    const timeout = setTimeout(() => {
      syncToCurrentLiveBroadcast();
    }, 2500);
    return () => clearTimeout(timeout);
  };

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

  const ytSeekSeconds = Math.floor(liveState.seekSeconds || 0);

  // Smooth Broadcast Curtain for YouTube Transitions (Eliminates YouTube Play Button & Thumbnail Flash)
  useEffect(() => {
    if (currentItem?.type === 'youtube' && activeYtId) {
      setIsYtTransitioning(true);
      if (ytTransitionTimerRef.current) clearTimeout(ytTransitionTimerRef.current);
      ytTransitionTimerRef.current = setTimeout(() => {
        setIsYtTransitioning(false);
      }, 1500);
    } else {
      setIsYtTransitioning(false);
    }
    return () => {
      if (ytTransitionTimerRef.current) clearTimeout(ytTransitionTimerRef.current);
    };
  }, [activeYtId]);


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
          <h2 className="text-xl font-bold text-white">DABIN.Tv Channel Studio</h2>
          <p className="text-sm max-w-md text-slate-400">
            شریتی پەخشی ڕاستەوخۆ بەتاڵە. تکایە لە ئەدمین پانێڵ &gt; ڕێکخستنی کەناڵی دابین پەخش دابنێ.
          </p>
        </div>
      )}

      {/* A. VIDEO PROGRAM (Live Seek Positioned) */}
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
              هاوکاتکردنی پەخشی ڕاستەوخۆ لەگەڵ کاتی کەناڵ...
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
            alt={currentItem.title || 'DABIN.Tv Broadcast'}
            className={`relative z-10 transition-all duration-300 p-2 ${getPlayerAspectClass()}`}
          />
        </div>
      )}

      {/* C. YOUTUBE PROGRAM (Live Seek Positioned - Highest 1080p/4K Quality, Zero YouTube Branding or Play Button) */}
      {currentItem && currentItem.type === 'youtube' && activeYtId && (
        <div className="w-full h-full relative flex items-center justify-center pointer-events-none overflow-hidden bg-black">
          {/* Main Cropped Viewport */}
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden pointer-events-none">
            <iframe
              ref={ytIframeRef}
              key={activeYtId}
              src={`https://www.youtube-nocookie.com/embed/${activeYtId}?autoplay=1&mute=${isMuted ? 1 : 0}&start=${ytSeekSeconds}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&vq=hd1080&hd=1&high_res=1&enablejsapi=1`}
              title="DABIN.Tv Broadcast Stream"
              onLoad={() => {
                try {
                  const win = ytIframeRef.current?.contentWindow;
                  if (win) {
                    win.postMessage(JSON.stringify({ event: 'command', func: 'setPlaybackQuality', args: ['hd1080'] }), '*');
                    win.postMessage(JSON.stringify({ event: 'command', func: 'setPlaybackQualityRange', args: ['hd1080', 'highres'] }), '*');
                  }
                } catch(e) {}
                if (ytTransitionTimerRef.current) clearTimeout(ytTransitionTimerRef.current);
                ytTransitionTimerRef.current = setTimeout(() => {
                  setIsYtTransitioning(false);
                }, 1100);
              }}
              className={`border-0 pointer-events-none select-none transition-transform duration-300 ${getYtAspectClass()}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Edge Vignette Masks: Eliminates any top title or bottom watermark bleed */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10" />

          {/* Cinema Broadcast Transition Curtain (Hides YouTube Play Button & Video Thumbnail During Switches) */}
          <div 
            className={`absolute inset-0 bg-black flex flex-col items-center justify-center transition-opacity duration-700 pointer-events-none z-20 ${
              isYtTransitioning ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <img 
                src="/dabin-logo.png" 
                alt="DABIN.Tv" 
                className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-[0_0_24px_rgba(6,182,212,0.5)] animate-pulse" 
              />
              <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[11px] font-bold text-white tracking-widest font-mono">DABIN HD 1080p BROADCAST</span>
              </div>
            </div>
          </div>
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
