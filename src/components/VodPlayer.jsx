import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { getAbsoluteStreamProxyUrl } from '../data/streamProxyHelper';
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
  Home,
  Clock,
  Check,
  Upload,
  Moon,
  Sparkles
} from 'lucide-react';

/**
 * MX Player-Style Pro VOD & Series Cinema Player
 * Engineered for Xtream Codes Movies & Series on Mobile, Tablet & Android TV.
 */
export default function VodPlayer({
  session,
  onClose,
  onHome,
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

  // Press-and-Hold for 2x Speed
  const is2xHoldingRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const previousSpeedRef = useRef(1.0);
  const [is2xSpeedActive, setIs2xSpeedActive] = useState(false);

  // TV Remote Control D-Pad Navigation & Focus System
  const [remoteZone, setRemoteZone] = useState('bottom'); // 'bottom' | 'top'
  const [remoteBottomIndex, setRemoteBottomIndex] = useState(0);
  const [remoteTopIndex, setRemoteTopIndex] = useState(0);
  const [remoteModalIndex, setRemoteModalIndex] = useState(0);
  const remoteLongPressTimerRef = useRef(null);
  const isRemoteHoldingOkRef = useRef(false);

  // Sleep Timer States (Off, 15m, 30m, 45m, 60m)
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState(0);
  const [showSleepModal, setShowSleepModal] = useState(false);

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

  // Interactive Gesture HUD
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
  const [subtitleOffsetMs, setSubtitleOffsetMs] = useState(0);
  const [subtitleStyle, setSubtitleStyle] = useState({
    fontSize: 'medium',
    color: '#ffffff',
    backgroundOpacity: 0.55
  });
  const parsedCuesRef = useRef([]);
  const fileInputRef = useRef(null);

  // Live Wall Clock
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

  // Sleep Timer Countdown
  useEffect(() => {
    if (sleepSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSleepSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepSecondsLeft]);

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

  // Interactive HUD Notification
  const triggerHUD = useCallback((type, value, diff = '', targetTime = 0, durationMs = 1200) => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    setHudState({ type, value, diff, targetTime });
    hudTimeoutRef.current = setTimeout(() => {
      setHudState({ type: null, value: 0, diff: '', targetTime: 0 });
    }, durationMs);
  }, []);

  // Controls Auto-Hide
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
      setShowSleepModal(false);
    }, 3000);
  }, [isLocked]);

  useEffect(() => {
    if (showSubtitlesModal || showAudioModal || showSpeedModal || showEpisodeDrawer || showSleepModal) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
    }
  }, [showSubtitlesModal, showAudioModal, showSpeedModal, showEpisodeDrawer, showSleepModal]);

  // Save Progress Callback (Auto-resume tracking every 5s)
  const handleSaveProgress = useCallback((forceTime = null) => {
    const video = videoRef.current;
    const saveTime = forceTime !== null ? forceTime : (video ? video.currentTime : currentTime);
    const dur = video ? video.duration : duration;
    if (saveTime > 2 && item) {
      const epNum = episode ? episode.number : 0;
      if (saveVodProgress) {
        saveVodProgress(item.id, epNum, saveTime);
      }
      try {
        localStorage.setItem(`nndd_vod_progress_${item.id}_${epNum}`, saveTime.toFixed(1));
        localStorage.setItem(`kobin_vod_progress_${item.id}_${epNum}`, JSON.stringify({
          currentTime: parseFloat(saveTime.toFixed(1)),
          duration: dur && !isNaN(dur) ? parseFloat(dur.toFixed(1)) : 0,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }
  }, [item, episode, currentTime, duration, saveVodProgress]);

  // Periodic Auto-Save
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

  // Press-and-Hold for 2x Speed
  const start2xSpeed = useCallback(() => {
    const video = videoRef.current;
    if (!video || is2xHoldingRef.current) return;
    is2xHoldingRef.current = true;
    previousSpeedRef.current = video.playbackRate;
    video.playbackRate = 2.0;
    setIs2xSpeedActive(true);
  }, []);

  const stop2xSpeed = useCallback(() => {
    if (!is2xHoldingRef.current) return;
    is2xHoldingRef.current = false;
    const video = videoRef.current;
    if (video) {
      video.playbackRate = previousSpeedRef.current || playbackSpeed || 1.0;
    }
    setIs2xSpeedActive(false);
  }, [playbackSpeed]);

  // Main Stream Engine Initializer (.mp4, .mkv, .m3u8 via HLS, .ts via mpegts)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    let targetUrl = streamUrl;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && targetUrl.startsWith('http:') && !targetUrl.startsWith('http://localhost') && !targetUrl.startsWith('http://127.0.0.1')) {
      targetUrl = getAbsoluteStreamProxyUrl(targetUrl);
    }

    setIsBuffering(true);
    hasResumedRef.current = false;
    video.volume = isMuted ? 0 : Math.min(1.0, volume / 100);
    video.playbackRate = playbackSpeed;

    const isHls = /\.m3u8(\?.*)?$/i.test(targetUrl) || targetUrl.includes('.m3u8');
    const isMpegTs = (/\.ts(\?.*)?$/i.test(targetUrl) || targetUrl.includes('.ts')) && !isHls;

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

      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(targetUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        // Start at FULL quality on initial startup, then let auto-ABR adapt
        if (hls.levels && hls.levels.length > 0) {
          const sorted = hls.levels
            .map((lvl, idx) => ({ ...lvl, index: idx }))
            .sort((a, b) => ((b.height || 0) - (a.height || 0)) || ((b.bitrate || 0) - (a.bitrate || 0)));
          const maxLevel = sorted[0]?.index ?? (hls.levels.length - 1);
          hls.startLevel = maxLevel;
          hls.nextLoadLevel = maxLevel;
          hls.currentLevel = -1;
        }
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const tracks = hls.audioTracks.map((t, idx) => ({
            index: idx,
            label: t.name || t.lang || `دەنگ #${idx + 1}`,
            lang: t.lang || 'und'
          }));
          setAudioTracks(tracks);
          setCurrentAudioTrackIndex(hls.audioTrack || 0);
        }

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

        try {
          video?.play?.()?.catch?.(() => {});
        } catch(e) {}
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
    } else if (isMpegTs && mpegts.isSupported()) {
      try {
        const player = mpegts.createPlayer({
          type: 'mse',
          isLive: false,
          url: targetUrl
        }, {
          enableWorker: true,
          lazyLoad: false,
          autoCleanupSourceBuffer: true
        });
        mpegtsRef.current = player;
        player.attachMediaElement(video);
        player.load();
        try {
          player?.play?.()?.catch?.(() => {});
        } catch(e) {}

        player.on(mpegts.Events.ERROR, () => {
          if (videoRef.current) {
            try {
              videoRef.current.src = targetUrl;
              videoRef.current.play()?.catch?.(() => {});
            } catch(e) {}
          }
        });
      } catch (err) {
        if (videoRef.current) {
          try {
            videoRef.current.src = targetUrl;
            videoRef.current.play()?.catch?.(() => {});
          } catch(e) {}
        }
      }
    } else {
      if (videoRef.current) {
        try {
          videoRef.current.src = targetUrl;
          videoRef.current.play()?.catch?.(() => {});
        } catch(e) {}
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

    const epNum = episode ? episode.number : 0;
    let targetResume = 0;
    try {
      const savedRaw = localStorage.getItem(`kobin_vod_progress_${item?.id}_${epNum}`);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        targetResume = parsed.currentTime || 0;
      }
    } catch (e) {}
    if (!targetResume) {
      targetResume = (resumeTime && resumeTime > 2)
        ? resumeTime
        : (getVodProgress ? getVodProgress(item?.id, epNum) : parseFloat(localStorage.getItem(`nndd_vod_progress_${item?.id}_${epNum}`) || '0'));
    }

    if (targetResume > 2 && !hasResumedRef.current) {
      hasResumedRef.current = true;
      const target = Math.min(targetResume, Math.max(0, dur - 3));
      e.target.currentTime = target;
      setCurrentTime(target);
      setResumeToast({ time: target });
      setTimeout(() => setResumeToast(null), 3500);
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

    if (video.buffered && video.buffered.length > 0 && video.duration) {
      try {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedPercent(Math.min(100, (bufferedEnd / video.duration) * 100));
      } catch (e) {}
    }

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
      try {
        video?.play?.()?.catch?.(() => {});
      } catch(e) {}
      setIsPlaying(true);
    } else {
      try {
        video?.pause?.();
      } catch(e) {}
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

  // Custom Subtitle Upload Handler (.srt / .vtt)
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
      return;
    }

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
  // FULL MX PLAYER TOUCH GESTURE ENGINE (VOLUME, BRIGHTNESS, SEEK, DOUBLE-TAP, LONG-PRESS 2X)
  // =========================================================================
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    startVolume: 100,
    startBrightness: 100,
    startVideoTime: 0,
    gestureType: null,
    lastTapTime: 0,
    tapTimeout: null,
    targetSeekTime: 0
  });

  const handleTouchStart = (e) => {
    if (isLocked) {
      setShowLockPrompt(true);
      setTimeout(() => setShowLockPrompt(false), 2500);
      return;
    }

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

    // Start Long-Press timer for 2x Speed Boost
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      start2xSpeed();
    }, 450);

    // Double-Tap Detection (<300ms)
    const timeSinceLastTap = now - touchStateRef.current.lastTapTime;
    if (timeSinceLastTap < 300) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
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

    // If moved noticeably, cancel 2x long press
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      stop2xSpeed();
    }

    // Gesture detection threshold: 14px
    if (!touchStateRef.current.gestureType) {
      if (Math.abs(deltaX) > 14 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        touchStateRef.current.gestureType = 'seek';
      } else if (Math.abs(deltaY) > 14) {
        if (touchStateRef.current.startX < rect.width * 0.5) {
          touchStateRef.current.gestureType = 'brightness';
        } else {
          touchStateRef.current.gestureType = 'volume';
        }
      }
    }

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
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    stop2xSpeed();

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

  // TV Remote Control D-Pad & Keyboard Navigation System
  useEffect(() => {
    const bottomCount = isSeries ? (onNextEpisode ? 7 : 6) : 5;
    const topCount = 7;

    const handleKeyDown = (e) => {
      if (isLocked) {
        if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.key === 'Select') {
          setIsLocked(false);
          triggerHUD('lock', 0, 'شاشە کرایەوە');
        }
        return;
      }

      const isSelectKey = e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.key === 'Select';
      const isBackKey = e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack' || e.keyCode === 27 || e.keyCode === 4;

      if (isBackKey) {
        e.preventDefault();
        if (showSubtitlesModal || showAudioModal || showSpeedModal || showEpisodeDrawer || showSleepModal) {
          setShowSubtitlesModal(false);
          setShowAudioModal(false);
          setShowSpeedModal(false);
          setShowEpisodeDrawer(false);
          setShowSleepModal(false);
          showControlsTemporarily();
        } else {
          handleExit();
        }
        return;
      }

      // Check if any modal is currently open
      const isAnyModalOpen = showSubtitlesModal || showAudioModal || showSpeedModal || showEpisodeDrawer || showSleepModal;

      if (isAnyModalOpen) {
        let modalItemsCount = 1;
        if (showSleepModal) modalItemsCount = 5;
        else if (showSpeedModal) modalItemsCount = 6;
        else if (showSubtitlesModal) modalItemsCount = subtitleTracks.length;
        else if (showAudioModal) modalItemsCount = Math.max(1, audioTracks.length);
        else if (showEpisodeDrawer) modalItemsCount = item?.episodes?.length || 1;

        if (e.key === 'ArrowUp' || e.keyCode === 38) {
          e.preventDefault();
          setRemoteModalIndex(prev => Math.max(0, prev - 1));
          showControlsTemporarily();
          return;
        } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
          e.preventDefault();
          setRemoteModalIndex(prev => Math.min(modalItemsCount - 1, prev + 1));
          showControlsTemporarily();
          return;
        } else if (isSelectKey) {
          e.preventDefault();
          if (showSleepModal) {
            const sleepOptions = [0, 15, 30, 45, 60];
            const mins = sleepOptions[remoteModalIndex] || 0;
            setSleepSecondsLeft(mins * 60);
            setShowSleepModal(false);
            triggerHUD('sleep', mins, mins > 0 ? `${mins} خولەک` : 'ناچالاک');
          } else if (showSpeedModal) {
            const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
            const spd = speedOptions[remoteModalIndex] || 1.0;
            changeSpeed(spd);
          } else if (showSubtitlesModal) {
            const targetTrack = subtitleTracks[remoteModalIndex];
            if (targetTrack) selectSubtitleTrack(targetTrack.id);
          } else if (showAudioModal) {
            if (audioTracks[remoteModalIndex]) selectAudioTrack(remoteModalIndex);
            else setShowAudioModal(false);
          } else if (showEpisodeDrawer && item?.episodes) {
            const targetEp = item.episodes[remoteModalIndex];
            if (targetEp) {
              handleSaveProgress();
              if (onPlayEpisode) onPlayEpisode(item, targetEp);
              setShowEpisodeDrawer(false);
            }
          }
          showControlsTemporarily();
          return;
        }
      }

      // When controls are HIDDEN: Fast navigation gestures
      if (!showControls) {
        if (e.key === 'ArrowLeft' || e.keyCode === 37) {
          e.preventDefault();
          handleSkip(-10);
          showControlsTemporarily();
          return;
        } else if (e.key === 'ArrowRight' || e.keyCode === 39) {
          e.preventDefault();
          handleSkip(10);
          showControlsTemporarily();
          return;
        } else if (e.key === 'ArrowUp' || e.keyCode === 38) {
          e.preventDefault();
          adjustVolume(volume + 5);
          showControlsTemporarily();
          return;
        } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
          e.preventDefault();
          adjustVolume(volume - 5);
          showControlsTemporarily();
          return;
        } else if (isSelectKey) {
          e.preventDefault();
          // Start TV Remote Long-Press timer (>400ms triggers 2.0x speed)
          if (!remoteLongPressTimerRef.current) {
            remoteLongPressTimerRef.current = setTimeout(() => {
              isRemoteHoldingOkRef.current = true;
              start2xSpeed();
            }, 400);
          }
          return;
        }
      }

      // When controls are VISIBLE: D-Pad navigation between buttons
      showControlsTemporarily();

      if (e.key === 'ArrowUp' || e.keyCode === 38) {
        e.preventDefault();
        setRemoteZone('top');
      } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
        e.preventDefault();
        setRemoteZone('bottom');
      } else if (e.key === 'ArrowLeft' || e.keyCode === 37) {
        e.preventDefault();
        if (remoteZone === 'bottom') {
          setRemoteBottomIndex(prev => Math.max(0, prev - 1));
        } else {
          setRemoteTopIndex(prev => Math.max(0, prev - 1));
        }
      } else if (e.key === 'ArrowRight' || e.keyCode === 39) {
        e.preventDefault();
        if (remoteZone === 'bottom') {
          setRemoteBottomIndex(prev => Math.min(bottomCount - 1, prev + 1));
        } else {
          setRemoteTopIndex(prev => Math.min(topCount - 1, prev + 1));
        }
      } else if (isSelectKey) {
        e.preventDefault();
        // Start long-press timer
        if (!remoteLongPressTimerRef.current) {
          remoteLongPressTimerRef.current = setTimeout(() => {
            isRemoteHoldingOkRef.current = true;
            start2xSpeed();
          }, 400);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        cycleAspectRatio();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        if (isMuted) {
          adjustVolume(volume || 50);
        } else {
          setIsMuted(true);
          if (videoRef.current) videoRef.current.muted = true;
          triggerHUD('volume', 0);
        }
      }
    };

    const handleKeyUp = (e) => {
      const isSelectKey = e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.key === 'Select';
      if (!isSelectKey) return;

      if (remoteLongPressTimerRef.current) {
        clearTimeout(remoteLongPressTimerRef.current);
        remoteLongPressTimerRef.current = null;
      }

      if (isRemoteHoldingOkRef.current) {
        // Was holding 2.0x speed, now releasing!
        isRemoteHoldingOkRef.current = false;
        stop2xSpeed();
        return;
      }

      // Short tap: Trigger action!
      if (!showControls) {
        togglePlay();
        showControlsTemporarily();
        return;
      }

      // Controls are visible: Execute focused button action
      if (remoteZone === 'bottom') {
        if (remoteBottomIndex === 0) {
          togglePlay();
        } else if (remoteBottomIndex === 1) {
          handleSkip(-10);
        } else if (remoteBottomIndex === 2) {
          handleSkip(10);
        } else if (remoteBottomIndex === 3) {
          setShowSpeedModal(prev => !prev);
          setRemoteModalIndex(2); // Default to 1.0x
        } else if (isSeries && remoteBottomIndex === 4) {
          setShowEpisodeDrawer(prev => !prev);
          setRemoteModalIndex(0);
        } else if (isSeries && onNextEpisode && remoteBottomIndex === 5) {
          onNextEpisode();
        } else {
          toggleFullscreen();
        }
      } else {
        // Top zone actions
        if (remoteTopIndex === 0) {
          handleExit();
        } else if (remoteTopIndex === 1) {
          setShowSleepModal(prev => !prev);
          setRemoteModalIndex(0);
        } else if (remoteTopIndex === 2) {
          setIsLocked(true);
          setShowControls(false);
          triggerHUD('lock', 0, 'شاشە قوفڵ کرا');
        } else if (remoteTopIndex === 3) {
          cycleAspectRatio();
        } else if (remoteTopIndex === 4) {
          setShowSubtitlesModal(prev => !prev);
          setRemoteModalIndex(0);
        } else if (remoteTopIndex === 5) {
          setShowAudioModal(prev => !prev);
          setRemoteModalIndex(0);
        } else if (remoteTopIndex === 6) {
          handleExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (remoteLongPressTimerRef.current) {
        clearTimeout(remoteLongPressTimerRef.current);
      }
    };
  }, [
    isLocked, 
    volume, 
    isMuted, 
    showControls, 
    remoteZone, 
    remoteBottomIndex, 
    remoteTopIndex, 
    remoteModalIndex, 
    showSubtitlesModal, 
    showAudioModal, 
    showSpeedModal, 
    showEpisodeDrawer, 
    showSleepModal, 
    isSeries, 
    onNextEpisode, 
    subtitleTracks, 
    audioTracks, 
    item, 
    handleSkip, 
    adjustVolume, 
    togglePlay, 
    start2xSpeed, 
    stop2xSpeed, 
    showControlsTemporarily
  ]);


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

      {/* 2x Speed Holding Floating Pill (Tiny & Sleek: 2.0x ⏩) */}
      {is2xSpeedActive && (
        <div className="fixed top-8 inset-x-0 mx-auto w-fit z-50 pointer-events-none select-none px-4 py-1.5 rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-400 text-cyan-300 font-mono text-xs font-black shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center gap-1.5 animate-pulse">
          <span>2.0x ⏩</span>
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
        className={`absolute top-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-all duration-300 ease-out z-30 flex items-center justify-between ${
          showControls && !isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
        data-interactive="true"
      >
        {/* Left Side: Circular Back Button & Title Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-sm ${
              remoteZone === 'top' && remoteTopIndex === 0 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
            }`}
            title="گەڕانەوە (Back)"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={() => {
              if (onHome) onHome();
              else handleExit();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
            title="داشبۆرد (Home / Dashboard)"
          >
            <Home className="w-4 h-4 text-white" />
          </button>

          <div>
            <h2 className="text-xs sm:text-sm font-black text-white line-clamp-1 drop-shadow-md">
              {title}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
              <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-white/10 text-white border border-white/15">
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
                    <Clock className="w-3 h-3 text-white/80" />
                    <span>{currentClock}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Circular Glass Buttons (Icon-Only, Pure White Minimalist) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sleep Timer Indicator Badge */}
          {sleepSecondsLeft > 0 && (
            <button
              onClick={() => setShowSleepModal(true)}
              className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md"
              title="کاتی خەوتن کارایە"
            >
              <Moon className="w-3 h-3 text-white" />
              <span>{Math.floor(sleepSecondsLeft / 60)}:{sleepSecondsLeft % 60 < 10 ? '0' : ''}{sleepSecondsLeft % 60}</span>
            </button>
          )}

          {/* Sleep Timer Toggle */}
          <button
            onClick={() => setShowSleepModal(prev => !prev)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
              remoteZone === 'top' && remoteTopIndex === 1 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
            }`}
            title="کاتی خەوتن (Sleep Timer)"
          >
            <Moon className="w-4 h-4 text-white" />
          </button>

          {/* Kids Screen Lock Toggle */}
          <button
            onClick={() => {
              setIsLocked(true);
              setShowControls(false);
              triggerHUD('lock', 0, 'شاشە قوفڵ کرا');
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
              remoteZone === 'top' && remoteTopIndex === 2 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
            }`}
            title="قوفڵکردنی شاشە (Screen Lock)"
          >
            <Unlock className="w-4 h-4 text-white" />
          </button>

          {/* Aspect Ratio Cycler */}
          <button
            onClick={cycleAspectRatio}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
              remoteZone === 'top' && remoteTopIndex === 3 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
            }`}
            title="قەبارەی پەخش (Aspect Ratio)"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>

          {/* Subtitles Menu Button */}
          <button
            onClick={() => setShowSubtitlesModal(prev => !prev)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
              activeSubtitleTrackId !== 'off'
                ? 'bg-white/25 border-white/40 text-white shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            } ${
              remoteZone === 'top' && remoteTopIndex === 4 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
            }`}
            title="ژێرنووس و زمان"
          >
            <Subtitles className="w-4 h-4 text-white" />
          </button>

          {/* Audio Tracks Menu Button */}
          <button
            onClick={() => setShowAudioModal(prev => !prev)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
              remoteZone === 'top' && remoteTopIndex === 5 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
            }`}
            title="تراکەکانی دەنگ"
          >
            <AudioLines className="w-4 h-4 text-white" />
          </button>

          {/* Close Button */}
          <button
            onClick={handleExit}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-sm ${
              remoteZone === 'top' && remoteTopIndex === 6 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
            }`}
            title="داخستن"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>


      {/* =========================================================================
          FROSTED-GLASS BOTTOM BAR: TIMELINE SCRUBBER + TRANSPORT CONTROLS (LTR SCRUBBER)
         ========================================================================= */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent transition-all duration-300 ease-out z-30 flex flex-col gap-2.5 ${
          showControls && !isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        data-interactive="true"
      >
        {/* Scrubber Timeline Bar - Strict LTR (Left to Right) */}
        <div dir="ltr" className="flex items-center gap-3 w-full">
          <span className="font-mono text-[11px] sm:text-xs font-bold text-white min-w-[45px] text-left drop-shadow">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 group py-2.5 cursor-pointer">
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1 sm:h-1.5 bg-white/25 rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${bufferedPercent}%` }}
            />

            <input
              type="range"
              min="0"
              max={duration > 0 ? duration : 100}
              step="1"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white hover:h-2 transition-all relative z-10"
              style={{
                background: `linear-gradient(to right, #FFFFFF 0%, #FFFFFF ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>

          <span className="font-mono text-[11px] sm:text-xs font-bold text-white/70 min-w-[45px] text-right drop-shadow">
            {formatTime(duration)}
          </span>
        </div>

        {/* Transport Controls Row - Ultra-Compact Circular Minimalist Pure White Glass Buttons (Icon-Only) */}
        <div className="flex items-center justify-between">
          {/* Left Transport Cluster: Play/Pause, Rewind, Fast-Forward, Speed */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Play/Pause Button - Pure White & Subtle Semi-Transparent Dark Hover */}
            <button
              onClick={togglePlay}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                remoteZone === 'bottom' && remoteBottomIndex === 0 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
              }`}
              title={isPlaying ? 'وەستان' : 'لێدان'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white fill-white" />
              ) : (
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              )}
            </button>

            {/* Rewind Icon Button (Pure White Minimalist) */}
            <button
              onClick={() => handleSkip(-10)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                remoteZone === 'bottom' && remoteBottomIndex === 1 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
              }`}
              title="١٠ چرکە بۆ پاشەوە (-10s)"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>

            {/* Fast-Forward Icon Button (Pure White Minimalist) */}
            <button
              onClick={() => handleSkip(10)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                remoteZone === 'bottom' && remoteBottomIndex === 2 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
              }`}
              title="١٠ چرکە بۆ پێشەوە (+10s)"
            >
              <RotateCw className="w-4 h-4 text-white" />
            </button>

            {/* Playback Speed Icon Button (Pure White Minimalist) */}
            <button
              onClick={() => setShowSpeedModal(prev => !prev)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                remoteZone === 'bottom' && remoteBottomIndex === 3 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
              }`}
              title={`خێرایی پەخش (${playbackSpeed}x)`}
            >
              <Gauge className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Right Transport Cluster: Series Episodes, Drawer, Fullscreen */}
          <div className="flex items-center gap-2">
            {isSeries && item?.episodes && (
              <>
                {/* Episodes Drawer Icon Button (Pure White Minimalist) */}
                <button
                  onClick={() => setShowEpisodeDrawer(prev => !prev)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                    remoteZone === 'bottom' && remoteBottomIndex === 4 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
                  }`}
                  title="لیستی ئەڵقەکان"
                >
                  <List className="w-4 h-4 text-white" />
                </button>

                {onNextEpisode && (
                  /* Next Episode Icon Button (Pure White Minimalist) */
                  <button
                    onClick={onNextEpisode}
                    disabled={
                      item.episodes.findIndex(
                        ep => ep.number === episode?.number
                      ) >= item.episodes.length - 1
                    }
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none text-white border border-white/15 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                      remoteZone === 'bottom' && remoteBottomIndex === 5 ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
                    }`}
                    title="ئەڵقەی دواتر"
                  >
                    <SkipForward className="w-4 h-4 text-white" />
                  </button>
                )}
              </>
            )}

            {/* Fullscreen Icon Button (Pure White Minimalist) */}
            <button
              onClick={toggleFullscreen}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                remoteZone === 'bottom' && remoteBottomIndex === (isSeries ? (onNextEpisode ? 6 : 5) : 4) ? 'ring-2 ring-white scale-105 bg-white/25 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''
              }`}
              title="شاشەی تەواو"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SLEEP TIMER MODAL
         ========================================================================= */}
      {showSleepModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 end-4 sm:end-8 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl z-40 flex flex-col gap-2 animate-fade-in"
          data-interactive="true"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-1">
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              <span>کاتی خەوتن (Sleep Timer)</span>
            </span>
            <button
              onClick={() => setShowSleepModal(false)}
              className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {[
            { label: 'ناچالاک (Off)', mins: 0 },
            { label: '١٥ خولەک', mins: 15 },
            { label: '٣٠ خولەک', mins: 30 },
            { label: '٤٥ خولەک', mins: 45 },
            { label: '٦٠ خولەک (١ کاتژمێر)', mins: 60 }
          ].map((opt, idx) => (
            <button
              key={opt.mins}
              onClick={() => {
                setSleepSecondsLeft(opt.mins * 60);
                setShowSleepModal(false);
                triggerHUD('sleep', opt.mins, opt.mins > 0 ? `${opt.mins} خولەک` : 'ناچالاک');
              }}
              className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                (sleepSecondsLeft > 0 && Math.round(sleepSecondsLeft / 60) === opt.mins) || (sleepSecondsLeft === 0 && opt.mins === 0)
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/15 text-slate-200'
              } ${remoteModalIndex === idx ? 'ring-2 ring-cyan-400 scale-[1.02] bg-cyan-500/20' : ''}`}
            >
              <span>{opt.label}</span>
              {((sleepSecondsLeft > 0 && Math.round(sleepSecondsLeft / 60) === opt.mins) || (sleepSecondsLeft === 0 && opt.mins === 0)) && (
                <Check className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* =========================================================================
          SUBTITLE MANAGEMENT MODAL
         ========================================================================= */}
      {showSubtitlesModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 end-4 sm:end-8 w-80 sm:w-96 max-h-[82vh] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl z-40 flex flex-col gap-4 animate-fade-in custom-scrollbar"
          data-interactive="true"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-white" />
              <span>ڕێکخستنی ژێرنووس (Subtitles)</span>
            </span>
            <button
              onClick={() => setShowSubtitlesModal(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">زمان / تراکی ژێرنووس</label>
            <div className="grid grid-cols-2 gap-2">
              {subtitleTracks.map((trk, idx) => {
                const isSelected = activeSubtitleTrackId === trk.id;
                const isFocused = showSubtitlesModal && remoteModalIndex === idx;
                return (
                  <button
                    key={trk.id}
                    onClick={() => selectSubtitleTrack(trk.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer truncate ${
                      isFocused ? 'ring-2 ring-cyan-400 scale-[1.02] bg-cyan-500/20 ' : ''
                    }${
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

          {activeSubtitleTrackId !== 'off' && (
            <>
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
              <AudioLines className="w-4 h-4 text-white" />
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
              audioTracks.map((trk, idx) => {
                const isSelected = currentAudioTrackIndex === trk.index;
                const isFocused = showAudioModal && remoteModalIndex === idx;
                return (
                  <button
                    key={trk.index}
                    onClick={() => selectAudioTrack(trk.index)}
                    className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isFocused ? 'ring-2 ring-cyan-400 scale-[1.02] bg-cyan-500/20 ' : ''
                    }${
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
              <Gauge className="w-3.5 h-3.5 text-white" />
              <span>خێرایی پەخش</span>
            </span>
            <button
              onClick={() => setShowSpeedModal(false)}
              className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd, idx) => {
            const isFocused = showSpeedModal && remoteModalIndex === idx;
            return (
              <button
                key={spd}
                onClick={() => changeSpeed(spd)}
                className={`w-full p-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  isFocused ? 'ring-2 ring-amber-400 scale-[1.02] bg-amber-500/20 ' : ''
                }${
                  playbackSpeed === spd
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-white/5 hover:bg-white/15 text-slate-200'
                }`}
              >
                <span>{spd === 1.0 ? '1.0x (ئاسایی)' : `${spd}x`}</span>
                {playbackSpeed === spd && <Check className="w-4 h-4 text-slate-950" />}
              </button>
            );
          })}
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
              <List className="w-4 h-4 text-white" />
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
            {item.episodes.map((ep, idx) => {
              const isCurrent = ep.number === episode?.number;
              const epProg = getVodProgress ? getVodProgress(item.id, ep.number) : 0;
              const isFocused = showEpisodeDrawer && remoteModalIndex === idx;
              return (
                <button
                  key={ep.number}
                  onClick={() => {
                    handleSaveProgress();
                    if (onPlayEpisode) onPlayEpisode(item, ep);
                    setShowEpisodeDrawer(false);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-right transition-all cursor-pointer ${
                    isFocused ? 'ring-2 ring-cyan-400 scale-[1.02] bg-cyan-500/20 ' : ''
                  }${
                    isCurrent
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'bg-white/5 hover:bg-white/15 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Play className={`w-3.5 h-3.5 ${isCurrent ? 'fill-white text-white' : 'text-white'}`} />
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
