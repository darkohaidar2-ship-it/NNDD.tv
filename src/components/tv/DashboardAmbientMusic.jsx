import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Music, SkipForward, SkipBack, Play, Pause, Repeat } from 'lucide-react';
import { 
  getSavedThemeConfig, 
  subscribeToThemeChanges, 
  saveThemeConfig, 
  DEFAULT_AMBIENT_PLAYLIST 
} from '../../services/kobinThemeService';
import { extractYouTubeVideoId } from '../../data/dabinBroadcastManager';

/**
 * DashboardAmbientMusic - Dual-Engine Ambient Playlist Player
 * Plays calm, peaceful background ambient music on the Cinema Dashboard.
 * 
 * Features:
 * 1. Dual-Engine: Seamlessly plays BOTH YouTube Links AND direct MP3 / audio files.
 * 2. Sequential Playlist: Plays 3-4 tracks in continuous rotation (1 -> 2 -> 3 -> 4 -> 1).
 * 3. Mobile & Desktop Track Picker: 1-tap quick buttons [1] [2] [3] [4] + Next/Prev.
 * 4. Automatic pause when leaving dashboard (entering Live TV, Movies, Series, or Settings).
 * 5. Soft, unobtrusive default volume (15%).
 */
export default function DashboardAmbientMusic({ activeTab = 'dashboard' }) {
  const [themeConfig, setThemeConfig] = useState(getSavedThemeConfig);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTrackPicker, setShowTrackPicker] = useState(false);

  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const [isYtReady, setIsYtReady] = useState(false);

  // Subscribe to theme config changes
  useEffect(() => {
    const unsub = subscribeToThemeChanges((newConfig) => {
      setThemeConfig(newConfig);
    });
    return () => unsub?.();
  }, []);

  const enabled = themeConfig?.ambientMusicEnabled !== false;
  const playlist = Array.isArray(themeConfig?.ambientPlaylist) && themeConfig.ambientPlaylist.length > 0
    ? themeConfig.ambientPlaylist
    : DEFAULT_AMBIENT_PLAYLIST;

  const currentIndex = typeof themeConfig?.activeAmbientIndex === 'number'
    ? Math.max(0, Math.min(playlist.length - 1, themeConfig.activeAmbientIndex))
    : 0;

  const currentTrack = playlist[currentIndex] || playlist[0] || {
    id: 'default',
    title: '☕ Lofi Study Chill',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
  };

  const volume = typeof themeConfig?.ambientMusicVolume === 'number' ? themeConfig.ambientMusicVolume : 0.15;
  const ytVideoId = extractYouTubeVideoId(currentTrack?.url || '');
  const isYouTube = Boolean(ytVideoId);

  // Advance to next track in sequence
  const advanceToNextTrack = useCallback(() => {
    const nextIdx = (currentIndex + 1) % playlist.length;
    const updated = {
      ...themeConfig,
      activeAmbientIndex: nextIdx,
      ambientMusicUrl: playlist[nextIdx]?.url || themeConfig.ambientMusicUrl
    };
    setThemeConfig(updated);
    saveThemeConfig(updated, true);
  }, [currentIndex, playlist, themeConfig]);

  // Advance to previous track
  const advanceToPrevTrack = useCallback(() => {
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    const updated = {
      ...themeConfig,
      activeAmbientIndex: prevIdx,
      ambientMusicUrl: playlist[prevIdx]?.url || themeConfig.ambientMusicUrl
    };
    setThemeConfig(updated);
    saveThemeConfig(updated, true);
  }, [currentIndex, playlist, themeConfig]);

  // Select a specific track index
  const selectTrack = useCallback((index) => {
    if (index < 0 || index >= playlist.length) return;
    const updated = {
      ...themeConfig,
      activeAmbientIndex: index,
      ambientMusicUrl: playlist[index]?.url || themeConfig.ambientMusicUrl
    };
    setThemeConfig(updated);
    saveThemeConfig(updated, true);
  }, [playlist, themeConfig]);

  // -------------------------------------------------------------
  // 1. YouTube Iframe API Loader & Controller
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isYouTube) {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.stopVideo(); } catch (e) {}
      }
      return;
    }

    // Load YouTube Iframe API script if not present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 200);
        return;
      }

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(ytVideoId);
          ytPlayerRef.current.setVolume(isMuted ? 0 : Math.round(volume * 100));
          if (activeTab === 'dashboard' && enabled && !isMuted) {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } else {
            ytPlayerRef.current.pauseVideo();
            setIsPlaying(false);
          }
          return;
        } catch (e) {}
      }

      try {
        ytPlayerRef.current = new window.YT.Player('kobin-ambient-yt-frame', {
          height: '1',
          width: '1',
          videoId: ytVideoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : ''
          },
          events: {
            onReady: (event) => {
              setIsYtReady(true);
              event.target.setVolume(isMuted ? 0 : Math.round(volume * 100));
              if (activeTab === 'dashboard' && enabled && !isMuted) {
                event.target.playVideo();
                setIsPlaying(true);
              } else {
                event.target.pauseVideo();
                setIsPlaying(false);
              }
            },
            onStateChange: (event) => {
              // 0: Ended
              if (event.data === 0) {
                advanceToNextTrack();
              } else if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              }
            },
            onError: () => {
              // If YouTube video fails or is blocked, advance to next track
              setTimeout(advanceToNextTrack, 2000);
            }
          }
        });
      } catch (err) {
        console.warn('YouTube init error:', err);
      }
    };

    initPlayer();
  }, [isYouTube, ytVideoId, advanceToNextTrack]);

  // Sync YouTube Volume & Mute
  useEffect(() => {
    if (ytPlayerRef.current && isYtReady) {
      try {
        ytPlayerRef.current.setVolume(isMuted ? 0 : Math.round(volume * 100));
        if (isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
        }
      } catch (e) {}
    }
  }, [volume, isMuted, isYtReady]);

  // -------------------------------------------------------------
  // 2. Native HTML5 Audio Controller (for MP3 & direct streams)
  // -------------------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = Math.min(1, Math.max(0, volume));
    audio.muted = isMuted;

    if (!isYouTube && activeTab === 'dashboard' && enabled && !isMuted) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      audio.pause();
      if (!isYouTube) setIsPlaying(false);
    }
  }, [activeTab, enabled, isMuted, isYouTube, volume, currentTrack?.url]);

  // Tab switch control for YouTube Player
  useEffect(() => {
    if (!isYouTube || !ytPlayerRef.current) return;
    try {
      if (activeTab === 'dashboard' && enabled && !isMuted) {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } else {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    } catch (e) {}
  }, [activeTab, enabled, isMuted, isYouTube]);

  // Handle first user interaction to bypass browser autoplay restrictions
  useEffect(() => {
    const handleFirstGesture = () => {
      if (activeTab === 'dashboard' && enabled && !isMuted) {
        if (!isYouTube && audioRef.current && audioRef.current.paused) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } else if (isYouTube && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } catch (e) {}
        }
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
  }, [activeTab, enabled, isMuted, isYouTube]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYouTube && ytPlayerRef.current) {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          if (activeTab === 'dashboard') ytPlayerRef.current.playVideo();
        }
      } catch (e) {}
    } else if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (!nextMuted && activeTab === 'dashboard') {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  return (
    <>
      {/* 1. Native HTML5 Audio Tag (for direct audio links) */}
      {!isYouTube && (
        <audio
          ref={audioRef}
          src={currentTrack?.url}
          onEnded={advanceToNextTrack}
          preload="auto"
        />
      )}

      {/* 2. Hidden YouTube Player Container (for YouTube links) */}
      <div 
        ref={ytContainerRef}
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 pointer-events-none opacity-0 overflow-hidden"
      >
        <div id="kobin-ambient-yt-frame" />
      </div>

      {/* 3. Floating Interactive Playlist Controller on Dashboard */}
      {enabled && activeTab === 'dashboard' && (
        <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-8 z-30 flex flex-col items-end gap-2 animate-fade-in pointer-events-auto select-none" dir="rtl">
          
          {/* Expanded 4-Track Quick Selector Menu */}
          {showTrackPicker && (
            <div className="p-3 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.8)] w-64 space-y-2 animate-scale-up">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  <span>لیستی ٤ میوزیکەکە</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {currentIndex + 1} / {playlist.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {playlist.slice(0, 4).map((track, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isYt = Boolean(extractYouTubeVideoId(track.url));
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectTrack(idx)}
                      className={`w-full p-2 rounded-xl text-xs font-semibold text-start flex items-center justify-between gap-2 transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono text-[10px] font-black ${
                          isCurrent ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-white/60'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="truncate text-[11px]">{track.title || `تراکی ${idx + 1}`}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-white/50 shrink-0">
                        {isYt ? 'YouTube' : 'MP3'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-white/60">
                <span className="flex items-center gap-1">
                  <Repeat className="w-3 h-3 text-cyan-400" />
                  <span>پەخشی زنجیرەیی چالاکە</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowTrackPicker(false)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                >
                  داخستن
                </button>
              </div>
            </div>
          )}

          {/* Compact Bottom Control Bar */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            {/* Previous Track Button */}
            <button
              type="button"
              onClick={advanceToPrevTrack}
              title="تراکی پێشوو"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Play/Mute Main Button */}
            <button
              type="button"
              onClick={toggleMute}
              className={`px-3 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 outline-none ${
                isPlaying && !isMuted
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/50 hover:text-white'
              }`}
              title={isMuted ? 'دەنگپێدانەوەی میوزیک' : 'بێدەنگکردنی میوزیک'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : isPlaying ? (
                <div className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-sans font-bold text-white max-w-[120px] sm:max-w-[150px] truncate">
                    {currentTrack.title || `میوزیکی ${currentIndex + 1}`}
                  </span>
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

            {/* Next Track Button */}
            <button
              type="button"
              onClick={advanceToNextTrack}
              title="تراکی دواتر"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Track Picker Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setShowTrackPicker(!showTrackPicker)}
              title="هەڵبژاردنی تراک لە لیستی ٤ دانەکە"
              className={`px-2 py-1.5 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                showTrackPicker 
                  ? 'bg-cyan-400 text-slate-950 border-cyan-300' 
                  : 'bg-white/5 hover:bg-white/15 text-white/80 border-white/10'
              }`}
            >
              {currentIndex + 1}/4
            </button>
          </div>
        </div>
      )}
    </>
  );
}
