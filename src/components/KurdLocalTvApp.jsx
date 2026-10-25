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
  MessageCircle,
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
  Table,
  LogOut
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
import { getStoredServerSettings, getStoredServers, saveStoredServers, saveStoredServerSettings, detectServerBadge, purgeAllThirdPartyServers } from '../data/serverManager';
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
import { loadPersistentChannels, savePersistentChannels, ensureDabinChannelFirst, DABIN_OFFICIAL_CHANNEL, savePersistentVod, loadPersistentVod } from '../data/dbStorage';
import VodPlayer from './VodPlayer';
import DynamicWeatherWidget from './DynamicWeatherWidget';
import ServerControlCenterModal from './ServerControlCenterModal';
import { KURDISH_PLAYLIST_CHANNELS } from '../data/kurdishPlaylist';
import DabinChannelPlayer from './DabinChannelPlayer';
import { isDeviceServerActive, updateDeviceActivity } from '../data/resellerData';
import { subscribeToClientDeviceHotSwap, autoRegisterClientDevice, getApiBaseUrl, universalFetch } from '../data/dabinRealtimeService';
import { syncDeviceIdentityWithNetwork } from '../data/deviceManager';
import TriLingualKeyboard, { KU_KEYBOARD_KEYS, AR_KEYBOARD_KEYS, EN_KEYBOARD_KEYS } from './tv/TriLingualKeyboard';
import LiveZapOverlay from './tv/LiveZapOverlay';
import CinemaDock from './tv/CinemaDock';
import ChannelDrawer from './tv/ChannelDrawer';
import CinematicBackground from './tv/CinematicBackground';

export function getSavedKobinSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('kobin_tv_session');
    if (!raw) return null;
    const sess = JSON.parse(raw);
    if (!sess) return null;
    return sess;
  } catch (e) {
    return null;
  }
}

export function isKobinSessionExpired(session) {
  if (!session) return true;
  if (session.status === 'expired' || session.status === 'banned') return true;
  const exp = session.exp_date || session.app_expiry_date || session.expiresAt;
  if (exp) {
    const expMs = isNaN(exp) ? new Date(exp).getTime() : Number(exp) * 1000;
    if (expMs > 0 && Date.now() > expMs) {
      return true;
    }
  }
  return false;
}

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
  const [isServerControlOpen, setIsServerControlOpen] = useState(false);

  // Global Server Switching & Channel Update Sync
  useEffect(() => {
    const handleChannelsUpdated = (e) => {
      const freshList = Array.isArray(e.detail) ? e.detail : (e.detail?.channels || null);
      if (freshList && Array.isArray(freshList) && freshList.length > 0) {
        setChannels(freshList);
        setSelectedChannel(freshList[0]);
        persistentTargetChannelRef.current = freshList[0];
        persistentTargetIndexRef.current = 0;
        if (activeTab === 'live') {
          performChannelSwitch(freshList[0], true);
        }
      }
    };
    const handleServerSwitched = (e) => {
      const srv = e.detail;
      if (srv) {
        if (srv.type === 'xtream' && srv.serverUrl) {
          setActiveXtreamConfig({
            host: srv.serverUrl.replace(/\/+$/, ''),
            username: srv.username || '',
            password: srv.password || '',
            name: srv.name
          });
        } else {
          setActiveXtreamConfig(null);
        }
      }
    };
    window.addEventListener('nndd_channels_updated', handleChannelsUpdated);
    window.addEventListener('nndd_server_switched', handleServerSwitched);
    return () => {
      window.removeEventListener('nndd_channels_updated', handleChannelsUpdated);
      window.removeEventListener('nndd_server_switched', handleServerSwitched);
    };
  }, [activeTab]);

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

  // Dual-Player Preloading & Seamless Switching Engine (Event-Driven Architecture)
  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const [activeSlot, setActiveSlot] = useState('A'); // 'A' or 'B'
  const controllersRef = useRef({
    A: { hls: null, mpegts: null, reqId: 0, watchdog: null, abortController: null, url: '' },
    B: { hls: null, mpegts: null, reqId: 0, watchdog: null, abortController: null, url: '' }
  });

  // Stream Engine Format ('m3u8' for HLS vs 'ts' for raw MPEG-TS)
  const [streamEngine, setStreamEngine] = useState(() => {
    try {
      return localStorage.getItem('nndd_stream_engine') || 'm3u8';
    } catch(e) {
      return 'm3u8';
    }
  });

  // Channel Drawer Active Pane ('channels' | 'categories') & Keyboard Category Index
  const [drawerActivePane, setDrawerActivePane] = useState('channels');
  const [categoryFocusedIndex, setCategoryFocusedIndex] = useState(0);

  // Preloading & 5-Second Auto-Switch Machine with Rapid Zap Debounce & White Circle Countdown
  const [preloadState, setPreloadState] = useState(null); // { targetChannel, slot: 'A'|'B', reqId, startedAt }
  const preloadStateRef = useRef(null);
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
  // Zero-Black-Screen Freeze-Frame Zapping (Strict Single-Connection Protection)
  const freezeCanvasRef = useRef(null);
  const [isFreezeFrameActive, setIsFreezeFrameActive] = useState(false);
  const [freezeFrameFadingOut, setFreezeFrameFadingOut] = useState(false);
  const freezeFadeTimerRef = useRef(null);
  const pendingSwitchTimeoutRef = useRef(null);

  // Helper to determine if a channel is from LionOTT / third-party M3U (max_connections = 1)
  const isLionOttChannel = (ch) => {
    if (!ch) return false;
    if (ch.id === 'ch-dabin-tv-custom' || ch.isCustomDabinChannel) return false;
    return true;
  };

  // Capture current video frame onto overlay canvas
  const captureVideoFreezeFrame = () => {
    try {
      const activeVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
      const canvas = freezeCanvasRef.current;
      if (!activeVideo || !canvas) return false;

      const w = activeVideo.videoWidth || activeVideo.clientWidth || 1280;
      const h = activeVideo.videoHeight || activeVideo.clientHeight || 720;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(activeVideo, 0, 0, w, h);
          if (freezeFadeTimerRef.current) {
            clearTimeout(freezeFadeTimerRef.current);
            freezeFadeTimerRef.current = null;
          }
          setFreezeFrameFadingOut(false);
          setIsFreezeFrameActive(true);
          return true;
        }
      }
    } catch (e) {
      console.warn('[FreezeFrame] Canvas capture skipped:', e);
    }
    return false;
  };

  // Fade out freeze frame in 150ms once first real frame of new stream decodes
  const dismissFreezeFrame = () => {
    if (!isFreezeFrameActive && !freezeFrameFadingOut) return;
    setFreezeFrameFadingOut(true);
    if (freezeFadeTimerRef.current) clearTimeout(freezeFadeTimerRef.current);
    freezeFadeTimerRef.current = setTimeout(() => {
      setIsFreezeFrameActive(false);
      setFreezeFrameFadingOut(false);
      freezeFadeTimerRef.current = null;
    }, 150);
  };
  const seriesScrollContainerRef = useRef(null);
  const moviesScrollContainerRef = useRef(null);
  const vodSeriesCardRefs = useRef([]);
  const vodMovieCardRefs = useRef([]);
  const settingsScrollRef = useRef(null);

    const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const startCountdown = () => {
    clearCountdown();
    setCountdownRemaining(5);
    countdownIntervalRef.current = setInterval(() => {
      setCountdownRemaining(prev => {
        if (prev <= 1) {
          clearCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

  // VOD Series & Movies State (100% Real LionOTT Data — No Mocks)
  const [internalVodSeries, setInternalVodSeries] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_vod_series_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Clean legacy mock items: ensure real xtream items only
        const realItems = Array.isArray(parsed) 
          ? parsed.filter(item => item && (item.seriesId || item.id?.startsWith('xtream-series-'))) 
          : [];
        if (realItems.length > 0) return realItems;
      }
    } catch(e) {}
    return [];
  });
  const vodSeries = (vodSeriesProp && vodSeriesProp.length > 0) ? vodSeriesProp : internalVodSeries;
  const setVodSeries = setVodSeriesProp || setInternalVodSeries;

  const [internalVodMovies, setInternalVodMovies] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_vod_movies_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Clean legacy mock items: ensure real xtream items only
        const realItems = Array.isArray(parsed) 
          ? parsed.filter(item => item && (item.streamId || item.id?.startsWith('xtream-movie-') || !item.id?.startsWith('mov-'))) 
          : [];
        if (realItems.length > 0) return realItems;
      }
    } catch(e) {}
    return [];
  });
  const vodMovies = (vodMoviesProp && vodMoviesProp.length > 0) ? vodMoviesProp : internalVodMovies;
  const setVodMovies = setVodMoviesProp || setInternalVodMovies;


  // Instant 0ms IndexedDB VOD Cache Boot
  useEffect(() => {
    loadPersistentVod('movies').then(movies => {
      if (Array.isArray(movies) && movies.length > 0) {
        setInternalVodMovies(prev => prev.length === 0 ? movies : prev);
      }
    });
    loadPersistentVod('series').then(series => {
      if (Array.isArray(series) && series.length > 0) {
        setInternalVodSeries(prev => prev.length === 0 ? series : prev);
      }
    });
  }, []);

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
      const sess = getSavedKobinSession();
      if (sess && !isKobinSessionExpired(sess) && sess.username && sess.password) {
        return {
          host: (sess.server_url || 'http://line.liondnscloud.ru:80').replace(/\/+$/, ''),
          username: sess.username,
          password: sess.password,
          name: 'KOBIN TV Server',
          type: 'xtream'
        };
      }
      const rawCfg = localStorage.getItem('nndd_active_xtream_config');
      if (rawCfg) {
        const parsed = JSON.parse(rawCfg);
        if (parsed && parsed.username && parsed.password) {
          return {
            host: (parsed.host || 'http://line.liondnscloud.ru:80').replace(/\/+$/, ''),
            username: parsed.username,
            password: parsed.password,
            name: parsed.name || 'KOBIN TV Server',
            type: 'xtream'
          };
        }
      }
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

  // Auto-Purge defunct and malicious servers if stored in localStorage
  useEffect(() => {
    try {
      const currentVersion = '10.0.0-kobin-tv';
      const rawStored = localStorage.getItem('nndd_active_xtream_config');
      const rawCached = localStorage.getItem('nndd_cached_channels');
      const isStale = (rawStored && rawStored.includes('elg-26')) ||
                      (rawCached && (rawCached.includes('elg-26.com') || rawCached.includes('srv-elg26')));

      if (isStale) {
        console.warn('[Cache Buster] Purging defunct third-party servers');
        localStorage.setItem('nndd_playlist_version', currentVersion);
        purgeAllThirdPartyServers();
        localStorage.removeItem('nndd_cached_channels');
        localStorage.removeItem('nndd_server_imported');
        localStorage.removeItem('nndd_server_channels_count');
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
        const isServerImported = localStorage.getItem('nndd_server_imported') === 'true';
        const serverCount = parseInt(localStorage.getItem('nndd_server_channels_count') || '0', 10);
        if (!isServerImported && serverCount === 0) {
          const url = localStorage.getItem('nndd_channels_api_url') || (isCapacitor ? 'https://nndd-tv.vercel.app/channels.json' : '/channels.json');
          const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const cachedStr = localStorage.getItem('nndd_cached_channels');
              const newStr = JSON.stringify(data);
              if (cachedStr !== newStr) {
                setChannels(data);
                try { localStorage.setItem('nndd_cached_channels', newStr); } catch(e) {}
              }
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
          if (!ch.url || ch.url.startsWith('custom:')) return;
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
    // 0. Handle Official Free M3U8 Server (srv-nndd-free) or M3U Server
    if (!newConfig || newConfig.id === 'srv-nndd-free' || newConfig.type === 'm3u' || !newConfig.username) {
      setIsRefreshingServer(true);
      setRefreshingServerMessage('سڕینەوەی کاش و هاوردەکردنی کەناڵەکانی سێرڤەری فەرمی NNDD...');

      try {
        localStorage.removeItem('nndd_cached_channels');
        localStorage.removeItem('nndd_last_channel_id');
        localStorage.removeItem('nndd_active_xtream_config');
        localStorage.setItem('nndd_custom_osd_server_code', 'KOBIN');
        setCustomOsdCode('KOBIN');
        setActiveXtreamConfig(null);

        // Force complete reset of player controllers
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

        // Synchronize in stored servers
        try {
          const storedServers = getStoredServers();
          const updated = storedServers.map(s => ({
            ...s,
            isPrimary: s.id === 'srv-nndd-free',
            status: s.id === 'srv-nndd-free' ? 'active' : (s.status === 'expired' ? 'expired' : 'standby')
          }));
          saveStoredServers(updated);
          saveStoredServerSettings({ ...getStoredServerSettings(), activeServerId: 'srv-nndd-free' });
        } catch(e) {}

        const freeChannels = [DABIN_OFFICIAL_CHANNEL];
        setChannels(freeChannels);
        savePersistentChannels(freeChannels);
        localStorage.setItem('nndd_cached_channels', JSON.stringify(freeChannels));
        setSelectedChannel(freeChannels[0]);
        persistentTargetChannelRef.current = freeChannels[0];
        persistentTargetIndexRef.current = 0;

        if (activeTab === 'live') {
          performChannelSwitch(freeChannels[0], true);
        }

        window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: freeChannels }));
        window.dispatchEvent(new CustomEvent('nndd_server_switched', { detail: { id: 'srv-nndd-free', name: 'سێرڤەری فەرمی NNDD (Free M3U8)', type: 'm3u' } }));

        onNotify?.({
          title: 'سێرڤەری فەرمی بێبەرامبەر چالاککرا 🎉',
          message: 'کەناڵی تایبەتی دابین تیڤی چالاکە. کەناڵەکانی تر بە دیاریکردنی سێرڤەر باردەبن.',
          type: 'success'
        });
      } catch(err) {
        onNotify?.({
          title: 'هەڵە لە چالاککردنی سێرڤەری فەرمی',
          message: err.message,
          type: 'error'
        });
      } finally {
        setIsRefreshingServer(false);
        setRefreshingServerMessage('');
      }
      return;
    }

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
        throw new Error(authCheck.error || 'پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو. دڵنیابەرەوە لە هۆست و یوزەرنەیم و تێپەڕەوشە، یان ڕەنگە تێستەکە بەسەرچووبێت (Expired).');
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
        savePersistentChannels(freshChannels);
        setSelectedChannel(freshChannels[0]);
        persistentTargetChannelRef.current = freshChannels[0];
        persistentTargetIndexRef.current = 0;

        if (activeTab === 'live') {
          performChannelSwitch(freshChannels[0], true);
        }

        // Also dispatch global sync events
        window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: freshChannels }));
        window.dispatchEvent(new CustomEvent('nndd_server_switched', { detail: { ...cleanConfig, type: 'xtream' } }));

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

  // Resume last watched channel from localStorage or fallback to channel #1 (KOBIN.Tv)
  const [selectedChannel, setSelectedChannel] = useState(() => {
    try {
      const savedId = localStorage.getItem('kobin_last_watched_channel_id') || localStorage.getItem('nndd_last_channel_id');
      if (savedId) {
        const found = (propChannels || CHANNELS_DATA).find(c => c.id === savedId || String(c.number) === savedId);
        if (found) return found;
      }
    } catch(e) {}
    return (propChannels || CHANNELS_DATA)[0];
  });

  // Auto-switch selected channel when channels change (e.g. Server changed from Admin Panel or Settings)
  useEffect(() => {
    if (channels && channels.length > 0) {
      const currentStillExists = channels.some(c => c.id === selectedChannel?.id || String(c.number) === String(selectedChannel?.number));
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
      const stored = localStorage.getItem('kobin_favorite_channel_ids') || localStorage.getItem('nndd_favorite_channel_ids');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return (propChannels || CHANNELS_DATA).filter(c => c.isFavorite).map(c => c.id);
  });

  // Favorite Movies / Series VOD IDs persisted in localStorage
  const [favoriteVodIds, setFavoriteVodIds] = useState(() => {
    try {
      const stored = localStorage.getItem('kobin_favorite_vod_ids');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [];
  });

  const toggleVodFavorite = (vodId) => {
    setFavoriteVodIds(prev => {
      const isFav = prev.includes(vodId);
      const updated = isFav ? prev.filter(id => id !== vodId) : [...prev, vodId];
      try {
        localStorage.setItem('kobin_favorite_vod_ids', JSON.stringify(updated));
      } catch(e) {}
      return updated;
    });
  };

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
    const clamped = Math.min(1.3, Math.max(0.70, parseFloat(newScale.toFixed(2))));
    setDockScale(clamped);
    try {
      localStorage.setItem('nndd_dock_scale', clamped.toString());
    } catch(e) {}
  };

  // Channel Drawer Scale State ('compact' | 'standard' | 'large')
  const [drawerScale, setDrawerScale] = useState(() => {
    try {
      return localStorage.getItem('nndd_drawer_scale') || 'standard';
    } catch(e) {
      return 'standard';
    }
  });

  const updateDrawerScale = (scale) => {
    setDrawerScale(scale);
    try {
      localStorage.setItem('nndd_drawer_scale', scale);
    } catch(e) {}
  };

  // 12-Second Dashboard Idle Motion & Screensaver State (Persisted in localStorage for ultra-smooth 60fps GPU morphing)
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

  // 12-Second Dashboard Idle Motion Listener (Resets on any mouse, touch, or keyboard movement)
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
      }, 30000); // 30 seconds idle (خەوتنی داشبۆرد پاش ٣٠ چرکە)
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
  // Selected channel category: defaults strictly to 'هەموو' (All Channels) per user design
  const [channelCategory, setChannelCategory] = useState(() => {
    try {
      const saved = localStorage.getItem('kobin_last_watched_category') || localStorage.getItem('nndd_last_channel_category');
      if (saved) return saved;
    } catch(e) {}
    return 'هەموو';
  });

  // Persist category selection
  useEffect(() => {
    try {
      if (channelCategory) {
        localStorage.setItem('kobin_last_watched_category', channelCategory);
        localStorage.setItem('nndd_last_channel_category', channelCategory);
      }
    } catch(e) {}
  }, [channelCategory]);
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
    { id: 'fit', label: 'فیت (ڕەسەن - Fit)', desc: 'ڕەهەندی بنەڕەتی پەخش بەبێ دەستکاری' },
    { id: 'zoom', label: 'زووم (پڕکردنەوە - Zoom)', desc: 'گەورەکردنی ناوەڕاست بە تەواوی شاشە' },
    { id: 'stretch', label: 'سترێچ (پڕکراوە - Stretch)', desc: 'پڕکردنەوە و کشاندنی تەواوی شاشە' },
    { id: '16:9', label: 'شاشەی پان (16:9 Wide)', desc: 'تەلەڤزیۆنی پانی مۆدێرن' },
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

    showColorToast('yellow', `🟡 شێوازی شاشە: ${nextMode.label}`);

    if (aspectRatioToastTimerRef.current) {
      clearTimeout(aspectRatioToastTimerRef.current);
    }
    setAspectRatioToast(nextMode);
    aspectRatioToastTimerRef.current = setTimeout(() => {
      setAspectRatioToast(null);
      aspectRatioToastTimerRef.current = null;
    }, 2500);
  };

  const getVideoAspectClass = () => {
    if (activeTab === 'dashboard') {
      // User requirement: وێنەی پشت پێنچ ئامرازەکەی داشبۆرد (لایفە بێدەنگەکە) کە قیاسەکەی سترێچە - ستڕێچيکە بگۆرە بۆ ZOOM
      return 'w-full h-full !object-cover [object-fit:cover] scale-100';
    }
    switch (liveAspectRatioMode) {
      case 'stretch':
        return 'w-full h-full !object-fill [object-fit:fill] scale-100';
      case 'zoom':
        return 'w-full h-full !object-cover [object-fit:cover] scale-115';
      case '16:9':
        return 'aspect-video w-full max-h-full mx-auto !object-contain scale-100';
      case '4:3':
        return 'aspect-[4/3] max-w-[133.33vh] h-full mx-auto !object-contain scale-100';
      case 'fit':
      default:
        return 'w-full h-full !object-contain [object-fit:contain] scale-100';
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

  const moveChannelInList = (target, direction) => {
    const list = [...channels];
    let currentIndex = -1;
    if (typeof target === 'number') {
      currentIndex = target;
    } else {
      currentIndex = list.findIndex(c => String(c.id) === String(target));
    }
    // Channel #1 (DABIN.Tv) is permanently anchored at position 1
    if (currentIndex <= 0 || currentIndex >= list.length) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 1 || targetIndex >= list.length) return;

    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;

    const renumbered = ensureDabinChannelFirst(list);
    setChannels(renumbered);
    savePersistentChannels(renumbered);
  };

  const removeChannelFromList = (channelId) => {
    // DABIN.Tv Channel cannot be deleted
    if (channelId === 'ch-dabin-tv-custom') return;
    const filtered = channels.filter(c => c.id !== channelId);
    const renumbered = ensureDabinChannelFirst(filtered);
    setChannels(renumbered);
    savePersistentChannels(renumbered);
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
  const [serverConnectionStatus, setServerConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  const [serverConnectionMsg, setServerConnectionMsg] = useState('خەریکی پەیوەستبوونە بە سێرڤەر...');

  const isUserSubscribed = useMemo(() => {
    const sess = getSavedKobinSession();
    if (sess && !isKobinSessionExpired(sess)) return true;
    return isDeviceServerActive(deviceIdentity) || Boolean(activeXtreamConfig?.username && activeXtreamConfig?.password);
  }, [deviceIdentity, activeXtreamConfig]);

// 100% Real LionOTT VOD & Series Loader (Automatic on mount & tab switch)
  const isFetchingVodRef = useRef(false);
  useEffect(() => {
    if (isFetchingVodRef.current) return;
    const activeUser = activeXtreamConfig?.username || deviceIdentity?.xtream_user;
    const activePass = activeXtreamConfig?.password || deviceIdentity?.xtream_pass;
    const activeHost = resolveXtreamHost(activeXtreamConfig?.host || deviceIdentity?.server_url || 'http://line.liondnscloud.ru:80');

    if (activeUser && activePass && (internalVodMovies.length === 0 || internalVodSeries.length === 0)) {
      isFetchingVodRef.current = true;
      importTargetServerVod({
        serverUrl: activeHost,
        username: activeUser,
        password: activePass
      }).then(res => {
        if (res?.movies && res.movies.length > 0) {
          setVodMovies(res.movies);
          savePersistentVod('movies', res.movies);
          try {
            localStorage.setItem('nndd_cached_vod_movies_v3', JSON.stringify(res.movies));
          } catch(e) {}
        }
        if (res?.series && res.series.length > 0) {
          setVodSeries(res.series);
          savePersistentVod('series', res.series);
          try {
            localStorage.setItem('nndd_cached_vod_series_v3', JSON.stringify(res.series));
          } catch(e) {}
        }
      }).catch(err => {
        console.warn('[Real VOD Fetch Error]:', err);
      }).finally(() => {
        isFetchingVodRef.current = false;
      });
    }
  }, [activeXtreamConfig, deviceIdentity, internalVodMovies.length, internalVodSeries.length]);
  // Listen for per-device server assignment from Reseller / Admin Panel
  useEffect(() => {
    const handleDeviceServerActivated = (e) => {
      const updated = e.detail;
      if (updated) {
        setDeviceIdentity(updated);
        onNotify?.({
          title: 'سێرڤەری تایبەتی ئامێرەکەت چالاککرا 🎉',
          message: `پەخشی کەناڵەکان بە سەرکەوتوویی کرایەوە بەپێی پاکێجی "${updated.activePlan || 'تێست'}".`,
          type: 'success'
        });

        // Automatically import assigned server streams if credentials present
        if (updated.assignedServer) {
          const srv = updated.assignedServer;
          if (srv.host && srv.username) {
            importTargetServerChannels({
              host: srv.host,
              username: srv.username,
              password: srv.password
            }).then(imported => {
              if (Array.isArray(imported) && imported.length > 0) {
                const fullChannels = ensureDabinChannelFirst(imported);
                setChannels(fullChannels);
                savePersistentChannels(fullChannels);
                window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: fullChannels }));
              }
            }).catch(err => {
              console.warn('[DeviceServer] Failed auto-importing assigned server channels:', err);
            });
          }
        }
      }
    };
    window.addEventListener('dabin_device_server_activated', handleDeviceServerActivated);
    return () => window.removeEventListener('dabin_device_server_activated', handleDeviceServerActivated);
  }, []);

  // Listen for native Android/Capacitor hardware MAC address and network IP sync
  useEffect(() => {
    const handleMacSynced = (e) => {
      const detail = e.detail;
      const nativeMac = typeof detail === 'string' ? detail : detail?.mac;
      const nativeIp = typeof detail === 'object' ? detail?.ip : null;
      if (nativeMac) {
        setDeviceIdentity(prev => ({
          ...prev,
          macAddress: nativeMac,
          deviceId: nativeMac,
          serialNumber: nativeMac,
          deviceIp: nativeIp || prev?.deviceIp
        }));
        autoRegisterClientDevice(nativeMac, deviceIdentity?.deviceModel || 'Android Smartphone', { ip_address: nativeIp }).catch(() => {});
      }
    };
    window.addEventListener('dabin_mac_synced', handleMacSynced);
    
    // Trigger network IP and MAC sync immediately on mount
    syncDeviceIdentityWithNetwork().catch(() => {});

    return () => window.removeEventListener('dabin_mac_synced', handleMacSynced);
  }, [deviceIdentity?.deviceModel]);

  // Real-Time Middleware Sync & Instant Hot-Swapping Listener (Smart Credit-Saving)
  useEffect(() => {
    if (!deviceIdentity?.macAddress) return;

    const currentModel = deviceIdentity.deviceModel || 'Smart TV';
    const currentMac = deviceIdentity.macAddress;
    const currentIp = deviceIdentity.deviceIp;

    // 1. Auto-Register device in database & Admin Panel on launch IMMEDIATELY with multiple retries
    const registerDevice = async () => {
      try {
        const result = await autoRegisterClientDevice(currentMac, currentModel, { 
          ip_address: currentIp,
          device_key: deviceIdentity?.deviceKey || deviceIdentity?.device_key
        });
        if (result && result.success) {
          setServerConnectionStatus('connected');
          const dev = result.device;
          if (dev?.status === 'active' && dev?.xtream_user) {
            setServerConnectionMsg('پەیوەستە بە سێرڤەر - هێڵ چالاکە');
          } else {
            setServerConnectionMsg('پەیوەستە بە سێرڤەر - چاوەڕوانی چالاککردنە');
          }
        } else {
          setServerConnectionStatus(prev => prev === 'connected' ? 'connected' : 'error');
          setServerConnectionMsg('کێشە لە پەیوەندی بە سێرڤەر');
        }
      } catch (err) {
        setServerConnectionStatus(prev => prev === 'connected' ? 'connected' : 'error');
        setServerConnectionMsg('کێشە لە پەیوەندی بە سێرڤەر');
      }
    };

    registerDevice();
    const t1 = setTimeout(registerDevice, 1500);
    const t2 = setTimeout(registerDevice, 4000);
    const t3 = setTimeout(registerDevice, 9000);

    // 2. Send sync heartbeat on app launch & periodically using universalFetch
    const apiBase = getApiBaseUrl();
    const sendHeartbeat = () => {
      universalFetch(`${apiBase}/api/device/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mac_address: currentMac, 
          model: currentModel,
          ip_address: currentIp
        })
      })
        .then(res => res.json())
        .then(syncData => {
          if (!syncData) return;
          setServerConnectionStatus('connected');
          if (syncData.authorized && syncData.xtream_user && syncData.xtream_pass) {
            setDeviceIdentity(prev => ({
              ...prev,
              status: syncData.status,
              authorized: true,
              xtream_user: syncData.xtream_user,
              xtream_pass: syncData.xtream_pass,
              server_url: syncData.server_url,
              expiresAt: syncData.app_expiry_date
            }));

            if (channels.length <= 1) {
              importTargetServerChannels({
                host: syncData.server_url || 'http://line.liondnscloud.ru:80',
                username: syncData.xtream_user,
                password: syncData.xtream_pass
              }).then(imported => {
                if (Array.isArray(imported) && imported.length > 0) {
                  const full = ensureDabinChannelFirst(imported);
                  setChannels(full);
                  savePersistentChannels(full);
                }
              }).catch(() => {});
            }
          } else {
            setDeviceIdentity(prev => ({
              ...prev,
              status: syncData.status,
              authorized: false,
              expiresAt: syncData.app_expiry_date
            }));

            if (syncData.status === 'needs_panel_renewal') {
              onNotify?.({
                title: 'سێرڤەر لە حاڵی نوێکردنەوەدایە ⏳',
                message: 'تکایە چەند چرکەیەک چاوەڕوان بە تا بەڕێوەبەر هێڵەکەت بۆ نوێ دەکاتەوە.',
                type: 'info'
              });
            }
          }
        })
        .catch(() => {});
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 15000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(heartbeatInterval);
    };
  }, [deviceIdentity?.macAddress, deviceIdentity?.deviceModel, deviceIdentity?.deviceIp]);

  // 3. Subscribe to Real-Time Hot-Swap updates from Admin Panel
  useEffect(() => {
    if (!deviceIdentity?.macAddress) return;

    let unsubHotSwap = null;
    try {
      unsubHotSwap = subscribeToClientDeviceHotSwap(deviceIdentity.macAddress, (updatedDevice) => {
        setServerConnectionStatus('connected');
        if (updatedDevice.status === 'active' && updatedDevice.xtream_user) {
          setServerConnectionMsg('پەیوەستە بە سێرڤەر - هێڵ چالاکە');
        }
        setDeviceIdentity(prev => ({
          ...prev,
          status: updatedDevice.status,
          authorized: Boolean(updatedDevice.xtream_user && updatedDevice.xtream_pass),
          xtream_user: updatedDevice.xtream_user,
          xtream_pass: updatedDevice.xtream_pass,
          server_url: updatedDevice.server_url,
          expiresAt: updatedDevice.app_expiry_date
        }));

        if (updatedDevice.xtream_user && updatedDevice.xtream_pass) {
          onNotify?.({
            title: 'هێڵی سێرڤەر بە خێرایی نوێکرایەوە! ⚡',
            message: 'کەناڵەکان بە سەرکەوتوویی لە سێرڤەرەوە بارکرانەوە بەبێ پێویستی بە داخستنی ئەپ.',
            type: 'success'
          });

          importTargetServerChannels({
            host: updatedDevice.server_url || 'http://line.liondnscloud.ru:80',
            username: updatedDevice.xtream_user,
            password: updatedDevice.xtream_pass
          }).then(freshChannels => {
            if (Array.isArray(freshChannels) && freshChannels.length > 0) {
              const finalChannels = ensureDabinChannelFirst(freshChannels);
              setChannels(finalChannels);
              savePersistentChannels(finalChannels);
              window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: finalChannels }));
            }
          }).catch(err => {
            console.warn('[HotSwap Error]:', err);
          });
        }
      });
    } catch (e) {
      console.warn('[HotSwap App Listener Safe Catch]:', e);
    }

    return () => {
      try {
        unsubHotSwap?.();
      } catch(e) {}
    };
  }, [deviceIdentity?.macAddress]);


  const [isActivationModalOpen, setIsActivationModalOpen] = useState(() => {
    try {
      const sess = getSavedKobinSession();
      if (sess && !isKobinSessionExpired(sess)) {
        return false; // Skip login completely!
      }
      if (isDeviceServerActive(deviceIdentity)) {
        return false;
      }
    } catch (e) {}
    return false;
  });

  // Perform Clean Kobin Logout (Manual or on Subscription Expiration)
  const performKobinLogout = useCallback((reason = null) => {
    try {
      localStorage.removeItem('kobin_tv_session');
      localStorage.removeItem('nndd_active_xtream_config');
      const updated = {
        ...deviceIdentity,
        status: 'inactive',
        authorized: false,
        activeUsername: '',
        xtream_user: '',
        xtream_pass: ''
      };
      setDeviceIdentity(updated);
      saveDeviceIdentity(updated);
    } catch (e) {}

    setActiveXtreamConfig(null);
    setIsActivationModalOpen(true);

    onNotify?.({
      title: 'چوونەدەرەوە (Logout)',
      message: reason || 'بە سەرکەوتوویی لە هەژمارەکەت چوویتە دەرەوە.',
      type: reason ? 'warning' : 'info'
    });
  }, [deviceIdentity, onNotify]);

  // Persistent Auto-Login Verification & Background Expiration Engine
  useEffect(() => {
    // 1. Initial Mount Check
    const sess = getSavedKobinSession();
    if (sess) {
      if (isKobinSessionExpired(sess)) {
        console.warn('[Session] Subscription has expired on launch');
        performKobinLogout('ماوەی بەشدارییەکەت بەسەرچووە، تکایە بۆ نوێکردنەوە پەیوەندی بکە.');
      } else {
        // Active session: ensure modal stays closed and config is active
        setIsActivationModalOpen(false);
        if (sess.username && sess.password) {
          setActiveXtreamConfig(prev => {
            if (prev?.username === sess.username && prev?.password === sess.password) return prev;
            return {
              host: (sess.server_url || 'http://line.liondnscloud.ru:80').replace(/\/+$/, ''),
              username: sess.username,
              password: sess.password,
              name: 'KOBIN TV Server',
              type: 'xtream'
            };
          });
        }
      }
    }

    // 2. Background periodic expiration checker
    const verifyBackgroundExpiry = async () => {
      try {
        const currentSess = getSavedKobinSession();
        if (!currentSess) return;

        // Check local expiry
        if (isKobinSessionExpired(currentSess)) {
          console.warn('[Session Engine] Subscription time has expired');
          performKobinLogout('ماوەی بەشدارییەکەت بەسەرچووە، تکایە بۆ نوێکردنەوە پەیوەندی بکە.');
          return;
        }

        // Query upstream Xtream server only if username and password exist
        if (currentSess.username && currentSess.password) {
          try {
            const authCheck = await testXtreamConnection({
              host: currentSess.server_url || 'http://line.liondnscloud.ru:80',
              username: currentSess.username,
              password: currentSess.password
            });

            // ONLY logout if upstream explicitly confirms expired or banned
            if (authCheck && authCheck.user) {
              const u = authCheck.user;
              if (u.status === 'Expired' || u.status === 'Banned' || u.auth === 0) {
                console.warn('[Session Engine] Upstream reports account expired/banned');
                performKobinLogout('ماوەی هەژمارەکەت لەسەر سێرڤەر بەسەرچووە.');
                return;
              }
              if (u.exp_date && u.exp_date !== 'null') {
                const expSec = Number(u.exp_date);
                if (expSec > 0 && (Date.now() / 1000) > expSec) {
                  console.warn('[Session Engine] Upstream exp_date passed');
                  performKobinLogout('ماوەی هەژمارەکەت لەسەر سێرڤەر بەسەرچووە.');
                  return;
                }
              }
            }
          } catch (netErr) {
            // STRICT USER MANDATE: Temporary network hiccup must NEVER log the user out!
            console.log('[Session Engine] Network hiccup, keeping user logged in:', netErr);
          }
        }
      } catch (e) {
        console.warn('[Session Engine Catch]:', e);
      }
    };

    const initialCheckTimer = setTimeout(verifyBackgroundExpiry, 12000);
    const periodicInterval = setInterval(verifyBackgroundExpiry, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialCheckTimer);
      clearInterval(periodicInterval);
    };
  }, [performKobinLogout]);

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
  const lastDrawerClickRef = useRef({ id: null, time: 0 });
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
    if (trimmed === 'هەموو' || trimmed === 'هەمووی' || trimmed.toLowerCase() === 'all') return 'هەمووی (گشت کەناڵەکان)';
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

  // Listen for admin category modifications
  const [categoryRevision, setCategoryRevision] = useState(0);

  useEffect(() => {
    const handleCategoryUpdate = () => {
      setCategoryRevision(prev => prev + 1);
    };
    window.addEventListener('nndd_categories_updated', handleCategoryUpdate);
    return () => window.removeEventListener('nndd_categories_updated', handleCategoryUpdate);
  }, []);

  const dynamicCategories = useMemo(() => {
    let storedManaged = [];
    try {
      const raw = localStorage.getItem('nndd_managed_categories');
      if (raw) storedManaged = JSON.parse(raw);
    } catch (e) {}

    const presentCats = new Set([
      ...(Array.isArray(storedManaged) ? storedManaged : []),
      ...channels.filter(c => !c.isHidden).map(c => c.category?.trim()).filter(Boolean)
    ]);
    const sorted = [];
    
    // Respect order of user-managed categories
    if (Array.isArray(storedManaged) && storedManaged.length > 0) {
      storedManaged.forEach(cat => {
        if (presentCats.has(cat)) {
          sorted.push(cat);
          presentCats.delete(cat);
        }
      });
    }

    const PREFERRED_ORDER = ['ڕووداو', 'هەواڵەکان کوردی', 'کوردی', 'ئاینی'];
    PREFERRED_ORDER.forEach(cat => {
      if (presentCats.has(cat)) {
        sorted.push(cat);
        presentCats.delete(cat);
      }
    });
    presentCats.forEach(cat => {
      if (cat !== 'هەموو' && cat !== 'هەمووی' && cat.toLowerCase() !== 'all') {
        sorted.push(cat);
      }
    });
    // Put 'هەموو' (All) and '⭐ دڵخوازەکان' at the very top by default ("با گەتەگۆری لەسەر هەمووی بێت عادەدەن")
    const hasFavs = channels.some(c => favoriteChannelIds.includes(c.id) || c.isFavorite);
    return ['هەموو', ...(hasFavs ? ['⭐ دڵخوازەکان'] : []), ...sorted];
  }, [channels, favoriteChannelIds, categoryRevision]);

  // Fallback if active channelCategory is removed
  useEffect(() => {
    if (channelCategory && dynamicCategories.length > 0 && !dynamicCategories.includes(channelCategory)) {
      setChannelCategory('هەموو');
    }
  }, [dynamicCategories, channelCategory]);

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
    // Strictly deduplicate by channel id, number, or name to eliminate duplicate entries
    const seenIds = new Set();
    const uniqueChannels = [];
    for (const ch of (channels || [])) {
      if (!ch) continue;
      const key = ch.id || ch.number || ch.name;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        uniqueChannels.push(ch);
      }
    }

    return uniqueChannels.filter(c => !c.isHidden).filter(c => {
      let matchesCat = true;
      if (channelCategory && channelCategory !== 'هەموو' && channelCategory !== 'هەمووی' && channelCategory !== 'all') {
        if (channelCategory === '⭐ دڵخوازەکان' || channelCategory === '⭐' || channelCategory === 'favorites') {
          matchesCat = isFav;
        } else {
          matchesCat = Boolean(
            (c.category && c.category.trim() === channelCategory.trim()) ||
            (c.id === 'ch-dabin-tv-custom' && (channelCategory === 'کوردی' || channelCategory === 'KOBIN.Tv' || channelCategory === 'DABIN.Tv'))
          );
        }
      }
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
      // DABIN.Tv channel is ALWAYS Channel #1 at the top of the list
      const isDabinA = a.id === 'ch-dabin-tv-custom' || a.isCustomDabinChannel;
      const isDabinB = b.id === 'ch-dabin-tv-custom' || b.isCustomDabinChannel;
      if (isDabinA && !isDabinB) return -1;
      if (!isDabinA && isDabinB) return 1;

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

  // Channel Drawer Browsing: Scrolling/navigating channels does NOT auto-switch playback.
  // Channel switch only triggers when the user presses OK / Select.
  // Pressing OK a second time on the same channel closes the channel list drawer.
  useEffect(() => {
    clearDrawerCountdown();
  }, [drawerFocusedIndex, clearDrawerCountdown]);

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

  // Dynamic Rich Categories (Kurdish, Arabic, Global, Netflix, Disney+, etc. + Favorites ⭐)
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
    const favCount = visibleSeries.filter(s => favoriteVodIds.includes(s.id)).length;
    return ['all', ...(favCount > 0 ? ['favorites'] : []), ...(hasKurd ? ['کوردی'] : []), ...Array.from(cats)];
  }, [visibleSeries, favoriteVodIds]);

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
    const favCount = visibleMovies.filter(m => favoriteVodIds.includes(m.id)).length;
    return ['all', ...(favCount > 0 ? ['favorites'] : []), ...(hasKurd ? ['کوردی'] : []), ...Array.from(cats)];
  }, [visibleMovies, favoriteVodIds]);

  const filteredSeries = useMemo(() => {
    if (seriesCategoryFilter === 'all') return visibleSeries;
    if (seriesCategoryFilter === 'favorites') return visibleSeries.filter(s => favoriteVodIds.includes(s.id));
    return visibleSeries.filter(s => {
      const c = (s.category || s.genre || '').trim();
      return c === seriesCategoryFilter;
    });
  }, [visibleSeries, seriesCategoryFilter, favoriteVodIds]);

  const filteredMovies = useMemo(() => {
    if (moviesCategoryFilter === 'all') return visibleMovies;
    if (moviesCategoryFilter === 'favorites') return visibleMovies.filter(m => favoriteVodIds.includes(m.id));
    return visibleMovies.filter(m => {
      const c = (m.category || m.genre || '').trim();
      return c === moviesCategoryFilter;
    });
  }, [visibleMovies, moviesCategoryFilter, favoriteVodIds]);

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
    const decoded = decodeURIComponent(url).toLowerCase();
    const cleanUrl = decoded.split('?')[0];
    return cleanUrl.endsWith('.ts') || decoded.includes('.ts') || decoded.includes('extension=ts');
  };

  // Helper to detect commercial Xtream URLs with strict 1-connection limits
  const isXtreamUrl = (url) => {
    if (!url) return false;
    return /(:80|:8080|:2082|:2086|:2095|:25461)?\/live\/[^\/]+\/[^\/]+\/\d+/i.test(url) ||
           url.includes('elg-26.com') ||
           url.includes('/player_api.php');
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

  // Resolve optimal stream URL with HLS .m3u8, MPEG-TS .ts, and HTTPS CORS Proxy support
  const getOptimalStreamUrl = (channel, isBackup = false) => {
    if (!channel) return '';
    let streamUrl = isBackup ? (channel.backupUrl || channel.url) : channel.url;
    if (!streamUrl) return '';

    // If channel has an Xtream stream id (e.g. from LionOTT)
    const streamId = channel.xtreamStreamId || channel.stream_id;
    const activeUser = activeXtreamConfig?.username || deviceIdentity?.xtream_user || '292c8215';
    const activePass = activeXtreamConfig?.password || deviceIdentity?.xtream_pass || 'adef5d6e';
    const activeHost = resolveXtreamHost(activeXtreamConfig?.host || deviceIdentity?.server_url || 'http://line.liondnscloud.ru:80');

    if (streamId && activeUser && activePass) {
      const ext = streamEngine === 'ts' ? 'ts' : 'm3u8';
      streamUrl = `${activeHost}/live/${encodeURIComponent(activeUser)}/${encodeURIComponent(activePass)}/${streamId}.${ext}`;
    } else if (streamUrl.includes('/live/') && (streamUrl.endsWith('.ts') || streamUrl.endsWith('.m3u8'))) {
      const ext = streamEngine === 'ts' ? 'ts' : 'm3u8';
      streamUrl = streamUrl.replace(/\.(ts|m3u8)(\?.*)?$/i, `.${ext}$2`);
    }

    // On HTTPS web pages (like Vercel), route HTTP through /api/stream proxy to avoid browser Mixed Content block
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isHttpsPage && streamUrl.startsWith('http:') && !streamUrl.startsWith('http://localhost') && !streamUrl.startsWith('http://127.0.0.1')) {
      return `/api/stream?url=${encodeURIComponent(streamUrl)}`;
    }

    return streamUrl;
  };

  // Safe Play Helper to prevent uncaught AbortError promises during rapid switching
  const safePlayVideo = (video) => {
    if (!video) return;
    const p = video.play();
    if (p !== undefined) {
      p.catch((err) => {
        // If autoplay is rejected due to browser audio policy, mute and play immediately!
        if (err && (err.name === 'NotAllowedError' || err.message?.includes('interact'))) {
          video.muted = true;
          video.play().catch(() => {});
        }
      });
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
    if (ctrl.stallWatchdog) {
      clearTimeout(ctrl.stallWatchdog);
      ctrl.stallWatchdog = null;
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

    // Channel #1: KOBIN.Tv Broadcast Channel is ALWAYS FREE and unblocked
    if (channel?.id === 'ch-dabin-tv-custom' || channel?.isCustomDabinChannel) {
      disposeSlotController('A');
      disposeSlotController('B');
      setIsStreamLoading(false);
      setIsChannelOffline(false);
      if (onReadyCallback) {
        setTimeout(() => {
          if (switchRequestIdRef.current === reqId) {
            onReadyCallback();
          }
        }, 350);
      }
      return;
    }

    // For any other server channels (Channel 2+): check if device subscription is active
    if (!isUserSubscribed) {
      disposeSlotController(slot);
      setIsStreamLoading(false);
      setIsChannelOffline(false);
      if (onReadyCallback) {
        onReadyCallback();
      }
      return;
    }

    const video = slot === 'A' ? videoRefA.current : videoRefB.current;
    if (!video) return;

    // Background preloader is strictly muted to prevent dual-audio
    const isBackgroundPreload = Boolean(onReadyCallback);

    const ctrl = controllersRef.current[slot];
    // Dispose previous instance on this specific slot before re-attaching
    disposeSlotController(slot);
    const otherSlot = slot === 'A' ? 'B' : 'A';
    if (!isBackgroundPreload) {
      disposeSlotController(otherSlot);
    }
    ctrl.reqId = reqId;

    video.muted = isBackgroundPreload ? true : isMuted;
    video.volume = isBackgroundPreload ? 0 : (isMuted ? 0 : volume / 100);

    const streamUrl = getOptimalStreamUrl(channel, isBackup);
    ctrl.url = streamUrl;

    // Multi-Server Auto Failover & Dynamic Watchdog
    const failoverToBackup = (reason = 'error') => {
      if (switchRequestIdRef.current !== reqId) return;

      // If primary failed and channel has a valid alternative backupUrl, try it immediately!
      if (!isBackup && channel.backupUrl && channel.backupUrl !== streamUrl) {
        console.info(`[STREAM FAILOVER (${reason})] Trying backupUrl for #${channel.number}: ${channel.backupUrl}`);
        setIsBackupStreamActive(true);
        startPlayerForSlot(slot, channel, reqId, true, 4000, onReadyCallback);
        return;
      }

      // RULE 1: DEDICATED SERVER MODE
      // "ئەگەر کەناڵی نەهێنا لەسەر ئەو سێفەرە ئەوە کەناڵەکە سێرفەری مەگۆرە لەسەر سێرفەرێک بیهێنێ - با لەسەر سێرفەری دیاری کراو بێت"
      if (serverMode === 'dedicated') {
        console.info(`[DEDICATED MODE (${reason})] Channel error on #${channel.number}. Staying strictly on dedicated server.`);
        if (!isBackgroundPreload) {
          setIsStreamLoading(false);
          setIsChannelOffline(true);
          dismissFreezeFrame();
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
          dismissFreezeFrame();
        }
      }
    };

    // Watchdog timer (only for active playing mode, not background preloads)
    // 7000ms safe timeout allows realistic HLS buffering without false timeouts
    const effectiveTimeoutMs = timeoutMs || 7000;
    if (effectiveTimeoutMs > 0 && !isBackgroundPreload) {
      ctrl.watchdog = setTimeout(() => {
        if (switchRequestIdRef.current !== reqId) return;
        console.warn(`[WATCHDOG ${effectiveTimeoutMs}ms TIMEOUT] Stream did not start playing on slot ${slot} for #${channel.number}`);
        failoverToBackup('timeout');
      }, effectiveTimeoutMs);
    }

    // First Frame Rendered Detection & Dynamic Watchdog
    let firstFrameFired = false;
    let stallWatchdog = null;
    let fallbackAttempted = false;

    const clearStallWatchdog = () => {
      if (stallWatchdog) {
        clearTimeout(stallWatchdog);
        stallWatchdog = null;
      }
      if (ctrl.stallWatchdog) {
        clearTimeout(ctrl.stallWatchdog);
        ctrl.stallWatchdog = null;
      }
    };

    const notifyFirstFrameRendered = () => {
      if (firstFrameFired || switchRequestIdRef.current !== reqId) return;
      firstFrameFired = true;
      clearStallWatchdog();

      // Update active stream URL so OSD badge dynamically detects this server in Auto Mode
      setActivePlayingStreamUrl(streamUrl);
      activeStreamUrlRef.current = streamUrl;

      if (ctrl.watchdog) {
        clearTimeout(ctrl.watchdog);
        ctrl.watchdog = null;
      }

      // Smoothly dismiss freeze frame in 150ms once first real frame is decoded
      dismissFreezeFrame();

      if (onReadyCallback) {
        onReadyCallback();
      } else {
        clearCountdown();
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
      clearStallWatchdog();
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
        clearStallWatchdog();
        notifyFirstFrameRendered();
      }
    };

    // Helper to seamlessly convert stream URL between .m3u8 and .ts extensions (direct or proxied)
    const getAlternativeEngineUrl = (currentUrl, toType) => {
      let isProxied = currentUrl.includes('/api/stream') || currentUrl.includes('/api/proxy');
      let rawUrl = currentUrl;
      let proxyPrefix = currentUrl.split('?')[0];
      if (isProxied) {
        rawUrl = decodeURIComponent(currentUrl.split('url=')[1] || '');
      }
      let altUrl = rawUrl;
      if (toType === 'ts') {
        altUrl = rawUrl.replace(/\.m3u8(\?.*)?$/i, '.ts$1');
      } else {
        altUrl = rawUrl.replace(/\.ts(\?.*)?$/i, '.m3u8$1');
      }
      if (isProxied) {
        return `${proxyPrefix}?url=${encodeURIComponent(altUrl)}`;
      }
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      if (isHttps && altUrl.startsWith('http:') && !altUrl.startsWith('http://localhost') && !altUrl.startsWith('http://127.0.0.1')) {
        return `/api/stream?url=${encodeURIComponent(altUrl)}`;
      }
      return altUrl;
    };

    // Auto-Fallback Engine: Seamlessly swaps player engine between HLS and MPEG-TS
    const triggerAutoFallback = (fromType, reason) => {
      if (switchRequestIdRef.current !== reqId || fallbackAttempted) return;
      fallbackAttempted = true;
      clearStallWatchdog();
      console.warn(`[AUTO-FALLBACK ENGINE (${reason})] Switching stream format between .m3u8 and .ts seamlessly...`);

      if (fromType === 'hls' && mpegts.isSupported()) {
        const altTs = getAlternativeEngineUrl(ctrl.url || streamUrl, 'ts');
        if (ctrl.hls) {
          try {
            ctrl.hls.stopLoad();
            ctrl.hls.detachMedia();
            ctrl.hls.destroy();
          } catch(e) {}
          ctrl.hls = null;
        }
        ctrl.url = altTs;
        if (startMpegtsPlayer(altTs)) return;
      } else if (fromType === 'ts' && Hls.isSupported()) {
        const altM3u8 = getAlternativeEngineUrl(ctrl.url || streamUrl, 'm3u8');
        if (ctrl.mpegts) {
          try {
            ctrl.mpegts.pause();
            ctrl.mpegts.unload();
            ctrl.mpegts.detachMediaElement();
            ctrl.mpegts.destroy();
          } catch(e) {}
          ctrl.mpegts = null;
        }
        ctrl.url = altM3u8;
        if (startHlsPlayer(altM3u8)) return;
      }

      failoverToBackup(reason);
    };

    // Reusable MPEG-TS Player Launcher via mpegts.js (MSE)
    const startMpegtsPlayer = (targetUrl) => {
      try {
        const player = mpegts.createPlayer({
          type: 'm2ts',
          isLive: true,
          url: targetUrl
        }, {
          enableWorker: true,
          lazyLoad: false,
          enableStashBuffer: true,
          stashInitialSize: 384 * 1024,
          autoCleanupSourceBuffer: true,
          autoCleanupMaxBackwardDuration: 20,
          autoCleanupMinBackwardDuration: 6,
          liveBufferLatencyChasing: false,
          liveSync: true
        });

        ctrl.mpegts = player;
        player.attachMediaElement(video);
        player.load();
        if (!isBackgroundPreload) {
          video.muted = false;
          video.volume = 1.0;
        }
        const playPromise = player.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch((err) => {
            console.warn('[mpegts Autoplay Blocked]: muting to enable playback:', err?.message);
            video.muted = true;
            player.play().catch(() => {});
            setIsMuted(true);
          });
        }

        player.on(mpegts.Events.ERROR, () => {
          triggerAutoFallback('ts', 'mpegts_error');
        });
        return true;
      } catch (err) {
        console.warn('[mpegts] Error initializing player:', err);
        return false;
      }
    };

    // Reusable HLS Player Launcher via Hls.js
    const startHlsPlayer = (targetUrl) => {
      try {
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
          nudgeMaxRetry: 5,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          }
        });

        ctrl.hls = hls;
        hls.loadSource(targetUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (switchRequestIdRef.current !== reqId) return;
          applyStreamQualityToHls(dataSaverMode, hls);
          if (!isBackgroundPreload) {
            video.muted = false;
            video.volume = 1.0;
          }
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('[HLS Autoplay Blocked]: muting video to enable playback:', err?.message);
              video.muted = true;
              video.play().catch(() => {});
              setIsMuted(true);
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (switchRequestIdRef.current !== reqId) return;
          if (data.fatal) {
            console.warn('[HLS Fatal Error]:', data.type, data.details);
            triggerAutoFallback('hls', 'hls_fatal_error');
          }
        });
        return true;
      } catch (err) {
        console.warn('[HLS] Error initializing player:', err);
        return false;
      }
    };

    // Stalling Watchdog (> 3.5s stall auto-fallback without user intervention)
    video.onwaiting = () => {
      if (switchRequestIdRef.current !== reqId) return;
      try { ctrl.hls?.startLoad(); } catch(e) {}
      if (!firstFrameFired && !stallWatchdog && !fallbackAttempted) {
        stallWatchdog = setTimeout(() => {
          triggerAutoFallback(ctrl.mpegts ? 'ts' : 'hls', 'stall_3500ms');
        }, 3500);
        ctrl.stallWatchdog = stallWatchdog;
      }
    };

    video.onstalled = () => {
      if (switchRequestIdRef.current !== reqId) return;
      try { ctrl.hls?.startLoad(); } catch(e) {}
      if (!firstFrameFired && !stallWatchdog && !fallbackAttempted) {
        stallWatchdog = setTimeout(() => {
          triggerAutoFallback(ctrl.mpegts ? 'ts' : 'hls', 'stall_3500ms');
        }, 3500);
        ctrl.stallWatchdog = stallWatchdog;
      }
    };

    // 1. RAW MPEG-TS via mpegts.js (MSE) — Optimized for smooth, stutter-free live streaming
    if ((streamEngine === 'ts' || isRawTsStream(streamUrl)) && mpegts.isSupported()) {
      if (startMpegtsPlayer(streamUrl)) {
        return;
      }
    }

    // 2. HLS via Hls.js — Optimized for rock-solid IPTV streaming without cutting out
    if (Hls.isSupported() && streamUrl) {
      if (startHlsPlayer(streamUrl)) {
        return;
      }
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

  // Commit Channel Switch (Seamless Dual-Player Crossfade with Zero Black Gap)
  const commitSlotSwitch = (targetChannel, slotToActivate = null, reqId = null) => {
    if (!targetChannel) return;
    if (reqId && switchRequestIdRef.current !== reqId) return;

    // Clear active timers & countdown
    if (stageTimer5sRef.current) {
      clearTimeout(stageTimer5sRef.current);
      stageTimer5sRef.current = null;
    }
    clearCountdown();
    setPreloadState(null);
    preloadStateRef.current = null;
    pendingZapChannelRef.current = null;
    pendingZapIndexRef.current = null;
    persistentTargetChannelRef.current = targetChannel;

    // Show crisp OSD channel badge for 3.5 seconds
    setSwitchingChannel(targetChannel);
    stageTimer5sRef.current = setTimeout(() => {
      setSwitchingChannel(null);
      stageTimer5sRef.current = null;
    }, 3500);

    // Update selectedChannel
    setSelectedChannel(targetChannel);
    try {
      localStorage.setItem('kobin_last_watched_channel_id', targetChannel.id);
      localStorage.setItem('nndd_last_channel_id', targetChannel.id);
    } catch(e) {}
    try {
      updateDeviceActivity(deviceIdentity?.serialNumber || deviceIdentity?.macAddress, targetChannel.name);
    } catch(e) {}

    // Special handling for Channel #1 (KOBIN.Tv Broadcast Channel - ALWAYS FREE)
    // Exception: KOBIN TV HD does not consume LionOTT connections, so no connection conflict!
    if (targetChannel.id === 'ch-dabin-tv-custom' || targetChannel.isCustomDabinChannel) {
      disposeSlotController('A');
      disposeSlotController('B');
      dismissFreezeFrame();
      setIsStreamLoading(false);
      setIsChannelOffline(false);
      setIsBackupStreamActive(false);
      return;
    }

    // For any server channels (Channel 2+), if subscription is expired / inactive:
    if (!isUserSubscribed) {
      disposeSlotController('A');
      disposeSlotController('B');
      dismissFreezeFrame();
      setIsStreamLoading(false);
      setIsChannelOffline(false);
      setIsBackupStreamActive(false);
      return;
    }

    const currentSlot = activeSlot;
    const targetSlot = slotToActivate || (currentSlot === 'A' ? 'B' : 'A');

    const wasLionOtt = isLionOttChannel(selectedChannel);
    const isTargetLionOtt = isLionOttChannel(targetChannel);

    // 1. STRICT SINGLE-CONNECTION TEARDOWN (PREVENT active_cons = 2):
    // The exact millisecond a user selects a new channel:
    // a. Immediately capture current video frame of outgoing channel onto overlay <canvas> covering player so screen does NOT go black.
    captureVideoFreezeFrame();

    // b. INSTANTLY kill and close the outgoing stream connection BEFORE opening HTTP request for new LionOTT channel!
    disposeSlotController('A');
    disposeSlotController('B');

    setActiveSlot(targetSlot);
    setIsStreamLoading(true);
    setIsChannelOffline(false);
    setIsBackupStreamActive(false);

    const executeStreamOpen = () => {
      const newReqId = ++switchRequestIdRef.current;
      startPlayerForSlot(targetSlot, targetChannel, newReqId, false, serverMode === 'auto' ? 7000 : 8000, () => {
        dismissFreezeFrame();
      });
    };

    // c. Add 50ms micro-delay after destroying old stream ONLY if switching between two LionOTT streams,
    // ensuring the upstream server registers the disconnect cleanly and never sees 2 simultaneous connections.
    if (wasLionOtt && isTargetLionOtt) {
      pendingSwitchTimeoutRef.current = setTimeout(() => {
        pendingSwitchTimeoutRef.current = null;
        executeStreamOpen();
      }, 50);
    } else {
      executeStreamOpen();
    }
  };

  // Perform Channel Switch (5-Second Zapping Delay & Strict Single-Connection Freeze-Frame Swapping)
  const performChannelSwitch = (targetChannel, immediate = false) => {
    if (!targetChannel) return;

    persistentTargetChannelRef.current = targetChannel;

    // Clear any active timers & countdown
    if (stageTimer5sRef.current) {
      clearTimeout(stageTimer5sRef.current);
      stageTimer5sRef.current = null;
    }
    if (pendingSwitchTimeoutRef.current) {
      clearTimeout(pendingSwitchTimeoutRef.current);
      pendingSwitchTimeoutRef.current = null;
    }

    if (immediate) {
      commitSlotSwitch(targetChannel, null, null);
      return;
    }

    // 5-Second Zapping Delay:
    clearCountdown();
    setSwitchingChannel(targetChannel);
    startCountdown();

    const targetSlot = activeSlot === 'A' ? 'B' : 'A';
    const reqId = ++switchRequestIdRef.current;

    preloadStateRef.current = { targetChannel, slot: targetSlot, reqId, isReady: false };
    setPreloadState(preloadStateRef.current);

    // Channel #1 KOBIN.Tv broadcast channel special case
    if (targetChannel.id === 'ch-dabin-tv-custom' || targetChannel.isCustomDabinChannel) {
      stageTimer5sRef.current = setTimeout(() => {
        stageTimer5sRef.current = null;
        commitSlotSwitch(targetChannel, targetSlot, reqId);
      }, 5000);
      return;
    }

    // SINGLE-CONNECTION PROTECTION:
    // Do NOT open background HTTP requests on LionOTT streams during the 5s preview countdown.
    // The current channel continues playing until the user commits (OK) or 5 seconds elapse without interruption.
    // When committed, commitSlotSwitch will capture the freeze frame and switch with zero black screen!
    stageTimer5sRef.current = setTimeout(() => {
      stageTimer5sRef.current = null;
      commitSlotSwitch(targetChannel, targetSlot, reqId);
    }, 5000);
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
      if (pendingSwitchTimeoutRef.current) clearTimeout(pendingSwitchTimeoutRef.current);
      if (freezeFadeTimerRef.current) clearTimeout(freezeFadeTimerRef.current);
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
    let streamUrl = activeEp ? activeEp.streamUrl : (item.streamUrl || 'https://stream.shams.tv/hls/0/stream.m3u8');
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && streamUrl && streamUrl.startsWith('http:')) {
      streamUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;
    }
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

  // Bottom Navigation Buttons on Dashboard (Minimalist, Zero Clutter)
  const BOTTOM_BUTTONS = [
    { id: 'settings', label: t('settings'), icon: Sliders, tab: 'settings' },
    { id: 'series', label: t('series'), icon: Film, tab: 'series' },
    { id: 'live', label: t('live'), icon: Tv, tab: 'live', isDefault: true },
    { id: 'movies', label: t('movies'), icon: Film, tab: 'movies' },
    { id: 'about', label: t('about'), icon: Info, tab: 'about' }
  ];

  // Centralized Back Navigation: Live -> Dashboard, Dashboard -> Press again to exit
  const handleBackAction = () => {
    if (showSearchKeyboard) {
      setShowSearchKeyboard(false);
      return;
    }
    if (showCategoryModal) {
      setShowCategoryModal(false);
      return;
    }
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

      // Direct numeric keypad channel jumping (0-9) on TV Remote with 1200ms buffer & category alignment
      const isInputFocused = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
      if (
        /^[0-9]$/.test(e.key) &&
        !parentalPinModalOpen &&
        !isEditPinModalOpen &&
        !isActivationModalOpen &&
        !isInputFocused &&
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
            const targetIndex = targetNum - 1;
            const pool = (filteredChannels && filteredChannels.length > 0) ? filteredChannels : channels;
            const found = pool[targetIndex] || channels.find(c => c.number === targetNum);
            if (found) {
              if (activeTab !== 'live') {
                handleSelectTab('live');
              }
              handleSelectChannelWithLockCheck(found, false);
            }
            setNumericZapBuffer('');
            numericZapTimerRef.current = null;
          }, 1200);
          return nextBuf;
        });
        return;
      }

      // Enter / OK commits numeric jump immediately without waiting 1.2s!
      if ((e.key === 'Enter' || e.key === 'Select' || e.keyCode === 13) && numericZapBuffer) {
        e.preventDefault();
        if (numericZapTimerRef.current) {
          clearTimeout(numericZapTimerRef.current);
          numericZapTimerRef.current = null;
        }
        const targetNum = parseInt(numericZapBuffer, 10);
        const targetIndex = targetNum - 1;
        const pool = (filteredChannels && filteredChannels.length > 0) ? filteredChannels : channels;
        const found = pool[targetIndex] || channels.find(c => c.number === targetNum);
        if (found) {
          if (activeTab !== 'live') {
            handleSelectTab('live');
          }
          handleSelectChannelWithLockCheck(found, false);
        }
        setNumericZapBuffer('');
        return;
      }

      // In dashboard mode, allow full remote navigation: Up/Down switches background channel directly!
      if (activeTab === 'dashboard') {
        const isUp = e.key === 'ArrowUp' || e.key === 'Up' || e.key === 'ChannelUp' || e.keyCode === 38 || e.keyCode === 19 || e.keyCode === 427;
        const isDown = e.key === 'ArrowDown' || e.key === 'Down' || e.key === 'ChannelDown' || e.keyCode === 40 || e.keyCode === 20 || e.keyCode === 428;
        const isLeft = e.key === 'ArrowLeft' || e.key === 'Left' || e.keyCode === 37 || e.keyCode === 21;
        const isRight = e.key === 'ArrowRight' || e.key === 'Right' || e.keyCode === 39 || e.keyCode === 22;
        const isSelect = e.key === 'Enter' || e.key === 'Select' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66;

        // User mandate: Dashboard background is ALWAYS Channel 1 (KOBIN.Tv). Up/Down wakes up idle state without changing channel
        if (isUp) {
          e.preventDefault();
          if (isDashboardIdle) setIsDashboardIdle(false);
          return;
        } else if (isDown) {
          e.preventDefault();
          if (isDashboardIdle) setIsDashboardIdle(false);
          return;
        } else if (isRight) {
          e.preventDefault();
          if (isDashboardIdle) {
            setIsDashboardIdle(false);
            return;
          }
          setSelectedBottomIndex(prev => Math.max(0, prev - 1));
          return;
        } else if (isLeft) {
          e.preventDefault();
          if (isDashboardIdle) {
            setIsDashboardIdle(false);
            return;
          }
          setSelectedBottomIndex(prev => Math.min(BOTTOM_BUTTONS.length - 1, prev + 1));
          return;
        } else if (isSelect) {
          e.preventDefault();
          if (isDashboardIdle) {
            setIsDashboardIdle(false);
          }
          const targetTab = BOTTOM_BUTTONS[selectedBottomIndex]?.tab || 'live';
          handleSelectTab(targetTab);
          return;
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
                            e.keyCode === 228 || e.key === 'AspectRatio' || e.key === 'Aspect' || e.key === 'Zoom' || e.key === 'PictureSize' ||
                            (!isInputFocused && !showSearchKeyboard && (e.key === 'y' || e.key === 'Y' || e.key === 'a' || e.key === 'A' || e.key === 'F3' || e.key === 'F8'));
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

        // 1-by-1 Channel Step Keys (Arrow Up / Down / Channel Up / Down)
        const isStepUpKey = e.key === 'ArrowUp' || e.key === 'Up' || e.key === 'ChannelUp' || 
                            e.keyCode === 38 || e.keyCode === 19 || e.keyCode === 427;

        const isStepDownKey = e.key === 'ArrowDown' || e.key === 'Down' || e.key === 'ChannelDown' || 
                              e.keyCode === 40 || e.keyCode === 20 || e.keyCode === 428;

        // 10-Channel Jump Keys (Volume + / - / PageUp / PageDown)
        const isJumpPrevKey = e.key === 'PageUp' || e.key === '+' || e.key === '=' || 
                              e.key === 'AudioVolumeUp' || e.key === 'VolumeUp' || 
                              e.keyCode === 33 || e.keyCode === 107 || e.keyCode === 187 || e.keyCode === 175 || e.keyCode === 166;

        const isJumpNextKey = e.key === 'PageDown' || e.key === '-' || e.key === '_' || 
                              e.key === 'AudioVolumeDown' || e.key === 'VolumeDown' || 
                              e.keyCode === 34 || e.keyCode === 109 || e.keyCode === 189 || e.keyCode === 174 || e.keyCode === 167;

        const isUpKey = isStepUpKey;
        const isDownKey = isStepDownKey;

        const isSelectKey = e.key === 'Enter' || e.key === 'Select' || e.key === ' ' || 
                            e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66;

        const isBackKey = e.key === 'Escape' || e.key === 'Back' || e.key === 'GoBack' || e.key === 'Backspace' || 
                          e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 4 || e.keyCode === 10009 || e.keyCode === 461;

        const isLeftKey = e.key === 'ArrowLeft' || e.key === 'Left' || e.keyCode === 37 || e.keyCode === 21;
        const isRightKey = e.key === 'ArrowRight' || e.key === 'Right' || e.keyCode === 39 || e.keyCode === 22;

        // 1. Navigation inside On-Screen Mini Virtual Keyboard
        if (showSearchKeyboard) {
          const currentKeys = keyboardLang === 'ku' ? KU_KEYBOARD_KEYS : keyboardLang === 'ar' ? AR_KEYBOARD_KEYS : EN_KEYBOARD_KEYS;
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
          const totalCats = dynamicCategories.length;

          // Pane Switching via Left / Right keys (ArrowLeft / ArrowRight)
          if (isRtl ? isLeftKey : isRightKey) {
            // Move from categories column to channels column
            if (drawerActivePane === 'categories') {
              e.preventDefault();
              setDrawerActivePane('channels');
              return;
            }
          } else if (isRtl ? isRightKey : isLeftKey) {
            // Move from channels column to categories column
            if (drawerActivePane === 'channels') {
              e.preventDefault();
              setDrawerActivePane('categories');
              return;
            }
          }

          if (drawerActivePane === 'categories') {
            if (isStepUpKey) {
              e.preventDefault();
              if (totalCats > 0) {
                setCategoryFocusedIndex(prev => (prev - 1 + totalCats) % totalCats);
              }
              return;
            } else if (isStepDownKey) {
              e.preventDefault();
              if (totalCats > 0) {
                setCategoryFocusedIndex(prev => (prev + 1) % totalCats);
              }
              return;
            } else if (isSelectKey) {
              e.preventDefault();
              const cat = dynamicCategories[categoryFocusedIndex];
              if (cat) {
                setChannelCategory(cat);
                setDrawerActivePane('channels');
                setDrawerFocusedIndex(0);
                showColorToast('cyan', `پۆل: ${getCategoryDisplayName(cat)}`);
              }
              return;
            }
          } else {
            // drawerActivePane === 'channels'
            if (isStepUpKey) {
              e.preventDefault();
              if (total > 0) {
                setDrawerFocusedIndex(prev => {
                  const nextIdx = (prev - 1 + total) % total;
                  drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'auto' });
                  return nextIdx;
                });
              }
              return;
            } else if (isStepDownKey) {
              e.preventDefault();
              if (total > 0) {
                setDrawerFocusedIndex(prev => {
                  const nextIdx = (prev + 1) % total;
                  drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'auto' });
                  return nextIdx;
                });
              }
              return;
            } else if (isJumpPrevKey) {
              e.preventDefault();
              if (total > 0) {
                setDrawerFocusedIndex(prev => {
                  const nextIdx = (prev - 10 + total) % total;
                  drawerItemRefs.current[nextIdx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                  return nextIdx;
                });
              }
              return;
            } else if (isJumpNextKey) {
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
                performChannelSwitch(targetChannel, true);
                setShowChannelDrawer(false);
              }
              return;
            }
          }

          if (isBackKey) {
            e.preventDefault();
            clearDrawerCountdown();
            setShowChannelDrawer(false);
            return;
          }
        } else {
          // When Channel Drawer is CLOSED: Up/Down zaps channels, Select/Left/Right/Space opens drawer
          if (isUpKey) {
            e.preventDefault();
            switchChannelRelative(-1);
          } else if (isDownKey) {
            e.preventDefault();
            switchChannelRelative(1);
          } else if (isSelectKey || isLeftKey || isRightKey) {
            e.preventDefault();
            const isActivelyZapping = Boolean(switchingChannel || pendingZapChannelRef.current);
            if (isSelectKey && isActivelyZapping) {
              const commitChannel = pendingZapChannelRef.current || switchingChannel;
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
              setDrawerActivePane('channels');
              setShowChannelDrawer(true);
            }
          }
        }

      } else if (activeTab === 'settings') {
        const isInputFocused = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        const isUpKey = e.key === 'ArrowUp' || e.key === 'Up' || e.keyCode === 38 || e.keyCode === 19;
        const isDownKey = e.key === 'ArrowDown' || e.key === 'Down' || e.keyCode === 40 || e.keyCode === 20;
        const isPageUp = e.key === 'PageUp' || e.keyCode === 33 || e.key === '+' || e.key === '=';
        const isPageDown = e.key === 'PageDown' || e.keyCode === 34 || e.key === '-' || e.key === '_';
        const isBackKey = e.key === 'Escape' || e.key === 'Back' || e.key === 'GoBack' || e.key === 'Backspace' || e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 4;

        if (isBackKey && !isInputFocused) {
          e.preventDefault();
          handleSelectTab('dashboard');
          return;
        }

        if (!isInputFocused) {
          if (isUpKey) {
            e.preventDefault();
            settingsScrollRef.current?.scrollBy({ top: -180, behavior: 'smooth' });
          } else if (isDownKey) {
            e.preventDefault();
            settingsScrollRef.current?.scrollBy({ top: 180, behavior: 'smooth' });
          } else if (isPageUp) {
            e.preventDefault();
            settingsScrollRef.current?.scrollBy({ top: -450, behavior: 'smooth' });
          } else if (isPageDown) {
            e.preventDefault();
            settingsScrollRef.current?.scrollBy({ top: 450, behavior: 'smooth' });
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
      : (channelCategory && channelCategory !== 'هەموو' && channelCategory !== 'هەمووی' && channelCategory !== 'all' && filteredChannels.length > 0)
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

    // Instant 0ms visual feedback: update target channel name and number in the HUD
    setSwitchingChannel(targetChannel);

    // Fast 180ms debounce so rapid zapping (1 -> 2 -> 3) settles cleanly before stream load
    zapDebounceTimerRef.current = setTimeout(() => {
      zapDebounceTimerRef.current = null;
      const finalChannel = persistentTargetChannelRef.current || pendingZapChannelRef.current;
      pendingZapChannelRef.current = null;
      pendingZapIndexRef.current = null;

      if (!finalChannel) return;

      // Start 5-second zapping countdown on settled target channel
      performChannelSwitch(finalChannel, false);
    }, 180);

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
        const savedId = localStorage.getItem('kobin_last_watched_channel_id') || localStorage.getItem('nndd_last_channel_id');
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

  const handleSelectChannelWithLockCheck = (ch, keepDrawer = false, immediate = false) => {
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
      performChannelSwitch(ch, true);
    }
  };

  const handleDrawerChannelSelect = (targetChannel) => {
    if (!targetChannel) return;

    if (targetChannel.isLocked) {
      handleSelectChannelWithLockCheck(targetChannel, true, true);
      return;
    }

    const isAlreadyPlaying = selectedChannel && (String(selectedChannel.id) === String(targetChannel.id) || selectedChannel.id === targetChannel.id);
    const isAlreadyPreloading = switchingChannel && (String(switchingChannel.id) === String(targetChannel.id) || switchingChannel.id === targetChannel.id);

    // If channel is already actively playing and not currently switching: close drawer cleanly
    if (isAlreadyPlaying && !isAlreadyPreloading) {
      setShowChannelDrawer(false);
      return;
    }

    // 2nd OK / repeating select: Commit immediately and close drawer!
    if (isAlreadyPreloading) {
      performChannelSwitch(targetChannel, true);
      setShowChannelDrawer(false);
      return;
    }

    // 1st OK: Start 5-second zapping countdown with visual countdown badge while keeping drawer open!
    performChannelSwitch(targetChannel, false);
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
        {/* Slot A Video Player (Active in Live TV when selectedChannel is NOT Channel 1) */}
        <video
          ref={videoRefA}
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            activeSlot === 'A' && activeTab === 'live' && !(selectedChannel?.id === 'ch-dabin-tv-custom' || selectedChannel?.isCustomDabinChannel)
              ? 'opacity-100 z-10' 
              : 'opacity-0 z-0 pointer-events-none'
          } ${getVideoAspectClass()}`}
          autoPlay
          playsInline
          muted={activeSlot === 'A' && activeTab === 'live' ? isMuted : true}
        />

        {/* Slot B Video Player (Active in Live TV when selectedChannel is NOT Channel 1) */}
        <video
          ref={videoRefB}
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            activeSlot === 'B' && activeTab === 'live' && !(selectedChannel?.id === 'ch-dabin-tv-custom' || selectedChannel?.isCustomDabinChannel)
              ? 'opacity-100 z-10' 
              : 'opacity-0 z-0 pointer-events-none'
          } ${getVideoAspectClass()}`}
          autoPlay
          playsInline
          muted={activeSlot === 'B' && activeTab === 'live' ? isMuted : true}
        />

        {/* Zero-Black-Screen Freeze-Frame Canvas Overlay (Strict Single-Connection Protection) */}
        <canvas
          ref={freezeCanvasRef}
          className={`absolute inset-0 transition-opacity duration-150 ease-out ${getVideoAspectClass()} ${
            isFreezeFrameActive
              ? freezeFrameFadingOut
                ? 'opacity-0 z-15'
                : 'opacity-100 z-15'
              : 'opacity-0 z-0 pointer-events-none'
          }`}
          style={{
            display: isFreezeFrameActive ? 'block' : 'none'
          }}
        />

        {/* Cinematic Looping Background for Dashboard (Apple TV / Netflix Dark Cinema Aurora with bg-black/60 backdrop-blur-md) */}
        {activeTab === 'dashboard' && (
          <CinematicBackground 
            onWakeup={() => {
              if (isDashboardIdle) setIsDashboardIdle(false);
            }} 
          />
        )}

        {/* Custom KOBIN.Tv Broadcast Channel Player (Active strictly on Live TV when Channel 1 is selected) */}
        {activeTab === 'live' && (selectedChannel?.id === 'ch-dabin-tv-custom' || selectedChannel?.isCustomDabinChannel) && (
          <div className="absolute inset-0 z-20 pointer-events-auto">
            <DabinChannelPlayer
              isMuted={isMuted}
              volume={volume}
              aspectRatioMode={liveAspectRatioMode}
            />
          </div>
        )}

        {/* Minimal Buttonless Black Notice for Expired / Unassigned Channels (ONLY shown in Live TV, never on Dashboard) */}
        {activeTab === 'live' && (!selectedChannel?.isCustomDabinChannel && selectedChannel?.id !== 'ch-dabin-tv-custom') && !isUserSubscribed && (
          <div 
            onClick={() => setIsActivationModalOpen(true)}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black select-none animate-fade-in cursor-pointer pointer-events-auto"
            title="کرتە بکە بۆ چوونەژوورەوە یان کاراکردنی شاشە"
          >
            <div className="flex flex-col items-center gap-2 px-5 py-3.5 rounded-2xl bg-black/95 border border-zinc-800/80 shadow-[0_10px_35px_rgba(0,0,0,0.95)] text-center max-w-xs sm:max-w-sm hover:border-cyan-500/40 transition-all">
              {/* Small KOBIN Logo */}
              <img 
                src="/kobin-logo.png" 
                alt="KOBIN.Tv" 
                className="h-6 sm:h-7 w-auto object-contain opacity-90 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]"
              />

              {/* Notice Title */}
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-white font-sans tracking-wide">
                  تکایە پاکێجەکەت نوێ بکەرەوە
                </span>
              </div>

              {/* Minimal MAC Display & Server Status */}
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-mono text-zinc-400 tracking-wider">
                <span>MAC: <span className="text-cyan-400 font-semibold">{deviceIdentity?.macAddress || 'K0:B1:24:...'}</span></span>
                <span className="text-zinc-600">|</span>
                <span className={`flex items-center gap-1 font-sans ${
                  serverConnectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${serverConnectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                  {serverConnectionStatus === 'connected' ? 'پەیوەستە بە سێرڤەر' : 'خەریکی پەیوەستبوونە...'}
                </span>
              </div>

              {/* Discreet Clickable Prompt */}
              <span className="text-[10px] text-cyan-300/80 hover:text-cyan-200 mt-0.5 flex items-center gap-1">
                🔑 بۆ چوونەژوورەوە یان چالاککردن کرتە لێرە بکە
              </span>
            </div>
          </div>
        )}

        {/* Clean Waiting / Auto Background Server Switching UI (Live TV Only) */}
        {activeTab === 'live' && isChannelOffline && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 px-6 text-center select-none animate-fade-in pointer-events-none">
            {/* Pure White Crisp NNDD TV Logo */}
            <div className="mb-4 transform transition-transform duration-700 animate-scale-up">
              <NnddLogo glow={true} className="h-16 sm:h-20 w-auto filter drop-shadow-[0_0_24px_rgba(255,255,255,0.3)]" />
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

      {/* Orientation Suggestion / Landscape Lock for Mobile Web */}
      {isMobileDevice && isPortrait && (
        <div className="fixed top-3 inset-x-0 mx-auto w-fit z-50 animate-bounce pointer-events-auto">
          <button
            type="button"
            onClick={async () => {
              try {
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen().catch(() => {});
                }
                if (window.screen?.orientation?.lock) {
                  await window.screen.orientation.lock('landscape').catch(() => {});
                }
              } catch(e) {}
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-amber-400/50 backdrop-blur-md shadow-2xl cursor-pointer text-xs font-bold active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>🔒 قوفڵکردنی لاندسکەیپ (Landscape Lock)</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          TOP HEADER: ONLY renders when NOT in live TV mode!
          (In Live mode, the entire top bar is completely hidden for 100% immersion)
         ========================================================================= */}
      {activeTab !== 'live' && (
        <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5">
          
          {/* Left: Pure Crisp KOBIN.TV Logo (gently dims during screensaver) */}
          <div className={`flex items-center gap-2.5 sm:gap-3 transition-opacity duration-700 ${
            isDashboardIdle && activeTab === 'dashboard' ? 'opacity-20' : 'opacity-100'
          }`}>
            <div 
              onClick={() => setIsActivationModalOpen(true)}
              className="flex items-center select-none cursor-pointer" 
              title="KOBIN TV - کردنەوەی پەنجەرەی هەژمار و چالاککردن"
            >
              <NnddLogo glow={true} className="h-8 sm:h-9 md:h-10 w-auto filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]" />
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
              {/* Dynamic Weather Widget & Clock */}
              <DynamicWeatherWidget language={language} />

              {/* Big Clock & Date */}
              <div className="text-end">
                <div className="text-2xl font-light tracking-tight text-white font-mono flex items-center justify-end gap-1.5 drop-shadow-md">
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
          APPLE TV CINEMA FLOATING CLOCK, DATE & LIVE WEATHER
          Snaps ultra-fast (250ms) for high-performance Smart TV responsiveness
          Pure white typography, refined scale
         ======================================================== */}
      {activeTab === 'dashboard' && (
        <div 
          onClick={() => {
            if (isDashboardIdle) setIsDashboardIdle(false);
          }}
          className={`fixed z-30 transition-all duration-250 ease-out select-none will-change-transform transform-gpu ${
            isDashboardIdle
              ? 'top-1/2 left-8 sm:left-14 md:left-24 -translate-y-1/2 flex flex-col items-start justify-center text-start scale-100 pointer-events-auto cursor-pointer'
              : 'top-6 end-6 sm:end-8 flex flex-col items-end justify-start text-end scale-95 pointer-events-auto'
          }`}
        >
          {/* 1. Cinematic Clock (Pure White, Very Large on Left) */}
          <div className="flex items-center gap-2 sm:gap-3 drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
            <span className={`font-light font-mono tracking-tight text-white transition-all duration-250 ease-out will-change-transform ${
              isDashboardIdle 
                ? 'text-7xl sm:text-8xl md:text-9xl' 
                : 'text-2xl sm:text-3xl'
            }`}>
              {timeString}
            </span>
          </div>

          {/* 2. Date (Pure White) */}
          <div className={`font-medium text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)] transition-all duration-250 ease-out ${
            isDashboardIdle 
              ? 'text-lg sm:text-xl md:text-2xl mt-3 text-start' 
              : 'text-[11px] mt-0.5 text-end'
          }`}>
            <span>{dateFormatted}</span>
          </div>

          {/* 3. Weather Info (Pure White, No Background Card) */}
          <div className={`flex items-center gap-2.5 text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)] transition-all duration-250 ease-out ${
            isDashboardIdle 
              ? 'text-base sm:text-lg md:text-xl font-normal mt-3.5 justify-start' 
              : 'text-xs font-normal mt-1 justify-end'
          }`}>
            <CloudSun className={`text-white shrink-0 transition-all duration-250 ${
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
          <CinemaDock
            isDashboardIdle={isDashboardIdle}
            setIsDashboardIdle={setIsDashboardIdle}
            dockScale={dockScale}
            bottomButtons={BOTTOM_BUTTONS}
            selectedBottomIndex={selectedBottomIndex}
            setSelectedBottomIndex={setSelectedBottomIndex}
            dashboardFocusZone={dashboardFocusZone}
            setDashboardFocusZone={setDashboardFocusZone}
            onSelectTab={handleSelectTab}
            t={t}
          />
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
          onDoubleClick={(e) => {
            if (e.target?.closest?.('button, input, select, textarea, [data-interactive="true"]')) return;
            setShowChannelDrawer(prev => !prev);
          }}
        >

          {/* Top-Corner Floating Live Controls HUD: Channel Drawer Button, Audio Unmute, and Engine Switcher */}
          <div className="fixed top-4 start-4 z-40 flex items-center gap-2 select-none animate-fade-in pointer-events-auto">
            {/* Floating Channels & Categories Drawer Button (Minimalist Icon-Only) */}
            <button
              type="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setShowChannelDrawer(prev => !prev);
              }}
              className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-2xl shadow-[0_8px_25px_rgba(0,0,0,0.6)] cursor-pointer transition-all active:scale-95 group focus-visible:ring-2 focus-visible:ring-white outline-none"
              title="لیستی کەناڵەکان (Channel List)"
            >
              <Tv className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Audio Unmute Button (Shown when audio is muted by browser policy - Minimalist Icon-Only) */}
            {isMuted && (
              <button
                type="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(false);
                  if (videoRefA.current) { videoRefA.current.muted = false; videoRefA.current.volume = volume / 100 || 1.0; }
                  if (videoRefB.current) { videoRefB.current.muted = false; videoRefB.current.volume = volume / 100 || 1.0; }
                }}
                className="p-2.5 rounded-2xl bg-amber-500/80 hover:bg-amber-500 text-black border border-amber-300 backdrop-blur-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer transition-all active:scale-95 animate-pulse focus-visible:ring-2 focus-visible:ring-white outline-none"
                title="بێدەنگکردن لابدە (Unmute Audio)"
              >
                <VolumeX className="w-4 h-4 text-black" />
              </button>
            )}

            {/* Stream Format Switcher Button (HLS .m3u8 vs MPEG-TS .ts - Minimalist Icon-Only) */}
            <button
              type="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                const next = streamEngine === 'm3u8' ? 'ts' : 'm3u8';
                setStreamEngine(next);
                try { localStorage.setItem('nndd_stream_engine', next); } catch(e) {}
                showColorToast(next === 'm3u8' ? 'blue' : 'yellow', `مۆدی پەخش: ${next === 'm3u8' ? 'HLS (.m3u8)' : 'MPEG-TS (.ts)'}`);
                if (selectedChannel) {
                  performChannelSwitch(selectedChannel, true);
                }
              }}
              className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-2xl cursor-pointer transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white outline-none"
              title={`مۆدی پەخش: ${streamEngine === 'm3u8' ? 'HLS (.m3u8)' : 'MPEG-TS (.ts)'}`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* ========================================================
              FLOATING GLASS CHANNEL LIST DRAWER WITH REMOTE COLOR KEYS & MINI KEYBOARD
             ======================================================== */}
          <ChannelDrawer
            show={showChannelDrawer}
            onClose={() => setShowChannelDrawer(false)}
            drawerScale={drawerScale}
            isRtl={isRtl}
            language={language}
            filteredChannels={filteredChannels}
            channels={channels}
            selectedChannel={selectedChannel}
            switchingChannel={switchingChannel}
            channelCategory={channelCategory}
            setChannelCategory={setChannelCategory}
            dynamicCategories={dynamicCategories}
            getCategoryDisplayName={getCategoryDisplayName}
            channelFilterMode={channelFilterMode}
            setChannelFilterMode={setChannelFilterMode}
            isChannelEditMode={isChannelEditMode}
            setIsChannelEditMode={setIsChannelEditMode}
            handleEditClick={handleEditClick}
            drawerActivePane={drawerActivePane}
            setDrawerActivePane={setDrawerActivePane}
            categoryFocusedIndex={categoryFocusedIndex}
            setCategoryFocusedIndex={setCategoryFocusedIndex}
            drawerFocusedIndex={drawerFocusedIndex}
            setDrawerFocusedIndex={setDrawerFocusedIndex}
            drawerItemRefs={drawerItemRefs}
            favoriteChannelIds={favoriteChannelIds}
            toggleFavoriteChannel={toggleFavoriteChannel}
            countdownRemaining={countdownRemaining}
            performChannelSwitch={performChannelSwitch}
            moveChannelInList={moveChannelInList}
            removeChannelFromList={removeChannelFromList}
            showCategoryModal={showCategoryModal}
            setShowCategoryModal={setShowCategoryModal}
            toggleCategorySelector={toggleCategorySelector}
            showSearchKeyboard={showSearchKeyboard}
            setShowSearchKeyboard={setShowSearchKeyboard}
            toggleSearchKeyboard={toggleSearchKeyboard}
            cycleAspectRatio={cycleAspectRatio}
            cycleChannelFilter={cycleChannelFilter}
            showColorToast={showColorToast}
            keyboardLang={keyboardLang}
            setKeyboardLang={setKeyboardLang}
            keyboardFocusedIndex={keyboardFocusedIndex}
            setKeyboardFocusedIndex={setKeyboardFocusedIndex}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            t={t}
          />

          <LiveZapOverlay
            targetChannel={switchingChannel || preloadState?.targetChannel}
            countdownRemaining={countdownRemaining}
            isCountdownActive={countdownRemaining > 0 && countdownRemaining <= 5}
            isFreezeFrameActive={isFreezeFrameActive}
            switchRequestId={switchRequestIdRef.current}
            isRtl={isRtl}
            language={language}
            numericZapBuffer={numericZapBuffer}
            gestureFeedback={gestureFeedback}
            aspectRatioToast={aspectRatioToast}
            colorToast={colorToast}
            serverFingerprint={getServerFingerprint(selectedChannel)}
          />

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
                <span>سینەمای کوردی و جیهانی • KOBIN.Tv Series</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide flex items-center gap-3">
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
                  type="button"
                  tabIndex={0}
                  onClick={() => setSeriesCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none ${
                    seriesCategoryFilter === cat
                      ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? t('all') : cat === 'favorites' ? '⭐ دڵخوازەکان' : getLocalizedVodCategoryName(cat, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Series Grid: Delicate illuminated BLUE border (User requirement: بۆ زنجیرەکان با شین بێت) */}
          {paginatedSeries.length === 0 ? (
            <div className="relative z-10 py-16 flex flex-col items-center justify-center text-center gap-3">
              <Film className="w-10 h-10 text-blue-400 animate-pulse" />
              <p className="text-sm font-semibold text-white">خەریکی هاوردەکردنی زنجیرەکانە لە سێرڤەری سەرەکی...</p>
              <p className="text-xs text-slate-400">تکایە کەمێک چاوەڕوان بە تا داتای سێرڤەر دێتە خوارەوە.</p>
            </div>
          ) : (
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {paginatedSeries.map((item, index) => {
              const isFocused = vodFocusedIndex === index;
              return (
                <div 
                  key={item.id}
                  tabIndex={0}
                  role="button"
                  ref={el => { vodSeriesCardRefs.current[index] = el; }}
                  onFocus={() => {
                    setHoveredVodItem(item);
                    setVodFocusedIndex(index);
                  }}
                  onMouseEnter={() => {
                    setHoveredVodItem(item);
                    setVodFocusedIndex(index);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedVodItem(item);
                      setSelectedVodType('series');
                      setVodEpisodeFocusedIndex(0);
                    }
                  }}
                  onClick={() => {
                    setSelectedVodItem(item);
                    setSelectedVodType('series');
                    setVodEpisodeFocusedIndex(0);
                  }}
                  className={`relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-white outline-none transform-gpu ${
                    isFocused
                      ? 'scale-105 border-2 border-white shadow-[0_0_35px_rgba(255,255,255,0.45)] ring-2 ring-white z-20'
                      : 'border border-white/15 hover:border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]'
                  } bg-slate-950/70 backdrop-blur-md`}
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
                    <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1 border border-white/20 shadow-md">
                      <Star className="w-3 h-3 fill-white text-white" />
                      <span>{item.rating}</span>
                    </div>

                    {/* Favorite Star Button Top Left */}
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVodFavorite(item.id);
                      }}
                      className="absolute top-2.5 start-2.5 z-20 p-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white hover:scale-110 active:scale-90 transition-transform cursor-pointer shadow-md"
                      title="Favorite"
                    >
                      <Star className={`w-3.5 h-3.5 ${favoriteVodIds.includes(item.id) ? 'fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'text-white/40 hover:text-white'} shrink-0`} />
                    </button>

                    {/* Category Badge Top Left next to Star */}
                    <div className="absolute top-2.5 start-10 px-2 py-0.5 rounded-lg bg-blue-950/80 backdrop-blur-md text-blue-300 text-[10px] font-bold border border-blue-500/30 truncate max-w-[100px]">
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
                    <h3 className="font-normal text-xs sm:text-sm text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{item.episodesCount} ئەڵقە</span>
                      <span className="text-white flex items-center gap-1 text-[10px] font-medium">
                        <span>ئەڵقەکان</span>
                        <ChevronLeft className="w-3 h-3 text-white" />
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          )}

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
                <span>سینەمای تایبەت • KOBIN.Tv 4K Movies</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-wide flex items-center gap-3">
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
                  type="button"
                  tabIndex={0}
                  onClick={() => setMoviesCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none ${
                    moviesCategoryFilter === cat
                      ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-400'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? t('all') : cat === 'favorites' ? '⭐ دڵخوازەکان' : getLocalizedVodCategoryName(cat, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Movies Grid: Delicate illuminated RED border (User requirement: چوارەم بۆ فلیم با سور بێت) */}
          {paginatedMovies.length === 0 ? (
            <div className="relative z-10 py-16 flex flex-col items-center justify-center text-center gap-3">
              <Film className="w-10 h-10 text-rose-400 animate-pulse" />
              <p className="text-sm font-semibold text-white">خەریکی هاوردەکردنی فیلمەکانی سینەمایە لە سێرڤەری سەرەکی...</p>
              <p className="text-xs text-slate-400">تکایە کەمێک چاوەڕوان بە تا داتای سێرڤەر دێتە خوارەوە.</p>
            </div>
          ) : (
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {paginatedMovies.map((item, index) => {
              const isFocused = vodFocusedIndex === index;
              return (
                <div 
                  key={item.id}
                  tabIndex={0}
                  role="button"
                  ref={el => { vodMovieCardRefs.current[index] = el; }}
                  onFocus={() => {
                    setHoveredVodItem(item);
                    setVodFocusedIndex(index);
                  }}
                  onMouseEnter={() => {
                    setHoveredVodItem(item);
                    setVodFocusedIndex(index);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedVodItem(item);
                      setSelectedVodType('movie');
                    }
                  }}
                  onClick={() => {
                    setSelectedVodItem(item);
                    setSelectedVodType('movie');
                  }}
                  className={`relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-white outline-none transform-gpu ${
                    isFocused
                      ? 'scale-105 border-2 border-white shadow-[0_0_35px_rgba(255,255,255,0.45)] ring-2 ring-white z-20'
                      : 'border border-white/15 hover:border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]'
                  } bg-slate-950/70 backdrop-blur-md`}
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
                    <div className="absolute top-2.5 end-2.5 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1 border border-white/20 shadow-md">
                      <Star className="w-3 h-3 fill-white text-white" />
                      <span>{item.rating}</span>
                    </div>

                    {/* Favorite Star Button Top Left */}
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVodFavorite(item.id);
                      }}
                      className="absolute top-2.5 start-2.5 z-20 p-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white hover:scale-110 active:scale-90 transition-transform cursor-pointer shadow-md"
                      title="Favorite"
                    >
                      <Star className={`w-3.5 h-3.5 ${favoriteVodIds.includes(item.id) ? 'fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'text-white/40 hover:text-white'} shrink-0`} />
                    </button>

                    {/* Category Badge Top Left next to Star */}
                    <div className="absolute top-2.5 start-10 px-2 py-0.5 rounded-lg bg-rose-950/80 backdrop-blur-md text-rose-300 text-[10px] font-bold border border-rose-500/30 truncate max-w-[100px]">
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
                    <h3 className="font-normal text-xs sm:text-sm text-white line-clamp-1 group-hover:text-rose-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span className="truncate max-w-[120px]">{item.category || item.genre || 'سینەما'}</span>
                      <span className="text-white flex items-center gap-1 text-[10px] font-medium shrink-0">
                        <span>پەخش</span>
                        <Play className="w-2.5 h-2.5 fill-white text-white" />
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          )}

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
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
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
          ref={settingsScrollRef}
          tabIndex={0}
          className="relative z-10 px-4 sm:px-8 pt-4 pb-28 max-w-4xl mx-auto h-[calc(100vh-110px)] max-h-[calc(100dvh-110px)] overflow-y-auto overflow-x-hidden animate-fade-in custom-internal-scrollbar focus:outline-none overscroll-contain select-text"
        >
          <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-apple-lg space-y-6 mb-12">
            
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-white" />
                <span>{t('settingsTitle')}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">{t('settingsSubtitle')}</p>
            </div>

            {/* Dual-Mode Login & Smart TV MAC Activation Card */}
            <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-blue-950/60 border border-cyan-500/30 rounded-2xl p-5 shadow-[0_4px_25px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                  <Tv className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{isDeviceServerActive(deviceIdentity) ? 'هەژمار و شاشەی پەیوەستکراو' : 'چوونەژوورەوە و چالاککردنی شاشە (Login / MAC)'}</span>
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                      isDeviceServerActive(deviceIdentity)
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {isDeviceServerActive(deviceIdentity) ? 'چالاکە ✓' : 'چاوەڕوانی چوونەژوورەوە'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {isDeviceServerActive(deviceIdentity)
                      ? `ئەکاونتی چالاک: ${deviceIdentity.xtream_user || deviceIdentity.activeUsername || 'KOBIN'} | ماک: ${deviceIdentity.macAddress}`
                      : 'دەتوانیت بە یوزەرنەیم و پاسۆرد بچیتە ژوورەوە یان لە ڕێگەی ماک ئەدرەسەوە شاشەکەت چالاک بکەیت.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsActivationModalOpen(true)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>{isDeviceServerActive(deviceIdentity) ? 'گۆڕینی هەژمار / زانیاری ماک' : 'چوونەژوورەوە و چالاککردن 🚀'}</span>
                </button>

                {(isDeviceServerActive(deviceIdentity) || !!activeXtreamConfig?.username || !!getSavedKobinSession()) && (
                  <button
                    type="button"
                    onClick={() => performKobinLogout()}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title="چوونەدەرەوە لەم هەژمارە"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>چوونەدەرەوە</span>
                  </button>
                )}
              </div>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRedeemCode();
                    } else if (e.key === 'ArrowDown') {
                      e.target.blur();
                      settingsScrollRef.current?.scrollBy({ top: 180, behavior: 'smooth' });
                    }
                  }}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t('username')}</span>
                  <span className="font-bold text-white">{currentUser.name}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t('plan')}</span>
                  <span className="font-bold text-emerald-400">{userPlanTitle}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t('statusDays')}</span>
                  <span className="font-bold text-amber-300">
                    {userPlanTier === 'free' ? t('freePlan') : t('daysRemaining', { days: subscriptionDaysRemaining })}
                  </span>
                </div>
              </div>
            </div>

            {/* UI Scale & Display Customization Card (ڕێکخستنی قەبارەی داشبۆرد و لیستی کەناڵەکان و مەسروفی ئینتەرنێت) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                  <span>کەستەمایزکردنی ڕووکار و ئەندازەکان (Display & Scale Controls)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  دەستکاریکردنی قەبارەی ئایکۆنەکانی داشبۆرد، قەبارەی لیستی کەناڵەکان و مۆدی کەمکردنەوەی مەسروفی ئینتەرنێت.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Main Dashboard Dock Scale */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-blue-400" />
                      <span>قەبارەی داشبۆردی سەرەکی (Dashboard Scale):</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      {Math.round(dockScale * 100)}%
                    </span>
                  </div>

                  {/* Stepping Adjuster Buttons + Range Bar (tabIndex={-1} prevents grabbing remote scroll keys) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateDockScale(Math.max(0.70, dockScale - 0.05))}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-sm border border-white/15 flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
                      title="کەمکردنەوە (-5%)"
                    >
                      -
                    </button>
                    <input
                      tabIndex={-1}
                      type="range"
                      min="0.70"
                      max="1.30"
                      step="0.05"
                      value={dockScale}
                      onChange={(e) => updateDockScale(parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-400 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => updateDockScale(Math.min(1.30, dockScale + 0.05))}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-sm border border-white/15 flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
                      title="زیادکردن (+5%)"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateDockScale(0.8)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        Math.abs(dockScale - 0.8) < 0.05 ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                      }`}
                    >
                      بچووک (80%)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDockScale(1.0)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        Math.abs(dockScale - 1.0) < 0.05 ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                      }`}
                    >
                      بنەڕەتی (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDockScale(1.2)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        Math.abs(dockScale - 1.2) < 0.05 ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                      }`}
                    >
                      گەورە (120%)
                    </button>
                  </div>
                </div>

                {/* 2. Channel List Drawer Scale */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <List className="w-3.5 h-3.5 text-emerald-400" />
                      <span>قەبارەی لیستی کەناڵەکان (Channel Drawer Scale):</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {drawerScale === 'compact' ? 'بچووک' : drawerScale === 'large' ? 'گەورە' : 'ئاسایی'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => updateDrawerScale('compact')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        drawerScale === 'compact' ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                      }`}
                    >
                      <span>بچووک</span>
                      <span className="text-[10px] opacity-75 font-mono">Compact</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDrawerScale('standard')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        drawerScale === 'standard' ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                      }`}
                    >
                      <span>ئاسایی</span>
                      <span className="text-[10px] opacity-75 font-mono">Standard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDrawerScale('large')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        drawerScale === 'large' ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                      }`}
                    >
                      <span>گەورە</span>
                      <span className="text-[10px] opacity-75 font-mono">Large</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Data Saver Mode Controls */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-amber-400" />
                    <span>مۆدی کەمکردنەوەی مەسروفی ئینتەرنێت (Data Saver Mode):</span>
                  </span>
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    {dataSaverMode === 'data_saver' ? '⚡ 480p Data Saver' : dataSaverMode === '720p' ? '📺 720p HD' : '✨ 4K / Auto'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  گونجاندنی کوالێتی پەخش بەپێی خێرایی ئینتەرنێت تا بەبێ پچڕان ئیش بکات و گێگابایت کەمتر مەسروف بکات.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDataSaverMode('auto');
                      try { localStorage.setItem('nndd_data_saver_mode', 'auto'); } catch(e) {}
                      applyStreamQualityToHls('auto');
                      onNotify?.({ title: 'کوالێتی زۆر بەرز', message: 'پەخش لەسەر بەرزترین کوالێتی 4K/Full HD دەبێت.', type: 'info' });
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      dataSaverMode === 'auto' ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                    }`}
                  >
                    <span>Full HD / 4K</span>
                    <span className="text-[10px] opacity-75">کوالێتی زۆر بەرز (ئۆتۆ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDataSaverMode('720p');
                      try { localStorage.setItem('nndd_data_saver_mode', '720p'); } catch(e) {}
                      applyStreamQualityToHls('720p');
                      onNotify?.({ title: 'کوالێتی مامناوەند 720p', message: 'کوالێتی جێگیرکرا لەسەر 720p HD.', type: 'info' });
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      dataSaverMode === '720p' ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                    }`}
                  >
                    <span>720p HD</span>
                    <span className="text-[10px] opacity-75">کوالێتی مامناوەند</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDataSaverMode('data_saver');
                      try { localStorage.setItem('nndd_data_saver_mode', 'data_saver'); } catch(e) {}
                      applyStreamQualityToHls('data_saver');
                      onNotify?.({ title: 'مۆدی کەمکردنەوەی ئینتەرنێت', message: 'کوالێتی خرایە سەر 480p بۆ کەمترین بەکارهێنانی داتا.', type: 'success' });
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      dataSaverMode === 'data_saver' ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md' : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/10'
                    }`}
                  >
                    <span>Data Saver (480p)</span>
                    <span className="text-[10px] opacity-75">کەمترین مەسروفی ئینتەرنێت</span>
                  </button>
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

                  <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchToAdmin?.();
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('switch_admin_tab', { detail: 'dabin_studio' }));
                        }, 120);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer border border-cyan-400/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🎬 ستۆدیۆی کەناڵی کۆبین (KOBIN Studio)</span>
                    </button>

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
                    <Sliders className="w-3.5 h-3.5 text-white" />
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
                      پەخشی کەناڵەکان بەپێی ئەو سێرڤەرە دەبێت کە هەڵت بژاردووە. ئەگەر کەناڵێک پەخشی نەبوو، سێرڤەرەکەی ناگۆڕدرێت لەسەر سێرڤەرێکی تر.
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
                    placeholder="TREX / NINJA / COBRA"
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
                    placeholder="http://server.example.com:8080"
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
                href="/kobin-tv.apk"
                download="kobin-tv.apk"
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 active:scale-95 transition-all border border-cyan-300/30 group"
              >
                <Download className="w-5 h-5 text-white animate-bounce group-hover:scale-110 transition-transform" />
                <span>دابەزاندنی ئەپڵیکەیشن بۆ تەلەفزیۆن و مۆبایل (KOBIN.Tv APK)</span>
              </a>
              <span className="text-[11px] text-cyan-300/80 block mt-2 font-mono">
                Direct APK Download (Android TV / Box / Phone • 8.5 MB)
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
                KOBIN.TV SUBSCRIPTION ARCHITECTURE
              </span>
              <h3 className="text-xl font-black text-white tracking-wide flex items-center justify-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>پلان و بەستەکانی KOBIN.Tv</span>
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
              <NnddLogo animated={true} glow={true} className="h-24 sm:h-32 w-auto filter drop-shadow-[0_0_40px_rgba(0,242,254,0.6)]" />
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
          HARDWARE SERIAL ACTIVATION & REQUEST MODAL (DUAL-MODE LOGIN)
         ======================================================== */}
      <DeviceActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        defaultTab={isTv ? 'mac_activation' : 'user_pass'}
        deviceIdentity={deviceIdentity}
        device={deviceIdentity}
        setDevice={setDeviceIdentity}
        serverConnectionStatus={serverConnectionStatus}
        onActivationSuccess={(updatedDevice) => {
          setDeviceIdentity(updatedDevice);
          setIsActivationModalOpen(false);
          setSubscriptionDaysRemaining(365);

          // Save Persistent Session
          try {
            const existing = localStorage.getItem('kobin_tv_session');
            if (!existing) {
              localStorage.setItem('kobin_tv_session', JSON.stringify({
                username: updatedDevice?.xtream_user || updatedDevice?.activeUsername || '',
                password: updatedDevice?.xtream_pass || '',
                server_url: updatedDevice?.server_url || 'http://line.liondnscloud.ru:80',
                macAddress: updatedDevice?.macAddress || deviceIdentity?.macAddress,
                device_key: updatedDevice?.deviceKey || deviceIdentity?.deviceKey,
                status: 'active',
                app_expiry_date: updatedDevice?.expiresAt || null,
                expiresAt: updatedDevice?.expiresAt || null,
                loginMethod: 'mac_activation',
                lastLogin: new Date().toISOString()
              }));
            }
          } catch (e) {}

          onNotify?.({
            title: 'ئەپەکە چالاککرا 🎉',
            message: `ئەکاونتی (${updatedDevice.activeUsername || updatedDevice.xtream_user || updatedDevice.serialNumber || updatedDevice.macAddress}) بە سەرکەوتوویی کرایەوە. بەخێربێن بۆ KOBIN TV.`,
            type: 'success'
          });
        }}
        onLoginSuccess={(newConfig, freshChannels, updatedDevice) => {
          if (newConfig) {
            setActiveXtreamConfig(newConfig);
            setServerForm(newConfig);
          }
          if (Array.isArray(freshChannels) && freshChannels.length > 0) {
            const finalChannels = ensureDabinChannelFirst(freshChannels);
            setChannels(finalChannels);
            savePersistentChannels(finalChannels);
            window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: finalChannels }));
          }
          if (updatedDevice) {
            setDeviceIdentity(updatedDevice);
          }

          // Save Persistent Auto-Login Session
          try {
            localStorage.setItem('kobin_tv_session', JSON.stringify({
              username: newConfig?.username || updatedDevice?.xtream_user || '',
              password: newConfig?.password || updatedDevice?.xtream_pass || '',
              server_url: newConfig?.host || updatedDevice?.server_url || 'http://line.liondnscloud.ru:80',
              macAddress: updatedDevice?.macAddress || deviceIdentity?.macAddress,
              device_key: updatedDevice?.deviceKey || deviceIdentity?.deviceKey,
              status: 'active',
              app_expiry_date: updatedDevice?.expiresAt || null,
              expiresAt: updatedDevice?.expiresAt || null,
              loginMethod: 'user_pass',
              lastLogin: new Date().toISOString()
            }));
          } catch (e) {}

          setIsActivationModalOpen(false);
          setSubscriptionDaysRemaining(365);
          setActiveTab('live');
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

      {/* 1-Click Server Control Center Modal */}
      <ServerControlCenterModal
        isOpen={isServerControlOpen}
        onClose={() => setIsServerControlOpen(false)}
        activeConfig={activeXtreamConfig}
        serverMode={serverMode}
        onSetServerMode={(mode) => {
          setServerMode(mode);
          showServerModeToast(mode);
        }}
        onServerApplied={(appliedConfig, appliedChannels) => {
          if (appliedConfig?.username) {
            setActiveXtreamConfig(appliedConfig);
          } else {
            setActiveXtreamConfig(null);
          }
          if (appliedChannels && appliedChannels.length > 0) {
            setChannels(appliedChannels);
            setSelectedChannel(appliedChannels[0]);
            persistentTargetChannelRef.current = appliedChannels[0];
            persistentTargetIndexRef.current = 0;
            if (activeTab === 'live') {
              performChannelSwitch(appliedChannels[0], true);
            }
          }
        }}
        onNotify={onNotify}
      />

      {/* Delicate Double-Back Exit Toast */}
      {showExitToast && (
        <div className="fixed bottom-12 inset-x-0 mx-auto w-fit z-50 pointer-events-none select-none animate-slide-up px-4">
          <div className="px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-white shadow-2xl text-xs sm:text-sm font-light tracking-wide text-center">
            بۆ داخستنی بەرنامەکە جارێکی تر کلیلی Back دابگرە
          </div>
        </div>
      )}

      {/* Persistent Bottom-Right Corner MAC Address Badge & Server Connection Indicator (ONLY on Dashboard) */}
      {activeTab === 'dashboard' && (
        <div 
          dir="ltr"
          onClick={() => {
            if (deviceIdentity?.macAddress) {
              try {
                navigator.clipboard.writeText(deviceIdentity.macAddress);
                onNotify?.({
                  title: 'MAC Address Copied 📋',
                  message: `${deviceIdentity.macAddress} | Status: ${serverConnectionMsg}`,
                  type: 'success'
                });
              } catch (e) {}
            }
          }}
          title={`MAC: ${deviceIdentity?.macAddress} | Status: ${serverConnectionMsg} (Click to copy)`}
          className={`fixed bottom-3 right-4 z-40 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 hover:border-white/35 text-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-xl cursor-pointer transition-all duration-300 active:scale-95 group select-none pointer-events-auto ${
            isDashboardIdle ? 'opacity-0 pointer-events-none' : 'opacity-70 hover:opacity-100'
          }`}
        >
          {/* Status Indicator Dot */}
          <span className={`w-2 h-2 rounded-full ${
            serverConnectionStatus === 'connected'
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
              : serverConnectionStatus === 'error'
              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-ping'
              : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse'
          }`} />

          {/* MAC Address */}
          <span className="text-[10px] font-mono tracking-wider text-slate-400 group-hover:text-cyan-300 transition-colors uppercase">
            MAC:
          </span>
          <span className="text-[11px] font-mono font-bold text-cyan-300 tracking-wider">
            {deviceIdentity?.macAddress || 'K0:B1:24:...'}
          </span>

          {/* Server Connection Badge Text */}
          <span className="h-3 w-px bg-white/20 mx-0.5" />
          <span className={`text-[10px] font-sans font-medium transition-colors ${
            serverConnectionStatus === 'connected'
              ? 'text-emerald-300'
              : serverConnectionStatus === 'error'
              ? 'text-rose-400 font-bold'
              : 'text-amber-300 animate-pulse'
          }`}>
            {serverConnectionStatus === 'connected' ? (
              deviceIdentity?.status === 'active' && deviceIdentity?.xtream_user ? 'چالاکە' : 'پەیوەستە بە سێرڤەر (چاوەڕوانی چالاککردن)'
            ) : serverConnectionStatus === 'error' ? (
              'کێشە لە پەیوەندی'
            ) : (
              'خەریکی پەیوەستبوونە...'
            )}
          </span>
        </div>
      )}

    </div>
  );
}

