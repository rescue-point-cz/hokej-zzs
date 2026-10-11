/* HOKEJ ZZS – aktualizace PWA v3: online-first HTML, offline fallback */
const CACHE = 'hokej-zzs-v3-20261011';
const ASSETS = [
  './index.html', './hokej-hero.jpg', './hokej-banner.jpg',
  './hokej-banner-mobil.jpg', './icon-192.png', './icon-512.png',
  './apple-touch-icon.png', './manifest.webmanifest'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(ASSETS.map(async path => {
      const response = await fetch(path, {cache: 'reload'});
      if (response.ok) await cache.put(path, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('hokej-zzs-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith((async () => {
      try {
        const response = await fetch(req, {cache: 'no-store'});
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_) {
        const cache = await caches.open(CACHE);
        return await cache.match('./index.html') || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    try {
      const response = await fetch(req);
      if (response.ok) (await caches.open(CACHE)).put(req, response.clone());
      return response;
    } catch (_) {
      return await caches.match(req) || Response.error();
    }
  })());
});
