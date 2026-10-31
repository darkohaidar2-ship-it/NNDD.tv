import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { getSavedThemeConfig, subscribeToThemeChanges, saveThemeConfig } from '../../services/kobinThemeService';

/**
 * DashboardAmbientMusic
 * Plays calm, peaceful background ambient music on the Cinema Dashboard.
 * 
 * Rules:
 * 1. Plays ONLY when activeTab === 'dashboard'.
 * 2. Automatically pauses whenever user enters Live TV, VOD Movies, Series, or Settings.
 * 3. Default volume is soft and unobtrusive (15% / 0.15).
 * 4. Supports custom audio link or presets.
 * 5. Minimal floating control button on dashboard.
 */
export default function DashboardAmbientMusic({ activeTab = 'dashboard' }) {
  const [themeConfig, setThemeConfig] = useState(getSavedThemeConfig);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Subscribe to central theme config changes (from Customizer or Admin Studio)
  useEffect(() => {
    const unsub = subscribeToThemeChanges((newConfig) => {
      setThemeConfig(newConfig);
    });
    return () => unsub?.();
  }, []);

  const enabled = themeConfig?.ambientMusicEnabled !== false;
  const audioSrc = themeConfig?.ambientMusicUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';
  const volume = typeof themeConfig?.ambientMusicVolume === 'number' ? themeConfig.ambientMusicVolume : 0.15;

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, volume));
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Tab change playback control: ONLY play on dashboard
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeTab === 'dashboard' && enabled && !isMuted) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            // Autoplay policy might require user gesture first
            setIsPlaying(false);
          });
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [activeTab, enabled, isMuted, audioSrc]);

  // Attempt play on first user interaction if blocked by browser autoplay policy
  useEffect(() => {
    const handleFirstGesture = () => {
      if (activeTab === 'dashboard' && enabled && !isMuted && audioRef.current && audioRef.current.paused) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [activeTab, enabled, isMuted]);

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current && activeTab === 'dashboard') {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  if (activeTab !== 'dashboard') {
    return (
      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="auto"
      />
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="auto"
      />

      {/* Subtle Floating Ambient Music Pill on Dashboard */}
      {enabled && (
        <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-8 z-30 flex items-center gap-1.5 animate-fade-in pointer-events-auto">
          <button
            type="button"
            onClick={toggleMute}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border backdrop-blur-xl transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 outline-none ${
              isPlaying && !isMuted
                ? 'bg-white/10 hover:bg-white/15 border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'bg-black/40 hover:bg-black/60 border-white/10 text-white/50 hover:text-white'
            }`}
            title={isMuted ? 'دەنگپێدانەوەی میوزیکی ئارام' : 'بێدەنگکردنی میوزیکی ئارام'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : isPlaying ? (
              <div className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline text-[11px] font-sans font-bold text-white/90">میوزیکی ئارام</span>
                <span className="flex items-end gap-0.5 h-3 px-0.5">
                  <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            ) : (
              <Volume2 className="w-4 h-4 text-white/70" />
            )}
          </button>
        </div>
      )}
    </>
  );
}
