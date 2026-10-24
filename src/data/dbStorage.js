/**
 * NNDD TV - High-Performance IndexedDB Storage Engine
 * Resolves browser 5MB LocalStorage quota limits, effortlessly handling 50,000+ channels and VODs.
 */

const DB_NAME = 'nndd_tv_database';
const DB_VERSION = 1;
const STORE_NAME = 'keyval_store';

let dbInstance = null;

/**
 * Open or create IndexedDB connection
 */
export function openNnddDatabase() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.warn('[IndexedDB] Open error, falling back to LocalStorage:', event.target.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('[IndexedDB] Exception opening DB:', err);
      resolve(null);
    }
  });
}

/**
 * Set a key-value pair in IndexedDB
 */
export async function setDbItem(key, value) {
  try {
    const db = await openNnddDatabase();
    if (!db) {
      // Fallback to localStorage if IndexedDB is unavailable
      try {
        const str = JSON.stringify(value);
        // Only store if within reasonable size for localStorage
        if (str.length < 4 * 1024 * 1024) {
          localStorage.setItem(key, str);
        }
      } catch (e) {
        console.warn(`[LocalStorage] Quota reached for ${key}`);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.warn(`[IndexedDB] Error setting ${key}:`, e.target.error);
        reject(e.target.error);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] setDbItem failed for ${key}:`, err);
  }
}

/**
 * Get a key-value pair from IndexedDB
 */
export async function getDbItem(key) {
  try {
    const db = await openNnddDatabase();
    if (!db) {
      // Fallback to localStorage
      try {
        const cached = localStorage.getItem(key);
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    }

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result !== undefined && req.result !== null) {
          resolve(req.result);
        } else {
          // Check localStorage as migration fallback
          try {
            const ls = localStorage.getItem(key);
            resolve(ls ? JSON.parse(ls) : null);
          } catch (e) {
            resolve(null);
          }
        }
      };

      req.onerror = () => {
        try {
          const ls = localStorage.getItem(key);
          resolve(ls ? JSON.parse(ls) : null);
        } catch (e) {
          resolve(null);
        }
      };
    });
  } catch (err) {
    try {
      const ls = localStorage.getItem(key);
      return ls ? JSON.parse(ls) : null;
    } catch (e) {
      return null;
    }
  }
}

/**
 * High-Level: Save Channels persistently to IndexedDB + Safe LocalStorage bootstrap
 */
export const CURRENT_PLAYLIST_VERSION = '12.0.0-dabin-pure-server-channel-one';

export const DABIN_OFFICIAL_CHANNEL = {
  number: 1,
  id: "ch-dabin-tv-custom",
  tvgId: "KobinTV.iq",
  name: "KOBIN.Tv Channel",
  nameEn: "KOBIN.Tv Channel",
  nameKu: "کەناڵی کۆبین تیڤی",
  category: "KOBIN.Tv",
  url: "custom://kobin-broadcast",
  backupUrl: "custom://kobin-broadcast",
  logo: "/kobin-logo.png",
  fallbackLogo: "/kobin-logo.png",
  isCustomDabinChannel: true,
  quality: "1080p FHD",
  is4K: false,
  isLocked: false,
  isFavorite: true,
  serverId: "srv-kobin-official",
  description: "کەناڵی تایبەتی پەخشی فەرمی KOBIN.Tv - کۆنترۆڵکراو لەلایەن ستۆدیۆی کۆبین",
  epg: {
    currentShow: "پەخشی فەرمی KOBIN.Tv",
    nextShow: "ڕاگەیەندراو و بەرنامەی کۆبین",
    timeSlot: "24/7",
    progress: 50
  },
  xtreamSearchAliases: ["kobin", "kobin tv", "کۆبین", "dabin", "dabin tv"]
};
export const KOBIN_OFFICIAL_CHANNEL = DABIN_OFFICIAL_CHANNEL;

/**
 * Enforce DABIN.Tv Channel as permanent Channel #1:
 * - Channel 1 is ALWAYS DABIN.Tv Channel (number: 1, index: 0).
 * - All server / external channels are numbered sequentially starting from 2 (number: 2, 3, 4...).
 */
export function ensureDabinChannelFirst(channels) {
  if (!Array.isArray(channels) || channels.length === 0) {
    return [{ ...DABIN_OFFICIAL_CHANNEL, number: 1 }];
  }

  // Find existing DABIN.Tv channel if already present
  const dabinExisting = channels.find(c => 
    c && (
      c.id === 'ch-dabin-tv-custom' || 
      c.isCustomDabinChannel || 
      (c.name && c.name.toLowerCase().includes('dabin.tv channel'))
    )
  );

  const dabinChannel = dabinExisting 
    ? { ...dabinExisting, number: 1, isCustomDabinChannel: true }
    : { ...DABIN_OFFICIAL_CHANNEL, number: 1 };

  // Remove any duplicates of DABIN channel from the rest of the list
  const rest = channels.filter(c => 
    c && 
    c.id !== 'ch-dabin-tv-custom' && 
    !c.isCustomDabinChannel && 
    !(c.name && c.name.toLowerCase().includes('dabin.tv channel'))
  );

  // Renumber the rest starting strictly from 2
  const renumberedRest = rest.map((ch, idx) => ({
    ...ch,
    number: idx + 2
  }));

  return [dabinChannel, ...renumberedRest];
}

export async function savePersistentChannels(channels, skipNotify = false) {
  if (!Array.isArray(channels)) return;

  // Always ensure DABIN.Tv Channel is #1 and all other channels start from #2
  const safeChannels = ensureDabinChannelFirst(channels);

  // 1. Save full array to IndexedDB (no 5MB size limit)
  await setDbItem('nndd_channels_full', safeChannels);

  // 2. Mark clean state in localStorage
  try {
    localStorage.setItem('nndd_server_channels_count', String(safeChannels.length));
    localStorage.setItem('nndd_server_imported', 'false');
    localStorage.setItem('nndd_channels_last_updated', String(Date.now()));
    localStorage.setItem('nndd_playlist_version', CURRENT_PLAYLIST_VERSION);
  } catch(e) {}

  // 3. Keep safe subset in localStorage
  try {
    localStorage.setItem('nndd_cached_channels', JSON.stringify(safeChannels.slice(0, 300)));
  } catch (e) {}

  // 4. Notify app listeners with the channels array
  if (!skipNotify && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nndd_channels_updated', {
      detail: safeChannels
    }));
  }
}

/**
 * High-Level: Load Channels persistently
 */
export async function loadPersistentChannels(fallbackChannels = [DABIN_OFFICIAL_CHANNEL]) {
  const storedVersion = typeof localStorage !== 'undefined' ? localStorage.getItem('nndd_playlist_version') : null;

  if (storedVersion === CURRENT_PLAYLIST_VERSION) {
    try {
      const dbChannels = await getDbItem('nndd_channels_full');
      if (Array.isArray(dbChannels) && dbChannels.length > 0) {
        return ensureDabinChannelFirst(dbChannels);
      }
    } catch (e) {}

    try {
      const cached = localStorage.getItem('nndd_cached_channels');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ensureDabinChannelFirst(parsed);
        }
      }
    } catch (e) {}
  } else {
    // Version upgrade: clean purge of old stale mock channels
    try {
      localStorage.removeItem('nndd_cached_channels');
      localStorage.removeItem('nndd_server_imported');
      localStorage.removeItem('nndd_server_channels_count');
      localStorage.removeItem('nndd_last_channel_id');
      localStorage.setItem('nndd_playlist_version', CURRENT_PLAYLIST_VERSION);
    } catch(e) {}
  }

  const safeFallback = ensureDabinChannelFirst(fallbackChannels);
  if (Array.isArray(safeFallback) && safeFallback.length > 0) {
    await savePersistentChannels(safeFallback, true);
  }

  return safeFallback;
}

/**
 * High-Level: Save VOD Movies or Series persistently
 */
export async function savePersistentVod(type, items) {
  const key = type === 'series' ? 'nndd_vod_series_full' : 'nndd_vod_movies_full';
  await setDbItem(key, items);

  // Save small subset in localStorage for instant display
  try {
    const subsetKey = type === 'series' ? 'nndd_cached_vod_series' : 'nndd_cached_vod_movies';
    localStorage.setItem(subsetKey, JSON.stringify(items.slice(0, 100)));
  } catch(e) {}
}

/**
 * High-Level: Load VOD Movies or Series persistently
 */
export async function loadPersistentVod(type, fallbackItems = []) {
  const key = type === 'series' ? 'nndd_vod_series_full' : 'nndd_vod_movies_full';
  const dbItems = await getDbItem(key);
  if (Array.isArray(dbItems) && dbItems.length > 0) {
    return dbItems;
  }

  try {
    const subsetKey = type === 'series' ? 'nndd_cached_vod_series' : 'nndd_cached_vod_movies';
    const cached = localStorage.getItem(subsetKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch(e) {}

  return fallbackItems;
}
