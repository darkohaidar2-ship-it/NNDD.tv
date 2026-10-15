import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Server
} from 'lucide-react';
import { CHANNELS_DATA, VOD_SERIES, VOD_MOVIES, SUBSCRIPTION_PLANS, INITIAL_ACTIVATION_CODES } from '../data/mockData';
import { AVAILABLE_FONTS, applyFontToDocument, getCurrentFont } from '../data/fonts';
import { getOrCreateDeviceIdentity, saveDeviceIdentity } from '../data/deviceManager';
import DeviceActivationModal from './DeviceActivationModal';
import NnddLogo from './NnddLogo';
import CachedChannelLogo from './CachedChannelLogo';
import { cacheAllChannelLogos, getCachedLogosCount, clearCachedLogos } from '../data/logoCache';
import { App as CapApp } from '@capacitor/app';
import { useDevice } from '../context/DeviceContext';
import PaginatedChannelGrid from './PaginatedChannelGrid';
import { getSupabaseChannels, supabase } from '../data/supabaseClient';
import { getStoredServerSettings, getStoredServers, saveStoredServers, saveStoredServerSettings } from '../data/serverManager';
import { 
  DEFAULT_SERVER_CONFIG, 
  testXtreamConnection, 
  importTargetServerChannels, 
  getXtreamCategories, 
  getXtreamLiveStreams 
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

  // Channels state (using passed props if provided, with cache support)
  const [internalChannels, setInternalChannels] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_channels');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.url?.includes('vpn.trxdnscloud.ru')) return parsed;
      }
    } catch(e) {}
    try {
      localStorage.setItem('nndd_cached_channels', JSON.stringify(CHANNELS_DATA));
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
  const [channelHealthMap, setChannelHealthMap] = useState({});

  // Active Xtream Codes Server Credentials & Sync State
  const [activeXtreamConfig, setActiveXtreamConfig] = useState(() => {
    try {
      const stored = localStorage.getItem('nndd_active_xtream_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.host && parsed.host.includes('vpn.trxdnscloud.ru')) return parsed;
      }
    } catch(e) {}
    try {
      const servers = getStoredServers();
      const settings = getStoredServerSettings();
      const active = servers.find(s => s.id === settings.activeServerId && s.type === 'xtream') || servers.find(s => s.type === 'xtream');
      if (active) {
        return {
          host: active.serverUrl,
          username: active.username,
          password: active.password,
          name: active.name || 'TREX IPTV Server'
        };
      }
    } catch(e) {}
    return {
      host: 'https://vpn.trxdnscloud.ru',
      username: '11d68d6be9',
      password: '1efc2bb76bc7',
      name: 'TREX IPTV Server'
    };
  });
  const [isRefreshingServer, setIsRefreshingServer] = useState(false);
  const [refreshingServerMessage, setRefreshingServerMessage] = useState('');
  const [serverTestResult, setServerTestResult] = useState(null);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverForm, setServerForm] = useState(activeXtreamConfig);

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
          message: `سەرکەوتوو بوو! بەسەرچوون: ${res.userInfo?.expDate || 'چالاک'}`
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
        const url = localStorage.getItem('nndd_channels_api_url') || '/channels.json';
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length >= CHANNELS_DATA.length) {
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

        onNotify?.({
          title: 'سێرڤەر نوێکرایەوە! 🎉',
          message: `بە سەرکەوتوویی ${freshChannels.length} کەناڵی نوێ لە "${cleanConfig.name}" هاوردە کران و کاشی کۆن بە تەواوی پاککرایەوە.`,
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
    const streamUrl = channel?.url || channel?.backupUrl || activeXtreamConfig?.host || '';
    const user = activeXtreamConfig?.username || '';
    const cleanUrl = streamUrl.toLowerCase();
    const cleanUser = user.toLowerCase();

    let serverCode = 'SRV-1';
    let serverName = 'Xtream IPTV Server';
    let dotColor = 'bg-cyan-400';

    if (cleanUrl.includes('trxdnscloud.ru') || cleanUrl.includes('trex') || cleanUser.includes('trex') || cleanUser === '11d68d6be9') {
      serverCode = 'TRX-V1';
      serverName = 'TREX IPTV (vpn.trxdnscloud.ru)';
      dotColor = 'bg-emerald-400';
    } else if (cleanUrl.includes('m3um9xplus') || cleanUrl.includes('cobra') || cleanUser.includes('cobra')) {
      serverCode = 'CBR-V1';
      serverName = 'COBRA IPTV';
      dotColor = 'bg-amber-400';
    } else if (cleanUrl.includes('ninja') || cleanUrl.includes('1234.ninja')) {
      serverCode = 'NJ-V1';
      serverName = 'NINJA OTT';
      dotColor = 'bg-blue-400';
    } else if (cleanUrl.includes('shams.tv') || cleanUrl.includes('shams')) {
      serverCode = 'SHM-V1';
      serverName = 'SHAMS IPTV';
      dotColor = 'bg-purple-400';
    } else if (cleanUrl.includes('vercel.app') || cleanUrl.includes('channels.json')) {
      serverCode = 'NNDD-P1';
      serverName = 'NNDD Verified';
      dotColor = 'bg-cyan-400';
    } else {
      try {
        const parsed = new URL(streamUrl.startsWith('http') ? streamUrl : `http://${streamUrl}`);
        const parts = parsed.hostname.split('.');
        serverCode = (parts.length > 1 ? parts[parts.length - 2] : parts[0]).slice(0, 4).toUpperCase();
        serverName = parsed.hostname;
      } catch(e) {
        serverCode = 'IPTV-1';
        serverName = 'IPTV Server';
      }
    }

    const isTest = 
      cleanUser !== '11d68d6be9' && (
        cleanUser.includes('test') || 
        cleanUser.includes('trial') || 
        cleanUser.startsWith('t_') ||
        (cleanUser.length === 8 && !cleanUser.includes('11d68d6be9')) ||
        currentUser?.subPlan?.includes('تێست') ||
        currentUser?.subPlan?.includes('٢٤')
      );

    const lineType = isTest ? '[T]' : '[P]';

    return {
      code: `${serverCode} ${lineType}`,
      serverCode,
      serverName,
      lineType,
      isTest,
      dotColor
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

  // Auto-landscape when fullscreen on Phone (Step 1)
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

  // Alerts & Search
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [language, setLanguage] = useState('ckb'); // 'ckb', 'en', 'ar'
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['هەموو', 'کوردی گشتی', 'هەواڵ', 'منداڵان', 'دراما و بەرنامە', 'موزیک', 'بەڵگەنامەیی', 'فیلم و سینەما', 'ئاینی', 'تورکی', 'عەرەبی و گشتی'];

  const filteredChannels = useMemo(() => {
    return channels.filter(c => {
      const matchesCat = channelCategory === 'هەموو' || (c.category && c.category.includes(channelCategory));
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
  }, [channels, channelCategory, searchQuery, favoriteChannelIds, onlyFavorites, sortBy]);

  // When drawer opens, focus and auto-scroll to the currently playing channel (only on initial open)
  const wasDrawerOpenRef = useRef(false);
  useEffect(() => {
    if (showChannelDrawer && !wasDrawerOpenRef.current) {
      wasDrawerOpenRef.current = true;
      const idx = filteredChannels.findIndex(c => c.id === selectedChannel?.id);
      const targetIdx = idx !== -1 ? idx : 0;
      setDrawerFocusedIndex(targetIdx);
      setTimeout(() => {
        drawerItemRefs.current[targetIdx]?.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 50);
    } else if (!showChannelDrawer) {
      wasDrawerOpenRef.current = false;
    }
  }, [showChannelDrawer]);

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


  // User input activation code
  const [activationCodeInput, setActivationCodeInput] = useState('');
  const [subscriptionDaysRemaining, setSubscriptionDaysRemaining] = useState(365);
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
  const switchRequestIdRef = useRef(0);
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
      const srvSettings = getStoredServerSettings();
      const autoFailover = srvSettings?.autoFailoverEnabled ?? true;

      if (autoFailover && channel.backupUrl && !isBackup && channel.backupUrl !== channel.url) {
        console.info(`[FAILOVER AUTO (${reason})] Retrying with backup stream for #${channel.number} "${channel.name}" on slot ${slot}`);
        setIsBackupStreamActive(true);
        startPlayerForSlot(slot, channel, reqId, true, timeoutMs, onReadyCallback);
      } else {
        if (!isBackgroundPreload) {
          setIsStreamLoading(false);
          setIsChannelOffline(true);
        }
      }
    };

    // Watchdog timer (only for active playing mode, not background preloads)
    if (timeoutMs > 0 && !isBackgroundPreload) {
      ctrl.watchdog = setTimeout(() => {
        if (switchRequestIdRef.current !== reqId) return;
        console.warn(`[WATCHDOG ${timeoutMs}ms TIMEOUT] Stream did not start playing on slot ${slot} for #${channel.number}`);
        failoverToBackup('timeout');
      }, timeoutMs);
    }

    // First Frame Rendered Detection (Event-Driven)
    let firstFrameFired = false;
    const notifyFirstFrameRendered = () => {
      if (firstFrameFired || switchRequestIdRef.current !== reqId) return;
      firstFrameFired = true;

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

    // 1. RAW MPEG-TS via mpegts.js (MSE) — Ultra-low initial buffer configuration
    if (isRawTsStream(streamUrl) && mpegts.isSupported()) {
      try {
        const player = mpegts.createPlayer({
          type: 'mse',
          isLive: true,
          url: streamUrl
        }, {
          enableWorker: true,
          lazyLoad: false,
          enableStashBuffer: false, // Low initial buffer: avoids 384KB hoarding, delivers immediate first frame
          stashInitialSize: 128 * 1024,
          autoCleanupSourceBuffer: true,
          autoCleanupMaxBackwardDuration: 12,
          autoCleanupMinBackwardDuration: 4,
          liveBufferLatencyChasing: true,
          liveBufferLatencyMaxLatency: 1.0,
          liveBufferLatencyMinRemain: 0.2,
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

    // 2. HLS via Hls.js — Tuned for IPTV instant startup
    if (Hls.isSupported() && streamUrl && (streamUrl.includes('.m3u8') || !isRawTsStream(streamUrl))) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 4, // Low initial buffer (4s) for rapid startup
        maxMaxBufferLength: 8,
        backBufferLength: 4,
        startFragPrefetch: true,
        manifestLoadingTimeOut: 6000,
        manifestLoadingMaxRetry: 1,
        fragLoadingTimeOut: 8000,
        fragLoadingMaxRetry: 2,
        startLevel: 0, // Baseline quality for instantaneous byte delivery
        capLevelToPlayerSize: true,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        enableSoftwareAES: true,
        maxBufferSize: 15 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3
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
      startPlayerForSlot(activeSlot, targetChannel, reqId, false, 8000, null);
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

    // 2. Smooth Auto-Commit Transition: If background preload takes longer than 2.5s, commit to target channel cleanly
    stageTimer5sRef.current = setTimeout(() => {
      if (switchRequestIdRef.current === reqId) {
        clearCountdown();
        setPreloadState(null);
        setSwitchingChannel(null);

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
    }, 2500);

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
        targetHls.startLevel = 0; // Fast initial startup
        targetHls.currentLevel = -1;
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
    if (!selectedChannel?.backupUrl) return;
    setIsBackupStreamActive(true);
    startPlayerForSlot(activeSlot, selectedChannel, switchRequestIdRef.current, true, 8000, null);
  };

  const switchToMainStream = () => {
    setIsBackupStreamActive(false);
    startPlayerForSlot(activeSlot, selectedChannel, switchRequestIdRef.current, false, 8000, null);
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
    const isExpired = subscriptionDaysRemaining <= 0 || currentUser?.subPlan?.includes('بەسەرچوو');
    if (isExpired) {
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
    { id: 'settings', label: 'ڕێکخستن', sub: 'Settings', icon: Sliders, tab: 'settings' },
    { id: 'series', label: 'زنجیرەکان', sub: 'Series', icon: Film, tab: 'series' },
    { id: 'live', label: 'ڕاستەوخۆ', sub: 'Live', icon: Tv, tab: 'live', isDefault: true },
    { id: 'movies', label: 'فیلمەکان', sub: 'Movies', icon: Film, tab: 'movies' },
    { id: 'about', label: 'دەربارە', sub: 'About', icon: Info, tab: 'about' }
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
        // TV Remote Color Keys (Red, Green, Yellow, Blue)
        const isRedKey = e.key === 'ColorF0Red' || e.key === 'Red' || e.keyCode === 403;
        const isGreenKey = e.key === 'ColorF1Green' || e.key === 'Green' || e.keyCode === 404;
        const isYellowKey = e.key === 'ColorF2Yellow' || e.key === 'Yellow' || e.keyCode === 405;
        const isBlueKey = e.key === 'ColorF3Blue' || e.key === 'Blue' || e.keyCode === 406;

        if (isRedKey) {
          e.preventDefault();
          if (selectedChannel) {
            toggleFavoriteChannel(selectedChannel.id);
          }
          return;
        } else if (isGreenKey) {
          e.preventDefault();
          setShowChannelDrawer(true);
          return;
        } else if (isYellowKey) {
          e.preventDefault();
          setOnlyFavorites(prev => !prev);
          return;
        } else if (isBlueKey) {
          e.preventDefault();
          handleSelectTab('movies');
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
                          e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 4;

        const isLeftKey = e.key === 'ArrowLeft' || e.key === 'Left' || e.keyCode === 37 || e.keyCode === 21;
        const isRightKey = e.key === 'ArrowRight' || e.key === 'Right' || e.keyCode === 39 || e.keyCode === 22;

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
          } else if (isSelectKey) {
            e.preventDefault();
            const targetChannel = displayedChannels[drawerFocusedIndex];
            if (targetChannel) {
              handleSelectChannelWithLockCheck(targetChannel, false);
            }
            return;
          } else if (isBackKey || isRightKey) {
            e.preventDefault();
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
    cinemaSession,
    sectionWelcome
  ]);

  // Rapid Channel Zapping & Delta Queue Engine
  // (Maintains uninterrupted active stream while buffering target index during rapid 1->2->3 zapping)
  const switchChannelRelative = (delta) => {
    const isExpired = subscriptionDaysRemaining <= 0 || currentUser?.subPlan?.includes('بەسەرچوو');
    if (isExpired) {
      setShowSubscriptionAlert(true);
      return null;
    }

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
    const isProtected = ['live', 'series', 'movies'].includes(tabName);
    const isExpired = subscriptionDaysRemaining <= 0 || currentUser?.subPlan?.includes('بەسەرچوو');

    if (welcomeTimerRef.current) {
      clearTimeout(welcomeTimerRef.current);
      welcomeTimerRef.current = null;
    }

    // Immediately switch activeTab so the app enters the selected section with 0ms delay
    setActiveTab(tabName);

    if (tabName === 'live') {
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

      if (targetChannel && !isExpired) {
        setSelectedChannel(targetChannel);
        persistentTargetChannelRef.current = targetChannel;
        performChannelSwitch(targetChannel, true);
      } else if (targetChannel) {
        setSelectedChannel(targetChannel);
        persistentTargetChannelRef.current = targetChannel;
      }

      setSectionWelcome({
        type: 'live'
      });
      welcomeTimerRef.current = setTimeout(() => {
        setSectionWelcome(null);
        welcomeTimerRef.current = null;
        if (isExpired) {
          setShowSubscriptionAlert(true);
          const liveVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
          if (liveVideo) {
            try { liveVideo.pause(); } catch(e) {}
          }
        }
      }, 2000);
    } else {
      // Non-live tabs (dashboard, series, movies, settings, about): Strictly MUTE background video
      setIsMuted(true);
      [videoRefA.current, videoRefB.current].forEach(v => {
        if (v) {
          v.muted = true;
          v.volume = 0;
        }
      });

      if (tabName === 'series') {
        setSectionWelcome({
          type: 'series'
        });
        welcomeTimerRef.current = setTimeout(() => {
          setSectionWelcome(null);
          welcomeTimerRef.current = null;
          if (isExpired) {
            setShowSubscriptionAlert(true);
          }
        }, 2000);
      } else if (tabName === 'movies') {
        setSectionWelcome({
          type: 'movies'
        });
        welcomeTimerRef.current = setTimeout(() => {
          setSectionWelcome(null);
          welcomeTimerRef.current = null;
          if (isExpired) {
            setShowSubscriptionAlert(true);
          }
        }, 2000);
      } else {
        setSectionWelcome(null);
      }
    }
  };

  // Screen interaction in live mode (clean video, zero accidental banners)
  const handleLiveScreenInteraction = () => {};

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

  const handleSelectChannelWithLockCheck = (ch, keepDrawer = false) => {
    const isExpired = subscriptionDaysRemaining <= 0 || currentUser?.subPlan?.includes('بەسەرچوو');
    if (isExpired) {
      setShowSubscriptionAlert(true);
      return;
    }

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
      // In Live mode: when a channel is explicitly selected from the drawer/list, switch immediately!
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
      }
      setPendingEditAction(null);
    } else {
      setEditPinError('تێپەڕەوشە هەڵەیە! (0000 بنووسە)');
    }
  };

  return (
    <div 
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
          } object-contain`}
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
          } object-contain`}
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
              چاوەڕوانبە...
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
        <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 animate-fade-in">
          
          {/* Left: Pure Crisp NNDD.TV Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
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
          {/* Bottom Navigation Dock: 5 Responsive Glassmorphic Buttons */}
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

          {/* ========================================================
              CLASSIC SLEEK CHANNEL LIST DRAWER (ALL-ICON HEADER & TV D-PAD READY)
             ======================================================== */}
          {showChannelDrawer && (
            <>
              {/* Dimmed backdrop outside drawer: click/tap dismisses/closes the drawer */}
              <div 
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity cursor-pointer"
                onClick={() => setShowChannelDrawer(false)}
                onTouchEnd={() => setShowChannelDrawer(false)}
              />

              <div 
                className="fixed inset-y-0 start-0 z-50 w-44 sm:w-48 bg-black/92 backdrop-blur-2xl border-e border-white/10 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.95)] animate-fade-in cursor-default select-none"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                {/* Minimal Header (کەناڵەکان + ژمارەی کەناڵەکان + PiP + دڵخوازەکان) */}
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-wide">کەناڵەکان</span>
                    <span className="text-[10px] font-mono font-bold text-white/50 bg-white/10 px-1.5 py-0.2 rounded-full">
                      {filteredChannels.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={togglePictureInPicture}
                      className="p-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                      title="وێنە لە ناو وێنەدا (Picture-in-Picture)"
                    >
                      <Minimize2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setOnlyFavorites(prev => !prev)}
                      className={`p-1 rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-90 ${
                        onlyFavorites
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                      title="دڵخوازەکان"
                    >
                      <Heart className={`w-3 h-3 ${onlyFavorites ? 'fill-white text-white' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Compact Channel Rows */}
                <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-white/[0.04] p-1">
                  {filteredChannels.map((ch, idx) => {
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
                        className={`w-full px-2 py-1.5 flex items-center justify-between gap-1.5 text-start transition-all duration-150 cursor-pointer rounded-lg my-0.5 ${
                          isRemoteFocused
                            ? 'bg-[#0078D4] text-white ring-1 ring-white shadow-md scale-[1.01] font-bold'
                            : isSelected 
                              ? 'bg-white/15 text-white border-s-2 border-cyan-400 font-semibold' 
                              : 'text-slate-200 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {/* Channel Number */}
                          <span className={`font-mono text-[9px] px-1 py-0.2 rounded shrink-0 ${
                            isRemoteFocused ? 'bg-white text-[#0078D4] font-black' : 'text-white/60 bg-white/5 font-semibold'
                          }`}>
                            {ch.number < 10 ? `0${ch.number}` : ch.number}
                          </span>
                          
                          {/* Channel Name */}
                          <span className="truncate flex-1 text-[11px] font-medium flex items-center gap-1">
                            <span>{ch.name}</span>
                            {isFav && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />}
                          </span>

                          {/* Channel Logo */}
                          <div className="w-5 h-5 rounded-full bg-white/10 border border-white/15 overflow-hidden shrink-0 p-0.5">
                            <CachedChannelLogo 
                              channel={ch} 
                              className="w-full h-full object-cover rounded-full" 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TV Remote Color Keys Legend Bar */}
                <div className="p-2 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[9px] text-slate-300 font-bold px-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />دڵخواز</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />فلتەر</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />فیلم</span>
                </div>
              </div>
            </>
          )}

          {/* Direct Numeric Remote Keypad OSD Indicator (ژمارەی کەناڵی نووسراو لەسەر کۆنترۆڵ) */}
          {numericZapBuffer && (
            <div className="fixed top-8 end-8 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-black/85 backdrop-blur-2xl border-2 border-cyan-400 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-scale-up select-none pointer-events-none">
              <span className="text-xs text-cyan-300 font-bold uppercase tracking-wider">کەناڵی</span>
              <span className="font-mono text-2xl font-black text-white">{numericZapBuffer}</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
          )}

          {/* =========================================================================
              TARGET CHANNEL CHANGE HUD WITH 5-SECOND WHITE CIRCULAR COUNTDOWN RING
              - Never displays current channel (unobtrusive during playback).
              - Only appears when actively changing / switching channels.
              - Super compact micro-pill: target channel number, logo encircled by animated white ring, and name.
              - All extra words and badges removed per user instruction.
             ========================================================================= */}
          {(() => {
            const targetCh = switchingChannel || preloadState?.targetChannel;
            if (!targetCh) return null;
            const isPreloading = !!preloadState;
            return (
              <div 
                key="live_zap_target_hud"
                className="fixed bottom-8 inset-x-0 mx-auto w-fit z-50 pointer-events-none select-none px-4 animate-fade-in"
              >
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.9)]">
                  {/* Target Channel Number (Instant 0ms update) */}
                  <span className="font-mono text-[10px] font-bold text-white/50 shrink-0">
                    #{targetCh.number < 10 ? `0${targetCh.number}` : targetCh.number}
                  </span>

                  {/* White Circular Ring Literally Encircling the Channel Logo (Static during zapping, 5s countdown when settled) */}
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
                    <div className="absolute w-5 h-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center p-0.5">
                      <CachedChannelLogo channel={targetCh} className="w-full h-full object-cover rounded-full" />
                    </div>
                  </div>

                  {/* Target Channel Name (Minimal & Clean, 0ms Instant Update) */}
                  <span className="text-xs font-bold text-white max-w-[150px] sm:max-w-[200px] truncate tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {targetCh.name}
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

          {/* Secret Server Indicator Watermark Badge (Discrete OSD) */}
          {(() => {
            const fp = getServerFingerprint(selectedChannel);
            return (
              <div 
                className="fixed bottom-3 end-3 z-40 pointer-events-auto opacity-35 hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-mono select-none"
                title={`Active Server: ${fp.serverName || 'TREX IPTV'} (${fp.code}) | Line: ${fp.isTest ? 'Trial' : 'Paid'}`}
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
                      password: '1efc2bb76bc7'
                    },
                    {
                      name: 'NINJA OTT Server',
                      host: 'https://s1.1234.ninja',
                      username: '22794645',
                      password: '67879152'
                    },
                    {
                      name: 'COBRA IPTV Server',
                      host: 'http://m3um9xplus.com:8080',
                      username: 'cbr_user',
                      password: 'cbr_password'
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
                    ناوی سێرڤەر (Server Label):
                  </label>
                  <input
                    type="text"
                    placeholder="NINJA / TREX / COBRA"
                    value={serverForm?.name || ''}
                    onChange={(e) => setServerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    ناونیشانی سێرڤەر (Host URL & Port):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="https://s1.1234.ninja یان http://domain:8080"
                    value={serverForm?.host || ''}
                    onChange={(e) => setServerForm(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 outline-none focus:border-cyan-400 text-left"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">
                    ناوی بەکارهێنەر (Username):
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
                    تێپەڕەوشە (Password):
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
                  <span>{isTestingServer ? 'خەریکی پشکنینە...' : 'پشکنینی پەیوەندی (Test)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyServerCredentials(serverForm)}
                  disabled={isRefreshingServer || isTestingServer}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingServer ? 'animate-spin' : ''}`} />
                  <span>سەیڤکردن و پاککردنەوەی تەواوی کاش (Save & Clear Cache)</span>
                </button>
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
          REDESIGNED SUBSCRIPTION & PACKAGES MODAL (STRICT GUARD)
         ======================================================== */}
      {showSubscriptionAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in select-none">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl text-center space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-wide">
                بەشداربوون لە خزمەتگوزاری NNDD TV
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                تکایە پاکێجێک هەڵبژێرە یان کۆدی چالاککردن لێبدە بۆ بینینی کەناڵەکان و فیلمەکان
              </p>
            </div>

            {/* Pricing Packages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-right">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col justify-between transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{plan.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 font-bold">
                      {plan.badge}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="font-mono text-sm font-black text-amber-300">{plan.price}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{plan.durationDays} ڕۆژ</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Code Entry Box */}
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-start">
              <label className="text-[11px] text-slate-300 font-bold block mb-1.5">
                کۆدی چالاککردنت هەیە؟ لێرە لێیبدە:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="KRD-XXXX-XXXX"
                  value={activationCodeInput}
                  onChange={(e) => setActivationCodeInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleRedeemCode}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all active:scale-95 cursor-pointer"
                >
                  چالاککردن
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-white/5 rounded-xl text-xs text-slate-400 font-mono">
              ئامێرەکەت: {currentUser?.deviceMac || 'NNDD-DEVICE'} • ڕۆژی ماوە: {subscriptionDaysRemaining} ڕۆژ
            </div>

            {/* Direct WhatsApp Subscription Button */}
            <div className="flex flex-col gap-2 pt-1">
              <a
                href="https://wa.me/9647709709346?text=سڵاو،%20داوای%20بەشداری%20یان%20تێستی%20دەکەم"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>داواکردنی تێست / نوێکردنەوە لە وەتسئەپ (07709709346)</span>
              </a>

              <button
                onClick={() => {
                  setShowSubscriptionAlert(false);
                  const isExpired = subscriptionDaysRemaining <= 0 || currentUser?.subPlan?.includes('بەسەرچوو');
                  if (isExpired) {
                    setActiveTab('dashboard');
                    const liveVideo = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
                    if (liveVideo) {
                      try { liveVideo.pause(); } catch(e) {}
                    }
                  }
                }}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                گەڕانەوە بۆ پەڕەی سەرەکی
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
            const isExpired = subscriptionDaysRemaining <= 0 || currentUser?.subPlan?.includes('بەسەرچوو');
            if (isExpired && ['live', 'series', 'movies'].includes(activeTab)) {
              setShowSubscriptionAlert(true);
            }
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
                {refreshingServerMessage || 'تکایە چاوەڕوانبە، کەناڵ و داتاکان نوێ دەکرێنەوە...'}
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

