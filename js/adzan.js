/* Quran Journey: adzan otomatis saat aplikasi terbuka.
   - Subuh memakai fajr.mp3, waktu lain memakai makkah.mp3.
   - Berbunyi satu kali per waktu salat per hari.
   - Hanya memakai jadwal asli (bukan jadwal contoh).
   - Perlu diaktifkan pengguna sekali lewat saklar (syarat autoplay browser). */
(function () {
  'use strict';
  const QJ = window.QJ, S = QJ.state;
  const FILES = { subuh: 'data/adzan/fajr.mp3', biasa: 'data/adzan/makkah.mp3' };
  const NAMES = { subuh: 'Subuh', zuhur: 'Zuhur', asar: 'Asar', magrib: 'Magrib', isya: 'Isya' };
  const LS = 'qj.adzan';
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  const WINDOW_MIN = 2; // toleransi bila pewaktu tertunda (menit)

  const audio = new Audio();
  audio.preload = 'none';
  const blobs = {};
  let unlocked = false, bar = null, current = null;

  const cfg = () => {
    const d = { on: false, subuh: true, zuhur: true, asar: true, magrib: true, isya: true };
    S.settings.adzan = Object.assign(d, S.settings.adzan || {});
    return S.settings.adzan;
  };
  const kind = (id) => (id === 'subuh' ? 'subuh' : 'biasa');

  function loadDone() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function saveDone(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { /* abaikan */ } }

  /* Ambil file sebagai blob agar bisa diputar tanpa menunggu jaringan saat waktunya tiba. */
  function prefetch() {
    Object.keys(FILES).forEach((k) => {
      if (blobs[k]) return;
      fetch(FILES[k]).then((r) => { if (!r.ok) throw new Error('gagal'); return r.blob(); })
        .then((b) => { blobs[k] = URL.createObjectURL(b); }).catch(() => { /* coba lagi nanti */ });
    });
  }

  /* Buka kunci audio setelah sentuhan pertama pengguna. */
  function unlock() {
    if (unlocked) return;
    audio.muted = true; audio.src = SILENT;
    const p = audio.play();
    const done = () => { audio.pause(); audio.muted = false; unlocked = true; };
    if (p && p.then) p.then(done).catch(() => { audio.muted = false; }); else done();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { if (cfg().on) unlock(); }, { passive: true }));

  /* ---------- banner ---------- */
  function ensureBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'adzan-bar'; bar.setAttribute('role', 'alert'); bar.hidden = true;
    document.getElementById('app').appendChild(bar);
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'stop') stop();
      if (b.dataset.a === 'play' && current) start(current.id, true);
    });
    return bar;
  }
  function showBar(id, state) {
    const b = ensureBar();
    b.hidden = false;
    b.innerHTML = '<div class="ab-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.5 14.5A8.5 8.5 0 1 1 11 3.5a6.5 6.5 0 0 0 9.5 11z"/></svg></div>' +
      '<div class="ab-tx"><strong>Waktu ' + NAMES[id] + ' telah tiba</strong><span>' + (state === 'blocked' ? 'Ketuk tombol untuk memutar adzan' : 'Adzan sedang berkumandang') + '</span></div>' +
      (state === 'blocked' ? '<button type="button" data-a="play" class="ab-btn">Putar adzan</button>' : '') +
      '<button type="button" data-a="stop" class="ab-btn ghost">' + (state === 'blocked' ? 'Tutup' : 'Hentikan') + '</button>';
  }
  function hideBar() { if (bar) { bar.hidden = true; bar.innerHTML = ''; } }

  /* ---------- putar / berhenti ---------- */
  async function start(id, fromTap) {
    current = { id };
    window.dispatchEvent(new CustomEvent('qj:adzan-start'));
    const k = kind(id);
    audio.muted = false;
    audio.src = blobs[k] || FILES[k];
    audio.currentTime = 0;
    try {
      await audio.play();
      showBar(id, 'playing');
    } catch (e) {
      showBar(id, 'blocked');
      if (!fromTap) notify(id);
    }
  }
  function stop() {
    audio.pause(); audio.currentTime = 0;
    current = null; hideBar();
    window.dispatchEvent(new CustomEvent('qj:adzan-end'));
  }
  audio.addEventListener('ended', () => { if (current) stop(); });

  function notify(id) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const opt = { body: 'Buka aplikasi untuk mendengar adzan.', tag: 'adzan-' + id, icon: 'icons/icon-192.png' };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then((r) => r.showNotification('Waktu ' + NAMES[id] + ' telah tiba', opt)).catch(() => {});
    } catch (e) { /* abaikan */ }
  }

  /* ---------- pengecekan waktu ---------- */
  function check() {
    const c = cfg(); if (!c.on) return;
    const z = QJ.zonedNow(S.settings.city.tz);
    const T = QJ.timesFor(z.key);
    if (!T || T.subuh == null) return; // jadwal asli belum ada: jangan menebak
    let done = loadDone();
    if (done.key !== z.key) done = { key: z.key, ids: [] };
    for (const p of QJ.PRAYERS) {
      const t = T[p.id];
      if (t == null || !c[p.id] || done.ids.indexOf(p.id) >= 0) continue;
      if (z.min >= t && z.min < t + WINDOW_MIN) {
        done.ids.push(p.id); saveDone(done);
        start(p.id, false);
        return;
      }
    }
  }
  setInterval(check, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });

  /* ---------- untuk Pengaturan ---------- */
  window.QJAdzan = {
    cfg,
    setOn(v) {
      cfg().on = !!v; QJ.save(true);
      if (v) {
        unlock(); prefetch();
        try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { /* abaikan */ }
      } else if (current) stop();
    },
    setPrayer(id, v) { cfg()[id] = !!v; QJ.save(true); },
    test(id) { unlock(); prefetch(); start(id, true); },
    stop,
    prefetch
  };
  if (cfg().on) prefetch();

  /* Dibuka dari notifikasi: tampilkan banner dengan tombol putar (butuh ketukan agar browser mengizinkan suara). */
  function fromNotif(id) { if (NAMES[id]) { unlock(); prefetch(); current = { id }; showBar(id, 'blocked'); } }
  try {
    const q = new URLSearchParams(location.search).get('adzan');
    if (q) { fromNotif(q); history.replaceState(null, '', location.pathname + location.hash); }
  } catch (e) { /* abaikan */ }
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'adzan') fromNotif(e.data.id); });
})();
