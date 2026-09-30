/* SuitPoke — service worker: shell cacheada (PWA offline para modo local/IA) */
const CACHE = 'suitpoke-v1';
const SHELL = [
  './', 'index.html', 'css/estilo.css',
  'js/motor.js', 'js/sonido.js', 'js/red.js', 'js/juego.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // API en vivo: siempre red (partidas online)
  if (u.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: u.pathname === '/' }).then(hit => {
      if (hit) {
        fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); }).catch(() => {});
        return hit;
      }
      return fetch(e.request).then(r => {
        if (r.ok && u.origin === location.origin) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      });
    })
  );
});
