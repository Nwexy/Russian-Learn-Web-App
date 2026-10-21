/**
 * Russian Learn - Progressive Web App Service Worker
 * Offline-first onbellek mekanizmasi.
 */

const CACHE_NAME = 'russian-learn-v2';

// Ilk yuklemede onbellege alinacak temel statik kaynaklar
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/avatar.jpg',
  '/practice',
  '/review',
  '/grammar',
  '/settings'
];

// Service Worker yuklendiginde temel dosyalari onbellege al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Pre-cache partial error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Eski onbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Istekleri yakala ve onbellek / ag stratejisini uygula
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Sadece GET istekleri desteklenir
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Sadece ayni origin altindaki istekleri onbellekle
  if (url.origin !== self.location.origin) return;

  // Next.js dahili dosyalari, HMR, RSC (_rsc) ve API isteklerini yakalama (tarayiciya birak)
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('_rsc') ||
    request.headers.get('upgrade') === 'websocket'
  ) {
    return;
  }

  // Sayfa yonlendirmesi (navigation) istekleri icin: Once ag, basarisiz olursa onbellek
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/');
          if (fallback) return fallback;
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Statik dosyalar ve diger varliklar icin: Once onbellek, yoksa ag
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Arka planda agdan guncelle (stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, copy);
        }
        return networkResponse;
      } catch {
        const fallback = await caches.match(request);
        if (fallback) return fallback;
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })()
  );
});
