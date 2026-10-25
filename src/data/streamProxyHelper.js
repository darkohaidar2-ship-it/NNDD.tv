/**
 * Stream & Media Proxy Helper for KOBIN TV / NNDD TV
 * Ensures all stream proxy URLs and media picon URLs are absolute, robust,
 * and immune to Mixed Content, CORS blocks, or 500 errors.
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
 * Check if an image URL comes from an insecure raw IP or HTTP source that triggers
 * ERR_CONNECTION_REFUSED, 500 errors, or Mixed Content on HTTPS.
 */
export function isProblematicHttpLogo(url) {
  if (!url || typeof url !== 'string') return true;
  const clean = url.trim();
  if (!clean) return true;
  if (clean.startsWith('data:') || clean.startsWith('/')) return false;

  // Banned / dead raw IPTV picon servers (e.g. 103.176.90.118, 103.176.90.154)
  if (
    clean.includes('103.176.90.118') ||
    clean.includes('103.176.90.154') ||
    /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(clean)
  ) {
    return true;
  }

  // Insecure HTTP on an HTTPS page
  const isHttpsPage = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  if (isHttpsPage && clean.startsWith('http:')) {
    return true;
  }

  return false;
}

/**
 * Return a safe, CORS-friendly, Mixed-Content-safe image URL with fallback.
 * Automatically sanitizes and bypasses dead raw IP logos with generic fallback icon.
 */
export function getSafeLogoUrl(rawLogoUrl, fallback = '/kobin-logo.png') {
  if (!rawLogoUrl) return fallback;
  const clean = String(rawLogoUrl).trim();
  if (!clean) return fallback;

  // Local assets or base64 are always safe
  if (clean.startsWith('/') || clean.startsWith('data:')) {
    return clean;
  }

  // If problematic HTTP IP or dead IPTV host, bypass immediately with generic fallback icon
  if (isProblematicHttpLogo(clean)) {
    return fallback;
  }

  return clean;
}
