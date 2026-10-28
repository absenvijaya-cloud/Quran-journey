/* Quran Journey: notifikasi waktu salat (Web Push).
   Aplikasi mendaftarkan perangkat dan menyimpan jadwal salat ke Firestore.
   Pengirim di GitHub Actions (folder push/) membaca data itu dan mengirim notifikasi. */
(function () {
  'use strict';
  const QJ = window.QJ, S = QJ.state;
  const PR = ['subuh', 'zuhur', 'asar', 'magrib', 'isya'];
  const LS = 'qj.pushsig';
  let status = '';

  const cfg = () => { S.settings.notif = Object.assign({ on: false }, S.settings.notif || {}); return S.settings.notif; };
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const sy = () => window.QJSync;
  const signedIn = () => !!(sy() && sy().enabled && sy().user);

  function key64(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }

  async function subscription() {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key64(window.VAPID_PUBLIC_KEY) });
    return sub;
  }

  /* Jadwal 35 hari ke depan yang sudah tersimpan di aplikasi (sumbernya sama dengan yang tampil di Beranda). */
  function timesPayload() {
    const out = {};
    const today = QJ.zonedNow(S.settings.city.tz).key;
    for (let i = 0; i < 35; i++) {
      const k = QJ.addDays(today, i);
      const T = QJ.timesFor(k);
      if (T && T.subuh != null) { out[k] = {}; PR.forEach((p) => { out[k][p] = Math.round(T[p]); }); }
    }
    return out;
  }

  async function sync(force) {
    if (!cfg().on || !supported() || !signedIn() || !window.VAPID_PUBLIC_KEY) return false;
    if (Notification.permission !== 'granted') return false;
    const times = timesPayload();
    if (!Object.keys(times).length) { status = 'Menunggu jadwal salat termuat'; return false; }
    const c = S.settings.city;
    const sig = JSON.stringify([c.tz, c.name, Object.keys(times).length, times[Object.keys(times)[0]]]);
    let last = {}; try { last = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { /* abaikan */ }
    if (!force && last.sig === sig && Date.now() - (last.at || 0) < 6 * 3600 * 1000) return true;
    const sub = await subscription();
    const j = sub.toJSON();
    await sy().saveDevice({ enabled: true, sub: { endpoint: j.endpoint, keys: j.keys }, tz: c.tz, city: c.name, times, updatedAt: Date.now() });
    try { localStorage.setItem(LS, JSON.stringify({ sig, at: Date.now() })); } catch (e) { /* abaikan */ }
    status = 'Aktif di perangkat ini';
    return true;
  }

  window.QJPush = {
    supported, signedIn, cfg,
    ready: () => !!window.VAPID_PUBLIC_KEY,
    status: () => status,
    async enable() {
      if (!supported()) throw new Error('belum-didukung');
      if (!signedIn()) throw new Error('belum-masuk');
      if (!window.VAPID_PUBLIC_KEY) throw new Error('tanpa-kunci');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('ditolak');
      cfg().on = true; QJ.save(true);
      await sync(true);
    },
    async disable() {
      cfg().on = false; QJ.save(true);
      try { const reg = await navigator.serviceWorker.ready; const s = await reg.pushManager.getSubscription(); if (s) await s.unsubscribe(); } catch (e) { /* abaikan */ }
      try { await sy().removeDevice(); } catch (e) { /* abaikan */ }
      try { localStorage.removeItem(LS); } catch (e) { /* abaikan */ }
      status = '';
    },
    async test() {
      if (!supported() || Notification.permission !== 'granted') throw new Error('ditolak');
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('Waktu Zuhur telah tiba', { body: 'Ini contoh notifikasi. Ketuk untuk membuka adzan.', tag: 'adzan-tes', icon: 'icons/icon-192.png', data: { id: 'zuhur', url: './' } });
    },
    sync
  };

  /* Perbarui data perangkat saat aplikasi dibuka, setelah login tersambung, dan berkala. */
  const kick = () => { sync(false).catch(() => {}); };
  if (sy() && sy().on) sy().on(() => { if (sy().user) kick(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  setTimeout(kick, 4000);
})();
