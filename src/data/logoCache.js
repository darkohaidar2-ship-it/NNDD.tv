// Memory Image Cache Manager for NNDD TV
// Caches channel logos in Memory (Map) for instant 0ms display without hitting LocalStorage quota limits

const LOGO_CACHE_PREFIX = 'nndd_logo_cache_';
const memoryLogoCache = new Map();

// Automatic one-time cleanup on startup to purge legacy base64 image bloat from LocalStorage
try {
  if (typeof localStorage !== 'undefined') {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOGO_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch(e) {}
    });
  }
} catch (e) {}

// Helper to convert an image URL or Blob to Base64
export async function fetchImageAsBase64(url) {
  if (!url) return null;
  const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  const isRawIp = /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(url);
  if (isRawIp || (isHttps && url.startsWith('http:'))) {
    // Skip direct CORS fetch on dead HTTP IPs or Mixed Content to avoid ERR_CONNECTION_REFUSED
    return null;
  }
  try {
    const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {}

  // Fallback via Image element + Canvas (bypasses direct fetch restrictions)
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 96;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/webp', 0.85) || canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Get cached logo from fast memory cache
export function getCachedLogo(channelId, originalUrl) {
  if (!channelId && !originalUrl) return null;
  const cacheKey = `${LOGO_CACHE_PREFIX}${channelId || originalUrl}`;
  
  // Memory Cache (0ms)
  if (memoryLogoCache.has(cacheKey)) {
    return memoryLogoCache.get(cacheKey);
  }

  return null;
}

// Save logo to fast memory cache (RAM only, safe and instant)
export function setCachedLogo(channelId, originalUrl, base64Data) {
  if (!base64Data) return;
  const cacheKey = `${LOGO_CACHE_PREFIX}${channelId || originalUrl}`;
  memoryLogoCache.set(cacheKey, base64Data);
}

// Preload and save channel logos in memory
export async function cacheAllChannelLogos(channels, onProgress) {
  if (!channels || !Array.isArray(channels)) return 0;
  let cachedCount = 0;
  const targetChannels = channels.filter(c => c.logo);
  const total = targetChannels.length;

  for (let i = 0; i < targetChannels.length; i++) {
    const ch = targetChannels[i];
    const cacheKey = `${LOGO_CACHE_PREFIX}${ch.id}`;

    if (memoryLogoCache.has(cacheKey)) {
      cachedCount++;
      onProgress?.(cachedCount, total, ch.name);
      continue;
    }

    try {
      const base64 = await fetchImageAsBase64(ch.logo);
      if (base64) {
        setCachedLogo(ch.id, ch.logo, base64);
        cachedCount++;
      } else if (ch.fallbackLogo) {
        const fbBase64 = await fetchImageAsBase64(ch.fallbackLogo);
        if (fbBase64) {
          setCachedLogo(ch.id, ch.logo, fbBase64);
          cachedCount++;
        }
      }
    } catch (err) {}

    onProgress?.(cachedCount, total, ch.name);
    await new Promise(r => setTimeout(r, 10));
  }

  return cachedCount;
}

// Count how many logos are currently cached
export function getCachedLogosCount(channels) {
  if (!channels || !Array.isArray(channels)) return 0;
  let count = 0;
  for (const ch of channels) {
    if (!ch.logo) continue;
    const cacheKey = `${LOGO_CACHE_PREFIX}${ch.id}`;
    if (memoryLogoCache.has(cacheKey)) {
      count++;
    }
  }
  return count;
}

// Clear all cached logos
export function clearCachedLogos() {
  memoryLogoCache.clear();
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOGO_CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
  } catch (e) {}
}
