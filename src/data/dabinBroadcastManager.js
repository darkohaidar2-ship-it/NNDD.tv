/**
 * DABIN.Tv Channel Broadcast Studio Manager
 * 
 * Manages full broadcast programming for Channel #1 (DABIN.Tv Channel):
 * - Unified Timeline Sequence Track ("شریتێکی تایم لاین دابنێم بۆ ئەوەی هەمووی بەدوای یەکدا ریز بکەم")
 * - Mixed Media Items: Uploaded Videos, Direct Video URLs, YouTube Streams, and Images/Photos
 * - Continuous Timeline Looping ("و با فیدیۆکان LOOb بێت")
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
    duration: 0 // 0 means play until video ends
  },
  {
    id: 'tl-item-2',
    type: 'image',
    title: 'DABIN.Tv Official Card',
    url: '/dabin-logo.png',
    thumbnail: '/dabin-logo.png',
    duration: 8 // Display for 8 seconds
  },
  {
    id: 'tl-item-3',
    type: 'youtube',
    title: 'DABIN 24/7 Live Ambient',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    youtubeId: 'jfKfPfyJRdk',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 45 // 45 seconds or until ended
  }
];

export const DEFAULT_DABIN_BROADCAST_CONFIG = {
  // Mode: 'timeline'
  playMode: 'timeline',

  // 1. The Unified Sequential Broadcast Timeline
  timelineItems: DEFAULT_TIMELINE_ITEMS,
  currentTimelineIndex: 0,
  isLoop: true, // "با فیدیۆکان LOOb بێت"

  // 2. Channel Logo Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت")
  showLogoOverlay: true,
  logoPosition: 'top-right', // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  logoSize: 'medium', // 'small' | 'medium' | 'large'
  logoOpacity: 0.95,
  customLogoUrl: '/dabin-logo.png',

  // 3. Announcement Ticker ("شریتی ئاگەداری دابنێ")
  showTicker: true,
  tickerText: 'بەخێربێن بۆ کەناڵی تایبەتی DABIN.Tv - چێژ لە باشترین کوالێتی پەخشی ڕاستەوخۆ و ئەزموونی سینەمایی وەربگرن',
  tickerSpeed: 'normal', // 'slow' | 'normal' | 'fast'
  tickerBgColor: 'rgba(2, 6, 23, 0.85)',
  tickerTextColor: '#ffffff',
  tickerBadgeText: 'ئاگاداری'
};

const BROADCAST_STORAGE_KEY = 'dabin_broadcast_studio_config_v2';

/**
 * Extract YouTube Video ID from any URL format:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - Direct VIDEO_ID
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
 * Get current DABIN.Tv broadcast configuration from local storage
 */
export function getDabinBroadcastConfig() {
  try {
    const raw = localStorage.getItem(BROADCAST_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DABIN_BROADCAST_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DABIN_BROADCAST_CONFIG,
      ...parsed,
      timelineItems: Array.isArray(parsed.timelineItems) && parsed.timelineItems.length > 0
        ? parsed.timelineItems
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
