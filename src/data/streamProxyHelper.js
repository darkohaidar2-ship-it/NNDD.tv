/**
 * Stream & Media Proxy Helper for KOBIN TV / NNDD TV
 * Ensures all stream proxy URLs and media picon URLs are absolute, robust,
 * and immune to Mixed Content or CORS blocks.
 */

export function getResolvedOrigin() {
  if (typeof window === 'undefined' || !window.location || !window.location.origin) {
    return 'https://nndd-tv.vercel.app';
  }
  const org = window.location.origin;
  // If running in Capacitor Webview (capacitor://localhost), Ionic, or dev localhost:
  if (
    org.includes('capacitor://') ||
    org.includes('ionic://') ||
    org.includes('localhost') ||
    org.includes('127.0.0.1')
  ) {
    return 'https://nndd-tv.vercel.app';
  }
  return org;
}

/**
 * Construct an Absolute URL for /api/stream proxy.
 * Resolves issue: relative URLs failing inside web workers or native fetch calls.
 */
export function getAbsoluteStreamProxyUrl(rawStreamUrl) {
  if (!rawStreamUrl) return '';
  const origin = getResolvedOrigin();
  return `${origin}/api/stream?url=${encodeURIComponent(rawStreamUrl)}`;
}

/**
 * Construct an Absolute URL for /api/proxy.
 */
export function getAbsoluteProxyUrl(rawUrl) {
  if (!rawUrl) return '';
  const origin = getResolvedOrigin();
  return `${origin}/api/proxy?url=${encodeURIComponent(rawUrl)}`;
}

/**
 * Check if an image URL comes from an insecure raw IP or HTTP source that could trigger
 * ERR_CONNECTION_REFUSED or Mixed Content on HTTPS.
 */
export function isProblematicHttpLogo(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:') || url.startsWith('/')) return false;

  // Raw HTTP IP addresses (e.g. http://103.176.90.154/...)
  const isHttpIp = /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(url);
  if (isHttpIp) return true;

  // Insecure HTTP on an HTTPS page
  const isHttpsPage = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  if (isHttpsPage && url.startsWith('http:')) {
    return true;
  }

  return false;
}

/**
 * Return a safe, CORS-friendly, Mixed-Content-safe image URL with fallback.
 */
export function getSafeLogoUrl(rawLogoUrl, fallback = '/kobin-logo.png') {
  if (!rawLogoUrl) return fallback;
  const clean = String(rawLogoUrl).trim();
  if (!clean) return fallback;

  // Local assets or base64 are always safe
  if (clean.startsWith('/') || clean.startsWith('data:')) {
    return clean;
  }

  // If problematic HTTP IP on HTTPS, proxy it via /api/proxy or use fallback
  if (isProblematicHttpLogo(clean)) {
    const origin = getResolvedOrigin();
    return `${origin}/api/proxy?url=${encodeURIComponent(clean)}`;
  }

  return clean;
}
