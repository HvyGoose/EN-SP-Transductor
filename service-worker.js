const CACHE_NAME = 'translator-v2';
// The service worker only controls URLs under its registration scope, so
// prefix all shell URLs with that scope's base path (e.g. /EN-SP-Transductor).
const BASE = self.registration.scope.replace(/\/$/, '');
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/guide.html',
  '/phrasebook.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
].map((p) => BASE + p);

const APP_SHELL_FALLBACK = BASE + '/';

const isSameOriginRequest = (requestUrl) => new URL(requestUrl).origin === self.location.origin;

const isStaticAssetRequest = (requestUrl) => {
  const url = new URL(requestUrl);
  const path = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) : null;
  if (!path) return false;
  return path.startsWith('/icons/') || ['/manifest.json', '/guide.html', '/phrasebook.json'].includes(path);
};

const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    const responseToCache = networkResponse.clone();
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, responseToCache);
  }
  return networkResponse;
};

const networkFirstNavigation = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const fallbackResponse = await caches.match(request);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    return caches.match(APP_SHELL_FALLBACK);
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  if (!isSameOriginRequest(event.request.url)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  if (isStaticAssetRequest(event.request.url)) {
    event.respondWith(cacheFirst(event.request));
  }
});
