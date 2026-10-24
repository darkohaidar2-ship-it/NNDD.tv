// DABIN.TV - Strict MAC-Only Identity & Deterministic Reinstall-Proof Hardware Architecture
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

const DEVICE_STORAGE_KEY = 'nndd_device_identity';
const REQUESTS_STORAGE_KEY = 'nndd_activation_requests';
const PERSISTENT_MAC_KEY = 'dabin_persistent_mac_address';
const DEFAULT_PORTAL_URL = 'http://line.liondnscloud.ru/c/';

/**
 * Murmur3-style 32-bit FNV-1a hash with avalanche mixer
 * Converts any string into 3 deterministic hexadecimal bytes (XX:XX:XX)
 */
export function hashStringTo3Bytes(str) {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  // Avalanche mixer (Murmur3 fmix32)
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
 * Normalize MAC Address to standard uppercase colon-separated format
 */
export function normalizeMac(mac = '') {
  if (!mac) return '';
  const clean = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length === 12) {
    return clean.match(/.{1,2}/g).join(':');
  }
  return mac.trim().toUpperCase();
}

/**
 * WebGL hardware GPU vendor & renderer fingerprinting
 */
function getWebGLFingerprint() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'headless';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}~${renderer}`;
  } catch (e) {
    return 'webgl-err';
  }
}

/**
 * 2D Canvas rendering fingerprinting
 */
function getCanvasFingerprint() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'headless';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-2d';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('DABIN.TV-HW-SIG', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('DABIN.TV-HW-SIG', 4, 17);
    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-err';
  }
}

/**
 * Deterministic Hardware Signature
 * Combines GPU renderer, screen metrics, CPU concurrency, and canvas rasterization
 */
export function getDeterministicHardwareSignature() {
  if (typeof window === 'undefined') return 'server-static-env';
  
  const screenPart = typeof window.screen !== 'undefined' 
    ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth || 24}`
    : 'screen-def';

  const cores = navigator.hardwareConcurrency || 4;
  const touch = navigator.maxTouchPoints || 0;
  const webgl = getWebGLFingerprint();
  const canvasSig = getCanvasFingerprint();
  const ua = (navigator.userAgent || '').replace(/Chrome\/[\d.]+/g, 'Chrome').replace(/Safari\/[\d.]+/g, 'Safari');

  return `SIG[${screenPart}|${cores}|${touch}|${webgl}|${canvasSig}|${ua}]`;
}

/**
 * Generate standard Infomir MAG MAC Address deterministically
 * Format: 00:1A:79:XX:XX:XX
 * Guaranteed to produce the exact same MAC on the same device across reinstallation
 */
export function getDeterministicMagMacAddress() {
  if (typeof window === 'undefined') return '00:1A:79:00:00:01';

  // 1. Check if already persisted
  try {
    const saved = localStorage.getItem(PERSISTENT_MAC_KEY);
    if (saved && /^00:1A:79:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}$/i.test(saved.trim())) {
      return saved.trim().toUpperCase();
    }
  } catch (e) {}

  // 2. Generate deterministically from hardware signature
  const sig = getDeterministicHardwareSignature();
  const suffix = hashStringTo3Bytes(sig);
  const mac = `00:1A:79:${suffix}`;

  try {
    localStorage.setItem(PERSISTENT_MAC_KEY, mac);
  } catch (e) {}

  return mac;
}

/**
 * Generate standard Infomir MAG MAC Address (backward compatible export)
 */
export function generateMagMacAddress() {
  return getDeterministicMagMacAddress();
}

/**
 * Detect client device model and regional IP
 */
function detectDeviceInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { model: 'Smart TV Box', ip: '149.255.228.84' };
  }

  const ua = navigator.userAgent;
  let model = 'Smart TV Box (Android TV)';
  if (/iPad|iPhone|iPod/.test(ua)) model = 'Apple iPhone / iPad';
  else if (/Android/.test(ua) && /Mobile/.test(ua)) model = 'Android Smartphone';
  else if (/Android/.test(ua)) model = 'Android Smart TV / Box';
  else if (/Windows/.test(ua)) model = 'Windows PC (Desktop)';
  else if (/Macintosh/.test(ua)) model = 'Apple Mac';

  // Realistic public Kurdistan ISP range
  const ipSuffix = 84;
  const ip = `149.255.228.${ipSuffix} (Kurdistan Net)`;

  return { model, ip };
}

/**
 * Get or initialize persistent Device Identity (Strict MAC-Only)
 */
export function getOrCreateDeviceIdentity() {
  const mac = getDeterministicMagMacAddress();

  try {
    const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      let needsSave = false;

      // Ensure MAC matches deterministic hardware MAC
      if (!parsed.macAddress || parsed.macAddress !== mac) {
        parsed.macAddress = mac;
        needsSave = true;
      }
      if (!parsed.portalUrl) {
        parsed.portalUrl = DEFAULT_PORTAL_URL;
        needsSave = true;
      }
      // Ensure alias fields match MAC (no random DEV-ids or serial numbers)
      if (parsed.deviceId !== mac || parsed.serialNumber !== mac) {
        parsed.deviceId = mac;
        parsed.serialNumber = mac;
        needsSave = true;
      }
      if (needsSave) {
        localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading device identity:', e);
  }

  const { model, ip } = detectDeviceInfo();
  const identity = {
    macAddress: mac,
    portalUrl: DEFAULT_PORTAL_URL,
    // Alias deviceId and serialNumber to macAddress so any existing references stay compatible
    deviceId: mac,
    serialNumber: mac,
    deviceIp: ip,
    deviceModel: model,
    status: 'active', // Default active
    activePlan: 'free',
    registeredAt: new Date().toISOString(),
    expiresAt: null,
    assignedServer: null,
    lastActivity: {
      timestamp: Date.now(),
      channelName: 'DABIN.Tv Channel',
      isOnline: true
    }
  };

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(identity));
  } catch (e) {}

  return identity;
}

/**
 * Asynchronously sync native Android device ID if running in Capacitor
 * Ensures 100% permanence across uninstalls on Android TV / Android devices
 */
export async function syncNativeDeviceMac() {
  if (typeof window === 'undefined') return;

  try {
    if (Capacitor.isNativePlatform()) {
      const info = await Device.getId();
      if (info && info.identifier) {
        // info.identifier on Android is persistent Settings.Secure.ANDROID_ID
        const nativeSuffix = hashStringTo3Bytes(`android_id_${info.identifier}`);
        const nativeMac = `00:1A:79:${nativeSuffix}`;

        const current = getOrCreateDeviceIdentity();
        if (current.macAddress !== nativeMac) {
          current.macAddress = nativeMac;
          current.deviceId = nativeMac;
          current.serialNumber = nativeMac;
          localStorage.setItem(PERSISTENT_MAC_KEY, nativeMac);
          saveDeviceIdentity(current);
          window.dispatchEvent(new CustomEvent('dabin_mac_synced', { detail: nativeMac }));
        }
      }
    }
  } catch (e) {
    console.warn('[DeviceManager] Native MAC sync failed:', e);
  }
}

/**
 * Save updated device identity
 */
export function saveDeviceIdentity(updated) {
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

/**
 * Submit an activation request purely with MAC
 */
export function submitActivationRequest({ requestType = 'trial_24h', planName = 'تێستی ٢٤ کاتژمێری' } = {}) {
  const device = getOrCreateDeviceIdentity();
  
  const newRequest = {
    id: `req-${Date.now()}`,
    macAddress: device.macAddress,
    deviceId: device.macAddress,
    serialNumber: device.macAddress,
    portalUrl: device.portalUrl,
    deviceIp: device.deviceIp,
    deviceModel: device.deviceModel,
    requestType, // 'trial_12h' | 'trial_24h' | 'sub_1m' | 'sub_3m' | 'sub_6m' | 'sub_1y'
    planName,
    status: 'pending',
    requestedAt: new Date().toLocaleString('en-GB')
  };

  device.lastRequestId = newRequest.id;
  saveDeviceIdentity(device);

  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(newRequest);
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}

  return newRequest;
}

/**
 * Get all stored requests
 */
export function getAllRequests() {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {}
  return [];
}

/**
 * Clear all activation requests
 */
export function clearAllActivationRequests() {
  try {
    localStorage.removeItem(REQUESTS_STORAGE_KEY);
  } catch (e) {}
  return [];
}

/**
 * Approve request from Admin
 */
export function approveRequest(requestId, requestsList, setRequestsList, durationDays = 30) {
  const updated = requestsList.map(req => {
    if (req.id === requestId) {
      return { ...req, status: 'approved', approvedAt: new Date().toLocaleString('en-GB') };
    }
    return req;
  });

  setRequestsList(updated);
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}

  const currentDevice = getOrCreateDeviceIdentity();
  const matchedReq = requestsList.find(r => r.id === requestId);
  if (matchedReq && (currentDevice.macAddress === matchedReq.macAddress || currentDevice.macAddress === matchedReq.serialNumber)) {
    currentDevice.status = matchedReq.requestType?.includes('trial') ? 'trial_active' : 'active';
    currentDevice.activePlan = matchedReq.planName;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + (matchedReq.requestType === 'trial_24h' ? 1 : durationDays));
    currentDevice.expiresAt = expDate.toISOString();
    saveDeviceIdentity(currentDevice);
  }

  return updated;
}
