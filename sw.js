/* Service worker Quran Journey: simpan kerangka aplikasi dan data surah agar bisa dibuka offline.
   Naikkan angka VERSI setiap kali Anda mengganti file aplikasi, supaya HP pengguna ikut memperbarui. */
const VERSI = 'qj-v4';
const KERANGKA = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css', './js/app.js', './js/core.js', './js/sync.js', './js/firebase-config.js',
  './data/surah-list.json', './data/kisah/index.json', './js/adzan.js', './data/adzan/fajr.mp3', './data/adzan/makkah.mp3',
  './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-64.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(KERANGKA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSI).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Audio, jadwal salat, dan layanan Firebase: jangan disimpan di sini.
  if (/\.(m4a|aac|mp3)$/i.test(url.pathname) && !url.pathname.includes('/data/adzan/')) return;
  if (url.hostname.includes('aladhan.com') || url.hostname.includes('bigdatacloud') ||
      url.hostname.includes('googleapis.com') && url.hostname !== 'fonts.googleapis.com' ||
      url.hostname.includes('firebase') || url.hostname.includes('gstatic.com') && url.pathname.includes('firebasejs')) return;

  // Font Google: simpan setelah pemakaian pertama.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(VERSI).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { c.put(req, r.clone()); return r; })))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Data surah: simpan saat pertama dibuka, lalu pakai dari simpanan.
  if ((url.pathname.includes('/data/surah/') || url.pathname.includes('/data/kisah/') || url.pathname.includes('/data/adzan/'))) {
    e.respondWith(
      caches.open(VERSI).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; })))
    );
    return;
  }

  // File aplikasi: ambil yang terbaru bila online, simpanan bila offline.
  e.respondWith(
    fetch(req).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSI).then((c) => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
