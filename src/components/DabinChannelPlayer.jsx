import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  getDabinBroadcastConfig, 
  extractYouTubeVideoId,
  calculateCurrentBroadcastState,
  formatBroadcastTime
} from '../data/dabinBroadcastManager';
import { getMediaBlob } from '../data/dabinMediaStorage';
import { Sparkles, Radio } from 'lucide-react';

/**
 * DABIN.Tv Channel Real-Time Linear TV Player (Upgraded YouTube Engine)
 * 
 * Features:
 * 1. Backend YouTube Direct Stream Extractor (Zero Ads, Native HTML5 <video> playback).
 * 2. Fallback IFrame "TV Shield" & Autoplay Unlocker:
 *    - Scale 1.18x cropping out all YouTube titles/watermarks.
 *    - Full-screen transparent overlay shield preventing clicks/pause.
 *    - Automatic end-screen prevention by transitioning 1s before video ends.
 *    - Official YouTube IFrame API integration with instant playVideo() & unMute().
 * 3. Master Broadcast Clock Synchronization & Continuous Linear TV Looping.
 * 4. Channel Watermark Logo Overlay & Bottom Live Ticker Bar.
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

    if (videoRef.current) {
      const dur = videoRef.current.duration;
      const targetSeek = dur && !isNaN(dur) 
        ? Math.min(state.seekSeconds, Math.max(0, dur - 0.5)) 
        : state.seekSeconds;
      
      // If drift is more than 2 seconds, resync
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

    // Cut off 1 second early before video ends to completely prevent YouTube end-screen recommendations
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

    // Call Backend Direct Extractor
    fetch(`/api/stream/youtube-resolve?videoId=${encodeURIComponent(activeYtId)}`)
      .then(res => res.json())
      .then(data => {
        if (isCancelled) return;
        if (data && data.success && data.streamUrl) {
          setExtractedStream(data);
          setExtractorFailed(false);
        } else {
          // Fallback to IFrame TV Shield
          setExtractedStream(null);
          setExtractorFailed(true);
        }
      })
      .catch(err => {
        if (isCancelled) return;
        console.warn('[DabinPlayer] YouTube backend extractor fallback:', err.message);
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
          console.warn('[DabinPlayer] Could not retrieve blob from IndexedDB:', err);
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

  // Setup HLS.js for HLS stream formats
  useEffect(() => {
    if (!extractedStream || extractedStream.format !== 'hls' || !videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });
      hlsInstanceRef.current = hls;
      hls.loadSource(extractedStream.streamUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const targetSeek = pendingSeekRef.current || liveState.seekSeconds || 0;
        if (targetSeek > 0 && videoRef.current) {
          videoRef.current.currentTime = targetSeek;
        }
        videoRef.current?.play().catch(() => {});
        setIsYtTransitioning(false);
      });

      return () => {
        hls.destroy();
        hlsInstanceRef.current = null;
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = extractedStream.streamUrl;
    }
  }, [extractedStream?.streamUrl, extractedStream?.format]);

  // Update volume & muted on internal HTML5 video & audio
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }

    if (ytPlayerRef.current) {
      try {
        if (isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume);
        }
      } catch (e) {}
    }
  }, [isMuted, volume, liveState.itemIndex, resolvedBlobUrl, extractedStream]);

  // Synchronize audio track with video track when separate audio stream is used
  const handleTimeUpdate = () => {
    if (!videoRef.current || !audioRef.current) return;
    const vTime = videoRef.current.currentTime;
    const aTime = audioRef.current.currentTime;
    if (Math.abs(vTime - aTime) > 0.25) {
      audioRef.current.currentTime = vTime;
    }
  };

  // When video metadata loads, perform instant broadcast seek
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
      if (audioRef.current) {
        audioRef.current.currentTime = safeSeek;
      }
    }

    video.play().catch(() => {});
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setIsYtTransitioning(false);
  };

  // Video ended callback
  const handleVideoEnded = () => {
    syncToCurrentLiveBroadcast();
  };

  // Video error fallback
  const handleVideoError = (e) => {
    console.warn('[DabinPlayer] Video error on item:', currentItem?.title, e);
    // If native playback of extracted stream failed, fall back to Iframe
    if (currentItem?.type === 'youtube' && extractedStream) {
      setExtractedStream(null);
      setExtractorFailed(true);
    } else {
      const timeout = setTimeout(() => syncToCurrentLiveBroadcast(), 2500);
      return () => clearTimeout(timeout);
    }
  };

  // =========================================================================
  // FALLBACK YOUTUBE IFRAME "TV SHIELD" & AUTOPLAY UNLOCKER
  // =========================================================================
  const ytSeekSeconds = Math.floor(liveState.seekSeconds || 0);

  // Dynamically load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const existing = document.getElementById('youtube-iframe-api');
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Initialize YT.Player on fallback
  useEffect(() => {
    if (!extractorFailed || currentItem?.type !== 'youtube' || !activeYtId) return;

    let playerInstance = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 200);
        return;
      }

      try {
        playerInstance = new window.YT.Player('dabin-yt-iframe', {
          events: {
            onReady: (event) => {
              ytPlayerRef.current = event.target;
              event.target.playVideo();
              if (ytSeekSeconds > 0) {
                event.target.seekTo(ytSeekSeconds, true);
              }
              if (!isMuted) {
                event.target.unMute();
                event.target.setVolume(volume);
              }
              setTimeout(() => setIsYtTransitioning(false), 900);
            },
            onStateChange: (event) => {
              // 1: PLAYING, 2: PAUSED, -1: UNSTARTED, 0: ENDED
              if (event.data === 1) {
                setIsYtTransitioning(false);
              } else if (event.data === -1 || event.data === 2) {
                // Autoplay unlock
                event.target.playVideo();
              } else if (event.data === 0) {
                syncToCurrentLiveBroadcast();
              }
            }
          }
        });
      } catch (e) {
        console.warn('[DabinPlayer] YT.Player init notice:', e);
      }
    };

    initPlayer();

    // Browser audio unlocker on first user touch / key
    const handleUnlockAudio = () => {
      if (ytPlayerRef.current && !isMuted) {
        try {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume);
        } catch (e) {}
      }
    };
    window.addEventListener('click', handleUnlockAudio, { once: true });
    window.addEventListener('keydown', handleUnlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', handleUnlockAudio);
      window.removeEventListener('keydown', handleUnlockAudio);
    };
  }, [extractorFailed, activeYtId, ytSeekSeconds]);

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
            شریتی پەخشی ڕاستەوخۆ بەتاڵە. تکایە لە ئەدمین پانێڵ &gt; پەخشی کەناڵی دابین بەرنامە دابنێ.
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

          {/* Synchronized Audio Track if separated audio stream is delivered */}
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
          {/* Main Cropped Viewport (Scale 1.18x eliminates all edge titles, watermarks & YouTube buttons) */}
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden pointer-events-none select-none">
            <iframe
              ref={ytIframeRef}
              id="dabin-yt-iframe"
              key={activeYtId}
              src={`https://www.youtube-nocookie.com/embed/${activeYtId}?enablejsapi=1&autoplay=1&mute=${isMuted ? 1 : 0}&start=${ytSeekSeconds}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&loop=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
              title="DABIN.Tv Broadcast Stream"
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

          {/* Edge Vignette Masks: Eliminates any top title or bottom watermark bleed */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10" />

          {/* Transparent TV Shield Overlay: Blocks all accidental clicks & pauses on the YouTube frame */}
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

      {/* Cinema Broadcast Transition Curtain (Hides YouTube Play Button & Video Thumbnail During Switches) */}
      <div 
        className={`absolute inset-0 bg-black flex flex-col items-center justify-center transition-opacity duration-700 pointer-events-none z-25 ${
          isYtTransitioning && currentItem?.type === 'youtube' ? 'opacity-100' : 'opacity-0'
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
            <span className="text-[11px] font-bold text-white tracking-widest font-mono">
              {isResolvingStream ? 'OPTIMIZING DIRECT TV STREAM' : 'DABIN HD 1080p BROADCAST'}
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
