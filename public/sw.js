// client/public/sw.js
const CACHE_NAME = 'app-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// Install: cache shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: cleanup
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve())
    ))
  );
});

// Fetch: simple cache-first
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/models/')) return; // let network serve models
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))
  );
});
