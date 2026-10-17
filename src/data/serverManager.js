/**
 * NNDD TV - Multi-Server IPTV Manager & Auto-Failover Engine
 * Supports multiple IPTV providers (Xtream Codes API & M3U8 Playlists),
 * Primary Server switching, and Intelligent Auto-Failover.
 */

export const INITIAL_SERVERS = [
  {
    id: 'srv-nndd-free',
    name: 'سێرڤەری فەرمی NNDD (Free M3U8)',
    type: 'm3u',
    serverUrl: 'https://nndd-tv.vercel.app/channels.json',
    username: '',
    password: '',
    status: 'active',
    isPrimary: true,
    note: 'سێرڤەری سەرەکی و بێبەرامبەری NNDD - پەخشی سەقامگیر و بەردەوامی ٥٠٩ کەناڵ بەبێ کۆد و پارەدان',
    channelCount: 509,
    latencyMs: 35,
    createdAt: '2026-10-17'
  },
  {
    id: 'srv-lionott',
    name: 'سێرڤەری Lion OTT VIP',
    type: 'xtream',
    serverUrl: 'http://lionott.com:80',
    username: '',
    password: '',
    status: 'active',
    isPrimary: false,
    note: 'سێرڤەری جیهانی Lion OTT بۆ کناڵەکانی پڕۆ و 4K VIP',
    channelCount: 14500,
    latencyMs: 58,
    createdAt: '2026-10-17'
  },
  {
    id: 'srv-trex',
    name: 'سێرڤەری TREX 4K Ultra',
    type: 'xtream',
    serverUrl: 'http://trex-iptv.net:8080',
    username: '',
    password: '',
    status: 'active',
    isPrimary: false,
    note: 'سێرڤەری TREX بۆ پەخشی بەهێزی کەناڵ و بەشی زنجیرە و فیلمەکان',
    channelCount: 18200,
    latencyMs: 64,
    createdAt: '2026-10-17'
  },
  {
    id: 'srv-dino',
    name: 'سێرڤەری Dino OTT',
    type: 'xtream',
    serverUrl: 'http://dinoott.com:80',
    username: '',
    password: '',
    status: 'active',
    isPrimary: false,
    note: 'سێرڤەری یەدەگ و بەهێزی Dino OTT بۆ دۆخی ئۆتۆ-فەیڵۆڤەر',
    channelCount: 12000,
    latencyMs: 72,
    createdAt: '2026-10-17'
  }
];

export const INITIAL_SERVER_SETTINGS = {
  activeServerId: 'srv-nndd-free',
  serverMode: 'auto', // 'dedicated' (سێرڤەری دیاریکراو) | 'auto' (ئۆتۆماتیک)
  autoFailoverEnabled: true,
  failoverTimeoutSec: 2.2,
  maxRetryAttempts: 2,
  customOsdCode: 'NNDD-FREE',
  configVersion: '2.0.0'
};

export function getConfigVersion() {
  try {
    return localStorage.getItem('nndd_config_version') || '2.0.0';
  } catch (e) {
    return '2.0.0';
  }
}

export function bumpConfigVersion() {
  try {
    const newVersion = Date.now().toString();
    localStorage.setItem('nndd_config_version', newVersion);
    localStorage.removeItem('nndd_cached_channels');
    window.dispatchEvent(new CustomEvent('nndd_config_updated', { detail: { version: newVersion } }));
    return newVersion;
  } catch (e) {
    return Date.now().toString();
  }
}

export function getStoredServers() {
  try {
    const raw = localStorage.getItem('nndd_servers_registry');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveStoredServers(INITIAL_SERVERS);
  return INITIAL_SERVERS;
}

export function saveStoredServers(servers) {
  try {
    localStorage.setItem('nndd_servers_registry', JSON.stringify(servers));
    bumpConfigVersion();
  } catch (e) {}
}

export function getStoredServerSettings() {
  try {
    const raw = localStorage.getItem('nndd_server_settings');
    const storedMode = localStorage.getItem('nndd_server_mode');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (storedMode) parsed.serverMode = storedMode;
      return { ...INITIAL_SERVER_SETTINGS, ...parsed };
    }
    if (storedMode) return { ...INITIAL_SERVER_SETTINGS, serverMode: storedMode };
  } catch (e) {}
  saveStoredServerSettings(INITIAL_SERVER_SETTINGS);
  return INITIAL_SERVER_SETTINGS;
}

export function saveStoredServerSettings(settings) {
  try {
    localStorage.setItem('nndd_server_settings', JSON.stringify(settings));
    if (settings?.serverMode) {
      localStorage.setItem('nndd_server_mode', settings.serverMode);
    }
    bumpConfigVersion();
  } catch (e) {}
}

/**
 * Detect Server Badge & Fingerprint from URL or credentials
 */
export function detectServerBadge(streamUrl = '', username = '', host = '') {
  const cleanUrl = (streamUrl || host || '').toLowerCase();

  let code = 'NNDD-FREE';
  let name = 'سێرڤەری فەرمی NNDD (Free)';
  let dotColor = 'bg-emerald-400';

  if (cleanUrl.includes('vercel.app') || cleanUrl.includes('channels.json') || cleanUrl.includes('akamaized.net') || cleanUrl.includes('rudaw.net') || cleanUrl.includes('nndd')) {
    code = 'NNDD-FREE';
    name = 'سێرڤەری فەرمی NNDD (بێبەرامبەر)';
    dotColor = 'bg-emerald-400';
  } else {
    try {
      const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `http://${cleanUrl}`);
      const parts = parsed.hostname.split('.');
      code = (parts.length > 1 ? parts[parts.length - 2] : parts[0]).slice(0, 4).toUpperCase();
      name = parsed.hostname;
    } catch(e) {
      code = 'NNDD-FREE';
    }
  }

  return {
    code: `${code} [FREE]`,
    serverCode: code,
    serverName: name,
    dotColor,
    isTest: false
  };
}

/**
 * Test Server Latency and HTTP Reachability
 */
export async function testServerConnection(server) {
  const t0 = performance.now();
  try {
    let testUrl = server.serverUrl.replace(/\/+$/, '');
    if (server.type === 'xtream' && server.username && server.password) {
      testUrl = `${testUrl}/player_api.php?username=${server.username}&password=${server.password}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(testUrl, {
      signal: controller.signal,
      mode: 'no-cors'
    });
    clearTimeout(timeout);

    const latency = Math.round(performance.now() - t0);
    return {
      success: true,
      latencyMs: latency,
      status: 'active'
    };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Timeout (دواکەوت)' : (err.message || 'Connection Failed'),
      status: 'offline'
    };
  }
}
