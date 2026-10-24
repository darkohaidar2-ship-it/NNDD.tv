import {
  setZeroCacheHeaders,
  getCategoryOverrides,
  upsertCategoryOverride,
  getCustomCategories,
  upsertCustomCategory,
  deleteCustomCategory,
  getChannelOverrides,
  upsertChannelOverride,
  HARDCODED_UPSTREAM_SERVER
} from './_lib.js';

export default async function handler(req, res) {
  setZeroCacheHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { type = 'live' } = req.query;

    if (req.method === 'GET') {
      const [overrides, customCats, channelOverrides] = await Promise.all([
        getCategoryOverrides(type),
        getCustomCategories(type),
        getChannelOverrides()
      ]);

      return res.status(200).json({
        success: true,
        type,
        overrides,
        customCategories: customCats,
        channelOverrides
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { action } = body;

      if (action === 'override') {
        const saved = await upsertCategoryOverride(body.override);
        return res.status(200).json({ success: true, data: saved });
      }

      if (action === 'bulk_overrides') {
        const list = body.overrides || [];
        const savedList = [];
        for (const item of list) {
          const s = await upsertCategoryOverride(item);
          savedList.push(s);
        }
        return res.status(200).json({ success: true, count: savedList.length, data: savedList });
      }

      if (action === 'custom') {
        const saved = await upsertCustomCategory(body.category);
        return res.status(200).json({ success: true, data: saved });
      }

      if (action === 'delete_custom') {
        await deleteCustomCategory(body.id);
        return res.status(200).json({ success: true, id: body.id });
      }

      if (action === 'channel') {
        const saved = await upsertChannelOverride(body.override);
        return res.status(200).json({ success: true, data: saved });
      }

      if (action === 'fetch_upstream') {
        const catType = body.type || 'live';
        const host = (body.server_url || HARDCODED_UPSTREAM_SERVER).replace(/\/+$/, '');
        const user = body.username || '292c8215';
        const pass = body.password || 'adef5d6e';

        const apiAction = catType === 'movie' || catType === 'vod' 
          ? 'get_vod_categories' 
          : catType === 'series' 
          ? 'get_series_categories' 
          : 'get_live_categories';

        const upstreamUrl = `${host}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&action=${apiAction}`;
        const uRes = await fetch(upstreamUrl, {
          headers: { 'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Linux; Android 12)', 'Cache-Control': 'no-cache' }
        });

        if (!uRes.ok) {
          return res.status(uRes.status).json({ success: false, error: `Upstream HTTP ${uRes.status}` });
        }

        const rawCategories = await uRes.json();
        return res.status(200).json({ success: true, categories: rawCategories });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[API /bouquet error]:', err);
    return res.status(500).json({ error: err.message });
  }
}
