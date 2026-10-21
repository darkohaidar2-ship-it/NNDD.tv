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
export const CURRENT_PLAYLIST_VERSION = '9.3.0-clean-35';

export async function savePersistentChannels(channels, skipNotify = false) {
  if (!Array.isArray(channels)) return;

  // 1. Save full array to IndexedDB (no 5MB size limit)
  await setDbItem('nndd_channels_full', channels);

  // 2. Mark clean state in localStorage
  try {
    localStorage.setItem('nndd_server_channels_count', String(channels.length));
    localStorage.setItem('nndd_server_imported', 'false');
    localStorage.setItem('nndd_channels_last_updated', String(Date.now()));
    localStorage.setItem('nndd_playlist_version', CURRENT_PLAYLIST_VERSION);
  } catch(e) {}

  // 3. Keep safe subset in localStorage
  try {
    localStorage.setItem('nndd_cached_channels', JSON.stringify(channels.slice(0, 300)));
  } catch (e) {}

  // 4. Notify app listeners with the channels array
  if (!skipNotify && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nndd_channels_updated', {
      detail: channels
    }));
  }
}

/**
 * High-Level: Load Channels persistently
 */
export async function loadPersistentChannels(fallbackChannels = []) {
  const hasStaleExternalLinks = (list) => {
    if (!Array.isArray(list) || list.length === 0) return true;
    if (list.length > 50) return true; // old 180 channels
    return list.some(c => 
      c.url?.includes('elg-26.com') || 
      c.url?.includes('liondnscloud.ru') || 
      c.serverId === 'srv-elg26' ||
      c.serverId === 'srv-lion4k'
    );
  };

  const storedVersion = typeof localStorage !== 'undefined' ? localStorage.getItem('nndd_playlist_version') : null;
  if (storedVersion === CURRENT_PLAYLIST_VERSION) {
    const dbChannels = await getDbItem('nndd_channels_full');
    if (Array.isArray(dbChannels) && dbChannels.length === fallbackChannels.length && !hasStaleExternalLinks(dbChannels)) {
      return dbChannels;
    }

    try {
      const cached = localStorage.getItem('nndd_cached_channels');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === fallbackChannels.length && !hasStaleExternalLinks(parsed)) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  // Force clean wipe of any stale cache
  try {
    localStorage.removeItem('nndd_cached_channels');
    localStorage.removeItem('nndd_server_imported');
    localStorage.removeItem('nndd_server_channels_count');
    localStorage.removeItem('nndd_last_channel_id');
    localStorage.setItem('nndd_playlist_version', CURRENT_PLAYLIST_VERSION);
  } catch(e) {}

  if (Array.isArray(fallbackChannels) && fallbackChannels.length > 0) {
    await savePersistentChannels(fallbackChannels, false);
  }

  return fallbackChannels;
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
