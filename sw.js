const CACHE_NAME = 'meri-admin-v9';

function scopeBase() {
  return new URL('./', self.location.href).href;
}

const SHELL = [
  'index.html',
  'manifest.json',
  'css/admin.css',
  'js/config.js',
  'js/api.js',
  'js/image-compress.js',
  'js/image-avif.js',
  'js/admin.js',
  'js/admin.bundle.js',
  'icons/icon.svg',
];

async function cacheShell(cache) {
  const root = scopeBase();
  for (const file of SHELL) {
    try {
      await cache.add(new URL(file, root).href);
    } catch {
      /* ignora recurso ausente sem derrubar o resto */
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cacheShell));
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

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          response.ok &&
          (url.startsWith(self.location.origin) || url.includes('fonts.googleapis.com'))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        const root = scopeBase();
        return caches.match(event.request).then(
          (r) => r || caches.match(new URL('index.html', root).href)
        );
      })
  );
});
