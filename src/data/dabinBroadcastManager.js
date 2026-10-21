/**
 * DABIN.Tv Channel Broadcast Studio Manager & Real-Time Linear TV Engine
 * 
 * Manages full broadcast programming for Channel #1 (DABIN.Tv Channel):
 * - Pseudo-Live Real-Time Linear TV Scheduling ("با وەک کانڵێک وابێت فیدیۆکە ، نەک کە چوە سەری انجا فیدیۆکە پلەی بکات")
 * - Continuous Timeline Looping ("و با فیدیۆکان LOOb بێت")
 * - Wall-Clock Synchronized Global Broadcast Epoch (All viewers see the exact same on-air frame simultaneously)
 * - Admin Panel Master Broadcast Control ("پەخشی کەناڵەکە لە admin panel دیاری بکرێت و لەوێوە کۆنترۆڵی پەخش بکرێت")
 * - Dynamic Channel Watermark Logo Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت")
 * - Live Scrolling Announcement Marquee / Ticker ("شریتی ئاگەداری دابنێ")
 */

export const DEFAULT_TIMELINE_ITEMS = [
  {
    id: 'tl-item-1',
    type: 'video', // 'video' | 'youtube' | 'image'
    title: 'DABIN.Tv Promo HD',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: '/dabin-logo.png',
    duration: 60 // 60 seconds
  },
  {
    id: 'tl-item-2',
    type: 'image',
    title: 'DABIN.Tv Official Card',
    url: '/dabin-logo.png',
    thumbnail: '/dabin-logo.png',
    duration: 12 // 12 seconds
  },
  {
    id: 'tl-item-3',
    type: 'youtube',
    title: 'DABIN 24/7 Live Ambient',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    youtubeId: 'jfKfPfyJRdk',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 45 // 45 seconds
  }
];

// Fixed reference anchor for deterministic broadcast clock across clients
export const DEFAULT_BROADCAST_START_TIME = 1729500000000;

export const DEFAULT_DABIN_BROADCAST_CONFIG = {
  // Mode: 'timeline'
  playMode: 'timeline',

  // 1. Continuous Linear TV Engine ("با وەک کەناڵێک وابێت")
  isLinearBroadcast: true, // If true, plays according to the master live broadcast clock
  broadcastStartTime: DEFAULT_BROADCAST_START_TIME, // Milliseconds timestamp of the broadcast schedule epoch
  
  // 2. The Unified Sequential Broadcast Timeline
  timelineItems: DEFAULT_TIMELINE_ITEMS,
  currentTimelineIndex: 0,
  isLoop: true, // "با فیدیۆکان LOOb بێت"

  // 3. Channel Logo Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت")
  showLogoOverlay: true,
  logoPosition: 'top-right', // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  logoSize: 'medium', // 'small' | 'medium' | 'large'
  logoOpacity: 0.95,
  customLogoUrl: '/dabin-logo.png',

  // 4. Announcement Ticker ("شریتی ئاگەداری دابنێ")
  showTicker: true,
  tickerText: 'بەخێربێن بۆ کەناڵی تایبەتی DABIN.Tv - چێژ لە باشترین کوالێتی پەخشی ڕاستەوخۆ و ئەزموونی سینەمایی وەربگرن',
  tickerSpeed: 'normal', // 'slow' | 'normal' | 'fast'
  tickerBgColor: 'rgba(2, 6, 23, 0.85)',
  tickerTextColor: '#ffffff',
  tickerBadgeText: 'ئاگاداری'
};

const BROADCAST_STORAGE_KEY = 'dabin_broadcast_studio_config_v3';

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
 * 
 * Takes the broadcast schedule anchor (broadcastStartTime) and timeline items,
 * and determines:
 * - Which item is currently on-air right now
 * - The exact second (seekSeconds) into that item
 * - How many seconds remain until the next item
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
    if (item.type === 'image') return 10;
    if (item.type === 'youtube') return 60;
    return 120; // Default 2 minutes for video if unset
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

  // Fallback to first item
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
    const raw = localStorage.getItem(BROADCAST_STORAGE_KEY) || localStorage.getItem('dabin_broadcast_studio_config_v2');
    if (!raw) return { ...DEFAULT_DABIN_BROADCAST_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DABIN_BROADCAST_CONFIG,
      ...parsed,
      isLinearBroadcast: parsed.isLinearBroadcast !== undefined ? Boolean(parsed.isLinearBroadcast) : true,
      broadcastStartTime: typeof parsed.broadcastStartTime === 'number' && parsed.broadcastStartTime > 0
        ? parsed.broadcastStartTime
        : DEFAULT_BROADCAST_START_TIME,
      timelineItems: Array.isArray(parsed.timelineItems) && parsed.timelineItems.length > 0
        ? parsed.timelineItems.map((item, idx) => ({
            ...item,
            duration: (parseFloat(item.duration) > 0)
              ? parseFloat(item.duration)
              : (item.type === 'image' ? 10 : (item.type === 'youtube' ? 60 : 120))
          }))
        : DEFAULT_DABIN_BROADCAST_CONFIG.timelineItems,
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
