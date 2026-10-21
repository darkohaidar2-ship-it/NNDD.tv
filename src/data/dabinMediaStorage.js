/**
 * DABIN.Tv Media Storage Engine (IndexedDB)
 * 
 * Stores uploaded video files, audio, and large images persistently 
 * without hitting localStorage's 5MB quota.
 */

const DB_NAME = 'dabin_tv_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save a File or Blob with a unique key
 */
export async function saveMediaBlob(id, blobOrFile, metadata = {}) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        id,
        blob: blobOrFile,
        name: blobOrFile.name || metadata.name || 'uploaded_media',
        type: blobOrFile.type || metadata.type || 'video/mp4',
        size: blobOrFile.size || 0,
        createdAt: Date.now()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[DabinMediaStorage] Error saving blob:', err);
    return null;
  }
}

/**
 * Retrieve a stored File or Blob by ID
 */
export async function getMediaBlob(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[DabinMediaStorage] Error getting blob:', err);
    return null;
  }
}

/**
 * Delete a stored File or Blob
 */
export async function deleteMediaBlob(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[DabinMediaStorage] Error deleting blob:', err);
    return false;
  }
}
