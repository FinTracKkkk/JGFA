const CACHE = 'fa-register-v2';
// Only truly static, rarely-changing assets get cache-first treatment.
const STATIC_ASSETS = ['./assets/icon-192.png', './assets/icon-512.png', './assets/icon-180.png', './assets/jg-logo.jpg', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  const isStaticAsset = STATIC_ASSETS.some(a => url.includes(a.replace('./', '')));

  if (isStaticAsset) {
    // Cache-first: these rarely change, safe to serve instantly from cache.
    e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
    return;
  }

  // Everything else (index.html, app.js, config.js, styles.css, CDN libs,
  // Supabase calls) is network-first: always try to get the freshest code,
  // only fall back to a cached copy if the network request fails entirely
  // (offline). This prevents a broken/stale version ever getting stuck.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok && e.request.method === 'GET' && url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
