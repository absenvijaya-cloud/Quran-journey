/* Inti aplikasi: penyimpanan, waktu, kalender Hijriah, jadwal salat, lokasi. */
(function () {
  'use strict';
  const KEY = 'qj.v1';
  const IND_TZ = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Pontianak'];

  const CITIES = [
    { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
    { name: 'Bandung', country: 'Indonesia', lat: -6.9175, lon: 107.6191, tz: 'Asia/Jakarta' },
    { name: 'Semarang', country: 'Indonesia', lat: -6.9667, lon: 110.4167, tz: 'Asia/Jakarta' },
    { name: 'Yogyakarta', country: 'Indonesia', lat: -7.7956, lon: 110.3695, tz: 'Asia/Jakarta' },
    { name: 'Surabaya', country: 'Indonesia', lat: -7.2575, lon: 112.7521, tz: 'Asia/Jakarta' },
    { name: 'Malang', country: 'Indonesia', lat: -7.9666, lon: 112.6326, tz: 'Asia/Jakarta' },
    { name: 'Medan', country: 'Indonesia', lat: 3.5952, lon: 98.6722, tz: 'Asia/Jakarta' },
    { name: 'Palembang', country: 'Indonesia', lat: -2.9761, lon: 104.7754, tz: 'Asia/Jakarta' },
    { name: 'Pontianak', country: 'Indonesia', lat: -0.0263, lon: 109.3425, tz: 'Asia/Pontianak' },
    { name: 'Denpasar', country: 'Indonesia', lat: -8.65, lon: 115.2167, tz: 'Asia/Makassar' },
    { name: 'Makassar', country: 'Indonesia', lat: -5.1477, lon: 119.4327, tz: 'Asia/Makassar' },
    { name: 'Balikpapan', country: 'Indonesia', lat: -1.2379, lon: 116.8529, tz: 'Asia/Makassar' },
    { name: 'Manado', country: 'Indonesia', lat: 1.4748, lon: 124.8421, tz: 'Asia/Makassar' },
    { name: 'Jayapura', country: 'Indonesia', lat: -2.5337, lon: 140.7181, tz: 'Asia/Jayapura' },
    { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lon: 101.6869, tz: 'Asia/Kuala_Lumpur' },
    { name: 'Singapura', country: 'Singapura', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
    { name: 'Makkah', country: 'Arab Saudi', lat: 21.3891, lon: 39.8579, tz: 'Asia/Riyadh' },
    { name: 'Madinah', country: 'Arab Saudi', lat: 24.5247, lon: 39.5692, tz: 'Asia/Riyadh' },
    { name: 'Kairo', country: 'Mesir', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
    { name: 'Istanbul', country: 'Turki', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
    { name: 'London', country: 'Inggris', lat: 51.5072, lon: -0.1276, tz: 'Europe/London' },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
    { name: 'Tokyo', country: 'Jepang', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' }
  ];

  const PRAYERS = [
    { id: 'subuh', name: 'Subuh', short: 'Sbh' },
    { id: 'zuhur', name: 'Zuhur', short: 'Zhr' },
    { id: 'asar', name: 'Asar', short: 'Asr' },
    { id: 'magrib', name: 'Magrib', short: 'Mgb' },
    { id: 'isya', name: 'Isya', short: 'Isy' }
  ];
  const DEMO_TIMES = { imsak: 262, subuh: 272, terbit: 351, zuhur: 712, asar: 908, magrib: 1075, isya: 1145 };

  const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jumadilawal', 'Jumadilakhir', 'Rajab', 'Syakban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']; // indeks 0 = Minggu

  /* ---------------- penyimpanan ---------------- */
  const defaults = () => ({
    settings: {
      city: { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta', gps: false },
      locAsked: false, method: 'auto', hijriAdj: 0, mood: 'auto', motion: 'system', arab: 30, view: 'terj',
      adzan: { on: false, subuh: true, zuhur: true, asar: true, magrib: true, isya: true }
    },
    marks: {}, fast: {}, bm: {}, last: { s: 1, a: 1 }, fastType: 'sunah', ts: 0
  });
  let state = defaults();
  let memoryOnly = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const d = defaults();
      state = { ...d, ...p, settings: { ...d.settings, ...(p.settings || {}), city: { ...d.settings.city, ...((p.settings || {}).city || {}) } } };
    }
  } catch (e) { memoryOnly = true; }

  let saveTimer;
  const QJ = { state, memoryOnly, CITIES, PRAYERS, HIJRI_MONTHS, BULAN, HARI, IND_TZ, DEMO_TIMES, listeners: [] };

  QJ.save = function (silent) {
    state.ts = Date.now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { QJ.memoryOnly = true; }
    }, 200);
    if (!silent && window.QJSync) window.QJSync.push();
  };
  // pastikan tersimpan saat halaman ditutup
  window.addEventListener('pagehide', () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* abaikan */ } });

  /* Pemeriksaan data dari luar (file cadangan, data akun): hanya bentuk yang dikenal yang dipakai. */
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  function cleanCity(c) {
    const o = { ...defaults().settings.city };
    if (!isObj(c)) return o;
    if (typeof c.name === 'string' && c.name) o.name = c.name.slice(0, 80);
    if (typeof c.country === 'string') o.country = c.country.slice(0, 80);
    if (Number.isFinite(c.lat) && Math.abs(c.lat) <= 90) o.lat = c.lat;
    if (Number.isFinite(c.lon) && Math.abs(c.lon) <= 180) o.lon = c.lon;
    if (typeof c.tz === 'string') { try { new Intl.DateTimeFormat('en', { timeZone: c.tz }); o.tz = c.tz; } catch (e) { /* tetap memakai bawaan */ } }
    if (typeof c.gps === 'boolean') o.gps = c.gps;
    return o;
  }

  /* Bahan untuk sinkronisasi */
  const SYNC_SETTINGS = ['city', 'method', 'hijriAdj', 'mood', 'arab'];
  QJ.exportState = () => {
    const s = {};
    SYNC_SETTINGS.forEach((k) => { s[k] = state.settings[k]; });
    return JSON.parse(JSON.stringify({ marks: state.marks, fast: state.fast, bm: state.bm, last: state.last, settings: s }));
  };
  QJ.mergeState = (r) => { // gabungkan tanpa menghapus catatan lokal
    if (!r) return;
    Object.keys(r.marks || {}).forEach((k) => { state.marks[k] = { ...(r.marks[k] || {}), ...(state.marks[k] || {}) }; });
    Object.keys(r.fast || {}).forEach((k) => { if (!state.fast[k]) state.fast[k] = r.fast[k]; });
    Object.keys(r.bm || {}).forEach((k) => { if (!state.bm[k]) state.bm[k] = r.bm[k]; });
    QJ.save(true); QJ.emit();
  };
  QJ.applyState = (r) => { // ganti dengan data dari perangkat lain
    if (!r) return;
    state.marks = r.marks || {}; state.fast = r.fast || {}; state.bm = r.bm || {};
    if (r.last) state.last = r.last;
    if (r.settings) SYNC_SETTINGS.forEach((k) => { if (r.settings[k] !== undefined) state.settings[k] = k === 'city' ? cleanCity(r.settings[k]) : r.settings[k]; });
    QJ.save(true); QJ.emit();
  };
  QJ.on = (fn) => QJ.listeners.push(fn);
  QJ.emit = () => QJ.listeners.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  QJ.resetAll = () => {
    const d = defaults();
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, d);
    try { localStorage.removeItem(KEY); localStorage.removeItem('qj.times'); } catch (e) { /* abaikan */ }
    QJ.emit();
  };
  /* Ganti akun di perangkat yang sama: catatan akun sebelumnya disimpan terpisah di perangkat
     (qj.cadangan), lalu aplikasi dimulai bersih agar tidak tercampur ke akun baru. */
  QJ.switchOwner = (uid) => {
    let reset = false;
    try {
      const prev = localStorage.getItem('qj.owner');
      if (prev && prev !== uid) {
        try { localStorage.setItem('qj.cadangan', JSON.stringify({ owner: prev, at: Date.now(), data: state })); } catch (e) { /* abaikan */ }
        const d = defaults();
        Object.keys(state).forEach((k) => delete state[k]);
        Object.assign(state, d);
        ['qj.times', 'qj.adzan', 'qj.pushsig'].forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(KEY, JSON.stringify(state));
        reset = true;
      }
      localStorage.setItem('qj.owner', uid);
    } catch (e) { /* abaikan */ }
    if (reset) QJ.emit();
    return reset;
  };
  QJ.importAll = (obj) => {
    const d = defaults();
    const s = isObj(obj.settings) ? obj.settings : {};
    const merged = {
      ...d,
      marks: isObj(obj.marks) ? obj.marks : d.marks,
      fast: isObj(obj.fast) ? obj.fast : d.fast,
      bm: isObj(obj.bm) ? obj.bm : d.bm,
      last: isObj(obj.last) ? obj.last : d.last,
      fastType: typeof obj.fastType === 'string' ? obj.fastType : d.fastType,
      settings: { ...d.settings, ...s, city: cleanCity(s.city) }
    };
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, merged);
    QJ.save(); QJ.emit();
  };

  /* ---------------- waktu ---------------- */
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const fmtMin = (m) => pad(Math.floor(m / 60) % 24) + ':' + pad(Math.round(m % 60) % 60);
  const key = (y, m, d) => y + '-' + pad(m) + '-' + pad(d);
  const parseKey = (k) => k.split('-').map(Number);
  const addDays = (k, n) => { const [y, m, d] = parseKey(k); const t = new Date(Date.UTC(y, m - 1, d + n)); return key(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); };
  const dow = (k) => { const [y, m, d] = parseKey(k); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const fmtLong = (k) => { const [y, m, d] = parseKey(k); return HARI[dow(k)] + ', ' + d + ' ' + BULAN[m - 1] + ' ' + y; };

  const fmtCache = {};
  function zonedNow(tz, plusMs) {
    let f = fmtCache[tz];
    if (!f) {
      try { f = fmtCache[tz] = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); }
      catch (e) { f = fmtCache[tz] = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); }
    }
    const p = {};
    f.formatToParts(new Date(Date.now() + (plusMs || 0))).forEach((x) => { p[x.type] = x.value; });
    const hh = Number(p.hour) % 24;
    return { y: +p.year, m: +p.month, d: +p.day, min: hh * 60 + Number(p.minute), sec: Number(p.second), key: key(+p.year, +p.month, +p.day) };
  }

  /* ---------------- Hijriah (perkiraan, Umm al-Qura) ---------------- */
  let hf;
  try { hf = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' }); } catch (e) { hf = null; }
  const hCache = {};
  function hijri(k, adj) {
    const ck = k + '|' + (adj || 0);
    if (hCache[ck]) return hCache[ck];
    if (!hf) return null;
    const [y, m, d] = parseKey(k);
    const parts = hf.formatToParts(new Date(Date.UTC(y, m - 1, d + (adj || 0), 12)));
    const o = {};
    parts.forEach((p) => { o[p.type] = p.value; });
    const r = { d: +o.day, m: +o.month, y: parseInt(o.year, 10), name: HIJRI_MONTHS[(+o.month) - 1] };
    return (hCache[ck] = r);
  }
  QJ.supportsHijri = !!hf;

  const EVENTS = [
    { m: 1, d: 1, n: 'Tahun Baru Hijriah' }, { m: 1, d: 10, n: 'Hari Asyura' }, { m: 3, d: 12, n: 'Maulid Nabi' },
    { m: 7, d: 27, n: "Isra Mi'raj" }, { m: 8, d: 15, n: 'Nisfu Syakban' }, { m: 9, d: 1, n: 'Awal Ramadan' },
    { m: 9, d: 17, n: 'Nuzulul Qur’an' }, { m: 10, d: 1, n: 'Idulfitri' }, { m: 12, d: 9, n: 'Hari Arafah' }, { m: 12, d: 10, n: 'Iduladha' }
  ];
  function eventOf(h) { if (!h) return null; const e = EVENTS.find((x) => x.m === h.m && x.d === h.d); return e ? e.n : null; }
  function upcoming(fromKey, adj, n) {
    const out = [];
    for (let i = 0; i < 420 && out.length < n; i++) {
      const k = addDays(fromKey, i); const h = hijri(k, adj); const e = eventOf(h);
      if (e) out.push({ key: k, name: e, days: i, h });
    }
    return out;
  }
  function daysToRamadan(fromKey, adj) {
    for (let i = 0; i < 420; i++) { const h = hijri(addDays(fromKey, i), adj); if (h && h.m === 9 && h.d === 1) return i; }
    return null;
  }
  function autoMood(k, adj) {
    const h = hijri(k, adj); if (!h) return 'biasa';
    if (h.m === 9) return 'ramadan';
    if ((h.m === 10 && h.d <= 3) || (h.m === 12 && h.d >= 10 && h.d <= 13)) return 'eid';
    return 'biasa';
  }
  Object.assign(QJ, { pad, fmtMin, key, parseKey, addDays, dow, daysInMonth, fmtLong, zonedNow, hijri, eventOf, upcoming, daysToRamadan, autoMood });

  /* ---------------- jadwal salat (Aladhan, tanpa kunci rahasia) ---------------- */
  let tcache = { loc: '', months: {}, tz: null, at: 0 };
  try { const raw = localStorage.getItem('qj.times'); if (raw) tcache = JSON.parse(raw); } catch (e) { /* abaikan */ }
  const saveTimes = () => { try { localStorage.setItem('qj.times', JSON.stringify(tcache)); } catch (e) { /* abaikan */ } };

  QJ.methodId = () => {
    const s = state.settings;
    if (s.method !== 'auto') return Number(s.method);
    return IND_TZ.includes(s.city.tz) ? 20 : 3;
  };
  const locKey = () => { const c = state.settings.city; return c.lat.toFixed(2) + ',' + c.lon.toFixed(2) + ',' + QJ.methodId(); };
  const toMin = (s) => { const m = /(\d{1,2}):(\d{2})/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };

  QJ.timesFor = (k) => {
    if (tcache.loc !== locKey()) return null;
    const [y, m, d] = parseKey(k);
    const mo = tcache.months[y + '-' + pad(m)];
    return mo && mo[d] ? mo[d] : null;
  };
  QJ.timesInfo = () => ({ at: tcache.at, loc: tcache.loc === locKey() });

  async function fetchJSON(url, ms) {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), ms || 9000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(to); }
  }

  async function fetchMonth(y, m) {
    const c = state.settings.city;
    let url = 'https://api.aladhan.com/v1/calendar/' + y + '/' + m + '?latitude=' + c.lat + '&longitude=' + c.lon + '&method=' + QJ.methodId();
    if (!c.gps && c.tz) url += '&timezonestring=' + encodeURIComponent(c.tz);
    const j = await fetchJSON(url);
    if (!j || !j.data || !j.data.length) throw new Error('data kosong');
    const mo = {};
    j.data.forEach((row) => {
      const d = Number(row.date.gregorian.day); const t = row.timings;
      mo[d] = { imsak: toMin(t.Imsak), subuh: toMin(t.Fajr), terbit: toMin(t.Sunrise), zuhur: toMin(t.Dhuhr), asar: toMin(t.Asr), magrib: toMin(t.Maghrib), isya: toMin(t.Isha) };
    });
    const tz = j.data[0].meta && j.data[0].meta.timezone;
    return { mo, tz };
  }

  /* Muat bulan ini (dan bulan depan bila sudah akhir bulan). Mengembalikan 'ok' | 'gagal'. */
  QJ.refreshTimes = async function (force) {
    const lk = locKey();
    if (tcache.loc !== lk) tcache = { loc: lk, months: {}, tz: null, at: 0 };
    const now = zonedNow(state.settings.city.tz);
    const need = [[now.y, now.m]];
    if (now.d >= 24) need.push(now.m === 12 ? [now.y + 1, 1] : [now.y, now.m + 1]);
    let ok = true;
    for (const [y, m] of need) {
      const mk = y + '-' + pad(m);
      if (tcache.months[mk] && !force) continue;
      try {
        const r = await fetchMonth(y, m);
        tcache.months[mk] = r.mo; tcache.at = Date.now();
        if (r.tz && state.settings.city.gps && r.tz !== state.settings.city.tz) { state.settings.city.tz = r.tz; QJ.save(); }
      } catch (e) { ok = false; }
    }
    // buang bulan lama
    Object.keys(tcache.months).forEach((mk) => { const [yy, mm] = mk.split('-').map(Number); if ((yy * 12 + mm) < (now.y * 12 + now.m - 1)) delete tcache.months[mk]; });
    saveTimes();
    return ok ? 'ok' : 'gagal';
  };

  /* ---------------- lokasi ---------------- */
  QJ.useGPS = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('tidak-didukung')); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = Math.round(pos.coords.latitude * 1000) / 1000, lon = Math.round(pos.coords.longitude * 1000) / 1000;
      let name = 'Lokasi saat ini', country = '';
      try {
        const g = await fetchJSON('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=id', 6000);
        name = g.city || g.locality || g.principalSubdivision || name; country = g.countryName || '';
      } catch (e) { /* nama tetap umum */ }
      const prev = state.settings.city;
      state.settings.city = { name, country, lat, lon, tz: prev.tz, gps: true }; // zona waktu diperbarui dari data jadwal
      state.settings.locAsked = true;
      QJ.save(); resolve(state.settings.city);
    }, (err) => reject(err), { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  });
  QJ.setCity = (c) => {
    state.settings.city = { name: c.name, country: c.country, lat: c.lat, lon: c.lon, tz: c.tz, gps: false };
    state.settings.locAsked = true;
    QJ.save();
  };

  window.QJ = QJ;
})();
