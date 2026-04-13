const CACHE_NAME = 'hlp-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Limpiar caches viejos
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // Network-first para todo: siempre pide al servidor, cachea la respuesta,
  // y solo usa cache si esta offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
