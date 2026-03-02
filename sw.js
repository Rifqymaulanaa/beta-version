const cacheName = 'ef-class-v2';
const assets = ['./', './index.html', './logo.png', './favicon.png', './logo.gif', './logo-kampus.png', './manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(assets)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    // Hapus cache lama agar update langsung aktif
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== cacheName).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // Aset lokal: cache-first (muat instan dari cache)
    if (url.origin === self.location.origin) {
        e.respondWith(
            caches.match(e.request).then(res => res || fetch(e.request).then(networkRes => {
                const clone = networkRes.clone();
                caches.open(cacheName).then(cache => cache.put(e.request, clone));
                return networkRes;
            }))
        );
        return;
    }

    // Resource eksternal (Google Sheets, CDN): network-first
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
