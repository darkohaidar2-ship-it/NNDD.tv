import { 
  setZeroCacheHeaders, 
  getDeviceByMac, 
  normalizeMac, 
  HARDCODED_UPSTREAM_SERVER,
  getCategoryOverrides,
  getCustomCategories,
  getChannelOverrides
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

    // -------------------------------------------------------------------------
    // 1. CATEGORY REQUESTS: get_live_categories, get_vod_categories, get_series_categories
    // -------------------------------------------------------------------------
    if (targetAction === 'get_live_categories' || targetAction === 'get_vod_categories' || targetAction === 'get_series_categories') {
      const catType = targetAction === 'get_vod_categories' ? 'movie' : targetAction === 'get_series_categories' ? 'series' : 'live';

      // Fetch upstream categories
      const upstreamUrl = `${serverUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=${targetAction}`;
      let upstreamCategories = [];
      try {
        const ures = await fetch(upstreamUrl, {
          headers: { 'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Linux; Android 12)', 'Cache-Control': 'no-cache' }
        });
        if (ures.ok) {
          const json = await ures.json();
          if (Array.isArray(json)) upstreamCategories = json;
        }
      } catch (e) {
        console.warn('[Xtream Proxy] Upstream categories fetch error:', e.message);
      }

      // Fetch DB Overrides & Custom Virtual Bouquets
      const [overrides, customCats] = await Promise.all([
        getCategoryOverrides(catType),
        getCustomCategories(catType)
      ]);

      const overrideMap = new Map();
      overrides.forEach(o => overrideMap.set(String(o.upstream_category_id), o));

      const processed = [];

      // 1. Process upstream categories (apply hide, custom rename, sort order)
      for (const cat of upstreamCategories) {
        const ov = overrideMap.get(String(cat.category_id));
        if (ov && ov.is_visible === false) {
          // Hidden by admin - filter out!
          continue;
        }

        processed.push({
          category_id: String(cat.category_id),
          category_name: (ov && ov.custom_name && ov.custom_name.trim()) ? ov.custom_name.trim() : cat.category_name,
          parent_id: cat.parent_id || 0,
          is_custom: false,
          sort_order: ov?.sort_order !== undefined ? ov.sort_order : 100
        });
      }

      // 2. Add visible Custom Categories (Virtual Bouquets)
      for (const b of customCats) {
        if (b.is_visible === false) continue;
        processed.push({
          category_id: `custom_${b.id}`,
          category_name: `${b.icon ? b.icon + ' ' : ''}${b.name}`,
          parent_id: 0,
          is_custom: true,
          sort_order: b.sort_order !== undefined ? b.sort_order : 10
        });
      }

      // 3. Sort by sort_order ASC, then alphabetical category_name
      processed.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.category_name.localeCompare(b.category_name);
      });

      return res.status(200).json(processed);
    }

    // -------------------------------------------------------------------------
    // 2. STREAMS REQUESTS: Check for Virtual Bouquet (custom_...)
    // -------------------------------------------------------------------------
    const isVirtualBouquet = category_id && String(category_id).startsWith('custom_');

    if (isVirtualBouquet && (targetAction === 'get_live_streams' || targetAction === 'get_vod_streams' || targetAction === 'get_series')) {
      const bouquetId = String(category_id).replace(/^custom_/, '');
      const catType = targetAction === 'get_vod_streams' ? 'movie' : targetAction === 'get_series' ? 'series' : 'live';

      const [customCats, channelOverrides] = await Promise.all([
        getCustomCategories(catType),
        getChannelOverrides()
      ]);

      const bouquet = customCats.find(b => b.id === bouquetId || `custom_${b.id}` === category_id);
      const targetStreamIds = new Set((bouquet?.stream_ids || []).map(String));

      // Fetch all streams of this type from upstream to filter for the bouquet
      const allStreamsUrl = `${serverUrl}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=${targetAction}`;
      const sRes = await fetch(allStreamsUrl, {
        headers: { 'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Linux; Android 12)', 'Cache-Control': 'no-cache' }
      });

      if (!sRes.ok) {
        return res.status(sRes.status).json({ error: `Upstream returned HTTP ${sRes.status}` });
      }

      const allStreams = await sRes.json();
      const chanOvMap = new Map();
      channelOverrides.forEach(c => chanOvMap.set(String(c.stream_id), c));

      const filtered = [];
      if (Array.isArray(allStreams)) {
        for (const stream of allStreams) {
          const sId = String(stream.stream_id);
          if (!targetStreamIds.has(sId)) continue;

          const chOv = chanOvMap.get(sId);
          if (chOv && chOv.is_hidden) continue;

          filtered.push({
            ...stream,
            name: chOv?.custom_name?.trim() ? chOv.custom_name.trim() : stream.name,
            stream_icon: chOv?.custom_logo?.trim() ? chOv.custom_logo.trim() : stream.stream_icon,
            category_id: category_id,
            playback_url_ts: `${serverUrl}/live/${user}/${pass}/${stream.stream_id}.ts`,
            playback_url_m3u8: `${serverUrl}/live/${user}/${pass}/${stream.stream_id}.m3u8`
          });
        }
      }

      return res.status(200).json(filtered);
    }

    // -------------------------------------------------------------------------
    // 3. STANDARD UPSTREAM PROXY (Live streams, VOD, EPG, etc.)
    // -------------------------------------------------------------------------
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

    // If streams list is returned, apply channel overrides & enrich with TS/M3U8 URLs
    if (Array.isArray(data) && targetAction === 'get_live_streams') {
      const [categoryOverrides, channelOverrides] = await Promise.all([
        getCategoryOverrides('live'),
        getChannelOverrides()
      ]);

      const hiddenCatIds = new Set(
        categoryOverrides.filter(o => o.is_visible === false).map(o => String(o.upstream_category_id))
      );
      const chanOvMap = new Map();
      channelOverrides.forEach(c => chanOvMap.set(String(c.stream_id), c));

      const enriched = [];
      for (const stream of data) {
        // If category is hidden and no specific category was requested, filter it out
        if (!category_id && stream.category_id && hiddenCatIds.has(String(stream.category_id))) {
          continue;
        }

        const chOv = chanOvMap.get(String(stream.stream_id));
        if (chOv && chOv.is_hidden) {
          continue;
        }

        enriched.push({
          ...stream,
          name: chOv?.custom_name?.trim() ? chOv.custom_name.trim() : stream.name,
          stream_icon: chOv?.custom_logo?.trim() ? chOv.custom_logo.trim() : stream.stream_icon,
          playback_url_ts: `${serverUrl}/live/${user}/${pass}/${stream.stream_id}.ts`,
          playback_url_m3u8: `${serverUrl}/live/${user}/${pass}/${stream.stream_id}.m3u8`
        });
      }

      return res.status(200).json(enriched);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('[API /xtream error]:', err);
    return res.status(500).json({ error: `Proxy failure: ${err.message}` });
  }
}
