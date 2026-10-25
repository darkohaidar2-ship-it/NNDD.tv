/**
 * 4K Custom Background Manager with IndexedDB Persistence
 * 
 * Stores high-resolution 4K images and looping videos as binary Blobs in IndexedDB
 * (bypassing localStorage 5MB quota limits) with zero memory leaks.
 */

const DB_NAME = 'kobin_custom_backgrounds_db';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';
const BG_KEY = 'active_background';

function openBackgroundDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('[BackgroundDB] Error opening database:', request.error);
      resolve(null);
    };
  });
}

/**
 * Save custom background (Blob or URL)
 * @param {Object} data { type: 'image'|'video', blob: Blob|null, url: string|null }
 */
export async function saveCustomBackground({ type = 'image', blob = null, url = null }) {
  try {
    const db = await openBackgroundDb();
    if (!db) return false;

    const record = {
      id: BG_KEY,
      type,
      blob,
      url,
      updatedAt: Date.now()
    };

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kobin_custom_background_updated', { detail: record }));
        }
        resolve(true);
      };
      req.onerror = () => {
        console.warn('[BackgroundDB] Failed to save background:', req.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[BackgroundDB] saveCustomBackground error:', err);
    return false;
  }
}

/**
 * Get active custom background from IndexedDB
 * @returns {Promise<{ type: 'image'|'video', blob: Blob|null, url: string|null } | null>}
 */
export async function getCustomBackground() {
  try {
    const db = await openBackgroundDb();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(BG_KEY);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => {
        console.warn('[BackgroundDB] Failed to get background:', req.error);
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[BackgroundDB] getCustomBackground error:', err);
    return null;
  }
}

/**
 * Clear custom background and revert to default Aurora theme
 */
export async function clearCustomBackground() {
  try {
    const db = await openBackgroundDb();
    if (!db) return false;

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(BG_KEY);

      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kobin_custom_background_updated', { detail: null }));
        }
        resolve(true);
      };
      req.onerror = () => {
        console.warn('[BackgroundDB] Failed to delete background:', req.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[BackgroundDB] clearCustomBackground error:', err);
    return false;
  }
}
