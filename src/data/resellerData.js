/**
 * DABIN.TV - Reseller & Device Management Core Engine
 * 
 * Provides unified state and persistence for the 8 Reseller Sections:
 * 1. Dashboard & 2FA Security
 * 2. Domains (DNS Hosting)
 * 3. Device Management (Smart TV Codes, M3U Lines, MAG Devices)
 * 4. Seller Management (Sub-resellers)
 * 5. Tools & News (Templates & LionOTT Server Bulletins)
 * 6. Support Tickets (New Ticket & Tickets List)
 * 7. Logs (Credit Logs, Panel Logs, Activity Logs)
 * 8. Settings & Profile (Panel Name: Dabintv, CREDITS: 6)
 */

import { getOrCreateDeviceIdentity, saveDeviceIdentity, generateMagMacAddress } from './deviceManager';

const STORAGE_KEY_PANEL = 'dabin_reseller_panel_info_v3';
const STORAGE_KEY_DEVICES = 'dabin_reseller_devices_v3';
const STORAGE_KEY_M3U_LINES = 'dabin_reseller_m3u_lines_v3';
const STORAGE_KEY_MAG_DEVICES = 'dabin_reseller_mag_devices_v3';
const STORAGE_KEY_SELLERS = 'dabin_reseller_sellers_v3';
const STORAGE_KEY_DOMAINS = 'dabin_reseller_domains_v3';
const STORAGE_KEY_TEMPLATES = 'dabin_reseller_templates_v3';
const STORAGE_KEY_NEWS = 'dabin_reseller_news_v3';
const STORAGE_KEY_TICKETS = 'dabin_reseller_tickets_v3';
const STORAGE_KEY_LOGS = 'dabin_reseller_logs_v3';
const STORAGE_KEY_2FA = 'dabin_reseller_2fa_v3';

export const SUBSCRIPTION_DURATIONS = [
  { id: '12h', labelKu: 'تێستی ١٢ کاتژمێری', labelEn: '12-Hour Free Trial', hours: 12, creditCost: 0, priceIqd: 0, isTrial: true },
  { id: '24h', labelKu: 'تێستی ٢٤ کاتژمێری', labelEn: '24-Hour Free Trial', hours: 24, creditCost: 0, priceIqd: 0, isTrial: true },
  { id: '1m', labelKu: '١ مانگ (1 Month)', labelEn: '1 Month Subscription', days: 30, creditCost: 0.1, priceIqd: 10000, isTrial: false },
  { id: '3m', labelKu: '٣ مانگ (3 Months)', labelEn: '3 Months Subscription', days: 90, creditCost: 0.3, priceIqd: 25000, isTrial: false },
  { id: '6m', labelKu: '٦ مانگ (6 Months)', labelEn: '6 Months Subscription', days: 180, creditCost: 0.6, priceIqd: 45000, isTrial: false },
  { id: '12m', labelKu: '١٢ مانگ / ١ ساڵ (12 Months)', labelEn: '12 Months / 1 Year', days: 365, creditCost: 1.0, priceIqd: 75000, isTrial: false },
];

export const INITIAL_PANEL_INFO = {
  panelName: 'Dabintv',
  brand: 'DABIN.tv Premium IPTV Solutions',
  credits: 6.0,
  serverProvider: 'LionOTT 4K Master Cluster',
  dnsPrimary: 'http://line.liondnscloud.ru',
  activeConnectionsCount: 1,
  totalChannelsOnline: 20188,
  totalVodOnline: 102663
};

export const INITIAL_DOMAINS = [
  { id: 'dns-1', host: 'line.liondnscloud.ru', port: 80, protocol: 'http', ssl: false, status: 'online', pingMs: 38, isDefault: true, note: 'سێرڤەری سەرەکی پەخش (LionOTT)' },
  { id: 'dns-2', host: 'ott.dabintv.com', port: 443, protocol: 'https', ssl: true, status: 'online', pingMs: 42, isDefault: false, note: 'دۆمەینی تایبەتی براندی دابین' },
  { id: 'dns-3', host: 'stream.dabiniptv.net', port: 8080, protocol: 'http', ssl: false, status: 'online', pingMs: 45, isDefault: false, note: 'پۆرتاڵی یەدەگ بۆ شاشە زیرەکەکان' },
];

export const INITIAL_TEMPLATES = [
  {
    id: 'tmpl-whatsapp-m3u',
    titleKu: 'نامەی کڕیار بە لینکی M3U (WhatsApp)',
    type: 'whatsapp',
    content: `سڵاو بەڕێزم {clientName} 🌷
بەخێربێیت بۆ خزمەتگوزاری فەرمی DABIN.tv 📺
زانیاری بەشداربوونەکەت:
• ماوەی بەشداربوون: {durationLabel}
• لینکی M3U:
{m3uUrl}

بەسوود وەرگرتن لەم بەستەرە دەتوانیت لەسەر هەموو شاشە و ئەپەکان بە باشتریین کوالێتی 4K سەیری بکەیت.
سوپاس بۆ متمانەکەت!`
  },
  {
    id: 'tmpl-whatsapp-xtream',
    titleKu: 'نامەی کڕیار بە یوزەر و پاسوۆرد (Xtream Codes)',
    type: 'whatsapp',
    content: `سڵاو بەڕێزم {clientName} 🌷
زانیاری ئەکاونتی DABIN.tv:
• سێرڤەر (Host): {serverHost}
• ناوی بەکارهێنەر (Username): {username}
• تێپەڕەوشە (Password): {password}
• ماوەی بەشداربوون: {durationLabel}
• بەرواری بەسەرچوون: {expiryDate}

تیمی پاڵپشتی DABIN.tv هەمیشە لە خزمەتتاندایە.`
  },
  {
    id: 'tmpl-device-code',
    titleKu: 'نامەی چالاککردنی شاشە بە کۆدی ئامێر (Device Code)',
    type: 'smart_tv',
    content: `بەڕێز {clientName}
شاشەکەت لەسەر ئەپی DABIN.tv بە سەرکەوتوویی ئەکتیڤکرا!
• کۆدی ئامێر: {deviceCode}
• ماوەی کارایی: {durationLabel}
• کەناڵەکان بە تەواوی کرانەوە. پێویست بە هیچ ڕێکخستنێک ناکات تەنها ئەپەکە بکەرەوە.`
  }
];

export const INITIAL_NEWS = [
  {
    id: 'news-1',
    date: '2026-10-24',
    titleKu: 'زیادکردنی کەناڵە نوێیەکانی وەرزشی و پەخشی 4K',
    author: 'LionOTT Technical Team',
    category: 'Channels Update',
    bodyKu: 'سەرجەم کەناڵەکانی خولی ئینگلیزی و چامپیۆنس لیگ بە کوالێتی ڕاستەقینەی 4K UHD و 50FPS نوێکرانەوە لەگەڵ دەنگی کوردی و عەرەبی.'
  },
  {
    id: 'news-2',
    date: '2026-10-22',
    titleKu: 'نوێکردنەوەی خێرایی سێرڤەر و کەمکردنەوەی پینگ بۆ عێراق و کوردستان',
    author: 'DABIN.tv Operations',
    category: 'Server Optimization',
    bodyKu: 'ڕایەڵەی CDN بۆ هێڵەکانی Newroz و Fastlink و GoranNet بەستراوەتەوە تا پەخش بەبێ ڕاگرتن (Bufferless) بگاتە بەشداربووان.'
  }
];

export const INITIAL_SELLERS = [
  {
    id: 'seller-1',
    name: 'ئاراس ئەحمەد (کۆمپیوتەری ئاراس)',
    phone: '0770 182 3344',
    city: 'سلێمانی',
    creditsGiven: 20,
    creditsUsed: 14,
    activeLines: 12,
    balanceUsd: 140,
    status: 'active'
  },
  {
    id: 'seller-2',
    name: 'سەردار محەمەد (سەنتەری هەولێر)',
    phone: '0750 339 8811',
    city: 'هەولێر',
    creditsGiven: 15,
    creditsUsed: 8,
    activeLines: 7,
    balanceUsd: 80,
    status: 'active'
  }
];

export const INITIAL_TICKETS = [
  {
    id: 'tkt-101',
    subject: 'نوێکردنەوەی پەخشی کەناڵی وەرزشی BeIN 1',
    department: 'Live Streams Team',
    priority: 'high',
    status: 'answered',
    createdAt: '2026-10-23 14:20',
    lastReply: 'پەخشەکە بە سەقامگیری تەواو نوێکرایەوە و ئێستا بە 4K کار دەکات.'
  }
];

export const INITIAL_LOGS = [
  {
    id: 'log-1',
    timestamp: '2026-10-24 08:15',
    type: 'credit',
    description: 'تۆمارکردنی پوڵی سەرەکی بریکار: CREDITS: 6 لەلایەن بەڕێوەبەر (Dabintv)',
    amount: '+6.0 Cr',
    balance: '6.0 Cr',
    actor: 'Dabintv Admin'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-24 07:45',
    type: 'auth',
    description: 'چوونەژوورەوەی ئەدمین لە ئایپی پارێزراو',
    ip: '149.255.228.84',
    actor: 'Dabintv Admin'
  }
];

// Helper: Read JSON from localStorage
function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

// Helper: Write JSON to localStorage
function safeWrite(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

/**
 * Clean & Fresh Reset:
 * Purges legacy mock data, initializes the clean 8-section database
 * and sets Panel: Dabintv with CREDITS: 6.
 */
export function resetFreshResellerData(force = false) {
  if (!force && safeRead('dabin_fresh_clean_init_v3', false)) {
    return;
  }

  // Start with 0 devices for 100% fresh system
  const initialDevices = [];

  safeWrite(STORAGE_KEY_PANEL, INITIAL_PANEL_INFO);
  safeWrite(STORAGE_KEY_DEVICES, initialDevices);
  safeWrite(STORAGE_KEY_M3U_LINES, []);
  safeWrite(STORAGE_KEY_MAG_DEVICES, []);
  safeWrite(STORAGE_KEY_SELLERS, INITIAL_SELLERS);
  safeWrite(STORAGE_KEY_DOMAINS, INITIAL_DOMAINS);
  safeWrite(STORAGE_KEY_TEMPLATES, INITIAL_TEMPLATES);
  safeWrite(STORAGE_KEY_NEWS, INITIAL_NEWS);
  safeWrite(STORAGE_KEY_TICKETS, INITIAL_TICKETS);
  safeWrite(STORAGE_KEY_LOGS, INITIAL_LOGS);
  safeWrite(STORAGE_KEY_2FA, { isEnabled: false, secretKey: 'DABIN-7X99-2FA-AUTH' });
  safeWrite('dabin_fresh_clean_init_v3', true);
}

// -------------------------------------------------------------
// Getters & Mutators
// -------------------------------------------------------------

export function getPanelInfo() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_PANEL, INITIAL_PANEL_INFO);
}

export function savePanelInfo(updated) {
  safeWrite(STORAGE_KEY_PANEL, updated);
  window.dispatchEvent(new CustomEvent('dabin_panel_updated', { detail: updated }));
  return updated;
}

export function getResellerCredits() {
  const info = getPanelInfo();
  return typeof info.credits === 'number' ? info.credits : 6.0;
}

export function setResellerCredits(amount) {
  const info = getPanelInfo();
  info.credits = Number(amount);
  savePanelInfo(info);
  return info.credits;
}

// Devices (Smart TV Codes & MAG Devices Unified)
export function getResellerDevices() {
  resetFreshResellerData();
  const rawList = safeRead(STORAGE_KEY_DEVICES, []);
  let needsSave = false;
  const migrated = rawList.map(d => {
    let changed = false;
    const item = { ...d };
    if (!item.macAddress) {
      item.macAddress = generateMagMacAddress();
      changed = true;
    }
    if (!item.portalUrl) {
      item.portalUrl = 'http://line.liondnscloud.ru/c/';
      changed = true;
    }
    if (!item.lastActivity) {
      item.lastActivity = {
        timestamp: Date.now() - 60000,
        channelName: 'DABIN.Tv Channel',
        isOnline: true
      };
      changed = true;
    }
    if (!Array.isArray(item.transactions)) {
      item.transactions = [
        {
          id: `tx-migrated-${item.id || Date.now()}`,
          date: new Date(item.assignedAt || Date.now()).toLocaleString('en-GB'),
          action: item.isTrial ? 'چالاککردنی تێست' : 'کڕینی پاکێج',
          planLabel: item.durationLabel || 'تێستی ٢٤ کاتژمێری',
          durationId: item.durationId || '24h',
          priceIqd: item.isTrial ? 0 : 15000,
          creditsUsed: item.isTrial ? 0 : 0.1,
          paymentStatus: item.isTrial ? 'تێست (بێبەرامبەر)' : 'پارەدراوە (کاش)',
          serverType: item.serverType || 'xtream',
          adminNotes: 'تۆماری سەرەتایی ئامێر'
        }
      ];
      changed = true;
    }
    if (changed) needsSave = true;
    return item;
  });

  if (needsSave) {
    safeWrite(STORAGE_KEY_DEVICES, migrated);
  }
  return migrated;
}

export function saveResellerDevices(devices) {
  safeWrite(STORAGE_KEY_DEVICES, devices);
  window.dispatchEvent(new CustomEvent('dabin_devices_updated', { detail: devices }));
  return devices;
}

/**
 * Assign or Update Server & Subscription for a specific Device Code or MAC Address
 */
export function assignServerToDevice({
  serialNumber,
  macAddress = '',
  clientName = '',
  phone = '',
  durationId = '24h',
  serverType = 'xtream', // 'xtream' | 'm3u'
  m3uUrl = '',
  serverHost = '',
  serverUsername = '',
  serverPassword = '',
  priceIqd = null,
  paymentStatus = '',
  adminNotes = ''
}) {
  const durationConfig = SUBSCRIPTION_DURATIONS.find(d => d.id === durationId) || SUBSCRIPTION_DURATIONS[1];
  const now = Date.now();
  let durationMs = 24 * 3600000;
  if (durationConfig.hours) {
    durationMs = durationConfig.hours * 3600000;
  } else if (durationConfig.days) {
    durationMs = durationConfig.days * 86400000;
  }
  const expiresAt = new Date(now + durationMs).toISOString();

  const devices = getResellerDevices();
  let matchedIndex = devices.findIndex(d => 
    (serialNumber && d.serialNumber === serialNumber) ||
    (macAddress && d.macAddress?.toLowerCase() === macAddress.toLowerCase())
  );

  const existingDevice = matchedIndex >= 0 ? devices[matchedIndex] : null;
  const finalMac = macAddress?.trim() || existingDevice?.macAddress || generateMagMacAddress();
  const finalSerial = serialNumber?.trim() || existingDevice?.serialNumber || `DABIN-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;

  const finalPriceIqd = priceIqd !== null && priceIqd !== undefined
    ? Number(priceIqd)
    : (durationConfig.priceIqd || (durationConfig.isTrial ? 0 : 15000));

  const finalPaymentStatus = paymentStatus || (durationConfig.isTrial ? 'تێست (بێبەرامبەر)' : 'پارەدراوە (کاش)');

  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: new Date().toLocaleString('en-GB'),
    action: durationConfig.isTrial ? 'چالاککردنی تێست' : 'کڕین و نوێکردنەوەی پاکێج',
    planLabel: durationConfig.labelKu,
    durationId,
    priceIqd: finalPriceIqd,
    creditsUsed: durationConfig.creditCost,
    paymentStatus: finalPaymentStatus,
    serverType,
    adminNotes: adminNotes.trim() || `تەرخانکرا لەلایەن Dabintv Admin`
  };

  const existingTransactions = Array.isArray(existingDevice?.transactions) ? existingDevice.transactions : [];

  const deviceData = {
    id: existingDevice ? existingDevice.id : `dev-${Date.now()}`,
    serialNumber: finalSerial,
    macAddress: finalMac,
    portalUrl: existingDevice?.portalUrl || 'http://line.liondnscloud.ru/c/',
    deviceId: existingDevice ? existingDevice.deviceId : `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName: clientName.trim() || (existingDevice ? existingDevice.clientName : 'بەکارهێنەری نوێ'),
    phone: phone.trim() || (existingDevice ? existingDevice.phone : ''),
    deviceIp: existingDevice ? existingDevice.deviceIp : '149.255.228.90 (Kurdistan Net)',
    deviceModel: existingDevice ? existingDevice.deviceModel : 'Smart TV / MAG Box',
    durationId,
    durationLabel: durationConfig.labelKu,
    isTrial: durationConfig.isTrial,
    status: 'active',
    serverType,
    m3uUrl: m3uUrl.trim(),
    serverHost: serverHost.trim(),
    serverUsername: serverUsername.trim(),
    serverPassword: serverPassword.trim(),
    assignedAt: new Date().toISOString(),
    expiresAt,
    lastActivity: existingDevice?.lastActivity || {
      timestamp: Date.now(),
      channelName: 'DABIN.Tv Channel',
      isOnline: true
    },
    transactions: [newTx, ...existingTransactions]
  };

  if (matchedIndex >= 0) {
    devices[matchedIndex] = deviceData;
  } else {
    devices.unshift(deviceData);
  }

  saveResellerDevices(devices);

  // Deduct credits if paid plan
  if (!durationConfig.isTrial && durationConfig.creditCost > 0) {
    const currentCr = getResellerCredits();
    const newCr = Math.max(0, currentCr - durationConfig.creditCost);
    setResellerCredits(newCr);

    addResellerLog({
      type: 'credit',
      description: `تەرخانکردنی ${durationConfig.labelKu} بۆ ئامێری (${deviceData.macAddress} / ${finalSerial}) - کڕیار: ${deviceData.clientName} - نرخ: ${finalPriceIqd.toLocaleString()} IQD`,
      amount: `-${durationConfig.creditCost} Cr`,
      balance: `${newCr.toFixed(1)} Cr`
    });
  } else {
    addResellerLog({
      type: 'trial',
      description: `چالاککردنی ${durationConfig.labelKu} (بێبەرامبەر) بۆ ئامێری (${deviceData.macAddress} / ${finalSerial})`,
      amount: '0.0 Cr',
      balance: `${getResellerCredits().toFixed(1)} Cr`
    });
  }

  // Also if this matches current client running in this browser, immediately activate it!
  const currentIdentity = getOrCreateDeviceIdentity();
  if (currentIdentity && (currentIdentity.serialNumber === finalSerial || currentIdentity.macAddress === finalMac)) {
    currentIdentity.status = 'active';
    currentIdentity.activePlan = durationConfig.labelKu;
    currentIdentity.expiresAt = expiresAt;
    currentIdentity.assignedServer = {
      serverType,
      m3uUrl: m3uUrl.trim(),
      host: serverHost.trim(),
      username: serverUsername.trim(),
      password: serverPassword.trim()
    };
    saveDeviceIdentity(currentIdentity);
    // Dispatch instant activation event
    window.dispatchEvent(new CustomEvent('dabin_device_server_activated', { detail: currentIdentity }));
  }

  return deviceData;
}

/**
 * Update real-time activity for a device (serialNumber or macAddress)
 */
export function updateDeviceActivity(serialOrMac, channelName) {
  if (!serialOrMac) return;
  const now = Date.now();
  const devices = getResellerDevices();
  let updated = false;

  const newDevices = devices.map(d => {
    if (d.serialNumber === serialOrMac || d.macAddress === serialOrMac || d.deviceId === serialOrMac) {
      updated = true;
      return {
        ...d,
        lastActivity: {
          timestamp: now,
          channelName: channelName || d.lastActivity?.channelName || 'DABIN.Tv Channel',
          isOnline: true
        }
      };
    }
    return d;
  });

  if (updated) {
    saveResellerDevices(newDevices);
  }

  // Also update local device identity if matching
  try {
    const current = getOrCreateDeviceIdentity();
    if (current && (current.serialNumber === serialOrMac || current.macAddress === serialOrMac)) {
      current.lastActivity = {
        timestamp: now,
        channelName: channelName || current.lastActivity?.channelName || 'DABIN.Tv Channel',
        isOnline: true
      };
      saveDeviceIdentity(current);
    }
  } catch (e) {}
}

/**
 * Add manual or automated financial / sales transaction to a device
 */
export function addDeviceTransaction(serialOrMac, txData) {
  const devices = getResellerDevices();
  const matchedIndex = devices.findIndex(d => 
    d.serialNumber === serialOrMac || d.macAddress === serialOrMac || d.id === serialOrMac
  );
  if (matchedIndex < 0) return null;

  const target = devices[matchedIndex];
  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: new Date().toLocaleString('en-GB'),
    action: txData.action || 'مامەڵەی دارایی / فرۆشتن',
    planLabel: txData.planLabel || target.durationLabel || '',
    durationId: txData.durationId || target.durationId || '',
    priceIqd: typeof txData.priceIqd === 'number' ? txData.priceIqd : 0,
    creditsUsed: typeof txData.creditsUsed === 'number' ? txData.creditsUsed : 0,
    paymentStatus: txData.paymentStatus || 'پارەدراوە (کاش)',
    serverType: txData.serverType || target.serverType || 'xtream',
    adminNotes: txData.adminNotes || ''
  };

  target.transactions = [newTx, ...(target.transactions || [])];
  devices[matchedIndex] = target;
  saveResellerDevices(devices);

  addResellerLog({
    type: 'transaction',
    description: `تۆمارکردنی مامەڵەی ${newTx.action} بۆ (${target.macAddress}) بە بڕی ${newTx.priceIqd.toLocaleString()} IQD`,
    amount: `${newTx.priceIqd.toLocaleString()} IQD`,
    balance: `${getResellerCredits().toFixed(1)} Cr`
  });

  return newTx;
}

/**
 * Toggle Device Status (active / suspended)
 */
export function toggleDeviceStatus(serialOrMac) {
  const devices = getResellerDevices();
  const matched = devices.find(d => d.serialNumber === serialOrMac || d.macAddress === serialOrMac || d.id === serialOrMac);
  if (!matched) return null;

  matched.status = matched.status === 'active' ? 'suspended' : 'active';
  saveResellerDevices([...devices]);

  addResellerLog({
    type: 'security',
    description: `گۆڕینی دۆخی ئامێری (${matched.macAddress || matched.serialNumber}) بۆ: ${matched.status === 'active' ? 'چالاک (Active)' : 'ڕاگیراو (Suspended)'}`,
    amount: '',
    balance: ''
  });

  return matched;
}

/**
 * Delete device from reseller panel
 */
export function deleteResellerDevice(serialOrMac) {
  const devices = getResellerDevices();
  const filtered = devices.filter(d => d.serialNumber !== serialOrMac && d.macAddress !== serialOrMac && d.id !== serialOrMac);
  saveResellerDevices(filtered);
  addResellerLog({
    type: 'activity',
    description: `سڕینەوەی ئامێری (${serialOrMac}) لە کۆنتڕۆڵ پانێڵ`,
    amount: '',
    balance: ''
  });
  return filtered;
}

/**
 * Register a new MAG device directly with MAC address
 */
export function registerNewMagDevice({
  mac,
  clientName = '',
  phone = '',
  durationId = '1m',
  serverType = 'xtream',
  serverHost = 'http://line.liondnscloud.ru',
  serverUsername = '',
  serverPassword = '',
  m3uUrl = '',
  priceIqd = null,
  paymentStatus = '',
  adminNotes = ''
}) {
  return assignServerToDevice({
    serialNumber: `DABIN-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`,
    macAddress: mac.trim(),
    clientName,
    phone,
    durationId,
    serverType,
    serverHost,
    serverUsername,
    serverPassword,
    m3uUrl,
    priceIqd,
    paymentStatus,
    adminNotes
  });
}

// M3U Lines
export function getM3uLines() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_M3U_LINES, []);
}

export function saveM3uLines(lines) {
  safeWrite(STORAGE_KEY_M3U_LINES, lines);
  return lines;
}

// MAG Devices
export function getMagDevices() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_MAG_DEVICES, []);
}

export function saveMagDevices(mags) {
  safeWrite(STORAGE_KEY_MAG_DEVICES, mags);
  return mags;
}

// Sellers
export function getSellers() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_SELLERS, INITIAL_SELLERS);
}

export function saveSellers(sellers) {
  safeWrite(STORAGE_KEY_SELLERS, sellers);
  return sellers;
}

// Domains
export function getDomains() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_DOMAINS, INITIAL_DOMAINS);
}

export function saveDomains(domains) {
  safeWrite(STORAGE_KEY_DOMAINS, domains);
  return domains;
}

// Templates
export function getTemplates() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_TEMPLATES, INITIAL_TEMPLATES);
}

export function saveTemplates(templates) {
  safeWrite(STORAGE_KEY_TEMPLATES, templates);
  return templates;
}

// News
export function getNews() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_NEWS, INITIAL_NEWS);
}

export function saveNews(news) {
  safeWrite(STORAGE_KEY_NEWS, news);
  return news;
}

// Tickets
export function getTickets() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_TICKETS, INITIAL_TICKETS);
}

export function saveTickets(tickets) {
  safeWrite(STORAGE_KEY_TICKETS, tickets);
  return tickets;
}

export function createNewTicket({ subject, department, priority, message }) {
  const tickets = getTickets();
  const newTkt = {
    id: `tkt-${Math.floor(100 + Math.random() * 900)}`,
    subject,
    department,
    priority,
    message,
    status: 'open',
    createdAt: new Date().toLocaleString('en-GB'),
    lastReply: 'تیکێتەکە وەرگیرا لەلایەن تیمی پاڵپشتی LionOTT و لێکۆڵینەوەی بۆ دەکرێت.'
  };
  tickets.unshift(newTkt);
  saveTickets(tickets);
  return newTkt;
}

// Logs
export function getLogs() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_LOGS, INITIAL_LOGS);
}

export function addResellerLog({ type = 'activity', description, amount = '', balance = '' }) {
  const logs = getLogs();
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleString('en-GB'),
    type,
    description,
    amount,
    balance: balance || `${getResellerCredits().toFixed(1)} Cr`,
    actor: 'Dabintv Admin'
  };
  logs.unshift(newLog);
  safeWrite(STORAGE_KEY_LOGS, logs.slice(0, 100)); // keep last 100
  return newLog;
}

// 2FA Security
export function getTwoFactorStatus() {
  resetFreshResellerData();
  return safeRead(STORAGE_KEY_2FA, { isEnabled: false, secretKey: 'DABIN-7X99-2FA-AUTH' });
}

export function toggleTwoFactor(enable) {
  const state = { isEnabled: Boolean(enable), secretKey: 'DABIN-7X99-2FA-AUTH' };
  safeWrite(STORAGE_KEY_2FA, state);
  addResellerLog({
    type: 'security',
    description: `گۆڕینی دۆخی 2FA پاراستنی دوو هەنگاوی: ${enable ? 'چالاککرا (Active)' : 'ناچالاککرا (Inactive)'}`,
    amount: '',
    balance: ''
  });
  return state;
}

/**
 * Check if the current device has an active server assigned and is not expired
 */
export function isDeviceServerActive(device = null) {
  const target = device || getOrCreateDeviceIdentity();
  if (!target) return false;

  // Check expiration & renewal states
  if (target.status === 'expired' || target.status === 'needs_panel_renewal' || target.status === 'banned') {
    return false;
  }

  if (target.expiresAt) {
    const exp = new Date(target.expiresAt).getTime();
    if (Date.now() > exp) return false;
  }

  // Check Xtream credentials assigned directly
  if (target.xtream_user && target.xtream_pass) {
    return true;
  }

  // Check stored active xtream config from login
  try {
    const rawCfg = localStorage.getItem('nndd_active_xtream_config');
    if (rawCfg) {
      const parsed = JSON.parse(rawCfg);
      if (parsed && parsed.username && parsed.password) {
        return true;
      }
    }
  } catch(e) {}

  // Check if assignedServer is present with valid URL or Xtream credentials
  if (target.assignedServer) {
    const s = target.assignedServer;
    if (s.serverType === 'm3u' && s.m3uUrl && s.m3uUrl.trim()) return true;
    if (s.serverType === 'xtream' && s.host && s.username && s.password) return true;
  }

  // Also check if any stored device in resellerDevices matches this serial/mac and is active
  const storedDevices = safeRead(STORAGE_KEY_DEVICES, []);
  const matched = storedDevices.find(d => 
    (d.macAddress && d.macAddress === target.macAddress) || 
    (d.serialNumber && d.serialNumber === target.serialNumber)
  );
  if (matched && matched.status === 'active') {
    if (matched.expiresAt && Date.now() > new Date(matched.expiresAt).getTime()) {
      return false;
    }
    if (matched.serverType === 'm3u' && matched.m3uUrl) return true;
    if (matched.serverType === 'xtream' && matched.serverHost && matched.serverUsername) return true;
  }

  return false;
}
