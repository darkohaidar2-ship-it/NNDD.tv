import React, { useRef, useEffect, useState } from 'react';
import { getCustomBackground } from '../../data/backgroundStorage';
import { subscribeToKobinBroadcastChannel } from '../../data/dabinBroadcastManager';
import { getSavedThemeConfig } from '../../services/kobinThemeService';

/**
 * CinematicBackground - Apple TV / Netflix Dark Cinema Ambient Engine
 * Features:
 * 1. 4K Custom Background Manager: reads high-res images / videos from Theme Config, IndexedDB or Remote URL
 * 2. Real-time background color and gradient customization from Admin Panel
 * 3. 4K Image and Video loop support with autoPlay, muted, loop, playsInline
 * 4. Dark glass-morphism overlay for zero visual distraction
 * 5. 60fps GPU-accelerated motion with zero CPU strain
 */
export default function CinematicBackground({
  videoSrc = null,
  onWakeup = null,
  themeConfig: propThemeConfig = null
}) {
  const videoRef = useRef(null);
  const [themeConfig, setThemeConfig] = useState(() => propThemeConfig || getSavedThemeConfig());
  const [customBg, setCustomBg] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  // Sync theme changes in real-time
  useEffect(() => {
    if (propThemeConfig) setThemeConfig(propThemeConfig);

    const handleThemeChange = (e) => {
      if (e?.detail) setThemeConfig(e.detail);
    };
    window.addEventListener('kobin-theme-changed', handleThemeChange);
    return () => window.removeEventListener('kobin-theme-changed', handleThemeChange);
  }, [propThemeConfig]);

  // Load custom background from Remote Sync / IndexedDB
  const loadBackground = async () => {
    try {
      const remoteBgUrl = localStorage.getItem('kobin_remote_dashboard_bg');
      if (remoteBgUrl) {
        setCustomBg({ type: 'image', url: remoteBgUrl });
        setBlobUrl(remoteBgUrl);
        return;
      }
      const bg = await getCustomBackground();
      if (bg) {
        setCustomBg(bg);
        if (bg.blob) {
          const url = URL.createObjectURL(bg.blob);
          setBlobUrl((prev) => {
            if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
            return url;
          });
        } else if (bg.url) {
          setBlobUrl(bg.url);
        }
      } else {
        setCustomBg(null);
        setBlobUrl((prev) => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return null;
        });
      }
    } catch (err) {
      console.warn('[CinematicBackground] Could not load custom background:', err);
    }
  };

  useEffect(() => {
    loadBackground();

    const handleUpdate = (e) => {
      const detail = e.detail;
      if (detail) {
        setCustomBg(detail);
        if (detail.blob) {
          const url = URL.createObjectURL(detail.blob);
          setBlobUrl((prev) => {
            if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
            return url;
          });
        } else if (detail.url) {
          setBlobUrl(detail.url);
        }
      } else {
        setCustomBg(null);
        setBlobUrl((prev) => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return null;
        });
      }
    };

    window.addEventListener('kobin_custom_background_updated', handleUpdate);

    // Cross-Tab & Admin Realtime Broadcast Sync
    const unsubscribeBus = subscribeToKobinBroadcastChannel((msg) => {
      if (msg.type === 'UPDATE_BACKGROUND' && msg.payload) {
        const bgUrl = msg.payload.url || null;
        if (bgUrl) {
          localStorage.setItem('kobin_remote_dashboard_bg', bgUrl);
          setCustomBg({ type: 'image', url: bgUrl });
          setBlobUrl(bgUrl);
        } else {
          localStorage.removeItem('kobin_remote_dashboard_bg');
          loadBackground();
        }
      }
    });

    return () => {
      window.removeEventListener('kobin_custom_background_updated', handleUpdate);
      if (typeof unsubscribeBus === 'function') unsubscribeBus();
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, []);

  const videosList = Array.isArray(themeConfig?.backgroundVideos) && themeConfig.backgroundVideos.length > 0
    ? themeConfig.backgroundVideos
    : [];
  const activeVideoIndex = typeof themeConfig?.activeBackgroundVideoIndex === 'number'
    ? Math.max(0, Math.min(videosList.length - 1, themeConfig.activeBackgroundVideoIndex))
    : 0;
  const slotVideoUrl = videosList[activeVideoIndex]?.url;

  const bgType = themeConfig?.dashboardBgType || (slotVideoUrl || themeConfig?.dashboardBgVideoUrl ? 'video' : (themeConfig?.dashboardBgImageUrl ? 'image' : 'gradient'));
  const themeImageUrl = themeConfig?.dashboardBgImageUrl;
  const themeVideoUrl = slotVideoUrl || themeConfig?.dashboardBgVideoUrl;
  const themeBgColor = themeConfig?.dashboardBgColor || '#020617';

  // Advance to next video in matrix if auto-rotate is enabled
  const handleVideoEnded = () => {
    if (themeConfig?.autoRotateVideos && videosList.length > 1) {
      const nextIdx = (activeVideoIndex + 1) % videosList.length;
      const updated = {
        ...themeConfig,
        activeBackgroundVideoIndex: nextIdx,
        dashboardBgVideoUrl: videosList[nextIdx]?.url || themeConfig.dashboardBgVideoUrl
      };
      setThemeConfig(updated);
      saveThemeConfig(updated, true);
    }
  };

  // Determine active media based on explicitly chosen bgType
  const isVideoChosen = bgType === 'video' || (!themeImageUrl && (themeVideoUrl || blobUrl || videoSrc));
  const isImageChosen = bgType === 'image' || (!themeVideoUrl && (themeImageUrl || (blobUrl && customBg?.type === 'image')));

  const activeVideoSource = isVideoChosen ? (themeVideoUrl || (blobUrl && customBg?.type === 'video' ? blobUrl : videoSrc)) : null;
  const activeImageSource = isImageChosen ? (themeImageUrl || (blobUrl && customBg?.type === 'image' ? blobUrl : null)) : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideoSource) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    let hlsInstance = null;
    const isHlsUrl = activeVideoSource.includes('.m3u8');

    if (isHlsUrl && window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: false });
      hlsInstance.loadSource(activeVideoSource);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else {
      video.src = activeVideoSource;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [activeVideoSource]);

  return (
    <div 
      onClick={onWakeup}
      className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-auto transition-colors duration-700"
      style={{ backgroundColor: themeBgColor }}
      title="KOBIN TV Cinema Experience"
    >
      {/* 1. Custom 4K Image Background - Zero dimming/Zero haze */}
      {activeImageSource && (
        <img
          src={activeImageSource}
          alt="4K Cinema Backdrop"
          className="absolute inset-0 w-full h-full object-cover transform-gpu scale-100 filter brightness-100 contrast-100 transition-opacity duration-700"
        />
      )}

      {/* 2. Video Element - Zero dimming/Zero haze, 100% vibrant 4K */}
      {activeVideoSource && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop={!themeConfig?.autoRotateVideos}
          onEnded={handleVideoEnded}
          playsInline
          className="absolute inset-0 w-full h-full object-cover transform-gpu scale-100 filter brightness-100 contrast-100 transition-opacity duration-700"
        />
      )}

      {/* 3. Fluid Dark Cinema Ambient Aurora Mesh (Rendered strictly when in color/gradient mode) */}
      {!activeImageSource && !activeVideoSource && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu">
          {/* Deep Sapphire / Cyan Orb 1 (Top-Left Drift) */}
          <div 
            className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full bg-gradient-to-br from-cyan-600/30 via-sky-800/20 to-transparent blur-[100px] sm:blur-[140px] transform-gpu animate-aurora-1 will-change-transform" 
          />

          {/* Warm Cinematic Amber Orb 2 (Bottom-Right Drift) */}
          <div 
            className="absolute -bottom-[25%] -right-[15%] w-[70vw] h-[70vw] max-w-[950px] max-h-[950px] rounded-full bg-gradient-to-tl from-amber-600/25 via-orange-900/15 to-transparent blur-[120px] sm:blur-[160px] transform-gpu animate-aurora-2 will-change-transform" 
          />

          {/* Deep Indigo Midnight Orb 3 (Center-Floating) */}
          <div 
            className="absolute top-[25%] left-[25%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-r from-blue-950/40 via-indigo-900/20 to-transparent blur-[90px] sm:blur-[130px] transform-gpu animate-aurora-3 will-change-transform" 
          />

          {/* Subtle Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_30%,rgba(2,6,23,0.5)_90%)]" />
        </div>
      )}

      {/* 4. Overlay: Zero blackness (bg-transparent) on Video/Image so colors stay 100% crisp & true */}
      <div 
        className={`absolute inset-0 z-10 transition-all duration-500 pointer-events-none ${
          activeVideoSource || activeImageSource
            ? 'bg-transparent opacity-0'
            : 'bg-black/40 backdrop-blur-sm'
        }`} 
      />
    </div>
  );
}
