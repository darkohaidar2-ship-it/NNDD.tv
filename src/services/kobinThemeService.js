/**
 * KOBIN TV - Central UI & Dashboard Theme Customizer Engine
 * Provides two-way real-time sync between:
 * - Dashboard Top Edit Modal
 * - Admin Panel (Dabin Studio)
 * - Settings Tab
 * - Android APK / Web App runtime
 */

import { postKobinSyncMessage, subscribeToKobinBroadcastChannel } from '../data/dabinBroadcastManager';

export const FONT_OPTIONS = [
  { id: 'ibm-plex', label: 'ئای بی ئێم (IBM Plex)', family: "'IBM Plex Sans Arabic', sans-serif", previewText: 'کۆبین تیڤی شیک' },
  { id: 'vazirmatn', label: 'وەزیر مەتن (Vazirmatn)', family: "'Vazirmatn', sans-serif", previewText: 'کۆبین تیڤی مۆدێرن' },
  { id: 'cairo', label: 'کایرۆ ئەپڵ (Cairo)', family: "'Cairo', sans-serif", previewText: 'کۆبین تیڤی فەرمی' },
  { id: 'noto-sans', label: 'نۆتۆ سانز (Noto Sans)', family: "'Noto Sans Arabic', sans-serif", previewText: 'کۆبین تیڤی ڕوون' },
  { id: 'readex-pro', label: 'ڕیدێکس پرۆ (Readex)', family: "'Readex Pro', sans-serif", previewText: 'کۆبین تیڤی تەکنۆ' },
  { id: 'system', label: 'سیستەم (System Clean)', family: 'system-ui, -apple-system, sans-serif', previewText: 'کۆبین تیڤی ستاندارد' }
];

export const DOCK_STYLE_OPTIONS = [
  { id: 'glass-blur', label: 'شووشەی ئەپڵ تیڤی (Apple Glass)', color: '#ffffff', desc: 'شووشەی سپی بە ڕوونی 4K' },
  { id: 'neon-cyan', label: 'شینی نێۆن (Electric Cyan)', color: '#06b6d4', desc: 'درەوشاوەی شین و سیانی کۆبین' },
  { id: 'amber-sunset', label: 'زێڕینی خۆرئاوابوون (Amber Sunset)', color: '#f59e0b', desc: 'پڕتەقاڵی و زێڕینی ئارام' },
  { id: 'emerald-green', label: 'سەوزی زومڕووت (Emerald Forest)', color: '#10b981', desc: 'سەوزی شیک و مۆدێرن' },
  { id: 'royal-purple', label: 'مۆری پاشایانە (Royal Violet)', color: '#a855f7', desc: 'مۆری تاریک و سینەمایی' },
  { id: 'ruby-red', label: 'سووری یاقووتی (Ruby Crimson)', color: '#f43f5e', desc: 'سووری گەش و دینامیک' },
  { id: 'deep-black', label: 'ڕەشی قووڵ (OLED Pure Black)', color: '#0f172a', desc: 'ڕەشی تەواو بۆ شاشەی OLED' },
  { id: 'minimal-slate', label: 'سادەی مۆدێرن (Matte Slate)', color: '#64748b', desc: 'دیزاینی ئارام و تاریکی مات' }
];

export const UI_SKIN_OPTIONS = [
  { id: 'cinema-aurora', label: 'ئاورۆرای سینەمایی (Cinema Aurora)', desc: 'شەپۆلی ئارامی شین و پرتەقاڵی' },
  { id: 'oled-dark', label: 'تاریکی تەواو (OLED Pure Dark)', desc: 'بێ باکگراوند، تاریکی ڕەها' },
  { id: 'midnight-blue', label: 'شینی قووڵی نیوەشەو (Midnight Blue)', desc: 'شینی ئارامی ئاسمانی شەو' },
  { id: 'cyber-neon', label: 'نێۆنی تەکنەلۆژی (Cyberpunk Neon)', desc: 'کۆنتراستی بەرزی تەکنۆلۆژیا' },
  { id: 'frost-glass', label: 'شووشەی بەستوو (Arctic Frost)', desc: 'شووشەی بلوری و بەستووی سپی' }
];

export const DRAWER_STYLE_OPTIONS = [
  { id: 'glass-frosted', label: 'شووشەی بەستوو (Frosted Glass)', desc: 'بەستووی تاریک و شەفاف' },
  { id: 'glass-crystal', label: 'کریستاڵی تەنک (Ultra Crystal)', desc: 'شووشەی کریستاڵی زۆر شەفاف' },
  { id: 'glass-smoked', label: 'دووکەڵی سینەمایی (Smoked Glass)', desc: 'شەفافیەتی کەم و تاریک' },
  { id: 'pure-black', label: 'ڕەشی تەواو (Pure OLED Black)', desc: 'تاریکی تەواو بەبێ شووشە' }
];

export const CLOCK_TIMEOUT_OPTIONS = [
  { value: 15000, label: '١٥ چرکە (خێرا)' },
  { value: 30000, label: '٣٠ چرکە (ستاندارد)' },
  { value: 60000, label: '١ خولەک' },
  { value: 120000, label: '٢ خولەک' },
  { value: 0, label: 'هەمیشە بەخەبەر (بێ خەوتن)' }
];

export const DEFAULT_BACKGROUND_VIDEOS = [
  {
    id: 'vid-1',
    title: '🌊 شەپۆلی ئۆقیانووسی قووڵ (Deep Ocean)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    icon: '🌊',
    quality: '4K/HD'
  },
  {
    id: 'vid-2',
    title: '🎬 سینەمای تاریک و بڵێسە (Cinema Blazes)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    icon: '🎬',
    quality: '1080p'
  },
  {
    id: 'vid-3',
    title: '🌸 سروشتی هێمن و ماکرۆ (Calm Nature)',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    icon: '🌸',
    quality: 'HD'
  },
  {
    id: 'vid-4',
    title: '🌌 گەردوونی تاریک و ئەستێرەکان (Space Nebula)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    icon: '🌌',
    quality: 'HD'
  }
];

export const DEFAULT_AMBIENT_PLAYLIST = [
  {
    id: 'amb-1',
    title: '☕ Lofi Study Chill',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    type: 'audio'
  },
  {
    id: 'amb-2',
    title: '🎹 پیانۆی ئارام (Relaxing Piano)',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxing-piano-10700.mp3',
    type: 'audio'
  },
  {
    id: 'amb-3',
    title: '🌿 سروشتی هێمن و باران (Calm Rain)',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f772dd.mp3?filename=calm-ambient-122684.mp3',
    type: 'audio'
  },
  {
    id: 'amb-4',
    title: '🌌 مێدیتەیشن و خەو (Deep Zen Meditation)',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73502.mp3?filename=meditation-impromptu-01-11024.mp3',
    type: 'audio'
  }
];

export const DEFAULT_THEME_CONFIG = {
  dockScale: 1.0,
  dockStyle: 'glass-blur',
  uiSkin: 'cinema-aurora',
  ambientMusicEnabled: true,
  ambientMusicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  ambientMusicVolume: 0.15,
  ambientPlaylist: DEFAULT_AMBIENT_PLAYLIST,
  activeAmbientIndex: 0,
  ambientSequenceMode: true, // Auto-play sequence 1 -> 2 -> 3 -> 4
  clockNormalScale: 1.0,
  clockSleepScale: 1.0,
  clockIdleTimeout: 60000, // 1 minute (60 seconds)
  drawerScale: 'standard',
  drawerStyle: 'glass-frosted',
  appFont: 'ibm-plex',
  // Background customization: color, image, or 4K video matrix
  dashboardBgType: 'video', // 'color' | 'gradient' | 'image' | 'video'
  dashboardBgColor: '#020617',
  dashboardBgGradient: 'cinema-dark',
  dashboardBgImageUrl: '',
  dashboardBgVideoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
  backgroundVideos: DEFAULT_BACKGROUND_VIDEOS,
  activeBackgroundVideoIndex: 0,
  autoRotateVideos: false,
  videoRotationInterval: 180000
};

const THEME_STORAGE_KEY = 'kobin_customizer_theme';

export function getSavedThemeConfig() {
  if (typeof window === 'undefined') return DEFAULT_THEME_CONFIG;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    const legacyDockScale = localStorage.getItem('nndd_dock_scale');
    const legacyDrawerScale = localStorage.getItem('nndd_drawer_scale');

    const parsed = raw ? JSON.parse(raw) : {};
    
    // Ensure backgroundVideos has 4 items
    let resolvedVideos = Array.isArray(parsed.backgroundVideos) && parsed.backgroundVideos.length > 0
      ? parsed.backgroundVideos
      : DEFAULT_BACKGROUND_VIDEOS;
    while (resolvedVideos.length < 4) {
      resolvedVideos.push(DEFAULT_BACKGROUND_VIDEOS[resolvedVideos.length] || DEFAULT_BACKGROUND_VIDEOS[0]);
    }

    // Ensure ambientPlaylist has 4 items
    let resolvedPlaylist = Array.isArray(parsed.ambientPlaylist) && parsed.ambientPlaylist.length > 0
      ? parsed.ambientPlaylist
      : DEFAULT_AMBIENT_PLAYLIST;
    while (resolvedPlaylist.length < 4) {
      resolvedPlaylist.push(DEFAULT_AMBIENT_PLAYLIST[resolvedPlaylist.length] || DEFAULT_AMBIENT_PLAYLIST[0]);
    }

    return {
      ...DEFAULT_THEME_CONFIG,
      ...parsed,
      dockScale: parsed.dockScale ?? (legacyDockScale ? parseFloat(legacyDockScale) : 1.0),
      drawerScale: parsed.drawerScale ?? (legacyDrawerScale || 'standard'),
      backgroundVideos: resolvedVideos,
      activeBackgroundVideoIndex: typeof parsed.activeBackgroundVideoIndex === 'number' ? parsed.activeBackgroundVideoIndex : 0,
      ambientPlaylist: resolvedPlaylist,
      activeAmbientIndex: typeof parsed.activeAmbientIndex === 'number' ? parsed.activeAmbientIndex : 0,
      ambientSequenceMode: parsed.ambientSequenceMode !== undefined ? parsed.ambientSequenceMode : true
    };
  } catch (e) {
    return DEFAULT_THEME_CONFIG;
  }
}

export function applyAppFont(fontId) {
  if (typeof document === 'undefined') return;
  const match = FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[0];
  document.documentElement.style.setProperty('--app-font', match.family);
}

export function saveThemeConfig(newConfig, broadcast = true) {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedThemeConfig();
    const merged = { ...current, ...newConfig };
    
    // Save to master key
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(merged));
    
    // Backward compatibility for existing listeners
    if (merged.dockScale !== undefined) {
      localStorage.setItem('nndd_dock_scale', merged.dockScale.toString());
    }
    if (merged.drawerScale !== undefined) {
      localStorage.setItem('nndd_drawer_scale', merged.drawerScale);
    }
    if (merged.appFont) {
      applyAppFont(merged.appFont);
    }

    // Local in-window dispatch for immediate reaction
    window.dispatchEvent(new CustomEvent('kobin-theme-changed', { detail: merged }));

    // Real-time broadcast to all windows / tabs / connected devices
    if (broadcast) {
      postKobinSyncMessage('UPDATE_CUSTOMIZER_THEME', merged);
    }
  } catch (e) {
    console.error('[kobinThemeService] save error:', e);
  }
}

export function subscribeToThemeChanges(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e) => {
    if (e?.detail) callback(e.detail);
  };

  const handleStorageEvent = (e) => {
    if (e.key === THEME_STORAGE_KEY || e.key === 'nndd_dock_scale' || e.key === 'nndd_drawer_scale') {
      callback(getSavedThemeConfig());
    }
  };

  window.addEventListener('kobin-theme-changed', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  const unsubBroadcast = subscribeToKobinBroadcastChannel((msg) => {
    if (msg?.type === 'UPDATE_CUSTOMIZER_THEME' && msg?.payload) {
      saveThemeConfig(msg.payload, false);
      callback(msg.payload);
    }
  });

  return () => {
    window.removeEventListener('kobin-theme-changed', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    unsubBroadcast?.();
  };
}
