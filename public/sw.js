/**
 * Russian Learn - Progressive Web App Service Worker
 * Offline-first onbellek mekanizmasi.
 */

const CACHE_NAME = 'russian-learn-v1';

// Ilk yuklemede onbellege alinacak temel statik kaynaklar
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
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
          return caches.match('/');
        })
    );
    return;
  }

  // Statik dosyalar ve diger varliklar icin: Once onbellek, yoksa ag
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Arka planda guncelle (stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request);
        });
    })
  );
});
