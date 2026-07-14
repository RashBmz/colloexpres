const CACHE_NAME = 'koloo-go-v11';
const PUBLIC_SITE_ORIGIN = 'https://colloexpres.onrender.com';
const STATIC_ASSETS = [
  '/css/main.css?v=fluid-5',
  '/js/i18n.js?v=ar-3',
  '/js/push.js?v=pwa-push-3',
  '/js/permissions.js?v=1',
  '/js/app-fast.js?v=fluid-5',
  '/images/splash/apple-splash-1170x2532.png',
  '/images/splash/apple-splash-1125x2436.png',
  '/images/splash/apple-splash-1242x2688.png',
  '/images/splash/apple-splash-1284x2778.png',
  '/images/splash/apple-splash-1290x2796.png',
  '/images/splash/apple-splash-1179x2556.png',
  '/images/splash/apple-splash-1080x1920.png',
  '/js/pwa.js?v=6',
  '/manifest.webmanifest',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        if (response.ok && url.pathname.match(/\.(css|js|png|jpg|jpeg|webp|svg|ico|webmanifest)$/)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Koloo Go';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/images/icons/icon-192.png',
    badge: payload.badge || '/images/icons/icon-192.png',
    tag: payload.tag || 'kolo-go',
    renotify: true,
    data: {
      url: payload.url || '/',
      orderId: payload.orderId || '',
      type: payload.type || '',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', PUBLIC_SITE_ORIGIN).href;

  event.waitUntil(
    clients.openWindow(targetUrl)
  );
});
