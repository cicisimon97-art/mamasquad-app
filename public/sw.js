const CACHE_NAME = 'mamasquads-v7';

// Install — skip waiting to activate immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate — clear all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — always go to network, no caching
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
