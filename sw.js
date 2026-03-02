const VERSION = 'v2.1.0';
const cacheName = `ef-class-${VERSION}`;
const assets = ['./', './index.html', './logo.png', './favicon.png', './logo.gif', './logo-kampus.png', './manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(assets)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    // Hapus cache versi lama secara total saat ada versi baru (Versioning System)
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => {
                if (k !== cacheName) {
                    console.log(`[Service Worker] Menghapus cache lama: ${k}`);
                    return caches.delete(k);
                }
            }))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // Update Force: Khusus index.html / index.html kita gunakan Network-first
    // agar selalu mendapatkan versi aplikasi yang terbaru jika ada koneksi
    if (e.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
        e.respondWith(
            fetch(e.request).then(networkRes => {
                const clone = networkRes.clone();
                caches.open(cacheName).then(cache => cache.put(e.request, clone));
                return networkRes;
            }).catch(() => caches.match(e.request))
        );
        return;
    }

    // Aset lokal statis (logo, font, js/css yang di-cache): Cache-first
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

    // Resource eksternal (Google Sheets, CDN fonts/lucide): Network-first
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});

