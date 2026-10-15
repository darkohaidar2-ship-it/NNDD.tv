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
  activeServerId: 'srv-trex-primary',
  autoFailoverEnabled: true, // "کام سێرڤەرە ئیشی کرد ئەوە بێنێت"
  failoverTimeoutSec: 4,
  maxRetryAttempts: 2
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
    if (raw) {
      return { ...INITIAL_SERVER_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return INITIAL_SERVER_SETTINGS;
}

export function saveStoredServerSettings(settings) {
  try {
    localStorage.setItem('nndd_server_settings', JSON.stringify(settings));
  } catch (e) {}
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
