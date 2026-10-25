/**
 * Stream & Media Proxy Helper for KOBIN TV / NNDD TV
 * Ensures all stream proxy URLs and media picon URLs are absolute, robust,
 * and immune to Mixed Content, CORS blocks, or 500 errors.
 */

export const BLOCKED_IMAGE_HOSTS = [
  '103.176.90.154',
  '103.176.90.118',
  'pngimage.net',
  'iconarchive.com',
  'countryflags.com'
];

/**
 * Strict image URL sanitizer that blocks dead/CORS-broken servers immediately
 * before the browser makes a network request, preventing Mixed Content and console errors.
 */
export function getSafeImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Block known dead / CORS-broken hosts
  if (BLOCKED_IMAGE_HOSTS.some((host) => trimmed.includes(host))) {
    return null;
  }

  // Prevent Mixed Content on HTTPS by rejecting raw HTTP IP / HTTP logos
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && trimmed.startsWith('http://')) {
    return null;
  }

  return trimmed;
}

export function getResolvedOrigin() {
  if (typeof window === 'undefined' || !window.location || !window.location.origin) {
    return 'https://nndd-tv.vercel.app';
  }
  const org = window.location.origin;
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
export function buildProxiedStreamUrl(rawUrl) {
  if (!rawUrl) return '';
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && rawUrl.startsWith('http://')) {
    const origin = getResolvedOrigin();
    return `${origin}/api/stream?url=${encodeURIComponent(rawUrl)}`;
  }
  return rawUrl;
}

export function getAbsoluteStreamProxyUrl(rawStreamUrl) {
  return buildProxiedStreamUrl(rawStreamUrl);
}

export function getAbsoluteProxyUrl(rawUrl) {
  if (!rawUrl) return '';
  const origin = getResolvedOrigin();
  return `${origin}/api/proxy?url=${encodeURIComponent(rawUrl)}`;
}

export function isProblematicHttpLogo(url) {
  return getSafeImageUrl(url) === null;
}

export function getSafeLogoUrl(rawLogoUrl, fallback = null) {
  const safe = getSafeImageUrl(rawLogoUrl);
  return safe || fallback;
}
