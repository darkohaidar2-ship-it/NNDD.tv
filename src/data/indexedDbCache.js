/**
 * IndexedDB Cache for KOBIN TV (kobin_tv_cache_v1)
 * Eliminates LocalStorage 5MB limits and guarantees immediate (<50ms) hydration on page refresh,
 * preventing channel count from resetting to 0.
 */

const DB_NAME = 'kobin_tv_cache_v1';
const DB_VERSION = 1;
const STORE_NAME = 'media_cache';

let dbInstance = null;

export function openKobinCacheDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve) => {
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

      request.onerror = () => {
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}

export async function setCachedData(key, value) {
  try {
    const db = await openKobinCacheDb();
    if (!db) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {}
      return;
    }

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {}
  }
}

export async function getCachedData(key) {
  try {
    const db = await openKobinCacheDb();
    if (!db) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        return null;
      }
    }

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result !== undefined) {
          resolve(req.result);
        } else {
          try {
            const fallback = localStorage.getItem(key);
            resolve(fallback ? JSON.parse(fallback) : null);
          } catch (e) {
            resolve(null);
          }
        }
      };
      req.onerror = () => {
        try {
          const fallback = localStorage.getItem(key);
          resolve(fallback ? JSON.parse(fallback) : null);
        } catch (e) {
          resolve(null);
        }
      };
    });
  } catch (e) {
    try {
      const fallback = localStorage.getItem(key);
      return fallback ? JSON.parse(fallback) : null;
    } catch (err) {
      return null;
    }
  }
}
