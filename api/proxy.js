export default async function handler(req, res) {
  // Enable full CORS for any web or mobile client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing target url parameter' });
  }

  const isPlayerApi = url.includes('player_api.php');

  try {
    const targetUrl = decodeURIComponent(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for large channel lists

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Linux; Android 12)',
        'Accept': '*/*'
      }
    });

    clearTimeout(timeout);

    // If upstream returns 511 / 401 / 403 / 404 for player_api, it's an Xtream authentication failure
    // Return standard HTTP 200 with auth: 0 so client gracefully reports invalid credentials instead of Network Crash
    if (isPlayerApi && (response.status === 511 || response.status === 401 || response.status === 403 || response.status === 404)) {
      return res.status(200).json({
        user_info: {
          auth: 0,
          status: 'Disabled',
          message: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە، تکایە دڵنیابەرەوە لە زانیارییەکانت.'
        }
      });
    }

    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);

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
      error: `Proxy fetch failed: ${err.message}`,
      targetUrl: url
    });
  }
}
