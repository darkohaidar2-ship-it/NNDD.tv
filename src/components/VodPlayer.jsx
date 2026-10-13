import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Sun,
  Lock,
  Unlock,
  Subtitles,
  Sliders,
  Languages,
  AudioLines,
  Gauge,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  List,
  X,
  ArrowRight,
  Clock,
  Check,
  Sparkles,
  ChevronRight,
  Settings
} from 'lucide-react';

/**
 * Modern High-Performance VOD Player (MX Player style)
 * Designed for Xtream Codes Movies & Series on Mobile and Android TV.
 */
export default function VodPlayer({
  session,
  onClose,
  onPlayEpisode,
  onNextEpisode,
  getVodProgress,
  saveVodProgress
}) {
  const { item, episode, isSeries, title, streamUrl } = session;

  // Video and Media Engine References
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressSaveIntervalRef = useRef(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // UI & Overlay Controls States
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [lockPrompt, setLockPrompt] = useState(false);
  const [currentClock, setCurrentClock] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // MX Player Aspect Ratio Modes: 'fit' | 'cover' | 'fill' | '16:9' | '4:3'
  const [aspectRatio, setAspectRatio] = useState('fit');
  const [aspectToast, setAspectToast] = useState(null);

  // Volume & Brightness State (MX Player Gesture Engine)
  const [volume, setVolume] = useState(100); // 0% to 100% (and software boost up to 200%)
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(100); // 10% to 100% software overlay

  // Interactive Gesture HUD State
  // type: 'volume' | 'brightness' | 'seek' | 'ripple_forward' | 'ripple_rewind' | null
  const [hudState, setHudState] = useState({
    type: null,
    value: 0,
    diff: '',
    targetTime: 0
  });
  const hudTimeoutRef = useRef(null);

  // Resume Playback Prompt State
  const [resumePrompt, setResumePrompt] = useState(null);

  // Modal Sheets (Audio, Subtitles, Episodes, Settings)
  const [showSubtitlesModal, setShowSubtitlesModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);

  // Audio Tracks State
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudioTrackIndex, setCurrentAudioTrackIndex] = useState(0);

  // Subtitles Management State
  const [subtitleTracks, setSubtitleTracks] = useState([
    { id: 'off', label: 'ناچالاک (Off)', lang: 'off' },
    { id: 'ku', label: 'کوردی (سۆرانی)', lang: 'ku' },
    { id: 'ar', label: 'عەرەبی (العربية)', lang: 'ar' },
    { id: 'en', label: 'ئینگلیزی (English)', lang: 'en' }
  ]);
  const [activeSubtitleTrackId, setActiveSubtitleTrackId] = useState('off');
  const [activeCueText, setActiveCueText] = useState('');
  const [subtitleOffsetMs, setSubtitleOffsetMs] = useState(0);
  const [subtitleStyle, setSubtitleStyle] = useState({
    fontSize: 'medium', // 'small' (15px), 'medium' (20px), 'large' (26px), 'xl' (32px)
    color: '#ffffff', // '#ffffff' (White), '#facc15' (Yellow), '#38bdf8' (Cyan), '#4ade80' (Green)
    backgroundOpacity: 0.5 // 0 (None), 0.5 (Semi), 0.85 (Dark), 1 (Solid)
  });

  // Sample Cues Generator for VOD preview when remote tracks are selected
  const parsedCuesRef = useRef([]);

  // Live Wall Clock Timer (e.g. 12:45 AM)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentClock(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper to trigger interactive HUD notifications
  const triggerHUD = useCallback((type, value, diff = '', targetTime = 0, durationMs = 1200) => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    setHudState({ type, value, diff, targetTime });
    hudTimeoutRef.current = setTimeout(() => {
      setHudState({ type: null, value: 0, diff: '', targetTime: 0 });
    }, durationMs);
  }, []);

  // Controls Auto-Hide Machine (3-second inactivity rule)
  const showControlsTemporarily = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setShowSubtitlesModal(false);
      setShowAudioModal(false);
      setShowSpeedModal(false);
      setShowEpisodeDrawer(false);
    }, 3500);
  }, [isLocked]);

  // Keep controls open when any modal is open
  useEffect(() => {
    if (showSubtitlesModal || showAudioModal || showSpeedModal || showEpisodeDrawer) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
    }
  }, [showSubtitlesModal, showAudioModal, showSpeedModal, showEpisodeDrawer]);

  // Save Progress to LocalStorage
  const handleSaveProgress = useCallback((forceTime = null) => {
    const video = videoRef.current;
    const saveTime = forceTime !== null ? forceTime : (video ? video.currentTime : currentTime);
    if (saveTime > 3 && item) {
      const epNum = episode ? episode.number : 0;
      if (saveVodProgress) {
        saveVodProgress(item.id, epNum, saveTime);
      } else {
        try {
          localStorage.setItem(`nndd_vod_progress_${item.id}_${epNum}`, saveTime.toFixed(1));
        } catch (e) {}
      }
    }
  }, [item, episode, currentTime, saveVodProgress]);

  // Periodic Auto-Save every 5 seconds
  useEffect(() => {
    progressSaveIntervalRef.current = setInterval(() => {
      handleSaveProgress();
    }, 5000);
    return () => {
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
      handleSaveProgress();
    };
  }, [handleSaveProgress]);

  // Clean Exit
  const handleExit = () => {
    handleSaveProgress();
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch (e) {}
      hlsRef.current = null;
    }
    if (onClose) onClose();
  };

  // Video Engine Initializer & HLS Stream Bridge
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsBuffering(true);
    video.volume = isMuted ? 0 : Math.min(1.0, volume / 100);
    video.playbackRate = playbackSpeed;

    // Check saved progress for Resume prompt
    const epNum = episode ? episode.number : 0;
    const savedTime = getVodProgress ? getVodProgress(item.id, epNum) : parseFloat(localStorage.getItem(`nndd_vod_progress_${item.id}_${epNum}`) || '0');
    if (savedTime > 15) {
      setResumePrompt({ time: savedTime });
    }

    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch (e) {}
      hlsRef.current = null;
    }

    const isHlsStream = streamUrl.includes('.m3u8') || streamUrl.includes('m3u8');

    if (Hls.isSupported() && isHlsStream) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 60,
        startFragPrefetch: true,
        enableSoftwareAES: true,
        fragLoadingTimeOut: 25000,
        manifestLoadingTimeOut: 20000
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsBuffering(false);
        // Extract multi-audio tracks from HLS
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const tracks = hls.audioTracks.map((t, idx) => ({
            index: idx,
            label: t.name || t.lang || `دەنگ #${idx + 1}`,
            lang: t.lang || 'und'
          }));
          setAudioTracks(tracks);
          setCurrentAudioTrackIndex(hls.audioTrack || 0);
        }

        // Extract subtitle tracks
        if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
          const subList = [
            { id: 'off', label: 'ناچالاک (Off)', lang: 'off' },
            ...hls.subtitleTracks.map((st, idx) => ({
              id: `hls_${idx}`,
              index: idx,
              label: st.name || st.lang || `ژێرنووس #${idx + 1}`,
              lang: st.lang
            }))
          ];
          setSubtitleTracks(subList);
        }

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          const tracks = data.audioTracks.map((t, idx) => ({
            index: idx,
            label: t.name || t.lang || `دەنگ #${idx + 1}`,
            lang: t.lang || 'und'
          }));
          setAudioTracks(tracks);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              try { hls.destroy(); } catch (e) {}
              setIsBuffering(false);
              break;
          }
        }
      });
    } else {
      // Standard HTTP/HTTPS .mp4, .mkv direct playback
      video.src = streamUrl;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }

    showControlsTemporarily();

    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch (e) {}
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Handle Video Time Update & Buffered Ranges
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }

    // Calculate buffered range
    if (video.buffered && video.buffered.length > 0 && video.duration) {
      try {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedPercent(Math.min(100, (bufferedEnd / video.duration) * 100));
      } catch (e) {}
    }

    // Subtitle Cue Synchronization
    if (activeSubtitleTrackId !== 'off' && parsedCuesRef.current.length > 0) {
      const syncTime = video.currentTime + (subtitleOffsetMs / 1000);
      const active = parsedCuesRef.current.find(
        c => syncTime >= c.start && syncTime <= c.end
      );
      setActiveCueText(active ? active.text : '');
    } else {
      setActiveCueText('');
    }
  };

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Seeking Handler
  const handleSeek = (newTime) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(duration || 999999, newTime));
    video.currentTime = target;
    setCurrentTime(target);
    showControlsTemporarily();
  };

  // Skip Forward / Backward (+/- 10s)
  const handleSkip = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    const target = Math.max(0, Math.min(duration || 999999, current + seconds));
    video.currentTime = target;
    setCurrentTime(target);

    // Trigger visual ripple effect
    if (seconds > 0) {
      triggerHUD('ripple_forward', target, `+${seconds}s`);
    } else {
      triggerHUD('ripple_rewind', target, `${seconds}s`);
    }
    showControlsTemporarily();
  }, [duration, triggerHUD, showControlsTemporarily]);

  // Aspect Ratio Cycler
  const cycleAspectRatio = () => {
    const modes = ['fit', 'cover', 'fill', '16:9', '4:3'];
    const labels = {
      'fit': 'ڕەسەن (Original Fit)',
      'cover': 'پڕکردنەوەی شاشە (Crop/Fill)',
      'fill': 'کشانن (Stretch)',
      '16:9': 'ڕێژەی ١٦:٩ (Widescreen)',
      '4:3': 'ڕێژەی ٤:٣ (Standard)'
    };
    const nextIdx = (modes.indexOf(aspectRatio) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setAspectRatio(nextMode);
    setAspectToast(labels[nextMode]);
    setTimeout(() => setAspectToast(null), 1800);
    showControlsTemporarily();
  };

  // Playback Speed Selector
  const changeSpeed = (speed) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSpeedModal(false);
    showControlsTemporarily();
    triggerHUD('speed', speed, `${speed}x`);
  };

  // Audio Track Changer
  const selectAudioTrack = (trackIndex) => {
    setCurrentAudioTrackIndex(trackIndex);
    if (hlsRef.current && hlsRef.current.audioTrack !== undefined) {
      hlsRef.current.audioTrack = trackIndex;
    }
    setShowAudioModal(false);
    showControlsTemporarily();
  };

  // Subtitle Track Changer & Mock Track Loader
  const selectSubtitleTrack = (trackId) => {
    setActiveSubtitleTrackId(trackId);
    setShowSubtitlesModal(false);
    showControlsTemporarily();

    if (trackId === 'off') {
      parsedCuesRef.current = [];
      setActiveCueText('');
      return;
    }

    // If HLS native subtitle
    if (trackId.startsWith('hls_')) {
      const idx = parseInt(trackId.replace('hls_', ''), 10);
      if (hlsRef.current) {
        hlsRef.current.subtitleTrack = idx;
      }
      return;
    }

    // Generate high quality synchronized subtitle cues for the selected language
    if (trackId === 'ku') {
      parsedCuesRef.current = [
        { start: 1, end: 6, text: `بەخێربێن بۆ بینینی ${title}` },
        { start: 7, end: 14, text: 'پەخشی کوالێتی بەرز بە دەنگی سینەمایی' },
        { start: 16, end: 25, text: 'ئەم بەرهەمە لە سێرڤەری تایبەتی NNDD TV پەخش دەکرێت' },
        { start: 30, end: 40, text: 'سەیرکردنێکی خۆش لەگەڵ ئەپڵیکەیشنی کوردی NNDD' }
      ];
    } else if (trackId === 'ar') {
      parsedCuesRef.current = [
        { start: 1, end: 6, text: `أهلاً بكم لمشاهدة ${title}` },
        { start: 7, end: 14, text: 'بث بدقة عالية وصوت سينمائي محيطي' },
        { start: 16, end: 25, text: 'محتوى حصري ومميز عبر سيرفر NNDD TV' }
      ];
    } else if (trackId === 'en') {
      parsedCuesRef.current = [
        { start: 1, end: 6, text: `Welcome to ${title}` },
        { start: 7, end: 14, text: 'Streaming in Ultra HD with high fidelity audio' },
        { start: 16, end: 25, text: 'Enjoy high performance streaming on NNDD TV' }
      ];
    }
  };

  // Volume Adjustment Helper (with optional 200% software boost)
  const adjustVolume = useCallback((newVol) => {
    const clamped = Math.max(0, Math.min(200, Math.round(newVol)));
    setVolume(clamped);
    setIsMuted(clamped === 0);

    const video = videoRef.current;
    if (video) {
      video.volume = Math.min(1.0, clamped / 100);
      video.muted = clamped === 0;
    }
    triggerHUD('volume', clamped, clamped > 100 ? 'Boost' : '');
  }, [triggerHUD]);

  // Brightness Adjustment Helper (Software Filter 10% to 100%)
  const adjustBrightness = useCallback((newBright) => {
    const clamped = Math.max(10, Math.min(100, Math.round(newBright)));
    setBrightness(clamped);
    triggerHUD('brightness', clamped);
  }, [triggerHUD]);

  // =========================================================================
  // FULL MX PLAYER TOUCH GESTURE ENGINE (VOLUME, BRIGHTNESS, SEEK, DOUBLE-TAP)
  // =========================================================================
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    startVolume: 100,
    startBrightness: 100,
    startVideoTime: 0,
    gestureType: null, // 'volume' | 'brightness' | 'seek'
    lastTapTime: 0,
    tapTimeout: null,
    targetSeekTime: 0
  });

  const handleTouchStart = (e) => {
    if (isLocked) {
      setLockPrompt(true);
      setTimeout(() => setLockPrompt(false), 2000);
      return;
    }

    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const rect = playerContainerRef.current?.getBoundingClientRect() || {
      width: window.innerWidth,
      height: window.innerHeight,
      left: 0,
      top: 0
    };

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const now = Date.now();

    // Check for MX Player Double Tap
    const timeSinceLastTap = now - touchStateRef.current.lastTapTime;
    if (timeSinceLastTap < 300) {
      if (touchStateRef.current.tapTimeout) {
        clearTimeout(touchStateRef.current.tapTimeout);
        touchStateRef.current.tapTimeout = null;
      }
      touchStateRef.current.lastTapTime = 0;

      // Double tap location breakdown:
      // Left 35% -> Rewind 10s
      // Right 35% -> Forward 10s
      // Center 30% -> Play/Pause
      const width = rect.width;
      if (x < width * 0.35) {
        handleSkip(-10);
      } else if (x > width * 0.65) {
        handleSkip(10);
      } else {
        togglePlay();
      }
      return;
    }

    touchStateRef.current.lastTapTime = now;
    touchStateRef.current.startX = x;
    touchStateRef.current.startY = y;
    touchStateRef.current.startTime = now;
    touchStateRef.current.startVolume = volume;
    touchStateRef.current.startBrightness = brightness;
    touchStateRef.current.startVideoTime = videoRef.current ? videoRef.current.currentTime : 0;
    touchStateRef.current.gestureType = null;
    touchStateRef.current.targetSeekTime = touchStateRef.current.startVideoTime;
  };

  const handleTouchMove = (e) => {
    if (isLocked) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const rect = playerContainerRef.current?.getBoundingClientRect() || {
      width: window.innerWidth,
      height: window.innerHeight,
      left: 0,
      top: 0
    };

    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    const deltaX = currentX - touchStateRef.current.startX;
    const deltaY = currentY - touchStateRef.current.startY;

    // Detect gesture if not decided yet (threshold: 15px)
    if (!touchStateRef.current.gestureType) {
      if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        touchStateRef.current.gestureType = 'seek';
      } else if (Math.abs(deltaY) > 15) {
        // Left side of screen = Brightness, Right side = Volume
        if (touchStateRef.current.startX < rect.width * 0.5) {
          touchStateRef.current.gestureType = 'brightness';
        } else {
          touchStateRef.current.gestureType = 'volume';
        }
      }
    }

    // Execute gesture
    if (touchStateRef.current.gestureType === 'volume') {
      // Swiping up increases volume, swiping down decreases
      const deltaPercent = -(deltaY / (rect.height * 0.55)) * 100;
      const newVol = Math.max(0, Math.min(200, touchStateRef.current.startVolume + deltaPercent));
      adjustVolume(newVol);
    } else if (touchStateRef.current.gestureType === 'brightness') {
      // Swiping up increases brightness, swiping down decreases
      const deltaPercent = -(deltaY / (rect.height * 0.55)) * 100;
      const newBright = Math.max(10, Math.min(100, touchStateRef.current.startBrightness + deltaPercent));
      adjustBrightness(newBright);
    } else if (touchStateRef.current.gestureType === 'seek') {
      // Precision scrubbing across timeline
      const totalDur = duration || 3600;
      // Full screen swipe represents 2 minutes or 20% of movie
      const scrubRange = Math.min(totalDur * 0.3, 180);
      const deltaSecs = (deltaX / rect.width) * scrubRange;
      const targetTime = Math.max(0, Math.min(totalDur, touchStateRef.current.startVideoTime + deltaSecs));
      touchStateRef.current.targetSeekTime = targetTime;

      const diffSecs = targetTime - touchStateRef.current.startVideoTime;
      const diffSign = diffSecs >= 0 ? '+' : '';
      const diffFormatted = `${diffSign}${formatTime(Math.abs(diffSecs))}`;

      triggerHUD('seek', targetTime, diffFormatted, targetTime, 2000);
    }
  };

  const handleTouchEnd = () => {
    if (isLocked) return;

    // If was scrubbing, seek immediately on release
    if (touchStateRef.current.gestureType === 'seek') {
      const targetTime = touchStateRef.current.targetSeekTime;
      const video = videoRef.current;
      if (video && targetTime !== undefined) {
        video.currentTime = targetTime;
        setCurrentTime(targetTime);
      }
    }

    // Single Tap Toggle Controls (if no swipe gesture happened)
    if (!touchStateRef.current.gestureType) {
      touchStateRef.current.tapTimeout = setTimeout(() => {
        setShowControls(prev => !prev);
        touchStateRef.current.tapTimeout = null;
      }, 250);
    }

    touchStateRef.current.gestureType = null;
  };

  // TV Remote Control D-Pad & Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLocked) {
        if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13) {
          setIsLocked(false);
          triggerHUD('lock', 0, 'شاشە کرایەوە');
        }
        return;
      }

      showControlsTemporarily();

      switch (e.key) {
        case 'Escape':
        case 'Backspace':
        case 'GoBack':
          e.preventDefault();
          handleExit();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(volume + 5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(volume - 5);
          break;
        case ' ':
        case 'Enter':
        case 'Select':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          cycleAspectRatio();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, volume, handleSkip, adjustVolume, togglePlay, showControlsTemporarily]);

  // Fullscreen Container Toggle
  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // CSS Class for Aspect Ratio Mode
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case 'cover':
        return 'w-full h-full object-cover';
      case 'fill':
        return 'w-full h-full object-fill';
      case '16:9':
        return 'aspect-video w-full h-auto max-h-full max-w-full object-cover m-auto';
      case '4:3':
        return 'aspect-[4/3] w-auto h-full max-h-full max-w-full object-cover m-auto';
      case 'fit':
      default:
        return 'w-full h-full object-contain';
    }
  };

  return (
    <div
      ref={playerContainerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden touch-none"
      onMouseMove={showControlsTemporarily}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={showControlsTemporarily}
    >
      {/* =========================================================================
          VIDEO ELEMENT (Hardware Accelerated)
         ========================================================================= */}
      <video
        ref={videoRef}
        className={`${getAspectRatioClasses()} bg-black transition-all duration-200`}
        playsInline
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          setDuration(e.target.duration || 0);
          setIsBuffering(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onError={() => setIsBuffering(false)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          handleSaveProgress(0); // Completed
          if (isSeries && onNextEpisode) {
            onNextEpisode();
          }
        }}
      />

      {/* =========================================================================
          SOFTWARE BRIGHTNESS FILTER OVERLAY (MX Player Style)
          Works 100% smoothly inside WebView without needing Android OS permissions!
         ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none bg-black transition-opacity duration-150 z-10"
        style={{
          opacity: Math.max(0, (100 - brightness) / 100 * 0.88)
        }}
      />

      {/* =========================================================================
          CUSTOM SUBTITLE OVERLAY (Styled softsubs with size, color, background)
         ========================================================================= */}
      {activeCueText && (
        <div className="absolute bottom-20 sm:bottom-28 inset-x-4 sm:inset-x-12 z-20 pointer-events-none flex justify-center">
          <div
            className="text-center font-bold px-4 py-2 rounded-2xl max-w-3xl transition-all shadow-2xl"
            style={{
              fontSize:
                subtitleStyle.fontSize === 'small' ? '15px' :
                subtitleStyle.fontSize === 'large' ? '26px' :
                subtitleStyle.fontSize === 'xl' ? '32px' : '20px',
              color: subtitleStyle.color,
              backgroundColor: `rgba(0, 0, 0, ${subtitleStyle.backgroundOpacity})`,
              textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 2px #000'
            }}
          >
            {activeCueText}
          </div>
        </div>
      )}

      {/* =========================================================================
          MX PLAYER ON-SCREEN GESTURE HUD (VOLUME, BRIGHTNESS, SEEK, RIPPLE)
         ========================================================================= */}
      {/* 1. Vertical Volume Bar HUD (Right Side) */}
      {hudState.type === 'volume' && (
        <div className="absolute end-6 sm:end-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 p-4 rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/20 shadow-2xl animate-fade-in pointer-events-none min-w-[70px]">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            {hudState.value === 0 ? <VolumeX className="w-6 h-6 text-rose-400" /> :
             hudState.value > 100 ? <Volume2 className="w-6 h-6 text-amber-400" /> :
             <Volume2 className="w-6 h-6" />}
          </div>
          <div className="w-2.5 h-36 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
            <div
              className={`w-full rounded-full transition-all duration-75 ${
                hudState.value > 100 ? 'bg-gradient-to-t from-blue-500 to-amber-400' : 'bg-blue-500'
              }`}
              style={{ height: `${Math.min(100, (hudState.value / 200) * 100)}%` }}
            />
          </div>
          <span className="font-mono text-xs font-black text-white">
            {hudState.value}%
          </span>
          {hudState.value > 100 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/30 text-amber-300 border border-amber-400/30">
              Boost
            </span>
          )}
        </div>
      )}

      {/* 2. Vertical Brightness Bar HUD (Left Side) */}
      {hudState.type === 'brightness' && (
        <div className="absolute start-6 sm:start-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 p-4 rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/20 shadow-2xl animate-fade-in pointer-events-none min-w-[70px]">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Sun className="w-6 h-6" />
          </div>
          <div className="w-2.5 h-36 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
            <div
              className="w-full bg-amber-400 rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
              style={{ height: `${hudState.value}%` }}
            />
          </div>
          <span className="font-mono text-xs font-black text-white">
            {hudState.value}%
          </span>
        </div>
      )}

      {/* 3. Horizontal Scrubbing & Seek HUD (Center) */}
      {hudState.type === 'seek' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 p-6 rounded-3xl bg-slate-950/90 backdrop-blur-2xl border border-white/20 shadow-2xl pointer-events-none animate-fade-in min-w-[240px]">
          <div className="text-3xl font-black font-mono text-white tracking-wider">
            {formatTime(hudState.targetTime)}
          </div>
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <span className={hudState.diff.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>
              [{hudState.diff}]
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-300">{formatTime(duration)}</span>
          </div>
          <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${duration > 0 ? (hudState.targetTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* 4. Double-Tap Ripple Animation (+10s or -10s) */}
      {hudState.type === 'ripple_forward' && (
        <div className="absolute end-16 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 p-5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-ping pointer-events-none">
          <RotateCw className="w-8 h-8 text-white" />
          <span className="font-mono text-xs font-black text-white">+10s</span>
        </div>
      )}
      {hudState.type === 'ripple_rewind' && (
        <div className="absolute start-16 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 p-5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-ping pointer-events-none">
          <RotateCcw className="w-8 h-8 text-white" />
          <span className="font-mono text-xs font-black text-white">-10s</span>
        </div>
      )}

      {/* 5. Aspect Ratio Toast Banner */}
      {aspectToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white text-xs sm:text-sm font-black shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none">
          <Maximize2 className="w-4 h-4 text-blue-400" />
          <span>{aspectToast}</span>
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 bg-black/45 backdrop-blur-[2px]">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-blue-500 animate-spin mb-3 shadow-[0_0_25px_rgba(59,130,246,0.5)]" />
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            لۆدکردنی ستریم...
          </span>
        </div>
      )}

      {/* =========================================================================
          RESUME PLAYBACK FROM SAVED TIMESTAMP PROMPT
         ========================================================================= */}
      {resumePrompt && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-md w-[90%] p-4 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-blue-400/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3 text-right">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                بەردەوامبوون لە سەیرکردن؟
              </div>
              <div className="text-[11px] text-slate-300">
                وەستاوە لە خولەکی <span className="text-blue-300 font-mono font-bold">{formatTime(resumePrompt.time)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                handleSeek(resumePrompt.time);
                setResumePrompt(null);
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 cursor-pointer"
            >
              بەردەوامبە
            </button>
            <button
              onClick={() => {
                handleSeek(0);
                setResumePrompt(null);
              }}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              سەرەتا
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN LOCK FLOATING BUTTON (KIDS LOCK)
         ========================================================================= */}
      {isLocked && (
        <div className="absolute top-6 end-6 z-50 flex flex-col items-end gap-2 animate-fade-in">
          <button
            onClick={() => {
              setIsLocked(false);
              triggerHUD('lock', 0, 'شاشە کرایەوە');
              showControlsTemporarily();
            }}
            className="p-3.5 rounded-2xl bg-slate-900/90 text-amber-400 border border-amber-400/50 backdrop-blur-2xl shadow-[0_0_25px_rgba(251,191,36,0.4)] active:scale-90 transition-transform cursor-pointer flex items-center gap-2"
          >
            <Lock className="w-5 h-5" />
            <span className="text-xs font-black text-white">شاشە قوفڵە (کرتە بکە)</span>
          </button>
          {lockPrompt && (
            <span className="text-[11px] font-bold text-amber-300 bg-black/75 px-3 py-1 rounded-full backdrop-blur-md">
              بۆ کردنەوەی شاشە کلیک لەسەر دوگمەی قوفڵ بکە
            </span>
          )}
        </div>
      )}

      {/* =========================================================================
          FROSTED-GLASS TOP BAR
         ========================================================================= */}
      <div
        className={`absolute top-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-30 flex items-center justify-between ${
          showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Back Button & Title Info */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={handleExit}
            className="px-3.5 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg"
            title="داخستن و گەڕانەوە"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-bold">گەڕانەوە</span>
          </button>

          <div>
            <h2 className="text-sm sm:text-lg font-black text-white line-clamp-1 drop-shadow-md">
              {title}
            </h2>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-300 mt-0.5">
              <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                isSeries ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {isSeries ? 'زنجیرە' : 'فیلم'}
              </span>
              <span>•</span>
              <span>{item?.quality || '4K HDR'}</span>
              <span>•</span>
              <span>{item?.year || '2024'}</span>
              {currentClock && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{currentClock}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Pills */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Kids Screen Lock Toggle */}
          <button
            onClick={() => {
              setIsLocked(true);
              setShowControls(false);
              triggerHUD('lock', 0, 'شاشە قوفڵ کرا');
            }}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title="قوفڵکردنی شاشە (Kids Lock)"
          >
            <Unlock className="w-4 h-4 text-amber-300" />
          </button>

          {/* Aspect Ratio Cycler */}
          <button
            onClick={cycleAspectRatio}
            className="px-2.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="قەبارەی پەخش (Aspect Ratio)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline capitalize">{aspectRatio}</span>
          </button>

          {/* Subtitles Menu Button */}
          <button
            onClick={() => setShowSubtitlesModal(prev => !prev)}
            className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              activeSubtitleTrackId !== 'off'
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title="ژێرنووس و زمان"
          >
            <Subtitles className="w-4 h-4" />
            <span className="text-xs font-bold hidden md:inline">ژێرنووس</span>
          </button>

          {/* Audio Tracks & Speed Settings Menu Button */}
          <button
            onClick={() => setShowAudioModal(prev => !prev)}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="دەنگ و خێرایی"
          >
            <AudioLines className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold hidden md:inline">دەنگ</span>
          </button>

          {/* Close Button */}
          <button
            onClick={handleExit}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          FROSTED-GLASS BOTTOM BAR: TIMELINE SCRUBBER + TRANSPORT CONTROLS
         ========================================================================= */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 p-4 sm:p-7 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-opacity duration-300 z-30 flex flex-col gap-3.5 ${
          showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Timeline Bar */}
        <div className="flex items-center gap-3 w-full">
          <span className="font-mono text-xs sm:text-sm font-bold text-white min-w-[55px] text-center drop-shadow">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 group py-3 cursor-pointer">
            {/* Buffered Progress Indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-white/25 rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${bufferedPercent}%` }}
            />

            {/* Main Interactive Seek Range */}
            <input
              type="range"
              min="0"
              max={duration > 0 ? duration : 100}
              step="1"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-2 sm:h-2.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500 hover:h-3 transition-all relative z-10"
              style={{
                background: `linear-gradient(to right, ${
                  isSeries ? '#3b82f6' : '#f43f5e'
                } 0%, ${
                  isSeries ? '#3b82f6' : '#f43f5e'
                } ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, transparent ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, transparent 100%)`
              }}
            />
          </div>

          <span className="font-mono text-xs sm:text-sm font-bold text-white/70 min-w-[55px] text-center drop-shadow">
            {formatTime(duration)}
          </span>
        </div>

        {/* Transport Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Transport Cluster: Play/Pause, -10s, +10s */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={togglePlay}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 cursor-pointer ${
                isSeries
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40'
              }`}
              title={isPlaying ? 'وەستان (Pause)' : 'لێدان (Play)'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handleSkip(-10)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md"
              title="١٠ چرکە بۆ پاشەوە"
            >
              <RotateCcw className="w-4 h-4" />
              <span>-10s</span>
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md"
              title="١٠ چرکە بۆ پێشەوە"
            >
              <span>+10s</span>
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Playback Speed Pill */}
            <button
              onClick={() => setShowSpeedModal(prev => !prev)}
              className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer"
              title="خێرایی پەخش"
            >
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>{playbackSpeed}x</span>
            </button>
          </div>

          {/* Right Transport Cluster: Series Episodes, Drawer, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isSeries && item?.episodes && (
              <>
                <button
                  onClick={() => setShowEpisodeDrawer(prev => !prev)}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                  title="لیستی هەموو ئەڵقەکان"
                >
                  <List className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">ئەڵقەکان</span>
                </button>

                {onNextEpisode && (
                  <button
                    onClick={onNextEpisode}
                    disabled={
                      item.episodes.findIndex(
                        ep => ep.number === episode?.number
                      ) >= item.episodes.length - 1
                    }
                    className="px-3.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center gap-1.5 text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                    title="ئەڵقەی دواتر"
                  >
                    <span>ئەڵقەی داهاتوو</span>
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all active:scale-95 cursor-pointer"
              title="شاشەی تەواو"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUBTITLE MANAGEMENT MODAL (TRACK SELECTION, STYLING, TIME OFFSET)
         ========================================================================= */}
      {showSubtitlesModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 end-4 sm:end-8 w-80 sm:w-96 max-h-[80vh] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl z-40 flex flex-col gap-4 animate-fade-in custom-scrollbar"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-blue-400" />
              <span>ڕێکخستنی ژێرنووس (Subtitles)</span>
            </span>
            <button
              onClick={() => setShowSubtitlesModal(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subtitle Track Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">زمان / تراکی ژێرنووس</label>
            <div className="grid grid-cols-2 gap-2">
              {subtitleTracks.map((trk) => {
                const isSelected = activeSubtitleTrackId === trk.id;
                return (
                  <button
                    key={trk.id}
                    onClick={() => selectSubtitleTrack(trk.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/15 text-slate-300'
                    }`}
                  >
                    <span>{trk.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtitle Appearance Styling */}
          {activeSubtitleTrackId !== 'off' && (
            <>
              {/* Font Size */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">قەبارەی فۆنت</label>
                <div className="flex gap-2">
                  {['small', 'medium', 'large', 'xl'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSubtitleStyle(prev => ({ ...prev, fontSize: sz }))}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        subtitleStyle.fontSize === sz
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {sz === 'small' ? 'بچووک' : sz === 'medium' ? 'ئاسایی' : sz === 'large' ? 'گەورە' : 'زۆر گەورە'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Color */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">ڕەنگی نووسین</label>
                <div className="flex gap-2.5">
                  {[
                    { color: '#ffffff', label: 'سپی' },
                    { color: '#facc15', label: 'زەرد' },
                    { color: '#38bdf8', label: 'شین' },
                    { color: '#4ade80', label: 'سەوز' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setSubtitleStyle(prev => ({ ...prev, color: c.color }))}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        subtitleStyle.color === c.color ? 'border-white shadow-md' : 'border-transparent bg-white/5'
                      }`}
                      style={{ color: c.color }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Sync Offset (+/- ms) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">هاوکاتکردنی کات (Sync Offset)</label>
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {subtitleOffsetMs >= 0 ? `+${subtitleOffsetMs}ms` : `${subtitleOffsetMs}ms`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubtitleOffsetMs(prev => prev - 250)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                  >
                    -250ms (پاشەوە)
                  </button>
                  <button
                    onClick={() => setSubtitleOffsetMs(0)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                  >
                    ڕێکخستنەوە
                  </button>
                  <button
                    onClick={() => setSubtitleOffsetMs(prev => prev + 250)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                  >
                    +250ms (پێشەوە)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          AUDIO TRACKS & SOUND SETTINGS MODAL
         ========================================================================= */}
      {showAudioModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 end-4 sm:end-8 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl z-40 flex flex-col gap-4 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <AudioLines className="w-4 h-4 text-cyan-400" />
              <span>تراکەکانی دەنگ (Audio Tracks)</span>
            </span>
            <button
              onClick={() => setShowAudioModal(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {audioTracks.length > 0 ? (
              audioTracks.map((trk) => {
                const isSelected = currentAudioTrackIndex === trk.index;
                return (
                  <button
                    key={trk.index}
                    onClick={() => selectAudioTrack(trk.index)}
                    className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/15 text-slate-300'
                    }`}
                  >
                    <span>{trk.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-slate-400">
                تراکی سەرەکی (Stereo / Surround AAC) لە کاردایە
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          PLAYBACK SPEED MODAL
         ========================================================================= */}
      {showSpeedModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-24 start-4 sm:start-24 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl z-40 flex flex-col gap-2 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-1">
            <span className="font-bold text-xs text-white flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>خێرایی پەخش</span>
            </span>
            <button
              onClick={() => setShowSpeedModal(false)}
              className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
            <button
              key={spd}
              onClick={() => changeSpeed(spd)}
              className={`w-full p-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                playbackSpeed === spd
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white/5 hover:bg-white/15 text-slate-200'
              }`}
            >
              <span>{spd === 1.0 ? '1.0x (ئاسایی)' : `${spd}x`}</span>
              {playbackSpeed === spd && <Check className="w-4 h-4 text-slate-950" />}
            </button>
          ))}
        </div>
      )}

      {/* =========================================================================
          SERIES EPISODES DRAWER POPUP
         ========================================================================= */}
      {showEpisodeDrawer && item?.episodes && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 end-4 bottom-28 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl z-40 flex flex-col animate-fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <List className="w-4 h-4 text-blue-400" />
              <span>هەموو ئەڵقەکان ({item.episodes.length})</span>
            </span>
            <button
              onClick={() => setShowEpisodeDrawer(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {item.episodes.map((ep) => {
              const isCurrent = ep.number === episode?.number;
              const epProg = getVodProgress ? getVodProgress(item.id, ep.number) : 0;
              return (
                <button
                  key={ep.number}
                  onClick={() => {
                    handleSaveProgress();
                    if (onPlayEpisode) onPlayEpisode(item, ep);
                    setShowEpisodeDrawer(false);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'bg-white/5 hover:bg-white/15 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Play className={`w-3.5 h-3.5 ${isCurrent ? 'fill-white text-white' : 'text-blue-400'}`} />
                    <span className="text-xs truncate">{ep.title}</span>
                  </div>
                  <span className="text-[10px] opacity-70 font-mono">
                    {epProg > 5 ? formatTime(epProg) : ep.duration}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
