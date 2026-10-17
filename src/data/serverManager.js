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
    note: 'سێرڤەری سەرەکی و بێبەرامبەری NNDD - پەخشی سەقامگیر و بەردەوامی زیاتر لە ٥٠ کەناڵ بەبێ کۆد و پارەدان',
    channelCount: 53,
    latencyMs: 35,
    createdAt: '2026-10-17'
  }
];

export const INITIAL_SERVER_SETTINGS = {
  activeServerId: 'srv-nndd-free',
  serverMode: 'dedicated', // 'dedicated' (سێرڤەری دیاریکراو) | 'auto' (ئۆتۆماتیک)
  autoFailoverEnabled: false,
  failoverTimeoutSec: 2.2,
  maxRetryAttempts: 2,
  customOsdCode: 'NNDD-FREE'
};

export function getStoredServers() {
  try {
    const raw = localStorage.getItem('nndd_servers_registry');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean up any deprecated/expired servers (trex, lionott, backup-kurdish)
      const valid = Array.isArray(parsed) 
        ? parsed.filter(s => s.id === 'srv-nndd-free' || (s.type === 'm3u' && !s.id?.includes('trex') && !s.id?.includes('lion')))
        : [];
      if (valid.length > 0) return valid;
    }
  } catch (e) {}
  saveStoredServers(INITIAL_SERVERS);
  return INITIAL_SERVERS;
}

export function saveStoredServers(servers) {
  try {
    localStorage.setItem('nndd_servers_registry', JSON.stringify(servers));
  } catch (e) {}
}

export function getStoredServerSettings() {
  try {
    const raw = localStorage.getItem('nndd_server_settings');
    const storedMode = localStorage.getItem('nndd_server_mode');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (storedMode) parsed.serverMode = storedMode;
      // If active server points to deleted server, reset to srv-nndd-free
      if (parsed.activeServerId !== 'srv-nndd-free') {
        parsed.activeServerId = 'srv-nndd-free';
      }
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
