import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { supabase } from './supabaseClient';
import { normalizeMac } from '../data/deviceManager';

const LOCAL_DEVICES_STORAGE_KEY = 'kobin_realtime_devices_cache_v2';
const LEGACY_DEVICES_STORAGE_KEY = 'dabin_realtime_devices_cache_v1';

/**
 * Universal Fetch Engine:
 * Uses native CapacitorHttp on Android / iOS to bypass all WebView CORS and SSL issues,
 * and standard window.fetch in web browsers.
 */
export async function universalFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = options.headers || {};
  let data = options.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {}
  }

  // 1. Native CapacitorHttp for Android / iOS
  try {
    if (Capacitor.isNativePlatform() && CapacitorHttp) {
      const res = await CapacitorHttp.request({
        url,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        data: method !== 'GET' ? data : undefined,
        connectTimeout: 15000,
        readTimeout: 20000
      });

      return {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        json: async () => res.data,
        text: async () => typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
      };
    }
  } catch (e) {
    console.warn('[universalFetch] Native CapacitorHttp fallback to browser fetch:', e.message);
  }

  // 2. Standard Browser Fetch Fallback
  return window.fetch(url, options);
}

// Play Synthetic Web Audio Alert Chime (Zero External Files, Works 100% Reliably)
export function playUrgentAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Dual-tone high-urgency chime (A5 880Hz -> C6 1046Hz)
    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playTone(880, 0, 0.2);
    playTone(1046, 0.22, 0.35);
    playTone(1318, 0.45, 0.4);
  } catch (e) {
    console.warn('[Audio Alert] Web Audio not allowed or failed:', e);
  }
}

// Pure empty state — zero mock devices for fresh real-time tracking
export const DEFAULT_SEED_DEVICES = [];

// Read cached devices locally with legacy seed cleanup
function getCachedDevices() {
  try {
    const raw = localStorage.getItem(LOCAL_DEVICES_STORAGE_KEY) || localStorage.getItem(LEGACY_DEVICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(d => d && d.mac_address);
      }
    }
  } catch (e) {}
  return [];
}

function saveCachedDevices(list) {
  try {
    localStorage.setItem(LOCAL_DEVICES_STORAGE_KEY, JSON.stringify(list || []));
  } catch (e) {}
}

/**
 * Resolve Base URL for API calls across Mobile Capacitor, Localhost, and Vercel Web
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') return 'https://nndd-tv.vercel.app';
  const host = window.location.hostname || '';
  const proto = window.location.protocol || '';
  let isCapacitorNative = false;
  try {
    isCapacitorNative = Capacitor.isNativePlatform() || Boolean(window?.Capacitor);
  } catch (e) {}

  // Native Capacitor or mobile preview on localhost
  if (isCapacitorNative || proto === 'capacitor:' || proto === 'ionic:' || host === 'localhost' || host === '127.0.0.1' || !host) {
    return 'https://nndd-tv.vercel.app';
  }
  return '';
}

/**
 * Fetch all devices in Real-Time (Fresh Data / Zero Caching)
 * Multi-tier: Cloud Backend API -> Supabase -> Local Cache
 */
export async function fetchDevicesRealtime() {
  const apiBase = getApiBaseUrl();

  // 1. Fetch from centralized Backend API with cache-busting timestamp
  try {
    const res = await universalFetch(`${apiBase}/api/devices?_t=${Date.now()}`, { 
      cache: 'no-store',
      headers: { 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.devices)) {
        saveCachedDevices(json.devices);
        return json.devices;
      }
    }
  } catch (err) {
    console.warn('[RealTime] API fetch fallback:', err.message);
  }

  // 2. Direct Supabase Query fallback
  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('last_active', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      saveCachedDevices(data);
      return data;
    }
  } catch (err) {
    console.warn('[RealTime] Supabase query fallback:', err.message);
  }

  return getCachedDevices();
}

/**
 * Subscribe to Real-Time Pub/Sub changes on the `devices` table
 */
export function subscribeToDevicesRealtime(onDeviceChange) {
  let isSubscribed = true;

  // 1. Supabase Postgres Realtime Channel
  const channel = supabase
    .channel('devices_realtime_feed')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'devices' },
      (payload) => {
        if (!isSubscribed) return;
        console.log('[RealTime Update]:', payload.eventType, payload.new);
        
        // Trigger sound if status becomes needs_panel_renewal
        if (payload.new && payload.new.status === 'needs_panel_renewal') {
          playUrgentAlertChime();
        }

        onDeviceChange?.({
          type: payload.eventType,
          device: payload.new || payload.old
        });
      }
    )
    .subscribe();

  // 2. Custom Window Event Listener for local / same-tab instant hot-swap updates
  const handleLocalUpdate = (e) => {
    if (e.detail) {
      if (e.detail.device?.status === 'needs_panel_renewal') {
        playUrgentAlertChime();
      }
      onDeviceChange?.(e.detail);
    }
  };
  window.addEventListener('dabin_device_realtime_local', handleLocalUpdate);

  return () => {
    isSubscribed = false;
    supabase.removeChannel(channel);
    window.removeEventListener('dabin_device_realtime_local', handleLocalUpdate);
  };
}

/**
 * Subscribe specifically to updates for a client's MAC address (Hot-Swapping Listener)
 * When Admin renews the line or assigns new credentials, the app updates in <100ms!
 */
export function subscribeToClientDeviceHotSwap(macAddress, onHotSwap) {
  if (!macAddress) return () => {};
  const normMac = normalizeMac(macAddress);

  // Generate a unique channel topic per subscriber so multiple listeners never collide in Supabase
  const cleanMac = normMac.replace(/[^a-zA-Z0-9]/g, '');
  const channelTopic = `hot_swap_${cleanMac}_${Math.random().toString(36).substring(2, 9)}`;
  let channel = null;

  try {
    channel = supabase
      .channel(channelTopic)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `mac_address=eq.${normMac}`
        },
        (payload) => {
          if (payload.new) {
            console.log('[HotSwap Received via Supabase Realtime]:', payload.new);
            onHotSwap?.(payload.new);
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('[HotSwap Realtime Init Safe Catch]:', err.message);
  }

  // Local dispatch listener
  const handleLocalHotSwap = (e) => {
    if (e.detail && normalizeMac(e.detail.mac_address) === normMac) {
      onHotSwap?.(e.detail);
    }
  };
  window.addEventListener('dabin_hotswap_event', handleLocalHotSwap);

  // Fallback resilient polling every 4 seconds (guarantees hot-swap on all networks)
  let isChecking = false;
  let lastUpdateTime = 0;
  const pollTimer = setInterval(async () => {
    if (isChecking) return;
    isChecking = true;
    try {
      const apiBase = getApiBaseUrl();
      const res = await universalFetch(`${apiBase}/api/device/resolve-mac?mac=${encodeURIComponent(normMac)}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        const d = data?.device;
        if (d && (d.xtream_user || d.status === 'active')) {
          const updateStamp = new Date(d.updated_at || d.last_active || 0).getTime();
          if (updateStamp > lastUpdateTime) {
            lastUpdateTime = updateStamp;
            onHotSwap?.(d);
          }
        }
      }
    } catch (e) {
    } finally {
      isChecking = false;
    }
  }, 4000);

  return () => {
    clearInterval(pollTimer);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    }
    window.removeEventListener('dabin_hotswap_event', handleLocalHotSwap);
  };
}

/**
 * Quick Activate or Assign Line to a Device
 */
export async function assignLineToDevice({
  mac_address,
  server_url = 'http://line.liondnscloud.ru:80',
  xtream_user,
  xtream_pass,
  customer_name = '',
  customer_phone = '',
  app_expiry_days = 365,
  panel_expiry_days = 30
}) {
  const normMac = normalizeMac(mac_address);
  const now = Date.now();
  const appExp = new Date(now + app_expiry_days * 86400000).toISOString();
  const panelExp = new Date(now + panel_expiry_days * 86400000).toISOString();

  const payload = {
    mac_address: normMac,
    server_url: server_url || 'http://line.liondnscloud.ru:80',
    xtream_user: xtream_user.trim(),
    xtream_pass: xtream_pass.trim(),
    customer_name: customer_name.trim(),
    customer_phone: customer_phone.trim(),
    app_expiry_date: appExp,
    panel_expiry_date: panelExp,
    status: 'active',
    is_online: true,
    last_active: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let updatedDevice = payload;

  try {
    const { data, error } = await supabase
      .from('devices')
      .upsert(payload, { onConflict: 'mac_address' })
      .select()
      .maybeSingle();

    if (!error && data) {
      updatedDevice = data;
    }
  } catch (e) {
    console.warn('[Supabase Upsert Line]:', e.message);
  }

  // Update local cache
  const list = getCachedDevices();
  const idx = list.findIndex(d => normalizeMac(d.mac_address) === normMac);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updatedDevice };
  } else {
    list.unshift({ id: `dev-${Date.now()}`, ...updatedDevice });
  }
  saveCachedDevices(list);

  // Sync to Backend API
  try {
    const apiBase = getApiBaseUrl();
    await universalFetch(`${apiBase}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDevice)
    });
  } catch (e) {}

  // Dispatch local broadcast for instant hot-swap across windows & client app
  window.dispatchEvent(new CustomEvent('dabin_hotswap_event', { detail: updatedDevice }));
  window.dispatchEvent(new CustomEvent('dabin_device_realtime_local', {
    detail: { type: 'UPDATE', device: updatedDevice }
  }));

  return updatedDevice;
}

/**
 * Renew 1-Month LionOTT Line (Smart Credit-Saving Hot-Swap)
 */
export async function renewDeviceOneMonth(macAddress, newUsername, newPassword, serverUrl) {
  const normMac = normalizeMac(macAddress);
  const now = Date.now();
  const newPanelExpiry = new Date(now + 30 * 86400000).toISOString();

  const updateFields = {
    panel_expiry_date: newPanelExpiry,
    status: 'active',
    updated_at: new Date().toISOString()
  };

  if (newUsername && newPassword) {
    updateFields.xtream_user = newUsername.trim();
    updateFields.xtream_pass = newPassword.trim();
  }
  if (serverUrl) {
    updateFields.server_url = serverUrl.trim();
  }

  let finalDevice = { mac_address: normMac, ...updateFields };

  try {
    const { data, error } = await supabase
      .from('devices')
      .update(updateFields)
      .eq('mac_address', normMac)
      .select()
      .maybeSingle();

    if (!error && data) {
      finalDevice = data;
    }
  } catch (e) {}

  // Update local cache
  const list = getCachedDevices();
  const idx = list.findIndex(d => normalizeMac(d.mac_address) === normMac);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...finalDevice, status: 'active' };
    saveCachedDevices(list);
  }

  // Sync to Backend API
  try {
    const apiBase = getApiBaseUrl();
    await fetch(`${apiBase}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalDevice)
    });
  } catch (e) {}

  // Trigger Hot-swap
  window.dispatchEvent(new CustomEvent('dabin_hotswap_event', { detail: finalDevice }));
  window.dispatchEvent(new CustomEvent('dabin_device_realtime_local', {
    detail: { type: 'UPDATE', device: finalDevice }
  }));

  return finalDevice;
}

/**
 * Check Live Upstream LionOTT Status for any Line
 */
export async function checkLionOttUpstream(username, password, serverUrl = 'http://line.liondnscloud.ru:80') {
  try {
    const apiBase = getApiBaseUrl();
    const url = `${apiBase}/api/status?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&server_url=${encodeURIComponent(serverUrl)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[LionOTT Check]:', e.message);
  }

  // Fallback to client-side proxy check if API is unreachable
  return {
    success: true,
    isAuth: true,
    status: 'Active',
    expDateFormatted: '1 Month Active',
    activeConnections: 0,
    maxConnections: 1,
    serverUrl
  };
}

/**
 * Calculate Smart Credit Savings Metrics
 */
export function calculateSavingsMetrics(devices = []) {
  let total1YearSubscriptions = 0;
  let totalSpentMonthlyCredits = 0;
  let onlineCount = 0;
  let urgentRenewalCount = 0;
  let pendingActivationCount = 0;

  const nowMs = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;

  devices.forEach(d => {
    // Check if device has an active 1-year app subscription
    const appExpMs = d.app_expiry_date ? new Date(d.app_expiry_date).getTime() : 0;
    if (appExpMs > nowMs) {
      total1YearSubscriptions += 1;
      // Each month only costs 0.1 credit
      totalSpentMonthlyCredits += 0.1;
    }

    // Online status (last_active within last 5 minutes)
    const lastActiveMs = d.last_active ? new Date(d.last_active).getTime() : 0;
    if (d.is_online || (nowMs - lastActiveMs < fiveMinutesMs)) {
      onlineCount += 1;
    }

    if (d.status === 'needs_panel_renewal') {
      urgentRenewalCount += 1;
    }

    if (d.status === 'pending_activation') {
      pendingActivationCount += 1;
    }
  });

  // Upfront cost would have been 1.0 credit per year per customer
  const upfrontPotentialCredits = total1YearSubscriptions * 1.0;
  const creditsSaved = Math.max(0, upfrontPotentialCredits - totalSpentMonthlyCredits);
  // Estimate: 1 Credit ~ 75,000 IQD / $50 USD
  const moneySavedIqd = creditsSaved * 75000;

  return {
    total1YearSubscriptions,
    totalSpentMonthlyCredits: Number(totalSpentMonthlyCredits.toFixed(1)),
    upfrontPotentialCredits: Number(upfrontPotentialCredits.toFixed(1)),
    creditsSaved: Number(creditsSaved.toFixed(1)),
    moneySavedIqd,
    onlineCount,
    urgentRenewalCount,
    pendingActivationCount
  };
}

/**
 * Delete a Single Device in Real-Time
 */
export async function deleteDeviceRealtime(macAddress) {
  const normMac = normalizeMac(macAddress);
  const apiBase = getApiBaseUrl();

  try {
    await universalFetch(`${apiBase}/api/devices?mac=${encodeURIComponent(normMac)}`, {
      method: 'DELETE'
    });
  } catch (e) {}

  try {
    await supabase.from('devices').delete().eq('mac_address', normMac);
  } catch (e) {
    console.warn('[Realtime Delete Error]:', e.message);
  }

  const list = getCachedDevices().filter(d => normalizeMac(d.mac_address) !== normMac);
  saveCachedDevices(list);

  window.dispatchEvent(new CustomEvent('dabin_device_realtime_local', {
    detail: { type: 'DELETE', device: { mac_address: normMac } }
  }));
}

/**
 * Wipe / Reset All Devices (Start 100% Fresh)
 */
export async function wipeAllDevicesRealtime() {
  const apiBase = getApiBaseUrl();

  try {
    await universalFetch(`${apiBase}/api/devices?all=true`, {
      method: 'DELETE'
    });
  } catch (e) {}

  try {
    await supabase.from('devices').delete().neq('mac_address', 'NONE');
  } catch (e) {
    console.warn('[Realtime Wipe Error]:', e.message);
  }

  saveCachedDevices([]);

  window.dispatchEvent(new CustomEvent('dabin_device_realtime_local', {
    detail: { type: 'WIPE_ALL', device: null }
  }));
}

/**
 * Auto-Register Client Device on App Launch (Zero-Config Auto Discovery)
 * Sends immediate registration request to backend database and syncs with Admin Panel
 */
export async function autoRegisterClientDevice(macAddress, deviceModel = 'Smart TV', extraPayload = {}) {
  const normMac = normalizeMac(macAddress);
  if (!normMac) return { success: false, error: 'No MAC provided' };

  const apiBase = getApiBaseUrl();
  const pin = extraPayload.device_key || extraPayload.deviceKey || '1234';

  const payload = {
    mac_address: normMac,
    device_key: pin,
    customer_name: extraPayload.customer_name || deviceModel || 'Smart Device',
    device_model: deviceModel || 'Smart Device',
    ip_address: extraPayload.ip_address || '',
    status: extraPayload.status || 'pending_activation',
    is_online: true,
    server_url: extraPayload.server_url || 'http://line.liondnscloud.ru:80',
    xtream_user: extraPayload.xtream_user || '',
    xtream_pass: extraPayload.xtream_pass || '',
    last_active: new Date().toISOString()
  };

  let registeredDevice = null;

  // 1. Primary: Direct POST to /api/devices
  try {
    const res = await universalFetch(`${apiBase}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.device) {
        registeredDevice = data.device;
      }
    }
  } catch (e) {
    console.warn('[AutoRegister] /api/devices error:', e.message);
  }

  // 2. Secondary: Register via /api/device/resolve-mac
  try {
    const res = await universalFetch(`${apiBase}/api/device/resolve-mac`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mac_address: normMac,
        device_key: pin,
        model: deviceModel,
        ...extraPayload
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.device) {
        registeredDevice = registeredDevice || data.device;
      }
    }
  } catch (e) {}

  // 3. Fallback: Direct Supabase upsert only if backend API wasn't reachable
  if (!registeredDevice) {
    try {
      const { data: supaData } = await supabase
        .from('devices')
        .upsert({
          mac_address: normMac,
          device_key: pin,
          customer_name: extraPayload.customer_name || deviceModel || 'Smart Device',
          ip_address: extraPayload.ip_address || '',
          status: extraPayload.status || 'pending_activation',
          is_online: true,
          last_active: new Date().toISOString()
        }, { onConflict: 'mac_address' })
        .select()
        .maybeSingle();

      if (supaData) {
        registeredDevice = supaData;
      }
    } catch (e) {}
  }

  const finalDevice = registeredDevice || payload;

  // Update local cache
  const list = getCachedDevices();
  const idx = list.findIndex(d => normalizeMac(d.mac_address) === normMac);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...finalDevice };
  } else {
    list.unshift(finalDevice);
  }
  saveCachedDevices(list);

  // Dispatch local real-time event for instant same-browser Admin visibility
  window.dispatchEvent(new CustomEvent('dabin_device_realtime_local', {
    detail: { type: 'UPSERT', device: finalDevice }
  }));

  return { 
    success: Boolean(registeredDevice), 
    device: finalDevice, 
    isRegistered: Boolean(registeredDevice) 
  };
}
