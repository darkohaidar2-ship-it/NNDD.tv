/**
 * KOBIN.Tv Channel Broadcast Studio Manager & Real-Time Linear TV Engine
 * 
 * Manages full broadcast programming for Channel #1 (KOBIN.Tv Channel):
 * - Real-Time Linear TV Scheduling ("با وەک کانڵێک وابێت فیدیۆکە ، نەک کە چوە سەری انجا فیدیۆکە پلەی بکات")
 * - Continuous Timeline Looping ("و با فیدیۆکان LOOb بێت")
 * - Full Video Duration Tooling ("ئامرازی تێدا بێت کە بڵێین تەواوی ڤیدیۆکە نەک تەنها 360 چرکە یان 120 چرکە")
 * - Wall-Clock Synchronized Global Broadcast Epoch (All viewers see the exact same on-air frame simultaneously)
 * - Dynamic News Ticker with Multi-Style, Multi-Speed, Multi-Font Selection
 * - Center Screen Commercial / Promo Overlay with Packages & Contacts ("لە نیوەی شاشەکە با بتوانین لۆگۆی بەرنامەکە بە گەورەی بهێنێت لەگەڵ پاکێچەکانی بەشداری کردن و ئامڕازەکانی پەیوەندی کردن")
 */
import { getApiBaseUrl } from './dabinRealtimeService';

// Dedicated Standalone Video Stream URL for KOBIN TV Brand Promo (Bypasses any live proxy or serverless timeouts)
export const KOBIN_BRAND_PROMO_STREAM_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const DEFAULT_TIMELINE_ITEMS = [
  {
    id: 'tl-item-promo-hd',
    type: 'video',
    title: 'KOBIN.Tv Official Brand Promo 4K',
    url: KOBIN_BRAND_PROMO_STREAM_URL,
    thumbnail: '/kobin-logo.png',
    duration: 596, // Full video length
    isFullVideo: true
  },
  {
    id: 'tl-item-nature-kurd-1',
    type: 'youtube',
    title: 'سروشتی جوانی کوردستان 4K (چیاکانی زاگرۆس و ڕواندز و دۆڵی شیرانە)',
    url: 'https://www.youtube.com/watch?v=1mT1Swq3FU0',
    youtubeId: '1mT1Swq3FU0',
    thumbnail: 'https://img.youtube.com/vi/1mT1Swq3FU0/hqdefault.jpg',
    duration: 180, // 3 minutes
    isFullVideo: false
  },
  {
    id: 'tl-item-quran-rain',
    type: 'youtube',
    title: 'سوورەتی بەقەرە - دەنگی باران و ئارامی (مشاری العفاسی)',
    url: 'https://www.youtube.com/watch?v=pKaijJRxRM8',
    youtubeId: 'pKaijJRxRM8',
    thumbnail: 'https://img.youtube.com/vi/pKaijJRxRM8/hqdefault.jpg',
    duration: 180, // 3 minutes
    isFullVideo: false
  },
  {
    id: 'tl-item-quran-fattah',
    type: 'youtube',
    title: 'خوێندنەوەی قورئانی پیرۆز - مامۆستا عبدالرحمن فتاح',
    url: 'https://www.youtube.com/watch?v=gEQrP-40J1E',
    youtubeId: 'gEQrP-40J1E',
    thumbnail: 'https://img.youtube.com/vi/gEQrP-40J1E/hqdefault.jpg',
    duration: 180, // 3 minutes
    isFullVideo: false
  },
  {
    id: 'tl-item-card-logo',
    type: 'image',
    title: 'KOBIN.Tv Official Broadcast Card',
    url: '/kobin-logo.png',
    thumbnail: '/kobin-logo.png',
    duration: 15,
    isFullVideo: false
  }
];

// Fixed reference anchor for deterministic broadcast clock across clients
export const DEFAULT_BROADCAST_START_TIME = 1729500000000;

export const DEFAULT_DABIN_BROADCAST_CONFIG = {
  // Mode: 'timeline'
  playMode: 'timeline',

  // 1. Continuous Linear TV Engine ("با وەک کەناڵێک وابێت")
  isLinearBroadcast: true,
  broadcastStartTime: DEFAULT_BROADCAST_START_TIME,
  
  // 2. The Unified Sequential Broadcast Timeline
  timelineItems: DEFAULT_TIMELINE_ITEMS,
  currentTimelineIndex: 0,
  isLoop: true,

  // 3. Channel Logo Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت")
  showLogoOverlay: true,
  logoPosition: 'top-right',
  logoSize: 'medium',
  logoOpacity: 0.95,
  customLogoUrl: '/kobin-logo.png',

  // 4. Announcement Ticker ("شریتی ئاگەداری دابنێ")
  showTicker: true,
  tickerText: 'بەخێربێن بۆ کەناڵی فەرمی KOBIN TV - چێژ لە باشترین کوالێتی پەخشی ڕاستەوخۆ و ئەزموونی سینەمایی وەربگرن',
  tickerBadgeText: 'KOBIN TV',
  tickerStyle: 'modern_glass', // 'modern_glass' | 'breaking_red' | 'minimal_dark' | 'sapphire_blue' | 'fluent_slate'
  tickerSpeed: 'normal',       // 'slow' (40s) | 'normal' (25s) | 'fast' (15s) | 'ultra_fast' (10s)
  tickerFont: 'vazirmatn',     // 'vazirmatn' | 'cairo' | 'kufi' | 'rabat' | 'tahoma'
  tickerBgColor: '',
  tickerTextColor: '',

  // 5. Center Screen Commercial / Promo Overlay with Packages & Contacts
  showPromoOverlay: true,
  promoIntervalMinutes: 10,   // Triggers every 10 minutes
  promoDisplaySeconds: 12,    // Visible for 12 seconds
  promoTitle: 'KOBIN TV - تایبەتمەندترین پلاتفۆرمی پەخشی کەناڵەکان',
  promoSubtitle: 'بۆ بەشداریکردن و کاراکردنی کۆدی MAC پەیوەندی بە ڕیسێلەرەکانمانەوە بکەن',
  promoPackages: [
    { name: 'پاکێجی ١ مانگ', price: '10,000 IQD', tag: 'تێست و مانگانە' },
    { name: 'پاکێجی ٣ مانگ', price: '25,000 IQD', tag: 'داشکاندنی وەرز' },
    { name: 'پاکێجی ٦ مانگ', price: '45,000 IQD', tag: 'نیوەی ساڵ' },
    { name: 'پاکێجی ١ ساڵە (VIP)', price: '75,000 IQD', tag: 'باشترین نرخ ⭐' },
  ],
  promoContactWhatsapp: '+964 750 000 0000',
  promoContactPhone: '+964 770 000 0000',
  promoContactTelegram: '@kobin_tv'
};

export const DEFAULT_KOBIN_BROADCAST_CONFIG = DEFAULT_DABIN_BROADCAST_CONFIG;

const BROADCAST_STORAGE_KEY = 'kobin_broadcast_studio_config_v5';
const LEGACY_STORAGE_KEY = 'dabin_broadcast_studio_config_v4';

/**
 * Extract YouTube Video ID from any URL format
 */
export function extractYouTubeVideoId(input = '') {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : '';
}

/**
 * Format seconds to readable MM:SS or HH:MM:SS
 */
export function formatBroadcastTime(totalSeconds = 0) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Auto-detect exact video duration in seconds via HTML5 video element
 */
export function detectVideoDuration(src) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !src) return resolve(120);
    try {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = src;
      const cleanup = () => {
        v.onloadedmetadata = null;
        v.onerror = null;
        v.src = '';
      };
      const timeout = setTimeout(() => {
        cleanup();
        resolve(120);
      }, 5000);

      v.onloadedmetadata = () => {
        clearTimeout(timeout);
        const dur = Math.round(v.duration);
        cleanup();
        resolve(dur > 0 ? dur : 120);
      };
      v.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        resolve(120);
      };
    } catch (e) {
      resolve(120);
    }
  });
}

/**
 * Calculate the current continuous linear broadcast state (Pseudo-Live Linear TV Engine)
 */
export function calculateCurrentBroadcastState(config, atTimestamp = Date.now()) {
  const items = config?.timelineItems || [];
  if (items.length === 0) {
    return {
      currentItem: null,
      itemIndex: 0,
      seekSeconds: 0,
      remainingSeconds: 0,
      totalCycleDuration: 0,
      cycleElapsedSeconds: 0,
      nextItem: null
    };
  }

  // Calculate durations with fallback defaults
  const resolvedDurations = items.map(item => {
    const d = parseFloat(item.duration);
    if (!isNaN(d) && d > 0) return d;
    if (item.type === 'image') return 15;
    if (item.type === 'youtube') return 180;
    return 120;
  });

  const totalCycleDuration = resolvedDurations.reduce((sum, d) => sum + d, 0);
  if (totalCycleDuration <= 0) {
    return {
      currentItem: items[0],
      itemIndex: 0,
      seekSeconds: 0,
      remainingSeconds: resolvedDurations[0] || 60,
      totalCycleDuration: 60,
      cycleElapsedSeconds: 0,
      itemDuration: resolvedDurations[0] || 60,
      nextItem: items[1] || items[0]
    };
  }

  const startTime = config?.broadcastStartTime || DEFAULT_BROADCAST_START_TIME;
  const elapsedTotalSeconds = Math.max(0, (atTimestamp - startTime) / 1000);
  const cycleElapsedSeconds = elapsedTotalSeconds % totalCycleDuration;

  let accumulated = 0;
  for (let i = 0; i < items.length; i++) {
    const itemDuration = resolvedDurations[i];
    if (accumulated + itemDuration > cycleElapsedSeconds) {
      const seekSeconds = cycleElapsedSeconds - accumulated;
      const remainingSeconds = itemDuration - seekSeconds;
      const nextIndex = (i + 1) % items.length;
      return {
        currentItem: items[i],
        itemIndex: i,
        seekSeconds: Math.max(0, seekSeconds),
        remainingSeconds: Math.max(0.5, remainingSeconds),
        totalCycleDuration,
        cycleElapsedSeconds,
        itemDuration,
        nextItem: items[nextIndex]
      };
    }
    accumulated += itemDuration;
  }

  return {
    currentItem: items[0],
    itemIndex: 0,
    seekSeconds: 0,
    remainingSeconds: resolvedDurations[0],
    totalCycleDuration,
    cycleElapsedSeconds,
    itemDuration: resolvedDurations[0],
    nextItem: items[1] || items[0]
  };
}

/**
 * Get current KOBIN.Tv broadcast configuration from local storage
 */
export function getDabinBroadcastConfig() {
  try {
    const raw = localStorage.getItem(BROADCAST_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DABIN_BROADCAST_CONFIG };
    const parsed = JSON.parse(raw);

    let items = Array.isArray(parsed.timelineItems) && parsed.timelineItems.length > 0
      ? parsed.timelineItems
      : DEFAULT_TIMELINE_ITEMS;

    return {
      ...DEFAULT_DABIN_BROADCAST_CONFIG,
      ...parsed,
      customLogoUrl: parsed.customLogoUrl || '/kobin-logo.png',
      isLinearBroadcast: parsed.isLinearBroadcast !== undefined ? Boolean(parsed.isLinearBroadcast) : true,
      broadcastStartTime: typeof parsed.broadcastStartTime === 'number' && parsed.broadcastStartTime > 0
        ? parsed.broadcastStartTime
        : DEFAULT_BROADCAST_START_TIME,
      timelineItems: items.map((item) => ({
        ...item,
        duration: (parseFloat(item.duration) > 0)
          ? parseFloat(item.duration)
          : (item.type === 'image' ? 15 : (item.type === 'youtube' ? 180 : 120))
      })),
      isLoop: parsed.isLoop !== undefined ? Boolean(parsed.isLoop) : true,
      showLogoOverlay: parsed.showLogoOverlay !== undefined ? Boolean(parsed.showLogoOverlay) : true,
      showTicker: parsed.showTicker !== undefined ? Boolean(parsed.showTicker) : true,
      tickerStyle: parsed.tickerStyle || 'modern_glass',
      tickerSpeed: parsed.tickerSpeed || 'normal',
      tickerFont: parsed.tickerFont || 'vazirmatn',
      showPromoOverlay: parsed.showPromoOverlay !== undefined ? Boolean(parsed.showPromoOverlay) : true,
      promoIntervalMinutes: Number(parsed.promoIntervalMinutes) || 10,
      promoDisplaySeconds: Number(parsed.promoDisplaySeconds) || 12,
      promoPackages: Array.isArray(parsed.promoPackages) && parsed.promoPackages.length > 0 
        ? parsed.promoPackages 
        : DEFAULT_DABIN_BROADCAST_CONFIG.promoPackages
    };
  } catch (err) {
    console.warn('[BroadcastManager] Failed to load config:', err);
    return { ...DEFAULT_DABIN_BROADCAST_CONFIG };
  }
}

export const getKobinBroadcastConfig = getDabinBroadcastConfig;

// Native Web BroadcastChannel for ultra-fast instant cross-tab / cross-window sync
export const KOBIN_BROADCAST_CHANNEL_NAME = 'kobin_tv_sync';

let kobinBroadcastSyncChannel = null;
if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
  try {
    kobinBroadcastSyncChannel = new BroadcastChannel(KOBIN_BROADCAST_CHANNEL_NAME);
  } catch (e) {}
}

export function postKobinSyncMessage(type, payload) {
  if (kobinBroadcastSyncChannel) {
    try {
      kobinBroadcastSyncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (e) {}
  }
}

export function subscribeToKobinBroadcastChannel(onMessage) {
  if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') {
    return () => {};
  }
  try {
    const channel = new BroadcastChannel(KOBIN_BROADCAST_CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event?.data) {
        onMessage?.(event.data);
      }
    };
    return () => {
      try {
        channel.close();
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}

/**
 * Save updated KOBIN TV broadcast configuration
 */
export function saveDabinBroadcastConfig(newConfig) {
  try {
    const merged = {
      ...DEFAULT_DABIN_BROADCAST_CONFIG,
      ...newConfig
    };
    localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(merged));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('dabin_broadcast_updated', { detail: merged }));
    window.dispatchEvent(new CustomEvent('kobin_broadcast_updated', { detail: merged }));
    
    // Broadcast instantly to all tabs / windows via BroadcastChannel 'kobin_tv_sync'
    postKobinSyncMessage('BROADCAST_CONFIG_UPDATED', merged);

    // Asynchronously push to Cloud Backend for cross-device synchronization (Mobile, TV, Web)
    try {
      const apiBase = getApiBaseUrl();
      fetch(`${apiBase}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: merged })
      }).catch(() => {});
    } catch (e) {}

    return true;
  } catch (err) {
    console.error('[BroadcastManager] Failed to save config:', err);
    return false;
  }
}

export const saveKobinBroadcastConfig = saveDabinBroadcastConfig;

/**
 * Fetch and synchronize broadcast config from Cloud Backend
 * Ensures Mobile, Smart TV, and PC all play the exact same broadcast stream & ticker
 */
export async function syncBroadcastConfigFromCloud() {
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/api/broadcast`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.config) {
        const merged = {
          ...DEFAULT_DABIN_BROADCAST_CONFIG,
          ...data.config
        };
        localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('dabin_broadcast_updated', { detail: merged }));
        window.dispatchEvent(new CustomEvent('kobin_broadcast_updated', { detail: merged }));
        postKobinSyncMessage('BROADCAST_CONFIG_UPDATED', merged);
        return merged;
      }
    }
  } catch (e) {
    console.warn('[BroadcastManager] Cloud sync fallback:', e.message);
  }
  return getDabinBroadcastConfig();
}
