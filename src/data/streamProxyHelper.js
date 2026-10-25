/**
 * Stream & Media Proxy Helper for KOBIN TV
 * Direct Native Streaming Mode: Always connects directly to stream sources
 * without any proxy dependencies.
 */

export const BLOCKED_IMAGE_HOSTS = [
  '103.176.90.154',
  '103.176.90.118',
  'pngimage.net',
  'iconarchive.com',
  'countryflags.com'
];

export function isNativeOrLocalEnvironment() {
  if (typeof window === 'undefined') return false;
  if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
    return true;
  }
  const host = window.location?.hostname || '';
  const proto = window.location?.protocol || '';
  if (
    proto === 'capacitor:' ||
    proto === 'ionic:' ||
    proto === 'file:' ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    navigator.userAgent.includes('Capacitor') ||
    navigator.userAgent.includes('AndroidTV')
  ) {
    return true;
  }
  return false;
}

export function getSafeImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (BLOCKED_IMAGE_HOSTS.some((host) => trimmed.includes(host))) {
    return null;
  }

  return trimmed;
}

export function getResolvedOrigin() {
  if (typeof window === 'undefined' || !window.location || !window.location.origin) {
    return 'http://localhost';
  }
  return window.location.origin;
}

export function buildProxiedStreamUrl(rawUrl) {
  return rawUrl || '';
}

export function getAbsoluteStreamProxyUrl(rawStreamUrl) {
  return rawStreamUrl || '';
}

export function getAbsoluteProxyUrl(rawUrl) {
  return rawUrl || '';
}

export function isProblematicHttpLogo(url) {
  return getSafeImageUrl(url) === null;
}

export function getSafeLogoUrl(rawLogoUrl, fallback = null) {
  const safe = getSafeImageUrl(rawLogoUrl);
  return safe || fallback;
}
