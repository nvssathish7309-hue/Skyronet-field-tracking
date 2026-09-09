/**
 * Skyronet Field Tracking — Service Worker
 * Handles PWA caching and triggers an update notification
 * when a new version of the app is deployed.
 */

const CACHE_NAME = 'skyronet-v' + self.registration.scope;

// On install — cache the app shell
self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates immediately on next reload
  // but we intentionally do NOT call skipWaiting() here so the
  // user sees the "Update Available" prompt first.
  console.log('[SW] Installing new version...');
});

// On activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  console.log('[SW] Activated.');
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API / socket calls — always go to network
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache the fresh response
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        // Network failed → serve from cache
        caches.match(event.request)
      )
  );
});

// Listen for message from the app to skip waiting and reload
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
