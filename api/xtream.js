import { 
  setZeroCacheHeaders, 
  getDeviceByMac, 
  normalizeMac, 
  HARDCODED_UPSTREAM_SERVER 
} from './_lib.js';

export default async function handler(req, res) {
  setZeroCacheHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Support parameters via query string OR path rewrites
    const { 
      mac_address: qMac, 
      action: qAction, 
      category_id, 
      series_id, 
      vod_id,
      stream_id 
    } = req.query;

    let mac = qMac;
    let action = qAction;

    // Handle path like /api/xtream/DA:B1:.../get_live_streams if passed via URL
    if (!mac || !action) {
      const urlParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
      // urlParts might be ['api', 'xtream', 'DA:B1:...', 'get_live_streams']
      if (urlParts.length >= 4 && urlParts[1] === 'xtream') {
        mac = decodeURIComponent(urlParts[2]);
        action = urlParts[3];
      }
    }

    if (!mac) {
      return res.status(400).json({ error: 'Missing mac_address parameter' });
    }

    const normMac = normalizeMac(mac);
    const device = await getDeviceByMac(normMac);

    if (!device) {
      return res.status(404).json({ error: 'Device not registered. Please register MAC address first.' });
    }

    if (device.status === 'banned') {
      return res.status(403).json({ error: 'Device is banned.' });
    }

    if (!device.xtream_user || !device.xtream_pass) {
      return res.status(402).json({ 
        error: 'Device has no active LionOTT line assigned. Please contact Admin.',
        status: device.status 
      });
    }

    // Default action to get_live_categories if none specified
    const targetAction = action || 'get_live_categories';
    const serverUrl = (device.server_url || HARDCODED_UPSTREAM_SERVER).replace(/\/+$/, '');
    const { xtream_user: user, xtream_pass: pass } = device;

    // Build upstream player_api.php request URL
    const queryParams = new URLSearchParams();
    queryParams.set('username', user);
    queryParams.set('password', pass);
    queryParams.set('action', targetAction);

    if (category_id) queryParams.set('category_id', category_id);
    if (series_id) queryParams.set('series_id', series_id);
    if (vod_id) queryParams.set('vod_id', vod_id);
    if (stream_id) queryParams.set('stream_id', stream_id);

    const upstreamUrl = `${serverUrl}/player_api.php?${queryParams.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const upstreamRes = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Linux; Android 12)',
        'Cache-Control': 'no-cache',
        'Accept': 'application/json, */*'
      }
    });

    clearTimeout(timeout);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: `Upstream LionOTT server returned HTTP ${upstreamRes.status}`
      });
    }

    const data = await upstreamRes.json();

    // If streams list is returned, enrich each stream with direct TS and M3U8 playback URLs
    if (Array.isArray(data) && targetAction === 'get_live_streams') {
      const enriched = data.map(stream => ({
        ...stream,
        playback_url_ts: `${serverUrl}/live/${user}/${pass}/${stream.stream_id}.ts`,
        playback_url_m3u8: `${serverUrl}/live/${user}/${pass}/${stream.stream_id}.m3u8`
      }));
      return res.status(200).json(enriched);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('[API /xtream error]:', err);
    return res.status(500).json({ error: `Proxy failure: ${err.message}` });
  }
}
