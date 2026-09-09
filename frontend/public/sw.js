/**
 * Skyronet Field Tracking — Service Worker
 * Handles PWA caching and triggers an update notification
 * when a new version of the app is deployed.
 *
 * CACHE_VERSION is updated on every new deploy so the browser
 * always detects this file as changed and installs the new SW.
 */

const CACHE_VERSION = 'skyronet-v3';
const CACHE_NAME = CACHE_VERSION;

// On install — skip waiting immediately so this SW moves to "waiting" state
// The app will show a prompt; on user confirmation it calls SKIP_WAITING.
self.addEventListener('install', (event) => {
  console.log('[SW] Installing:', CACHE_NAME);
  // Do NOT call skipWaiting() here — let the app's UpdatePrompt control it.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache the app shell
      return cache.addAll(['/']);
    }).catch(() => { /* ignore pre-cache errors */ })
  );
});

// On activate — clean up ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
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
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
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

// Listen for message from the app to skip waiting and activate new SW
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting — activating new version.');
    self.skipWaiting();
  }
});
