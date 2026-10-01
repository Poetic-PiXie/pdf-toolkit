// Offline support: serve from network when possible, fall back to the cache.
const CACHE = 'pdf-toolkit-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon.png',
  './vendor/pdf-lib.min.js', './vendor/jszip.min.js',
  './vendor/pdf.min.mjs', './vendor/pdf.worker.min.mjs'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
