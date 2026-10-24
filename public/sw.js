// KOBIN.Tv Service Worker (v2 - Network First for Fresh Code)
const CACHE_NAME = 'kobin-tv-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/kobin-logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Bypass cache for streams, live video chunks, API requests, and APK downloads
  if (
    url.includes('.m3u8') || 
    url.includes('.ts') || 
    url.includes('.mp4') || 
    url.includes('stream') || 
    url.includes('play/live') ||
    url.includes('/api/') ||
    url.includes('.apk')
  ) {
    return;
  }

  // 2. Network-first strategy for navigation / HTML documents (Zero Stale UI)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
