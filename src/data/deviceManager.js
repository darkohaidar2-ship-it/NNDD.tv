// Device Identity & Hardware Serial Key Manager for NNDD TV
const DEVICE_STORAGE_KEY = 'nndd_device_identity';
const REQUESTS_STORAGE_KEY = 'nndd_activation_requests';

/**
 * Generate a cryptographically styled hardware serial key:
 * Format: NNDD-[4 chars]-[4 chars]-[4 chars]
 */
function generateHardwareSerial() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `NNDD-${segment(4)}-${segment(4)}-${segment(4)}`;
}

/**
 * Detect client device type and mock realistic public IP for Kurdistan region
 */
function detectDeviceInfo() {
  const ua = navigator.userAgent;
  let model = 'Smart TV Box (Android TV)';
  if (/iPad|iPhone|iPod/.test(ua)) model = 'Apple iPhone / iPad';
  else if (/Android/.test(ua) && /Mobile/.test(ua)) model = 'Android Smartphone';
  else if (/Android/.test(ua)) model = 'Android Smart TV / Tablet';
  else if (/Windows/.test(ua)) model = 'Windows PC (Desktop)';
  else if (/Macintosh/.test(ua)) model = 'Apple Mac';

  // Simulated Kurdistan ISP public IP range (e.g. Newroz Telecom, Fastlink, Goran Net)
  const ipSuffix = Math.floor(10 + Math.random() * 240);
  const ip = `149.255.228.${ipSuffix} (Kurdistan Net)`;

  return { model, ip };
}

/**
 * Get or initialize persistent Device Identity
 */
export function getOrCreateDeviceIdentity() {
  try {
    const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.status === 'pending_activation') {
        parsed.status = 'active';
        parsed.activePlan = parsed.activePlan || 'free';
        localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error reading device identity:', e);
  }

  const { model, ip } = detectDeviceInfo();
  const identity = {
    serialNumber: generateHardwareSerial(),
    deviceId: `DEV-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    deviceIp: ip,
    deviceModel: model,
    status: 'active', // Default to active free tier
    activePlan: 'free',
    registeredAt: new Date().toISOString(),
    expiresAt: null,
    clientName: '',
    clientPhone: ''
  };

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(identity));
  } catch (e) {}

  return identity;
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
 * Submit an activation / trial request to admin queue
 */
export function submitActivationRequest({ clientName, clientPhone, requestType, planName }) {
  const device = getOrCreateDeviceIdentity();
  
  const newRequest = {
    id: `req-${Date.now()}`,
    clientName: clientName.trim(),
    phone: clientPhone.trim(),
    serialNumber: device.serialNumber,
    deviceId: device.deviceId,
    deviceIp: device.deviceIp,
    deviceModel: device.deviceModel,
    requestType, // 'trial_24h' | 'sub_1m' | 'sub_3m' | 'sub_6m' | 'sub_1y'
    planName,
    status: 'pending',
    requestedAt: new Date().toLocaleString('en-GB')
  };

  // Save to device identity
  device.clientName = clientName;
  device.clientPhone = clientPhone;
  device.lastRequestId = newRequest.id;
  saveDeviceIdentity(device);

  // Append to requests list in localStorage
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
export function getAllRequests(initialList = []) {
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

  // Also if current device matches this request, activate it immediately!
  const currentDevice = getOrCreateDeviceIdentity();
  const matchedReq = requestsList.find(r => r.id === requestId);
  if (matchedReq && currentDevice.serialNumber === matchedReq.serialNumber) {
    currentDevice.status = matchedReq.requestType === 'trial_24h' ? 'trial_active' : 'active';
    currentDevice.activePlan = matchedReq.planName;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + (matchedReq.requestType === 'trial_24h' ? 1 : durationDays));
    currentDevice.expiresAt = expDate.toISOString();
    saveDeviceIdentity(currentDevice);
  }

  return updated;
}

/**
 * Test Accounts for instant offline / bypass testing without admin
 */
export const TEST_ACCOUNTS = [
  {
    username: 'nndd-97',
    password: '97971997',
    name: 'تێستەری تایبەت (nndd-97)',
    planName: 'تێستی VIP بێ سنوور (nndd-97)',
    durationDays: 365,
    role: 'تێستەری سەرەکی'
  }
];

/**
 * Authenticate with instant test account (bypasses admin approval)
 */
export function authenticateTestAccount(username, password) {
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();

  const match = TEST_ACCOUNTS.find(
    acc => acc.username.toLowerCase() === u && acc.password === p
  );

  if (match) {
    const currentDevice = getOrCreateDeviceIdentity();
    currentDevice.status = 'active';
    currentDevice.activePlan = match.planName;
    currentDevice.activeUsername = match.username;
    currentDevice.clientName = match.name;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + match.durationDays);
    currentDevice.expiresAt = expDate.toISOString();
    saveDeviceIdentity(currentDevice);
    return { success: true, account: match, device: currentDevice };
  }

  return { success: false, error: 'ناوی بەکارهێنەر یان پاسۆرد هەڵەیە. تکایە nndd-97 و 97971997 بنووسە.' };
}
