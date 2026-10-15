/**
 * NNDD TV - Multi-Server IPTV Manager & Auto-Failover Engine
 * Supports multiple IPTV providers (Xtream Codes API & M3U8 Playlists),
 * Primary Server switching, and Intelligent Auto-Failover.
 */

export const INITIAL_SERVERS = [
  {
    id: 'srv-trex-primary',
    name: 'TREX IPTV Server (سێرڤەری سەرەکی)',
    type: 'xtream', // 'xtream' | 'm3u'
    serverUrl: 'https://vpn.trxdnscloud.ru',
    username: '11d68d6be9',
    password: '1efc2bb76bc7',
    status: 'active',
    isPrimary: true,
    note: 'سێرڤەری سەرەکی چالاککراو - پەخشی خێرای MPEG-TS بە کواڵیتی باڵا',
    channelCount: 50,
    latencyMs: 45,
    createdAt: '2026-10-15'
  },
  {
    id: 'srv-verified-m3u',
    name: 'سێرڤەری فەرمی NNDD (M3U8 پشکنراو)',
    type: 'm3u',
    serverUrl: 'https://nndd-tv.vercel.app/channels.json',
    username: '',
    password: '',
    status: 'active',
    isPrimary: false,
    note: 'سێرڤەری دووەم - کەناڵی پشکنراو و پشتڕاستکراو بە کوالێتی بەرز',
    channelCount: 26,
    latencyMs: 85,
    createdAt: '2026-10-13'
  },
  {
    id: 'srv-lionott',
    name: 'LionOtt IPTV Server (سێرڤەری لایۆن)',
    type: 'xtream',
    serverUrl: 'http://line.liondnscloud.ru',
    username: '384ec56c',
    password: '6a1bce4b',
    status: 'active',
    isPrimary: false,
    note: 'سێرڤەری فەرمی LionOtt - زیاتر لە ١٠٤ کەناڵی کوردی و جیهانی',
    channelCount: 104,
    latencyMs: 50,
    createdAt: '2026-10-16'
  },
  {
    id: 'srv-backup-kurdish',
    name: 'سێرڤەری یەدەگی فریاگوزاری (Fallback Streams)',
    type: 'm3u',
    serverUrl: 'https://stream.shams.tv',
    username: '',
    password: '',
    status: 'standby',
    isPrimary: false,
    note: 'سێرڤەری سێیەم بۆ ئەو کەناڵانەی کێشەی پەخشیان بۆ دروست دەبێت',
    channelCount: 20,
    latencyMs: 140,
    createdAt: '2026-10-13'
  }
];

export const INITIAL_SERVER_SETTINGS = {
  activeServerId: 'srv-lionott',
  serverMode: 'dedicated', // 'dedicated' (سێرڤەری دیاریکراو) | 'auto' (ئۆتۆماتیک)
  autoFailoverEnabled: false, // true only in 'auto' mode
  failoverTimeoutSec: 2.2, // Fast failover in Auto Mode (2.2 seconds)
  maxRetryAttempts: 2,
  customOsdCode: '' // Custom badge code shown on Live TV (e.g. LION-V1, TRX-V1, etc.)
};

export function getStoredServers() {
  try {
    const raw = localStorage.getItem('nndd_servers_registry');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
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
      return { ...INITIAL_SERVER_SETTINGS, ...parsed };
    }
    if (storedMode) return { ...INITIAL_SERVER_SETTINGS, serverMode: storedMode };
  } catch (e) {}
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
  const cleanUser = (username || '').toLowerCase();

  let code = 'SRV-1';
  let name = 'IPTV Server';
  let dotColor = 'bg-cyan-400';

  if (cleanUrl.includes('liondnscloud.ru') || cleanUrl.includes('lion') || cleanUser === '384ec56c') {
    code = 'LION-V1';
    name = 'LionOtt IPTV';
    dotColor = 'bg-amber-400';
  } else if (cleanUrl.includes('trxdnscloud.ru') || cleanUrl.includes('trex') || cleanUser === '11d68d6be9') {
    code = 'TRX-V1';
    name = 'TREX IPTV';
    dotColor = 'bg-emerald-400';
  } else if (cleanUrl.includes('m3um9xplus') || cleanUrl.includes('cobra') || cleanUser.includes('cobra')) {
    code = 'CBR-V1';
    name = 'COBRA IPTV';
    dotColor = 'bg-amber-400';
  } else if (cleanUrl.includes('ninja') || cleanUrl.includes('1234.ninja')) {
    code = 'NJ-V1';
    name = 'NINJA OTT';
    dotColor = 'bg-blue-400';
  } else if (cleanUrl.includes('shams.tv') || cleanUrl.includes('shams')) {
    code = 'SHM-V1';
    name = 'SHAMS IPTV';
    dotColor = 'bg-purple-400';
  } else if (cleanUrl.includes('vercel.app') || cleanUrl.includes('channels.json') || cleanUrl.includes('akamaized.net') || cleanUrl.includes('rudaw.net')) {
    code = 'NNDD-P1';
    name = 'NNDD Direct Edge';
    dotColor = 'bg-cyan-400';
  } else {
    try {
      const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `http://${cleanUrl}`);
      const parts = parsed.hostname.split('.');
      code = (parts.length > 1 ? parts[parts.length - 2] : parts[0]).slice(0, 4).toUpperCase();
      name = parsed.hostname;
    } catch(e) {
      code = 'SRV-1';
    }
  }

  const isTest = cleanUser === '384ec56c' || cleanUser.includes('test') || cleanUser.includes('trial');
  const lineType = isTest ? '[T]' : '[P]';

  return {
    code: `${code} ${lineType}`,
    serverCode: code,
    serverName: name,
    dotColor,
    isTest
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
