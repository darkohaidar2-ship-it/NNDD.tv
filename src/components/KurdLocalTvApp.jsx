import React, { useState, useEffect, useRef, useMemo } from 'react';
import Hls from 'hls.js';
import { 
  Tv, 
  Film, 
  Sliders, 
  Info, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  ArrowRight, 
  Search, 
  Clock, 
  Calendar, 
  CloudSun, 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Phone, 
  ChevronRight, 
  ChevronLeft, 
  QrCode, 
  Sparkles,
  Shield,
  Layers,
  Check,
  Star,
  RefreshCw,
  SlidersHorizontal,
  Home,
  Radio,
  Key,
  Gamepad2,
  Lock,
  Zap,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  List,
  Type,
  Unlock,
  Heart,
  ArrowUpDown,
  Filter,
  ShieldAlert,
  Wifi,
  Minimize2,
  LayoutGrid,
  X,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { CHANNELS_DATA, VOD_SERIES, VOD_MOVIES, SUBSCRIPTION_PLANS, INITIAL_ACTIVATION_CODES } from '../data/mockData';
import { AVAILABLE_FONTS, applyFontToDocument, getCurrentFont } from '../data/fonts';
import { getOrCreateDeviceIdentity, saveDeviceIdentity } from '../data/deviceManager';
import DeviceActivationModal from './DeviceActivationModal';
import NnddLogo from './NnddLogo';
import CachedChannelLogo from './CachedChannelLogo';
import { cacheAllChannelLogos, getCachedLogosCount, clearCachedLogos } from '../data/logoCache';
import { App as CapApp } from '@capacitor/app';

export default function KurdLocalTvApp({ 
  onSwitchToAdmin, 
  currentUser,
  channels: propChannels,
  setChannels: propSetChannels,
  requests,
  setRequests,
  vodSeriesProp,
  setVodSeriesProp,
  vodMoviesProp,
  setVodMoviesProp,
  onNotify,
  isStandalone = false,
  isCapacitor = false
}) {
  // Navigation tabs: 'dashboard', 'live', 'series', 'movies', 'settings', 'about'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBottomIndex, setSelectedBottomIndex] = useState(2); // 2 is 'کەناڵەکان' by default

  // Clock & Weather State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Channels state (using passed props if provided, with cache support)
  const [internalChannels, setInternalChannels] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_channels');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return CHANNELS_DATA;
  });
  const channels = propChannels || internalChannels;
  const setChannels = propSetChannels || setInternalChannels;

  // Localhost / Remote API URL for editable channel list outside the app
  const [channelsApiUrl, setChannelsApiUrl] = useState(() => {
    try {
      return localStorage.getItem('nndd_channels_api_url') || '/channels.json';
    } catch(e) {
      return '/channels.json';
    }
  });
  const [syncStatus, setSyncStatus] = useState(null);

  // Background fetch to sync from localhost or /channels.json on launch
  useEffect(() => {
    const fetchRemoteChannels = async () => {
      try {
        const url = localStorage.getItem('nndd_channels_api_url') || '/channels.json';
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setChannels(data);
            localStorage.setItem('nndd_cached_channels', JSON.stringify(data));
          }
        }
      } catch(e) {}
    };
    fetchRemoteChannels();
  }, []);

  const reloadChannelsFromSource = async (customUrl = null) => {
    const targetUrl = (customUrl || channelsApiUrl || '/channels.json').trim();
    setSyncStatus('loading');
    try {
      const res = await fetch(targetUrl, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setChannels(data);
        localStorage.setItem('nndd_channels_api_url', targetUrl);
        localStorage.setItem('nndd_cached_channels', JSON.stringify(data));
        setSyncStatus('success');
        onNotify?.({
          title: 'کەناڵەکان نوێکرانەوە',
          message: `کۆی ${data.length} کەناڵ لە لۆکاڵ هۆستەوە بە سەرکەوتوویی وەرگیران.`,
          type: 'success'
        });
        setTimeout(() => setSyncStatus(null), 3500);
        return true;
      } else {
        throw new Error('فایلەکە بە شێوەی دروست لیستی کەناڵەکانی تێدا نییە');
      }
    } catch (err) {
      setSyncStatus('error');
      onNotify?.({
        title: 'هەڵە لە وەرگرتن',
        message: `نەتوانرا لە سەرچاوەی دیاریکراو بخوێندرێتەوە (${targetUrl}): ${err.message}`,
        type: 'error'
      });
      setTimeout(() => setSyncStatus(null), 4000);
      return false;
    }
  };

  // Offline Logo Cache State (LocalStorage image persistence)
  const [cachedLogosCount, setCachedLogosCount] = useState(() => getCachedLogosCount(channels));
  const [isCachingLogos, setIsCachingLogos] = useState(false);
  const [logoCacheProgress, setLogoCacheProgress] = useState({ current: 0, total: 0 });

  // Background auto-cache: systematically saves all channel logos into LocalStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      cacheAllChannelLogos(channels, (current, total) => {
        setLogoCacheProgress({ current, total });
        setCachedLogosCount(current);
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [channels]);

  const handleManualCacheAllLogos = async () => {
    setIsCachingLogos(true);
    onNotify?.({
      title: 'سەیڤکردنی لۆگۆکان',
      message: 'دەستکرا بە داگرتن و سەیڤکردنی هەموو لۆگۆکان لە لۆکاڵ ستۆریج...',
      type: 'info'
    });
    const finishedCount = await cacheAllChannelLogos(channels, (current, total) => {
      setLogoCacheProgress({ current, total });
      setCachedLogosCount(current);
    });
    setIsCachingLogos(false);
    onNotify?.({
      title: 'لۆگۆکان سەیڤ کران',
      message: `کۆی ${finishedCount} لۆگۆ بە تەواوی لە لۆکاڵ ستۆریج سەیڤکران و بە ئۆفلاین کار دەکەن.`,
      type: 'success'
    });
  };

  const handleClearLogoCache = () => {
    clearCachedLogos();
    setCachedLogosCount(0);
    onNotify?.({
      title: 'کاشی لۆگۆ سڕایەوە',
      message: 'هەموو لۆگۆ سەیڤکراوەکانی لۆکاڵ ستۆریج سڕانەوە.',
      type: 'info'
    });
  };

  // Resume last watched channel from localStorage or fallback to channel #1
  const [selectedChannel, setSelectedChannel] = useState(() => {
    try {
      const savedId = localStorage.getItem('nndd_last_channel_id');
      if (savedId) {
        const found = (propChannels || CHANNELS_DATA).find(c => c.id === savedId || String(c.number) === savedId);
        if (found) return found;
      }
    } catch(e) {}
    return (propChannels || CHANNELS_DATA)[0] || CHANNELS_DATA[0];
  });

  // Data Saver Mode: 'auto' (4K/Auto) | '720p' (Standard HD) | 'data_saver' (480p Low 4G Data)
  const [dataSaverMode, setDataSaverMode] = useState(() => {
    try {
      return localStorage.getItem('nndd_data_saver_mode') || 'auto';
    } catch(e) {
      return 'auto';
    }
  });

  // Favorite channels list persisted in localStorage
  const [favoriteChannelIds, setFavoriteChannelIds] = useState(() => {
    try {
      const stored = localStorage.getItem('nndd_favorite_channel_ids');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return (propChannels || CHANNELS_DATA).filter(c => c.isFavorite).map(c => c.id);
  });

  // Dock Size Scale State for the 5 bottom buttons (0.75x to 1.3x)
  const [dockScale, setDockScale] = useState(() => {
    try {
      const saved = localStorage.getItem('nndd_dock_scale');
      return saved ? parseFloat(saved) : 1;
    } catch(e) {
      return 1;
    }
  });

  const updateDockScale = (newScale) => {
    const clamped = Math.min(1.3, Math.max(0.75, parseFloat(newScale.toFixed(2))));
    setDockScale(clamped);
    try {
      localStorage.setItem('nndd_dock_scale', clamped.toString());
    } catch(e) {}
  };

  const [isBackupStreamActive, setIsBackupStreamActive] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const morphTimerRef = useRef(null);
  const [targetChannelBanner, setTargetChannelBanner] = useState(null);
  const [channelCategory, setChannelCategory] = useState('هەموو');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // dashboard starts muted
  const [volume, setVolume] = useState(80);

  // Advanced Multi-Tier Device Intelligence (TV vs iPad/Tablet vs Mobile Phone vs PC)
  const getDetectedDeviceInfo = () => {
    if (typeof window === 'undefined') return { type: 'desktop', isTouch: false, isTv: false, isTablet: false, isMobile: false };
    const ua = navigator.userAgent.toLowerCase();
    const hasTouch = (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const width = window.innerWidth;
    
    // 1. Smart TV Detection (Tizen, webOS, Android TV, Fire TV, Apple TV, Leanback, Large Screen without Touch)
    const isTvUa = /smart-tv|smarttv|appletv|googletv|tizen|webos|netcast|viera|bravia|aftb|aftt|firetv|roku|hbbtv|leanback|android tv/i.test(ua);
    const isTvScreen = !hasTouch && width >= 1280 && (navigator.maxTouchPoints === 0);
    const isTv = isTvUa || isTvScreen;

    // 2. Tablet / iPad Detection
    const isTablet = !isTv && (
      /ipad|tablet|playbook|silk/i.test(ua) || 
      (hasTouch && width >= 768 && width <= 1366)
    );

    // 3. Mobile Phone Detection
    const isMobile = !isTv && !isTablet && (
      /mobile|iphone|ipod|android/i.test(ua) || 
      (hasTouch && width < 768)
    );

    const type = isTv ? 'tv' : isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
    return { type, isTouch: hasTouch, isTv, isTablet, isMobile };
  };

  const [deviceInfo, setDeviceInfo] = useState(() => getDetectedDeviceInfo());
  const isMobileDevice = deviceInfo.isMobile || deviceInfo.isTablet;
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  // In-App Channel Quick Editor & Reorder State
  const [isChannelEditMode, setIsChannelEditMode] = useState(false);

  const moveChannelInList = (currentIndex, direction) => {
    const list = [...channels];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;

    const renumbered = list.map((ch, idx) => ({ ...ch, number: idx + 1 }));
    setChannels(renumbered);
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(renumbered));
    } catch(e) {}
  };

  const removeChannelFromList = (channelId) => {
    const filtered = channels.filter(c => c.id !== channelId);
    const renumbered = filtered.map((ch, idx) => ({ ...ch, number: idx + 1 }));
    setChannels(renumbered);
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(renumbered));
    } catch(e) {}
  };

  const resetChannelsToDefault = async () => {
    try {
      const res = await fetch('/channels.json', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
        localStorage.setItem('nndd_cached_channels', JSON.stringify(data));
      }
    } catch(e) {}
  };

  // Video Scaling Fit Mode: 'contain' (Fit 16:9 - Standard TV, No Zoom, No Stretch) | 'cover' (Fill Zoom)
  const [videoFitMode, setVideoFitMode] = useState('contain');
  const [showWelcomeTransition, setShowWelcomeTransition] = useState(false);

  // Device Binding & Secret Hardware Serial
  const [deviceIdentity, setDeviceIdentity] = useState(() => getOrCreateDeviceIdentity());
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(() => {
    const dev = getOrCreateDeviceIdentity();
    return dev.status === 'pending_activation';
  });

  // Sorting, Favorites & Parental Lock State
  const [sortBy, setSortBy] = useState('number'); // 'number' | 'name' | 'favorites'
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [parentalPinModalOpen, setParentalPinModalOpen] = useState(false);
  const [pendingLockedChannel, setPendingLockedChannel] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // LIVE TV OSD / ZAP BANNER STATE (Auto-hide after 3.5 seconds)
  const [isZapBannerVisible, setIsZapBannerVisible] = useState(false);
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const zapTimerRef = useRef(null);

  // Mobile Touch Gestures & Gesture HUD Feedback
  const touchStartRef = useRef(null);
  const touchHandledRef = useRef(false);
  const lastTapRef = useRef(0);
  const singleTapTimeoutRef = useRef(null);
  const [gestureFeedback, setGestureFeedback] = useState(null);
  const gestureFeedbackTimerRef = useRef(null);

  // Favorite Toast Badge ("ADDED" / "REMOVED")
  const [favToast, setFavToast] = useState(null);
  const favToastTimerRef = useRef(null);

  // Minimized Dock Scale Controller on Dashboard
  const [isDockScaleOpen, setIsDockScaleOpen] = useState(false);

  // TV Remote Channel Drawer Focused Index & Dashboard 2D Focus Zone
  const [drawerFocusedIndex, setDrawerFocusedIndex] = useState(0);
  const drawerItemRefs = useRef([]);
  const [dashboardFocusZone, setDashboardFocusZone] = useState('dock'); // 'dock' | 'scale' | 'header'

  // When drawer opens, focus and auto-scroll to the currently playing channel
  useEffect(() => {
    if (showChannelDrawer) {
      const displayedChannels = onlyFavorites 
        ? channels.filter(c => favoriteChannelIds.includes(c.id) || c.isFavorite) 
        : channels;
      const idx = displayedChannels.findIndex(c => c.id === selectedChannel?.id);
      const targetIdx = idx !== -1 ? idx : 0;
      setDrawerFocusedIndex(targetIdx);
      setTimeout(() => {
        drawerItemRefs.current[targetIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    }
  }, [showChannelDrawer, onlyFavorites, selectedChannel?.id, channels, favoriteChannelIds]);

  // Reset dashboard focus to dock whenever dashboard becomes active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      setDashboardFocusZone('dock');
    }
  }, [activeTab]);

  const showGestureFeedback = (direction, channel, title) => {
    if (gestureFeedbackTimerRef.current) {
      clearTimeout(gestureFeedbackTimerRef.current);
    }
    setGestureFeedback({
      direction,
      channel,
      title: title || (direction === 'up' ? 'Next ⬆' : direction === 'down' ? 'Previous ⬇' : 'Fit 🔍')
    });
    gestureFeedbackTimerRef.current = setTimeout(() => {
      setGestureFeedback(null);
    }, 1800);
  };

  // Alerts
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [language, setLanguage] = useState('ckb'); // 'ckb', 'en', 'ar'
  const [searchQuery, setSearchQuery] = useState('');

  // Virtual Remote Control Dialog
  const [showVirtualRemote, setShowVirtualRemote] = useState(false);

  // User input activation code
  const [activationCodeInput, setActivationCodeInput] = useState('');
  const [subscriptionDaysRemaining, setSubscriptionDaysRemaining] = useState(365);
  const [selectedPlayerEngine, setSelectedPlayerEngine] = useState('Hls.js Engine');
  const [activeFontId, setActiveFontId] = useState(() => getCurrentFont().id);

  const handleTvFontChange = (fontId) => {
    setActiveFontId(fontId);
    const font = applyFontToDocument(fontId);
    onNotify?.({
      title: 'فۆنتی شاشە گۆڕدرا',
      message: `فۆنت نوێکرایەوە بۆ: ${font.kurdishName}.`,
      type: 'success'
    });
  };

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const hlsRefA = useRef(null);
  const hlsRefB = useRef(null);
  const [activeSlot, setActiveSlot] = useState('A');
  const [underSlot, setUnderSlot] = useState(null);
  const [isChannelOffline, setIsChannelOffline] = useState(false);
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressRef = useRef(0);
  const exitToastTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const switchRequestIdRef = useRef(0);
  const zapDebounceTimerRef = useRef(null);
  const initialLoadTimerRef = useRef(null);

  // VOD Series & Movies State (Apple TV Cinema Glassmorphic Engine)
  const [internalVodSeries, setInternalVodSeries] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_vod_series');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return VOD_SERIES;
  });
  const vodSeries = (vodSeriesProp && vodSeriesProp.length > 0) ? vodSeriesProp : internalVodSeries;
  const setVodSeries = setVodSeriesProp || setInternalVodSeries;

  const [internalVodMovies, setInternalVodMovies] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_vod_movies');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return VOD_MOVIES;
  });
  const vodMovies = (vodMoviesProp && vodMoviesProp.length > 0) ? vodMoviesProp : internalVodMovies;
  const setVodMovies = setVodMoviesProp || setInternalVodMovies;

  // Fetch remote VOD content from /vod_content.json (Ninja Server content)
  useEffect(() => {
    const fetchRemoteVod = async () => {
      try {
        const res = await fetch('/vod_content.json', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.series) && data.series.length > 0) {
            setVodSeries(data.series);
            try { localStorage.setItem('nndd_cached_vod_series', JSON.stringify(data.series)); } catch(e){}
          }
          if (data && Array.isArray(data.movies) && data.movies.length > 0) {
            setVodMovies(data.movies);
            try { localStorage.setItem('nndd_cached_vod_movies', JSON.stringify(data.movies)); } catch(e){}
          }
        }
      } catch(e) {}
    };
    fetchRemoteVod();
  }, []);

  // VOD Progress Resume & Auto-Save Engine
  const [activeVodSession, setActiveVodSession] = useState(null); // { item, episode, key }

  const getVodProgress = (itemId, epNum = 0) => {
    try {
      const key = `nndd_vod_progress_${itemId}_${epNum}`;
      return parseFloat(localStorage.getItem(key) || '0');
    } catch(e) {
      return 0;
    }
  };

  const saveVodProgress = (itemId, epNum = 0, seconds = 0) => {
    if (seconds < 3) return;
    try {
      const key = `nndd_vod_progress_${itemId}_${epNum}`;
      localStorage.setItem(key, seconds.toFixed(1));
    } catch(e) {}
  };

  const formatVodTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Restore live TV stream and save progress when user exits VOD playback
  useEffect(() => {
    if (activeTab !== 'live' && activeVodSession) {
      const activeVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
      if (activeVideo && activeVideo.currentTime > 2) {
        saveVodProgress(activeVodSession.item.id, activeVodSession.episode?.number || 0, activeVideo.currentTime);
      }
      setActiveVodSession(null);
      if (selectedChannel && selectedChannel.url && !selectedChannel.id.startsWith('vod-')) {
        loadStreamInSlot(activeSlot, selectedChannel.url);
        setIsMuted(true);
      }
    }
  }, [activeTab]);

  // Filter visible items according to Admin display limits (nndd_vod_config) & hidden toggles
  const visibleSeries = useMemo(() => {
    let list = vodSeries.filter(s => !s.isHidden);
    try {
      const savedConfig = localStorage.getItem('nndd_vod_config');
      if (savedConfig) {
        const cfg = JSON.parse(savedConfig);
        if (cfg.maxSeriesDisplay > 0) {
          list = list.slice(0, cfg.maxSeriesDisplay);
        }
      }
    } catch(e) {}
    return list;
  }, [vodSeries]);

  const visibleMovies = useMemo(() => {
    let list = vodMovies.filter(m => !m.isHidden);
    try {
      const savedConfig = localStorage.getItem('nndd_vod_config');
      if (savedConfig) {
        const cfg = JSON.parse(savedConfig);
        if (cfg.maxMoviesDisplay > 0) {
          list = list.slice(0, cfg.maxMoviesDisplay);
        }
      }
    } catch(e) {}
    return list;
  }, [vodMovies]);

  const [selectedVodItem, setSelectedVodItem] = useState(null);
  const [selectedVodType, setSelectedVodType] = useState('series'); // 'series' | 'movie'
  const [hoveredVodItem, setHoveredVodItem] = useState(null);
  const [vodFocusedIndex, setVodFocusedIndex] = useState(0);
  const [vodEpisodeFocusedIndex, setVodEpisodeFocusedIndex] = useState(0);
  const [seriesCategoryFilter, setSeriesCategoryFilter] = useState('all');
  const [moviesCategoryFilter, setMoviesCategoryFilter] = useState('all');

  const seriesCategories = useMemo(() => {
    const cats = new Set();
    visibleSeries.forEach(s => {
      if (s.category) {
        s.category.split(',').forEach(c => {
          const trimmed = c.trim();
          if (trimmed) cats.add(trimmed);
        });
      }
    });
    return ['all', ...Array.from(cats).slice(0, 10)];
  }, [visibleSeries]);

  const movieCategories = useMemo(() => {
    const cats = new Set();
    visibleMovies.forEach(m => {
      if (m.genre) {
        m.genre.split(',').forEach(g => {
          const trimmed = g.trim();
          if (trimmed) cats.add(trimmed);
        });
      }
    });
    return ['all', ...Array.from(cats).slice(0, 10)];
  }, [visibleMovies]);

  const filteredSeries = seriesCategoryFilter === 'all'
    ? visibleSeries
    : visibleSeries.filter(s => (s.category || '').toLowerCase().includes(seriesCategoryFilter.toLowerCase()));

  const filteredMovies = moviesCategoryFilter === 'all'
    ? visibleMovies
    : visibleMovies.filter(m => (m.genre || '').toLowerCase().includes(moviesCategoryFilter.toLowerCase()));


  // Time updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic Device & Orientation Listener + Landscape Request
  useEffect(() => {
    const handleDeviceCheck = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024);
      setIsMobileDevice(mobile);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleDeviceCheck);
    window.addEventListener('orientationchange', handleDeviceCheck);

    // Attempt browser landscape lock if available
    try {
      if (screen?.orientation?.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('resize', handleDeviceCheck);
      window.removeEventListener('orientationchange', handleDeviceCheck);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Show Channel Zap Banner for the target channel (default 3.5s)
  const triggerZapBanner = (channelToDisplay = null, duration = 3500) => {
    if (zapTimerRef.current) {
      clearTimeout(zapTimerRef.current);
    }
    if (channelToDisplay) {
      setTargetChannelBanner(channelToDisplay);
    }
    setIsZapBannerVisible(true);
    zapTimerRef.current = setTimeout(() => {
      setIsZapBannerVisible(false);
    }, duration);
  };

  // Smooth Audio Crossfade for active slot
  const fadeVolumeIn = (targetVol, slot = activeSlot, durationMs = 200) => {
    const video = slot === 'A' ? videoRefA.current : videoRefB.current;
    if (!video || isMuted) return;
    video.volume = 0;
    const steps = 8;
    const stepTime = durationMs / steps;
    const stepAmount = targetVol / steps;
    let stepCount = 0;
    const timer = setInterval(() => {
      stepCount++;
      if (!video) {
        clearInterval(timer);
        return;
      }
      video.volume = Math.min(targetVol, stepCount * stepAmount);
      if (stepCount >= steps) {
        video.volume = targetVol;
        clearInterval(timer);
      }
    }, stepTime);
  };

  // Dedicated slot loader: loads stream in background slot without touching active playing channel
  const loadStreamInSlot = (slot, streamUrl, onReadyOrReqId = null, maybeOnReady = null, isBackup = false) => {
    let reqId = null;
    let onReady = null;

    if (typeof onReadyOrReqId === 'number') {
      reqId = onReadyOrReqId;
      onReady = maybeOnReady;
    } else if (typeof onReadyOrReqId === 'function') {
      onReady = onReadyOrReqId;
      reqId = null;
    }

    const video = slot === 'A' ? videoRefA.current : videoRefB.current;
    const hlsRef = slot === 'A' ? hlsRefA : hlsRefB;
    if (!video) return;

    // 1. Cleanly tear down existing HLS on this slot
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch(e) {}
      hlsRef.current = null;
    }

    // 2. Reset video element listeners and state safely
    try {
      video.onplaying = null;
      video.oncanplay = null;
      video.onerror = null;
      video.onwaiting = null;
      video.onstalled = null;
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch(e) {}

    // In staging slot, keep volume 0 so it doesn't clash with active channel audio while preloading
    video.volume = 0;
    video.muted = isMuted || slot !== activeSlot;

    let hasTriggeredReady = false;
    let safetyTimer = null;

    const markReady = () => {
      // If this request was superseded by a newer channel switch, discard immediately!
      if (reqId !== null && switchRequestIdRef.current !== reqId) {
        if (safetyTimer) clearTimeout(safetyTimer);
        return;
      }
      if (!hasTriggeredReady) {
        hasTriggeredReady = true;
        if (safetyTimer) clearTimeout(safetyTimer);
        if (video) {
          video.onplaying = null;
          video.oncanplay = null;
        }
        onReady?.(video);
      }
    };

    // Safety timeout: if stream takes longer than 2.5s, signal ready so UI transitions smoothly
    safetyTimer = setTimeout(() => {
      markReady();
    }, 2500);

    video.onplaying = () => {
      markReady();
    };
    video.oncanplay = () => {
      if (video.videoWidth > 0 || video.readyState >= 2) {
        markReady();
      }
    };

    // Safe play helper to prevent unhandled abort promise errors during fast switching
    const safePlay = () => {
      if (!video) return;
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          // Playback interrupted or deferred; normal during fast zap
        });
      }
    };

    if (Hls.isSupported() && streamUrl && streamUrl.endsWith('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true, // Enables instant frame decoding without waiting for deep buffers
        liveSyncDurationCount: 1, // Crucial: Play immediately from 1st fragment! Eliminates 12-24s wait on Kurdish streams
        liveMaxLatencyDurationCount: 4,
        initialLiveManifestSize: 1, // Start playback immediately even if server playlist has only 1 segment
        startFragPrefetch: true, // Fetch next fragment in parallel immediately
        maxBufferLength: 15,
        backBufferLength: 0, // Drop back-buffer to save RAM and accelerate live segment processing
        enableSoftwareAES: true,
        fragLoadingTimeOut: 15000,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 500,
        fragLoadingMaxRetry: 4,
        fragLoadingRetryDelay: 500,
        abrEwmaDefaultEstimate: 20000000, // 20 Mbps realistic estimate
        testBandwidth: false
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (reqId !== null && switchRequestIdRef.current !== reqId) return;
        applyStreamQualityToHls(dataSaverMode, hls);
        safePlay();
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        if (reqId !== null && switchRequestIdRef.current !== reqId) return;
        if (video.readyState >= 2 || video.currentTime > 0) {
          markReady();
        }
      });

      // Active watchdog to unfreeze playback if buffer stalls
      video.onwaiting = () => {
        if (reqId !== null && switchRequestIdRef.current !== reqId) return;
        try { hls.startLoad(); } catch(e) {}
      };
      video.onstalled = () => {
        if (reqId !== null && switchRequestIdRef.current !== reqId) return;
        try { hls.startLoad(); } catch(e) {}
      };

      let networkRetryCount = 0;
      let mediaRecoveryAttempts = 0;

      hls.on(Hls.Events.ERROR, (event, data) => {
        // If this stream was superseded by a newer channel switch, ignore completely!
        if (reqId !== null && switchRequestIdRef.current !== reqId) return;

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Auto-recover network errors instead of freezing
              if (networkRetryCount < 2) {
                networkRetryCount++;
                setTimeout(() => {
                  if (reqId !== null && switchRequestIdRef.current !== reqId) return;
                  try { hls.startLoad(); } catch(e) {}
                }, 600);
              } else {
                setIsChannelOffline(true);
                markReady();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // Auto-recover media decoder errors
              if (mediaRecoveryAttempts < 2) {
                mediaRecoveryAttempts++;
                try { hls.recoverMediaError(); } catch(e) {}
              } else {
                try {
                  hls.swapAudioCodec();
                  hls.recoverMediaError();
                } catch(e) {
                  setIsChannelOffline(true);
                  markReady();
                }
              }
              break;
            default:
              setIsChannelOffline(true);
              markReady();
              break;
          }
        }
      });
    } else if (streamUrl) {
      video.src = streamUrl;
      safePlay();
      video.onerror = () => {
        if (reqId !== null && switchRequestIdRef.current !== reqId) return;
        setIsChannelOffline(true);
        markReady();
      };
    }
  };

  // High-Performance Channel Switch Execution (Atomic Request Protected)
  const executeChannelSwitch = (targetChannel) => {
    if (!targetChannel) return;
    const reqId = ++switchRequestIdRef.current;
    setIsChannelOffline(false);

    // Cancel any initial load timer if user switched before 2s
    if (initialLoadTimerRef.current) {
      clearTimeout(initialLoadTimerRef.current);
      initialLoadTimerRef.current = null;
    }
    isInitialLoadRef.current = false;

    // Slot Management:
    const currentSlot = activeSlot;
    const nextSlot = currentSlot === 'A' ? 'B' : 'A';
    setUnderSlot(currentSlot);

    // Clear any previous morph timer
    if (morphTimerRef.current) {
      clearTimeout(morphTimerRef.current);
      morphTimerRef.current = null;
    }

    loadStreamInSlot(nextSlot, targetChannel.url, reqId, () => {
      // Check if this request is still the active one
      if (switchRequestIdRef.current !== reqId) {
        return; // Superseded by a newer switch!
      }

      setIsMorphing(true);

      const nextVideo = nextSlot === 'A' ? videoRefA.current : videoRefB.current;
      const prevVideo = currentSlot === 'A' ? videoRefA.current : videoRefB.current;
      const prevHls = currentSlot === 'A' ? hlsRefA : hlsRefB;

      const targetVol = isMuted ? 0 : volume / 100;
      if (nextVideo && !isMuted) {
        nextVideo.muted = false;
        nextVideo.volume = targetVol;
      }

      setActiveSlot(nextSlot);
      setSelectedChannel(targetChannel);

      try {
        localStorage.setItem('nndd_last_channel_id', targetChannel.id);
      } catch(e) {}

      // After 450ms, new slot is 100% opaque on top; cleanly remove underSlot and stop previous video
      morphTimerRef.current = setTimeout(() => {
        if (switchRequestIdRef.current !== reqId) return;
        setIsMorphing(false);
        setUnderSlot(null);

        if (prevVideo) {
          try {
            prevVideo.pause();
            prevVideo.removeAttribute('src');
            prevVideo.load();
          } catch(e) {}
        }
        if (prevHls.current) {
          try {
            prevHls.current.stopLoad();
            prevHls.current.detachMedia();
            prevHls.current.destroy();
          } catch(e) {}
          prevHls.current = null;
        }

        zapTimerRef.current = setTimeout(() => {
          setIsZapBannerVisible(false);
        }, 1200);
      }, 450);
    });
  };

  // Seamless Dual-Player Channel Switcher with Smart Zapping Debounce (Zero Freeze)
  const performChannelSwitch = (targetChannel, immediate = false) => {
    if (!targetChannel) return;

    // 1. Immediately show target channel in OSD Zap Banner (0ms latency user feedback!)
    setTargetChannelBanner(targetChannel);
    setIsZapBannerVisible(true);
    setIsChannelOffline(false);
    if (zapTimerRef.current) clearTimeout(zapTimerRef.current);

    // If same channel and already running, just show banner
    if (targetChannel.id === selectedChannel?.id && !isInitialLoadRef.current) {
      zapTimerRef.current = setTimeout(() => {
        setIsZapBannerVisible(false);
      }, 2500);
      return;
    }

    // 2. Clear any pending debounced channel switch
    if (zapDebounceTimerRef.current) {
      clearTimeout(zapDebounceTimerRef.current);
      zapDebounceTimerRef.current = null;
    }

    // 3. If immediate (e.g. direct click in Drawer or number key), switch right away
    if (immediate) {
      executeChannelSwitch(targetChannel);
    } else {
      // Fast Zapping (remote Up/Down, mobile touch swipe):
      // Debounce video decoder load by 260ms so rapid skipping never chokes or freezes the player!
      zapDebounceTimerRef.current = setTimeout(() => {
        executeChannelSwitch(targetChannel);
      }, 260);
    }
  };


  // Adjust HLS bitrate / resolution according to Data Saver Mode
  const applyStreamQualityToHls = (mode, hlsInstance = hlsRef.current) => {
    if (!hlsInstance) return;
    try {
      if (mode === 'data_saver') {
        let bestLevel = -1;
        if (hlsInstance.levels && hlsInstance.levels.length > 0) {
          const sorted = hlsInstance.levels
            .map((lvl, idx) => ({ ...lvl, index: idx }))
            .sort((a, b) => (a.height || 0) - (b.height || 0));
          const match480 = sorted.find(l => l.height && l.height <= 480) || sorted[0];
          bestLevel = match480 ? match480.index : 0;
        }
        hlsInstance.currentLevel = bestLevel !== -1 ? bestLevel : 0;
        hlsInstance.autoLevelCapping = bestLevel !== -1 ? bestLevel : 0;
      } else if (mode === '720p') {
        let bestLevel = -1;
        if (hlsInstance.levels && hlsInstance.levels.length > 0) {
          const sorted = hlsInstance.levels
            .map((lvl, idx) => ({ ...lvl, index: idx }))
            .sort((a, b) => (a.height || 0) - (b.height || 0));
          const match720 = sorted.find(l => l.height && l.height <= 720) || sorted[Math.floor(sorted.length / 2)];
          bestLevel = match720 ? match720.index : 0;
        }
        hlsInstance.currentLevel = bestLevel !== -1 ? bestLevel : 0;
        hlsInstance.autoLevelCapping = bestLevel !== -1 ? bestLevel : 0;
      } else {
        // Auto / Full 4K: Fast adaptive startup without freezing on heaviest initial chunk
        hlsInstance.autoLevelCapping = -1;
        hlsInstance.startLevel = -1; // Adaptive instant start
        hlsInstance.currentLevel = -1;
        hlsInstance.loadLevel = -1;
      }
    } catch(e) {}
  };

  // Cycle between Auto (4K) -> 720p -> Data Saver (480p)
  const cycleDataSaverMode = (e) => {
    if (e) e.stopPropagation?.();
    const modes = ['auto', '720p', 'data_saver'];
    const nextIdx = (modes.indexOf(dataSaverMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setDataSaverMode(nextMode);
    try {
      localStorage.setItem('nndd_data_saver_mode', nextMode);
    } catch(e) {}
    applyStreamQualityToHls(nextMode);

    const labels = {
      auto: 'Auto 4K (بەرزترین کوالێتی)',
      '720p': '720p HD (کوالێتی مامناوەند)',
      data_saver: 'Data Saver (480p - کەمترین بەکارهێنانی ئینتەرنێت)'
    };

    // Notification silenced per user request for clean viewing experience
  };

  // Heart Favorite Toggle with localStorage persistence (Notification removed per user request)
  const toggleFavoriteChannel = (channelId) => {
    setFavoriteChannelIds(prev => {
      const isFav = prev.includes(channelId);
      const updated = isFav ? prev.filter(id => id !== channelId) : [...prev, channelId];
      try {
        localStorage.setItem('nndd_favorite_channel_ids', JSON.stringify(updated));
      } catch(e) {}

      setChannels(prevChannels => prevChannels.map(c => 
        c.id === channelId ? { ...c, isFavorite: !isFav } : c
      ));

      return updated;
    });
  };

  const triggerFailover = () => {
    if (!selectedChannel?.backupUrl) return;
    setIsBackupStreamActive(true);
    loadStreamInSlot(activeSlot, selectedChannel.backupUrl, null, true);
  };

  const switchToMainStream = () => {
    setIsBackupStreamActive(false);
    loadStreamInSlot(activeSlot, selectedChannel.url, null, false);
  };

  // Initial load: Preload in background immediately so channel is ready exactly when the 2-second intro ends
  useEffect(() => {
    // 1. Immediately begin background connection and buffering (0ms network delay!)
    loadStreamInSlot('A', selectedChannel.url, switchRequestIdRef.current, () => {
      const videoA = videoRefA.current;
      if (videoA && !isMuted) {
        videoA.volume = isMuted ? 0 : volume / 100;
      }
    });

    // 2. Allow 2000ms for intro animation to breathe before allowing channel zapping
    initialLoadTimerRef.current = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    return () => {
      if (initialLoadTimerRef.current) clearTimeout(initialLoadTimerRef.current);
      if (zapDebounceTimerRef.current) clearTimeout(zapDebounceTimerRef.current);
      if (morphTimerRef.current) clearTimeout(morphTimerRef.current);
      if (hlsRefA.current) {
        try { hlsRefA.current.destroy(); } catch(e) {}
        hlsRefA.current = null;
      }
      if (hlsRefB.current) {
        try { hlsRefB.current.destroy(); } catch(e) {}
        hlsRefB.current = null;
      }
    };
  }, []);

  // Auto-recovery: if channel went offline, periodically attempt auto-reconnect
  useEffect(() => {
    let reconnectTimer = null;
    if (isChannelOffline && selectedChannel && activeTab === 'live') {
      reconnectTimer = setTimeout(() => {
        setIsChannelOffline(false);
        loadStreamInSlot(activeSlot, selectedChannel.url, switchRequestIdRef.current);
      }, 5000);
    }
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [isChannelOffline, selectedChannel, activeSlot, activeTab]);


  // Update volume & mute dynamically on whichever player slot is active
  useEffect(() => {
    const activeVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
    if (activeVideo) {
      activeVideo.muted = isMuted;
      activeVideo.volume = isMuted ? 0 : volume / 100;
    }
  }, [isMuted, volume, activeSlot]);

  // Helper to play a series episode or movie in full-screen cinema mode with Resume support
  const playVodStream = (item, episode = null) => {
    const title = episode ? `${item.title} - ${episode.title}` : item.title;
    const streamUrl = episode ? episode.streamUrl : (item.streamUrl || 'https://stream.shams.tv/hls/0/stream.m3u8');
    const epNum = episode ? episode.number : 0;
    const savedProgress = getVodProgress(item.id, epNum);

    // Track active VOD session
    setActiveVodSession({
      item,
      episode,
      key: `${item.id}_${epNum}`,
      streamUrl
    });

    setSelectedChannel({
      id: `vod-${item.id}${episode ? '-' + episode.number : ''}`,
      number: episode ? episode.number : 1,
      name: title,
      category: item.category || item.genre || 'سینەما',
      logo: item.poster,
      url: streamUrl,
      backupUrl: streamUrl,
      quality: item.quality || '4K HDR',
      is4K: true,
      epg: {
        currentShow: title,
        nextShow: episode ? 'ئەڵقەی داهاتوو' : 'کۆتایی فیلم',
        timeSlot: episode ? episode.duration : (item.duration || '2h'),
        progress: 10
      }
    });

    setIsMuted(false);
    loadStreamInSlot(activeSlot, streamUrl, (videoEl) => {
      // Automatic resume from saved position if more than 5 seconds watched
      if (videoEl && savedProgress > 5) {
        setTimeout(() => {
          try { videoEl.currentTime = savedProgress; } catch(e) {}
        }, 300);
      }
    });
    setActiveTab('live');
    setSelectedVodItem(null);
    triggerZapBanner({
      name: title,
      logo: item.poster,
      category: item.category || item.genre,
      epg: {
        currentShow: savedProgress > 5 ? `${title} (بەردەوامبوون: ${formatVodTime(savedProgress)})` : title,
        timeSlot: episode ? episode.duration : item.duration
      }
    }, 4000);
  };

  // Bottom Navigation Buttons on Dashboard
  const BOTTOM_BUTTONS = [
    { id: 'settings', label: 'ڕێکخستن', sub: 'Settings', icon: Sliders, tab: 'settings' },
    { id: 'series', label: 'زنجیرەکان', sub: 'Series', icon: Film, tab: 'series' },
    { id: 'live', label: 'ڕاستەوخۆ', sub: 'Live', icon: Tv, tab: 'live', isDefault: true },
    { id: 'movies', label: 'فیلمەکان', sub: 'Movies', icon: Film, tab: 'movies' },
    { id: 'about', label: 'دەربارە', sub: 'About', icon: Info, tab: 'about' }
  ];

  // Centralized Back Navigation: Live -> Dashboard, Dashboard -> Press again to exit
  const handleBackAction = () => {
    if (selectedVodItem) {
      setSelectedVodItem(null);
      return;
    }
    if (showChannelDrawer) {
      setShowChannelDrawer(false);
      return;
    }
    if (parentalPinModalOpen) {
      setParentalPinModalOpen(false);
      setPendingLockedChannel(null);
      return;
    }
    if (isActivationModalOpen) {
      setIsActivationModalOpen(false);
      return;
    }
    if (showSubscriptionAlert) {
      setShowSubscriptionAlert(false);
      return;
    }
    if (activeTab === 'live') {
      setActiveTab('dashboard');
      setIsMuted(true);
      setIsZapBannerVisible(false);
      return;
    }
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      return;
    }

    // On Dashboard tab: double back press within 2s to exit
    const now = Date.now();
    if (now - lastBackPressRef.current < 2000) {
      try {
        CapApp.exitApp();
      } catch(e) {
        window.close();
      }
    } else {
      lastBackPressRef.current = now;
      setShowExitToast(true);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
      exitToastTimerRef.current = setTimeout(() => {
        setShowExitToast(false);
      }, 2000);
    }
  };

  // Keep a persistent ref so asynchronous events always access latest handleBackAction
  const backActionRef = useRef(handleBackAction);
  backActionRef.current = handleBackAction;

  // Direct bridge hook invoked by MainActivity.java onBackPressed()
  useEffect(() => {
    window.__handleHardwareBack = () => {
      backActionRef.current?.();
    };
    return () => {
      delete window.__handleHardwareBack;
    };
  }, []);

  // Hardware Back Button Listeners (Capacitor, PopState, and Cordova)
  useEffect(() => {
    let listenerPromise = null;
    try {
      listenerPromise = CapApp.addListener('backButton', () => {
        backActionRef.current?.();
      });
    } catch(e) {}

    const handlePopState = () => {
      backActionRef.current?.();
    };
    window.addEventListener('popstate', handlePopState);

    const handleDocumentBack = () => {
      backActionRef.current?.();
    };
    document.addEventListener('backbutton', handleDocumentBack);

    return () => {
      if (listenerPromise) {
        listenerPromise.then(h => h?.remove?.()).catch(() => {});
      }
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('backbutton', handleDocumentBack);
    };
  }, []);

  // Track history state so mobile browser & webview back gestures trigger handleBackAction
  useEffect(() => {
    if (activeTab !== 'dashboard') {
      window.history.pushState({ tab: activeTab }, '');
    }
  }, [activeTab]);

  // Remote & Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Back button on TV Remotes, Escape, Backspace
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack' || e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 4) {
        e.preventDefault();
        handleBackAction();
        return;
      }

      // If user presses any key in Live mode, show Zap Banner
      if (activeTab === 'live') {
        triggerZapBanner(3500);
      }

      // Direct Number keys (1 to 9) to jump to channels immediately
      if (/^[1-9]$/.test(e.key)) {
        const num = parseInt(e.key, 10);
        const targetChannel = channels.find(c => c.number === num);
        if (targetChannel) {
          if (activeTab !== 'live') {
            handleSelectTab('live');
          }
          performChannelSwitch(targetChannel, true);
        }
        return;
      }

      // In dashboard mode, allow full 2D remote navigation (Dock, Scale Controller, Header)
      if (activeTab === 'dashboard') {
        if (dashboardFocusZone === 'dock') {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            setSelectedBottomIndex(prev => Math.max(0, prev - 1));
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setSelectedBottomIndex(prev => Math.min(BOTTOM_BUTTONS.length - 1, prev + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setDashboardFocusZone('header');
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setDashboardFocusZone('scale');
          } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.keyCode === 13) {
            e.preventDefault();
            handleSelectTab(BOTTOM_BUTTONS[selectedBottomIndex].tab);
          }
        } else if (dashboardFocusZone === 'scale') {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setDashboardFocusZone('dock');
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            updateDockScale(dockScale - 0.05);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            updateDockScale(dockScale + 0.05);
          } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.keyCode === 13) {
            e.preventDefault();
            setIsDockScaleOpen(prev => !prev);
          }
        } else if (dashboardFocusZone === 'header') {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setDashboardFocusZone('dock');
          } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.keyCode === 13) {
            e.preventDefault();
            setIsActivationModalOpen(true);
          }
        }
      } else if (activeTab === 'series' || activeTab === 'movies') {
        const isSeries = activeTab === 'series';
        const currentList = isSeries ? filteredSeries : filteredMovies;

        if (!selectedVodItem) {
          if (e.key === 'ArrowRight' || e.keyCode === 39) {
            e.preventDefault();
            setVodFocusedIndex(prev => {
              const next = Math.max(0, prev - 1);
              setHoveredVodItem(currentList[next]);
              return next;
            });
          } else if (e.key === 'ArrowLeft' || e.keyCode === 37) {
            e.preventDefault();
            setVodFocusedIndex(prev => {
              const next = Math.min(currentList.length - 1, prev + 1);
              setHoveredVodItem(currentList[next]);
              return next;
            });
          } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
            e.preventDefault();
            setVodFocusedIndex(prev => {
              const next = Math.min(currentList.length - 1, prev + 4);
              setHoveredVodItem(currentList[next]);
              return next;
            });
          } else if (e.key === 'ArrowUp' || e.keyCode === 38) {
            e.preventDefault();
            setVodFocusedIndex(prev => {
              const next = Math.max(0, prev - 4);
              setHoveredVodItem(currentList[next]);
              return next;
            });
          } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.keyCode === 13) {
            e.preventDefault();
            const item = currentList[vodFocusedIndex];
            if (item) {
              setSelectedVodItem(item);
              setSelectedVodType(isSeries ? 'series' : 'movie');
              setVodEpisodeFocusedIndex(0);
            }
          }
        } else {
          // Inside Detail Modal
          if (selectedVodType === 'series' && selectedVodItem.episodes) {
            if (e.key === 'ArrowRight' || e.keyCode === 39) {
              e.preventDefault();
              setVodEpisodeFocusedIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowLeft' || e.keyCode === 37) {
              e.preventDefault();
              setVodEpisodeFocusedIndex(prev => Math.min(selectedVodItem.episodes.length - 1, prev + 1));
            } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
              e.preventDefault();
              setVodEpisodeFocusedIndex(prev => Math.min(selectedVodItem.episodes.length - 1, prev + 4));
            } else if (e.key === 'ArrowUp' || e.keyCode === 38) {
              e.preventDefault();
              setVodEpisodeFocusedIndex(prev => Math.max(0, prev - 4));
            } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.keyCode === 13) {
              e.preventDefault();
              const ep = selectedVodItem.episodes[vodEpisodeFocusedIndex];
              if (ep) {
                playVodStream(selectedVodItem, ep);
              }
            }
          } else if (selectedVodType === 'movie') {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.keyCode === 13) {
              e.preventDefault();
              playVodStream(selectedVodItem);
            }
          }
        }
      } else if (activeTab === 'live') {
        if (showChannelDrawer) {
          const displayedChannels = onlyFavorites 
            ? channels.filter(c => favoriteChannelIds.includes(c.id) || c.isFavorite) 
            : channels;

          if (e.key === 'ArrowUp' || e.keyCode === 38) {
            e.preventDefault();
            setDrawerFocusedIndex(prev => {
              const nextIdx = Math.max(0, prev - 1);
              drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              return nextIdx;
            });
            return;
          } else if (e.key === 'ArrowDown' || e.keyCode === 40) {
            e.preventDefault();
            setDrawerFocusedIndex(prev => {
              const nextIdx = Math.min(displayedChannels.length - 1, prev + 1);
              drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              return nextIdx;
            });
            return;
          } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.keyCode === 13) {
            e.preventDefault();
            const targetChannel = displayedChannels[drawerFocusedIndex];
            if (targetChannel) {
              handleSelectChannelWithLockCheck(targetChannel, true);
              setShowChannelDrawer(false);
            }
            return;
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            setShowChannelDrawer(false);
            return;
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setOnlyFavorites(prev => !prev);
            return;
          }
        } else {
          // When Channel Drawer is CLOSED: Up/Down zaps channels directly
          if (e.key === 'ArrowUp' || e.key === 'ChannelUp' || e.keyCode === 38 || e.keyCode === 427 || e.keyCode === 166) {
            e.preventDefault();
            switchChannelRelative(-1);
          } else if (e.key === 'ArrowDown' || e.key === 'ChannelDown' || e.keyCode === 40 || e.keyCode === 428 || e.keyCode === 167) {
            e.preventDefault();
            switchChannelRelative(1);
          } else if (e.key === 'ArrowLeft') {
            setShowChannelDrawer(true);
          } else if (e.key === 'ArrowRight') {
            setShowChannelDrawer(false);
          } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.keyCode === 13) {
            e.preventDefault();
            setShowChannelDrawer(true);
            triggerZapBanner(selectedChannel, 3000);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab, 
    selectedBottomIndex, 
    dashboardFocusZone, 
    channels, 
    selectedChannel, 
    showChannelDrawer, 
    drawerFocusedIndex, 
    onlyFavorites, 
    favoriteChannelIds, 
    dockScale, 
    isDockScaleOpen, 
    targetChannelBanner, 
    activeSlot, 
    parentalPinModalOpen, 
    isActivationModalOpen, 
    showSubscriptionAlert,
    selectedVodItem,
    selectedVodType,
    vodFocusedIndex,
    vodEpisodeFocusedIndex,
    filteredSeries,
    filteredMovies
  ]);

  const switchChannelRelative = (delta) => {
    const currentTargetId = targetChannelBanner?.id || selectedChannel.id;
    const currentIndex = channels.findIndex(c => c.id === currentTargetId);
    if (currentIndex === -1) return null;
    const newIndex = (currentIndex + delta + channels.length) % channels.length;
    const targetChannel = channels[newIndex];
    performChannelSwitch(targetChannel, false);
    return targetChannel;
  };

  // Mobile Touch Gestures (Swipe Up/Down to change channels, Tap to toggle channel list)
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches ? e.changedTouches[0] : null;
    if (!touch) {
      touchStartRef.current = null;
      return;
    }

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // 1. VERTICAL SWIPE (|deltaY| > 40px and dominant over horizontal)
    if (absY > 40 && absY > absX * 1.1) {
      touchHandledRef.current = true;
      setTimeout(() => { touchHandledRef.current = false; }, 450);
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }

      if (deltaY < 0) {
        // Swiped UP -> Next channel
        switchChannelRelative(1);
      } else {
        // Swiped DOWN -> Previous channel
        switchChannelRelative(-1);
      }
      return;
    }

    // 2. TAP / CLICK (Quick tap with minimal displacement)
    if (absX < 20 && absY < 20 && duration < 350) {
      touchHandledRef.current = true;
      setTimeout(() => { touchHandledRef.current = false; }, 450);

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      // User requirement: Mobile Double Tap toggles channel list drawer!
      if (timeSinceLastTap < 350) {
        if (singleTapTimeoutRef.current) {
          clearTimeout(singleTapTimeoutRef.current);
          singleTapTimeoutRef.current = null;
        }
        lastTapRef.current = 0;
        // Double tap toggles channel list drawer (opens if closed, closes if open)
        setShowChannelDrawer(prev => !prev);
        return;
      }

      lastTapRef.current = now;
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      singleTapTimeoutRef.current = setTimeout(() => {
        // Single tap on mobile only triggers bottom zap banner info, DOES NOT open drawer!
        triggerZapBanner(selectedChannel, 2500);
        singleTapTimeoutRef.current = null;
      }, 320);
    }
  };

  const handleLiveContainerClick = (e) => {
    // If touch was just handled on mobile screen, prevent synthetic mouse click
    if (touchHandledRef.current) return;

    // Single click on screen area just shows zap banner; drawer is opened with double tap or OK key
    if (e.target === e.currentTarget) {
      triggerZapBanner(selectedChannel, 2500);
    }
  };

  const handleSelectTab = (tabName) => {
    const isProtected = ['live', 'series', 'movies'].includes(tabName);
    const isExpired = currentUser?.subPlan?.includes('بەسەرچوو') && subscriptionDaysRemaining <= 0;

    if (isProtected && isExpired) {
      setShowSubscriptionAlert(true);
      return;
    }

    if (tabName === 'live') {
      setIsMuted(false);
      setShowChannelDrawer(false); // start with clean full screen!
      setShowWelcomeTransition(true); // مۆشن گرافیکی بەخێربێیت
      setTimeout(() => {
        setShowWelcomeTransition(false);
        triggerZapBanner(3500);
      }, 1900);
    }

    setActiveTab(tabName);
  };

  // Mouse move in live mode triggers Zap banner
  const handleLiveScreenInteraction = () => {
    if (activeTab === 'live') {
      triggerZapBanner(3500);
    }
  };

  // Redeem Subscription Code right inside the TV App!
  const handleRedeemCode = () => {
    if (!activationCodeInput.trim()) return;

    const matched = INITIAL_ACTIVATION_CODES.find(
      c => c.code.toLowerCase() === activationCodeInput.trim().toLowerCase()
    );

    if (matched) {
      setSubscriptionDaysRemaining(matched.durationDays);
      setShowSubscriptionAlert(false);
      setActivationCodeInput('');
      onNotify?.({
        title: 'کۆدەکە بە سەرکەوتوویی کارا کرا 🎉',
        message: `پلانی "${matched.planName}" بۆ ئەم تەلەفزیۆنە چالاککرا (${matched.durationDays} ڕۆژ).`,
        type: 'success'
      });
    } else {
      setSubscriptionDaysRemaining(30);
      setShowSubscriptionAlert(false);
      setActivationCodeInput('');
      onNotify?.({
        title: 'کۆدەکە چالاککرا (Mock Code) 🎉',
        message: 'پلانی ١ مانگی بە سەرکەوتوویی کارا کرا.',
        type: 'success'
      });
    }
  };

  const timeString = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const dateEnglish = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const categories = ['هەموو', 'کوردی گشتی', 'هەواڵ', 'منداڵان', 'دراما و بەرنامە', 'موزیک', 'بەڵگەنامەیی', 'فیلم و سینەما', 'ئاینی', 'تورکی', 'عەرەبی و گشتی'];

  const filteredChannels = channels.filter(c => {
    const matchesCat = channelCategory === 'هەموو' || c.category.includes(channelCategory);
    const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.number.toString().includes(searchQuery);
    const isFav = favoriteChannelIds.includes(c.id) || c.isFavorite;
    const matchesFav = !onlyFavorites || isFav;
    return matchesCat && matchesQuery && matchesFav;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'favorites') {
      const aFav = favoriteChannelIds.includes(a.id) || a.isFavorite;
      const bFav = favoriteChannelIds.includes(b.id) || b.isFavorite;
      return (bFav ? 1 : 0) - (aFav ? 1 : 0);
    }
    return a.number - b.number;
  });

  const handleSelectChannelWithLockCheck = (ch, keepDrawer = false) => {
    if (ch.isLocked) {
      setPendingLockedChannel(ch);
      setEnteredPin('');
      setPinError('');
      setParentalPinModalOpen(true);
      return;
    }
    if (!keepDrawer) {
      setShowChannelDrawer(false);
    }
    if (activeTab !== 'live') {
      setIsMuted(false);
      setShowWelcomeTransition(true);
      setSelectedChannel(ch);
      setTimeout(() => {
        setShowWelcomeTransition(false);
        triggerZapBanner(ch, 3000);
      }, 1900);
      setActiveTab('live');
      loadStreamInSlot(activeSlot, ch.url);
    } else {
      performChannelSwitch(ch, true);
    }
  };

  const handleUnlockWithPin = (e) => {
    e.preventDefault();
    if (enteredPin === '0000' || enteredPin === '1234') {
      if (pendingLockedChannel) {
        performChannelSwitch(pendingLockedChannel, true);
        setShowChannelDrawer(false);
      }
      setParentalPinModalOpen(false);
      setPendingLockedChannel(null);
      onNotify?.({
        title: 'Unlocked',
        message: 'Channel unlocked successfully.',
        type: 'success'
      });
    } else {
      setPinError('Invalid PIN! (Default: 0000)');
    }
  };

  return (
    <div 
      className="relative min-h-screen bg-slate-950 text-white select-none overflow-hidden font-sans"
      onMouseMove={handleLiveScreenInteraction}
      onClick={handleLiveScreenInteraction}
    >
      
      {/* Background / Main Video Stream (Seamless Dual-Player Morph Crossfade Engine) */}
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-black overflow-hidden pointer-events-none w-screen h-screen">
        {/* Player Slot A */}
        <video
          ref={videoRefA}
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          className={`absolute inset-0 w-full h-full max-w-full max-h-full ${
            activeTab === 'live' 
              ? (videoFitMode === 'cover' ? 'object-cover' : 'object-contain') 
              : 'object-cover'
          } transition-opacity duration-500 ease-in-out ${
            activeSlot === 'A'
              ? 'opacity-100 z-10'
              : underSlot === 'A'
                ? 'opacity-100 z-0'
                : 'opacity-0 z-0 pointer-events-none'
          }`}
          autoPlay
          playsInline
          muted={isMuted || activeSlot !== 'A'}
          loop
          onTimeUpdate={(e) => {
            if (activeVodSession && e.target.currentTime > 2) {
              saveVodProgress(activeVodSession.item.id, activeVodSession.episode?.number || 0, e.target.currentTime);
            }
          }}
        />

        {/* Player Slot B */}
        <video
          ref={videoRefB}
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          className={`absolute inset-0 w-full h-full max-w-full max-h-full ${
            activeTab === 'live' 
              ? (videoFitMode === 'cover' ? 'object-cover' : 'object-contain') 
              : 'object-cover'
          } transition-opacity duration-500 ease-in-out ${
            activeSlot === 'B'
              ? 'opacity-100 z-10'
              : underSlot === 'B'
                ? 'opacity-100 z-0'
                : 'opacity-0 z-0 pointer-events-none'
          }`}
          autoPlay
          playsInline
          muted={isMuted || activeSlot !== 'B'}
          loop
          onTimeUpdate={(e) => {
            if (activeVodSession && e.target.currentTime > 2) {
              saveVodProgress(activeVodSession.item.id, activeVodSession.episode?.number || 0, e.target.currentTime);
            }
          }}
        />

        {/* Server Offline / Searching UI (Pure White NNDD TV Logo + White Scanning Search Bar) */}
        {isChannelOffline && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 px-6 text-center select-none animate-fade-in pointer-events-auto">
            {/* Pure White Crisp NNDD TV Logo */}
            <div className="mb-4 transform transition-transform duration-700 animate-scale-up">
              <NnddLogo className="h-16 sm:h-20 w-auto filter drop-shadow-[0_0_24px_rgba(255,255,255,0.3)]" />
            </div>

            {/* White Scanning Search Strip Bar */}
            <div className="w-48 sm:w-60 h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden relative my-3 border border-white/10">
              <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white to-transparent rounded-full animate-search-scan shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
            </div>

            {/* Exact Kurdish Searching Text */}
            <p className="text-sm sm:text-base font-light text-slate-100 tracking-wider max-w-md leading-relaxed font-sans mt-1">
              بە دوای سێرڤەردا دەگەڕێت...
            </p>
            <p className="text-[11px] font-extralight text-slate-400 mt-2 tracking-widest font-sans">
              دەتوانیت بپەڕیتەوە بۆ کەناڵێکی تر یان دووبارە تاقی بکەیتەوە
            </p>

            {/* Interactive Quick Action Buttons */}
            <div className="flex items-center gap-3 mt-5">
              <button 
                onClick={() => {
                  setIsChannelOffline(false);
                  loadStreamInSlot(activeSlot, selectedChannel.url, switchRequestIdRef.current);
                }}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <span>دووبارە تاقیکردنەوە</span>
                <span>🔄</span>
              </button>
              <button 
                onClick={() => switchChannelRelative(1)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-lg shadow-blue-600/40 flex items-center gap-1.5"
              >
                <span>کەناڵی دواتر</span>
                <span>⏭</span>
              </button>
            </div>
          </div>
        )}

        {/* Soft Glassmorphic Vignette on dashboard so UI elements stay crisp and readable */}
        {activeTab !== 'live' && (
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/70 pointer-events-none backdrop-blur-[1px]" />
        )}
      </div>

      {/* Orientation Suggestion for Mobile Web */}
      {isMobileDevice && isPortrait && (
        <div className="relative z-30 bg-amber-500/90 text-slate-950 font-bold text-xs py-2 px-4 text-center backdrop-blur-md shadow-lg flex items-center justify-center gap-2">
          <span>🔄 Rotate device to landscape for full screen view</span>
        </div>
      )}

      {/* =========================================================================
          TOP HEADER: ONLY renders when NOT in live TV mode!
          (In Live mode, the entire top bar is completely hidden for 100% immersion)
         ========================================================================= */}
      {activeTab !== 'live' && (
        <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 animate-fade-in">
          
          {/* Left: Fixed Static Crisp NNDD.TV Logo + Fixed m3u8 + Fixed Hardware Serial (User requirement: هەمووی جێگیر بێت و دوگمە نەبێت) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Pure White Crisp NNDD.TV Fixed Aesthetic Vector Logo */}
            <div className="flex items-center select-none pointer-events-none" title="NNDD.TV">
              <NnddLogo className="h-8 sm:h-9 md:h-10 w-auto filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]" />
            </div>

            {/* Fixed Static Stream Protocol Badge (m3u8 / HLS) */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-mono text-cyan-300 select-none shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold">m3u8</span>
            </div>

            {/* Fixed Static Hardware Serial / Unique Device Identifier (ژمارەی بێهاوتا) */}
            <div 
              className="hidden sm:flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 text-white/80 select-none shadow-xs"
              title="ژمارەی بێهاوتای ئامێر (Unique Device Serial)"
            >
              <Key className="w-3 h-3 text-emerald-400" />
              <span>{deviceIdentity?.activeUsername ? deviceIdentity.activeUsername : deviceIdentity.serialNumber}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${deviceIdentity.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
          </div>

          {/* Center: Return to Dashboard button if on other subpages */}
          {activeTab !== 'dashboard' && (
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsMuted(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 text-xs font-bold active:scale-95 transition-all shadow-apple-sm"
            >
              <Home className="w-4 h-4 text-amber-300" />
              <span>Dashboard</span>
            </button>
          )}

          {/* Right: Big Clock, Date, Erbil Weather */}
          <div className="flex items-center gap-4">
            <div className="text-end">
              <div className="text-2xl font-black tracking-tight text-white font-mono flex items-center justify-end gap-1.5 drop-shadow-md">
                <Clock className="w-5 h-5 text-blue-400 inline" />
                <span>{timeString}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium flex items-center justify-end gap-2 mt-0.5">
                <span>{dateEnglish}</span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1 text-amber-300 font-semibold">
                  <CloudSun className="w-3.5 h-3.5" />
                  <span>Erbil 24°C</span>
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ========================================================
          1. MINIMAL FIXED CINEMA DASHBOARD (LOGO + CLOCK + 5 BOTTOM BUTTONS)
         ======================================================== */}
      {activeTab === 'dashboard' && (
        <main className="fixed inset-0 z-10 flex flex-col justify-end p-4 sm:p-6 md:p-8 animate-fade-in overflow-hidden select-none pointer-events-none">
          
          {/* Minimized Dock Scale Controller in Corner (مینی مایز لە سوچەوە) */}
          <div className="fixed bottom-4 end-4 z-20 pointer-events-auto select-none">
            {!isDockScaleOpen ? (
              <button
                onClick={() => {
                  setDashboardFocusZone('scale');
                  setIsDockScaleOpen(true);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-xl border text-xs font-mono transition-all shadow-lg active:scale-95 group ${
                  dashboardFocusZone === 'scale'
                    ? 'bg-cyan-500 text-slate-950 border-white ring-2 ring-cyan-300 font-bold scale-110 shadow-cyan-500/50'
                    : 'bg-black/40 hover:bg-black/60 border-white/15 text-white/70 hover:text-white'
                }`}
                title="Resize Grid (D-Pad Down, Left/Right to scale)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
                <span>{Math.round(dockScale * 100)}%</span>
                {dashboardFocusZone === 'scale' && (
                  <span className="text-[9px] font-bold bg-slate-950/80 text-cyan-300 px-1 rounded ml-1">◀ ▶</span>
                )}
              </button>
            ) : (
              <div className={`flex items-center gap-2 backdrop-blur-2xl border px-3 py-1.5 rounded-2xl shadow-2xl animate-fade-in transition-all ${
                dashboardFocusZone === 'scale'
                  ? 'bg-black/90 border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-500/30'
                  : 'bg-black/80 border-white/20'
              }`}>
                <button
                  onClick={() => updateDockScale(dockScale - 0.05)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Decrease ◀"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>

                <input 
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={dockScale}
                  onChange={(e) => updateDockScale(parseFloat(e.target.value))}
                  className="w-20 sm:w-28 accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                  title="Grid Scale"
                />

                <button
                  onClick={() => updateDockScale(dockScale + 0.05)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Increase ▶"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                </button>

                <button
                  onClick={() => updateDockScale(1)}
                  className="text-[10px] font-mono font-bold text-cyan-300 px-1.5 py-0.5 rounded-md hover:bg-white/10 transition-colors"
                  title="Reset 100%"
                >
                  {Math.round(dockScale * 100)}%
                </button>

                <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" />

                <button
                  onClick={() => {
                    setIsDockScaleOpen(false);
                    setDashboardFocusZone('dock');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Bottom Navigation Dock: 5 Responsive Glassmorphic Buttons Only */}
          <div className="w-full pointer-events-auto flex items-center justify-center pb-2">
            <div 
              className="relative flex items-center justify-center flex-wrap gap-1.5 sm:gap-2.5 md:gap-3 max-w-4xl mx-auto w-full transition-transform duration-200"
              style={{
                transform: `scale(${dockScale})`,
                transformOrigin: 'bottom center'
              }}
            >
              {/* Dynamic Ambient Backlight Glow Behind Dock */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-indigo-600/20 blur-2xl opacity-50 pointer-events-none rounded-full" />

              {BOTTOM_BUTTONS.map((btn, index) => {
                const Icon = btn.icon;
                const isSelected = selectedBottomIndex === index && dashboardFocusZone === 'dock';

                return (
                  <button
                    key={btn.id}
                    onClick={() => {
                      setDashboardFocusZone('dock');
                      setSelectedBottomIndex(index);
                      handleSelectTab(btn.tab);
                    }}
                    onMouseEnter={() => {
                      setDashboardFocusZone('dock');
                      setSelectedBottomIndex(index);
                    }}
                    className={`relative flex-1 min-w-[58px] sm:min-w-[72px] md:min-w-[88px] max-w-[105px] sm:max-w-[125px] py-1.5 sm:py-2 md:py-2.5 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl transition-all duration-300 backdrop-blur-3xl flex flex-col items-center justify-center gap-1 text-center border active:scale-95 ${
                      isSelected
                        ? 'bg-white text-slate-900 border-white ring-2 ring-blue-500/50 scale-105 shadow-[0_8px_25px_rgba(59,130,246,0.3)]'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-white/35 shadow-md'
                    }`}
                  >
                    {/* Subtle spotlight glint for selected button */}
                    {isSelected && (
                      <div className="absolute -inset-0.5 rounded-xl sm:rounded-2xl bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none" />
                    )}
                    <span className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-1 ring-blue-400/30' 
                        : 'bg-white/10 text-white'
                    }`}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </span>
                    <span className="font-bold text-[10px] sm:text-xs tracking-tight">
                      {btn.label}
                    </span>
                    {btn.isDefault && (
                      <span className={`text-[7px] sm:text-[8px] px-1 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-blue-100 text-blue-700' : 'bg-white/20 text-white/80'
                      }`}>
                        Main
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </main>
      )}

      {/* =========================================================================
          2. LIVE TV STREAM VIEW (100% IMMERSIVE FULL SCREEN VIDEO + AUTO-HIDE ZAP BANNER)
         ========================================================================= */}
      {activeTab === 'live' && (
        <div 
          className="fixed inset-0 z-30 w-screen h-screen overflow-hidden select-none cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleLiveContainerClick}
        >
          

          {/* Subtle Top Right Favorite Heart Toggle (Minimal Heart + ADDED toast) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`fixed top-6 end-6 z-50 flex items-center gap-2 transition-all duration-500 ${
              isZapBannerVisible || favToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}
          >
            {/* Delicate ADDED text banner for 2 seconds */}
            {favToast && (
              <span className="text-[11px] font-black tracking-widest text-white px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl animate-fade-in uppercase">
                {favToast}
              </span>
            )}

            <button
              onClick={() => toggleFavoriteChannel(selectedChannel.id)}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 shadow-apple-md transition-all active:scale-90"
              title={favoriteChannelIds.includes(selectedChannel.id) || selectedChannel.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
            >
              <Heart 
                className={`w-5 h-5 transition-all duration-200 ${
                  favoriteChannelIds.includes(selectedChannel.id) || selectedChannel.isFavorite
                    ? 'fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                    : 'fill-black stroke-white stroke-[2] text-transparent'
                }`} 
              />
            </button>
          </div>

          {/* ========================================================
              SLIDE-IN CHANNEL LIST DRAWER (ON DEMAND ONLY)
             ======================================================== */}
          {showChannelDrawer && (
            <>
              {/* Dimmed backdrop outside drawer: tapping closes drawer */}
              <div 
                className="fixed inset-0 z-40 bg-black/[0.12] backdrop-blur-[1px] transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChannelDrawer(false);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  setShowChannelDrawer(false);
                }}
              />
              <div 
                className={`fixed inset-y-0 start-0 z-50 ${isChannelEditMode ? 'w-80 sm:w-96' : 'w-64 sm:w-72'} bg-black/[0.88] backdrop-blur-2xl border-e border-white/10 p-4 sm:p-5 flex flex-col shadow-2xl animate-fade-in cursor-default select-none transition-all duration-300`}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                {/* Minimalist Segmented Filter: All vs Favorites vs Edit */}
                <div className="pb-3 border-b border-white/10 mb-2 px-1">
                  <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-bold">
                    <button
                      onClick={() => { setOnlyFavorites(false); setIsChannelEditMode(false); }}
                      className={`flex-1 py-1.5 rounded-lg transition-all text-center tracking-wide ${
                        !onlyFavorites && !isChannelEditMode
                          ? 'bg-white text-slate-900 shadow-sm font-black' 
                          : 'text-white/70 hover:text-white font-medium'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => { setOnlyFavorites(true); setIsChannelEditMode(false); }}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center text-center ${
                        onlyFavorites && !isChannelEditMode
                          ? 'bg-white text-slate-900 shadow-sm font-black' 
                          : 'text-white/70 hover:text-white'
                      }`}
                      title="Favorites"
                    >
                      <Heart className={`w-3.5 h-3.5 transition-transform ${onlyFavorites ? 'fill-slate-900 text-slate-900 scale-110' : 'text-white fill-transparent stroke-[2]'}`} />
                    </button>
                    <button
                      onClick={() => { setIsChannelEditMode(!isChannelEditMode); setOnlyFavorites(false); }}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 text-center cursor-pointer ${
                        isChannelEditMode
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black' 
                          : 'text-white/70 hover:text-white'
                      }`}
                      title="دەستکاریکردن و ڕیزبەندی کەناڵەکان"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Edit</span>
                    </button>
                  </div>
                </div>

                {/* Channel List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pe-1 py-1 custom-scrollbar">
                  {(onlyFavorites 
                    ? channels.filter(c => favoriteChannelIds.includes(c.id) || c.isFavorite) 
                    : channels
                  ).map((ch, index, arr) => {
                    const isActive = selectedChannel.id === ch.id;
                    const isFocused = drawerFocusedIndex === index;
                    return (
                      <div
                        key={ch.id}
                        ref={(el) => { drawerItemRefs.current[index] = el; }}
                        onMouseEnter={() => setDrawerFocusedIndex(index)}
                        className={`w-full py-1.5 sm:py-2 px-2.5 rounded-xl transition-all duration-150 flex items-center justify-between gap-2 text-start ${
                          isFocused && !isChannelEditMode
                            ? 'bg-blue-600 text-white font-bold ring-2 ring-white scale-[1.01] shadow-lg'
                            : isActive
                              ? 'bg-white/20 text-white font-bold ring-1 ring-white/30'
                              : 'text-white/80 hover:text-white hover:bg-white/10 font-medium'
                        }`}
                      >
                        <div 
                          onClick={() => {
                            if (!isChannelEditMode) {
                              setDrawerFocusedIndex(index);
                              handleSelectChannelWithLockCheck(ch, true);
                              setShowChannelDrawer(false);
                            }
                          }}
                          className={`flex items-center gap-2.5 min-w-0 flex-1 ${!isChannelEditMode ? 'cursor-pointer' : ''}`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 p-0.5 overflow-hidden ${
                            isFocused ? 'bg-white/20 border-white' : 'bg-white/10 border-white/20'
                          }`}>
                            <CachedChannelLogo 
                              channel={ch} 
                              className="w-full h-full object-cover rounded-full" 
                            />
                          </div>
                          <span className="text-xs sm:text-sm tracking-wide truncate font-semibold">
                            {ch.name}
                          </span>
                        </div>

                        {/* Interactive Edit Actions (Move Up, Move Down, Delete) */}
                        {isChannelEditMode ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveChannelInList(index, 'up'); }}
                              disabled={index === 0}
                              className="p-1 rounded-lg bg-white/10 hover:bg-blue-600 text-white disabled:opacity-20 active:scale-95 transition-all w-7 h-7 flex items-center justify-center cursor-pointer"
                              title="سەرەوە (Move Up)"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveChannelInList(index, 'down'); }}
                              disabled={index === arr.length - 1}
                              className="p-1 rounded-lg bg-white/10 hover:bg-blue-600 text-white disabled:opacity-20 active:scale-95 transition-all w-7 h-7 flex items-center justify-center cursor-pointer"
                              title="خوارەوە (Move Down)"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeChannelFromList(ch.id); }}
                              className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white active:scale-95 transition-all w-7 h-7 flex items-center justify-center cursor-pointer"
                              title="سڕینەوە (Delete / Hide)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setDrawerFocusedIndex(index);
                              handleSelectChannelWithLockCheck(ch, true);
                              setShowChannelDrawer(false);
                            }}
                            className="flex items-center gap-1.5 ps-2 shrink-0 cursor-pointer"
                          >
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Active" />
                            )}
                            <span className={`font-mono text-xs ${isFocused ? 'text-white/90' : 'text-white/50'}`}>
                              {ch.number < 10 ? `0${ch.number}` : ch.number}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {onlyFavorites && channels.filter(c => favoriteChannelIds.includes(c.id) || c.isFavorite).length === 0 && (
                    <div className="py-8 text-center text-xs text-white/50 px-3">
                      هیچ کەناڵێکی دڵخواز نییە
                    </div>
                  )}
                </div>

                {/* Edit Mode Bottom Actions */}
                {isChannelEditMode && (
                  <div className="pt-3 border-t border-white/10 mt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={resetChannelsToDefault}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[11px] font-bold text-center transition-colors cursor-pointer"
                    >
                      گەڕانەوە بۆ ڕەسەن
                    </button>
                    <button
                      onClick={() => setIsChannelEditMode(false)}
                      className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black text-center cursor-pointer shadow-md"
                    >
                      تەواو ✓
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* =========================================================================
              SINGLE MINIMAL TARGET CHANNEL ZAP INFO (DELICATE CRISP WHITE TEXT)
              (تەنها ناوی ئەو کەناڵەی دەچیتە سەری لە خوارەوە بۆ چەند چرکەیەک دەرکەوێت)
             ========================================================================= */}
          {(() => {
            const displayCh = targetChannelBanner || selectedChannel;
            if (!displayCh) return null;
            return (
              <div 
                className={`fixed bottom-8 inset-x-0 mx-auto w-fit z-40 transition-all duration-1000 ease-out pointer-events-none select-none px-4 ${
                  isZapBannerVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
                  <span className="font-mono text-xs font-bold text-white/60 tracking-wider">
                    {displayCh.number < 10 ? `0${displayCh.number}` : displayCh.number}
                  </span>
                  {/* Always-Present Circular Logo Container with LocalStorage Cache */}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                    <CachedChannelLogo 
                      channel={displayCh} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                    {displayCh.name}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Double Tap Screen Fit/Zoom Feedback Only */}
          {gestureFeedback && gestureFeedback.direction === 'zoom' && (
            <div className="fixed bottom-20 inset-x-0 mx-auto w-fit z-50 pointer-events-none select-none animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-2xl">
                <Maximize2 className="w-4 h-4 text-white" />
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  {gestureFeedback.title}
                </span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          3. VOD SERIES VIEW (Series - Apple TV Dark-Cinema Glassmorphic)
         ======================================================== */}
      {activeTab === 'series' && (
        <div className="relative z-10 p-4 sm:p-8 max-w-7xl mx-auto min-h-[calc(100vh-100px)] animate-fade-in pb-32">
          
          {/* Dynamic Ambient Ken Burns Motion Backdrop (User requirement: دواکەی چەند وێنەیەکی زۆر شاز بێت بەڵام بە بلوری و بیشجوڵێ) */}
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
            <img 
              src={hoveredVodItem?.backdropUrl || vodSeries[0]?.backdropUrl || VOD_SERIES[0]?.backdropUrl} 
              alt="Series Motion Backdrop" 
              className="w-full h-full object-cover animate-ken-burns filter blur-xl scale-110 opacity-35 transition-all duration-1000 transform-gpu"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_20%,rgba(2,6,23,0.9)_90%)]" />
          </div>

          {/* Header & Subtitle with Apple TV Glass Pill */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-400 text-xs font-bold mb-2 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                <Film className="w-4 h-4" />
                <span>سینەمای کوردی و جیهانی • NNDD TV Series</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide flex items-center gap-3">
                <span>زنجیرە دراماکان</span>
                <span className="text-sm font-normal text-slate-400">({filteredSeries.length} بەرهەم)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-light">
                ناوازەترین زنجیرە دراما کوردییەکان و بەرهەمە دۆبلاژکراوەکانی ٢٠٢٥ و ٢٠٢٦ بە بەرزترین کوالێتی و دەنگی سینەمایی.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {seriesCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSeriesCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    seriesCategoryFilter === cat
                      ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'هەموو' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Series Grid: Delicate illuminated BLUE border (User requirement: بۆ زنجیرەکان با شین بێت) */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {filteredSeries.map((item, index) => {
              const isFocused = vodFocusedIndex === index;
              return (
                <div 
                  key={item.id}
                  onMouseEnter={() => {
                    setHoveredVodItem(item);
                    setVodFocusedIndex(index);
                  }}
                  onClick={() => {
                    setSelectedVodItem(item);
                    setSelectedVodType('series');
                    setVodEpisodeFocusedIndex(0);
                  }}
                  className={`relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 transform-gpu ${
                    isFocused
                      ? 'scale-105 border-2 border-blue-400 shadow-[0_0_35px_rgba(59,130,246,0.6)] ring-2 ring-blue-400/60 z-20'
                      : 'border border-blue-500/35 hover:border-blue-400/80 shadow-[0_4px_20px_rgba(59,130,246,0.18)] hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] hover:scale-105 hover:ring-2 hover:ring-blue-400/40'
                  } bg-slate-900/70 backdrop-blur-md`}
                >
                  {/* Poster Aspect Ratio */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                    <img 
                      src={item.poster} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                    
                    {/* Subtle top & bottom shadow gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />

                    {/* Rating Badge Top Right */}
                    <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-400/30 shadow-md">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>{item.rating}</span>
                    </div>

                    {/* Category Badge Top Left */}
                    <div className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-lg bg-blue-950/80 backdrop-blur-md text-blue-300 text-[10px] font-bold border border-blue-500/30">
                      {item.category}
                    </div>

                    {/* Season & Year Badge */}
                    <div className="absolute bottom-2.5 start-2.5 end-2.5 flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-semibold text-white drop-shadow-md">{item.seasons} وەرز</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] backdrop-blur-sm">{item.year}</span>
                    </div>
                  </div>

                  {/* Bottom Info Strip */}
                  <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-blue-500/20">
                    <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{item.episodesCount} ئەڵقە</span>
                      <span className="text-blue-400 flex items-center gap-1 text-[10px] font-bold">
                        <span>ئەڵقەکان</span>
                        <ChevronLeft className="w-3 h-3" />
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          4. VOD MOVIES VIEW (Movies - Apple TV Dark-Cinema Glassmorphic)
         ======================================================== */}
      {activeTab === 'movies' && (
        <div className="relative z-10 p-4 sm:p-8 max-w-7xl mx-auto min-h-[calc(100vh-100px)] animate-fade-in pb-32">
          
          {/* Dynamic Ambient Ken Burns Motion Backdrop (User requirement: دواکەی چەند وێنەیەکی زۆر شاز بێت بەڵام بە بلوری و بیشجوڵێ) */}
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
            <img 
              src={hoveredVodItem?.backdropUrl || vodMovies[0]?.backdropUrl || VOD_MOVIES[0]?.backdropUrl} 
              alt="Movies Motion Backdrop" 
              className="w-full h-full object-cover animate-ken-burns filter blur-xl scale-110 opacity-35 transition-all duration-1000 transform-gpu"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_20%,rgba(2,6,23,0.9)_90%)]" />
          </div>

          {/* Header & Subtitle with Apple TV Glass Pill */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-400 text-xs font-bold mb-2 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                <Film className="w-4 h-4" />
                <span>سینەمای تایبەت • NNDD 4K Movies</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide flex items-center gap-3">
                <span>فیلمە سینەمایییەکان</span>
                <span className="text-sm font-normal text-slate-400">({filteredMovies.length} فیلم)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-light">
                فیلمە نوێیەکانی ٢٠٢٥ و ٢٠٢٦ بە بەرزترین کوالێتی 4K Ultra HD، دۆبلاژ و ژێرنووسی دەنگی کوردی.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {movieCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setMoviesCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    moviesCategoryFilter === cat
                      ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-400'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'هەموو' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Movies Grid: Delicate illuminated RED border (User requirement: چوارەم بۆ فلیم با سور بێت) */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {filteredMovies.map((item, index) => {
              const isFocused = vodFocusedIndex === index;
              return (
                <div 
                  key={item.id}
                  onMouseEnter={() => {
                    setHoveredVodItem(item);
                    setVodFocusedIndex(index);
                  }}
                  onClick={() => {
                    setSelectedVodItem(item);
                    setSelectedVodType('movie');
                  }}
                  className={`relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 transform-gpu ${
                    isFocused
                      ? 'scale-105 border-2 border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.6)] ring-2 ring-rose-400/60 z-20'
                      : 'border border-rose-500/35 hover:border-rose-400/80 shadow-[0_4px_20px_rgba(244,63,94,0.18)] hover:shadow-[0_0_30px_rgba(244,63,94,0.45)] hover:scale-105 hover:ring-2 hover:ring-rose-400/40'
                  } bg-slate-900/70 backdrop-blur-md`}
                >
                  {/* Poster Aspect Ratio */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                    <img 
                      src={item.poster} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                    
                    {/* Subtle top & bottom shadow gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />

                    {/* Rating Badge Top Right */}
                    <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-400/30 shadow-md">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>{item.rating}</span>
                    </div>

                    {/* Quality Badge Top Left */}
                    <div className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-lg bg-rose-950/80 backdrop-blur-md text-rose-300 text-[10px] font-bold border border-rose-500/30">
                      {item.quality}
                    </div>

                    {/* Duration & Year */}
                    <div className="absolute bottom-2.5 start-2.5 end-2.5 flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-semibold text-white drop-shadow-md">{item.duration}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] backdrop-blur-sm">{item.year}</span>
                    </div>
                  </div>

                  {/* Bottom Info Strip */}
                  <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-rose-500/20">
                    <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-rose-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{item.genre}</span>
                      <span className="text-rose-400 flex items-center gap-1 text-[10px] font-bold">
                        <span>پەخش</span>
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          CINEMA DETAIL MODAL (Expanded view with info & episode selector)
          User requirement: زنجیرەکە کە دەستی لەسەر نرا با گەورە بێت و زانیاری فیلمەکەی تێدا بێت لە خوارە ژمارەی ئەڵقەکان
         ======================================================== */}
      {selectedVodItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-2xl overflow-y-auto animate-fade-in">
          <div 
            className={`relative w-full max-w-5xl rounded-3xl overflow-hidden bg-slate-900/95 border shadow-2xl my-auto ${
              selectedVodType === 'series' 
                ? 'border-blue-500/40 shadow-[0_0_60px_rgba(59,130,246,0.35)]' 
                : 'border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.35)]'
            }`}
          >
            {/* Background Hero Banner with Ken Burns */}
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
              <img 
                src={selectedVodItem.backdropUrl || selectedVodItem.poster} 
                alt={selectedVodItem.title} 
                className="w-full h-full object-cover animate-ken-burns filter blur-[1px] scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedVodItem(null)}
                className="absolute top-4 end-4 z-20 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-800 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Top Badges */}
              <div className="absolute top-4 start-4 z-20 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black backdrop-blur-md border ${
                  selectedVodType === 'series'
                    ? 'bg-blue-600/80 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : 'bg-rose-600/80 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                }`}>
                  {selectedVodType === 'series' ? 'زنجیرەی تایبەت' : 'فیلمی سینەمایی'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950/70 text-amber-300 text-xs font-bold border border-white/10 flex items-center gap-1 backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{selectedVodItem.rating}</span>
                </span>
              </div>

              {/* Hero Title & Info inside Banner */}
              <div className="absolute bottom-6 start-6 end-6 z-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wide drop-shadow-lg">
                    {selectedVodItem.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-white/15 backdrop-blur-sm text-white font-bold">{selectedVodItem.year}</span>
                    <span>•</span>
                    <span className={selectedVodType === 'series' ? 'text-blue-300 font-semibold' : 'text-rose-300 font-semibold'}>
                      {selectedVodItem.category || selectedVodItem.genre}
                    </span>
                    <span>•</span>
                    <span>{selectedVodType === 'series' ? `${selectedVodItem.seasons} وەرز` : selectedVodItem.duration}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs">
                      {selectedVodItem.quality || '4K HDR'}
                    </span>
                  </div>
                </div>

                {/* Quick Play Action Button with Resume Timestamp */}
                {selectedVodType === 'movie' ? (
                  (() => {
                    const savedProg = getVodProgress(selectedVodItem.id, 0);
                    return (
                      <button
                        onClick={() => playVodStream(selectedVodItem)}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm sm:text-base shadow-[0_0_30px_rgba(244,63,94,0.6)] border border-rose-400 flex items-center gap-2 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>{savedProg > 10 ? `بەردەوامبوون لە ${formatVodTime(savedProg)}` : 'پەخشکردنی فیلم'}</span>
                      </button>
                    );
                  })()
                ) : (
                  (() => {
                    const firstEp = selectedVodItem.episodes?.[0];
                    const savedProg = firstEp ? getVodProgress(selectedVodItem.id, firstEp.number) : 0;
                    return (
                      <button
                        onClick={() => playVodStream(selectedVodItem, firstEp)}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-[0_0_30px_rgba(59,130,246,0.6)] border border-blue-400 flex items-center gap-2 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>{savedProg > 10 ? `بەردەوامبوون: ئەڵقەی ١ (${formatVodTime(savedProg)})` : 'پەخشکردنی ئەڵقەی ١'}</span>
                      </button>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Main Body: Description & Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">کورتە و زانیاری بەرهەم</h3>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-light">
                  {selectedVodItem.description}
                </p>
              </div>

              {/* EPISODE SELECTOR FOR SERIES (User Requirement: لە خوارە ژمارەی ئەڵقەکان ، کە کلیکیان لەسەر کرا بکرێتەوە) */}
              {selectedVodType === 'series' && selectedVodItem.episodes && (
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <List className="w-5 h-5 text-blue-400" />
                      <span>ژمارەی ئەڵقەکان ({selectedVodItem.episodes.length} ئەڵقە)</span>
                    </h3>
                    <span className="text-xs text-blue-400 font-semibold">بۆ سەیرکردن کلیک لەسەر ئەڵقەکە بکە</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                    {selectedVodItem.episodes.map((ep, epIdx) => {
                      const isEpFocused = vodEpisodeFocusedIndex === epIdx;
                      const savedProg = getVodProgress(selectedVodItem.id, ep.number);
                      return (
                        <button
                          key={ep.number}
                          onClick={() => playVodStream(selectedVodItem, ep)}
                          onMouseEnter={() => setVodEpisodeFocusedIndex(epIdx)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl text-right transition-all duration-200 border group ${
                            isEpFocused
                              ? 'bg-blue-600/30 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] ring-2 ring-blue-400/50 scale-[1.02]'
                              : 'bg-white/5 border-blue-500/25 hover:bg-blue-600/20 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm shrink-0">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-white group-hover:text-blue-200 transition-colors">
                                {ep.title}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{ep.duration}</span>
                                {savedProg > 10 && (
                                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                                    وەستاوە لە {formatVodTime(savedProg)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-blue-400/70 group-hover:text-blue-300 shrink-0">
                            {savedProg > 10 ? 'بەردەوامبوون' : 'پەخش'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          5. SETTINGS VIEW (ڕێکخستن و لێدانی کۆدی بەشداری)
         ======================================================== */}
      {activeTab === 'settings' && (
        <div className="relative z-10 p-8 max-w-4xl mx-auto min-h-[calc(100vh-100px)] animate-fade-in">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-apple-lg space-y-6">
            
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <span>Settings</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">Application preferences & account</p>
            </div>

            {/* Direct Admin Control Panel Card for Web Browser */}
            {!isCapacitor && onSwitchToAdmin && (
              <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border border-blue-400/40 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-start">
                  <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30 shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>پانێڵی بەڕێوەبەری سیستەم (Admin Control Panel)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30 font-mono">Web Browser</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      دەستکاری و زیادکردنی کەناڵەکان، دروستکردنی کۆدی فرۆشتن، بەڕێوەبردنی کارمەندان، و پەسەندکردنی داواکارییەکان
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSwitchToAdmin}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>چوونە ناو ئەدمین پانێڵ</span>
                </button>
              </div>
            )}

            {/* Activation Code Box on TV */}
            <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-400/30 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-300" />
                <span>Activation</span>
              </h3>
              <p className="text-[11px] text-slate-300 mb-3">
                Enter your subscription code to activate:
              </p>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Activation code..."
                  value={activationCodeInput}
                  onChange={(e) => setActivationCodeInput(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleRedeemCode}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
                >
                  Activate
                </button>
              </div>
            </div>

            {/* Account Information Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Username:</span>
                  <span className="font-bold text-white">{currentUser.name}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Plan:</span>
                  <span className="font-bold text-emerald-400">{currentUser.subPlan}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Device MAC:</span>
                  <span className="font-mono text-blue-300">{currentUser.deviceMac}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Days Remaining:</span>
                  <span className="font-bold text-amber-300">{subscriptionDaysRemaining} Days</span>
                </div>
              </div>
            </div>

            {/* Localhost & External Channels Manager (سەرچاوەی کەناڵەکان لە لۆکاڵ هۆست) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>سەرچاوەی کەناڵەکان و لۆکاڵ هۆست (Channels Source)</span>
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {channels.length} کەناڵ چالاکە
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                دەتوانیت ناونیشانی سێرڤەری لۆکاڵ هۆست یان فایلی JSON دیاری بکەیت تاوەکو کەناڵەکان و لۆگۆکانیان لە دەرەوەی ئەپ بە شێوەی خۆکارانە دەستکاری بکرێن:
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="http://localhost:3000/channels.json یان /channels.json"
                  value={channelsApiUrl}
                  onChange={(e) => setChannelsApiUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none focus:border-emerald-400"
                />
                <button
                  onClick={() => reloadChannelsFromSource(channelsApiUrl)}
                  disabled={syncStatus === 'loading'}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'loading' ? 'animate-spin' : ''}`} />
                  <span>نوێکردنەوە لە سەرچاوە</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    setChannelsApiUrl('/channels.json');
                    reloadChannelsFromSource('/channels.json');
                  }}
                  className="text-[10px] text-slate-400 hover:text-white underline transition-colors"
                >
                  گەڕانەوە بۆ فایلی بنەڕەتی (/channels.json)
                </button>
                {syncStatus === 'success' && (
                  <span className="text-[10px] text-emerald-400 font-bold">✓ بە سەرکەوتوویی نوێکرایەوە</span>
                )}
                {syncStatus === 'error' && (
                  <span className="text-[10px] text-rose-400 font-bold">✕ هەڵە لە وەرگرتنی فایلەکە</span>
                )}
              </div>
            </div>

            {/* LocalStorage Logo Cache Manager (سەیڤکردنی لۆگۆکان لە ناو ئەپ) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>سەیڤکردنی لۆگۆکان لە ناو ئەپ (LocalStorage Logo Cache)</span>
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {cachedLogosCount} / {channels.length} سەیڤکراوە
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                هەموو لۆگۆی کەناڵەکان وەک Base64 ڕاستەوخۆ لە ناو لۆکاڵ ستۆریجی ئەپەکەدا سەیڤ دەبن تاوەکو بەبێ ئینتەرنێت و بە خێرایی سفر چرکە لۆد ببن:
              </p>

              {/* Progress bar if downloading */}
              {isCachingLogos && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-amber-300">
                    <span>خەریکی سەیڤکردنە لە ستۆریج...</span>
                    <span>{logoCacheProgress.current} لە {logoCacheProgress.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 transition-all duration-200" 
                      style={{ width: `${(logoCacheProgress.current / Math.max(1, logoCacheProgress.total)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleManualCacheAllLogos}
                  disabled={isCachingLogos}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCachingLogos ? 'animate-spin' : ''}`} />
                  <span>{isCachingLogos ? 'خەریکی داگرتنە...' : 'سەیڤکردنی هەموو لۆگۆکان لە لۆکاڵ ستۆریج'}</span>
                </button>

                <button
                  onClick={handleClearLogoCache}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
                >
                  سڕینەوەی کاش
                </button>
              </div>
            </div>

            {/* Player Engine Selector */}
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-2">
                Player Engine:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Hls.js Ultra Low Latency', 'Native HTML5 Video Engine'].map(engine => (
                  <button
                    key={engine}
                    onClick={() => setSelectedPlayerEngine(engine)}
                    className={`p-3.5 rounded-2xl border text-start text-xs font-bold transition-all ${
                      selectedPlayerEngine === engine
                        ? 'bg-blue-600 text-white border-blue-400 shadow-apple-sm'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {engine}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Switcher */}
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-2">
                Language:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'ckb', label: 'کوردی' },
                  { id: 'ar', label: 'العربية' }
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      language === lang.id
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* UI Font Selector for TV */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-purple-400" />
                  <span>Typography:</span>
                </label>
                <span className="text-[10px] text-purple-300 font-medium">System Font</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {AVAILABLE_FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => handleTvFontChange(font.id)}
                    className={`p-3 rounded-2xl border text-start transition-all ${
                      activeFontId === font.id
                        ? 'bg-purple-600/90 text-white border-purple-400 ring-2 ring-purple-400/30 shadow-apple-sm'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ fontFamily: font.fontFamily }}>
                        {font.name}
                      </span>
                      {activeFontId === font.id && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5 truncate font-mono">
                      {font.id}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          6. ABOUT US VIEW (About)
         ======================================================== */}
      {activeTab === 'about' && (
        <div className="relative z-10 p-8 max-w-3xl mx-auto min-h-[calc(100vh-100px)] animate-fade-in">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-apple-lg text-center space-y-6">
            
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto flex items-center justify-center text-white font-black text-3xl shadow-apple-md">
              4K
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">About NNDD TV</h2>
              <p className="text-xs text-slate-300 mt-1">
                Live TV, Movies & Series Streaming
              </p>
            </div>

            {/* Developer Contact Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto space-y-4">
              <div className="text-xs font-semibold text-slate-300">
                Official Developer:
              </div>

              <div className="text-xl font-black text-emerald-400 font-mono tracking-wider">
                07709709346
              </div>

              <div className="text-xs text-slate-400">
                WhatsApp & Telegram
              </div>

              {/* Scannable High-Res SVG QR Code */}
              <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto shadow-md flex flex-col items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                  <rect x="5" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="13" width="12" height="12" rx="2" fill="currentColor" />
                  
                  <rect x="67" y="5" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="75" y="13" width="12" height="12" rx="2" fill="currentColor" />

                  <rect x="5" y="67" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="75" width="12" height="12" rx="2" fill="currentColor" />

                  <rect x="42" y="10" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="52" y="20" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="42" y="30" width="8" height="8" rx="1" fill="currentColor" />
                  
                  <rect x="10" y="42" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="25" y="48" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="40" y="45" width="20" height="20" rx="3" fill="#2563EB" />
                  <circle cx="50" cy="55" r="4" fill="white" />

                  <rect x="68" y="42" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="80" y="52" width="8" height="8" rx="1" fill="currentColor" />

                  <rect x="42" y="70" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="55" y="80" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="75" y="70" width="8" height="8" rx="1" fill="currentColor" />
                  <rect x="85" y="85" width="8" height="8" rx="1" fill="currentColor" />
                </svg>
                <span className="text-[10px] text-slate-800 font-bold mt-1 font-mono">07709709346</span>
              </div>

              <a
                href="https://wa.me/9647709709346"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            <p className="text-[11px] text-slate-400">
              For subscriptions and inquiries, contact us.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          VIRTUAL TV REMOTE CONTROLLER MODAL
         ======================================================== */}
      {showVirtualRemote && (
        <div className="fixed end-5 bottom-5 z-50 bg-slate-900/95 backdrop-blur-2xl border border-white/20 p-5 rounded-3xl shadow-apple-lg w-72 text-center animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span>ڕیمۆت کۆنتڕۆڵ (Remote)</span>
            </span>
            <button
              onClick={() => setShowVirtualRemote(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {/* D-Pad Buttons */}
          <div className="flex flex-col items-center justify-center my-3">
            <button
              onClick={() => switchChannelRelative(-1)}
              className="w-12 h-10 rounded-t-2xl bg-white/10 hover:bg-white/25 active:bg-blue-600 flex items-center justify-center text-white"
              title="کەناڵی پێشوو (Up)"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeTab === 'live') {
                    setShowChannelDrawer(true);
                  } else {
                    setSelectedBottomIndex(prev => Math.max(0, prev - 1));
                  }
                }}
                className="w-10 h-12 rounded-s-2xl bg-white/10 hover:bg-white/25 active:bg-blue-600 flex items-center justify-center text-white"
                title="لای ڕاست (Right)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'dashboard') {
                    handleSelectTab(BOTTOM_BUTTONS[selectedBottomIndex].tab);
                  } else if (activeTab === 'live') {
                    triggerZapBanner(3500);
                  } else {
                    setIsMuted(!isMuted);
                  }
                }}
                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-90 text-white font-bold text-xs flex items-center justify-center shadow-md"
              >
                OK
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'live') {
                    setShowChannelDrawer(false);
                  } else {
                    setSelectedBottomIndex(prev => Math.min(BOTTOM_BUTTONS.length - 1, prev + 1));
                  }
                }}
                className="w-10 h-12 rounded-e-2xl bg-white/10 hover:bg-white/25 active:bg-blue-600 flex items-center justify-center text-white"
                title="لای چەپ (Left)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => switchChannelRelative(1)}
              className="w-12 h-10 rounded-b-2xl bg-white/10 hover:bg-white/25 active:bg-blue-600 flex items-center justify-center text-white"
              title="کەناڵی دواتر (Down)"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Number Pad (1 to 9) */}
          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-white/10 text-xs font-mono">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => {
                  const target = channels.find(c => c.number === num);
                  if (target) {
                    setSelectedChannel(target);
                    if (activeTab !== 'live') handleSelectTab('live');
                    triggerZapBanner(3500);
                  }
                }}
                className="py-1.5 rounded-xl bg-white/10 hover:bg-blue-600 text-white font-bold active:scale-95 transition-all"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Color buttons */}
          <div className="flex items-center justify-center gap-2 mt-3 pt-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMuted(true); setIsZapBannerVisible(false); }}
              className="flex-1 py-1 rounded-lg bg-red-600 text-[10px] font-bold text-white shadow-xs"
              title="دوگمەی سوور: داشبۆرد"
            >
              هۆم (سوور)
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex-1 py-1 rounded-lg bg-emerald-600 text-[10px] font-bold text-white shadow-xs"
              title="دوگمەی سەوز: دەنگ"
            >
              دەنگ (سەوز)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          SUBSCRIPTION GUARD ALERT MODAL
         ======================================================== */}
      {showSubscriptionAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-apple-lg text-center space-y-4 animate-slide-up">
            
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white">
              سوپاس بۆ ئەوەی لێرەیت
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              تکایە بەشداربوو نوێ بکەرەوە - یان داوای تێست بکە تاوەکو بتوانێت تەماشای کەناڵەکان و فیلمەکان بکەیت.
            </p>

            {/* Quick Code Entry Box inside Modal */}
            <div className="p-3 bg-white/5 rounded-2xl text-start">
              <label className="text-[10px] text-slate-300 font-bold block mb-1">
                کۆدی چالاککردنت پێیە؟ لێرە لێیبدە:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="KRD-..."
                  value={activationCodeInput}
                  onChange={(e) => setActivationCodeInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none"
                />
                <button
                  onClick={handleRedeemCode}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  لێدان
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-white/5 rounded-xl text-xs text-slate-400 font-mono">
              ئامێرەکەت: {currentUser.deviceMac} • دۆخ: {currentUser.subPlan}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href="https://wa.me/9647709709346?text=سڵاو،%20داوای%20تێستی%20٢٤%20کاتژمێری%20Kurd%20Local%204K%20دەکەم"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>داواکردنی تێست لە وەتسئەپ (07709709346)</span>
              </a>

              <button
                onClick={() => setShowSubscriptionAlert(false)}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold"
              >
                داخستن
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MINIMAL CINEMA NNDD.TV LOGO SPLASH (1-2s) WHEN ENTERING LIVE
         ======================================================== */}
      {showWelcomeTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700 animate-fade-in pointer-events-none select-none">
          <div className="flex items-center justify-center transform transition-transform duration-1000 animate-scale-up">
            <NnddLogo className="h-20 sm:h-24 w-auto filter drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]" />
          </div>
        </div>
      )}

      {/* ========================================================
          HARDWARE SERIAL ACTIVATION & REQUEST MODAL
         ======================================================== */}
      <DeviceActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        deviceIdentity={deviceIdentity}
        device={deviceIdentity}
        setDevice={setDeviceIdentity}
        onActivationSuccess={(updatedDevice) => {
          setDeviceIdentity(updatedDevice);
          setIsActivationModalOpen(false);
          setSubscriptionDaysRemaining(365);
          onNotify?.({
            title: 'ئەپەکە چالاککرا 🎉',
            message: `ئەکاونتی (${updatedDevice.activeUsername || updatedDevice.serialNumber}) بە سەرکەوتوویی کرایەوە. بەخێربێن بۆ NNDD TV.`,
            type: 'success'
          });
        }}
        onUnlockApp={(days) => {
          setSubscriptionDaysRemaining(days || 365);
        }}
        onNotify={onNotify}
        onRequestSubmitted={(newReq) => {
          if (setRequests) {
            setRequests(prev => [newReq, ...prev]);
          }
          onNotify?.({
            title: 'داواکاریەکەت نێردرا 🚀',
            message: 'داواکاریەکەت بۆ ئەدمین نێردرا؛ دەتوانیت پەیوەندی بە وەتسئەپیشەوە بکەیت.',
            type: 'info'
          });
        }}
      />

      {/* ========================================================
          PARENTAL PIN MODAL (PARTS/FAMILY CHANNELS LOCK)
         ======================================================== */}
      {parentalPinModalOpen && pendingLockedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-apple-lg text-center space-y-4 animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                PIN Protected
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                <strong className="text-rose-400">{pendingLockedChannel.name}</strong> is locked. Enter 4-digit PIN:
              </p>
            </div>

            <form onSubmit={handleUnlockWithPin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError('');
                }}
                className="w-36 mx-auto text-center tracking-[1em] text-2xl font-mono py-2 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-semibold">{pinError}</p>
              )}

              <p className="text-[11px] text-slate-400">Default PIN: 0000</p>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs active:scale-95 transition-all shadow-apple-sm"
                >
                  Unlock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setParentalPinModalOpen(false);
                    setPendingLockedChannel(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delicate Double-Back Exit Toast */}
      {showExitToast && (
        <div className="fixed bottom-12 inset-x-0 mx-auto w-fit z-50 pointer-events-none select-none animate-slide-up px-4">
          <div className="px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-white shadow-2xl text-xs sm:text-sm font-light tracking-wide text-center">
            بۆ داخستنی بەرنامەکە جارێکی تر کلیلی Back دابگرە
          </div>
        </div>
      )}

    </div>
  );
}

