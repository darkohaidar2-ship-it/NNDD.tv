/**
 * NNDD TV - Multi-Server IPTV Manager & Auto-Failover Engine
 * Supports multiple IPTV providers (Xtream Codes API & M3U8 Playlists),
 * Primary Server switching, and Intelligent Auto-Failover.
 */

import { resolveXtreamHost, fetchXtreamAPI } from './serverImporter';
import { clearCachedLogos } from './logoCache';

export const INITIAL_SERVERS = [
  {
    id: 'srv-nndd-free',
    name: 'سێرڤەری فەرمی NNDD (Free M3U8)',
    type: 'm3u',
    serverUrl: '/channels.json',
    username: '',
    password: '',
    status: 'active',
    isPrimary: true,
    note: 'سێرڤەری سەرەکی و بێبەرامبەری NNDD - پەخشی سەقامگیر و بەردەوامی ٣٥ کەناڵی کوردی بەبێ کۆد و پارەدان',
    channelCount: 35,
    latencyMs: 15,
    createdAt: '2026-10-17'
  }
];

export const INITIAL_SERVER_SETTINGS = {
  activeServerId: 'srv-nndd-free',
  serverMode: 'dedicated', // 'dedicated' (سێرڤەری دیاریکراو) | 'auto' (ئۆتۆماتیک)
  autoFailoverEnabled: false,
  failoverTimeoutSec: 3.0,
  maxRetryAttempts: 2,
  customOsdCode: 'NNDD',
  configVersion: '7.2.0'
};

/**
 * Get active Xtream server config with authentication
 */
export function getActiveXtreamServer() {
  const servers = getStoredServers();
  const primaryXtream = servers.find(s => s.type === 'xtream' && s.username && s.password && s.isPrimary);
  if (primaryXtream) return primaryXtream;

  const anyXtream = servers.find(s => s.type === 'xtream' && s.username && s.password);
  if (anyXtream) return anyXtream;

  return null;
}

export function getConfigVersion() {
  try {
    return localStorage.getItem('nndd_config_version') || '5.0.0';
  } catch (e) {
    return '5.0.0';
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

export function saveStoredServers(servers, skipBump = false) {
  try {
    localStorage.setItem('nndd_servers_registry', JSON.stringify(servers));
    if (!skipBump) {
      bumpConfigVersion();
    }
  } catch (e) {}
}

export function getStoredServers() {
  try {
    const raw = localStorage.getItem('nndd_servers_registry');
    if (raw) {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Keep ONLY the official free NNDD server
        const cleaned = parsed.filter(s => s.id === 'srv-nndd-free');
        if (cleaned.length > 0) {
          cleaned[0].isPrimary = true;
          cleaned[0].channelCount = 35;
          saveStoredServers(cleaned, true);
          return cleaned;
        }
      }
    }
  } catch (e) {}
  saveStoredServers(INITIAL_SERVERS, true);
  return INITIAL_SERVERS;
}

export function saveStoredServerSettings(settings, skipBump = false) {
  try {
    localStorage.setItem('nndd_server_settings', JSON.stringify(settings));
    if (settings?.serverMode) {
      localStorage.setItem('nndd_server_mode', settings.serverMode);
    }
    if (!skipBump) {
      bumpConfigVersion();
    }
  } catch (e) {}
}

export function getStoredServerSettings() {
  try {
    const raw = localStorage.getItem('nndd_server_settings');
    const storedMode = localStorage.getItem('nndd_server_mode');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (storedMode) parsed.serverMode = storedMode;
      if (parsed.activeServerId === 'srv-elg26' || parsed.activeServerId === 'srv-lion4k') {
        parsed.activeServerId = 'srv-nndd-free';
        parsed.customOsdCode = 'NNDD';
        saveStoredServerSettings(parsed, true);
      }
      return { ...INITIAL_SERVER_SETTINGS, ...parsed };
    }
    if (storedMode) return { ...INITIAL_SERVER_SETTINGS, serverMode: storedMode };
  } catch (e) {}
  saveStoredServerSettings(INITIAL_SERVER_SETTINGS, true);
  return INITIAL_SERVER_SETTINGS;
}

/**
 * Purge all third-party external test servers & reset state to official NNDD Free server
 */
export function purgeAllThirdPartyServers() {
  try {
    clearCachedLogos();
    localStorage.removeItem('nndd_active_xtream_config');
    localStorage.removeItem('nndd_cached_vod_series_v3');
    localStorage.removeItem('nndd_cached_vod_movies_v3');
    localStorage.removeItem('nndd_cached_vod_series');
    localStorage.removeItem('nndd_cached_vod_movies');
    localStorage.removeItem('nndd_last_channel_id');
    localStorage.setItem('nndd_custom_osd_server_code', 'NNDD');
    localStorage.setItem('nndd_servers_registry', JSON.stringify(INITIAL_SERVERS));
    localStorage.setItem('nndd_server_settings', JSON.stringify(INITIAL_SERVER_SETTINGS));
    localStorage.setItem('nndd_server_mode', 'dedicated');
  } catch (e) {}
}

/**
 * Detect Server Badge & Fingerprint from URL or credentials
 */
export function detectServerBadge(streamUrl = '', username = '', host = '') {
  const cleanUrl = (streamUrl || host || username || '').toLowerCase();

  let code = 'NNDD';
  let name = 'سێرڤەری فەرمی NNDD (Free)';
  let dotColor = 'bg-emerald-400';

  if (cleanUrl.includes('lion') || cleanUrl.includes('914cd705')) {
    code = 'LION-4K';
    name = 'سێرڤەری فەرمی Lion 4K OTT';
    dotColor = 'bg-amber-400';
  } else if (cleanUrl.includes('trex') || cleanUrl.includes('trx')) {
    code = 'TRX-V1';
    name = 'سێرڤەری TREX 4K Ultra';
    dotColor = 'bg-purple-400';
  } else if (cleanUrl.includes('ninja') || cleanUrl.includes('1234.ninja')) {
    code = 'NJ-V1';
    name = 'سێرڤەری NINJA OTT';
    dotColor = 'bg-cyan-400';
  } else if (cleanUrl.includes('channels.json') || cleanUrl.includes('akamaized.net') || cleanUrl.includes('rudaw.net') || cleanUrl.includes('nndd') || cleanUrl.includes('shams.tv')) {
    code = 'NNDD';
    name = 'سێرڤەری فەرمی NNDD (بێبەرامبەر)';
    dotColor = 'bg-emerald-400';
  } else {
    try {
      const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `http://${cleanUrl}`);
      const parts = parsed.hostname.split('.');
      code = (parts.length > 1 ? parts[parts.length - 2] : parts[0]).slice(0, 4).toUpperCase();
      name = parsed.hostname;
    } catch(e) {
      code = 'NNDD';
    }
  }

  return {
    code: `${code} [LIVE]`,
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
    if (server.type === 'xtream' && server.username && server.password) {
      const data = await fetchXtreamAPI(server.username, server.password, '', {}, server);
      const latency = Math.round(performance.now() - t0);
      let status = 'active';
      let info = null;
      if (data?.user_info) {
        status = data.user_info.status === 'Active' ? 'active' : 'expired';
        info = data.user_info;
      }
      return {
        success: Boolean(data),
        latencyMs: latency,
        status: status,
        info: info
      };
    }

    let testUrl = resolveXtreamHost(server.serverUrl || server.host || '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(testUrl, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    const latency = Math.round(performance.now() - t0);
    return {
      success: true,
      latencyMs: latency,
      status: 'active',
      info: null
    };
  } catch (err) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Timeout (دواکەوت)' : (err.message || 'Connection Failed'),
      status: 'offline'
    };
  }
}

/**
 * Smart URL Parser: Parses full M3U Plus URL into host, username, password
 * Example: http://134669063096.elg-26.com/get.php?username=0chyx0wx3z&password=fi7do1vucm&type=m3u_plus&output=mpegts
 */
export function parseM3uCredentialsUrl(input = '') {
  const str = (input || '').trim();
  if (!str) return null;

  if (str.includes('username=') && str.includes('password=')) {
    try {
      const urlObj = new URL(str.startsWith('http') ? str : `http://${str}`);
      const host = `${urlObj.protocol}//${urlObj.host}`;
      const username = urlObj.searchParams.get('username') || '';
      const password = urlObj.searchParams.get('password') || '';
      return {
        host,
        username,
        password,
        type: 'xtream',
        name: str.includes('elg-26') ? 'سێرڤەری ELG-26 OTT' : `سێرڤەری ${urlObj.hostname}`
      };
    } catch(e) {}
  }
  return null;
}
