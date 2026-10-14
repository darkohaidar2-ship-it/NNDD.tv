import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
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
  AudioLines,
  Gauge,
  Maximize2,
  Minimize2,
  SkipForward,
  List,
  X,
  ArrowRight,
  Clock,
  Check,
  Upload,
  Layers,
  Sparkles
} from 'lucide-react';

/**
 * MX Player-Style Pro VOD & Series Cinema Player
 * Engineered for Xtream Codes Movies & Series on Mobile, Tablet & Android TV.
 */
export default function VodPlayer({
  session,
  onClose,
  onPlayEpisode,
  onNextEpisode,
  getVodProgress,
  saveVodProgress
}) {
  const { item, episode, isSeries, title, streamUrl, resumeTime } = session;

  // Media & Hardware References
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const mpegtsRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressSaveIntervalRef = useRef(null);
  const hasResumedRef = useRef(false);

  // Web Audio API References for 200% Software Volume Boost
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioSourceRef = useRef(null);

  // Playback Engine States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // UI Control & HUD States
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [currentClock, setCurrentClock] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // MX Player Display Modes: 'fit' | 'fill' | 'cover' | '16:9' | '4:3'
  const [aspectRatio, setAspectRatio] = useState('fit');
  const [aspectToast, setAspectToast] = useState(null);
  const [resumeToast, setResumeToast] = useState(null);

  // Volume (0% to 200% with Boost) & Brightness (15% to 100%)
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(100);

  // Interactive Gesture HUD (type: 'volume' | 'brightness' | 'seek' | 'ripple_forward' | 'ripple_rewind' | 'speed' | 'lock')
  const [hudState, setHudState] = useState({
    type: null,
    value: 0,
    diff: '',
    targetTime: 0
  });
  const hudTimeoutRef = useRef(null);

  // Modal Sheets
  const [showSubtitlesModal, setShowSubtitlesModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);

  // Audio Tracks Management
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudioTrackIndex, setCurrentAudioTrackIndex] = useState(0);

  // Subtitles Management
  const [subtitleTracks, setSubtitleTracks] = useState([
    { id: 'off', label: 'ناچالاک (Off)', lang: 'off' },
    { id: 'ku', label: 'کوردی (سۆرانی)', lang: 'ku' },
    { id: 'ar', label: 'عەرەبی (العربية)', lang: 'ar' },
    { id: 'en', label: 'ئینگلیزی (English)', lang: 'en' }
  ]);
  const [activeSubtitleTrackId, setActiveSubtitleTrackId] = useState('off');
  const [customSubtitleName, setCustomSubtitleName] = useState('');
  const [activeCueText, setActiveCueText] = useState('');
  const [subtitleOffsetMs, setSubtitleOffsetMs] = useState(0); // +/- ms
  const [subtitleStyle, setSubtitleStyle] = useState({
    fontSize: 'medium', // 'small' (16px), 'medium' (20px), 'large' (26px), 'xl' (32px)
    color: '#ffffff', // '#ffffff', '#facc15', '#38bdf8', '#4ade80'
    backgroundOpacity: 0.55
  });
  const parsedCuesRef = useRef([]);
  const fileInputRef = useRef(null);

  // 1. Clock Tracker
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

  // Time Formatter (HH:MM:SS or MM:SS)
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

  // Interactive HUD Notification
  const triggerHUD = useCallback((type, value, diff = '', targetTime = 0, durationMs = 1200) => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    setHudState({ type, value, diff, targetTime });
    hudTimeoutRef.current = setTimeout(() => {
      setHudState({ type: null, value: 0, diff: '', targetTime: 0 });
    }, durationMs);
  }, []);

  // Controls Auto-Hide (3.5s inactivity rule)
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

  // Save VOD Progress Callback
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

  // Auto-Save Interval (every 5 seconds)
  useEffect(() => {
    progressSaveIntervalRef.current = setInterval(() => {
      handleSaveProgress();
    }, 5000);
    return () => {
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
      handleSaveProgress();
    };
  }, [handleSaveProgress]);

  // Exit Player Cleanly
  const handleExit = () => {
    handleSaveProgress();
    // Destroy HLS
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch (e) {}
      hlsRef.current = null;
    }
    // Destroy mpegts
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.pause();
        mpegtsRef.current.unload();
        mpegtsRef.current.detachMediaElement();
        mpegtsRef.current.destroy();
      } catch (e) {}
      mpegtsRef.current = null;
    }
    // Clean Web Audio API
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (onClose) onClose();
  };

  // Web Audio API Initializer for 200% Gain Volume Boost
  const setupAudioBoost = useCallback(() => {
    if (audioContextRef.current || !videoRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(videoRef.current);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      audioContextRef.current = ctx;
      gainNodeRef.current = gain;
      audioSourceRef.current = source;
    } catch (e) {
      // Browsers or WebViews might restrict Web Audio if no user interaction yet or CORS
      console.warn('[VodPlayer] Web Audio API setup notice:', e);
    }
  }, []);

  // Volume Adjustment Handler (0% - 200%)
  const adjustVolume = useCallback((newVol) => {
    const clamped = Math.max(0, Math.min(200, Math.round(newVol)));
    setVolume(clamped);
    setIsMuted(clamped === 0);

    const video = videoRef.current;
    if (video) {
      if (clamped <= 100) {
        video.volume = clamped / 100;
        video.muted = clamped === 0;
        if (gainNodeRef.current) {
          try {
            gainNodeRef.current.gain.value = 1.0;
          } catch (e) {}
        }
      } else {
        // Boost Mode (101% - 200%)
        video.volume = 1.0;
        video.muted = false;
        setupAudioBoost();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
        if (gainNodeRef.current) {
          try {
            gainNodeRef.current.gain.value = clamped / 100;
          } catch (e) {}
        }
      }
    }
    triggerHUD('volume', clamped, clamped > 100 ? 'Boost' : '');
  }, [triggerHUD, setupAudioBoost]);

  // Brightness Adjustment (15% to 100%)
  const adjustBrightness = useCallback((newBright) => {
    const clamped = Math.max(15, Math.min(100, Math.round(newBright)));
    setBrightness(clamped);
    triggerHUD('brightness', clamped);
  }, [triggerHUD]);

  // Main Stream Engine Initializer (.mp4, .mkv, .m3u8 via HLS, .ts via mpegts)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setIsBuffering(true);
    hasResumedRef.current = false;
    video.volume = isMuted ? 0 : Math.min(1.0, volume / 100);
    video.playbackRate = playbackSpeed;

    // Determine Stream Type
    const isHls = /\.m3u8(\?.*)?$/i.test(streamUrl) || streamUrl.includes('.m3u8');
    const isMpegTs = (/\.ts(\?.*)?$/i.test(streamUrl) || streamUrl.includes('.ts')) && !isHls;

    // Clean previous engines
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch (e) {}
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.pause();
        mpegtsRef.current.unload();
        mpegtsRef.current.detachMediaElement();
        mpegtsRef.current.destroy();
      } catch (e) {}
      mpegtsRef.current = null;
    }

    // 1. HLS Stream Engine
    if (isHls && Hls.isSupported()) {
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

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        // Multi-audio detection
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const tracks = hls.audioTracks.map((t, idx) => ({
            index: idx,
            label: t.name || t.lang || `دەنگ #${idx + 1}`,
            lang: t.lang || 'und'
          }));
          setAudioTracks(tracks);
          setCurrentAudioTrackIndex(hls.audioTrack || 0);
        }

        // Subtitle tracks detection
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

        video.play().catch(() => {});
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          const tracks = data.audioTracks.map((t, idx) => ({
            index: idx,
            label: t.name || t.lang || `دەنگ #${idx + 1}`,
            lang: t.lang || 'und'
          }));
          setAudioTracks(tracks);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
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
    }
    // 2. RAW MPEG-TS via mpegts.js (MSE)
    else if (isMpegTs && mpegts.isSupported()) {
      try {
        const player = mpegts.createPlayer({
          type: 'mse',
          isLive: false,
          url: streamUrl
        }, {
          enableWorker: true,
          lazyLoad: false,
          autoCleanupSourceBuffer: true
        });
        mpegtsRef.current = player;
        player.attachMediaElement(video);
        player.load();
        player.play().catch(() => {});

        player.on(mpegts.Events.ERROR, () => {
          // Fallback to direct video src
          video.src = streamUrl;
          video.play().catch(() => {});
        });
      } catch (err) {
        video.src = streamUrl;
        video.play().catch(() => {});
      }
    }
    // 3. Direct HTTP/HTTPS Playback (.mp4, .mkv, etc.)
    else {
      video.src = streamUrl;
      video.play().catch(() => {});
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
      if (mpegtsRef.current) {
        try {
          mpegtsRef.current.pause();
          mpegtsRef.current.unload();
          mpegtsRef.current.detachMediaElement();
          mpegtsRef.current.destroy();
        } catch (e) {}
        mpegtsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Handle Video Metadata & Auto-Resume
  const handleLoadedMetadata = (e) => {
    const dur = e.target.duration || 0;
    setDuration(dur);
    setIsBuffering(false);

    // Auto-Resume from session.resumeTime or stored progress
    const epNum = episode ? episode.number : 0;
    const targetResume = (resumeTime && resumeTime > 5)
      ? resumeTime
      : (getVodProgress ? getVodProgress(item?.id, epNum) : parseFloat(localStorage.getItem(`nndd_vod_progress_${item?.id}_${epNum}`) || '0'));

    if (targetResume > 8 && !hasResumedRef.current) {
      hasResumedRef.current = true;
      const target = Math.min(targetResume, Math.max(0, dur - 10));
      e.target.currentTime = target;
      setCurrentTime(target);
      setResumeToast({ time: target });
      setTimeout(() => setResumeToast(null), 4000);
    }
  };

  // Handle Video Time Update & Subtitle Sync
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }

    // Buffered percent calculation
    if (video.buffered && video.buffered.length > 0 && video.duration) {
      try {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedPercent(Math.min(100, (bufferedEnd / video.duration) * 100));
      } catch (e) {}
    }

    // Subtitle Cue Sync
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

  // Seek Handler
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

    if (seconds > 0) {
      triggerHUD('ripple_forward', target, `+${seconds}s`);
    } else {
      triggerHUD('ripple_rewind', target, `${seconds}s`);
    }
    showControlsTemporarily();
  }, [duration, triggerHUD, showControlsTemporarily]);

  // Aspect Ratio Cycler
  const cycleAspectRatio = () => {
    const modes = ['fit', 'fill', 'cover', '16:9', '4:3'];
    const labels = {
      'fit': 'ڕەسەن (Fit)',
      'fill': 'پڕکردنی شاشە (Stretch)',
      'cover': 'گەورەکردن (Zoom/Crop)',
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

  // Parse SRT or WebVTT content
  const parseSrtOrVtt = (text) => {
    const cues = [];
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\s*\n/);
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;
      const timeLineIndex = lines.findIndex(l => l.includes('-->'));
      if (timeLineIndex === -1) continue;
      const timeLine = lines[timeLineIndex];
      const [startStr, endStr] = timeLine.split('-->').map(s => s.trim().replace(',', '.'));
      const parseTime = (t) => {
        const parts = t.split(':');
        if (parts.length === 3) {
          return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        } else if (parts.length === 2) {
          return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
        }
        return 0;
      };
      const start = parseTime(startStr);
      const end = parseTime(endStr);
      const textContent = lines.slice(timeLineIndex + 1).join('\n').replace(/<[^>]*>/g, '').trim();
      if (textContent && !isNaN(start) && !isNaN(end)) {
        cues.push({ start, end, text: textContent });
      }
    }
    return cues;
  };

  // Custom Subtitle Upload Handler (.srt or .vtt)
  const handleSubtitleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const cues = parseSrtOrVtt(content);
        if (cues.length > 0) {
          parsedCuesRef.current = cues;
          const customId = `custom_${Date.now()}`;
          const newTrack = { id: customId, label: file.name, lang: 'custom' };
          setSubtitleTracks(prev => [...prev.filter(t => !t.id.startsWith('custom_')), newTrack]);
          setActiveSubtitleTrackId(customId);
          setCustomSubtitleName(file.name);
          setShowSubtitlesModal(false);
          triggerHUD('subtitle', 0, 'ژێرنووس بارکرا');
        }
      }
    };
    reader.readAsText(file);
  };

  // Subtitle Track Selection
  const selectSubtitleTrack = (trackId) => {
    setActiveSubtitleTrackId(trackId);
    setShowSubtitlesModal(false);
    showControlsTemporarily();

    if (trackId === 'off') {
      parsedCuesRef.current = [];
      setActiveCueText('');
      return;
    }

    if (trackId.startsWith('hls_')) {
      const idx = parseInt(trackId.replace('hls_', ''), 10);
      if (hlsRef.current) {
        hlsRef.current.subtitleTrack = idx;
      }
      return;
    }

    if (trackId.startsWith('custom_')) {
      return; // Already loaded in parsedCuesRef
    }

    // High-quality Synchronized Cues for demo
    if (trackId === 'ku') {
      parsedCuesRef.current = [
        { start: 1, end: 6, text: `بەخێربێن بۆ بینینی ${title}` },
        { start: 7, end: 14, text: 'پەخشی کوالێتی بەرز بە دەنگی سینەمایی لە NNDD TV' },
        { start: 15, end: 25, text: 'ئەم بەرهەمە لە سێرڤەری تایبەتی کوردستریم پەخش دەکرێت' },
        { start: 26, end: 40, text: 'سەیرکردنێکی خۆش لەگەڵ ئەپڵیکەیشنی کوردی NNDD' }
      ];
    } else if (trackId === 'ar') {
      parsedCuesRef.current = [
        { start: 1, end: 6, text: `أهلاً بكم لمشاهدة ${title}` },
        { start: 7, end: 14, text: 'بث فائق الجودة وصوت سينمائي عبر NNDD TV' },
        { start: 15, end: 25, text: 'مشاهدة ممتعة وحصرية' }
      ];
    } else if (trackId === 'en') {
      parsedCuesRef.current = [
        { start: 1, end: 6, text: `Welcome to ${title}` },
        { start: 7, end: 14, text: 'Streaming in Ultra HD with high fidelity audio' },
        { start: 15, end: 25, text: 'Enjoy high performance streaming on NNDD TV' }
      ];
    }
  };

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
    // If screen is locked, only show floating unlock prompt
    if (isLocked) {
      setShowLockPrompt(true);
      setTimeout(() => setShowLockPrompt(false), 2500);
      return;
    }

    // Ignore interactive elements
    if (e.target.closest('button, input, select, textarea, [data-interactive="true"]')) {
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

    // Double-Tap Detection (<300ms)
    const timeSinceLastTap = now - touchStateRef.current.lastTapTime;
    if (timeSinceLastTap < 300) {
      if (touchStateRef.current.tapTimeout) {
        clearTimeout(touchStateRef.current.tapTimeout);
        touchStateRef.current.tapTimeout = null;
      }
      touchStateRef.current.lastTapTime = 0;

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
    if (e.target.closest('button, input, select, textarea, [data-interactive="true"]')) return;
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

    // Gesture detection threshold: 14px
    if (!touchStateRef.current.gestureType) {
      if (Math.abs(deltaX) > 14 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        touchStateRef.current.gestureType = 'seek';
      } else if (Math.abs(deltaY) > 14) {
        // Left 50% = Brightness, Right 50% = Volume
        if (touchStateRef.current.startX < rect.width * 0.5) {
          touchStateRef.current.gestureType = 'brightness';
        } else {
          touchStateRef.current.gestureType = 'volume';
        }
      }
    }

    // Execute Gestures
    if (touchStateRef.current.gestureType === 'volume') {
      const deltaPercent = -(deltaY / (rect.height * 0.55)) * 100;
      const newVol = Math.max(0, Math.min(200, touchStateRef.current.startVolume + deltaPercent));
      adjustVolume(newVol);
    } else if (touchStateRef.current.gestureType === 'brightness') {
      const deltaPercent = -(deltaY / (rect.height * 0.55)) * 100;
      const newBright = Math.max(15, Math.min(100, touchStateRef.current.startBrightness + deltaPercent));
      adjustBrightness(newBright);
    } else if (touchStateRef.current.gestureType === 'seek') {
      const totalDur = duration || 3600;
      const scrubRange = Math.min(totalDur * 0.35, 240);
      const deltaSecs = (deltaX / rect.width) * scrubRange;
      const targetTime = Math.max(0, Math.min(totalDur, touchStateRef.current.startVideoTime + deltaSecs));
      touchStateRef.current.targetSeekTime = targetTime;

      const diffSecs = targetTime - touchStateRef.current.startVideoTime;
      const diffSign = diffSecs >= 0 ? '+' : '';
      const diffFormatted = `${diffSign}${formatTime(Math.abs(diffSecs))}`;

      triggerHUD('seek', targetTime, diffFormatted, targetTime, 2000);
    }
  };

  const handleTouchEnd = (e) => {
    if (isLocked) return;
    if (e.target.closest('button, input, select, textarea, [data-interactive="true"]')) return;

    if (touchStateRef.current.gestureType === 'seek') {
      const targetTime = touchStateRef.current.targetSeekTime;
      const video = videoRef.current;
      if (video && targetTime !== undefined) {
        video.currentTime = targetTime;
        setCurrentTime(targetTime);
      }
    }

    // Single Tap Toggle Controls
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
          if (showSubtitlesModal || showAudioModal || showSpeedModal || showEpisodeDrawer) {
            setShowSubtitlesModal(false);
            setShowAudioModal(false);
            setShowSpeedModal(false);
            setShowEpisodeDrawer(false);
          } else {
            handleExit();
          }
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
          if (!e.target.closest('button, input, select')) {
            e.preventDefault();
            togglePlay();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          cycleAspectRatio();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          if (isMuted) {
            adjustVolume(volume || 50);
          } else {
            setIsMuted(true);
            if (videoRef.current) videoRef.current.muted = true;
            triggerHUD('volume', 0);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, volume, isMuted, showSubtitlesModal, showAudioModal, showSpeedModal, showEpisodeDrawer, handleSkip, adjustVolume, togglePlay, showControlsTemporarily]);

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

  // Aspect Ratio CSS
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
      {/* Hidden Subtitle File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".srt,.vtt,.txt"
        className="hidden"
        onChange={handleSubtitleFileUpload}
      />

      {/* =========================================================================
          VIDEO ELEMENT (Hardware Accelerated)
         ========================================================================= */}
      <video
        ref={videoRef}
        className={`${getAspectRatioClasses()} bg-black transition-all duration-200`}
        playsInline
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onError={() => setIsBuffering(false)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          handleSaveProgress(0);
          if (isSeries && onNextEpisode) {
            onNextEpisode();
          }
        }}
      />

      {/* =========================================================================
          SOFTWARE BRIGHTNESS FILTER OVERLAY (MX Player Style, WebView Compatible)
         ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none bg-black transition-opacity duration-150 z-10"
        style={{
          opacity: Math.max(0, (100 - brightness) / 100 * 0.85)
        }}
      />

      {/* =========================================================================
          CUSTOM SUBTITLE OVERLAY
         ========================================================================= */}
      {activeCueText && (
        <div className="absolute bottom-20 sm:bottom-28 inset-x-4 sm:inset-x-12 z-20 pointer-events-none flex justify-center">
          <div
            className="text-center font-bold px-4 py-2 rounded-2xl max-w-3xl transition-all shadow-2xl"
            style={{
              fontSize:
                subtitleStyle.fontSize === 'small' ? '16px' :
                subtitleStyle.fontSize === 'large' ? '26px' :
                subtitleStyle.fontSize === 'xl' ? '32px' : '20px',
              color: subtitleStyle.color,
              backgroundColor: `rgba(0, 0, 0, ${subtitleStyle.backgroundOpacity})`,
              textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 3px #000'
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
        <div className="absolute end-6 sm:end-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 p-4 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/20 shadow-2xl animate-fade-in pointer-events-none min-w-[70px]">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            {hudState.value === 0 ? <VolumeX className="w-6 h-6 text-rose-400" /> :
             hudState.value > 100 ? <Volume2 className="w-6 h-6 text-amber-400" /> :
             <Volume2 className="w-6 h-6" />}
          </div>
          <div className="w-2.5 h-36 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
            <div
              className={`w-full rounded-full transition-all duration-75 ${
                hudState.value > 100 ? 'bg-gradient-to-t from-blue-500 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' : 'bg-blue-500'
              }`}
              style={{ height: `${Math.min(100, (hudState.value / 200) * 100)}%` }}
            />
          </div>
          <span className="font-mono text-xs font-black text-white">
            {hudState.value}%
          </span>
          {hudState.value > 100 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/30 text-amber-300 border border-amber-400/40">
              Boost
            </span>
          )}
        </div>
      )}

      {/* 2. Vertical Brightness Bar HUD (Left Side) */}
      {hudState.type === 'brightness' && (
        <div className="absolute start-6 sm:start-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 p-4 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/20 shadow-2xl animate-fade-in pointer-events-none min-w-[70px]">
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

      {/* 4. Double-Tap Ripple Feedback (+10s or -10s) */}
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

      {/* 6. Auto-Resume Toast Banner */}
      {resumeToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-blue-400/40 text-white text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-3 animate-fade-in" data-interactive="true">
          <div className="flex items-center gap-1.5 text-blue-300">
            <Clock className="w-4 h-4" />
            <span>دەستپێکردنەوە لە {formatTime(resumeToast.time)}</span>
          </div>
          <button
            onClick={() => {
              handleSeek(0);
              setResumeToast(null);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
          >
            سەرەتا
          </button>
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
          SCREEN LOCK FLOATING PADLOCK (KIDS LOCK)
         ========================================================================= */}
      {isLocked && (
        <div className="absolute top-6 end-6 z-50 flex flex-col items-end gap-2 animate-fade-in" data-interactive="true">
          <button
            onClick={() => {
              setIsLocked(false);
              triggerHUD('lock', 0, 'شاشە کرایەوە');
              showControlsTemporarily();
            }}
            className="p-3.5 rounded-2xl bg-slate-900/90 text-amber-400 border border-amber-400/50 backdrop-blur-2xl shadow-[0_0_25px_rgba(251,191,36,0.4)] active:scale-90 transition-transform cursor-pointer flex items-center gap-2"
          >
            <Lock className="w-5 h-5" />
            <span className="text-xs font-black text-white">شاشە قوفڵە (کرتە بکە بۆ کردنەوە)</span>
          </button>
          {showLockPrompt && (
            <span className="text-[11px] font-bold text-amber-300 bg-black/85 px-3 py-1 rounded-full backdrop-blur-md animate-pulse">
              شاشە قوفڵ کراوە، کرتە لە دوگمەی قوفڵ بکە بۆ کردنەوە
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
        data-interactive="true"
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
            title="قوفڵکردنی شاشە (Screen Lock)"
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

          {/* Audio Tracks Menu Button */}
          <button
            onClick={() => setShowAudioModal(prev => !prev)}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="تراکەکانی دەنگ"
          >
            <AudioLines className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold hidden md:inline">دەنگ</span>
          </button>

          {/* Close Button */}
          <button
            onClick={handleExit}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow-lg"
            title="داخستن"
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
        data-interactive="true"
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
          {/* Left Transport Cluster: Play/Pause, -10s, +10s, Speed */}
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
          SUBTITLE MANAGEMENT MODAL (TRACK SELECTION, STYLING, TIME OFFSET, UPLOAD)
         ========================================================================= */}
      {showSubtitlesModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 end-4 sm:end-8 w-80 sm:w-96 max-h-[82vh] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl z-40 flex flex-col gap-4 animate-fade-in custom-scrollbar"
          data-interactive="true"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-blue-400" />
              <span>ڕێکخستنی ژێرنووس (Subtitles)</span>
            </span>
            <button
              onClick={() => setShowSubtitlesModal(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
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
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/15 text-slate-300'
                    }`}
                  >
                    <span className="truncate">{trk.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Custom Subtitle (.srt / .vtt) */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white border border-white/15 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>بارکردنی فایلی ژێرنووس (.srt, .vtt)</span>
            </button>
            {customSubtitleName && (
              <p className="text-[11px] text-blue-300 mt-1 truncate">
                فایلی هەڵبژێردراو: {customSubtitleName}
              </p>
            )}
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
                <div className="flex gap-2">
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

              {/* Time Sync Offset (+/- 0.5s) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">هاوکاتکردنی کات (Sync Offset)</label>
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {subtitleOffsetMs >= 0 ? `+${(subtitleOffsetMs / 1000).toFixed(1)}s` : `${(subtitleOffsetMs / 1000).toFixed(1)}s`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubtitleOffsetMs(prev => prev - 500)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                  >
                    -0.5s (پاشەوە)
                  </button>
                  <button
                    onClick={() => setSubtitleOffsetMs(0)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                  >
                    ڕێکخستنەوە
                  </button>
                  <button
                    onClick={() => setSubtitleOffsetMs(prev => prev + 500)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                  >
                    +0.5s (پێشەوە)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          AUDIO TRACKS MODAL
         ========================================================================= */}
      {showAudioModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 end-4 sm:end-8 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl z-40 flex flex-col gap-4 animate-fade-in"
          data-interactive="true"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <AudioLines className="w-4 h-4 text-cyan-400" />
              <span>تراکەکانی دەنگ (Audio Tracks)</span>
            </span>
            <button
              onClick={() => setShowAudioModal(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
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
          data-interactive="true"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-1">
            <span className="font-bold text-xs text-white flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>خێرایی پەخش</span>
            </span>
            <button
              onClick={() => setShowSpeedModal(false)}
              className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
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
          SERIES EPISODES DRAWER
         ========================================================================= */}
      {showEpisodeDrawer && item?.episodes && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 end-4 bottom-28 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl z-40 flex flex-col animate-fade-in"
          data-interactive="true"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <List className="w-4 h-4 text-blue-400" />
              <span>هەموو ئەڵقەکان ({item.episodes.length})</span>
            </span>
            <button
              onClick={() => setShowEpisodeDrawer(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
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
