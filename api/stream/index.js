import { Readable } from 'stream';

export default async function handler(req, res) {
  // Enable full CORS for any web or mobile client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing target url parameter' });
  }

  const isPlayerApi = url.includes('player_api.php');
  const isM3u8 = url.includes('.m3u8') || url.includes('type=m3u');
  const isTs = url.includes('.ts') || url.includes('/live/');

  try {
    const targetUrl = decodeURIComponent(url);
    const controller = new AbortController();
    // For live infinite streams (.ts), do not abort early
    const timeout = isTs && !isM3u8 
      ? setTimeout(() => controller.abort(), 120000) 
      : setTimeout(() => controller.abort(), 30000);

    const reqHeaders = {
      'User-Agent': 'IPTVSmartersPlayer',
      'Accept': '*/*',
      'Connection': 'keep-alive',
      'Referer': targetUrl
    };
    if (req.headers && req.headers['range']) {
      reqHeaders['Range'] = req.headers['range'];
    }

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: reqHeaders
    });

    clearTimeout(timeout);

    if (isPlayerApi && (response.status === 511 || response.status === 401 || response.status === 403 || response.status === 404)) {
      return res.status(200).json({
        user_info: {
          auth: 0,
          status: 'Disabled',
          message: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە، تکایە دڵنیابەرەوە لە زانیارییەکانت.'
        }
      });
    }

    const contentType = response.headers.get('content-type') || '';

    // 1. M3U8 Playlist Handling: Rewrite Segment URIs to route through /api/stream
    if (isM3u8 || contentType.includes('mpegurl') || contentType.includes('x-mpegURL')) {
      const text = await response.text();
      const baseUrl = new URL(response.url || targetUrl);
      const lines = text.split('\n');
      const rewritten = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        try {
          const resolved = new URL(trimmed, baseUrl).href;
          return `/api/stream?url=${encodeURIComponent(resolved)}`;
        } catch (e) {
          return line;
        }
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(rewritten);
    }

    // 2. Continuous Live MPEG-TS Stream or Segment: Pipe in real-time
    if (response.body && (isTs || contentType.includes('video') || contentType.includes('mp2t') || !response.headers.get('content-length'))) {
      res.setHeader('Content-Type', contentType || 'video/mp2t');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length'));
      }
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.on('error', () => {
        try { res.end(); } catch (e) {}
      });
      req.on('close', () => {
        try { nodeStream.destroy(); } catch (e) {}
      });
      return nodeStream.pipe(res);
    }

    // 3. Standard JSON or ArrayBuffer response
    res.setHeader('Content-Type', contentType || 'application/json');
    const buffer = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(buffer));
  } catch (err) {
    if (isPlayerApi) {
      return res.status(200).json({
        user_info: {
          auth: 0,
          status: 'Disabled',
          message: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە، تکایە دڵنیابەرەوە لە زانیارییەکانت.'
        }
      });
    }

    return res.status(500).json({
      error: `Stream fetch failed: ${err.message}`,
      targetUrl: url
    });
  }
}
