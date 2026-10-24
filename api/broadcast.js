import { setZeroCacheHeaders } from './_lib.js';

// Dedicated Cloud Store object for KOBIN.Tv Broadcast Configuration
const BROADCAST_CLOUD_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a16e1a120b7ce4';

let memoryBroadcastConfig = null;

export default async function handler(req, res) {
  setZeroCacheHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch the synchronized broadcast config
  if (req.method === 'GET') {
    if (memoryBroadcastConfig) {
      return res.status(200).json({ success: true, config: memoryBroadcastConfig });
    }

    try {
      const resp = await fetch(BROADCAST_CLOUD_STORE_URL, { cache: 'no-store' });
      if (resp.ok) {
        const json = await resp.json();
        if (json.data && json.data.config) {
          memoryBroadcastConfig = json.data.config;
          return res.status(200).json({ success: true, config: json.data.config });
        }
      }
    } catch (err) {
      console.warn('[BroadcastAPI] Cloud fetch error:', err.message);
    }

    return res.status(200).json({ success: true, config: null });
  }

  // POST: Update the synchronized broadcast config
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const newConfig = body.config || body;

      if (!newConfig) {
        return res.status(400).json({ error: 'Missing broadcast config payload' });
      }

      memoryBroadcastConfig = newConfig;

      // Save to Cloud Store for multi-device sync
      try {
        await fetch(BROADCAST_CLOUD_STORE_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'KOBIN_BROADCAST_CONFIG_STORE',
            data: { config: newConfig, updated_at: new Date().toISOString() }
          })
        });
      } catch (e) {
        console.warn('[BroadcastAPI] Cloud save fallback:', e.message);
      }

      return res.status(200).json({ success: true, message: 'Broadcast config synced successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
