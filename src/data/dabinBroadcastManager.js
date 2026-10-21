/**
 * DABIN.Tv Channel Broadcast Studio Manager & Real-Time Linear TV Engine
 * 
 * Manages full broadcast programming for Channel #1 (DABIN.Tv Channel):
 * - Real-Time Linear TV Scheduling ("با وەک کانڵێک وابێت فیدیۆکە ، نەک کە چوە سەری انجا فیدیۆکە پلەی بکات")
 * - Continuous Timeline Looping ("و با فیدیۆکان LOOb بێت")
 * - Wall-Clock Synchronized Global Broadcast Epoch (All viewers see the exact same on-air frame simultaneously)
 * - Admin Panel Master Broadcast Control ("پەخشی کەناڵەکە لە admin panel دیاری بکرێت و لەوێوە کۆنترۆڵی پەخش بکرێت")
 * - Dynamic Channel Watermark Logo Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت")
 * - Live Scrolling Announcement Marquee / Ticker ("شریتی ئاگەداری دابنێ")
 */

export const DEFAULT_TIMELINE_ITEMS = [
  {
    id: 'tl-item-quran-rain',
    type: 'youtube',
    title: 'سوورەتی بەقەرە - دەنگی باران و ئارامی (مشاری العفاسی)',
    url: 'https://www.youtube.com/watch?v=pKaijJRxRM8',
    youtubeId: 'pKaijJRxRM8',
    thumbnail: 'https://img.youtube.com/vi/pKaijJRxRM8/hqdefault.jpg',
    duration: 180 // 3 minutes
  },
  {
    id: 'tl-item-nature-kurd-1',
    type: 'youtube',
    title: 'سروشتی جوانی کوردستان 4K (چیاکانی زاگرۆس و ڕواندز و دۆڵی شیرانە)',
    url: 'https://www.youtube.com/watch?v=1mT1Swq3FU0',
    youtubeId: '1mT1Swq3FU0',
    thumbnail: 'https://img.youtube.com/vi/1mT1Swq3FU0/hqdefault.jpg',
    duration: 180 // 3 minutes
  },
  {
    id: 'tl-item-quran-fattah',
    type: 'youtube',
    title: 'خوێندنەوەی قورئانی پیرۆز - مامۆستا عبدالرحمن فتاح',
    url: 'https://www.youtube.com/watch?v=gEQrP-40J1E',
    youtubeId: 'gEQrP-40J1E',
    thumbnail: 'https://img.youtube.com/vi/gEQrP-40J1E/hqdefault.jpg',
    duration: 180 // 3 minutes
  },
  {
    id: 'tl-item-promo-hd',
    type: 'video',
    title: 'DABIN.Tv HD Promo Reel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: '/dabin-logo.png',
    duration: 60
  },
  {
    id: 'tl-item-card-logo',
    type: 'image',
    title: 'DABIN.Tv Official Broadcast Card',
    url: '/dabin-logo.png',
    thumbnail: '/dabin-logo.png',
    duration: 15
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
  customLogoUrl: '/dabin-logo.png',

  // 4. Announcement Ticker ("شریتی ئاگەداری دابنێ")
  showTicker: true,
  tickerText: 'بەخێربێن بۆ کەناڵی تایبەتی DABIN.Tv - چێژ لە باشترین کوالێتی پەخشی ڕاستەوخۆ و ئەزموونی سینەمایی وەربگرن',
  tickerSpeed: 'normal',
  tickerBgColor: 'rgba(2, 6, 23, 0.85)',
  tickerTextColor: '#ffffff',
  tickerBadgeText: 'ئاگاداری'
};

const BROADCAST_STORAGE_KEY = 'dabin_broadcast_studio_config_v4';

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
    cycleElapsedSeconds: 0,
    itemDuration: resolvedDurations[0],
    nextItem: items[1] || items[0]
  };
}

/**
 * Get current DABIN.Tv broadcast configuration from local storage
 */
export function getDabinBroadcastConfig() {
  try {
    const raw = localStorage.getItem(BROADCAST_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DABIN_BROADCAST_CONFIG };
    const parsed = JSON.parse(raw);

    // Merge in any missing user requested default items
    let items = Array.isArray(parsed.timelineItems) && parsed.timelineItems.length > 0
      ? parsed.timelineItems
      : DEFAULT_TIMELINE_ITEMS;

    const hasQuranRain = items.some(it => it.url?.includes('pKaijJRxRM8') || it.youtubeId === 'pKaijJRxRM8');
    const hasQuranFattah = items.some(it => it.url?.includes('gEQrP-40J1E') || it.youtubeId === 'gEQrP-40J1E');
    const hasNature = items.some(it => it.url?.includes('1mT1Swq3FU0') || it.youtubeId === '1mT1Swq3FU0');

    if (!hasQuranRain || !hasQuranFattah || !hasNature) {
      const missing = DEFAULT_TIMELINE_ITEMS.filter(def => 
        (def.youtubeId === 'pKaijJRxRM8' && !hasQuranRain) ||
        (def.youtubeId === 'gEQrP-40J1E' && !hasQuranFattah) ||
        (def.youtubeId === '1mT1Swq3FU0' && !hasNature)
      );
      items = [...missing, ...items];
    }

    return {
      ...DEFAULT_DABIN_BROADCAST_CONFIG,
      ...parsed,
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
      showTicker: parsed.showTicker !== undefined ? Boolean(parsed.showTicker) : true
    };
  } catch (err) {
    console.warn('[DabinBroadcast] Failed to load config:', err);
    return { ...DEFAULT_DABIN_BROADCAST_CONFIG };
  }
}

/**
 * Save updated DABIN.Tv broadcast configuration
 */
export function saveDabinBroadcastConfig(newConfig) {
  try {
    const merged = {
      ...DEFAULT_DABIN_BROADCAST_CONFIG,
      ...newConfig
    };
    localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('dabin_broadcast_updated', { detail: merged }));
    return true;
  } catch (err) {
    console.error('[DabinBroadcast] Failed to save config:', err);
    return false;
  }
}
