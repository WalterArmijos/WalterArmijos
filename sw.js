/**
 * Offline support. Cache-first for the app shell so the gym's dead spot
 * never stops a workout; network-first refresh in the background.
 */
const CACHE = 'ironlog-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css',
  './js/app.js', './js/router.js', './js/store.js', './js/db.js',
  './js/ui.js', './js/charts.js', './js/theme.js',
  './js/data/exercises.js', './js/data/templates.js',
  './js/views/home.js', './js/views/templates.js', './js/views/session.js',
  './js/views/history.js', './js/views/progress.js', './js/views/settings.js',
  './js/views/picker.js',
  './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(request).then(hit => {
      const net = fetch(request)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
