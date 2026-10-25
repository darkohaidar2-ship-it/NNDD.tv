import { Readable } from 'stream';

/**
 * Robust fetch helper that follows 301/302/303/307/308 redirects manually,
 * strictly preserving 'User-Agent: IPTVSmartersPlayer' and 'Range' headers across LionOTT edge servers.
 */
async function fetchWithRedirects(initialUrl, headers, signal, maxRedirects = 5) {
  let currentUrl = initialUrl;
  let response;

  for (let i = 0; i < maxRedirects; i++) {
    response = await fetch(currentUrl, {
      signal,
      redirect: 'manual',
      headers: {
        ...headers,
        'Referer': currentUrl
      }
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) break;
      currentUrl = new URL(location, currentUrl).href;
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  return { response, finalUrl: currentUrl };
}

export default async function handler(req, res) {
  // 1. Enable Full Open CORS & Media Streaming Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, Accept-Ranges');
  res.setHeader('Accept-Ranges', 'bytes');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing target url parameter' });
  }

  let targetUrl = url;
  try {
    if (targetUrl.includes('%3A') || targetUrl.includes('%2F') || targetUrl.includes('%3a') || targetUrl.includes('%2f')) {
      targetUrl = decodeURIComponent(targetUrl);
    }
  } catch (e) {}

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid URL protocol: must start with http:// or https://' });
  }

  const isImageOrLogo = (
    /\.(png|jpe?g|webp|svg|gif|ico)(\?.*)?$/i.test(targetUrl) ||
    targetUrl.includes('/picon/') ||
    targetUrl.includes('picon') ||
    targetUrl.includes('103.176.90.118') ||
    targetUrl.includes('103.176.90.154') ||
    (req.headers.accept && req.headers.accept.includes('image/'))
  );

  // If targeting known dead / blocked raw IPTV picon servers, bypass immediately with generic fallback!
  if (targetUrl.includes('103.176.90.118') || targetUrl.includes('103.176.90.154')) {
    return res.redirect(302, '/kobin-logo.png');
  }

  const isPlayerApi = targetUrl.includes('player_api.php');
  const isM3u8 = targetUrl.includes('.m3u8') || targetUrl.includes('type=m3u');
  const isTs = targetUrl.includes('.ts') || targetUrl.includes('/live/');

  try {
    const controller = new AbortController();
    // For live infinite streams (.ts), allow up to 120s; for images/api, 15s timeout
    const timeoutMs = isTs && !isM3u8 ? 120000 : (isImageOrLogo ? 12000 : 30000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const reqHeaders = {
      'User-Agent': 'IPTVSmartersPlayer',
      'Accept': isImageOrLogo ? 'image/*,*/*' : '*/*',
      'Connection': 'keep-alive'
    };
    if (req.headers && req.headers['range']) {
      reqHeaders['Range'] = req.headers['range'];
    }

    const { response, finalUrl } = await fetchWithRedirects(targetUrl, reqHeaders, controller.signal, 5);
    clearTimeout(timeout);

    if (!response) {
      if (isImageOrLogo) return res.redirect(302, '/kobin-logo.png');
      return res.status(502).json({ error: 'Failed to establish connection to upstream server' });
    }

    // Handle authentication failures gracefully for player_api
    if (isPlayerApi && (response.status === 511 || response.status === 401 || response.status === 403 || response.status === 404)) {
      return res.status(200).json({
        user_info: {
          auth: 0,
          status: 'Disabled',
          message: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە، تکایە دڵنیابەرەوە لە زانیارییەکانت.'
        }
      });
    }

    // If image upstream returned error (404/403/500/etc.), safely redirect to fallback logo
    if (isImageOrLogo && !response.ok) {
      return res.redirect(302, '/kobin-logo.png');
    }

    const contentType = response.headers.get('content-type') || '';

    // Handle HEAD preflights
    if (req.method === 'HEAD') {
      res.setHeader('Content-Type', contentType || (isM3u8 ? 'application/vnd.apple.mpegurl' : 'video/mp2t'));
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length'));
      }
      return res.status(200).end();
    }

    // Determine current proxy origin for absolute URL rewriting
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'nndd-tv.vercel.app';
    const proxyOrigin = `${proto}://${host}`;

    // 2. M3U8 Playlist Handling: Rewrite Segment URIs using ABSOLUTE URLs
    if (isM3u8 || contentType.includes('mpegurl') || contentType.includes('x-mpegURL')) {
      const text = await response.text();
      const baseUrl = new URL(finalUrl || targetUrl);
      const lines = text.split('\n');
      const rewritten = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        try {
          const resolved = new URL(trimmed, baseUrl).href;
          return `${proxyOrigin}/api/proxy?url=${encodeURIComponent(resolved)}`;
        } catch (e) {
          return line;
        }
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(rewritten);
    }

    // 3. Continuous Live MPEG-TS Stream or Segment: Pipe in real-time
    if (response.body && (isTs || contentType.includes('video') || contentType.includes('mp2t') || !response.headers.get('content-length'))) {
      res.setHeader('Content-Type', contentType || 'video/mp2t');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length'));
      }
      if (response.headers.get('content-range')) {
        res.setHeader('Content-Range', response.headers.get('content-range'));
      }

      try {
        const nodeStream = Readable.fromWeb(response.body);
        nodeStream.on('error', () => {
          try { res.end(); } catch (e) {}
        });
        req.on('close', () => {
          try { nodeStream.destroy(); } catch (e) {}
        });
        return nodeStream.pipe(res);
      } catch (streamErr) {
        const buffer = await response.arrayBuffer();
        return res.status(response.status || 200).send(Buffer.from(buffer));
      }
    }

    // 4. Standard JSON, Images, or ArrayBuffer response
    res.setHeader('Content-Type', contentType || (isImageOrLogo ? 'image/png' : 'application/octet-stream'));
    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'));
    }
    const buffer = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(buffer));

  } catch (err) {
    if (isImageOrLogo) {
      // BROWSER & CORS SHIELD: Never return 500 for broken images!
      return res.redirect(302, '/kobin-logo.png');
    }

    if (isPlayerApi) {
      return res.status(200).json({
        user_info: {
          auth: 0,
          status: 'Disabled',
          message: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە، تکایە دڵنیابەرەوە لە زانیارییەکانت.'
        }
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(502).json({
      error: `Proxy fetch failed: ${err.message}`,
      targetUrl: url
    });
  }
}
