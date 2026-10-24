import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ylttlgklfdyhmqwblaex.supabase.co';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdHRsZ2tsZmR5aG1xd2JsYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTg4NzcsImV4cCI6MjA5OTI3NDg3N30.U94o6uCMbvnZhlQpsvPBMnl1MP9591kV4XkaidAeaJs';

export const HARDCODED_UPSTREAM_SERVER = 'http://line.liondnscloud.ru:80';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } }
});

// Set Zero-Cache Headers for complete freshness (No Stale Caching)
export function setZeroCacheHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

// Normalize MAC Address to standard uppercase format (e.g. 00:1A:79:XX:XX:XX or DA:B1:24:XX:XX:XX)
export function normalizeMac(mac = '') {
  if (!mac) return '';
  const clean = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length === 12) {
    return clean.match(/.{1,2}/g).join(':');
  }
  return mac.trim().toUpperCase();
}

/**
 * FNV-1a with Murmur3 avalanche mixer to convert string to 3 hexadecimal bytes (XX:XX:XX)
 */
export function hashStringTo3Bytes(str) {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  const b1 = (h1 >>> 16) & 0xff;
  const b2 = (h1 >>> 8) & 0xff;
  const b3 = h1 & 0xff;

  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `${toHex(b1)}:${toHex(b2)}:${toHex(b3)}`;
}

/**
 * Extract real client IP from incoming request headers
 */
export function getClientIp(req) {
  if (!req) return '127.0.0.1';
  const xForwarded = req.headers ? (req.headers['x-forwarded-for'] || req.headers['x-real-ip']) : '';
  const ipRaw = xForwarded ? xForwarded.split(',')[0].trim() : (req.socket?.remoteAddress || '127.0.0.1');
  return ipRaw.replace(/^::ffff:/, '').trim();
}

/**
 * Deterministically bind public IP to MAG MAC Address (00:1A:79:XX:XX:XX)
 * Guarantees that app uninstalls & reinstalls produce the exact same MAC on the same network IP!
 */
export function getDeterministicMacForIp(ip = '', salt = 'KOBIN_IP_MAC_BIND') {
  const cleanIp = (ip || '127.0.0.1').trim();
  const suffix = hashStringTo3Bytes(`${salt}_${cleanIp}`);
  return `00:1A:79:${suffix}`;
}

// In-Memory fallback store for devices when Supabase table is not yet created
const memoryDevices = new Map();

// Persistent Cloud Store for zero-config multi-device sync across all networks
const CLOUD_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a16ddeceb97bcb';

export async function fetchCloudDevices() {
  try {
    const res = await fetch(CLOUD_STORE_URL, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data?.devices)) {
        return json.data.devices.filter(d => d && typeof d === 'object' && d.mac_address);
      }
    }
  } catch (e) {
    console.warn('[CloudStore] Fetch error:', e.message);
  }
  return [];
}

export async function saveCloudDevices(devices) {
  try {
    await fetch(CLOUD_STORE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'DABIN_DEVICES_STORE',
        data: { devices: devices || [] }
      })
    });
  } catch (e) {
    console.warn('[CloudStore] Save error:', e.message);
  }
}

// Database Access Layer with graceful fallback
export async function getDeviceByMac(mac) {
  const normMac = normalizeMac(mac);
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('mac_address', normMac)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('[DB] Supabase query fallback:', err.message);
  }

  // Fallback to Cloud Store
  try {
    const cloudList = await fetchCloudDevices();
    const found = cloudList.find(d => normalizeMac(d.mac_address) === normMac);
    if (found) return found;
  } catch (e) {}

  return memoryDevices.get(normMac) || null;
}

export async function getDeviceByIp(ip) {
  if (!ip) return null;
  const cleanIp = ip.replace(/^::ffff:/, '').trim();

  // 1. Supabase check
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('ip_address', cleanIp)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {}

  // 2. Cloud Store check
  try {
    const cloudList = await fetchCloudDevices();
    const found = cloudList.find(d => (d.ip_address || '').trim() === cleanIp);
    if (found) return found;
  } catch (e) {}

  // 3. In-memory check
  for (const dev of memoryDevices.values()) {
    if ((dev.ip_address || '').trim() === cleanIp) {
      return dev;
    }
  }

  return null;
}

export async function getAllDevices() {
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('last_active', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {}

  const cloudList = await fetchCloudDevices();
  if (Array.isArray(cloudList) && cloudList.length > 0) {
    return cloudList;
  }

  return Array.from(memoryDevices.values());
}

export async function upsertDevice(deviceData) {
  const normMac = normalizeMac(deviceData.mac_address);
  const existingMem = memoryDevices.get(normMac) || {};
  
  // Also check existing in Cloud Store
  let existingCloud = null;
  let cloudDevices = [];
  try {
    cloudDevices = await fetchCloudDevices();
    existingCloud = cloudDevices.find(d => normalizeMac(d.mac_address) === normMac);
  } catch (e) {}

  const base = existingCloud || existingMem || {};
  const payload = {
    ...base,
    ...deviceData,
    mac_address: normMac,
    device_key: deviceData.device_key || base.device_key || Math.floor(1000 + Math.random() * 9000).toString(),
    // Preserve existing status if deviceData didn't explicitly override it
    status: deviceData.status || base.status || 'pending_activation',
    server_url: deviceData.server_url || base.server_url || 'http://line.liondnscloud.ru:80',
    xtream_user: deviceData.xtream_user !== undefined ? deviceData.xtream_user : (base.xtream_user || ''),
    xtream_pass: deviceData.xtream_pass !== undefined ? deviceData.xtream_pass : (base.xtream_pass || ''),
    updated_at: new Date().toISOString()
  };

  let saved = payload;

  try {
    const { data, error } = await supabase
      .from('devices')
      .upsert(payload, { onConflict: 'mac_address' })
      .select()
      .maybeSingle();

    if (!error && data) {
      saved = data;
    }
  } catch (err) {
    console.warn('[DB] Supabase upsert fallback:', err.message);
  }

  // Update memory store
  const merged = { ...base, ...saved };
  memoryDevices.set(normMac, merged);

  // Sync to Cloud Store
  try {
    const idx = cloudDevices.findIndex(d => normalizeMac(d.mac_address) === normMac);
    if (idx >= 0) {
      cloudDevices[idx] = { ...cloudDevices[idx], ...merged };
    } else {
      cloudDevices.unshift(merged);
    }
    await saveCloudDevices(cloudDevices);
  } catch (e) {}

  return merged;
}

export async function deleteDeviceByMac(mac) {
  const normMac = normalizeMac(mac);
  try {
    await supabase.from('devices').delete().eq('mac_address', normMac);
  } catch (e) {}

  memoryDevices.delete(normMac);

  try {
    const cloudDevices = await fetchCloudDevices();
    const filtered = cloudDevices.filter(d => normalizeMac(d.mac_address) !== normMac);
    await saveCloudDevices(filtered);
  } catch (e) {}

  return true;
}

export async function wipeAllDevicesFromDb() {
  try {
    await supabase.from('devices').delete().neq('mac_address', 'NONE');
  } catch (e) {}

  memoryDevices.clear();
  await saveCloudDevices([]);
  return true;
}

export async function updateDeviceOnlineStatus(mac, isOnline = true) {
  const normMac = normalizeMac(mac);
  const now = new Date().toISOString();
  try {
    await supabase
      .from('devices')
      .update({ is_online: isOnline, last_active: now })
      .eq('mac_address', normMac);
  } catch (err) {}

  const d = memoryDevices.get(normMac);
  if (d) {
    d.is_online = isOnline;
    d.last_active = now;
  }
}

// Live Ping Upstream LionOTT Server player_api.php
export async function pingLionOtt(username, password, serverUrl = HARDCODED_UPSTREAM_SERVER) {
  if (!username || !password) {
    return { success: false, error: 'Missing username or password' };
  }

  const cleanHost = (serverUrl || HARDCODED_UPSTREAM_SERVER).replace(/\/+$/, '');
  const apiUrl = `${cleanHost}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Linux; Android 12)',
        'Cache-Control': 'no-cache'
      }
    });

    clearTimeout(timeout);
    if (!res.ok) {
      return { success: false, status: res.status, error: `Upstream HTTP ${res.status}` };
    }

    const json = await res.json();
    const userInfo = json.user_info || {};
    const serverInfo = json.server_info || {};

    const isAuth = userInfo.auth === 1;
    const isStatusActive = (userInfo.status || '').toLowerCase() === 'active';
    const expTimestamp = parseInt(userInfo.exp_date, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    const isExpired = !isNaN(expTimestamp) && expTimestamp > 0 && expTimestamp < nowSec;

    return {
      success: isAuth,
      isAuth,
      isStatusActive,
      isExpired,
      status: isExpired ? 'Expired' : userInfo.status || (isAuth ? 'Active' : 'Disabled'),
      expDate: expTimestamp,
      expDateFormatted: expTimestamp ? new Date(expTimestamp * 1000).toLocaleString('en-GB') : 'Unlimited',
      activeConnections: parseInt(userInfo.active_cons || '0', 10),
      maxConnections: parseInt(userInfo.max_connections || '1', 10),
      serverUrl: serverInfo.url || cleanHost,
      raw: json
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =========================================================================
// BOUQUET BUILDER: Category Overrides, Virtual Bouquets & Channel Overrides
// =========================================================================

// In-Memory Fallback Stores
const memoryCategoryOverrides = new Map([
  ['live_818', {
    id: 'seed-override-818',
    category_type: 'live',
    upstream_category_id: '818',
    original_name: '[KU] KURDISTAN',
    custom_name: 'کەناڵە کوردییەکان (Kurdish)',
    is_visible: true,
    sort_order: 1
  }],
  ['live_1164', {
    id: 'seed-override-1164',
    category_type: 'live',
    upstream_category_id: '1164',
    original_name: '[AR] BEIN SPORTS',
    custom_name: 'بین سپۆرت (beIN Sports)',
    is_visible: true,
    sort_order: 2
  }],
  ['live_1488', {
    id: 'seed-override-1488',
    category_type: 'live',
    upstream_category_id: '1488',
    original_name: '[AR] BEIN SPORTS AFC',
    custom_name: 'بین سپۆرت ئاسیا (beIN AFC)',
    is_visible: true,
    sort_order: 3
  }],
  ['live_1478', {
    id: 'seed-override-1478',
    category_type: 'live',
    upstream_category_id: '1478',
    original_name: '[AR] BEIN SPORTS G 8K',
    custom_name: 'وەرزشی بەرزترین کوالێتی (8K Sports)',
    is_visible: true,
    sort_order: 4
  }],
  ['live_1577', {
    id: 'seed-override-1577',
    category_type: 'live',
    upstream_category_id: '1577',
    original_name: '[AR] DAZN PPV',
    custom_name: 'دازن و مۆبایلی PPV',
    is_visible: true,
    sort_order: 5
  }]
]);

const memoryCustomCategories = new Map([
  ['custom-vip', {
    id: 'custom-vip',
    category_type: 'live',
    name: 'DABIN VIP 👑',
    icon: '👑',
    is_visible: true,
    sort_order: 0,
    stream_ids: [682184, 673660, 588449, 588446]
  }],
  ['custom-kurd', {
    id: 'custom-kurd',
    category_type: 'live',
    name: 'کوردستان ڕاستەوخۆ ☀️',
    icon: '☀️',
    is_visible: true,
    sort_order: 1,
    stream_ids: [682184, 673660, 588449]
  }]
]);

const memoryChannelOverrides = new Map([
  ['682184', {
    id: 'override-ch-682184',
    stream_id: '682184',
    original_name: '[KU] AZHIN TV',
    custom_name: 'ئەژین تیڤی HD',
    custom_logo: '',
    is_hidden: false
  }]
]);

export async function getCategoryOverrides(categoryType = 'live') {
  try {
    const { data, error } = await supabase
      .from('category_overrides')
      .select('*')
      .eq('category_type', categoryType)
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[DB] getCategoryOverrides fallback:', err.message);
  }

  return Array.from(memoryCategoryOverrides.values()).filter(o => o.category_type === categoryType);
}

export async function upsertCategoryOverride(override) {
  const payload = {
    category_type: override.category_type || 'live',
    upstream_category_id: String(override.upstream_category_id),
    original_name: override.original_name || '',
    custom_name: override.custom_name ?? '',
    is_visible: override.is_visible !== false,
    sort_order: parseInt(override.sort_order, 10) || 100,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('category_overrides')
      .upsert(payload, { onConflict: 'category_type,upstream_category_id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      memoryCategoryOverrides.set(`${payload.category_type}_${payload.upstream_category_id}`, data);
      return data;
    }
  } catch (err) {
    console.warn('[DB] upsertCategoryOverride fallback:', err.message);
  }

  const saved = { ...payload, id: override.id || `ov-${Date.now()}` };
  memoryCategoryOverrides.set(`${payload.category_type}_${payload.upstream_category_id}`, saved);
  return saved;
}

export async function getCustomCategories(categoryType = 'live') {
  try {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .eq('category_type', categoryType)
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[DB] getCustomCategories fallback:', err.message);
  }

  return Array.from(memoryCustomCategories.values()).filter(b => b.category_type === categoryType);
}

export async function upsertCustomCategory(bouquet) {
  const payload = {
    category_type: bouquet.category_type || 'live',
    name: (bouquet.name || '').trim(),
    icon: bouquet.icon || '📺',
    is_visible: bouquet.is_visible !== false,
    sort_order: parseInt(bouquet.sort_order, 10) || 10,
    stream_ids: Array.isArray(bouquet.stream_ids) ? bouquet.stream_ids : [],
    updated_at: new Date().toISOString()
  };

  if (bouquet.id && !bouquet.id.startsWith('custom-')) {
    payload.id = bouquet.id;
  }

  try {
    const { data, error } = await supabase
      .from('custom_categories')
      .upsert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      memoryCustomCategories.set(data.id, data);
      return data;
    }
  } catch (err) {
    console.warn('[DB] upsertCustomCategory fallback:', err.message);
  }

  const saved = { ...payload, id: bouquet.id || `custom-${Date.now()}` };
  memoryCustomCategories.set(saved.id, saved);
  return saved;
}

export async function deleteCustomCategory(id) {
  try {
    await supabase.from('custom_categories').delete().eq('id', id);
  } catch (err) {}
  memoryCustomCategories.delete(id);
  return true;
}

export async function getChannelOverrides() {
  try {
    const { data, error } = await supabase
      .from('channel_overrides')
      .select('*');

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[DB] getChannelOverrides fallback:', err.message);
  }

  return Array.from(memoryChannelOverrides.values());
}

export async function upsertChannelOverride(override) {
  const payload = {
    stream_id: String(override.stream_id),
    original_name: override.original_name || '',
    custom_name: override.custom_name ?? '',
    custom_logo: override.custom_logo ?? '',
    is_hidden: override.is_hidden === true,
    custom_category_id: override.custom_category_id || '',
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('channel_overrides')
      .upsert(payload, { onConflict: 'stream_id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      memoryChannelOverrides.set(payload.stream_id, data);
      return data;
    }
  } catch (err) {
    console.warn('[DB] upsertChannelOverride fallback:', err.message);
  }

  const saved = { ...payload, id: override.id || `ch-ov-${Date.now()}` };
  memoryChannelOverrides.set(payload.stream_id, saved);
  return saved;
}

// Dispatch Telegram Alert to Admin
export async function sendTelegramAlert(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('[Telegram Alert Mock]:', text);
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });
    return res.ok;
  } catch (err) {
    console.warn('[Telegram Alert Error]:', err.message);
    return false;
  }
}


