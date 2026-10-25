import { Readable } from 'stream';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Quick bypass for dead picon servers
  if (targetUrl.includes('103.176.90.118') || targetUrl.includes('103.176.90.154')) {
    return res.redirect(302, '/kobin-logo.png');
  }

  try {
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    const upstream = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'IPTVSmartersPlayer',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      }
    });

    if (!upstream.ok) {
      if (/\.(png|jpe?g|webp|svg|gif|ico)$/i.test(targetUrl)) {
        return res.redirect(302, '/kobin-logo.png');
      }
      return res.status(upstream.status).end();
    }

    const contentType = upstream.headers.get('content-type') || '';
    const finalUrl = upstream.url || targetUrl;

    // Handle HLS Manifest (.m3u8) -> Rewrite relative chunk/sub-playlist URLs to absolute proxied URLs
    if (
      contentType.includes('mpegurl') ||
      targetUrl.includes('.m3u8') ||
      finalUrl.includes('.m3u8')
    ) {
      const text = await upstream.text();
      const baseUrl = new URL(finalUrl);
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'nndd-tv.vercel.app';
      const origin = `${protocol}://${host}`;

      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          try {
            const resolvedUrl = new URL(trimmed, baseUrl).href;
            return `${origin}/api/stream?url=${encodeURIComponent(resolvedUrl)}`;
          } catch {
            return line;
          }
        })
        .join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.status(200).send(rewritten);
    }

    // Handle Live MPEG-TS (.ts) or video chunks -> Pipe directly without buffering in memory
    res.setHeader('Content-Type', contentType || 'video/mp2t');
    res.setHeader('Cache-Control', 'no-cache, no-transform');

    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.on('error', () => res.end());
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Upstream stream error' });
    } else {
      res.end();
    }
  }
}
