import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
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
  ArrowDown,
  RotateCcw,
  RotateCw,
  SkipForward,
  Download,
  Server,
  Crown,
  Activity,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  Copy,
  Sun,
  Globe,
  Table
} from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  getSavedLanguage, 
  saveLanguage, 
  translate, 
  getLocalizedChannelName,
  VOD_7_CATEGORIES,
  getLocalizedVodCategoryName
} from '../data/translations';
import { CHANNELS_DATA, VOD_SERIES, VOD_MOVIES, SUBSCRIPTION_PLANS, INITIAL_ACTIVATION_CODES } from '../data/mockData';
import { AVAILABLE_FONTS, applyFontToDocument, getCurrentFont } from '../data/fonts';
import { getOrCreateDeviceIdentity, saveDeviceIdentity } from '../data/deviceManager';
import { recordDeviceTelemetry, fetchClientPublicIp, getDeviceUniqueCode, registerOrUpdateDeviceEntry } from '../data/telemetryService';
import DeviceActivationModal from './DeviceActivationModal';
import NnddLogo from './NnddLogo';
import CachedChannelLogo from './CachedChannelLogo';
import { cacheAllChannelLogos, getCachedLogosCount, clearCachedLogos } from '../data/logoCache';
import { App as CapApp } from '@capacitor/app';
import { useDevice } from '../context/DeviceContext';
import PaginatedChannelGrid from './PaginatedChannelGrid';
import { getSupabaseChannels, supabase } from '../data/supabaseClient';
import { getStoredServerSettings, getStoredServers, saveStoredServers, saveStoredServerSettings, detectServerBadge } from '../data/serverManager';
import { 
  DEFAULT_SERVER_CONFIG, 
  testXtreamConnection, 
  importTargetServerChannels, 
  importTargetServerVod,
  fetchSeriesEpisodes,
  resolveXtreamHost,
  getXtreamCategories, 
  getXtreamLiveStreams,
  classifyVodCategory
} from '../data/serverImporter';
import VodPlayer from './VodPlayer';

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

  // Unique Screen Device Code (Persistent per TV / device)
  const uniqueScreenCode = useMemo(() => getDeviceUniqueCode(), []);

  // Real-Time Weather State (Erbil, Kurdistan - Top GitHub Weather App layout)
  const [weatherData, setWeatherData] = useState(() => ({
    city: 'Erbil',
    cityKurdish: 'هەولێر',
    temp: 24,
    feelsLike: 25,
    condition: 'ساماڵ و کەمێک هەور',
    conditionEn: 'Partly Cloudy',
    humidity: 46,
    windSpeed: 12,
    weatherCode: 1
  }));

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=36.1911&longitude=44.0092&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto');
        if (res.ok) {
          const data = await res.json();
          const cur = data.current;
          if (cur && isMounted) {
            const code = cur.weather_code;
            let condKu = 'ساماڵ و خۆرەتاو';
            let condEn = 'Sunny';
            if (code >= 1 && code <= 3) {
              condKu = 'کەمێک هەور';
              condEn = 'Partly Cloudy';
            } else if (code >= 45 && code <= 48) {
              condKu = 'تەمومژ';
              condEn = 'Foggy';
            } else if (code >= 51 && code <= 67) {
              condKu = 'نمەباران';
              condEn = 'Rainy';
            } else if (code >= 71 && code <= 86) {
              condKu = 'بەفربارین';
              condEn = 'Snowy';
            } else if (code >= 95) {
              condKu = 'برووسکە و باران';
              condEn = 'Thunderstorm';
            }

            setWeatherData({
              city: 'Erbil',
              cityKurdish: 'هەولێر',
              temp: Math.round(cur.temperature_2m),
              feelsLike: Math.round(cur.apparent_temperature),
              condition: condKu,
              conditionEn: condEn,
              humidity: Math.round(cur.relative_humidity_2m),
              windSpeed: Math.round(cur.wind_speed_10m),
              weatherCode: code
            });
          }
        }
      } catch(e) {}
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 900000); // refresh every 15m
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Channels state (using passed props if provided, with cache support)
  const [internalChannels, setInternalChannels] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_channels');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(CHANNELS_DATA));
    } catch(e) {}
    return CHANNELS_DATA;
  });
  const channels = propChannels || internalChannels;
  const setChannels = propSetChannels || setInternalChannels;

  // Dual-Player Preloading & Seamless Switching Engine (Event-Driven Architecture)
  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const [activeSlot, setActiveSlot] = useState('A'); // 'A' or 'B'
  const controllersRef = useRef({
    A: { hls: null, mpegts: null, reqId: 0, watchdog: null, abortController: null, url: '' },
    B: { hls: null, mpegts: null, reqId: 0, watchdog: null, abortController: null, url: '' }
  });

  // Preloading & 5-Second Auto-Switch Machine with Rapid Zap Debounce & White Circle Countdown
  const [preloadState, setPreloadState] = useState(null); // { targetChannel, slot: 'A'|'B', reqId, startedAt }
  const [switchingChannel, setSwitchingChannel] = useState(null); // Next/target channel for switching HUD
  const [countdownRemaining, setCountdownRemaining] = useState(5); // 5-second countdown for white circular indicator
  const countdownIntervalRef = useRef(null);
  const stageTimer5sRef = useRef(null);
  const zapDebounceTimerRef = useRef(null);
  const pendingZapChannelRef = useRef(null);
  const pendingZapIndexRef = useRef(null);
  const persistentTargetChannelRef = useRef(null);
  const persistentTargetIndexRef = useRef(null);
  const switchRequestIdRef = useRef(0);
  const seriesScrollContainerRef = useRef(null);
  const moviesScrollContainerRef = useRef(null);
  const vodSeriesCardRefs = useRef([]);
  const vodMovieCardRefs = useRef([]);

  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const startCountdown = () => {
    clearCountdown();
    setCountdownRemaining(5);
  };

  const [isChannelOffline, setIsChannelOffline] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressRef = useRef(0);
  const exitToastTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const perfMetricsRef = useRef({
    reqId: 0,
    t0_click: 0,
    t1_manifest_req: 0,
    t2_manifest_loaded: 0,
    t3_first_frag: 0,
    t4_playing: 0,
    channelName: '',
    channelNumber: 0,
    isLogged: false
  });

  // VOD Series & Movies State (Apple TV Cinema Glassmorphic Engine)
  const [internalVodSeries, setInternalVodSeries] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_vod_series_v3');
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
      const cached = localStorage.getItem('nndd_cached_vod_movies_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return VOD_MOVIES;
  });
  const vodMovies = (vodMoviesProp && vodMoviesProp.length > 0) ? vodMoviesProp : internalVodMovies;
  const setVodMovies = setVodMoviesProp || setInternalVodMovies;

  // Localhost / Remote API URL for editable channel list outside the app
  const [channelsApiUrl, setChannelsApiUrl] = useState(() => {
    try {
      return localStorage.getItem('nndd_channels_api_url') || '/channels.json';
    } catch(e) {
      return '/channels.json';
    }
  });
  const [syncStatus, setSyncStatus] = useState(null);
  const [channelHealthMap, setChannelHealthMap] = useState({});

  // Active Server Credentials & Sync State
  const [activeXtreamConfig, setActiveXtreamConfig] = useState(() => {
    try {
      const servers = getStoredServers();
      const settings = getStoredServerSettings();
      const active = servers.find(s => s.id === settings.activeServerId) || servers[0];
      if (active) {
        return {
          host: active.serverUrl.replace(/\/+$/, ''),
          username: active.username || '',
          password: active.password || '',
          name: active.name || 'سێرڤەری فەرمی NNDD (Free M3U8)'
        };
      }
    } catch(e) {}
    return {
      host: 'https://nndd-tv.vercel.app',
      username: '',
      password: '',
      name: 'سێرڤەری فەرمی NNDD (Free M3U8)'
    };
  });

  // Purge any old expired server credentials from localStorage on boot
  useEffect(() => {
    try {
      const rawStored = localStorage.getItem('nndd_active_xtream_config');
      if (rawStored && (rawStored.includes('384ec56c') || rawStored.includes('11d68d6be9'))) {
        localStorage.removeItem('nndd_active_xtream_config');
      }
    } catch(e) {}
  }, []);

  // Keep activeXtreamConfig strictly synced with the active primary server from Admin Panel & Storage
  useEffect(() => {
    const syncPrimaryServer = () => {
      try {
        const servers = getStoredServers();
        const settings = getStoredServerSettings();
        const active = servers.find(s => s.id === settings.activeServerId) || servers[0];
        if (active) {
          const cfg = {
            host: active.serverUrl.replace(/\/+$/, ''),
            username: active.username || '',
            password: active.password || '',
            name: active.name || 'سێرڤەری فەرمی NNDD (Free M3U8)'
          };
          setActiveXtreamConfig(prev => {
            if (prev?.host === cfg.host && prev?.username === cfg.username && prev?.password === cfg.password) return prev;
            return cfg;
          });
        }
      } catch(e) {}
    };

    syncPrimaryServer();
    window.addEventListener('storage', syncPrimaryServer);
    window.addEventListener('focus', syncPrimaryServer);
    return () => {
      window.removeEventListener('storage', syncPrimaryServer);
      window.removeEventListener('focus', syncPrimaryServer);
    };
  }, []);

  const [isRefreshingServer, setIsRefreshingServer] = useState(false);
  const [refreshingServerMessage, setRefreshingServerMessage] = useState('');
  const [serverTestResult, setServerTestResult] = useState(null);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverForm, setServerForm] = useState(activeXtreamConfig);

  // Server Selection Mode: 'dedicated' (سێرڤەری دیاریکراو) vs 'auto' (ئۆتۆماتیک)
  const [serverMode, setServerModeState] = useState(() => {
    try {
      return localStorage.getItem('nndd_server_mode') || 
             getStoredServerSettings()?.serverMode || 'dedicated';
    } catch(e) {
      return 'dedicated';
    }
  });

  const setServerMode = (mode) => {
    setServerModeState(mode);
    try {
      localStorage.setItem('nndd_server_mode', mode);
      const srvSettings = getStoredServerSettings();
      saveStoredServerSettings({ 
        ...srvSettings, 
        serverMode: mode, 
        autoFailoverEnabled: mode === 'auto' 
      });
    } catch(e) {}
  };

  const [serverModeToast, setServerModeToast] = useState(null);
  const serverModeToastTimerRef = useRef(null);

  const showServerModeToast = (mode, customMsg = null) => {
    if (serverModeToastTimerRef.current) clearTimeout(serverModeToastTimerRef.current);
    const msg = customMsg || (
      mode === 'auto'
        ? '⚡ دۆخی ئۆتۆماتیک (Auto Switch): ئەپەکە خۆی سێرڤەری ئیشکەر دەدۆزێتەوە و کۆدەکەی دەگۆڕێت'
        : '🔒 دۆخی سێرڤەری دیاریکراو (Dedicated Server): تەنها ئەم سێرڤەرە کاردەکات و ناگۆڕدرێت'
    );
    setServerModeToast({ mode, message: msg });
    serverModeToastTimerRef.current = setTimeout(() => {
      setServerModeToast(null);
    }, 2800);
  };

  const toggleServerMode = () => {
    const nextMode = serverMode === 'dedicated' ? 'auto' : 'dedicated';
    setServerMode(nextMode);
    showServerModeToast(nextMode);
  };

  // Currently playing stream tracking for dynamic OSD badge in Auto Mode
  const [activePlayingStreamUrl, setActivePlayingStreamUrl] = useState('');
  const activeStreamUrlRef = useRef('');

  const [customOsdCode, setCustomOsdCode] = useState(() => {
    try {
      return localStorage.getItem('nndd_custom_osd_server_code') || 
             getStoredServerSettings()?.customOsdCode || '';
    } catch(e) {
      return '';
    }
  });

  useEffect(() => {
    if (activeXtreamConfig) {
      setServerForm(activeXtreamConfig);
    }
  }, [activeXtreamConfig]);

  const handleTestServerConnection = async (targetCfg = null) => {
    const cfg = targetCfg || serverForm;
    if (!cfg.host || !cfg.username || !cfg.password) {
      setServerTestResult({ success: false, message: 'تکایە خانەکان پڕبکەرەوە پێش پشکنین.' });
      return;
    }
    setIsTestingServer(true);
    setServerTestResult(null);
    try {
      const res = await testXtreamConnection({
        serverUrl: cfg.host,
        username: cfg.username,
        password: cfg.password
      });
      if (res.success) {
        setServerTestResult({
          success: true,
          message: `پەیوەندی دروستە! ⚡ خێرایی: ${res.latencyMs || 45}ms • دۆخ: ${res.status || 'چالاک'} • بەسەرچوون: ${res.expDate || 'چالاک'} • ڕێگەپێدراو: ${res.maxConnections || 1} ئامێر`
        });
      } else {
        setServerTestResult({
          success: false,
          message: res.error || 'پەیوەندی سەرکەوتوو نەبوو.'
        });
      }
    } catch(err) {
      setServerTestResult({ success: false, message: err.message });
    } finally {
      setIsTestingServer(false);
    }
  };

  // Background fetch to sync from Supabase or /channels.json on launch (Step 3)
  useEffect(() => {
    let channelSub = null;

    const fetchRemoteChannels = async () => {
      try {
        // 1. Try Supabase first if configured
        const supaChannels = await getSupabaseChannels();
        if (Array.isArray(supaChannels) && supaChannels.length >= CHANNELS_DATA.length) {
          const cachedStr = localStorage.getItem('nndd_cached_channels');
          const newStr = JSON.stringify(supaChannels);
          if (cachedStr !== newStr) {
            setChannels(supaChannels);
            localStorage.setItem('nndd_cached_channels', newStr);
          }
          return;
        }

        // 2. Fallback to channels API URL or /channels.json
        const url = localStorage.getItem('nndd_channels_api_url') || (isCapacitor ? 'https://nndd-tv.vercel.app/channels.json' : '/channels.json');
        const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const cachedStr = localStorage.getItem('nndd_cached_channels');
            const newStr = JSON.stringify(data);
            if (cachedStr !== newStr) {
              setChannels(data);
              localStorage.setItem('nndd_cached_channels', newStr);
            }
          }
        }
      } catch(e) {}
    };

    fetchRemoteChannels();

    // 3. Supabase Realtime channel updates without rebuild (Step 3)
    try {
      channelSub = supabase
        .channel('public:nndd_channels_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nndd_channels' }, async () => {
          const updated = await getSupabaseChannels();
          if (Array.isArray(updated) && updated.length > 0) {
            setChannels(updated);
            localStorage.setItem('nndd_cached_channels', JSON.stringify(updated));
          }
        })
        .subscribe();
    } catch(e) {}

    return () => {
      if (channelSub) {
        try { supabase.removeChannel(channelSub); } catch(e) {}
      }
    };
  }, []);

  // Background Channel Health Checker (Step 3: HEAD / range requests to detect server status)
  useEffect(() => {
    let isCancelled = false;
    const checkChannelsHealth = async () => {
      const pool = [...channels];
      const batchSize = 3;

      for (let i = 0; i < pool.length; i += batchSize) {
        if (isCancelled) break;
        const chunk = pool.slice(i, i + batchSize);

        await Promise.all(chunk.map(async (ch) => {
          if (!ch.url) return;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(ch.url, {
              method: 'HEAD',
              signal: controller.signal,
              headers: { 'Range': 'bytes=0-100' }
            }).catch(() => null);
            clearTimeout(timeoutId);

            if (!isCancelled) {
              const isUp = res && (res.ok || (res.status >= 200 && res.status < 400) || res.status === 405);
              setChannelHealthMap(prev => ({
                ...prev,
                [ch.id]: isUp ? 'online' : 'offline'
              }));
            }
          } catch(e) {
            if (!isCancelled) {
              setChannelHealthMap(prev => ({
                ...prev,
                [ch.id]: 'offline'
              }));
            }
          }
        }));

        // Pacing delay between batches to protect mobile network and WebView thread
        await new Promise(r => setTimeout(r, 600));
      }
    };

    const timer = setTimeout(checkChannelsHealth, 3500);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [channels]);

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

  // Clear Cache & Storage on Server Change & Force Re-Initialization of Video Player
  const applyServerCredentials = async (newConfig) => {
    if (!newConfig.host || !newConfig.username || !newConfig.password) {
      onNotify?.({
        title: 'زانیاری ناتەواوە',
        message: 'تکایە هەموو خانەکانی هۆست، یوزەرنەیم و تێپەڕەوشە پڕبکەرەوە.',
        type: 'error'
      });
      return;
    }

    setIsRefreshingServer(true);
    setRefreshingServerMessage('سڕینەوەی تەواوی کاش و ئامادەکردنی سێرڤەری نوێ...');

    try {
      // 1. Immediately clear any cached channel lists, VOD categories, and player tokens from localStorage
      try {
        localStorage.removeItem('nndd_cached_channels');
        localStorage.removeItem('nndd_cached_vod_series_v3');
        localStorage.removeItem('nndd_cached_vod_series');
        localStorage.removeItem('nndd_cached_vod_movies_v3');
        localStorage.removeItem('nndd_cached_vod_movies');
        localStorage.removeItem('nndd_last_channel_id');
        localStorage.removeItem('nndd_vod_config');
      } catch(e) {}

      // 2. Force Complete Re-Initialization of Video Player on both slots
      disposeSlotController('A');
      disposeSlotController('B');

      [videoRefA.current, videoRefB.current].forEach(v => {
        if (v) {
          try {
            v.pause();
            v.removeAttribute('src');
            v.src = '';
            v.load();
          } catch(e) {}
        }
      });

      switchRequestIdRef.current++;
      setSwitchingChannel(null);
      setPreloadState(null);
      persistentTargetChannelRef.current = null;
      persistentTargetIndexRef.current = null;

      // 3. Save new config to state and storage
      const cleanConfig = {
        host: newConfig.host.trim().replace(/\/+$/, ''),
        username: newConfig.username.trim(),
        password: newConfig.password.trim(),
        name: newConfig.name?.trim() || 'سێرڤەری نوێ'
      };
      setActiveXtreamConfig(cleanConfig);
      localStorage.setItem('nndd_active_xtream_config', JSON.stringify(cleanConfig));
      try {
        localStorage.setItem('nndd_custom_osd_server_code', (customOsdCode || '').trim().toUpperCase());
      } catch(e) {}

      // Synchronize into serverManager stored servers
      try {
        const storedServers = getStoredServers();
        const existingIdx = storedServers.findIndex(s => s.serverUrl === cleanConfig.host);
        if (existingIdx !== -1) {
          storedServers[existingIdx].username = cleanConfig.username;
          storedServers[existingIdx].password = cleanConfig.password;
          storedServers[existingIdx].name = cleanConfig.name;
          storedServers[existingIdx].isPrimary = true;
          storedServers[existingIdx].status = 'active';
        } else {
          storedServers.push({
            id: `srv-xtream-${Date.now()}`,
            name: cleanConfig.name,
            type: 'xtream',
            serverUrl: cleanConfig.host,
            username: cleanConfig.username,
            password: cleanConfig.password,
            status: 'active',
            isPrimary: true,
            channelCount: 0,
            latencyMs: 0,
            createdAt: new Date().toISOString().split('T')[0]
          });
        }
        saveStoredServers(storedServers);
        saveStoredServerSettings({ ...getStoredServerSettings(), activeServerId: storedServers[existingIdx !== -1 ? existingIdx : storedServers.length - 1].id });
      } catch(e) {}

      // 4. Force re-fetch fresh live streams & categories from the new server
      setRefreshingServerMessage('پشکنینی هەژمار لە سێرڤەری نوێ...');

      const authCheck = await testXtreamConnection({
        serverUrl: cleanConfig.host,
        username: cleanConfig.username,
        password: cleanConfig.password
      });

      if (!authCheck.success) {
        throw new Error(authCheck.error || 'پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو. دڵنیابەرەوە لە هۆست و یوزەرنەیم.');
      }

      setRefreshingServerMessage('هاوردەکردنی کەناڵە نوێیەکان لە سێرڤەرەوە...');
      const freshChannels = await importTargetServerChannels(
        {
          serverUrl: cleanConfig.host,
          username: cleanConfig.username,
          password: cleanConfig.password
        },
        (prog) => {
          setRefreshingServerMessage(`هاوردەکردنی کەناڵەکان: ${prog.category} (${prog.current}/${prog.total})`);
        }
      );

      if (freshChannels && freshChannels.length > 0) {
        setChannels(freshChannels);
        localStorage.setItem('nndd_cached_channels', JSON.stringify(freshChannels));
        setSelectedChannel(freshChannels[0]);
        persistentTargetChannelRef.current = freshChannels[0];
        persistentTargetIndexRef.current = 0;

        if (activeTab === 'live') {
          performChannelSwitch(freshChannels[0], true);
        }

        // Also import Movies and Series from this server
        setRefreshingServerMessage('هاوردەکردنی فیلمەکانی 4K و زنجیرەکان لە سێرڤەرەوە...');
        try {
          const freshVod = await importTargetServerVod(
            {
              serverUrl: cleanConfig.host,
              username: cleanConfig.username,
              password: cleanConfig.password
            },
            (prog) => {
              setRefreshingServerMessage(`هاوردەکردنی VOD: ${prog.label}`);
            }
          );
          if (freshVod?.movies?.length > 0) {
            setVodMovies(freshVod.movies);
            try {
              localStorage.setItem('nndd_cached_vod_movies_v3', JSON.stringify(freshVod.movies));
              localStorage.setItem('nndd_cached_vod_movies', JSON.stringify(freshVod.movies));
            } catch(e) {}
          }
          if (freshVod?.series?.length > 0) {
            setVodSeries(freshVod.series);
            try {
              localStorage.setItem('nndd_cached_vod_series_v3', JSON.stringify(freshVod.series));
              localStorage.setItem('nndd_cached_vod_series', JSON.stringify(freshVod.series));
            } catch(e) {}
          }
        } catch(e) {
          console.warn('[VOD Importer] Error importing VOD during server apply:', e);
        }

        onNotify?.({
          title: 'سێرڤەر نوێکرایەوە! 🎉',
          message: `بە سەرکەوتوویی ${freshChannels.length} کەناڵ و بەشی فیلم و زنجیرەکان لە "${cleanConfig.name}" هاوردە کران.`,
          type: 'success'
        });
      } else {
        throw new Error('سێرڤەرەکە پەیوەست بوو بەڵام هیچ کەناڵێک لە هاوپۆلەکاندا نەدۆزرایەوە.');
      }
    } catch(err) {
      onNotify?.({
        title: 'هەڵە لە گۆڕینی سێرڤەر',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsRefreshingServer(false);
      setRefreshingServerMessage('');
    }
  };

  // Server Fingerprinting & Secret OSD Badge Function
  const getServerFingerprint = (channel = null) => {
    // 1. Check custom OSD badge code set from Admin Panel or Settings
    let customOsd = '';
    try {
      customOsd = localStorage.getItem('nndd_custom_osd_server_code') || 
                  getStoredServerSettings()?.customOsdCode || '';
    } catch(e) {}

    if (customOsd && customOsd.trim()) {
      const code = customOsd.trim().toUpperCase();
      return {
        code,
        serverCode: code,
        serverName: activeXtreamConfig?.name || 'Custom Live Stream',
        lineType: '[P]',
        dotColor: 'bg-amber-400',
        isTest: false,
        mode: serverMode
      };
    }

    // 2. DEDICATED SERVER MODE: Strictly display the code of the user-chosen server!
    // ("کۆدی نیشان دراو لەسەر شاشە با کۆدی ئەو سێرفەرە بێت کە هەڵم بژاردوە")
    if (serverMode === 'dedicated') {
      const host = activeXtreamConfig?.host || '';
      const user = activeXtreamConfig?.username || '';
      const badge = detectServerBadge(host, user, host);
      return {
        ...badge,
        mode: 'dedicated'
      };
    }

    // 3. AUTOMATIC DISCOVERY MODE: Dynamically show the code of whichever server actually brought the stream!
    // ("کە کەناڵەکە خۆی سێفەرێک ئەدۆزێتەوە کام سێرفرە هێنایبچێتە سەر هەمان سێرفە بەس کۆدەکەی بگۆرێت")
    const playingUrl = activePlayingStreamUrl || activeStreamUrlRef.current || channel?.url || activeXtreamConfig?.host || '';
    const user = activeXtreamConfig?.username || '';
    const badge = detectServerBadge(playingUrl, user, activeXtreamConfig?.host);
    return {
      ...badge,
      mode: 'auto'
    };
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
  });

  // Auto-switch selected channel when channels change (e.g. Server changed from Admin Panel or Settings)
  useEffect(() => {
    if (channels && channels.length > 0) {
      const currentStillExists = channels.some(c => c.id === selectedChannel?.id);
      if (!currentStillExists) {
        console.info(`[SERVER SYNC] Active channel list updated with ${channels.length} channels. Switching selected channel to #${channels[0]?.number} "${channels[0]?.name}".`);
        setSelectedChannel(channels[0]);
        persistentTargetChannelRef.current = channels[0];
        persistentTargetIndexRef.current = 0;
        if (activeTab === 'live') {
          performChannelSwitch(channels[0], true);
        }
      }
    }
  }, [channels]);

  // JIT Power-On Lazy Auto-Renewal & Real-Time Device Telemetry
  useEffect(() => {
    let isCancelled = false;
    const runPowerOnJitAndTelemetry = async () => {
      try {
        if (currentUser) {
          const renewResult = checkAndExecuteJitAutoRenew(currentUser);
          if (renewResult?.renewed && !isCancelled) {
            onNotify?.({
              title: '⚡ نوێکردنەوەی خۆکاری مانگانە (JIT Auto-Renew)',
              message: renewResult.message,
              type: 'success'
            });
          }
        }

        const publicIp = await fetchClientPublicIp();
        if (!isCancelled) {
          recordDeviceTelemetry({
            userId: currentUser?.id,
            userName: currentUser?.name,
            deviceMac: currentUser?.deviceMac,
            channelName: selectedChannel?.name || 'Rudaw TV HD',
            channelNumber: selectedChannel?.number || 1,
            planTier: currentUser?.planTier || 'free',
            publicIp
          });

          registerOrUpdateDeviceEntry({
            code: getDeviceUniqueCode(),
            ip: publicIp,
            channelName: selectedChannel?.name || 'Rudaw TV HD',
            channelNumber: selectedChannel?.number || 1,
            planTier: 'free'
          });
        }
      } catch(e) {}
    };

    runPowerOnJitAndTelemetry();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  // Telemetry Heartbeat on channel change
  useEffect(() => {
    if (selectedChannel) {
      try {
        recordDeviceTelemetry({
          userId: currentUser?.id,
          userName: currentUser?.name,
          deviceMac: currentUser?.deviceMac,
          channelName: selectedChannel.name,
          channelNumber: selectedChannel.number,
          planTier: currentUser?.planTier || 'free'
        });

        registerOrUpdateDeviceEntry({
          code: getDeviceUniqueCode(),
          channelName: selectedChannel.name,
          channelNumber: selectedChannel.number,
          planTier: 'free'
        });
      } catch(e) {}
    }
  }, [selectedChannel?.id]);

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

  // 1-Minute Dashboard Idle Motion & Screensaver State (Persisted in localStorage for ultra-smooth 60fps GPU morphing)
  const [isDashboardIdle, setIsDashboardIdleState] = useState(() => {
    try {
      return localStorage.getItem('nndd_clock_idle_state') === 'true';
    } catch(e) {
      return false;
    }
  });

  const setIsDashboardIdle = useCallback((val) => {
    setIsDashboardIdleState(prev => {
      const nextVal = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('nndd_clock_idle_state', nextVal ? 'true' : 'false');
      } catch(e) {}
      return nextVal;
    });
  }, []);
  const dashboardIdleTimerRef = useRef(null);

  // 1-Minute Dashboard Idle Motion Listener (Resets on any mouse, touch, or keyboard movement)
  useEffect(() => {
    if (activeTab !== 'dashboard') {
      setIsDashboardIdle(false);
      if (dashboardIdleTimerRef.current) {
        clearTimeout(dashboardIdleTimerRef.current);
        dashboardIdleTimerRef.current = null;
      }
      return;
    }

    const startIdleTimer = () => {
      if (dashboardIdleTimerRef.current) {
        clearTimeout(dashboardIdleTimerRef.current);
      }
      dashboardIdleTimerRef.current = setTimeout(() => {
        setIsDashboardIdle(true);
      }, 60000); // 1 minute (60 seconds)
    };

    const handleUserActivity = () => {
      setIsDashboardIdle(prev => {
        if (prev) return false;
        return prev;
      });
      startIdleTimer();
    };

    // Start initial 60-second idle timer
    startIdleTimer();

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('mousedown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('touchmove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('wheel', handleUserActivity, { passive: true });

    return () => {
      if (dashboardIdleTimerRef.current) {
        clearTimeout(dashboardIdleTimerRef.current);
        dashboardIdleTimerRef.current = null;
      }
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('touchmove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('wheel', handleUserActivity);
    };
  }, [activeTab]);

  const [isBackupStreamActive, setIsBackupStreamActive] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const morphTimerRef = useRef(null);
  const [targetChannelBanner, setTargetChannelBanner] = useState(null);
  const [channelCategory, setChannelCategory] = useState('هەموو');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // dashboard starts muted
  const [volume, setVolume] = useState(80);

  // Enforce strictly muted audio on Dashboard and non-live tabs
  useEffect(() => {
    const shouldMute = activeTab !== 'live' || isMuted;
    [videoRefA.current, videoRefB.current].forEach(v => {
      if (v) {
        v.muted = shouldMute;
        if (shouldMute) {
          v.volume = 0;
        } else {
          v.volume = volume / 100;
        }
      }
    });
  }, [activeTab, isMuted, volume]);

  // Multi-Tier Device Intelligence Context (Phone / Tablet / TV - Step 1)
  const deviceCtx = useDevice();
  const isPhone = deviceCtx.isPhone;
  const isTablet = deviceCtx.isTablet;
  const isTv = deviceCtx.isTv;
  const isMobileDevice = isPhone || isTablet;
  const isPortrait = deviceCtx.isPortrait;
  const [isTabletFullscreen, setIsTabletFullscreen] = useState(false);

  // Standard Aspect Ratio Modes for Live TV & Dashboard
  const ASPECT_RATIO_MODES = [
    { id: 'fit', label: 'فیت (Fit - ڕەسەن)', desc: 'ڕەهەندی بنەڕەتی' },
    { id: 'stretch', label: 'سترێچ (Stretch - پڕکراوە)', desc: 'پڕکردنەوەی تەواوی شاشە' },
    { id: 'zoom', label: 'زووم (Zoom - گەورەکراو)', desc: 'گەورەکردنی ناوەڕاست' },
    { id: '4:3', label: 'کلاسیک (4:3 Classic)', desc: 'تەلەفزیۆنی کلاسیک' }
  ];

  const [liveAspectRatioMode, setLiveAspectRatioMode] = useState(() => {
    try {
      return localStorage.getItem('nndd_live_aspect_ratio') || 'fit';
    } catch(e) {
      return 'fit';
    }
  });
  const [aspectRatioToast, setAspectRatioToast] = useState(null);
  const aspectRatioToastTimerRef = useRef(null);

  const cycleAspectRatio = () => {
    const currentIndex = ASPECT_RATIO_MODES.findIndex(m => m.id === liveAspectRatioMode);
    const nextIndex = (currentIndex + 1) % ASPECT_RATIO_MODES.length;
    const nextMode = ASPECT_RATIO_MODES[nextIndex];

    setLiveAspectRatioMode(nextMode.id);
    try {
      localStorage.setItem('nndd_live_aspect_ratio', nextMode.id);
    } catch(e) {}

    if (aspectRatioToastTimerRef.current) {
      clearTimeout(aspectRatioToastTimerRef.current);
    }
    setAspectRatioToast(nextMode);
    aspectRatioToastTimerRef.current = setTimeout(() => {
      setAspectRatioToast(null);
      aspectRatioToastTimerRef.current = null;
    }, 2200);
  };

  const getVideoAspectClass = () => {
    if (activeTab === 'dashboard') {
      return 'w-full h-full object-fill [object-fit:fill]';
    }
    switch (liveAspectRatioMode) {
      case 'stretch':
        return 'w-full h-full object-fill [object-fit:fill]';
      case 'zoom':
        return 'w-full h-full object-cover';
      case '4:3':
        return 'aspect-[4/3] max-w-[133.33vh] max-h-full mx-auto object-contain';
      case 'fit':
      default:
        return 'object-contain';
    }
  };

  useEffect(() => {
    if (isPhone) {
      if (activeTab === 'live') {
        try {
          if (window.screen?.orientation?.lock) {
            window.screen.orientation.lock('landscape').catch(() => {});
          }
        } catch (e) {}
      } else {
        try {
          if (window.screen?.orientation?.unlock) {
            window.screen.orientation.unlock();
          }
        } catch (e) {}
      }
    }
  }, [activeTab, isPhone]);

  // Picture-in-Picture Support (Phone / Tablet / TV)
  const togglePip = async (e) => {
    if (e) e.stopPropagation();
    const video = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch(err) {
      console.warn('PiP error:', err);
    }
  };

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

  // Video Scaling Fit Mode: 'contain' (Full Picture Fit, Nothing Cropped)
  const [videoFitMode, setVideoFitMode] = useState('contain');
  const [showWelcomeTransition, setShowWelcomeTransition] = useState(false);
  // 5-Second Section Welcome Animation State (User requirement: بەخێرهاتنی ٥ چرکەیی بۆ بەشەکان: زنجیرە، فلیم، ستریم)
  const [sectionWelcome, setSectionWelcome] = useState(null);
  const welcomeTimerRef = useRef(null);

  // Sort & Edit PIN Protection (0000)
  const [isEditPinModalOpen, setIsEditPinModalOpen] = useState(false);
  const [pendingEditAction, setPendingEditAction] = useState(null); // 'sort' | 'edit'
  const [editPinInput, setEditPinInput] = useState('');
  const [editPinError, setEditPinError] = useState('');
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);

  // Device Binding & Secret Hardware Serial
  const [deviceIdentity, setDeviceIdentity] = useState(() => getOrCreateDeviceIdentity());
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  // Sorting, Favorites & Parental Lock State
  const [sortBy, setSortBy] = useState('number'); // 'number' | 'name' | 'favorites'
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [parentalPinModalOpen, setParentalPinModalOpen] = useState(false);
  const [pendingLockedChannel, setPendingLockedChannel] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Direct Numeric Keypad Zapping (0-9) on TV Remote (User requirement: گۆڕینی کەناڵ بە ژمارەکانی ڕیمۆت)
  const [numericZapBuffer, setNumericZapBuffer] = useState('');
  const numericZapTimerRef = useRef(null);
  
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
  const [showCategoryIconsBar, setShowCategoryIconsBar] = useState(false);

  // 5-Second Channel Drawer Preload & Auto-Switch State
  const [drawerPreloadTarget, setDrawerPreloadTarget] = useState(null);
  const [drawerPreloadCountdown, setDrawerPreloadCountdown] = useState(null);
  const drawerCountdownIntervalRef = useRef(null);
  const drawerAutoSwitchTimerRef = useRef(null);
  const drawerDebounceTimerRef = useRef(null);
  const isDrawerInitialOpenRef = useRef(true);

  const clearDrawerCountdown = useCallback(() => {
    if (drawerCountdownIntervalRef.current) {
      clearInterval(drawerCountdownIntervalRef.current);
      drawerCountdownIntervalRef.current = null;
    }
    if (drawerAutoSwitchTimerRef.current) {
      clearTimeout(drawerAutoSwitchTimerRef.current);
      drawerAutoSwitchTimerRef.current = null;
    }
    if (drawerDebounceTimerRef.current) {
      clearTimeout(drawerDebounceTimerRef.current);
      drawerDebounceTimerRef.current = null;
    }
    setDrawerPreloadCountdown(null);
    setDrawerPreloadTarget(null);
  }, []);

  // Alerts & Search
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [language, setLanguage] = useState(() => getSavedLanguage());
  const isRtl = language !== 'en';
  const t = (key, params) => translate(language, key, params);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    saveLanguage(newLang);
    if (newLang === 'ar') setKeyboardLang('ar');
    else if (newLang === 'en') setKeyboardLang('en');
    else setKeyboardLang('ku');
  };

  useEffect(() => {
    const handleExtLang = (e) => {
      if (e.detail?.lang && e.detail.lang !== language) {
        setLanguage(e.detail.lang);
      }
    };
    window.addEventListener('nndd_language_changed', handleExtLang);
    return () => window.removeEventListener('nndd_language_changed', handleExtLang);
  }, [language]);

  const [searchQuery, setSearchQuery] = useState('');

  // 🔴 Red Key: Category Selector Popup State
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 🟢 Green Key: On-Screen Mini Virtual Keyboard State
  const [showSearchKeyboard, setShowSearchKeyboard] = useState(false);
  const [keyboardFocusedIndex, setKeyboardFocusedIndex] = useState(0);
  const [keyboardLang, setKeyboardLang] = useState(() => (getSavedLanguage() === 'ar' ? 'ar' : getSavedLanguage() === 'en' ? 'en' : 'ku'));

  // 🔵 Blue Key: Channel Filter Mode State ('all' | 'fav' | '4k' | 'kurdish')
  const [channelFilterMode, setChannelFilterMode] = useState('all');

  // Unified Remote Color Toast Notification
  const [colorToast, setColorToast] = useState(null);
  const colorToastTimerRef = useRef(null);

  const showColorToast = (color, message) => {
    if (colorToastTimerRef.current) clearTimeout(colorToastTimerRef.current);
    setColorToast({ color, message });
    colorToastTimerRef.current = setTimeout(() => {
      setColorToast(null);
      colorToastTimerRef.current = null;
    }, 2000);
  };

  const categories = ['هەموو', 'ڕووداو', 'هەواڵەکان کوردی', 'کوردی', 'ئاینی', 'منداڵان', 'کەناڵەکانی تر'];

  const getCategoryDisplayName = (cat) => {
    if (!cat) return '';
    const trimmed = cat.trim();
    if (trimmed === 'هەموو' || trimmed.toLowerCase() === 'all') return t('catAll');
    if (trimmed === 'ڕووداو' || trimmed.toLowerCase() === 'rudaw') return t('catRudaw');
    if (trimmed === 'هەواڵەکان کوردی' || trimmed.toLowerCase() === 'kurdish news') return t('catKurdishNews');
    if (trimmed === 'کوردی' || trimmed.toLowerCase() === 'kurdish') return t('catKurdish');
    if (trimmed === 'ئاینی' || trimmed.toLowerCase() === 'religious' || trimmed.toLowerCase() === 'islamic') return t('catReligious');
    if (trimmed === 'منداڵان' || trimmed.toLowerCase() === 'kids' || trimmed.toLowerCase() === 'children') return t('catKids');
    if (trimmed === 'وەرزش' || trimmed.toLowerCase() === 'sports') return t('catSports');
    if (trimmed === 'سینەما' || trimmed.toLowerCase() === 'movies') return t('catMovies');
    if (trimmed === 'کەناڵەکانی تر' || trimmed.toLowerCase() === 'others' || trimmed.toLowerCase() === 'other') return t('catOthers');
    return cat;
  };

  const EN_KEYBOARD_KEYS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', 'SPACE', 'BACK', 'CLEAR', 'DONE'
  ];

  const KU_KEYBOARD_KEYS = [
    'ئ', 'ا', 'ب', 'پ', 'ت', 'ج', 'چ', 'ح', 'خ', 'د',
    'ر', 'ڕ', 'ز', 'ژ', 'س', 'ش', 'ع', 'غ', 'ف', 'ڤ',
    'ق', 'ک', 'گ', 'ل', 'ڵ', 'م', 'ن', 'ه', 'و', 'ۆ',
    'ی', 'ێ', '0', '1', '2', '3', '4', '5', '6', '7',
    '8', '9', 'SPACE', 'BACK', 'CLEAR', 'DONE'
  ];

  const AR_KEYBOARD_KEYS = [
    'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
    'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
    'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ء', 'ئ',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'SPACE', 'BACK', 'CLEAR', 'DONE'
  ];

  const dynamicCategories = useMemo(() => {
    const presentCats = new Set(channels.filter(c => !c.isHidden).map(c => c.category?.trim()).filter(Boolean));
    const sorted = ['هەموو'];
    const PREFERRED_ORDER = ['ڕووداو', 'هەواڵەکان کوردی', 'کوردی', 'beIN Sports', 'وەرزش', 'MBC', 'OSN', 'Shahid VIP', 'عێراق', 'منداڵان', 'ئاینی', 'کەناڵەکانی تر'];
    
    PREFERRED_ORDER.forEach(cat => {
      if (presentCats.has(cat)) {
        sorted.push(cat);
        presentCats.delete(cat);
      }
    });
    presentCats.forEach(cat => sorted.push(cat));
    return sorted;
  }, [channels]);

  // 🔴 Red Key: Cycle Category
  const cycleCategory = () => {
    setShowChannelDrawer(true);
    const currIdx = dynamicCategories.indexOf(channelCategory);
    const nextCat = dynamicCategories[(currIdx + 1) % dynamicCategories.length];
    setChannelCategory(nextCat);
    showColorToast('red', `🔴 کەتەگۆری: ${nextCat}`);
  };

  const toggleCategorySelector = () => {
    setShowChannelDrawer(true);
    setShowCategoryModal(prev => {
      const next = !prev;
      if (next) {
        setShowSearchKeyboard(false);
        showColorToast('red', '🔴 هەڵبژاردنی کەتەگۆری (Categories)');
      }
      return next;
    });
  };

  // 🟢 Green Key: Toggle Search & Mini Keyboard
  const toggleSearchKeyboard = () => {
    setShowChannelDrawer(true);
    setShowSearchKeyboard(prev => {
      const next = !prev;
      if (next) {
        setShowCategoryModal(false);
        showColorToast('green', '🟢 گەڕان بەپێی ناوی کەناڵ (Search)');
      }
      return next;
    });
  };

  // 🔵 Blue Key: Cycle Channel Filter
  const cycleChannelFilter = () => {
    const filterModes = [
      { id: 'all', label: 'هەموو کەناڵەکان (All Channels)' },
      { id: 'fav', label: 'دڵخوازەکان (Favorites)' },
      { id: '4k', label: 'کەناڵە 4K و باڵاکان (4K UHD)' },
      { id: 'kurdish', label: 'کەناڵە کوردییەکان (Kurdish)' }
    ];
    const currIdx = filterModes.findIndex(m => m.id === channelFilterMode);
    const nextMode = filterModes[(currIdx + 1) % filterModes.length];
    setChannelFilterMode(nextMode.id);
    if (nextMode.id === 'fav') {
      setOnlyFavorites(true);
    } else {
      setOnlyFavorites(false);
    }
    showColorToast('blue', `🔵 فلتەر: ${nextMode.label}`);
  };

  const filteredChannels = useMemo(() => {
    return channels.filter(c => !c.isHidden).filter(c => {
      const matchesCat = channelCategory === 'هەموو' || (c.category && c.category.includes(channelCategory));
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
                           c.name.toLowerCase().includes(q) || 
                           (c.nameEn && c.nameEn.toLowerCase().includes(q)) || 
                           c.number.toString().includes(q);
      const isFav = favoriteChannelIds.includes(c.id) || c.isFavorite;

      let matchesFilter = true;
      if (channelFilterMode === 'fav') {
        matchesFilter = isFav;
      } else if (channelFilterMode === '4k') {
        matchesFilter = Boolean(c.is4K || (c.quality && c.quality.toLowerCase().includes('4k')) || c.name.toLowerCase().includes('4k') || c.name.toLowerCase().includes('uhd'));
      } else if (channelFilterMode === 'kurdish') {
        matchesFilter = Boolean((c.category && c.category.toLowerCase().includes('kurd')) || c.name.toLowerCase().includes('kurd') || c.name.toLowerCase().includes('rudaw') || c.name.toLowerCase().includes('k24'));
      }

      const matchesFav = !onlyFavorites || isFav;
      return matchesCat && matchesQuery && matchesFilter && matchesFav;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'favorites') {
        const aFav = favoriteChannelIds.includes(a.id) || a.isFavorite;
        const bFav = favoriteChannelIds.includes(b.id) || b.isFavorite;
        return (bFav ? 1 : 0) - (aFav ? 1 : 0);
      }
      return a.number - b.number;
    });
  }, [channels, channelCategory, searchQuery, favoriteChannelIds, onlyFavorites, sortBy, channelFilterMode]);

  // When drawer opens, focus and auto-scroll to the currently playing channel (only on initial open)
  const wasDrawerOpenRef = useRef(false);
  useEffect(() => {
    if (showChannelDrawer && !wasDrawerOpenRef.current) {
      wasDrawerOpenRef.current = true;
      isDrawerInitialOpenRef.current = true;
      const idx = filteredChannels.findIndex(c => c.id === selectedChannel?.id);
      const targetIdx = idx !== -1 ? idx : 0;
      setDrawerFocusedIndex(targetIdx);
      setTimeout(() => {
        drawerItemRefs.current[targetIdx]?.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 50);
    } else if (!showChannelDrawer) {
      wasDrawerOpenRef.current = false;
      isDrawerInitialOpenRef.current = true;
      clearDrawerCountdown();
    }
  }, [showChannelDrawer, clearDrawerCountdown, filteredChannels, selectedChannel?.id]);

  // 5-Second Channel Drawer Auto-Preload & Switch (Smart Preview on Focus)
  useEffect(() => {
    if (!showChannelDrawer || activeTab !== 'live') {
      clearDrawerCountdown();
      isDrawerInitialOpenRef.current = true;
      return;
    }

    // Skip on initial drawer open so active playing channel isn't redundantly triggered
    if (isDrawerInitialOpenRef.current) {
      isDrawerInitialOpenRef.current = false;
      return;
    }

    const target = filteredChannels[drawerFocusedIndex];
    if (!target) return;

    clearDrawerCountdown();

    // If currently playing or locked with PIN, don't auto-switch
    if (target.id === selectedChannel?.id || target.isLocked) {
      return;
    }

    // 350ms debounce while user is actively scrolling through channels in drawer
    drawerDebounceTimerRef.current = setTimeout(() => {
      drawerDebounceTimerRef.current = null;
      setDrawerPreloadTarget(target);
      setDrawerPreloadCountdown(5);

      // Perform seamless channel switch with Next Channel HUD and event-driven first-frame switch
      performChannelSwitch(target, false);

      // 1-second countdown ticker for drawer item badge
      let remaining = 5;
      drawerCountdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setDrawerPreloadCountdown(remaining);
        } else {
          if (drawerCountdownIntervalRef.current) {
            clearInterval(drawerCountdownIntervalRef.current);
            drawerCountdownIntervalRef.current = null;
          }
        }
      }, 1000);
    }, 350);

    return () => {
      clearDrawerCountdown();
    };
  }, [drawerFocusedIndex, showChannelDrawer, activeTab, filteredChannels, selectedChannel?.id, activeSlot, clearDrawerCountdown]);

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


  // User Plan & Tier Management (Free Live TV by default, Pro/Pro+/Ultra for VOD & Series)
  const [activationCodeInput, setActivationCodeInput] = useState('');
  const [userPlanTier, setUserPlanTier] = useState(() => {
    try {
      const stored = localStorage.getItem('nndd_user_plan_tier');
      if (stored) return stored;
    } catch(e) {}
    return currentUser?.planTier || (currentUser?.subPlan?.toLowerCase().includes('ultra') ? 'ultra' : currentUser?.subPlan?.toLowerCase().includes('pro') ? 'pro' : 'free');
  });

  const [userPlanTitle, setUserPlanTitle] = useState(() => {
    try {
      const stored = localStorage.getItem('nndd_user_plan_title');
      if (stored) return stored;
    } catch(e) {}
    return currentUser?.subPlan || 'بێبەرامبەر (Free)';
  });

  const [subscriptionDaysRemaining, setSubscriptionDaysRemaining] = useState(() => {
    try {
      const stored = localStorage.getItem('nndd_sub_days');
      if (stored) return parseInt(stored, 10);
    } catch(e) {}
    return 3650;
  });

  // Full VOD & Movies access open for all users during testing & server evaluation
  const isProOrAbove = true;
  const [selectedPlayerEngine, setSelectedPlayerEngine] = useState('Hls.js Engine');
  const [activeFontId, setActiveFontId] = useState(() => getCurrentFont().id);
  const [trailerModalItem, setTrailerModalItem] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(null);

  // In-App Auto Update Checker
  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.version && data.version !== '2.3.0') {
          setUpdateAvailable(data);
        }
      })
      .catch(() => {});
  }, []);

  // Picture-in-Picture (PiP) for Live TV
  const togglePictureInPicture = async () => {
    const video = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('[PiP] Error toggling Picture-in-Picture:', err);
    }
  };

  const handleTvFontChange = (fontId) => {
    setActiveFontId(fontId);
    const font = applyFontToDocument(fontId);
    onNotify?.({
      title: 'فۆنتی شاشە گۆڕدرا',
      message: `فۆنت نوێکرایەوە بۆ: ${font.kurdishName}.`,
      type: 'success'
    });
  };

  // Fetch remote VOD content from /vod_content.json (Verified Free Content)
  useEffect(() => {
    const fetchRemoteVod = async () => {
      try {
        const res = await fetch('/vod_content.json', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.series) && data.series.length > 0) {
            setVodSeries(data.series);
            try {
              localStorage.setItem('nndd_cached_vod_series_v3', JSON.stringify(data.series));
              localStorage.setItem('nndd_cached_vod_series', JSON.stringify(data.series));
            } catch(e){}
          }
          if (data && Array.isArray(data.movies) && data.movies.length > 0) {
            setVodMovies(data.movies);
            try {
              localStorage.setItem('nndd_cached_vod_movies_v3', JSON.stringify(data.movies));
              localStorage.setItem('nndd_cached_vod_movies', JSON.stringify(data.movies));
            } catch(e){}
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

  // Dedicated Cinema VOD Player Engine (100% Isolated from Live TV)
  const [cinemaSession, setCinemaSession] = useState(null); // { item, episode, isSeries, title, streamUrl, resumeTime }


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
  const [isFetchingEpisodes, setIsFetchingEpisodes] = useState(false);

  // Dynamic Series Episode Fetcher from Xtream Codes API
  useEffect(() => {
    if (
      selectedVodItem && 
      selectedVodType === 'series' && 
      selectedVodItem.seriesId && 
      (!selectedVodItem.episodes || selectedVodItem.episodes.length === 0)
    ) {
      let isMounted = true;
      setIsFetchingEpisodes(true);
      fetchSeriesEpisodes(activeXtreamConfig, selectedVodItem.seriesId)
        .then(res => {
          if (!isMounted) return;
          setIsFetchingEpisodes(false);
          if (res.success && res.episodes?.length > 0) {
            setSelectedVodItem(prev => prev ? { ...prev, episodes: res.episodes } : null);
          }
        })
        .catch(() => {
          if (isMounted) setIsFetchingEpisodes(false);
        });
      return () => { isMounted = false; };
    }
  }, [selectedVodItem?.id, selectedVodType, activeXtreamConfig]);

  const ITEMS_PER_VOD_PAGE = 50;
  const [seriesCurrentPage, setSeriesCurrentPage] = useState(1);
  const [moviesCurrentPage, setMoviesCurrentPage] = useState(1);

  // Dynamic Rich Categories (Kurdish, Arabic, Global, Netflix, Disney+, etc.)
  const seriesCategories = useMemo(() => {
    const cats = new Set();
    let hasKurd = false;
    visibleSeries.forEach(s => {
      const c = (s.category || s.genre || '').trim();
      if (c) {
        if (c === 'کوردی' || c.toLowerCase().includes('kurd')) {
          hasKurd = true;
        } else {
          cats.add(c);
        }
      }
    });
    return ['all', ...(hasKurd ? ['کوردی'] : []), ...Array.from(cats)];
  }, [visibleSeries]);

  const movieCategories = useMemo(() => {
    const cats = new Set();
    let hasKurd = false;
    visibleMovies.forEach(m => {
      const c = (m.category || m.genre || '').trim();
      if (c) {
        if (c === 'کوردی' || c.toLowerCase().includes('kurd')) {
          hasKurd = true;
        } else {
          cats.add(c);
        }
      }
    });
    return ['all', ...(hasKurd ? ['کوردی'] : []), ...Array.from(cats)];
  }, [visibleMovies]);

  const filteredSeries = useMemo(() => {
    if (seriesCategoryFilter === 'all') return visibleSeries;
    return visibleSeries.filter(s => {
      const c = (s.category || s.genre || '').trim();
      return c === seriesCategoryFilter;
    });
  }, [visibleSeries, seriesCategoryFilter]);

  const filteredMovies = useMemo(() => {
    if (moviesCategoryFilter === 'all') return visibleMovies;
    return visibleMovies.filter(m => {
      const c = (m.category || m.genre || '').trim();
      return c === moviesCategoryFilter;
    });
  }, [visibleMovies, moviesCategoryFilter]);

  // Reset pagination to page 1 on category filter change
  useEffect(() => {
    setSeriesCurrentPage(1);
    setVodFocusedIndex(0);
    seriesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [seriesCategoryFilter]);

  useEffect(() => {
    setMoviesCurrentPage(1);
    setVodFocusedIndex(0);
    moviesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [moviesCategoryFilter]);

  const totalSeriesPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredSeries.length / ITEMS_PER_VOD_PAGE));
  }, [filteredSeries.length]);

  const totalMoviesPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredMovies.length / ITEMS_PER_VOD_PAGE));
  }, [filteredMovies.length]);

  const paginatedSeries = useMemo(() => {
    const start = (seriesCurrentPage - 1) * ITEMS_PER_VOD_PAGE;
    return filteredSeries.slice(start, start + ITEMS_PER_VOD_PAGE);
  }, [filteredSeries, seriesCurrentPage]);

  const paginatedMovies = useMemo(() => {
    const start = (moviesCurrentPage - 1) * ITEMS_PER_VOD_PAGE;
    return filteredMovies.slice(start, start + ITEMS_PER_VOD_PAGE);
  }, [filteredMovies, moviesCurrentPage]);

  // Auto-scroll VOD card into view when focused (via remote control, keyboard or touch)
  useEffect(() => {
    if (activeTab === 'series') {
      const el = vodSeriesCardRefs.current[vodFocusedIndex];
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    } else if (activeTab === 'movies') {
      const el = vodMovieCardRefs.current[vodFocusedIndex];
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    }
  }, [vodFocusedIndex, activeTab]);


  // Time updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic Landscape Lock Request for TV / Fullscreen viewing
  useEffect(() => {
    try {
      if (screen?.orientation?.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Show Channel Zap Banner for the target channel (default 5s)
  const triggerZapBanner = (channelToDisplay = null, duration = 5000) => {
    if (zapTimerRef.current) {
      clearTimeout(zapTimerRef.current);
    }
    if (channelToDisplay && typeof channelToDisplay === 'object') {
      setTargetChannelBanner(channelToDisplay);
    } else if (typeof channelToDisplay === 'number') {
      duration = channelToDisplay;
    }
    setIsZapBannerVisible(true);
    zapTimerRef.current = setTimeout(() => {
      setIsZapBannerVisible(false);
    }, duration);
  };

  // Raw MPEG-TS Stream detector
  const isRawTsStream = (url) => {
    if (!url) return false;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return cleanUrl.endsWith('.ts') || url.toLowerCase().includes('extension=ts');
  };

  const getNextAutoStreamCandidate = (channel, currentStreamUrl) => {
    if (!channel) return '';
    if (channel.backupUrl && channel.backupUrl !== currentStreamUrl) {
      return channel.backupUrl;
    }
    if (channel.url && channel.url !== currentStreamUrl) {
      return channel.url;
    }
    return '';
  };

  // Resolve optimal stream URL (Xtream Codes: prioritize .ts over .m3u8 for ultra-fast startup)
  const getOptimalStreamUrl = (channel, isBackup = false) => {
    if (!channel) return '';
    let streamUrl = isBackup ? (channel.backupUrl || channel.url) : channel.url;
    if (!streamUrl) return '';

    // If live channel has Xtream Codes pattern and mpegts is supported, prefer raw MPEG-TS (.ts)
    if (streamUrl.includes('/live/') && streamUrl.includes('.m3u8') && mpegts.isSupported()) {
      streamUrl = streamUrl.replace(/\.m3u8(\?.*)?$/i, '.ts$1');
    }
    return streamUrl;
  };

  // Safe Play Helper to prevent uncaught AbortError promises during rapid switching
  const safePlayVideo = (video) => {
    if (!video) return;
    const p = video.play();
    if (p !== undefined) {
      p.catch(() => {});
    }
  };

  // Thorough Controller & Media Disposal to prevent memory leaks, lingering audio, and codec exhaustion
  const disposeSlotController = (slot) => {
    const ctrl = controllersRef.current[slot];
    if (!ctrl) return;

    if (ctrl.watchdog) {
      clearTimeout(ctrl.watchdog);
      ctrl.watchdog = null;
    }
    if (ctrl.abortController) {
      try { ctrl.abortController.abort(); } catch(e) {}
      ctrl.abortController = null;
    }
    if (ctrl.hls) {
      try {
        ctrl.hls.stopLoad();
        ctrl.hls.detachMedia();
        ctrl.hls.destroy();
      } catch(e) {}
      ctrl.hls = null;
    }
    if (ctrl.mpegts) {
      try {
        ctrl.mpegts.pause();
        ctrl.mpegts.unload();
        ctrl.mpegts.detachMediaElement();
        ctrl.mpegts.destroy();
      } catch(e) {}
      ctrl.mpegts = null;
    }

    const video = slot === 'A' ? videoRefA.current : videoRefB.current;
    if (video) {
      try {
        video.onplaying = null;
        video.onloadeddata = null;
        video.oncanplay = null;
        video.ontimeupdate = null;
        video.onerror = null;
        video.onwaiting = null;
        video.onstalled = null;
        video.pause();
        video.removeAttribute('src');
        video.src = '';
        video.load();
      } catch(e) {}
    }
    ctrl.reqId = 0;
    ctrl.url = '';
  };

  // Start Player Engine on a Designated Slot ('A' or 'B')
  const startPlayerForSlot = (slot, channel, reqId, isBackup = false, timeoutMs = 8000, onReadyCallback = null) => {
    if (!channel) return;
    if (switchRequestIdRef.current !== reqId) return;

    const video = slot === 'A' ? videoRefA.current : videoRefB.current;
    if (!video) return;

    const ctrl = controllersRef.current[slot];
    // Dispose previous instance on this specific slot before re-attaching
    disposeSlotController(slot);

    ctrl.reqId = reqId;

    // Background preloader is strictly muted to prevent dual-audio
    const isBackgroundPreload = Boolean(onReadyCallback);
    video.muted = isBackgroundPreload ? true : isMuted;
    video.volume = isBackgroundPreload ? 0 : (isMuted ? 0 : volume / 100);

    const streamUrl = getOptimalStreamUrl(channel, isBackup);
    ctrl.url = streamUrl;

    // Multi-Server Auto Failover & Dynamic Watchdog
    const failoverToBackup = (reason = 'error') => {
      if (switchRequestIdRef.current !== reqId) return;

      // RULE 1: DEDICATED SERVER MODE
      // "ئەگەر کەناڵی نەهێنا لەسەر ئەو سێفەرە ئەوە کەناڵەکە سێرفەری مەگۆرە لەسەر سێرفەرێک بیهێنێ - با لەسەر سێرفەری دیاری کراو بێت"
      if (serverMode === 'dedicated') {
        console.info(`[DEDICATED MODE (${reason})] Channel error on #${channel.number}. Staying strictly on dedicated server.`);
        if (!isBackgroundPreload) {
          setIsStreamLoading(false);
          setIsChannelOffline(true);
        }
        return;
      }

      // RULE 2: AUTOMATIC DISCOVERY MODE
      // "کە کەناڵەکە خۆی سێفەرێک ئەدۆزێتەوە کام سێرفرە هێنایبچێتە سەر هەمان سێرفە بەس کۆدەکەی بگۆرێت . بەڵام زۆر خێرا روو بدات"
      const candidateStream = getNextAutoStreamCandidate(channel, streamUrl);
      if (candidateStream && candidateStream !== streamUrl && !isBackup) {
        console.info(`[AUTO DISCOVERY FAST FAILOVER (${reason})] Trying alternative candidate stream for #${channel.number}: ${candidateStream}`);
        setIsBackupStreamActive(true);
        startPlayerForSlot(slot, { ...channel, backupUrl: candidateStream }, reqId, true, 2200, onReadyCallback);
      } else {
        if (!isBackgroundPreload) {
          setIsStreamLoading(false);
          setIsChannelOffline(true);
        }
      }
    };

    // Watchdog timer (only for active playing mode, not background preloads)
    // In Auto Mode: 2200ms ultra-fast watchdog; in Dedicated Mode: standard timeout
    const effectiveTimeoutMs = serverMode === 'auto' ? Math.min(timeoutMs || 2200, 2200) : timeoutMs;
    if (effectiveTimeoutMs > 0 && !isBackgroundPreload) {
      ctrl.watchdog = setTimeout(() => {
        if (switchRequestIdRef.current !== reqId) return;
        console.warn(`[WATCHDOG ${effectiveTimeoutMs}ms TIMEOUT] Stream did not start playing on slot ${slot} for #${channel.number}`);
        failoverToBackup('timeout');
      }, effectiveTimeoutMs);
    }

    // First Frame Rendered Detection (Event-Driven)
    let firstFrameFired = false;
    const notifyFirstFrameRendered = () => {
      if (firstFrameFired || switchRequestIdRef.current !== reqId) return;
      firstFrameFired = true;

      // Update active stream URL so OSD badge dynamically detects this server in Auto Mode
      setActivePlayingStreamUrl(streamUrl);
      activeStreamUrlRef.current = streamUrl;

      if (ctrl.watchdog) {
        clearTimeout(ctrl.watchdog);
        ctrl.watchdog = null;
      }

      if (onReadyCallback) {
        onReadyCallback();
      } else {
        setIsStreamLoading(false);
        setIsChannelOffline(false);
      }
    };

    // Precise first frame hook: requestVideoFrameCallback when supported
    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(() => {
        notifyFirstFrameRendered();
      });
    }

    video.onplaying = () => {
      notifyFirstFrameRendered();
    };

    video.oncanplay = () => {
      notifyFirstFrameRendered();
    };

    video.onloadeddata = () => {
      notifyFirstFrameRendered();
    };

    video.ontimeupdate = () => {
      if (video.currentTime > 0.01) {
        notifyFirstFrameRendered();
      }
    };

    // 1. RAW MPEG-TS via mpegts.js (MSE) — Optimized for smooth, stutter-free live streaming
    if (isRawTsStream(streamUrl) && mpegts.isSupported()) {
      try {
        const player = mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: streamUrl
        }, {
          enableWorker: true,
          lazyLoad: false,
          enableStashBuffer: true, // Enable stash buffer to prevent frame drops on network jitter
          stashInitialSize: 384 * 1024, // 384KB buffer delivers stable continuous playback
          autoCleanupSourceBuffer: true,
          autoCleanupMaxBackwardDuration: 20,
          autoCleanupMinBackwardDuration: 6,
          liveBufferLatencyChasing: false, // Disabling aggressive latency chasing stops continuous micro-stuttering
          liveSync: true
        });

        ctrl.mpegts = player;
        player.attachMediaElement(video);
        player.load();
        player.play().catch(() => {});

        player.on(mpegts.Events.ERROR, () => {
          failoverToBackup('mpegts_error');
        });
        return;
      } catch (err) {
        console.warn('[mpegts] Error initializing player, falling back to HLS:', err);
      }
    }

    // 2. HLS via Hls.js — Optimized for rock-solid IPTV streaming without cutting out
    if (Hls.isSupported() && streamUrl && (streamUrl.includes('.m3u8') || !isRawTsStream(streamUrl))) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 20, // 20s buffer absorbs Wi-Fi/network dips without freezing
        maxMaxBufferLength: 40,
        backBufferLength: 20,
        startFragPrefetch: true,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 12000,
        fragLoadingMaxRetry: 4,
        fragLoadingRetryDelay: 1000,
        startLevel: -1, // Adaptive quality starting at highest parsed level
        capLevelToPlayerSize: false, // Don't restrict full 1080p/4K resolution
        liveSyncDurationCount: 3, // Safe distance of 3 segments prevents edge-starvation
        liveMaxLatencyDurationCount: 6,
        enableSoftwareAES: true,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.8,
        highBufferWatchdogPeriod: 3,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 5
      });

      ctrl.hls = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (switchRequestIdRef.current !== reqId) return;
        applyStreamQualityToHls(dataSaverMode, hls);
        safePlayVideo(video);
      });

      video.onwaiting = () => {
        if (switchRequestIdRef.current !== reqId) return;
        try { hls.startLoad(); } catch(e) {}
      };

      video.onstalled = () => {
        if (switchRequestIdRef.current !== reqId) return;
        try { hls.startLoad(); } catch(e) {}
      };

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (switchRequestIdRef.current !== reqId) return;
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              failoverToBackup('hls_network_error');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              try {
                hls.recoverMediaError();
              } catch(e) {
                failoverToBackup('hls_media_error');
              }
              break;
            default:
              failoverToBackup('hls_fatal_error');
              break;
          }
        }
      });
      return;
    }

    // 3. Direct HTML5 Video fallback
    if (streamUrl) {
      video.src = streamUrl;
      safePlayVideo(video);
      video.onerror = () => {
        failoverToBackup('native_video_error');
      };
    }
  };

  // Perform Channel Switch (Dual-Player Preloading & 5-Second Automatic Switch Machine)
  const performChannelSwitch = (targetChannel, immediate = false) => {
    if (!targetChannel) return;

    persistentTargetChannelRef.current = targetChannel;

    // Clear any active 5s timeout timer & countdown
    if (stageTimer5sRef.current) {
      clearTimeout(stageTimer5sRef.current);
      stageTimer5sRef.current = null;
    }
    clearCountdown();
    pendingZapChannelRef.current = null;
    pendingZapIndexRef.current = null;

    // If target channel is already active and not forced, dismiss HUD
    if (targetChannel.id === selectedChannel?.id && !isInitialLoadRef.current && !immediate) {
      setSwitchingChannel(null);
      setPreloadState(null);
      return;
    }

    const reqId = ++switchRequestIdRef.current;

    // IMMEDIATE SWITCH (initial boot, forced retry, or explicit dashboard launch)
    if (immediate) {
      setPreloadState(null);
      setSwitchingChannel(null);
      disposeSlotController('A');
      disposeSlotController('B');

      setSelectedChannel(targetChannel);
      try {
        localStorage.setItem('nndd_last_channel_id', targetChannel.id);
      } catch(e) {}

      setIsStreamLoading(true);
      setIsChannelOffline(false);
      setIsBackupStreamActive(false);

      // Start on current active slot directly
      startPlayerForSlot(activeSlot, targetChannel, reqId, false, serverMode === 'auto' ? 2200 : 8000, null);
      return;
    }

    // SEAMLESS DUAL-PLAYER SWITCH (Active slot plays uninterrupted; target slot preloads in background)
    const backgroundSlot = activeSlot === 'A' ? 'B' : 'A';
    const playingSlot = activeSlot;

    // Cross-server domain reset: If previous channel and target channel are on different hosts,
    // hard reset background slot to prevent lingering sockets/buffers
    const prevHost = (() => { try { return new URL(selectedChannel?.url || '').hostname; } catch(e){ return ''; } })();
    const nextHost = (() => { try { return new URL(targetChannel?.url || '').hostname; } catch(e){ return ''; } })();
    if (prevHost && nextHost && prevHost !== nextHost) {
      disposeSlotController(backgroundSlot);
    }

    // Dispose any leftover on the background slot
    disposeSlotController(backgroundSlot);

    // 1. Normal Preload State with 5-Second White Circular Countdown
    setSwitchingChannel(targetChannel);
    setPreloadState({
      targetChannel,
      slot: backgroundSlot,
      reqId,
      startedAt: performance.now()
    });
    startCountdown();

    // 2. Smooth Auto-Commit Transition: If background preload takes longer than 4.8s, commit to target channel cleanly
    stageTimer5sRef.current = setTimeout(() => {
      if (switchRequestIdRef.current === reqId) {
        clearCountdown();
        setPreloadState(null);
        setSwitchingChannel(null);
        setDrawerPreloadTarget(null);
        setDrawerPreloadCountdown(null);

        // Smoothly activate target slot without tearing down decoders or causing a black gap
        setActiveSlot(backgroundSlot);
        setSelectedChannel(targetChannel);
        try {
          localStorage.setItem('nndd_last_channel_id', targetChannel.id);
        } catch(e) {}

        const targetVideo = backgroundSlot === 'A' ? videoRefA.current : videoRefB.current;
        if (targetVideo) {
          targetVideo.muted = isMuted;
          targetVideo.volume = isMuted ? 0 : volume / 100;
        }

        setIsStreamLoading(true);
        setIsChannelOffline(false);
        disposeSlotController(playingSlot);
      }
    }, 4800);

    // 3. Start preloading target channel in background slot
    startPlayerForSlot(backgroundSlot, targetChannel, reqId, false, 0, () => {
      // EVENT-DRIVEN FIRST FRAME RENDERED!
      if (switchRequestIdRef.current !== reqId) return;

      // Clear 5s stage timer & countdown
      if (stageTimer5sRef.current) {
        clearTimeout(stageTimer5sRef.current);
        stageTimer5sRef.current = null;
      }
      clearCountdown();
      setPreloadState(null);
      setSwitchingChannel(null);
      setDrawerPreloadTarget(null);
      setDrawerPreloadCountdown(null);

      // Unmute target video
      const targetVideo = backgroundSlot === 'A' ? videoRefA.current : videoRefB.current;
      if (targetVideo) {
        targetVideo.muted = isMuted;
        targetVideo.volume = isMuted ? 0 : volume / 100;
      }

      // Execute smooth ~300ms seamless switch
      setActiveSlot(backgroundSlot);
      setSelectedChannel(targetChannel);
      try {
        localStorage.setItem('nndd_last_channel_id', targetChannel.id);
      } catch(e) {}
      setIsStreamLoading(false);
      setIsChannelOffline(false);

      // Immediately mute and cleanly dispose previous slot controller after crossfade
      const oldVideo = playingSlot === 'A' ? videoRefA.current : videoRefB.current;
      if (oldVideo) {
        oldVideo.muted = true;
      }
      setTimeout(() => {
        disposeSlotController(playingSlot);
      }, 320);
    });
  };

  // Adjust HLS bitrate / resolution according to Data Saver Mode
  const applyStreamQualityToHls = (mode, hlsInstance = null) => {
    const targetHls = hlsInstance || (activeSlot === 'A' ? controllersRef.current.A?.hls : controllersRef.current.B?.hls);
    if (!targetHls) return;
    try {
      if (mode === 'data_saver') {
        let bestLevel = -1;
        if (targetHls.levels && targetHls.levels.length > 0) {
          const sorted = targetHls.levels
            .map((lvl, idx) => ({ ...lvl, index: idx }))
            .sort((a, b) => (a.height || 0) - (b.height || 0));
          const match480 = sorted.find(l => l.height && l.height <= 480) || sorted[0];
          bestLevel = match480 ? match480.index : 0;
        }
        targetHls.currentLevel = bestLevel !== -1 ? bestLevel : 0;
        targetHls.autoLevelCapping = bestLevel !== -1 ? bestLevel : 0;
      } else if (mode === '720p') {
        let bestLevel = -1;
        if (targetHls.levels && targetHls.levels.length > 0) {
          const sorted = targetHls.levels
            .map((lvl, idx) => ({ ...lvl, index: idx }))
            .sort((a, b) => (a.height || 0) - (b.height || 0));
          const match720 = sorted.find(l => l.height && l.height <= 720) || sorted[Math.floor(sorted.length / 2)];
          bestLevel = match720 ? match720.index : 0;
        }
        targetHls.currentLevel = bestLevel !== -1 ? bestLevel : 0;
        targetHls.autoLevelCapping = bestLevel !== -1 ? bestLevel : 0;
      } else {
        targetHls.autoLevelCapping = -1;
        // Start at FULL quality on initial startup, then let auto-ABR adapt if network demands it
        if (targetHls.levels && targetHls.levels.length > 0) {
          const sorted = targetHls.levels
            .map((lvl, idx) => ({ ...lvl, index: idx }))
            .sort((a, b) => ((b.height || 0) - (a.height || 0)) || ((b.bitrate || 0) - (a.bitrate || 0)));
          const maxLevel = sorted[0]?.index ?? (targetHls.levels.length - 1);
          targetHls.startLevel = maxLevel;
          targetHls.nextLoadLevel = maxLevel;
        } else {
          targetHls.startLevel = -1;
        }
        targetHls.currentLevel = -1; // -1 enables automatic ABR adaptation after first segment
        targetHls.loadLevel = -1;
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
  };

  // Heart Favorite Toggle with localStorage persistence
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
    if (serverMode === 'dedicated') {
      showServerModeToast('dedicated', '🔒 سێرڤەری دیاریکراو: سێرڤەر ناگۆڕدرێت لەسەر سێرڤەرێکی تر');
      return;
    }
    const candidate = getNextAutoStreamCandidate(selectedChannel, ctrlA.url || ctrlB.url);
    if (!candidate) return;
    setIsBackupStreamActive(true);
    startPlayerForSlot(activeSlot, { ...selectedChannel, backupUrl: candidate }, switchRequestIdRef.current, true, 2200, null);
  };

  const switchToMainStream = () => {
    setIsBackupStreamActive(false);
    startPlayerForSlot(activeSlot, selectedChannel, switchRequestIdRef.current, false, serverMode === 'auto' ? 2200 : 8000, null);
  };

  // Initial load: Preload in background immediately so channel is ready exactly when intro ends (Step 2)
  useEffect(() => {
    performChannelSwitch(selectedChannel, true);

    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (stageTimer5sRef.current) clearTimeout(stageTimer5sRef.current);
      if (zapDebounceTimerRef.current) clearTimeout(zapDebounceTimerRef.current);
      clearCountdown();
      disposeSlotController('A');
      disposeSlotController('B');
    };
  }, []);

  // Auto-recovery: if channel went offline, periodically attempt auto-reconnect
  useEffect(() => {
    let reconnectTimer = null;
    if (isChannelOffline && selectedChannel && activeTab === 'live') {
      reconnectTimer = setTimeout(() => {
        setIsChannelOffline(false);
        performChannelSwitch(selectedChannel, true);
      }, 5000);
    }
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [isChannelOffline, selectedChannel, activeTab]);

  // Update volume & mute dynamically on active video element
  useEffect(() => {
    const videoA = videoRefA.current;
    const videoB = videoRefB.current;
    if (activeSlot === 'A') {
      if (videoA) {
        videoA.muted = isMuted;
        videoA.volume = isMuted ? 0 : volume / 100;
      }
      if (videoB) {
        videoB.muted = true;
      }
    } else {
      if (videoB) {
        videoB.muted = isMuted;
        videoB.volume = isMuted ? 0 : volume / 100;
      }
      if (videoA) {
        videoA.muted = true;
      }
    }
  }, [activeSlot, isMuted, volume]);

  // Helper to play a series episode or movie in Dedicated Fullscreen Cinema Mode (100% Isolated from Live TV)
  const playVodStream = (item, episode = null) => {
    if (!isProOrAbove) {
      setShowSubscriptionAlert(true);
      return;
    }

    const isSeries = Boolean(episode) || (item.episodes && item.episodes.length > 0);
    const activeEp = episode || (isSeries ? item.episodes?.[0] : null);
    const title = activeEp ? `${item.title} - ${activeEp.title}` : item.title;
    const streamUrl = activeEp ? activeEp.streamUrl : (item.streamUrl || 'https://stream.shams.tv/hls/0/stream.m3u8');
    const epNum = activeEp ? activeEp.number : 0;
    const savedProgress = getVodProgress(item.id, epNum);

    // 1. Pause background Live TV video cleanly without disrupting live channel state
    const liveVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
    if (liveVideo) {
      try { liveVideo.pause(); } catch(e) {}
    }

    // 2. Open Dedicated Cinema VOD Player
    setCinemaSession({
      item,
      episode: activeEp,
      isSeries,
      title,
      streamUrl,
      resumeTime: savedProgress
    });
    setSelectedVodItem(null); // Close the detail popup
  };

  const closeCinemaPlayer = () => {
    setCinemaSession(null);

    // Resume background Live TV stream only if user is on dashboard
    if (activeTab === 'dashboard') {
      const liveVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
      if (liveVideo) {
        liveVideo.play().catch(() => {});
      }
    }
  };

  const playNextEpisode = () => {
    if (!cinemaSession?.item?.episodes) return;
    const currentIdx = cinemaSession.item.episodes.findIndex(
      ep => ep.number === cinemaSession.episode?.number
    );
    if (currentIdx !== -1 && currentIdx < cinemaSession.item.episodes.length - 1) {
      const nextEp = cinemaSession.item.episodes[currentIdx + 1];
      playVodStream(cinemaSession.item, nextEp);
    }
  };

  // Bottom Navigation Buttons on Dashboard
  const BOTTOM_BUTTONS = [
    { id: 'settings', label: t('settings'), sub: t('settingsSub'), icon: Sliders, tab: 'settings' },
    { id: 'series', label: t('series'), sub: t('seriesSub'), icon: Film, tab: 'series', badge: 'PRO' },
    { id: 'live', label: t('live'), sub: t('liveSub'), icon: Tv, tab: 'live', isDefault: true, badge: 'FREE' },
    { id: 'movies', label: t('movies'), sub: t('moviesSub'), icon: Film, tab: 'movies', badge: 'PRO' },
    { id: 'about', label: t('about'), sub: t('aboutSub'), icon: Info, tab: 'about' }
  ];

  // Centralized Back Navigation: Live -> Dashboard, Dashboard -> Press again to exit
  const handleBackAction = () => {
    if (cinemaSession) {
      closeCinemaPlayer();
      return;
    }
    if (selectedVodItem) {
      setSelectedVodItem(null);
      return;
    }
    if (showChannelDrawer) {
      setShowChannelDrawer(false);
      return;
    }
    if (isTablet && isTabletFullscreen) {
      setIsTabletFullscreen(false);
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
      const isExpired = subscriptionDaysRemaining <= 0 || currentUser?.subPlan?.includes('بەسەرچوو');
      if (isExpired && ['live', 'series', 'movies'].includes(activeTab)) {
        setActiveTab('dashboard');
        const liveVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
        if (liveVideo) {
          try { liveVideo.pause(); } catch(e) {}
        }
      }
      return;
    }
    if (activeTab === 'channels' || activeTab === 'favorites' || activeTab === 'search') {
      setActiveTab('dashboard');
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
      // Dismiss 5-Second Section Welcome Animation immediately on ANY remote key press
      if (sectionWelcome) {
        if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
        setSectionWelcome(null);
        if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 4) {
          e.preventDefault();
          return;
        }
      }


      // When Dedicated Cinema VOD Player is open, it manages its own keys; block Live TV shortcuts
      if (cinemaSession) {
        return;
      }

      // Back button on TV Remotes, Escape, Backspace
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack' || e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 4) {
        e.preventDefault();
        handleBackAction();
        return;
      }

      // Direct numeric keypad channel jumping (0-9) on TV Remote with 850ms buffer
      if (
        /^[0-9]$/.test(e.key) &&
        !parentalPinModalOpen &&
        !isEditPinModalOpen &&
        !isActivationModalOpen &&
        !showChannelDrawer &&
        !e.ctrlKey && !e.altKey && !e.metaKey
      ) {
        e.preventDefault();
        const digit = e.key;
        setNumericZapBuffer(prev => {
          const nextBuf = (prev + digit).slice(-3);
          if (numericZapTimerRef.current) {
            clearTimeout(numericZapTimerRef.current);
          }
          numericZapTimerRef.current = setTimeout(() => {
            const targetNum = parseInt(nextBuf, 10);
            const found = channels.find(c => c.number === targetNum);
            if (found) {
              if (activeTab !== 'live') {
                handleSelectTab('live');
              }
              handleSelectChannelWithLockCheck(found, false);
            }
            setNumericZapBuffer('');
            numericZapTimerRef.current = null;
          }, 850);
          return nextBuf;
        });
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
        const currentList = isSeries ? paginatedSeries : paginatedMovies;

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
          } else if (e.keyCode === 33 || e.key === 'PageUp') {
            e.preventDefault();
            if (isSeries) {
              setSeriesCurrentPage(prev => Math.max(1, prev - 1));
            } else {
              setMoviesCurrentPage(prev => Math.max(1, prev - 1));
            }
            setVodFocusedIndex(0);
          } else if (e.keyCode === 34 || e.key === 'PageDown') {
            e.preventDefault();
            if (isSeries) {
              setSeriesCurrentPage(prev => Math.min(totalSeriesPages, prev + 1));
            } else {
              setMoviesCurrentPage(prev => Math.min(totalMoviesPages, prev + 1));
            }
            setVodFocusedIndex(0);
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
        const isInputFocused = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

        // TV Remote Color Keys (Red, Green, Yellow, Blue) with expanded TV hardware codes
        const isRedKey = e.key === 'ColorF0Red' || e.key === 'Red' || e.keyCode === 403 || e.keyCode === 183 ||
                         (!isInputFocused && !showSearchKeyboard && (e.key === 'r' || e.key === 'R' || e.key === 'F1'));
        const isGreenKey = e.key === 'ColorF1Green' || e.key === 'Green' || e.keyCode === 404 || e.keyCode === 184 ||
                           (!isInputFocused && !showSearchKeyboard && (e.key === 'g' || e.key === 'G' || e.key === 'F2'));
        const isYellowKey = e.key === 'ColorF2Yellow' || e.key === 'Yellow' || e.keyCode === 405 || e.keyCode === 185 ||
                            e.keyCode === 228 || e.key === 'AspectRatio' || e.key === 'Aspect' ||
                            (!isInputFocused && !showSearchKeyboard && (e.key === 'y' || e.key === 'Y' || e.key === 'F3'));
        const isBlueKey = e.key === 'ColorF3Blue' || e.key === 'Blue' || e.keyCode === 406 || e.keyCode === 186 ||
                          (!isInputFocused && !showSearchKeyboard && (e.key === 'b' || e.key === 'B' || e.key === 'F4'));

        if (isRedKey) {
          e.preventDefault();
          cycleCategory();
          return;
        } else if (isGreenKey) {
          e.preventDefault();
          toggleSearchKeyboard();
          return;
        } else if (isYellowKey) {
          e.preventDefault();
          cycleAspectRatio();
          return;
        } else if (isBlueKey) {
          e.preventDefault();
          cycleChannelFilter();
          return;
        }

        const isUpKey = e.key === 'ArrowUp' || e.key === 'Up' || e.key === 'ChannelUp' || e.key === 'PageUp' || 
                        e.key === '+' || e.key === '=' || e.key === 'AudioVolumeUp' || e.key === 'VolumeUp' || 
                        e.keyCode === 38 || e.keyCode === 19 || e.keyCode === 427 || e.keyCode === 33 || 
                        e.keyCode === 107 || e.keyCode === 187 || e.keyCode === 175 || e.keyCode === 166;

        const isDownKey = e.key === 'ArrowDown' || e.key === 'Down' || e.key === 'ChannelDown' || e.key === 'PageDown' || 
                          e.key === '-' || e.key === '_' || e.key === 'AudioVolumeDown' || e.key === 'VolumeDown' || 
                          e.keyCode === 40 || e.keyCode === 20 || e.keyCode === 428 || e.keyCode === 34 || 
                          e.keyCode === 109 || e.keyCode === 189 || e.keyCode === 174 || e.keyCode === 167;

        const isSelectKey = e.key === 'Enter' || e.key === 'Select' || e.key === ' ' || 
                            e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66;

        const isBackKey = e.key === 'Escape' || e.key === 'Back' || e.key === 'GoBack' || e.key === 'Backspace' || 
                          e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 4 || e.keyCode === 10009 || e.keyCode === 461;

        const isLeftKey = e.key === 'ArrowLeft' || e.key === 'Left' || e.keyCode === 37 || e.keyCode === 21;
        const isRightKey = e.key === 'ArrowRight' || e.key === 'Right' || e.keyCode === 39 || e.keyCode === 22;

        // 1. Navigation inside On-Screen Mini Virtual Keyboard
        if (showSearchKeyboard) {
          const currentKeys = keyboardLang === 'ku' ? KU_KEYBOARD_KEYS : EN_KEYBOARD_KEYS;
          const totalKeys = currentKeys.length;
          const cols = 10;

          if (isBackKey) {
            e.preventDefault();
            setShowSearchKeyboard(false);
            return;
          }

          if (isLeftKey) {
            e.preventDefault();
            setKeyboardFocusedIndex(prev => (prev - 1 + totalKeys) % totalKeys);
            return;
          } else if (isRightKey) {
            e.preventDefault();
            setKeyboardFocusedIndex(prev => (prev + 1) % totalKeys);
            return;
          } else if (isUpKey) {
            e.preventDefault();
            setKeyboardFocusedIndex(prev => Math.max(0, prev - cols));
            return;
          } else if (isDownKey) {
            e.preventDefault();
            setKeyboardFocusedIndex(prev => Math.min(totalKeys - 1, prev + cols));
            return;
          } else if (isSelectKey) {
            e.preventDefault();
            const keyVal = currentKeys[keyboardFocusedIndex];
            if (keyVal === 'SPACE') {
              setSearchQuery(prev => prev + ' ');
            } else if (keyVal === 'BACK') {
              setSearchQuery(prev => prev.slice(0, -1));
            } else if (keyVal === 'CLEAR') {
              setSearchQuery('');
            } else if (keyVal === 'DONE') {
              setShowSearchKeyboard(false);
            } else if (keyVal) {
              setSearchQuery(prev => prev + keyVal);
            }
            return;
          }

          // Direct physical keyboard typing when keyboard is open
          if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key && e.key.length === 1) {
            e.preventDefault();
            setSearchQuery(prev => prev + e.key);
            return;
          }
          if (e.key === 'Backspace' || e.keyCode === 8) {
            e.preventDefault();
            setSearchQuery(prev => prev.slice(0, -1));
            return;
          }
        }

        // 2. Navigation inside Category Modal
        if (showCategoryModal) {
          if (isBackKey) {
            e.preventDefault();
            setShowCategoryModal(false);
            return;
          }
          if (isUpKey) {
            e.preventDefault();
            const currIdx = dynamicCategories.indexOf(channelCategory);
            const prevCat = dynamicCategories[(currIdx - 1 + dynamicCategories.length) % dynamicCategories.length];
            setChannelCategory(prevCat);
            showColorToast('red', `🔴 کەتەگۆری: ${prevCat}`);
            return;
          }
          if (isDownKey) {
            e.preventDefault();
            const currIdx = dynamicCategories.indexOf(channelCategory);
            const nextCat = dynamicCategories[(currIdx + 1) % dynamicCategories.length];
            setChannelCategory(nextCat);
            showColorToast('red', `🔴 کەتەگۆری: ${nextCat}`);
            return;
          }
          if (isSelectKey) {
            e.preventDefault();
            setShowCategoryModal(false);
            return;
          }
        }

        if (showChannelDrawer) {
          const displayedChannels = filteredChannels;
          const total = displayedChannels.length;

          if (isUpKey) {
            e.preventDefault();
            if (total > 0) {
              setDrawerFocusedIndex(prev => {
                const nextIdx = (prev - 1 + total) % total;
                drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'auto' });
                return nextIdx;
              });
            }
            return;
          } else if (isDownKey) {
            e.preventDefault();
            if (total > 0) {
              setDrawerFocusedIndex(prev => {
                const nextIdx = (prev + 1) % total;
                drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'auto' });
                return nextIdx;
              });
            }
            return;
          } else if (isLeftKey) {
            // Left key jumps 10 channels (in RTL: forward +10, in LTR: backward -10)
            e.preventDefault();
            if (total > 0) {
              const jump = isRtl ? 10 : -10;
              setDrawerFocusedIndex(prev => {
                const nextIdx = (prev + jump + total) % total;
                drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                return nextIdx;
              });
            }
            return;
          } else if (isRightKey) {
            // Right key jumps 10 channels (in RTL: backward -10, in LTR: forward +10)
            e.preventDefault();
            if (total > 0) {
              const jump = isRtl ? -10 : 10;
              setDrawerFocusedIndex(prev => {
                const nextIdx = (prev + jump + total) % total;
                drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                return nextIdx;
              });
            }
            return;
          } else if (e.keyCode === 33 || e.key === 'PageUp') {
            e.preventDefault();
            if (total > 0) {
              setDrawerFocusedIndex(prev => {
                const nextIdx = (prev - 10 + total) % total;
                drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                return nextIdx;
              });
            }
            return;
          } else if (e.keyCode === 34 || e.key === 'PageDown') {
            e.preventDefault();
            if (total > 0) {
              setDrawerFocusedIndex(prev => {
                const nextIdx = (prev + 10) % total;
                drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                return nextIdx;
              });
            }
            return;
          } else if (isSelectKey) {
            e.preventDefault();
            clearDrawerCountdown();
            const targetChannel = displayedChannels[drawerFocusedIndex];
            if (targetChannel) {
              handleSelectChannelWithLockCheck(targetChannel, false);
            }
            return;
          } else if (isBackKey) {
            e.preventDefault();
            clearDrawerCountdown();
            setShowChannelDrawer(false);
            return;
          }
        } else {
          // When Channel Drawer is CLOSED: Up/Down zaps channels, Left or Select opens drawer
          if (isUpKey) {
            e.preventDefault();
            switchChannelRelative(-1);
          } else if (isDownKey) {
            e.preventDefault();
            switchChannelRelative(1);
          } else if (isSelectKey) {
            e.preventDefault();
            // If actively rapid-zapping or countdown HUD is showing, pressing OK immediately commits to the target channel!
            const commitChannel = pendingZapChannelRef.current || persistentTargetChannelRef.current || switchingChannel;
            if (commitChannel && commitChannel.id !== selectedChannel?.id) {
              if (zapDebounceTimerRef.current) {
                clearTimeout(zapDebounceTimerRef.current);
                zapDebounceTimerRef.current = null;
              }
              pendingZapChannelRef.current = null;
              pendingZapIndexRef.current = null;
              performChannelSwitch(commitChannel, true);
            } else {
              setSwitchingChannel(null);
              setPreloadState(null);
              setShowChannelDrawer(true);
            }
          } else if (isLeftKey) {
            e.preventDefault();
            setShowChannelDrawer(true);
          } else if (isRightKey) {
            e.preventDefault();
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
    filteredChannels, 
    selectedChannel, 
    showChannelDrawer, 
    drawerFocusedIndex, 
    onlyFavorites, 
    sortBy, 
    channelCategory, 
    favoriteChannelIds, 
    dockScale, 
    isDockScaleOpen, 
    parentalPinModalOpen, 
    isActivationModalOpen, 
    showSubscriptionAlert, 
    selectedVodItem,
    selectedVodType,
    vodFocusedIndex,
    vodEpisodeFocusedIndex,
    filteredSeries,
    filteredMovies,
    paginatedSeries,
    paginatedMovies,
    seriesCurrentPage,
    moviesCurrentPage,
    totalSeriesPages,
    totalMoviesPages,
    cinemaSession,
    sectionWelcome
  ]);

  // Rapid Channel Zapping & Delta Queue Engine
  // (Maintains uninterrupted active stream while buffering target index during rapid 1->2->3 zapping)
  const switchChannelRelative = (delta) => {
    // 1. Determine active channel pool
    const pool = (onlyFavorites && filteredChannels.length > 0)
      ? filteredChannels
      : (channelCategory && channelCategory !== 'هەموو' && filteredChannels.length > 0)
        ? filteredChannels
        : channels;
    if (!pool || pool.length === 0) return null;

    // 2. Clear any active zap debounce timer
    if (zapDebounceTimerRef.current) {
      clearTimeout(zapDebounceTimerRef.current);
      zapDebounceTimerRef.current = null;
    }

    // 3. Abort any previous background preload timeout & countdown
    if (stageTimer5sRef.current) {
      clearTimeout(stageTimer5sRef.current);
      stageTimer5sRef.current = null;
    }
    clearCountdown();
    setPreloadState(null);

    // Invalidate any in-flight background preload callback without tearing down codecs prematurely
    switchRequestIdRef.current++;

    // 4. Calculate buffered target index (Continuous Delta Queue)
    const total = pool.length;

    // Resolve current base channel robustly:
    const activeTarget = persistentTargetChannelRef.current || switchingChannel || selectedChannel;
    let baseIndex = -1;

    if (activeTarget) {
      baseIndex = pool.findIndex(c => 
        (c.id !== undefined && c.id !== null && String(c.id) === String(activeTarget.id)) ||
        (c.number !== undefined && activeTarget.number !== undefined && String(c.number) === String(activeTarget.number))
      );
    }

    if (baseIndex === -1) {
      if (persistentTargetIndexRef.current !== null && persistentTargetIndexRef.current !== undefined) {
        baseIndex = Math.max(0, Math.min(total - 1, persistentTargetIndexRef.current));
      } else {
        baseIndex = 0;
      }
    }

    // Continuous Wrap-Around / Loop:
    const nextIndex = (baseIndex + delta + total) % total;
    persistentTargetIndexRef.current = nextIndex;
    pendingZapIndexRef.current = nextIndex;

    const targetChannel = pool[nextIndex];
    persistentTargetChannelRef.current = targetChannel;
    pendingZapChannelRef.current = targetChannel;

    // 5. Instant 0ms visual feedback: update target channel name and number in the HUD
    // Active video stream continues playing uninterrupted without any decoder resets or stuttering!
    setSwitchingChannel(targetChannel);

    // 6. Debounce actual background stream loading by 350ms:
    // Only initiate the background preloader for the FINAL target channel after the user settles
    zapDebounceTimerRef.current = setTimeout(() => {
      zapDebounceTimerRef.current = null;
      const finalChannel = persistentTargetChannelRef.current || pendingZapChannelRef.current;
      pendingZapChannelRef.current = null;
      pendingZapIndexRef.current = null;

      if (!finalChannel) return;

      // If user zapped around and ended back on the currently playing channel, dismiss HUD
      if (finalChannel.id === selectedChannel?.id) {
        setSwitchingChannel(null);
        setPreloadState(null);
        return;
      }

      // User settled on target channel! Now initiate the background preloader
      performChannelSwitch(finalChannel, false);
    }, 350);

    return targetChannel;
  };



  // Screen Double-Tap Handler (User requirement: کە دەست لە شاشەکە ئەدرێت هیچ نەگۆرێت . ئەبێ دوو جار دەستی لێ بدرێت انجا لیستی کەناڵەکان بێنێت)
  const lastDoubleTapTimestampRef = useRef(0);

  const handleDoubleTapScreen = (e) => {
    // If interacting with interactive buttons/inputs inside modals, don't hijack
    if (e?.target?.closest('button, input, select, textarea, [data-interactive="true"]')) {
      return;
    }

    const now = Date.now();
    const elapsed = now - lastDoubleTapTimestampRef.current;

    // DOUBLE TAP DETECTED (between 40ms and 500ms)
    if (elapsed > 40 && elapsed < 500) {
      lastDoubleTapTimestampRef.current = 0;
      if (activeTab === 'dashboard') {
        handleSelectTab('live');
        return;
      }
      // Toggle channel drawer: if closed -> OPENS it; if open -> CLOSES it
      setShowChannelDrawer(prev => !prev);
      return;
    }

    // FIRST TAP: record timestamp only. Single tap does NOTHING.
    lastDoubleTapTimestampRef.current = now;
  };

  // Mobile Touch Gestures (Swipe Up/Down to change channels, Tap to trigger double-tap logic)
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

    // 1. VERTICAL SWIPE (|deltaY| > 45px and dominant over horizontal)
    if (absY > 45 && absY > absX * 1.1) {
      touchHandledRef.current = true;
      setTimeout(() => { touchHandledRef.current = false; }, 450);

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
    if (absX < 25 && absY < 25 && duration < 400) {
      touchHandledRef.current = true;
      setTimeout(() => { touchHandledRef.current = false; }, 450);
      handleDoubleTapScreen(e);
    }
  };

  const handleLiveContainerClick = (e) => {
    if (touchHandledRef.current) return;
    handleDoubleTapScreen(e);
  };

  const handleSelectTab = (tabName) => {
    if (welcomeTimerRef.current) {
      clearTimeout(welcomeTimerRef.current);
      welcomeTimerRef.current = null;
    }

    if (tabName === 'live') {
      setActiveTab('live');
      setIsMuted(false);
      setShowChannelDrawer(false);

      // Always restore and play the last watched channel (کەناڵی کۆتایی)
      let targetChannel = selectedChannel;
      try {
        const savedId = localStorage.getItem('nndd_last_channel_id');
        if (savedId) {
          const found = (propChannels || channels).find(c => c.id === savedId || String(c.number) === savedId);
          if (found) targetChannel = found;
        }
      } catch(e) {}

      if (targetChannel) {
        setSelectedChannel(targetChannel);
        persistentTargetChannelRef.current = targetChannel;
        performChannelSwitch(targetChannel, true);
      }

      setSectionWelcome({
        type: 'live'
      });
      welcomeTimerRef.current = setTimeout(() => {
        setSectionWelcome(null);
        welcomeTimerRef.current = null;
      }, 1500);
    } else {
      // Non-live tabs: MUTE background live video
      setIsMuted(true);
      [videoRefA.current, videoRefB.current].forEach(v => {
        if (v) {
          v.muted = true;
          v.volume = 0;
        }
      });

      if (tabName === 'series' || tabName === 'movies') {
        if (!isProOrAbove) {
          setShowSubscriptionAlert(true);
          return;
        }
        setActiveTab(tabName);
        setSectionWelcome({
          type: tabName
        });
        welcomeTimerRef.current = setTimeout(() => {
          setSectionWelcome(null);
          welcomeTimerRef.current = null;
        }, 1500);
      } else {
        setActiveTab(tabName);
        setSectionWelcome(null);
      }
    }
  };

  // Screen interaction in live mode (clean video, zero accidental banners)
  const handleLiveScreenInteraction = () => {};

  // Redeem Subscription Code right inside the TV App!
  const handleRedeemCode = () => {
    if (!activationCodeInput.trim()) return;

    const codeClean = activationCodeInput.trim().toUpperCase();
    const matched = INITIAL_ACTIVATION_CODES.find(
      c => c.code.toUpperCase() === codeClean
    );

    if (matched) {
      setSubscriptionDaysRemaining(matched.durationDays);
      let newTier = 'pro';
      if (matched.planId === 'plan_ultra' || matched.code.includes('ULTRA') || matched.code.includes('97')) {
        newTier = 'ultra';
      } else if (matched.planId === 'plan_pro_plus' || matched.code.includes('PLUS')) {
        newTier = 'pro_plus';
      }
      setUserPlanTier(newTier);
      setUserPlanTitle(matched.planName);
      try {
        localStorage.setItem('nndd_user_plan_tier', newTier);
        localStorage.setItem('nndd_user_plan_title', matched.planName);
        localStorage.setItem('nndd_sub_days', String(matched.durationDays));
      } catch(e) {}
      setShowSubscriptionAlert(false);
      setActivationCodeInput('');
      onNotify?.({
        title: 'کۆدەکە بە سەرکەوتوویی کارا کرا 🎉',
        message: `پلانی "${matched.planName}" چالاککرا (${matched.durationDays} ڕۆژ). بەشی زنجیرە و فیلمەکان کرانەوە!`,
        type: 'success'
      });
    } else {
      // Default to 30 days Pro
      setUserPlanTier('pro');
      setUserPlanTitle('پلانی پرۆ (Pro)');
      setSubscriptionDaysRemaining(30);
      try {
        localStorage.setItem('nndd_user_plan_tier', 'pro');
        localStorage.setItem('nndd_user_plan_title', 'پلانی پرۆ (Pro)');
        localStorage.setItem('nndd_sub_days', '30');
      } catch(e) {}
      setShowSubscriptionAlert(false);
      setActivationCodeInput('');
      onNotify?.({
        title: 'کۆدەکە چالاککرا 🎉',
        message: 'پلانی ١ مانگی پرۆ کارا کرا. بەشی زنجیرە و فیلمەکان کرانەوە!',
        type: 'success'
      });
    }
  };

  const timeString = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const dateFormatted = useMemo(() => {
    try {
      if (language === 'ar') {
        return currentTime.toLocaleDateString('ar-IQ', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
      if (language === 'ku') {
        return currentTime.toLocaleDateString('ckb-IQ', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
      return currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch(e) {
      return currentTime.toDateString();
    }
  }, [currentTime, language]);

  const weatherDisplayCity = useMemo(() => {
    if (language === 'ar') return 'أربيل';
    if (language === 'en') return weatherData.city || 'Erbil';
    return weatherData.cityKurdish || 'هەولێر';
  }, [language, weatherData]);

  const weatherDisplayCondition = useMemo(() => {
    if (language === 'en') return weatherData.conditionEn || 'Partly Cloudy';
    if (language === 'ar') {
      const en = (weatherData.conditionEn || '').toLowerCase();
      if (en.includes('cloud')) return 'غائم جزئياً';
      if (en.includes('fog')) return 'ضبابي';
      if (en.includes('rain')) return 'ممطر';
      return 'صحو ومشمس';
    }
    return weatherData.condition || 'ساماڵ و کەمێک هەور';
  }, [language, weatherData]);

  const handleSelectChannelWithLockCheck = (ch, keepDrawer = false) => {
    // Live TV is 100% Free! Only check parental PIN lock
    if (ch.isLocked) {
      setPendingLockedChannel(ch);
      setEnteredPin('');
      setPinError('');
      setParentalPinModalOpen(true);
      return;
    }
    if (zapDebounceTimerRef.current) {
      clearTimeout(zapDebounceTimerRef.current);
      zapDebounceTimerRef.current = null;
    }
    pendingZapIndexRef.current = null;
    pendingZapChannelRef.current = null;
    persistentTargetChannelRef.current = ch;

    if (!keepDrawer) {
      setShowChannelDrawer(false);
    }
    if (activeTab !== 'live') {
      setIsMuted(false);
      setSelectedChannel(ch);
      setSectionWelcome({
        type: 'live'
      });
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
      welcomeTimerRef.current = setTimeout(() => {
        setSectionWelcome(null);
        welcomeTimerRef.current = null;
      }, 2000);
      setActiveTab('live');
      performChannelSwitch(ch, true);
    } else {
      // In Live mode: when a channel is explicitly selected from the drawer/list, switch seamlessly with first-frame transition!
      performChannelSwitch(ch, false);
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

  // Sort & Edit 0000 PIN Handlers (User requirement: دوگمەی سۆرت و دوگمەی ئیدت با بە پاسوەرد بکرێنەوە 0000)
  const handleSortClick = () => {
    if (isEditUnlocked) {
      setSortBy(prev => prev === 'number' ? 'name' : 'number');
    } else {
      setPendingEditAction('sort');
      setEditPinInput('');
      setEditPinError('');
      setIsEditPinModalOpen(true);
    }
  };

  const handleEditClick = () => {
    if (isEditUnlocked) {
      setIsChannelEditMode(prev => !prev);
    } else {
      setPendingEditAction('edit');
      setEditPinInput('');
      setEditPinError('');
      setIsEditPinModalOpen(true);
    }
  };

  const handleVerifyEditPin = (pinToTest = editPinInput) => {
    if (pinToTest === '0000' || pinToTest === '1234') {
      setIsEditUnlocked(true);
      setIsEditPinModalOpen(false);
      setEditPinError('');
      if (pendingEditAction === 'sort') {
        setSortBy(prev => prev === 'number' ? 'name' : 'number');
      } else if (pendingEditAction === 'edit') {
        setIsChannelEditMode(true);
      } else if (pendingEditAction === 'server') {
        onNotify?.({
          title: 'بەشی ئەدمین کرایەوە 🔓',
          message: 'ڕێکخستنەکانی سێرڤەر و دەستکاری بە سەرکەوتوویی کرانەوە.',
          type: 'success'
        });
      }
      setPendingEditAction(null);
    } else {
      setEditPinError('تێپەڕەوشە هەڵەیە! (0000 یان 1234 بنووسە)');
    }
  };

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`relative w-screen max-w-screen bg-black text-white select-none font-sans p-0 m-0 ${
        activeTab === 'live' || activeTab === 'dashboard'
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden'
          : 'min-h-[100dvh] h-auto overflow-y-auto overflow-x-hidden'
      } ${
        isTv ? 'device-tv' : ''
      }`}
      onMouseMove={handleLiveScreenInteraction}
      onClick={activeTab === 'live' ? handleLiveContainerClick : undefined}
    >
      
      {/* Background / Dual Video Stream Engine (Dual-Player Preloading, Zero Black Gap) */}
      <div className="fixed inset-0 z-0 flex items-center justify-center bg-black overflow-hidden pointer-events-none w-screen h-screen m-0 p-0">
        {/* Slot A Video Player */}
        <video
          ref={videoRefA}
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          className={`absolute inset-0 w-full h-full max-w-full max-h-full transition-opacity duration-300 ease-in-out ${
            activeSlot === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          } ${getVideoAspectClass()}`}
          autoPlay
          playsInline
          muted={activeSlot === 'A' ? isMuted : true}
        />

        {/* Slot B Video Player */}
        <video
          ref={videoRefB}
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          className={`absolute inset-0 w-full h-full max-w-full max-h-full transition-opacity duration-300 ease-in-out ${
            activeSlot === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          } ${getVideoAspectClass()}`}
          autoPlay
          playsInline
          muted={activeSlot === 'B' ? isMuted : true}
        />

        {/* Clean Waiting / Auto Background Server Switching UI */}
        {isChannelOffline && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 px-6 text-center select-none animate-fade-in pointer-events-none">
            {/* Pure White Crisp NNDD TV Logo */}
            <div className="mb-4 transform transition-transform duration-700 animate-scale-up">
              <NnddLogo className="h-16 sm:h-20 w-auto filter drop-shadow-[0_0_24px_rgba(255,255,255,0.3)]" />
            </div>

            {/* White Scanning Search Strip Bar */}
            <div className="w-48 sm:w-60 h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden relative my-3 border border-white/10">
              <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white to-transparent rounded-full animate-search-scan shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
            </div>

            {/* Clean Waiting Text Only (auto-switches servers in background) */}
            <p className="text-sm sm:text-base font-light text-slate-100 tracking-wider max-w-md leading-relaxed font-sans mt-1">
              {t('pleaseWait')}
            </p>
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
        <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5">
          
          {/* Left: Pure Crisp NNDD.TV Logo (gently dims during screensaver) */}
          <div className={`flex items-center gap-2.5 sm:gap-3 transition-opacity duration-700 ${
            isDashboardIdle && activeTab === 'dashboard' ? 'opacity-20' : 'opacity-100'
          }`}>
            <div className="flex items-center select-none pointer-events-none" title="NNDD.TV">
              <NnddLogo className="h-8 sm:h-9 md:h-10 w-auto filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]" />
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

          {/* Right: Modern GitHub-style Glass Weather Widget + Clock (Only on subpages, on dashboard the morphing component handles it) */}
          {activeTab !== 'dashboard' && (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Real-time Glass Weather Capsule */}
              <div 
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 backdrop-blur-2xl shadow-lg transition-all select-none cursor-default"
                title="کەشوهەوای هەولێر، کوردستان"
              >
                <div className="p-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.5)] shrink-0">
                  <CloudSun className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <div className="flex flex-col text-start">
                  <div className="flex items-center gap-1.5 text-xs font-black text-white font-mono">
                    <span>{weatherData.temp}°C</span>
                    <span className="text-[10px] text-amber-300 font-bold font-sans">• {weatherData.cityKurdish}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-300 font-medium">
                    <span className="truncate max-w-[85px]">{weatherData.condition}</span>
                  </div>
                </div>
              </div>

              {/* Big Clock & Date */}
              <div className="text-end">
                <div className="text-2xl font-black tracking-tight text-white font-mono flex items-center justify-end gap-1.5 drop-shadow-md">
                  <Clock className="w-5 h-5 text-blue-400 inline" />
                  <span>{timeString}</span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium flex items-center justify-end gap-2 mt-0.5">
                  <span>{dateFormatted}</span>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {/* ========================================================
          SINGLE UNIFIED FLUID MORPHING CLOCK & WEATHER (APPLE MORPH STYLE)
          Glides seamlessly between top-header and dead-center over 2.5 seconds
          Pure white typography, no background cards underneath, refined scale
         ======================================================== */}
      {activeTab === 'dashboard' && (
        <div 
          onClick={() => {
            if (isDashboardIdle) setIsDashboardIdle(false);
          }}
          className={`fixed z-30 transition-all duration-[2500ms] ease-[cubic-bezier(0.16,1,0.3,1)] select-none will-change-transform transform-gpu ${
            isDashboardIdle
              ? 'top-1/2 left-8 sm:left-14 md:left-24 -translate-y-1/2 flex flex-col items-start justify-center text-start scale-100 pointer-events-auto cursor-pointer'
              : 'top-6 end-6 sm:end-8 flex flex-col items-end justify-start text-end scale-95 pointer-events-auto'
          }`}
        >
          {/* 1. Cinematic Clock (Pure White, Very Large on Left) */}
          <div className="flex items-center gap-2 sm:gap-3 drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
            <span className={`font-black font-mono tracking-tight text-white transition-all duration-[2500ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
              isDashboardIdle 
                ? 'text-7xl sm:text-8xl md:text-9xl' 
                : 'text-2xl sm:text-3xl'
            }`}>
              {timeString}
            </span>
          </div>

          {/* 2. Date (Pure White) */}
          <div className={`font-medium text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all duration-[2500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDashboardIdle 
              ? 'text-lg sm:text-xl md:text-2xl mt-3 text-start' 
              : 'text-[11px] mt-0.5 text-end'
          }`}>
            <span>{dateFormatted}</span>
          </div>

          {/* 3. Weather Info (Pure White, No Background Card) */}
          <div className={`flex items-center gap-2.5 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all duration-[2500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDashboardIdle 
              ? 'text-base sm:text-lg md:text-xl font-bold mt-3.5 justify-start' 
              : 'text-xs font-bold mt-1 justify-end'
          }`}>
            <CloudSun className={`text-white shrink-0 transition-all duration-[2500ms] ${
              isDashboardIdle ? 'w-6 h-6' : 'w-3.5 h-3.5'
            }`} />
            <span>{weatherData.temp}°C</span>
            <span>•</span>
            <span>{weatherDisplayCity}</span>
            {isDashboardIdle && (
              <>
                <span>•</span>
                <span className="text-white/80 font-normal">{weatherDisplayCondition}</span>
                <span className="text-white/60 text-xs sm:text-sm font-mono">({weatherData.humidity}% {t('humidity')})</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          1. MINIMAL CINEMA DASHBOARD (5 STANDALONE BUTTONS / 5 CRISP WHITE DOTS)
         ======================================================== */}
      {activeTab === 'dashboard' && (
        <main className="fixed inset-0 z-10 flex flex-col justify-end p-4 sm:p-6 md:p-8 animate-fade-in overflow-hidden select-none pointer-events-none">
          {/* Bottom Navigation Dock: 5 Standalone Pure White Glass Buttons or 5 Crisp White Wave Dots */}
          <div className="w-full pointer-events-auto flex items-center justify-center pb-1">
            {isDashboardIdle ? (
              /* 5 Glowing White Dots with Ocean Wave Motion (Crisp & Pure White - Not Blurry) */
              <div 
                onClick={() => setIsDashboardIdle(false)}
                onMouseEnter={() => setIsDashboardIdle(false)}
                title={t('clickToOpenSections')}
                className="relative flex items-center justify-center gap-4 sm:gap-5 px-6 py-2.5 bg-transparent border-0 shadow-none ring-0 cursor-pointer hover:scale-110 active:scale-95 transition-all duration-[2500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group"
              >
                {BOTTOM_BUTTONS.map((btn, index) => {
                  const waveDelays = ['0s', '0.22s', '0.44s', '0.66s', '0.88s'];
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDashboardIdle(false);
                        setDashboardFocusZone('dock');
                        setSelectedBottomIndex(index);
                        handleSelectTab(btn.tab);
                      }}
                      title={btn.label}
                      style={{
                        animationDelay: waveDelays[index % waveDelays.length]
                      }}
                      className="relative z-10 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,1)] animate-ocean-wave transition-transform duration-300 hover:scale-150 cursor-pointer active:scale-90"
                    />
                  );
                })}
              </div>
            ) : (
              /* Full 5 Glassmorphic Navigation Tiles: Standalone, No Group Box, Pure White Theme */
              <div 
                className="relative flex items-center justify-center flex-wrap gap-2.5 sm:gap-3.5 md:gap-4 max-w-4xl mx-auto w-full bg-transparent border-0 shadow-none ring-0 transition-all duration-[2500ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  transform: `scale(${dockScale})`,
                  transformOrigin: 'bottom center'
                }}
              >
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
                      className={`relative flex-1 min-w-[62px] sm:min-w-[76px] md:min-w-[92px] max-w-[110px] sm:max-w-[130px] py-2 sm:py-2.5 md:py-3 px-2 rounded-2xl transition-all duration-300 backdrop-blur-2xl flex flex-col items-center justify-center gap-1.5 text-center border cursor-pointer active:scale-95 group ${
                        isSelected
                          ? 'bg-white/25 text-white border-white/70 ring-2 ring-white/90 scale-105 shadow-[0_0_25px_rgba(255,255,255,0.4),inset_0_1px_2px_rgba(255,255,255,0.5)]'
                          : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border-white/20 hover:border-white/40 shadow-lg'
                      }`}
                    >
                      <span className={`p-2 rounded-xl transition-all duration-200 ${
                        isSelected 
                          ? 'bg-white text-slate-950 shadow-[0_0_12px_rgba(255,255,255,0.9)]' 
                          : 'bg-white/10 text-white group-hover:bg-white/20'
                      }`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
                      </span>
                      <span className="font-bold text-xs sm:text-sm tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {btn.label}
                      </span>
                      {btn.isDefault ? (
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isSelected 
                            ? 'bg-white text-slate-950 shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                            : 'bg-white/15 text-white border border-white/20'
                        }`}>
                          Main
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-white/70 group-hover:text-white">
                          {btn.sub}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unique Screen Device Code Strip (Click copies full direct device link) */}
          <div className="w-full flex items-center justify-center pt-2 pb-1 pointer-events-auto">
            <div 
              onClick={() => {
                try {
                  const directUrl = `${window.location.origin}/?device=${uniqueScreenCode}`;
                  navigator.clipboard.writeText(directUrl);
                  onNotify?.({
                    title: t('screenLinkCopied'),
                    message: directUrl,
                    type: 'success'
                  });
                } catch(e) {}
              }}
              className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-2xl border border-white/20 hover:border-white/40 text-white transition-all cursor-pointer shadow-md group select-none active:scale-95"
              title={t('copyScreenLink')}
            >
              <Key className="w-3 h-3 text-white group-hover:rotate-45 transition-transform" />
              <span className="text-[10px] font-medium text-white/70">{t('screenCode')}</span>
              <span className="text-[11px] font-mono font-bold text-white tracking-wider">
                {uniqueScreenCode}
              </span>
              <Copy className="w-3 h-3 text-white/70 group-hover:text-white transition-colors" />
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

          {/* ========================================================
              FLOATING GLASS CHANNEL LIST DRAWER WITH REMOTE COLOR KEYS & MINI KEYBOARD
             ======================================================== */}
          {showChannelDrawer && (
            <>
              {/* Transparent click dismissal: NO black overlay or full-screen blur! */}
              <div 
                className="fixed inset-0 z-40 bg-transparent cursor-pointer"
                onClick={() => {
                  setShowChannelDrawer(false);
                  setShowSearchKeyboard(false);
                  setShowCategoryModal(false);
                }}
                onTouchEnd={() => {
                  setShowChannelDrawer(false);
                  setShowSearchKeyboard(false);
                  setShowCategoryModal(false);
                }}
              />

                {/* Floating Glass Channel List Container (English on Left, Kurdish & Arabic on Right) */}
              <div 
                className={`fixed top-8 bottom-8 ${isRtl ? 'right-6 sm:right-8' : 'left-6 sm:left-8'} z-50 w-72 sm:w-80 max-h-[calc(100vh-4rem)] rounded-none bg-transparent backdrop-blur-3xl border border-white/25 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/10 animate-fade-in cursor-default select-none overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                {/* Minimalist Glass Header: Icons Only (Sharpened) */}
                <div className="px-3.5 py-2 border-b border-white/15 flex items-center justify-between bg-transparent backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
                    <span className="text-[11px] font-mono font-normal text-white bg-white/10 px-2 py-0.5 rounded-none border border-white/20">
                      {filteredChannels.length}
                    </span>
                  </div>

                  {/* Actions: ONLY ICONS (White Minimalist & Sharpened) */}
                  <div className="flex items-center gap-1.5">
                    {/* Favorites (White Heart Icon Only) */}
                    <button
                      type="button"
                      onClick={() => {
                        setChannelFilterMode(prev => prev === 'fav' ? 'all' : 'fav');
                      }}
                      className={`p-1.5 rounded-none border transition-all cursor-pointer active:scale-90 ${
                        channelFilterMode === 'fav'
                          ? 'bg-white/25 border-white/50 text-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                      }`}
                      title={t('favorites')}
                    >
                      <Heart className={`w-3.5 h-3.5 ${channelFilterMode === 'fav' ? 'fill-white text-white' : 'text-white'}`} />
                    </button>

                    {/* Edit (White Icon Only) */}
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className={`p-1.5 rounded-none border transition-all cursor-pointer active:scale-90 ${
                        isChannelEditMode
                          ? 'bg-white/30 border-white/60 text-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                      }`}
                      title={t('edit')}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-white" />
                    </button>

                    {/* Search (White Icon Only) */}
                    <button
                      type="button"
                      onClick={toggleSearchKeyboard}
                      className={`p-1.5 rounded-none border transition-all cursor-pointer active:scale-90 ${
                        showSearchKeyboard
                          ? 'bg-white/25 border-white/50 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                      }`}
                      title={t('search')}
                    >
                      <Search className="w-3.5 h-3.5 text-white" />
                    </button>

                    {/* Close (White Icon Only) */}
                    <button
                      type="button"
                      onClick={() => setShowChannelDrawer(false)}
                      className="p-1.5 rounded-none bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer border border-white/15 active:scale-90"
                      title={t('close')}
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Continuous Glass Sheet Channel Rows: Pure White Text on Translucent Glass (Sharpened) */}
                <div className="flex-1 overflow-y-auto scrollbar-none py-1 px-1 space-y-0.5">
                  {filteredChannels.length === 0 ? (
                    <div className="p-8 text-center text-white/60 text-xs font-normal">
                      {t('noChannelsFound')}
                    </div>
                  ) : (
                    filteredChannels.map((ch, idx) => {
                      const isSelected = selectedChannel?.id === ch.id;
                      const isRemoteFocused = drawerFocusedIndex === idx;
                      const isFav = favoriteChannelIds.includes(ch.id) || ch.isFavorite;

                      return (
                        <div
                          key={ch.id}
                          data-channel-row="true"
                          ref={el => { drawerItemRefs.current[idx] = el; }}
                          onClick={() => {
                            setDrawerFocusedIndex(idx);
                            handleSelectChannelWithLockCheck(ch, false);
                          }}
                          className={`w-full px-3 py-2 rounded-none flex items-center justify-between gap-3 text-start transition-all duration-150 cursor-pointer ${
                            isRemoteFocused
                              ? 'bg-white/25 backdrop-blur-xl border border-white/60 text-white shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                              : isSelected 
                                ? 'bg-white/15 backdrop-blur-xl border border-white/30 text-white shadow-[0_2px_12px_rgba(255,255,255,0.12)]' 
                                : 'bg-transparent hover:bg-white/[0.08] text-white/90 hover:text-white border border-transparent'
                          }`}
                        >
                          {/* Channel Logo (Small Crystal Square) */}
                          <div className={`w-7 h-7 rounded-none overflow-hidden shrink-0 p-0.5 shadow-sm transition-all ${
                            isRemoteFocused || isSelected
                              ? 'bg-white/25 border border-white/50 scale-105'
                              : 'bg-white/10 border border-white/20'
                          }`}>
                            <CachedChannelLogo 
                              channel={ch} 
                              className="w-full h-full object-cover rounded-none" 
                            />
                          </div>

                          {/* Channel Name (Clean Pure White Text on Glass - Regular / Normal weight, NOT Bold) */}
                          <span className={`truncate flex-1 text-xs sm:text-sm tracking-wide font-normal transition-all ${
                            isRemoteFocused || isSelected
                              ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]'
                              : 'text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
                          }`}>
                            {getLocalizedChannelName(ch, language)}
                          </span>

                          {/* White Heart Fav & Clean Channel Number & 5s Countdown Ring */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* 5-Second Countdown Ring Badge on Focused Channel */}
                            {drawerPreloadTarget?.id === ch.id && drawerPreloadCountdown !== null && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 border border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.4)] backdrop-blur-md animate-fade-in">
                                <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 -rotate-90 transform" viewBox="0 0 26 26">
                                    <circle cx="13" cy="13" r="11" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" fill="none" />
                                    <circle 
                                      cx="13" 
                                      cy="13" 
                                      r="11" 
                                      stroke="#ffffff" 
                                      strokeWidth="3" 
                                      fill="none" 
                                      strokeDasharray="69.1"
                                      strokeDashoffset="0"
                                      strokeLinecap="round"
                                      className="animate-ring-countdown-5s"
                                    />
                                  </svg>
                                </div>
                                <span className="font-mono text-[9px] font-bold text-white tracking-tight">
                                  {drawerPreloadCountdown}s
                                </span>
                              </div>
                            )}

                            {isFav && (
                              <Heart className="w-3.5 h-3.5 fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] shrink-0" />
                            )}
                            <span className={`font-mono text-[11px] font-normal transition-colors ${
                              isRemoteFocused || isSelected 
                                ? 'text-white' 
                                : 'text-white/60'
                            }`}>
                              #{ch.number < 10 ? `0${ch.number}` : ch.number}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* TV Remote Color Keys: Minimalist, Compact & Sharpened */}
                <div className="p-2 border-t border-white/10 bg-transparent backdrop-blur-md flex items-center justify-around gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleCategorySelector(); }}
                    className="p-1.5 rounded-none bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 backdrop-blur-md transition-all cursor-pointer active:scale-90"
                    title={t('redKey')}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] block" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSearchKeyboard(); }}
                    className="p-1.5 rounded-none bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 backdrop-blur-md transition-all cursor-pointer active:scale-90"
                    title={t('greenKey')}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] block" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); cycleAspectRatio(); }}
                    className="p-1.5 rounded-none bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 backdrop-blur-md transition-all cursor-pointer active:scale-90"
                    title={t('yellowKey')}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] block" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); cycleChannelFilter(); }}
                    className="p-1.5 rounded-none bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/30 backdrop-blur-md transition-all cursor-pointer active:scale-90"
                    title={t('blueKey')}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)] block" />
                  </button>
                </div>
              </div>

              {/* Floating Category Picker Popup (Red Remote Key - Opens next to Channel Drawer) */}
              {showCategoryModal && (
                <div 
                  className={`fixed top-8 bottom-8 ${isRtl ? 'right-[19rem] sm:right-[21.5rem]' : 'left-[19rem] sm:left-[21.5rem]'} z-50 p-3.5 rounded-none bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col gap-2 animate-scale-up select-none max-w-xs w-60 ring-1 ring-white/10`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      <span className="text-xs font-bold text-white">{t('categories')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className="p-1 rounded-none text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-none space-y-1 p-0.5">
                    {dynamicCategories.map(cat => {
                      const isSelected = channelCategory === cat;
                      const displayName = getCategoryDisplayName(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setChannelCategory(cat);
                            setShowCategoryModal(false);
                            showColorToast('red', `🔴 ${t('categories')}: ${displayName}`);
                          }}
                          className={`w-full px-3 py-1.5 rounded-none text-xs font-normal text-start transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'bg-red-500 text-white shadow-md' 
                              : 'text-slate-200 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{displayName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* On-Screen Mini Virtual Keyboard (Green Remote Key - Opens next to Channel Drawer) */}
              {showSearchKeyboard && (
                <div 
                  className={`fixed bottom-8 ${isRtl ? 'right-[19rem] sm:right-[21.5rem]' : 'left-[19rem] sm:left-[21.5rem]'} z-50 p-3.5 rounded-3xl bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col gap-2.5 animate-scale-up select-none max-w-sm w-80 ring-1 ring-white/10`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Keyboard Header & Live Search Preview */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Search className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg flex items-center justify-between">
                          <span className="truncate">{searchQuery || t('searchPlaceholder')}</span>
                          <span className="text-[9px] text-emerald-400 shrink-0 font-sans font-bold">
                            {filteredChannels.length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ms-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (keyboardLang === 'en') {
                            setKeyboardLang(language === 'ar' ? 'ar' : 'ku');
                          } else {
                            setKeyboardLang('en');
                          }
                        }}
                        className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-bold text-cyan-300 hover:bg-white/20 border border-white/10 cursor-pointer"
                        title="گۆڕینی زمانی کیبۆرد"
                      >
                        {keyboardLang === 'en' ? (language === 'ar' ? 'عربي' : 'کوردی') : 'ENG'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSearchKeyboard(false)}
                        className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Keys Grid */}
                  <div className="grid grid-cols-10 gap-1 text-center font-bold font-mono">
                    {(keyboardLang === 'ku' ? KU_KEYBOARD_KEYS : keyboardLang === 'ar' ? AR_KEYBOARD_KEYS : EN_KEYBOARD_KEYS).map((k, idx) => {
                      const isFocused = keyboardFocusedIndex === idx;
                      const isAction = ['SPACE', 'BACK', 'CLEAR', 'DONE'].includes(k);
                      const colSpan = k === 'SPACE' ? 'col-span-3' : k === 'BACK' ? 'col-span-3' : k === 'CLEAR' ? 'col-span-2' : k === 'DONE' ? 'col-span-2' : 'col-span-1';
                      const label = k === 'SPACE' ? t('spaceKey') : k === 'BACK' ? t('backKey') : k === 'CLEAR' ? t('clearKey') : k === 'DONE' ? t('doneKey') : k;

                      return (
                        <button
                          key={k + idx}
                          type="button"
                          onClick={() => {
                            setKeyboardFocusedIndex(idx);
                            if (k === 'SPACE') setSearchQuery(prev => prev + ' ');
                            else if (k === 'BACK') setSearchQuery(prev => prev.slice(0, -1));
                            else if (k === 'CLEAR') setSearchQuery('');
                            else if (k === 'DONE') setShowSearchKeyboard(false);
                            else setSearchQuery(prev => prev + k);
                          }}
                          className={`${colSpan} py-1.5 rounded-lg text-[10px] transition-all cursor-pointer select-none active:scale-95 ${
                            isFocused 
                              ? 'bg-[#0078D4] text-white ring-2 ring-white scale-105 shadow-md font-black' 
                              : isAction
                                ? 'bg-white/15 text-cyan-200 hover:bg-white/25 text-[9px] font-sans font-bold'
                                : 'bg-white/10 text-white/90 hover:bg-white/25 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Direct Numeric Remote Keypad OSD Indicator (ژمارەی کەناڵی نووسراو لەسەر کۆنترۆڵ) */}
          {numericZapBuffer && (
            <div className="fixed top-8 end-8 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-slate-950/45 backdrop-blur-3xl border border-cyan-400/70 text-white shadow-[0_12px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-cyan-400/30 animate-scale-up select-none pointer-events-none">
              <span className="text-xs text-cyan-300 font-bold uppercase tracking-wider">کەناڵی</span>
              <span className="font-mono text-2xl font-black text-white">{numericZapBuffer}</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
          )}

          {/* =========================================================================
              TARGET / UPCOMING CHANNEL CHANGE HUD WITH GLASSMORPHIC BACKGROUND
              - Never displays current channel (unobtrusive during playback).
              - Only appears when actively changing / switching channels.
              - Glassmorphic translucent card with 5s white circular countdown ring.
             ========================================================================= */}
          {(() => {
            const targetCh = switchingChannel || preloadState?.targetChannel;
            if (!targetCh) return null;
            const isPreloading = !!preloadState;
            return (
              <div 
                key="live_zap_target_hud"
                className={`fixed bottom-8 ${isRtl ? 'left-6 sm:left-8' : 'right-6 sm:right-8'} z-50 pointer-events-none select-none px-2 animate-fade-in`}
              >
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/45 backdrop-blur-3xl border border-white/25 shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1 ring-white/15">
                  {/* Target Channel Number (Instant 0ms update) */}
                  <span className="font-mono text-[10px] font-bold text-cyan-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/15 shrink-0">
                    #{targetCh.number < 10 ? `0${targetCh.number}` : targetCh.number}
                  </span>

                  {/* White Circular Ring Encircling Channel Logo */}
                  <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 -rotate-90 pointer-events-none" viewBox="0 0 28 28">
                      {/* Background Faint Track */}
                      <circle
                        cx="14"
                        cy="14"
                        r="11"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="2"
                      />
                      {/* Active White Circular Ring: Solid white during rapid zapping, 5s animated countdown once preloading */}
                      <circle
                        key={isPreloading ? `preload_${preloadState?.reqId}` : 'zap_static'}
                        cx="14"
                        cy="14"
                        r="11"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className={isPreloading ? "animate-ring-countdown-5s" : ""}
                        style={!isPreloading ? { strokeDasharray: '69.1', strokeDashoffset: 0 } : undefined}
                      />
                    </svg>
                    {/* Channel Logo Centered Directly INSIDE the White Ring */}
                    <div className="absolute w-5 h-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center p-0.5 shadow-xs">
                      <CachedChannelLogo channel={targetCh} className="w-full h-full object-cover rounded-full" />
                    </div>
                  </div>

                  {/* Target Channel Name (Minimal & Clean, 0ms Instant Update) */}
                  <span className="text-xs font-bold text-white max-w-[150px] sm:max-w-[200px] truncate tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {getLocalizedChannelName(targetCh, language)}
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

          {/* Aspect Ratio Mode HUD / Toast (Triggered by Yellow Remote Key) */}
          {aspectRatioToast && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-scale-up select-none">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950/50 backdrop-blur-3xl border border-amber-400/60 shadow-[0_12px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-amber-400/30 text-white font-sans">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-sm shadow-inner">
                  🟡
                </div>
                <div className="text-start">
                  <div className="text-[10px] text-amber-300 font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <span>شێوازی بینین (Aspect Ratio)</span>
                    <span className="text-slate-400">• دوگمەی زەرد</span>
                  </div>
                  <div className="text-sm font-black text-white tracking-wide">
                    {aspectRatioToast.label}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unified Remote Color Toast Feedback (Red, Green, Yellow, Blue HUD) */}
          {colorToast && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-scale-up select-none">
              <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-slate-950/50 backdrop-blur-3xl border text-white font-sans shadow-[0_12px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] ${
                colorToast.color === 'red' ? 'border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.5)]' :
                colorToast.color === 'green' ? 'border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.5)]' :
                colorToast.color === 'yellow' ? 'border-amber-400/70 shadow-[0_0_25px_rgba(245,158,11,0.5)]' :
                'border-blue-500/70 shadow-[0_0_25px_rgba(59,130,246,0.5)]'
              }`}>
                <span className="text-xs sm:text-sm font-black tracking-wide">{colorToast.message}</span>
              </div>
            </div>
          )}

          {/* Secret Server Indicator Watermark Badge (Discrete OSD - Only Secret Code Badge as requested) */}
          {(() => {
            const fp = getServerFingerprint(selectedChannel);
            return (
              <div 
                className="fixed bottom-3 end-3 z-40 pointer-events-none opacity-30 hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono select-none shadow-lg"
                title={`Server Code: ${fp.code}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${fp.dotColor} animate-pulse`} />
                <span className="text-slate-300 font-bold tracking-wider">{fp.code}</span>
              </div>
            );
          })()}

        </div>
      )}

      {/* ========================================================
          3. VOD SERIES VIEW (Series - Apple TV Dark-Cinema Glassmorphic)
         ======================================================== */}
      {activeTab === 'series' && (
        <div 
          ref={seriesScrollContainerRef}
          tabIndex={0}
          className="relative z-10 p-4 sm:p-8 max-w-7xl mx-auto h-[calc(100vh-110px)] max-h-[calc(100dvh-110px)] overflow-y-auto overflow-x-hidden animate-fade-in custom-internal-scrollbar focus:outline-none overscroll-contain pb-32"
        >
          
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
                <span>{t('series')}</span>
                <span className="text-sm font-normal text-slate-400">({filteredSeries.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-light">
                {language === 'ar' ? 'أفضل وأحدث المسلسلات الكردية والعالمية بجودة سينمائية فائقة.' : language === 'en' ? 'Premier Kurdish and international drama series in ultra HD.' : 'ناوازەترین زنجیرە دراما کوردییەکان و بەرهەمە دۆبلاژکراوەکانی ٢٠٢٥ و ٢٠٢٦ بە بەرزترین کوالێتی و دەنگی سینەمایی.'}
              </p>
            </div>

            {/* Category Filter Pills (Standard 7 VOD Categories) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {seriesCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSeriesCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    seriesCategoryFilter === cat
                      ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? t('all') : getLocalizedVodCategoryName(cat, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Series Grid: Delicate illuminated BLUE border (User requirement: بۆ زنجیرەکان با شین بێت) */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {paginatedSeries.map((item, index) => {
              const isFocused = vodFocusedIndex === index;
              return (
                <div 
                  key={item.id}
                  ref={el => { vodSeriesCardRefs.current[index] = el; }}
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
                    <div className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-lg bg-blue-950/80 backdrop-blur-md text-blue-300 text-[10px] font-bold border border-blue-500/30 truncate max-w-[120px]">
                      {item.category || item.genre || 'دراما'}
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

          {/* Pagination Bar (Apple TV Glassmorphic Pagination: 50 items per page) */}
          {totalSeriesPages > 1 && (
            <div className="relative z-20 mt-10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl sm:rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-blue-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-blue-500/20 animate-fade-in">
              {/* Page Indicator */}
              <div className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                <span className="font-bold text-white">
                  {language === 'ar' ? `صفحة ${seriesCurrentPage} من ${totalSeriesPages}` : language === 'en' ? `Page ${seriesCurrentPage} of ${totalSeriesPages}` : `لاپەڕە ${seriesCurrentPage} لە ${totalSeriesPages}`}
                </span>
                <span className="text-slate-400 text-xs font-normal">
                  ({filteredSeries.length} {t('series')})
                </span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => {
                    setSeriesCurrentPage(1);
                    setVodFocusedIndex(0);
                    seriesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={seriesCurrentPage === 1}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seriesCurrentPage === 1
                      ? 'opacity-30 cursor-not-allowed text-slate-500 bg-white/5'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer border border-white/10'
                  }`}
                >
                  {isRtl ? 'کۆتایی »' : '« سەرەتا'}
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  onClick={() => {
                    if (seriesCurrentPage > 1) {
                      setSeriesCurrentPage(prev => prev - 1);
                      setVodFocusedIndex(0);
                      seriesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={seriesCurrentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seriesCurrentPage === 1
                      ? 'opacity-30 cursor-not-allowed text-slate-500 bg-white/5'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer border border-white/10'
                  }`}
                >
                  {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                  <span>{language === 'ar' ? 'السابق' : language === 'en' ? 'Previous' : 'پێشوو'}</span>
                </button>

                {/* Numbered Page Buttons */}
                {(() => {
                  const delta = 2;
                  const range = [];
                  for (let i = Math.max(1, seriesCurrentPage - delta); i <= Math.min(totalSeriesPages, seriesCurrentPage + delta); i++) {
                    range.push(i);
                  }
                  return range.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setSeriesCurrentPage(p);
                        setVodFocusedIndex(0);
                        seriesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`min-w-[34px] h-8 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        seriesCurrentPage === p
                          ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] border border-blue-400 scale-105'
                          : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ));
                })()}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => {
                    if (seriesCurrentPage < totalSeriesPages) {
                      setSeriesCurrentPage(prev => prev + 1);
                      setVodFocusedIndex(0);
                      seriesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={seriesCurrentPage === totalSeriesPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seriesCurrentPage === totalSeriesPages
                      ? 'opacity-30 cursor-not-allowed text-slate-500 bg-white/5'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer border border-white/10'
                  }`}
                >
                  <span>{language === 'ar' ? 'التالي' : language === 'en' ? 'Next' : 'داهاتوو'}</span>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => {
                    setSeriesCurrentPage(totalSeriesPages);
                    setVodFocusedIndex(0);
                    seriesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={seriesCurrentPage === totalSeriesPages}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    seriesCurrentPage === totalSeriesPages
                      ? 'opacity-30 cursor-not-allowed text-slate-500 bg-white/5'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer border border-white/10'
                  }`}
                >
                  {isRtl ? '« سەرەتا' : 'کۆتایی »'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4. VOD MOVIES VIEW (Movies - Apple TV Dark-Cinema Glassmorphic)
         ======================================================== */}
      {activeTab === 'movies' && (
        <div 
          ref={moviesScrollContainerRef}
          tabIndex={0}
          className="relative z-10 p-4 sm:p-8 max-w-7xl mx-auto h-[calc(100vh-110px)] max-h-[calc(100dvh-110px)] overflow-y-auto overflow-x-hidden animate-fade-in custom-internal-scrollbar focus:outline-none overscroll-contain pb-32"
        >
          
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
                <span>{t('movies')}</span>
                <span className="text-sm font-normal text-slate-400">({filteredMovies.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-light">
                {language === 'ar' ? 'أحدث الأفلام العالمية والسينمائية بدقة 4K فائقة الوضوح.' : language === 'en' ? 'Latest box-office movies in 4K Ultra HD cinema quality.' : 'فیلمە نوێیەکانی ٢٠٢٥ و ٢٠٢٦ بە بەرزترین کوالێتی 4K Ultra HD، دۆبلاژ و ژێرنووسی دەنگی کوردی.'}
              </p>
            </div>

            {/* Category Filter Pills (Standard 7 VOD Categories) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {movieCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setMoviesCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    moviesCategoryFilter === cat
                      ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-400'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? t('all') : getLocalizedVodCategoryName(cat, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Movies Grid: Delicate illuminated RED border (User requirement: چوارەم بۆ فلیم با سور بێت) */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {paginatedMovies.map((item, index) => {
              const isFocused = vodFocusedIndex === index;
              return (
                <div 
                  key={item.id}
                  ref={el => { vodMovieCardRefs.current[index] = el; }}
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

                    {/* Category Badge Top Left */}
                    <div className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-lg bg-rose-950/80 backdrop-blur-md text-rose-300 text-[10px] font-bold border border-rose-500/30 truncate max-w-[120px]">
                      {item.category || item.genre || 'سینەما'}
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
                      <span className="truncate max-w-[120px]">{item.category || item.genre || 'سینەما'}</span>
                      <span className="text-rose-400 flex items-center gap-1 text-[10px] font-bold shrink-0">
                        <span>پەخش</span>
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Bar (Apple TV Glassmorphic Pagination: 50 items per page) */}
          {totalMoviesPages > 1 && (
            <div className="relative z-20 mt-10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl sm:rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-rose-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-rose-500/20 animate-fade-in">
              {/* Page Indicator */}
              <div className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse" />
                <span className="font-bold text-white">
                  {language === 'ar' ? `صفحة ${moviesCurrentPage} من ${totalMoviesPages}` : language === 'en' ? `Page ${moviesCurrentPage} of ${totalMoviesPages}` : `لاپەڕە ${moviesCurrentPage} لە ${totalMoviesPages}`}
                </span>
                <span className="text-slate-400 text-xs font-normal">
                  ({filteredMovies.length} {t('movies')})
                </span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => {
                    setMoviesCurrentPage(1);
                    setVodFocusedIndex(0);
                    moviesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={moviesCurrentPage === 1}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    moviesCurrentPage === 1
                      ? 'opacity-30 cursor-not-allowed text-slate-500 bg-white/5'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer border border-white/10'
                  }`}
                >
                  {isRtl ? 'کۆتایی »' : '« سەرەتا'}
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  onClick={() => {
                    if (moviesCurrentPage > 1) {
                      setMoviesCurrentPage(prev => prev - 1);
                      setVodFocusedIndex(0);
                      moviesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={moviesCurrentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    moviesCurrentPage === 1
                      ? 'opacity-30 cursor-not-allowed text-slate-500 bg-white/5'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer border border-white/10'
                  }`}
                >
                  {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                  <span>{language === 'ar' ? 'السابق' : language === 'en' ? 'Previous' : 'پێشوو'}</span>
                </button>

                {/* Numbered Page Buttons */}
                {(() => {
                  const delta = 2;
                  const range = [];
                  for (let i = Math.max(1, moviesCurrentPage - delta); i <= Math.min(totalMoviesPages, moviesCurrentPage + delta); i++) {
                    range.push(i);
                  }
                  return range.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setMoviesCurrentPage(p);
                        setVodFocusedIndex(0);
                        moviesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`min-w-[34px] h-8 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        moviesCurrentPage === p
                          ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-400 scale-105'
                          : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white border border-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ));
                })()}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => {
                    if (moviesCurrentPage < totalMoviesPages) {
                      setMoviesCurrentPage(prev => prev + 1);
                      setVodFocusedIndex(0);
                      moviesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={moviesCurrentPage === totalMoviesPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    moviesCurrentPage === totalMoviesPages
                      ? 'opacity-30 cursor-not-allowed text-slate-500 bg-white/5'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer border border-white/10'
                  }`}
                >
                  <span>{language === 'ar' ? 'التالي' : language === 'en' ? 'Next' : 'داهاتوو'}</span>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => {
                    setMoviesCurrentPage(totalMoviesPages);
                    setVodFocusedIndex(0);
                    moviesScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={moviesCurrentPage === totalMoviesPages}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    moviesCurrentPage === totalMoviesPages
                      ? 'opacity-30 cursor-not-allowed text-slate-500 bg-white/5'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer border border-white/10'
                  }`}
                >
                  {isRtl ? '« سەرەتا' : 'کۆتایی »'}
                </button>
              </div>
            </div>
          )}
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

                {/* Quick Play Action Button & Trailer Preview */}
                <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
                  {selectedVodType === 'movie' ? (
                    (() => {
                      const savedProg = getVodProgress(selectedVodItem.id, 0);
                      return (
                        <button
                          onClick={() => playVodStream(selectedVodItem)}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm sm:text-base shadow-[0_0_30px_rgba(244,63,94,0.6)] border border-rose-400 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
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
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-[0_0_30px_rgba(59,130,246,0.6)] border border-blue-400 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          <span>{savedProg > 10 ? `بەردەوامبوون: ئەڵقەی ١ (${formatVodTime(savedProg)})` : 'پەخشکردنی ئەڵقەی ١'}</span>
                        </button>
                      );
                    })()
                  )}

                  {/* Trailer Preview Button */}
                  <button
                    onClick={() => setTrailerModalItem(selectedVodItem)}
                    className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg"
                    title="سەیرکردنی ترەیلەر"
                  >
                    <Film className="w-4 h-4 text-amber-400" />
                    <span>ترەیلەر (Trailer)</span>
                  </button>
                </div>
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
              {selectedVodType === 'series' && (
                isFetchingEpisodes ? (
                  <div className="border-t border-white/10 pt-6 flex flex-col items-center justify-center py-8 gap-2 text-cyan-300">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                    <span className="text-sm font-bold">خەریکی بارکردنی ئەڵقەکانی ئەم زنجیرەیەیە لە سێرڤەرەوە...</span>
                  </div>
                ) : (!selectedVodItem.episodes || selectedVodItem.episodes.length === 0) ? (
                  <div className="border-t border-white/10 pt-6 flex flex-col items-center justify-center py-6 gap-3">
                    <p className="text-xs text-slate-300">ئەڵقەکان لە سێرڤەرەوە ئامادە دەکرێن.</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedVodItem.seriesId) {
                          setIsFetchingEpisodes(true);
                          fetchSeriesEpisodes(activeXtreamConfig, selectedVodItem.seriesId).then(res => {
                            setIsFetchingEpisodes(false);
                            if (res.success && res.episodes?.length > 0) {
                              setSelectedVodItem(prev => prev ? { ...prev, episodes: res.episodes } : null);
                            }
                          });
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>بارکردنی ئەڵقەکان</span>
                    </button>
                  </div>
                ) : (
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
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. DEDICATED FULLSCREEN CINEMA VOD PLAYER (FOR MOVIES & SERIES)
          - 100% Isolated from Live TV (Never mixes with live channels)
          - Scrubber bar with touch scrubbing and remote controls
          - Time display (current / duration)
          - Skip buttons: -10s rewind, +10s fast forward
          - Next Episode button & Episode Drawer for series
          - Close button (X) returns smoothly to the Series or Movies catalog
         ========================================================================= */}
      {cinemaSession && (
        <VodPlayer
          session={cinemaSession}
          onClose={closeCinemaPlayer}
          onPlayEpisode={(item, ep) => playVodStream(item, ep)}
          onNextEpisode={playNextEpisode}
          getVodProgress={getVodProgress}
          saveVodProgress={saveVodProgress}
        />
      )}

      {/* ========================================================
          5. SETTINGS VIEW (ڕێکخستن و لێدانی کۆدی بەشداری)
         ======================================================== */}
      {activeTab === 'settings' && (
        <div 
          tabIndex={0}
          className="relative z-10 px-4 sm:px-8 pt-4 pb-28 max-w-4xl mx-auto h-[calc(100vh-110px)] max-h-[calc(100dvh-110px)] overflow-y-auto overflow-x-hidden animate-fade-in custom-internal-scrollbar focus:outline-none overscroll-contain select-text"
        >
          <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-apple-lg space-y-6 mb-12">
            
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <span>{t('settingsTitle')}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">{t('settingsSubtitle')}</p>
            </div>

            {/* Unique Screen Device Code Identification Card (Every TV/Device has its own ID) */}
            <div className="bg-slate-900/60 border border-white/15 rounded-2xl p-5 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-start">
                <div className="p-3 rounded-2xl bg-cyan-600/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{t('screenCodeTitle')}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 font-mono">ID</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {t('screenCodeDesc')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(uniqueScreenCode);
                    onNotify?.({
                      title: t('screenLinkCopied'),
                      message: uniqueScreenCode,
                      type: 'success'
                    });
                  } catch(e) {}
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-mono font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                title={t('copyCode')}
              >
                <span>{uniqueScreenCode}</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Activation Code Box on TV */}
            <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-400/30 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-300" />
                <span>{t('activationTitle')}</span>
              </h3>
              <p className="text-[11px] text-slate-300 mb-3">
                {t('activationDesc')}
              </p>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t('activationPlaceholder')}
                  value={activationCodeInput}
                  onChange={(e) => setActivationCodeInput(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleRedeemCode}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {t('activateBtn')}
                </button>
              </div>
            </div>

            {/* Account Information Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                {t('accountDetails')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t('username')}</span>
                  <span className="font-bold text-white">{currentUser.name}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t('plan')}</span>
                  <span className="font-bold text-emerald-400">{userPlanTitle}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t('deviceMac')}</span>
                  <span className="font-mono text-blue-300">{currentUser?.deviceMac || '00:1A:79:FREE:NNDD'}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t('statusDays')}</span>
                  <span className="font-bold text-amber-300">
                    {userPlanTier === 'free' ? t('freePlan') : t('daysRemaining', { days: subscriptionDaysRemaining })}
                  </span>
                </div>
              </div>
            </div>

            {/* Protected Admin & Server Settings Gateway (Hidden from Members) */}
            {!isEditUnlocked ? (
              <div className="bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3.5 text-start">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>ڕێکخستنی سێرڤەری سەرەکی و ئەدمین (Admin & Server Controls)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                        پارێزراوە بە PIN
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      زانیارییەکانی سێرڤەر، هۆست، وشەی نهێنی و بەڕێوەبردنی کەناڵەکان بە PIN پارێزراون تا ئەندامان نەیبینن. بەڕێوەبەر بە لێدانی PIN دەتوانێت سێرڤەر بگۆڕێت یان بچێتە ناو تەواوی ئەدمین پانێڵ (Google Sheets ERP).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPendingEditAction('server');
                    setEditPinInput('');
                    setEditPinError('');
                    setIsEditPinModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>کردنەوەی بەشی ئەدمین</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Admin Unlocked Header Ribbon */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        بەشی ئەدمین و سێرڤەر کراوەتەوە (Admin Mode Active)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        دەتوانیت سێرڤەر بگۆڕیت یان بچیتە ناو تەواوی ئەدمین پانێڵی شێوە گۆگڵ شێت
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => onSwitchToAdmin?.()}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer border border-emerald-400/30"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>چوونە ناو ئەدمین پانێڵ (Google Sheets ERP)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditUnlocked(false)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
                      title="داخستن و قفڵکردنەوە"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>قفڵکردنەوە</span>
                    </button>
                  </div>
                </div>

                {/* Xtream Codes Multi-Server Architecture & Cache Clear Manager */}
                <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-[0_4px_25px_rgba(6,182,212,0.12)]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-400" />
                      <span>ڕێکخستنی سێرڤەری سەرەکی (Xtream Codes Server)</span>
                    </h3>
                {(() => {
                  const fp = getServerFingerprint();
                  return (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${fp.dotColor}`} />
                      <span>{fp.code}</span>
                    </span>
                  );
                })()}
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                گۆڕینی هۆست و هەژماری Xtream Codes. لە کاتی سەیڤکردندا، تەواوی کاشی پێشوو و لیستی کۆن بە تەواوی دەسڕێنەوە و کەناڵەکان ڕاستەوخۆ لە سێرڤەرە نوێیەکە هاوردە دەکرێن:
              </p>

              {/* Server Selection Mode Switcher (Dedicated vs Auto) */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>دۆخی هەڵبژاردنی سێرڤەر (Server Selection Mode):</span>
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    serverMode === 'auto'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {serverMode === 'auto' ? '⚡ ئۆتۆماتیک کارایە' : '🔒 سێرڤەری دیاریکراو کارایە'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Option 1: Dedicated Server Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setServerMode('dedicated');
                      showServerModeToast('dedicated');
                    }}
                    className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                      serverMode === 'dedicated'
                        ? 'bg-cyan-500/15 border-cyan-400/60 ring-1 ring-cyan-400/30 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-white">
                      <Lock className={`w-3.5 h-3.5 ${serverMode === 'dedicated' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>سێرڤەری دیاریکراو (Dedicated Server)</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      کۆدی شاشە کۆدی ئەو سێرڤەرە دەبێت کە هەڵت بژاردووە. ئەگەر کەناڵێک پەخشی نەبوو، سێرڤەرەکەی ناگۆڕدرێت لەسەر سێرڤەرێکی تر.
                    </p>
                  </button>

                  {/* Option 2: Automatic Discovery Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setServerMode('auto');
                      showServerModeToast('auto');
                    }}
                    className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                      serverMode === 'auto'
                        ? 'bg-amber-500/15 border-amber-400/60 ring-1 ring-amber-400/30 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-white">
                      <Zap className={`w-3.5 h-3.5 ${serverMode === 'auto' ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                      <span>ئۆتۆماتیک (Auto Switch)</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      کەناڵەکە خۆی زۆر خێرا (لە ٢ چرکەدا) سێرڤەری ئیشکەر دەدۆزێتەوە، دەچێتە سەر هەمان سێرڤەر و کۆدی سەر شاشەش دەگۆڕێت.
                    </p>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1.5">
                  سێرڤەرە ئامادەکراوەکان (Quick Presets):
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      name: 'Lion 4K OTT (سێرڤەری نوێ)',
                      host: 'http://line.liondnscloud.ru',
                      username: '914cd705',
                      password: '6c86e923',
                      code: 'LION-4K'
                    },
                    {
                      name: 'TREX IPTV Server',
                      host: 'http://vpn.trxdnscloud.ru',
                      username: '11d68d6be9',
                      password: '1efc2bb76bc7',
                      code: 'TRX-V1'
                    },
                    {
                      name: 'NINJA OTT Server',
                      host: 'https://s1.1234.ninja',
                      username: '22794645',
                      password: '67879152',
                      code: 'NJ-V1'
                    },
                    {
                      name: 'COBRA IPTV Server',
                      host: 'http://m3um9xplus.com:8080',
                      username: 'cbr_user',
                      password: 'cbr_password',
                      code: 'CBR-V1'
                    }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setServerForm({
                          name: preset.name,
                          host: preset.host,
                          username: preset.username,
                          password: preset.password
                        });
                        if (preset.code) {
                          setCustomOsdCode(preset.code);
                        }
                        setServerTestResult(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-[10px] font-semibold text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span>⚡</span>
                      <span>{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Server Host / Credentials Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    {t('serverLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder="LION / TREX / NINJA"
                    value={serverForm?.name || ''}
                    onChange={(e) => setServerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    {t('hostUrl')}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="http://line.liondnscloud.ru"
                    value={serverForm?.host || ''}
                    onChange={(e) => setServerForm(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:border-cyan-400 text-left"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    {t('username')}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="Username"
                    value={serverForm?.username || ''}
                    onChange={(e) => setServerForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:border-cyan-400 text-left"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    {t('password')}
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    placeholder="Password"
                    value={serverForm?.password || ''}
                    onChange={(e) => setServerForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:border-cyan-400 text-left"
                  />
                </div>

                {/* Custom Live OSD Server Code Field */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    {t('liveOsdCode')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="LION-V1 / TRX-V1"
                      value={customOsdCode}
                      onChange={(e) => setCustomOsdCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white/10 border border-white/20 text-amber-300 placeholder-slate-500 outline-none focus:border-amber-400 text-left uppercase"
                    />
                    <div className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-[11px] font-mono text-amber-300 shrink-0 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>{customOsdCode.trim().toUpperCase() || 'AUTO'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Result Message */}
              {serverTestResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  serverTestResult.success 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {serverTestResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span className="leading-snug">{serverTestResult.message}</span>
                </div>
              )}

              {/* Action Buttons: Test Connection & Save & Clear Cache */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestServerConnection(serverForm)}
                  disabled={isTestingServer || isRefreshingServer}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingServer ? 'animate-spin' : ''}`} />
                  <span>{isTestingServer ? t('testingConnection') : t('testConnection')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyServerCredentials(serverForm)}
                  disabled={isRefreshingServer || isTestingServer}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingServer ? 'animate-spin' : ''}`} />
                  <span>{t('saveAndClearCache')}</span>
                </button>
              </div>

              {/* Saved Servers List & Comparison */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>سێرڤەرە پاشەکەوتکراوەکان و بەراوردکاری (Saved Servers & Comparison):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">بۆ سویچکردن یان بەراوردی خێرایی (Ping)</span>
                </div>

                <div className="space-y-2">
                  {getStoredServers().map(srv => {
                    const isCurrentActive = (activeXtreamConfig?.host === srv.serverUrl || (srv.type === 'xtream' && activeXtreamConfig?.username === srv.username));
                    return (
                      <div 
                        key={srv.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isCurrentActive
                            ? 'bg-cyan-500/15 border-cyan-400/50 shadow-md ring-1 ring-cyan-400/30'
                            : 'bg-black/30 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrentActive ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
                          }`}>
                            {srv.type === 'xtream' ? 'X' : 'M3U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{srv.name}</span>
                              {isCurrentActive && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950">سەرەکی</span>
                              )}
                              {srv.latencyMs > 0 && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {srv.latencyMs}ms
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-xs">
                              {srv.serverUrl} {srv.username ? `• (${srv.username})` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTestServerConnection({ host: srv.serverUrl, username: srv.username, password: srv.password })}
                            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>پشکنین</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const targetCfg = {
                                name: srv.name,
                                host: srv.serverUrl,
                                username: srv.username || '',
                                password: srv.password || ''
                              };
                              setServerForm(targetCfg);
                              applyServerCredentials(targetCfg);
                            }}
                            disabled={isCurrentActive || isRefreshingServer}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 ${
                              isCurrentActive
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 cursor-default opacity-80'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black cursor-pointer shadow-sm'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isCurrentActive ? 'سێرڤەری سەرەکییە' : 'بیکە بە سەرەکی'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Localhost & External Channels Manager (سەرچاوەی کەناڵەکان لە لۆکاڵ هۆست) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>{t('channelsSource')}</span>
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t('channelsActive', { count: channels.length })}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {t('channelsSourceDesc')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="http://localhost:3000/channels.json"
                  value={channelsApiUrl}
                  onChange={(e) => setChannelsApiUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none focus:border-emerald-400"
                />
                <button
                  onClick={() => reloadChannelsFromSource(channelsApiUrl)}
                  disabled={syncStatus === 'loading'}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'loading' ? 'animate-spin' : ''}`} />
                  <span>{t('reloadFromSource')}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    setChannelsApiUrl('/channels.json');
                    reloadChannelsFromSource('/channels.json');
                  }}
                  className="text-[10px] text-slate-400 hover:text-white underline transition-colors cursor-pointer"
                >
                  {t('restoreDefaultSource')}
                </button>
              </div>
            </div>
          </div>
        )}

            {/* LocalStorage Logo Cache Manager (سەیڤکردنی لۆگۆکان لە ناو ئەپ) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t('logoCacheTitle')}</span>
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {cachedLogosCount} / {channels.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {t('logoCacheDesc')}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleManualCacheAllLogos}
                  disabled={isCachingLogos}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCachingLogos ? 'animate-spin' : ''}`} />
                  <span>{isCachingLogos ? t('testingConnection') : t('saveAllLogos')}</span>
                </button>

                <button
                  onClick={handleClearLogoCache}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  {t('clearCache')}
                </button>
              </div>
            </div>

            {/* Player Engine Selector */}
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-2">
                {t('playerEngine')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Hls.js Ultra Low Latency', 'Native HTML5 Video Engine'].map(engine => (
                  <button
                    key={engine}
                    onClick={() => setSelectedPlayerEngine(engine)}
                    className={`p-3.5 rounded-2xl border text-start text-xs font-bold transition-all cursor-pointer ${
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

            {/* Language Switcher Card (Kurdish, Arabic, English) */}
            <div className="bg-slate-900/60 border border-white/15 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>{t('languageSection')}</span>
                </label>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                  {SUPPORTED_LANGUAGES.find(l => l.id === language)?.nativeName}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {t('languageDesc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`px-4 py-3 rounded-2xl border text-start transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-95 ${
                        isSelected
                          ? 'bg-white text-slate-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.45)] ring-2 ring-white/50 font-bold'
                          : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{lang.flag}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-tight">{lang.label}</span>
                          <span className={`text-[9px] ${isSelected ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
                            {lang.dir === 'rtl' ? (lang.id === 'ku' ? 'دەستە ڕاست (RTL)' : 'يمين الشاشة (RTL)') : 'Left Screen (LTR)'}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UI Font Selector for TV */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-purple-400" />
                  <span>{t('typography')}</span>
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
              <h2 className="text-2xl font-black text-white">{t('aboutTitle')}</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                {t('poweredBy')}
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

            {/* Direct APK Download for Android TV & Mobile */}
            <div className="pt-2">
              <a
                href="/NNDD-TV-app.apk"
                download="NNDD-TV-app.apk"
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 active:scale-95 transition-all border border-cyan-300/30 group"
              >
                <Download className="w-5 h-5 text-white animate-bounce group-hover:scale-110 transition-transform" />
                <span>دابەزاندنی ئەپڵیکەیشن بۆ تەلەفزیۆن و مۆبایل (APK)</span>
              </a>
              <span className="text-[11px] text-cyan-300/80 block mt-2 font-mono">
                Direct APK Download (Android TV / Box / Phone • 5.2 MB)
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              For subscriptions and inquiries, contact us.
            </p>
          </div>
        </div>
      )}


      {/* ========================================================
          REDESIGNED SUBSCRIPTION & PACKAGES MODAL (PRO & VOD GUARD)
         ======================================================== */}
      {showSubscriptionAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in select-none">
          <div className="bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-center space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-cyan-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/30 shadow-lg shadow-amber-500/10">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 inline-block mb-2 font-mono">
                NNDD SUBSCRIPTION ARCHITECTURE
              </span>
              <h3 className="text-xl font-black text-white tracking-wide flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>پلان و بەستەکانی NNDD TV</span>
              </h3>
            </div>

            {/* Pricing Packages Grid (4 Tiers) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrent = (userPlanTier === plan.tier) || (plan.tier === 'free' && userPlanTier === 'free');
                const Icon = plan.iconName === 'Crown' ? Crown : plan.iconName === 'Flame' ? Flame : plan.iconName === 'Zap' ? Zap : Tv;
                return (
                  <div
                    key={plan.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all backdrop-blur-xl ${
                      isCurrent
                        ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
                        : 'bg-white/[0.05] hover:bg-white/[0.12] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-white flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg border ${
                            plan.tier === 'ultra' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
                            plan.tier === 'pro_plus' ? 'bg-purple-500/20 text-purple-300 border-purple-400/40' :
                            plan.tier === 'pro' ? 'bg-blue-500/20 text-cyan-300 border-cyan-400/40' :
                            'bg-slate-500/20 text-slate-300 border-slate-400/30'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span>{plan.name}</span>
                          {isCurrent && <span className="text-[9px] text-emerald-400 font-bold">✓ چالاکە</span>}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 font-bold font-mono">
                          {plan.creditsAllocated} Cr
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {plan.quality} • {plan.tier === 'free' ? '٥٠٩ کەناڵی بێبەرامبەر' : 'VOD + Live'}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-white/10">
                      <span className="font-mono text-sm font-black text-amber-300">{plan.price}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {plan.tier === 'free' ? 'هەمیشەیی' : `${plan.durationDays} ڕۆژ`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Code Entry Box */}
            <div className="p-3.5 bg-white/[0.04] border border-white/10 rounded-2xl text-start backdrop-blur-xl">
              <label className="text-[11px] text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>کۆدی چالاککردن:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="DIAMOND-1Y-2026 یان PRO-3M-2026"
                  value={activationCodeInput}
                  onChange={(e) => setActivationCodeInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none focus:border-cyan-400 uppercase"
                />
                <button
                  onClick={handleRedeemCode}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/25 border border-cyan-400/30"
                >
                  چالاککردن
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-white/5 rounded-xl text-xs text-slate-400 font-mono flex items-center justify-between">
              <span>ئامێرەکەت: {currentUser?.deviceMac || 'NNDD-FREE-BOX'}</span>
              <span className="text-amber-300 font-bold">پلان: {userPlanTitle}</span>
            </div>

            {/* Direct WhatsApp Subscription Button */}
            <div className="flex flex-col gap-2 pt-1">
              <a
                href="https://wa.me/9647709709346?text=سڵاو،%20داوای%20بەشداری%20پلانی%20پرۆ%20بۆ%20زنجیرەکان%20دەکەم"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>داواکردنی کۆدی پرۆ لە وەتسئەپ (07709709346)</span>
              </a>

              <button
                onClick={() => {
                  setShowSubscriptionAlert(false);
                  setActiveTab('live');
                }}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>گەڕانەوە بۆ کەناڵە بێبەرامبەرەکان (Live TV)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          2-SECOND CINEMATIC LOGO SPLASH OVERLAY
         ======================================================== */}
      {sectionWelcome && (
        <div 
          onClick={() => {
            if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
            setSectionWelcome(null);
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl transition-all duration-500 animate-fade-in select-none cursor-pointer p-6"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none animate-pulse" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg space-y-6 animate-scale-up">
            {/* Pure NNDD TV 3D Animated Crystal Prism Logo */}
            <div className="transform transition-transform duration-700 animate-logo-float">
              <NnddLogo animated={true} className="h-24 sm:h-32 w-auto filter drop-shadow-[0_0_40px_rgba(0,242,254,0.6)]" />
            </div>

            {/* 2-Second Linear Progress Bar */}
            <div className="w-56 sm:w-72 h-1 bg-white/10 rounded-full overflow-hidden relative border border-white/10">
              <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-400 rounded-full animate-section-progress-2s" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          YOUTUBE TRAILER PREVIEW MODAL
         ======================================================== */}
      {trailerModalItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in select-none"
          onClick={() => setTrailerModalItem(null)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setTrailerModalItem(null)}
              className="absolute top-4 end-4 z-20 w-9 h-9 rounded-full bg-black/75 text-white flex items-center justify-center border border-white/20 hover:bg-black transition-all cursor-pointer shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(trailerModalItem.title + ' trailer')}&autoplay=1`}
              title="Trailer Preview"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
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
                <strong className="text-rose-400">{getLocalizedChannelName(pendingLockedChannel, language)}</strong> is locked. Enter 4-digit PIN:
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

      {/* ========================================================
          EDIT & SORT PIN PROTECTION MODAL (PIN: 0000)
         ======================================================== */}
      {isEditPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" data-interactive="true">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-apple-lg text-center space-y-4 animate-slide-up">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                تایبەت بە بەڕێوەبەر (Edit & Sort)
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                تکایە تێپەڕەوشەی ٤ ژمارەیی بنووسە بۆ دەستکاریکردن:
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyEditPin();
              }}
              className="space-y-3"
            >
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={editPinInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditPinInput(val);
                  setEditPinError('');
                  if (val.length === 4) {
                    handleVerifyEditPin(val);
                  }
                }}
                className="w-36 mx-auto text-center tracking-[1em] text-2xl font-mono py-2 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />

              {editPinError && (
                <p className="text-xs text-rose-400 font-semibold">{editPinError}</p>
              )}

              <p className="text-[11px] text-slate-400">تێپەڕەوشەی بنەڕەتی: 0000</p>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs active:scale-95 transition-all shadow-apple-sm"
                >
                  کرانەوە (Unlock)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditPinModalOpen(false);
                    setPendingEditAction(null);
                    setEditPinInput('');
                    setEditPinError('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold"
                >
                  داخستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual "Refreshing Server..." Loading Modal Overlay */}
      {isRefreshingServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in select-none">
          <div className="bg-slate-900/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center space-y-4 animate-scale-up">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Server className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                نوێکردنەوەی سێرڤەر...
              </h3>
              <p className="text-xs text-slate-300 mt-2 min-h-[32px] font-medium leading-relaxed">
                {refreshingServerMessage || t('serverUpdatingWait')}
              </p>
            </div>

            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-full animate-pulse" />
            </div>
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

