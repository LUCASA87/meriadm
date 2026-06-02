const CACHE_NAME = 'meri-admin-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/admin.css',
  './js/config.js',
  './js/api.js',
  './js/image-avif.js',
  './js/admin.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Cormorant+Garamond:wght@600&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (url.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.method !== 'GET') return;

  const isModule = url.includes('/js/') && url.endsWith('.js');

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && (url.startsWith(self.location.origin) || url.includes('fonts.googleapis.com'))) {
          if (!isModule) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((r) => r || caches.match('./index.html'))
      )
  );
});
