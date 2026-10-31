/**
 * KOBIN TV — EPG (Electronic Program Guide) Service
 * Fetches XMLTV EPG data from LionOTT server and caches in IndexedDB.
 * Shows: current program, progress bar, next program — per channel.
 */

import { universalFetch } from './dabinRealtimeService';
import { getActiveXtreamServer } from './serverManager';
import { resolveXtreamHost } from './serverImporter';

const EPG_DB_NAME   = 'kobin_epg_db';
const EPG_DB_VER    = 1;
const EPG_STORE     = 'epg_programs';
const EPG_META_STORE = 'epg_meta';
const EPG_CACHE_TTL  = 2 * 60 * 60 * 1000; // 2 hours

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function openEpgDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(EPG_DB_NAME, EPG_DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(EPG_STORE)) {
        db.createObjectStore(EPG_STORE, { keyPath: 'channelId' });
      }
      if (!db.objectStoreNames.contains(EPG_META_STORE)) {
        db.createObjectStore(EPG_META_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbGet(storeName, key) {
  const db = await openEpgDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbPut(storeName, value) {
  const db = await openEpgDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbGetAll(storeName) {
  const db = await openEpgDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
}

// ─── In-memory cache (O(1) lookup) ───────────────────────────────────────────

/** Map<channelId, { programs: EPGProgram[], fetchedAt: number }> */
const _memCache = new Map();

/** Map<epgChannelId, channelId> — built during parse */
const _epgIdToChannelId = new Map();

// ─── XMLTV parser ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} EPGProgram
 * @property {string} title
 * @property {string} desc
 * @property {number} start  — Unix ms
 * @property {number} stop   — Unix ms
 * @property {string} channelId
 */

function parseXmltvDate(str = '') {
  // Format: 20260101120000 +0300
  const m = str.trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/);
  if (!m) return 0;
  const [, yr, mo, dy, hr, mn, sc, tz = '+0000'] = m;
  const sign  = tz[0] === '-' ? -1 : 1;
  const tzH   = parseInt(tz.slice(1, 3), 10);
  const tzM   = parseInt(tz.slice(3, 5), 10);
  const utcMs = Date.UTC(+yr, +mo - 1, +dy, +hr, +mn, +sc);
  return utcMs - sign * (tzH * 60 + tzM) * 60000;
}

function parseXmltvText(xml = '') {
  /** @type {Map<string, EPGProgram[]>} */
  const result = new Map();

  // Parse channel id → display-name
  const chRegex = /<channel id="([^"]+)"[^>]*>([\s\S]*?)<\/channel>/g;
  let cm;
  while ((cm = chRegex.exec(xml)) !== null) {
    const id = cm[1];
    // Just register; mapping happens at match time
    _epgIdToChannelId.set(id.toLowerCase(), id);
  }

  // Parse programmes
  const pgRegex = /<programme\s[^>]*start="([^"]+)"[^>]*stop="([^"]+)"[^>]*channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/g;
  let pm;
  while ((pm = pgRegex.exec(xml)) !== null) {
    const start = parseXmltvDate(pm[1]);
    const stop  = parseXmltvDate(pm[2]);
    const chId  = pm[3];
    const body  = pm[4];

    const titleM = body.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const descM  = body.match(/<desc[^>]*>([\s\S]*?)<\/desc>/);

    const prog = {
      channelId : chId,
      title     : (titleM?.[1] || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
      desc      : (descM?.[1]  || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
      start,
      stop,
    };

    if (!result.has(chId)) result.set(chId, []);
    result.get(chId).push(prog);
  }

  return result;
}

// ─── Normalise channel name → EPG channel id (fuzzy match) ───────────────────

function normaliseStr(s = '') {
  return s.toLowerCase()
    .replace(/[\s_\-\.]+/g, '')
    .replace(/hd$/i, '')
    .replace(/fhd$/i, '')
    .replace(/sd$/i, '')
    .replace(/4k$/i, '')
    .replace(/\|.*$/, '');
}

let _epgNormMap = null; // Map<normalised, epgChannelId>

function buildNormMap(epgMap) {
  _epgNormMap = new Map();
  for (const [id] of epgMap) {
    _epgNormMap.set(normaliseStr(id), id);
  }
}

function findEpgChannelId(channelName = '', streamEpgId = '') {
  if (!_epgNormMap) return null;

  // 1. Exact stream_epg_id match (from M3U #EXTINF tvg-id)
  if (streamEpgId) {
    const norm = normaliseStr(streamEpgId);
    if (_epgNormMap.has(norm)) return _epgNormMap.get(norm);
  }

  // 2. Fuzzy name match
  const norm = normaliseStr(channelName);
  if (_epgNormMap.has(norm)) return _epgNormMap.get(norm);

  // 3. Partial prefix match (first 8 chars)
  if (norm.length >= 4) {
    for (const [key, id] of _epgNormMap) {
      if (key.startsWith(norm.slice(0, 8)) || norm.startsWith(key.slice(0, 8))) return id;
    }
  }

  return null;
}

// ─── Main fetch & store ───────────────────────────────────────────────────────

let _fetchPromise = null;

async function fetchAndStoreEpg(server) {
  const baseUrl = resolveXtreamHost(server.serverUrl || server.url || '');
  const url     = `${baseUrl}/xmltv.php?username=${server.username}&password=${server.password}`;

  let xml = '';
  try {
    const res = await universalFetch(url, { method: 'GET' });
    xml = typeof res === 'string' ? res : (res.data || res.text || res.body || '');
    if (typeof xml !== 'string') xml = JSON.stringify(xml);
  } catch (e) {
    console.warn('[EPG] fetch failed:', e.message);
    return null;
  }

  if (!xml || xml.length < 200) {
    console.warn('[EPG] EPG response too short or empty');
    return null;
  }

  const epgMap = parseXmltvText(xml);
  buildNormMap(epgMap);

  const now = Date.now();

  // Save to IndexedDB per-channel
  for (const [chId, programs] of epgMap) {
    await dbPut(EPG_STORE, { channelId: chId, programs, fetchedAt: now });
    _memCache.set(chId, { programs, fetchedAt: now });
  }

  // Save meta
  await dbPut(EPG_META_STORE, { key: 'last_fetch', value: now, channelCount: epgMap.size });

  console.log(`[EPG] ✅ Stored ${epgMap.size} EPG channels`);
  return epgMap;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise EPG: load from cache or fetch from server.
 * Call once on app startup (non-blocking).
 */
export async function initEpg() {
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      // Check cache freshness
      const meta = await dbGet(EPG_META_STORE, 'last_fetch');
      const age  = meta ? Date.now() - (meta.value || 0) : Infinity;

      if (age < EPG_CACHE_TTL) {
        // Load from IndexedDB into memory
        const rows = await dbGetAll(EPG_STORE);
        const epgMap = new Map();
        for (const row of rows) {
          _memCache.set(row.channelId, { programs: row.programs, fetchedAt: row.fetchedAt });
          epgMap.set(row.channelId, row.programs);
        }
        buildNormMap(epgMap);
        console.log(`[EPG] Loaded ${rows.length} channels from IndexedDB cache`);
        return;
      }

      // Fetch fresh
      const server = getActiveXtreamServer();
      if (!server) {
        console.warn('[EPG] No active Xtream server found');
        return;
      }

      await fetchAndStoreEpg(server);
    } catch (e) {
      console.error('[EPG] initEpg error:', e);
    } finally {
      _fetchPromise = null;
    }
  })();

  return _fetchPromise;
}

/**
 * Force-refresh EPG from server regardless of cache.
 */
export async function refreshEpg() {
  _fetchPromise = null;
  const server = getActiveXtreamServer();
  if (!server) return null;
  return fetchAndStoreEpg(server);
}

/**
 * Get current + next program for a channel.
 * @param {Object} channel  — must have .name (or .stream_display_name) and optionally .epg_channel_id
 * @returns {{ current: EPGProgram|null, next: EPGProgram|null, progress: number }}
 */
export function getChannelEpg(channel) {
  if (!channel) return { current: null, next: null, progress: 0 };

  const name      = channel.name || channel.stream_display_name || channel.nameKu || '';
  const epgId     = channel.epg_channel_id || channel.tvg_id || channel.tvgId || '';
  const matchedId = findEpgChannelId(name, epgId);
  if (!matchedId) return { current: null, next: null, progress: 0 };

  const cached = _memCache.get(matchedId);
  if (!cached) return { current: null, next: null, progress: 0 };

  const now = Date.now();
  const programs = cached.programs;

  let current = null;
  let next    = null;

  for (let i = 0; i < programs.length; i++) {
    const p = programs[i];
    if (p.start <= now && now < p.stop) {
      current = p;
      next    = programs[i + 1] || null;
      break;
    }
  }

  // If not found, check upcoming
  if (!current) {
    const upcoming = programs.filter(p => p.start > now).sort((a, b) => a.start - b.start);
    next = upcoming[0] || null;
  }

  const progress = current
    ? Math.min(100, Math.max(0, ((now - current.start) / (current.stop - current.start)) * 100))
    : 0;

  return { current, next, progress };
}

/**
 * Format time as HH:MM in local timezone.
 */
export function formatEpgTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Check if EPG data is loaded.
 */
export function isEpgLoaded() {
  return _memCache.size > 0;
}

/**
 * Get total number of EPG channels loaded.
 */
export function getEpgChannelCount() {
  return _memCache.size;
}
