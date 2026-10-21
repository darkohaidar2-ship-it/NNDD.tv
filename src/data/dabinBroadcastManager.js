/**
 * DABIN.Tv Channel Broadcast Studio Manager
 * 
 * Manages full broadcast programming for Channel #1 (DABIN.Tv Channel):
 * - Source Type: YouTube Video / Stream, Direct MP4 / M3U8 Video Playlist, or Photo Album Slideshow
 * - Continuous Looping ("و با فیدیۆکان LOOb بێت")
 * - Dynamic Channel Watermark Logo Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت")
 * - Live Scrolling Announcement Marquee / Ticker ("شریتی ئاگەداری دابنێ")
 */

export const DEFAULT_DABIN_BROADCAST_CONFIG = {
  // Source Mode: 'youtube' | 'video' | 'album'
  sourceType: 'youtube',

  // 1. YouTube Source
  youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  youtubeVideoId: 'jfKfPfyJRdk',

  // 2. Video Playlist (Multiple videos or uploaded video)
  videoPlaylist: [
    {
      id: 'vid-default-1',
      title: 'DABIN.Tv Promo HD',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
  ],
  currentVideoIndex: 0,
  isLoop: true, // "و با فیدیۆکان LOOb بێت"

  // 3. Photo Album / Slideshow
  albumPhotos: [
    {
      id: 'img-1',
      title: 'DABIN.Tv Welcome',
      url: '/dabin-logo.png'
    }
  ],
  slideDurationSeconds: 6,

  // 4. Channel Logo Overlay ("لۆگۆی کەناڵەکە لەلایەک بێت")
  showLogoOverlay: true,
  logoPosition: 'top-right', // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  logoSize: 'medium', // 'small' | 'medium' | 'large'
  logoOpacity: 0.95,
  customLogoUrl: '/dabin-logo.png',

  // 5. Announcement Ticker ("شریتی ئاگەداری دابنێ")
  showTicker: true,
  tickerText: 'بەخێربێن بۆ کەناڵی تایبەتی DABIN.Tv - چێژ لە باشترین کوالێتی پەخشی ڕاستەوخۆ و ئەزموونی سینەمایی وەربگرن',
  tickerSpeed: 'normal', // 'slow' | 'normal' | 'fast'
  tickerBgColor: 'rgba(2, 6, 23, 0.85)',
  tickerTextColor: '#ffffff',
  tickerBadgeText: 'ئاگاداری'
};

const BROADCAST_STORAGE_KEY = 'dabin_broadcast_studio_config';

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
      // Ensure arrays and booleans are well-formed
      videoPlaylist: Array.isArray(parsed.videoPlaylist) && parsed.videoPlaylist.length > 0 
        ? parsed.videoPlaylist 
        : DEFAULT_DABIN_BROADCAST_CONFIG.videoPlaylist,
      albumPhotos: Array.isArray(parsed.albumPhotos) && parsed.albumPhotos.length > 0
        ? parsed.albumPhotos
        : DEFAULT_DABIN_BROADCAST_CONFIG.albumPhotos,
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
