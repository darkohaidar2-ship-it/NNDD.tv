import React, { useRef, useEffect, useState } from 'react';
import { getCustomBackground } from '../../data/backgroundStorage';
import { subscribeToKobinBroadcastChannel } from '../../data/dabinBroadcastManager';

/**
 * CinematicBackground - Apple TV / Netflix Dark Cinema Ambient Engine
 * Features:
 * 1. 4K Custom Background Manager: reads high-res images / videos from IndexedDB or Remote URL
 * 2. Ultra-lightweight looping cinematic background (with video support + dark CSS aurora canvas)
 * 3. autoPlay, muted, loop, playsInline
 * 4. Dark glass-morphism overlay (bg-black/60 backdrop-blur-md) for zero visual distraction
 * 5. 60fps GPU-accelerated motion with zero CPU strain
 */
export default function CinematicBackground({
  videoSrc = null,
  onWakeup = null
}) {
  const videoRef = useRef(null);
  const [customBg, setCustomBg] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

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

  const activeVideoSource = blobUrl && customBg?.type === 'video' ? blobUrl : videoSrc;
  const activeImageSource = blobUrl && customBg?.type === 'image' ? blobUrl : null;

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [activeVideoSource]);

  return (
    <div 
      onClick={onWakeup}
      className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-auto bg-[#030712]"
      title="KOBIN TV Cinema Experience"
    >
      {/* 1. Custom 4K Image Background */}
      {activeImageSource && (
        <img
          src={activeImageSource}
          alt="4K Cinema Backdrop"
          className="absolute inset-0 w-full h-full object-cover transform-gpu scale-105 filter brightness-75 contrast-115 transition-opacity duration-700 animate-ken-burns"
        />
      )}

      {/* 2. Video Element (custom 4K video or default videoSrc) */}
      {!activeImageSource && activeVideoSource && (
        <video
          ref={videoRef}
          src={activeVideoSource}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover transform-gpu scale-105 filter brightness-75 contrast-125"
        />
      )}

      {/* 3. Fluid Dark Cinema Ambient Aurora Mesh (Rendered when no custom image or alongside ambient) */}
      {!activeImageSource && (
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

          {/* Subtle Cinematic Vignette Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_20%,rgba(3,7,18,0.75)_85%)]" />
        </div>
      )}

      {/* 4. Dark Glass-morphism Overlay (Strict requirement: bg-black/60 backdrop-blur-md) */}
      <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-md transition-opacity duration-500" />
    </div>
  );
}
