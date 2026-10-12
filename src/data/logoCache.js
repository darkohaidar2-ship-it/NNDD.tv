// LocalStorage & Offline Image Cache Manager for NNDD TV
// Automatically caches channel logos in LocalStorage as Base64 data URLs for instant offline display

const LOGO_CACHE_PREFIX = 'nndd_logo_cache_';
const memoryLogoCache = new Map();

// Helper to convert an image URL or Blob to Base64
export async function fetchImageAsBase64(url) {
  if (!url) return null;
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
        // Scale to 96x96 for crisp circular badge display and minimal local storage footprint
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

// Get cached logo from memory or localStorage
export function getCachedLogo(channelId, originalUrl) {
  if (!channelId && !originalUrl) return null;
  const cacheKey = `${LOGO_CACHE_PREFIX}${channelId || originalUrl}`;
  
  // 1. Memory Cache (0ms)
  if (memoryLogoCache.has(cacheKey)) {
    return memoryLogoCache.get(cacheKey);
  }

  // 2. LocalStorage Cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      memoryLogoCache.set(cacheKey, cached);
      return cached;
    }
  } catch (e) {}

  return null;
}

// Save logo to memory and localStorage
export function setCachedLogo(channelId, originalUrl, base64Data) {
  if (!base64Data) return;
  const cacheKey = `${LOGO_CACHE_PREFIX}${channelId || originalUrl}`;
  memoryLogoCache.set(cacheKey, base64Data);
  try {
    localStorage.setItem(cacheKey, base64Data);
  } catch (e) {
    console.warn('LocalStorage quota limit reached while caching logo:', e);
  }
}

// Preload and save all channel logos in localStorage
export async function cacheAllChannelLogos(channels, onProgress) {
  if (!channels || !Array.isArray(channels)) return 0;
  let cachedCount = 0;
  const targetChannels = channels.filter(c => c.logo);
  const total = targetChannels.length;

  for (let i = 0; i < targetChannels.length; i++) {
    const ch = targetChannels[i];
    const cacheKey = `${LOGO_CACHE_PREFIX}${ch.id}`;

    // Check if already in cache
    if (memoryLogoCache.has(cacheKey) || (typeof localStorage !== 'undefined' && localStorage.getItem(cacheKey))) {
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
    // Tiny delay to keep thread responsive
    await new Promise(r => setTimeout(r, 15));
  }

  return cachedCount;
}

// Count how many logos are currently cached in localStorage
export function getCachedLogosCount(channels) {
  if (!channels || !Array.isArray(channels)) return 0;
  let count = 0;
  for (const ch of channels) {
    if (!ch.logo) continue;
    const cacheKey = `${LOGO_CACHE_PREFIX}${ch.id}`;
    if (memoryLogoCache.has(cacheKey) || (typeof localStorage !== 'undefined' && localStorage.getItem(cacheKey))) {
      count++;
    }
  }
  return count;
}

// Clear all cached logos from localStorage
export function clearCachedLogos() {
  memoryLogoCache.clear();
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOGO_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}
