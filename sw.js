const CACHE = 'fa-register-v1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './config.js', './manifest.json',
  './assets/icon-192.png', './assets/icon-512.png', './assets/icon-180.png', './assets/jg-logo.jpg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Network-first for Supabase/API calls, cache-first for the app shell
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (url.includes('supabase.co') || url.includes('cdnjs.cloudflare.com') || url.includes('unpkg.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
