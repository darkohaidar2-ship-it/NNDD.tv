// KOBIN TV - Direct LionOTT Port 80 MAC Authentication Engine (MAG & Smart TV)
import { getDeterministicMagMacAddress, sanitizeMacAddress } from './deviceManager';
import { universalFetch } from './dabinRealtimeService';
import { supabase } from './supabaseClient';

export const LIONOTT_PORT80_BASE = 'http://line.liondnscloud.ru:80';
export const MAC_SESSION_STORAGE_KEY = 'kobin_tv_mac_session';
export const UNIFIED_SESSION_STORAGE_KEY = 'kobin_tv_session';

/**
 * Retrieve and sanitize the device MAC address into standard uppercase hex format (00:1A:79:XX:XX:XX)
 */
export function getDeviceMacAddress() {
  const rawMac = getDeterministicMagMacAddress();
  return sanitizeMacAddress(rawMac);
}

/**
 * Synchronously retrieve the active persistent MAC session
 */
export function getSavedMacSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MAC_SESSION_STORAGE_KEY) || localStorage.getItem(UNIFIED_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || typeof session !== 'object') return null;

    // Check expiration
    const exp = session.exp_date || session.expiresAt || session.app_expiry_date;
    if (exp) {
      const expMs = isNaN(exp) ? new Date(exp).getTime() : Number(exp) * 1000;
      if (expMs > 0 && Date.now() > expMs) {
        return null; // Session expired
      }
    }

    if (session.authorized || session.username || session.macAddress) {
      return session;
    }
  } catch (e) {}
  return null;
}

/**
 * Save persistent MAC session across F5 / reload / reinstall
 */
export function saveMacSession(sessionData) {
  if (typeof window === 'undefined' || !sessionData) return;
  try {
    const payload = JSON.stringify(sessionData);
    localStorage.setItem(MAC_SESSION_STORAGE_KEY, payload);
    localStorage.setItem(UNIFIED_SESSION_STORAGE_KEY, payload);

    if (sessionData.username && sessionData.password) {
      localStorage.setItem('nndd_active_xtream_config', JSON.stringify({
        host: sessionData.server_url || LIONOTT_PORT80_BASE,
        username: sessionData.username,
        password: sessionData.password,
        name: 'KOBIN TV Server',
        type: 'xtream'
      }));
    }

    window.dispatchEvent(new CustomEvent('kobin_mac_session_updated', { detail: sessionData }));
  } catch (e) {
    console.warn('[macAuthService] Save session error:', e);
  }
}

/**
 * Clear persistent MAC session
 */
export function clearMacSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MAC_SESSION_STORAGE_KEY);
    localStorage.removeItem(UNIFIED_SESSION_STORAGE_KEY);
    localStorage.removeItem('nndd_active_xtream_config');
    window.dispatchEvent(new CustomEvent('kobin_user_logged_out'));
  } catch (e) {}
}

/**
 * Authenticate MAC address directly against LionOTT Port 80 and synced reseller database
 * 
 * Connection Pipeline:
 * 1. Reseller Database Sync (Supabase devices table / /api/device/resolve-mac):
 *    If MAC is registered with active credentials, verify directly with LionOTT port 80.
 * 2. Direct MAG Portal Handshake against http://line.liondnscloud.ru:80/c/portal.php:
 *    Sends MAC cookie and queries profile.
 * 3. Direct Port 80 player_api.php?mac= query:
 *    Direct pre-flight check.
 */
export async function authenticateMacWithLionOtt(macAddress = null, forceRecheck = false) {
  const mac = sanitizeMacAddress(macAddress || getDeviceMacAddress());

  // Step 1: Return existing valid session if not forcing recheck
  if (!forceRecheck) {
    const existing = getSavedMacSession();
    if (existing && existing.macAddress === mac && existing.authorized) {
      return {
        authorized: true,
        session: existing,
        source: 'cached_session'
      };
    }
  }

  // Step 2: Query Backend / Supabase for assigned device line
  try {
    let matchedDevice = null;

    // Check direct Supabase query
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('mac_address', mac)
        .maybeSingle();

      if (!error && data) {
        matchedDevice = data;
      }
    } catch (e) {}

    // Check backend resolve-mac endpoint
    if (!matchedDevice) {
      try {
        const isCap = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const apiBase = (isCap || isLocal) ? 'https://kobin-tv.vercel.app' : '';

        const res = await universalFetch(`${apiBase}/api/device/resolve-mac`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mac_address: mac })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.device) {
            matchedDevice = data.device;
          }
        }
      } catch (e) {}
    }

    // If device is active with credentials, verify directly against LionOTT Port 80
    if (matchedDevice && matchedDevice.status === 'active' && matchedDevice.xtream_user && matchedDevice.xtream_pass) {
      const u = matchedDevice.xtream_user;
      const p = matchedDevice.xtream_pass;
      const targetServer = matchedDevice.server_url || LIONOTT_PORT80_BASE;

      try {
        const verifyRes = await universalFetch(
          `${targetServer}/player_api.php?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`
        );

        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          const userInfo = verifyData?.user_info;

          if (userInfo && userInfo.auth === 1 && userInfo.status?.toLowerCase() !== 'expired') {
            const expDate = userInfo.exp_date;
            const expIso = expDate && !isNaN(expDate) ? new Date(parseInt(expDate) * 1000).toISOString() : matchedDevice.expiresAt;

            const session = {
              authorized: true,
              macAddress: mac,
              username: u,
              password: p,
              server_url: targetServer,
              status: 'active',
              exp_date: expDate,
              expiresAt: expIso,
              app_expiry_date: expIso,
              activePlan: matchedDevice.activePlan || 'VIP Line',
              customerName: matchedDevice.customer_name || u,
              authMethod: 'mac_port80_direct',
              token: userInfo.token || `mac_tok_${Date.now()}`
            };

            saveMacSession(session);
            return {
              authorized: true,
              session,
              source: 'lionott_verified'
            };
          }
        }
      } catch (err) {
        console.warn('[macAuthService] Port 80 verify failed, using matched record:', err);
      }
    }
  } catch (err) {
    console.warn('[macAuthService] Pre-flight auth lookup error:', err);
  }

  // Step 3: Direct MAG Portal Handshake on LionOTT Port 80
  try {
    const handshakeUrl = `${LIONOTT_PORT80_BASE}/c/portal.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml`;
    const handshakeRes = await universalFetch(handshakeUrl, {
      headers: {
        'Cookie': `mac=${mac}`,
        'X-User-Agent': 'Model: MAG250; Link: WiFi'
      }
    });

    if (handshakeRes.ok) {
      const data = await handshakeRes.json();
      const token = data?.js?.token;

      if (token) {
        // Query profile for this MAC
        const profileUrl = `${LIONOTT_PORT80_BASE}/c/portal.php?type=stb&action=get_profile&token=${encodeURIComponent(token)}&JsHttpRequest=1-xml`;
        const profileRes = await universalFetch(profileUrl, {
          headers: {
            'Cookie': `mac=${mac}`,
            'X-User-Agent': 'Model: MAG250; Link: WiFi'
          }
        });

        if (profileRes.ok) {
          const profData = await profileRes.json();
          const prof = profData?.js;

          // If device is activated on portal, id > 0 and pass / login is provided
          if (prof && prof.id > 0 && (prof.pass || prof.sname || prof.login)) {
            const u = prof.sname || prof.login || mac;
            const p = prof.pass || '';
            const session = {
              authorized: true,
              macAddress: mac,
              username: u,
              password: p,
              server_url: LIONOTT_PORT80_BASE,
              status: 'active',
              authMethod: 'mag_portal_port80',
              token: token
            };

            saveMacSession(session);
            return {
              authorized: true,
              session,
              source: 'mag_portal_verified'
            };
          }
        }
      }
    }
  } catch (portalErr) {
    console.warn('[macAuthService] Direct portal check fallback:', portalErr);
  }

  // Step 4: Device is unauthorized / pending activation
  return {
    authorized: false,
    macAddress: mac,
    reason: 'unauthorized_mac',
    message: 'دەستگەیشتن ڕەتکرایەوە - ئامێرەکەت چالاک نەکراوە'
  };
}

/**
 * Construct direct upstream stream URL without proxy
 */
export function buildMacStreamUrl(type, username, password, streamId, extension = 'ts') {
  const u = encodeURIComponent(username || '');
  const p = encodeURIComponent(password || '');
  const id = encodeURIComponent(streamId || '');

  if (type === 'live') {
    return `${LIONOTT_PORT80_BASE}/live/${u}/${p}/${id}.${extension === 'm3u8' ? 'm3u8' : 'ts'}`;
  } else if (type === 'movie' || type === 'vod') {
    return `${LIONOTT_PORT80_BASE}/movie/${u}/${p}/${id}.${extension || 'mp4'}`;
  } else if (type === 'series') {
    return `${LIONOTT_PORT80_BASE}/series/${u}/${p}/${id}.${extension || 'mp4'}`;
  }
  return `${LIONOTT_PORT80_BASE}/live/${u}/${p}/${id}.ts`;
}
