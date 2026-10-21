import React, { useState, useEffect, useRef } from 'react';
import { 
  getDabinBroadcastConfig, 
  extractYouTubeVideoId 
} from '../data/dabinBroadcastManager';
import { Volume2, VolumeX, AlertCircle, Sparkles } from 'lucide-react';

/**
 * DABIN.Tv Channel Dynamic Broadcast Player
 * 
 * Powered by DABIN Studio:
 * - Plays YouTube, Multi-Video Playlist (with Loop), or Photo Album Slideshow
 * - On-screen Channel Logo Watermark Overlay
 * - Bottom Live Announcement Marquee / Ticker Bar
 */
export default function DabinChannelPlayer({ 
  isMuted = false, 
  volume = 100, 
  onVideoEnd = null 
}) {
  const [config, setConfig] = useState(getDabinBroadcastConfig);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const videoRef = useRef(null);

  // Sync with Admin Studio changes in real time
  useEffect(() => {
    const handleConfigUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };
    window.addEventListener('dabin_broadcast_updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('dabin_broadcast_updated', handleConfigUpdate);
    };
  }, []);

  // Update volume & muted on internal HTML5 video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [isMuted, volume, currentVideoIdx]);

  // Slideshow timer for Photo Album Mode
  useEffect(() => {
    if (config.sourceType !== 'album') return;
    const photos = config.albumPhotos || [];
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPhotoIdx(prev => (prev + 1) % photos.length);
    }, Math.max(3000, (config.slideDurationSeconds || 6) * 1000));

    return () => clearInterval(interval);
  }, [config.sourceType, config.albumPhotos, config.slideDurationSeconds]);

  // Handle Video Playlist progression & Loop
  const handleVideoEnded = () => {
    const playlist = config.videoPlaylist || [];
    if (playlist.length === 0) return;

    if (playlist.length === 1) {
      if (config.isLoop && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    if (currentVideoIdx + 1 < playlist.length) {
      setCurrentVideoIdx(prev => prev + 1);
    } else {
      // End of playlist reached
      if (config.isLoop) {
        setCurrentVideoIdx(0);
      }
    }
  };

  // Determine Logo Position Classes
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

  // Determine Logo Size Classes
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

  // Ticker Speed Duration
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

  const activeVideo = config.videoPlaylist?.[currentVideoIdx] || config.videoPlaylist?.[0];
  const activePhoto = config.albumPhotos?.[currentPhotoIdx] || config.albumPhotos?.[0];
  const ytVideoId = extractYouTubeVideoId(config.youtubeUrl) || config.youtubeVideoId || 'jfKfPfyJRdk';

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden select-none pointer-events-auto">
      {/* =========================================================================
          BROADCAST SOURCE RENDERER
         ========================================================================= */}
      
      {/* 1. YOUTUBE BROADCAST MODE */}
      {config.sourceType === 'youtube' && (
        <div className="w-full h-full relative pointer-events-none">
          <iframe
            key={ytVideoId}
            src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytVideoId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
            title="DABIN.Tv Channel Stream"
            className="w-full h-full border-0 pointer-events-auto scale-105"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* 2. DIRECT VIDEO / PLAYLIST BROADCAST MODE */}
      {config.sourceType === 'video' && activeVideo && (
        <div className="w-full h-full relative flex items-center justify-center">
          <video
            ref={videoRef}
            key={activeVideo.id || activeVideo.url}
            src={activeVideo.url}
            autoPlay
            playsInline
            loop={config.isLoop && config.videoPlaylist?.length === 1}
            muted={isMuted}
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 3. PHOTO ALBUM SLIDESHOW MODE */}
      {config.sourceType === 'album' && (
        <div className="w-full h-full relative flex items-center justify-center bg-radial from-slate-900 to-black">
          {activePhoto && (
            <img
              key={activePhoto.id || activePhoto.url}
              src={activePhoto.url}
              alt={activePhoto.title || 'DABIN.Tv'}
              className="w-full h-full object-contain animate-fade-in transition-opacity duration-1000 p-8"
            />
          )}
        </div>
      )}

      {/* =========================================================================
          CHANNEL WATERMARK LOGO OVERLAY ("لۆگۆی کەناڵەکە لەلایەک بێت")
         ========================================================================= */}
      {config.showLogoOverlay && (
        <div 
          className={`absolute ${getLogoPositionClass()} z-30 pointer-events-none transition-all duration-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]`}
          style={{ opacity: config.logoOpacity ?? 0.95 }}
        >
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/30 backdrop-blur-md border border-white/10 shadow-lg">
            <img
              src={config.customLogoUrl || '/dabin-logo.png'}
              alt="DABIN.Tv"
              className={`${getLogoSizeClass()} w-auto object-contain`}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          LIVE ANNOUNCEMENT TICKER / MARQUEE BAR ("شریتی ئاگەداری دابنێ")
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
