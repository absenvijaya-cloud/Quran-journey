/* Quran Journey — tampilan dan interaksi */
(function () {
  'use strict';
  const QJ = window.QJ;
  const S = QJ.state;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad3 = (n) => String(n).padStart(3, '0');
  const AUDIO_BASE = 'https://media.qurankemenag.net/audio/Abu_Bakr_Ash-Shaatree_aac64/';

  const view = $('#view'), toastEl = $('#toast'), miniEl = $('#mini'), navEl = $('#nav'), splash = $('#splash');
  const reduceOS = window.matchMedia('(prefers-reduced-motion: reduce)');

  const ICO = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    pin: '<svg class="pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
    gear: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    back: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 17H6.5A2.5 2.5 0 0 0 4 19.5"/></svg>',
    bm: '<svg class="bm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14L8 12zM6 5h2v14H6z"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14l10-7zM16 5h2v14h-2z"/></svg>',
    moon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="#D4B27A" stroke="#A87935" stroke-width="1.4" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 11 3.5a6.5 6.5 0 0 0 9.5 11z"/></svg>'
  };

  /* ================= umum ================= */
  let toastTimer;
  function toast(msg, up) {
    toastEl.textContent = msg; toastEl.hidden = false; toastEl.classList.toggle('up', !!(up || playerActive()));
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }
  const cityNow = () => S.settings.city;
  const nowZ = (plus) => QJ.zonedNow(cityNow().tz, plus);
  const timesOf = (k) => QJ.timesFor(k);
  const hij = (k) => QJ.hijri(k, S.settings.hijriAdj);
  const hijText = (k) => { const h = hij(k); return h ? h.d + ' ' + h.name + ' ' + h.y + ' H' : ''; };
  const moodNow = () => (S.settings.mood && S.settings.mood !== 'auto' ? S.settings.mood : QJ.autoMood(nowZ().key, S.settings.hijriAdj));
  const motionReduced = () => S.settings.motion === 'reduce' || (S.settings.motion === 'system' && reduceOS.matches);

  function applyMotion() {
    const r = document.documentElement.classList;
    r.toggle('motion-reduce', S.settings.motion === 'reduce');
    r.toggle('motion-full', S.settings.motion === 'full');
  }
  function applyArabSize() { document.documentElement.style.setProperty('--arab-size', S.settings.arab + 'px'); }

  /* ================= router ================= */
  let cleanup = null;
  const routes = { home: renderHome, quran: renderQuran, kisah: renderKisah, read: renderRead, ibadah: renderIbadah, kalender: renderKalender, settings: renderSettings };
  function parseHash() {
    const p = (location.hash || '#/home').replace(/^#\/?/, '').split('/');
    return { name: routes[p[0]] ? p[0] : 'home', a: p[1], b: p[2] };
  }
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const r = parseHash();
    const tab = r.name === 'read' ? 'quran' : r.name === 'settings' ? 'home' : r.name;
    $$('#nav a').forEach((a, i) => {
      if (a.dataset.tab === tab) { a.setAttribute('aria-current', 'page'); $('#navDot').style.transform = 'translateX(' + (i * 100) + '%)'; }
      else a.removeAttribute('aria-current');
    });
    view.scrollTop = 0;
    routes[r.name](r);
  }
  const go = (h) => { if (location.hash === h) route(); else location.hash = h; };
  window.addEventListener('hashchange', route);
  QJ.on(() => { if (!splash || splash.classList.contains('out') || !document.body.contains(splash)) route(); });

  /* ================= pembuka ================= */
  let splashTimer, rid = 0;
  function startSplash() {
    splash.className = 'splash'; splash.style.display = '';
    $$('.rip', splash).forEach((r) => r.remove());
    navEl.hidden = true;
    clearTimeout(splashTimer);
    splashTimer = setTimeout(endSplash, motionReduced() ? 600 : 2300);
  }
  function endSplash() {
    clearTimeout(splashTimer);
    splash.classList.add('out');
    navEl.hidden = false;
    setTimeout(() => { if (splash.classList.contains('out')) splash.style.display = 'none'; }, 520);
    firstRunTasks();
  }
  splash.addEventListener('click', (e) => {
    if (e.target.id === 'splashSkip') return;
    const r = splash.getBoundingClientRect();
    const sp = document.createElement('span'); sp.className = 'rip';
    sp.style.left = (e.clientX - r.left) + 'px'; sp.style.top = (e.clientY - r.top) + 'px';
    splash.appendChild(sp); rid++;
    setTimeout(() => sp.remove(), 950);
  });
  $('#splashSkip').addEventListener('click', (e) => { e.stopPropagation(); endSplash(); });

  /* ================= jadwal & lokasi (aksi bersama) ================= */
  let locBusy = false, timesStatus = 'idle', lastLocCheck = 0;
  async function refreshTimes(force, quiet) {
    timesStatus = 'loading'; if (!quiet) syncHomeStatus();
    const r = await QJ.refreshTimes(force);
    timesStatus = r === 'ok' ? 'ok' : 'gagal';
    syncHomeStatus();
    if (parseHash().name === 'home' || parseHash().name === 'ibadah' || parseHash().name === 'settings') route();
    return r;
  }
  async function refreshLocation(opts) {
    if (locBusy) return;
    locBusy = true; setLocSpin(true);
    try {
      if (cityNow().gps || (opts && opts.ask)) {
        try {
          await QJ.useGPS();
          toast('Lokasi diperbarui: ' + cityNow().name);
        } catch (err) {
          const denied = err && err.code === 1;
          toast(denied ? 'Izin lokasi ditolak. Memakai kota yang tersimpan: ' + cityNow().name : 'Lokasi belum bisa diambil. Memakai kota yang tersimpan.');
        }
      }
      lastLocCheck = Date.now();
      const r = await QJ.refreshTimes(true);
      timesStatus = r === 'ok' ? 'ok' : 'gagal';
      if (r !== 'ok') toast('Jadwal belum bisa diperbarui. Menampilkan data tersimpan bila ada.');
    } finally { locBusy = false; setLocSpin(false); }
    QJ.save(); route();
  }
  function setLocSpin(on) { const el = $('#locBtn svg'); if (el) el.classList.toggle('spin', on); }

  function firstRunTasks() {
    refreshTimes(false, true);
    if (S.settings.city.gps) refreshLocation();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  window.addEventListener('online', () => { refreshTimes(false, true); });
  window.addEventListener('offline', () => { syncHomeStatus(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (splash.style.display !== 'none' && !splash.classList.contains('out')) return;
    view.classList.remove('resume-fade'); void view.offsetWidth; view.classList.add('resume-fade');
    refreshTimes(false, true);
    if (S.settings.city.gps && Date.now() - lastLocCheck > 10 * 60 * 1000 && navigator.onLine) refreshLocation();
    if (parseHash().name === 'home') route();
  });

  /* ================= BERANDA ================= */
  const SKY = [[240, [233, 213, 181]], [420, [243, 231, 208]], [720, [250, 247, 241]], [960, [244, 230, 202]], [1080, [232, 201, 145]], [1200, [217, 195, 160]]];
  let preview = false;

  function sceneHTML(mood, night, lights, skyFill) {
    const sky = '<svg viewBox="0 0 358 46" width="358" height="46" style="position:absolute;left:50%;margin-left:-179px;top:200px" aria-hidden="true"><g fill="' + skyFill + '" opacity=".4"><rect x="0" y="40" width="358" height="6"/><rect x="14" y="12" width="5" height="30"/><path d="M14 12l2.5-9 2.5 9z"/><path d="M30 40v-9a15 15 0 0 1 30 0v9z"/><rect x="44" y="12" width="2" height="6"/><rect x="66" y="20" width="4" height="22"/><path d="M66 20l2-7 2 7z"/><rect x="288" y="20" width="4" height="22"/><path d="M288 20l2-7 2 7z"/><path d="M298 40v-11a17 17 0 0 1 34 0v11z"/><rect x="314" y="8" width="2" height="7"/><rect x="338" y="10" width="5" height="32"/><path d="M338 10l2.5-9 2.5 9z"/></g>' +
      (lights ? '<g fill="#FFF3D6"><rect class="flick" x="15.5" y="22" width="2" height="3"/><rect class="flick" style="animation-delay:.7s" x="15.5" y="30" width="2" height="3"/><rect class="flick" style="animation-delay:1.2s" x="339.5" y="20" width="2" height="3"/><rect class="flick" style="animation-delay:.3s" x="339.5" y="30" width="2" height="3"/><rect class="flick" style="animation-delay:1.6s" x="313.5" y="33" width="3" height="4"/><rect class="flick" style="animation-delay:.9s" x="43.5" y="33" width="3" height="4"/></g>' : '') + '</svg>';
    const stars = night ? '<span class="twk" style="left:34px;top:34px"></span><span class="twk" style="left:96px;top:18px;animation-delay:.8s;width:6px;height:6px"></span><span class="twk" style="left:178px;top:12px;animation-delay:1.5s"></span><span class="twk" style="left:262px;top:30px;animation-delay:.3s;width:6px;height:6px"></span><span class="twk" style="left:326px;top:70px;animation-delay:1.1s"></span><span class="twk" style="left:22px;top:110px;animation-delay:2s;width:6px;height:6px"></span>' : '';
    let m = '';
    if (mood === 'biasa') {
      m = '<div class="cloud" style="top:60px"></div><div class="cloud" style="top:118px;width:110px;height:26px;animation-duration:55s;animation-delay:-20s"></div><div class="cloud" style="top:170px;width:170px;animation-duration:48s;animation-delay:-34s;opacity:.7"></div><span class="mote" style="left:60px;top:190px;animation-duration:7s"></span><span class="mote" style="left:130px;top:215px;width:4px;height:4px;animation-duration:9s;animation-delay:2s"></span><span class="mote" style="left:250px;top:200px;animation-duration:8s;animation-delay:1s"></span><span class="mote" style="left:310px;top:225px;width:4px;height:4px;animation-duration:10s;animation-delay:3.5s"></span>';
    } else if (mood === 'ramadan') {
      const lan = (id, left, w, h, len, dur, delay, body) => '<div class="swayer" style="left:' + left + 'px;top:0;width:' + w + 'px;animation-duration:' + dur + 's;animation-delay:' + delay + 's"><svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><defs><radialGradient id="' + id + '"><stop offset="0" stop-color="#FFE9B8" stop-opacity=".9"/><stop offset="1" stop-color="#D4B27A" stop-opacity="0"/></radialGradient></defs>' + body + '</svg></div>';
      m = '<div style="position:absolute;right:18px;top:16px;width:84px;height:84px;animation:fadein 1s ease-out both"><div style="position:absolute;left:-30px;top:-30px;width:144px;height:144px;border-radius:50%;background:radial-gradient(circle,rgba(212,178,122,.55),rgba(212,178,122,0) 65%);animation:breathe 4.5s ease-in-out infinite"></div><svg width="84" height="84" viewBox="0 0 84 84" style="position:absolute;left:0;top:0" aria-hidden="true"><mask id="rcm"><rect width="84" height="84" fill="#fff"/><circle cx="50" cy="34" r="28" fill="#000"/></mask><circle cx="36" cy="42" r="30" fill="#D4B27A" mask="url(#rcm)"/></svg></div>' +
        lan('lg1', 22, 44, 104, 34, 3.6, 0, '<line x1="22" y1="0" x2="22" y2="34" stroke="#8B6F47" stroke-width="1.5"/><circle class="flick" cx="22" cy="62" r="26" fill="url(#lg1)"/><path d="M14 36h16l4 6 3 28q-15 10-30 0l3-28z" fill="#D4B27A" stroke="#8B6F47" stroke-width="1.5"/><path d="M22 44v26M15 52h14M14 60h16" stroke="#8B6F47" stroke-width="1" opacity=".6"/><rect x="17" y="72" width="10" height="8" rx="2" fill="#8B6F47"/>') +
        lan('lg2', 78, 34, 70, 16, 4.2, -1.2, '<line x1="17" y1="0" x2="17" y2="16" stroke="#8B6F47" stroke-width="1.5"/><circle class="flick" style="animation-delay:.8s" cx="17" cy="36" r="20" fill="url(#lg2)"/><path d="M11 18h12l3 5 2 20q-11 8-22 0l2-20z" fill="#E8C98E" stroke="#8B6F47" stroke-width="1.4"/><rect x="13" y="50" width="8" height="6" rx="2" fill="#8B6F47"/>') +
        lan('lg3', 300, 38, 86, 24, 3.9, -2, '<line x1="19" y1="0" x2="19" y2="24" stroke="#8B6F47" stroke-width="1.5"/><circle class="flick" style="animation-delay:1.5s" cx="19" cy="48" r="22" fill="url(#lg3)"/><path d="M12 26h14l3 5 3 22q-13 9-26 0l3-22z" fill="#D4B27A" stroke="#8B6F47" stroke-width="1.4"/><rect x="15" y="60" width="8" height="7" rx="2" fill="#8B6F47"/>');
    } else {
      m = '<div class="swayer" style="left:0;top:0;width:100%;animation-duration:4.5s"><svg width="100%" height="58" viewBox="0 0 390 58" preserveAspectRatio="none" aria-hidden="true"><path d="M-5 6 Q195 54 395 6" fill="none" stroke="#8B6F47" stroke-width="1.2"/><path d="M20 12l9 0-4.5 15z" fill="#D4B27A"/><path d="M62 21l9 0-4.5 15z" fill="#E4A99A"/><path d="M104 29l9 0-4.5 15z" fill="#D4B27A"/><path d="M146 35l9 0-4.5 15z" fill="#E4A99A"/><path d="M190 38l9 0-4.5 15z" fill="#D4B27A"/><path d="M234 35l9 0-4.5 15z" fill="#E4A99A"/><path d="M276 29l9 0-4.5 15z" fill="#D4B27A"/><path d="M318 21l9 0-4.5 15z" fill="#E4A99A"/><path d="M360 12l9 0-4.5 15z" fill="#D4B27A"/></svg></div>' +
        '<div class="core" style="left:70px;top:118px"></div><div class="burst" style="left:70px;top:118px"></div><div class="core" style="left:300px;top:92px;animation-delay:1.4s"></div><div class="burst burstB" style="left:300px;top:92px;animation-delay:1.4s"></div><div class="core" style="left:200px;top:70px;animation-delay:2.7s"></div><div class="burst" style="left:200px;top:70px;width:120px;height:120px;animation-delay:2.7s"></div>' +
        '<span class="spark" style="left:36px;top:230px"></span><span class="spark b" style="left:92px;top:240px;animation-delay:.9s"></span><span class="spark" style="left:150px;top:228px;animation-delay:1.8s"></span><span class="spark b" style="left:214px;top:242px;animation-delay:.4s"></span><span class="spark" style="left:270px;top:230px;animation-delay:2.4s"></span><span class="spark b" style="left:326px;top:238px;animation-delay:1.3s"></span>';
    }
    return sky + stars + m;
  }

  function cardBg(mood, rgb) {
    if (mood === 'ramadan') return 'linear-gradient(180deg,#E6CA98 0%,#F4E5C8 55%,#FFFCF6 95%)';
    if (mood === 'eid') return 'linear-gradient(180deg,#F2D6C8 0%,#F8EBD6 55%,#FFFCF6 95%)';
    return 'linear-gradient(180deg,rgb(' + rgb.join(',') + ') 0%,#FFFCF6 92%)';
  }

  function renderHome() {
    const c = cityNow();
    const lamps = QJ.PRAYERS.map((p) => '<button type="button" class="lamp" data-act="lamp" data-id="' + p.id + '" aria-pressed="false" aria-label="Tandai ' + p.name + '"><b>' + p.short + '</b>' + ICO.check + '</button>').join('');
    const locCard = !S.settings.locAsked ? '<div class="card" style="margin-top:16px;padding:16px"><b style="font-size:15px">Gunakan lokasi Anda?</b><p class="sub" style="margin:6px 0 12px">Lokasi dipakai hanya untuk menghitung jadwal salat dan zona waktu setempat. Koordinat tidak dikirim ke server kami dan hanya diminta saat Anda memperbarui lokasi.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-act="askgps">Izinkan lokasi</button><button class="btn soft" type="button" data-act="manualcity">Pilih kota sendiri</button></div></div>' : '';
    view.className = 'view';
    view.innerHTML = '<div class="page">' +
      '<div class="topbar"><div class="locpill">' + ICO.pin + '<span class="name">' + esc(c.name) + ' <span class="tz" id="tzTxt"></span></span><button id="locBtn" type="button" data-act="refreshloc" aria-label="Perbarui lokasi" title="Perbarui lokasi">' + ICO.refresh + '</button></div>' +
      '<a class="icon-btn" href="#/settings" aria-label="Pengaturan">' + ICO.gear + '</a></div>' +
      '<div class="datehint" id="dateTxt"></div><div class="greet" id="greet"></div>' + locCard +
      '<div class="hero" id="hero"><div class="scene" id="scene"></div>' +
      '<div class="arch-glow"></div>' +
      '<div class="arch"><svg viewBox="0 0 318 196" width="318" height="196" aria-hidden="true"><path d="M25 176 A134 134 0 0 1 293 176" fill="none" stroke="#E2D3B8" stroke-width="3" stroke-linecap="round"/><path id="arcProg" d="M25 176 A134 134 0 0 1 293 176" pathLength="100" fill="none" stroke="#D4B27A" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 100"/><path d="M45 176 A114 114 0 0 1 273 176" fill="none" stroke="#8B6F47" stroke-width=".8" opacity=".3"/></svg>' +
      '<div class="rays" id="rays" style="left:0;top:0"></div><div class="orb" id="orb" style="left:25px;top:176px"></div>' + lamps +
      '<div class="arch-text"><div class="l" id="nxLabel"></div><div class="n" id="nxName"></div><div class="t" id="nxTime"></div><div class="c" id="nxCount"></div></div></div>' +
      '<div class="hero-done" id="doneTxt"></div>' +
      '<div class="hero-panel" id="panel"><div class="r"><label for="tgeser">Pratinjau waktu</label><b id="tLabel"></b></div><input id="tgeser" type="range" min="0" max="1439" step="5" value="720"></div>' +
      '<div class="hero-foot" id="foot"></div></div>' +
      '<button type="button" class="resume-card row" data-act="resume"><div class="ic">' + ICO.book + '</div><div class="tx"><small>Lanjutkan membaca</small><strong id="resTxt"></strong></div>' + ICO.next + '</button>' +
      '<div class="small" style="text-align:center;margin-top:18px" id="hijriNote"></div></div>';
    const slider = $('#tgeser');
    $('#panel').hidden = !preview;
    slider.addEventListener('input', () => { previewMin = Number(slider.value); tickHome(true); });
    homeSig = '';
    tickHome(true);
    const iv = setInterval(() => tickHome(false), 1000);
    cleanup = () => clearInterval(iv);
    setTimeout(() => view.focus({ preventScroll: true }), 0);
  }

  let previewMin = 720, homeSig = '';
  function dayTimes(k) {
    const t = timesOf(k);
    if (t && t.subuh != null) return { t, live: true };
    return { t: QJ.DEMO_TIMES, live: false };
  }
  const pt = (q) => { const th = Math.PI * (1 - q); return { x: 159 + 134 * Math.cos(th), y: 176 - 134 * Math.sin(th) }; };

  function tickHome(force) {
    const hero = $('#hero'); if (!hero) return;
    const z = nowZ();
    const nowMin = preview ? previewMin : z.min + z.sec / 60;
    const today = z.key;
    const { t: T, live } = dayTimes(today);
    const times = QJ.PRAYERS.map((p) => T[p.id]);
    const ps = [0.1, 0.3, 0.5, 0.7, 0.9];
    const t0 = times[0] - 32, t1 = times[4] + 55;
    let p;
    if (nowMin <= times[0]) p = 0.1 * Math.max(0, (nowMin - t0) / (times[0] - t0));
    else if (nowMin >= times[4]) p = 0.9 + 0.1 * Math.min(1, (nowMin - times[4]) / (t1 - times[4]));
    else { let i = 0; while (nowMin > times[i + 1]) i++; p = ps[i] + (ps[i + 1] - ps[i]) * ((nowMin - times[i]) / (times[i + 1] - times[i])); }
    const o = pt(p);
    const orb = $('#orb'), rays = $('#rays');
    orb.style.left = o.x.toFixed(1) + 'px'; orb.style.top = o.y.toFixed(1) + 'px';
    rays.style.left = o.x.toFixed(1) + 'px'; rays.style.top = o.y.toFixed(1) + 'px';
    $('#arcProg').setAttribute('stroke-dasharray', (p * 100).toFixed(1) + ' 100');
    const dark = nowMin >= t1 - 30 || nowMin <= t0 + 10;
    orb.style.opacity = dark ? '.55' : '1';

    // lampu
    const marks = S.marks[today] || {};
    let cnt = 0;
    QJ.PRAYERS.forEach((pr, i) => {
      const b = $('.lamp[data-id="' + pr.id + '"]'); const q = pt(ps[i]);
      b.style.left = q.x.toFixed(1) + 'px'; b.style.top = q.y.toFixed(1) + 'px';
      const on = !!marks[pr.id]; if (on) cnt++;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', (on ? 'Batalkan tanda ' : 'Tandai ') + pr.name + ' ' + QJ.fmtMin(times[i]));
    });
    hero.classList.toggle('full', cnt === 5);
    $('#doneTxt').textContent = cnt === 5 ? 'Lima waktu hari ini sudah ditandai.' : cnt + ' dari 5 waktu ditandai · ketuk lentera';

    // waktu berikutnya
    let ni = times.findIndex((x) => x > nowMin), diffMin, name, tm, label = 'Waktu berikutnya';
    if (ni >= 0) { name = QJ.PRAYERS[ni].name; tm = times[ni]; diffMin = times[ni] - nowMin; }
    else {
      const tom = dayTimes(QJ.addDays(today, 1)); name = 'Subuh'; tm = tom.live ? tom.t.subuh : times[0]; diffMin = 1440 + tm - nowMin; label = 'Besok pagi';
    }
    const secs = Math.max(0, Math.round(diffMin * 60));
    $('#nxLabel').textContent = label; $('#nxName').textContent = name; $('#nxTime').textContent = QJ.fmtMin(tm);
    $('#nxCount').textContent = 'dalam ' + QJ.pad(Math.floor(secs / 3600)) + ':' + QJ.pad(Math.floor(secs / 60) % 60) + ':' + QJ.pad(secs % 60);

    // teks
    const gm = Math.floor(nowMin);
    $('#greet').textContent = 'Assalamualaikum';
    const hj = hij(today);
    $('#dateTxt').textContent = QJ.fmtLong(today) + (hj ? ' · ≈ ' + hj.d + ' ' + hj.name + ' ' + hj.y + ' H' : '');
    $('#tzTxt').textContent = '· ' + tzLabel(cityNow().tz);
    $('#tLabel').textContent = QJ.fmtMin(nowMin);
    const rt = S.last || { s: 1, a: 1 };
    $('#resTxt').textContent = (surahName(rt.s) || 'Al-Fatihah') + ' · ayat ' + rt.a;
    $('#hijriNote').textContent = hj ? 'Tanggal Hijriah adalah perkiraan' + (S.settings.hijriAdj ? ' (penyesuaian manual ' + (S.settings.hijriAdj > 0 ? '+' : '') + S.settings.hijriAdj + ' hari)' : '') + '.' : '';
    syncHomeStatus(live);

    // suasana & latar
    const mood = moodNow();
    const night = mood === 'ramadan' || dark;
    const lights = mood !== 'biasa' || nowMin >= times[3];
    let rgb = [250, 247, 241];
    for (let i = 0; i < SKY.length - 1; i++) if (nowMin >= SKY[i][0] && nowMin <= SKY[i + 1][0]) { const k = (nowMin - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]); rgb = SKY[i][1].map((v, j) => Math.round(v + (SKY[i + 1][1][j] - v) * k)); }
    if (nowMin > 1200) rgb = SKY[5][1]; else if (nowMin < 240) rgb = SKY[0][1];
    hero.style.background = cardBg(mood, rgb);
    rays.style.display = mood === 'biasa' ? '' : 'none';
    const sig = mood + '|' + night + '|' + lights;
    if (sig !== homeSig || force) {
      if (sig !== homeSig) $('#scene').innerHTML = sceneHTML(mood, night, lights, mood === 'biasa' ? '#B89B6A' : '#8B6F47');
      homeSig = sig;
    }
  }

  function tzLabel(tz) {
    try { const p = new Intl.DateTimeFormat('id-ID', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date()).find((x) => x.type === 'timeZoneName'); return p ? p.value : tz; } catch (e) { return tz; }
  }

  function syncHomeStatus(liveArg) {
    const foot = $('#foot'); if (!foot) return;
    const info = QJ.timesInfo();
    const live = liveArg != null ? liveArg : !!QJ.timesFor(nowZ().key);
    const m = QJ.methodId();
    const mName = m === 20 ? 'Kemenag RI' : m === 3 ? 'Muslim World League' : m === 4 ? 'Umm al-Qura' : m === 2 ? 'ISNA' : 'metode ' + m;
    let txt, cls = '';
    if (!navigator.onLine) txt = live ? 'Offline · jadwal tersimpan (' + mName + ')' : 'Offline · jadwal belum tersimpan, memakai contoh';
    else if (timesStatus === 'loading') txt = 'Memuat jadwal…';
    else if (live) { const d = info.at ? new Date(info.at) : null; txt = 'Jadwal ' + mName + (d ? ' · diperbarui ' + d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''); }
    else txt = 'Jadwal contoh (belum bisa dimuat). Ketuk ikon lokasi untuk mencoba lagi.';
    foot.textContent = txt;
  }

  function surahName(id) { return surahs ? (surahs.find((s) => s.id === id) || {}).name : null; }

  /* ================= AL-QUR'AN: daftar ================= */
  let surahs = null;
  async function loadSurahs() {
    if (surahs) return surahs;
    const r = await fetch('data/surah-list.json'); surahs = await r.json(); return surahs;
  }
  loadSurahs().then(() => { if ($('#resTxt')) tickHome(false); }).catch(() => {});

  async function renderQuran(r) {
    view.className = 'view';
    view.innerHTML = '<div class="page"><div class="topbar"><div><div class="h1">Al-Qur\'an</div></div></div>' + '<div class="sub">114 surah · teks dan terjemahan Bahasa Indonesia dari Kemenag RI</div>' +
      '<label class="sr" for="q">Cari surah</label><input id="q" class="search" type="search" placeholder="Cari nama atau nomor surah" autocomplete="off"><div class="surah-list" id="sl"><div class="small" style="text-align:center;padding:20px">Memuat…</div></div></div>';
    try { await loadSurahs(); } catch (e) { $('#sl').innerHTML = '<div class="notice">Daftar surah belum bisa dimuat. Periksa koneksi lalu coba lagi.</div>'; return; }
    const draw = (q) => {
      const t = q.trim().toLowerCase();
      const list = surahs.filter((s) => !t || String(s.id) === t || s.name.toLowerCase().includes(t) || s.meaning.toLowerCase().includes(t) || s.name.toLowerCase().replace(/[-'‘’]/g, '').includes(t.replace(/[-'‘’]/g, '')));
      $('#sl').innerHTML = list.length ? list.map((s) => '<a class="surah row" href="#/read/' + s.id + '"><span class="badge">' + s.id + '</span><span class="nm"><strong>' + esc(s.name) + '</strong><span>' + esc(s.meaning) + ' · ' + s.count + ' ayat · ' + esc(s.place) + '</span></span><span class="ar" lang="ar" dir="rtl">' + esc(s.ar) + '</span></a>').join('') : '<div class="notice">Tidak ada surah yang cocok.</div>';
    };
    draw(''); $('#q').addEventListener('input', (e) => draw(e.target.value)); 
  }

  /* ================= KISAH NABI ================= */
  let kisahIdx = null;
  const kisahCache = {};
  const KISAH_NOTE = 'Ringkasan ini disusun berdasarkan ayat-ayat Al-Qur\'an dan bukan tafsir resmi. Rujukan ayat ditampilkan agar Anda dapat memeriksa sendiri.';
  async function renderKisahList() {
    view.className = 'view';
    view.innerHTML = '<div class="page"><div class="topbar"><div><div class="h1">Kisah Nabi</div></div></div>' +
      '<div class="sub">Kisah para nabi, disusun dari ayat-ayat Al-Qur\'an</div><label class="sr" for="kq">Cari nabi</label><input id="kq" class="search" type="search" placeholder="Cari nama nabi" autocomplete="off"><div class="surah-list" id="kl"><div class="small" style="text-align:center;padding:20px">Memuat…</div></div><div class="notice" style="margin-top:14px">' + esc(KISAH_NOTE) + '</div></div>';
    try { if (!kisahIdx) kisahIdx = await (await fetch('data/kisah/index.json')).json(); }
    catch (e) { $('#kl').innerHTML = '<div class="notice">Daftar kisah belum bisa dimuat. Periksa koneksi lalu coba lagi.</div>'; return; }
    const draw = (q) => {
      const t = q.trim().toLowerCase();
      const list = kisahIdx.map((k, i) => ({ k, i })).filter((x) => !t || x.k.name.toLowerCase().includes(t) || x.k.sub.toLowerCase().includes(t));
      $('#kl').innerHTML = list.length ? list.map((x) => '<a class="surah row" href="#/kisah/' + x.k.id + '"><span class="badge">' + (x.i + 1) + '</span><span class="nm"><strong>' + esc(x.k.name) + '</strong><span>' + esc(x.k.sub) + '</span></span></a>').join('') : '<div class="notice">Tidak ada nabi yang cocok.</div>';
    };
    draw(''); $('#kq').addEventListener('input', (e) => draw(e.target.value));
  }

  async function renderKisah(r) {
    if (!r.a) return renderKisahList();
    view.className = 'view';
    view.innerHTML = '<div class="page"><div class="notice">Memuat kisah…</div></div>';
    const back = '<a class="icon-btn" href="#/kisah" aria-label="Kembali ke daftar kisah">' + ICO.back + '</a>';
    let d;
    try {
      const id = String(r.a || '').replace(/[^a-z]/g, '');
      d = kisahCache[id] || (kisahCache[id] = await (async () => { const x = await fetch('data/kisah/' + id + '.json'); if (!x.ok) throw new Error('gagal'); return x.json(); })());
      await loadSurahs();
    } catch (e) { view.innerHTML = '<div class="page">' + back + '<div class="notice">Kisah belum bisa dimuat. Jika Anda offline, buka kisah ini sekali saat online agar tersimpan.</div></div>'; return; }
    const parts = d.parts.map((p, i) => {
      const paras = p.t.split('\n\n').map((t) => '<p>' + esc(t) + '</p>').join('');
      const refs = (p.r || []).map((x, j) => {
        const nm = surahName(x[0]) || ('Surah ' + x[0]);
        const lbl = nm + ' : ' + x[1] + (x[2] > x[1] ? '–' + x[2] : '');
        return '<details class="kref" data-s="' + x[0] + '" data-a="' + x[1] + '" data-b="' + x[2] + '"><summary>' + esc(lbl) + '</summary><div class="kbody small">Memuat…</div></details>';
      }).join('');
      return '<section class="kpart"><h2 class="sec">' + esc(p.h) + '</h2>' + paras + (refs ? '<div class="small" style="margin:8px 0 4px">Ayat rujukan (ketuk untuk membuka):</div><div class="krefs">' + refs + '</div>' : '') + '</section>';
    }).join('');
    const hik = d.hikmah && d.hikmah.length ? '<section class="kpart"><h2 class="sec">Hikmah</h2><ul class="khik">' + d.hikmah.map((h) => '<li>' + esc(h) + '</li>').join('') + '</ul></section>' : '';
    view.innerHTML = '<div class="page"><div class="reader-head">' + back + '<div class="t"><strong>' + esc(d.name) + '</strong><span>' + esc(d.sub) + '</span></div></div><div class="notice" style="margin-top:12px">' + esc(KISAH_NOTE) + '</div><div class="kisah">' + parts + hik + '</div></div>';
    $$('.kref', view).forEach((el) => el.addEventListener('toggle', async () => {
      if (!el.open || el.dataset.done) return;
      const s = Number(el.dataset.s), a = Number(el.dataset.a), b = Number(el.dataset.b), box = $('.kbody', el);
      try {
        const data = await loadSurah(s), MAX = 12;
        const rows = data.filter((x) => x.n >= a && x.n <= b);
        const shown = rows.slice(0, MAX);
        box.innerHTML = shown.map((x) => '<div class="kayat"><div class="ar" lang="ar" dir="rtl">' + esc(x.ar) + '</div><div class="tr"><b>' + x.n + '.</b> ' + esc(cleanTr(x.tr)) + '</div></div>').join('') +
          (rows.length > MAX ? '<div class="small">Menampilkan ' + MAX + ' dari ' + rows.length + ' ayat.</div>' : '') +
          '<a class="btn soft" href="#/read/' + s + '/' + a + '">Buka di surah</a>';
        el.dataset.done = '1';
      } catch (e) { box.textContent = 'Ayat belum bisa dimuat. Periksa koneksi lalu buka lagi.'; }
    }));
  }

  /* ================= AL-QUR'AN: pembaca ================= */
  let cur = { s: 0, data: null, sel: 0 };
  const surahCache = {};
  async function loadSurah(id) {
    if (surahCache[id]) return surahCache[id];
    const r = await fetch('data/surah/' + id + '.json'); if (!r.ok) throw new Error('gagal');
    return (surahCache[id] = await r.json());
  }
  const cleanTr = (t) => String(t || '').replace(/(\d+)\)/g, '').replace(/\s+([.,;])/g, '$1').trim(); // buang tanda catatan kaki

  async function renderRead(r) {
    const id = Math.min(114, Math.max(1, parseInt(r.a, 10) || 1));
    view.className = 'view';
    view.innerHTML = '<div class="page"><div class="notice">Memuat surah…</div></div>';
    let list, data;
    try { list = await loadSurahs(); data = await loadSurah(id); }
    catch (e) { view.innerHTML = '<div class="page"><a class="icon-btn" href="#/quran" aria-label="Kembali">' + ICO.back + '</a><div class="notice">Surah belum bisa dimuat. Jika Anda offline, buka surah ini sekali saat online agar tersimpan.</div></div>'; return; }
    const meta = list.find((s) => s.id === id);
    cur = { s: id, data, sel: 0, meta };
    const startA = parseInt(r.b, 10) || (S.last.s === id ? S.last.a : 0);
    const draw = () => {
      const vm = S.settings.view;
      const items = data.map((a) => {
        const bm = !!S.bm[id + ':' + a.n];
        return '<div class="ayat' + (cur.sel === a.n ? ' sel' : '') + (player.active && player.s === id && player.n === a.n && player.playing ? ' playing' : '') + '" data-ayat="' + a.n + '"><button type="button" class="tap" data-act="ayat" data-n="' + a.n + '" aria-label="Ayat ' + a.n + ', ketuk untuk pilihan"><div class="meta"><span class="no">' + a.n + '</span>' + (bm ? ICO.bm : '') + '<span class="eq" aria-hidden="true" style="display:' + (player.active && player.s === id && player.n === a.n && player.playing ? 'inline-flex' : 'none') + '"><i></i><i></i><i></i></span></div><div class="ar" lang="ar" dir="rtl">' + esc(a.ar) + '</div>' + (vm === 'terj' ? '<div class="tr">' + esc(cleanTr(a.tr)) + '</div>' : '') + '</button>' +
          (cur.sel === a.n ? '<div class="acts"><button type="button" class="btn" data-act="playfrom" data-n="' + a.n + '">Putar dari sini</button><button type="button" class="btn soft" data-act="savebm" data-n="' + a.n + '">' + (bm ? 'Hapus simpanan' : 'Simpan') + '</button><button type="button" class="btn soft" data-act="share" data-n="' + a.n + '">Bagikan</button></div>' : '') + '</div>';
      }).join('');
      $('#ayl').innerHTML = vm === 'tafsir' ? '<div class="notice">Tafsir belum tersedia pada data Kemenag yang dipakai. Tab ini disiapkan untuk sumber tafsir yang nanti dipilih.</div>' : items;
      $$('.seg button', view).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === vm ? 'true' : 'false'));
    };
    view.innerHTML = '<div class="page"><div class="reader-head"><a class="icon-btn" href="#/quran" aria-label="Kembali ke daftar surah">' + ICO.back + '</a><div class="t"><strong>' + esc(meta.name) + '</strong><span>' + esc(meta.meaning) + ' · ' + meta.count + ' ayat · ' + esc(meta.place) + '</span></div><button type="button" class="icon-btn" data-act="playsurah" aria-label="Putar surah">' + ICO.play.replace('<svg', '<svg class="ico" style="fill:currentColor;stroke:none"') + '</button></div>' +
      '<div class="seg" style="margin-top:12px" role="group" aria-label="Tampilan"><button type="button" data-act="view" data-v="arab" aria-pressed="false">Arab</button><button type="button" data-act="view" data-v="terj" aria-pressed="false">Terjemahan</button><button type="button" data-act="view" data-v="tafsir" aria-pressed="false">Tafsir</button></div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-top:10px"><span class="small" style="flex:1">Ukuran teks Arab</span><button type="button" class="chip" data-act="fontdn" aria-label="Perkecil teks Arab">A−</button><button type="button" class="chip" data-act="fontup" aria-label="Perbesar teks Arab">A+</button></div>' +
      '<div class="ayat-list" id="ayl"></div><div class="small" style="text-align:center;margin-top:14px">Sumber teks dan terjemahan: Kemenag RI (quran.kemenag.go.id)</div></div>';
    draw();
    cur.draw = draw;
    if (startA) setTimeout(() => { const el = $('[data-ayat="' + startA + '"]'); if (el) el.scrollIntoView({ block: 'start' }); }, 50);
    let st;
    const onScroll = () => {
      clearTimeout(st);
      st = setTimeout(() => {
        const vt = view.getBoundingClientRect().top;
        const first = $$('.ayat', view).find((el) => el.getBoundingClientRect().bottom > vt + 90);
        if (first) { const n = Number(first.dataset.ayat); if (S.last.s !== id || S.last.a !== n) { S.last = { s: id, a: n }; QJ.save(); } }
      }, 400);
    };
    view.addEventListener('scroll', onScroll);
    cleanup = () => { view.removeEventListener('scroll', onScroll); cur.draw = null; };
  }

  window.addEventListener('qj:adzan-start', () => { try { audio.pause(); player.playing = false; renderMini(); markPlaying(); } catch (e) { /* abaikan */ } });

  /* ================= pemutar audio ================= */
  const audio = new Audio();
  audio.preload = 'auto';
  const player = { active: false, playing: false, s: 0, n: 0, count: 0, name: '' };
  const playerActive = () => player.active;

  function renderMini() {
    document.body.classList.toggle('has-mini', player.active);
    if (!player.active) { miniEl.hidden = true; miniEl.innerHTML = ''; return; }
    miniEl.hidden = false;
    miniEl.innerHTML = '<button type="button" class="play' + (player.playing ? ' on' : '') + '" data-act="mplay" aria-label="' + (player.playing ? 'Jeda' : 'Putar') + '">' + (player.playing ? ICO.pause : ICO.play) + '</button>' +
      '<a class="info" href="#/read/' + player.s + '/' + player.n + '"><strong>' + esc(player.name) + ' · ayat ' + player.n + '</strong><span>Abu Bakr Ash-Shaatree · Kemenag</span></a>' +
      '<button type="button" class="ctl" data-act="mprev" aria-label="Ayat sebelumnya">' + ICO.prev + '</button><button type="button" class="ctl" data-act="mnext" aria-label="Ayat berikutnya">' + ICO.fwd + '</button><button type="button" class="ctl" data-act="mstop" aria-label="Tutup pemutar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#FAF7F1" stroke-width="2" stroke-linecap="round"/></svg></button><div class="bar" id="mbar"></div>';
  }
  function markPlaying() {
    $$('.ayat', view).forEach((el) => {
      const on = player.active && cur.s === player.s && Number(el.dataset.ayat) === player.n && player.playing;
      el.classList.toggle('playing', on);
      const eq = $('.eq', el); if (eq) eq.style.display = on ? 'inline-flex' : 'none';
    });
  }
  async function startAudio(s, n, name, count) {
    player.s = s; player.n = n; player.name = name; player.count = count; player.active = true;
    audio.src = AUDIO_BASE + pad3(s) + pad3(n) + '.m4a';
    renderMini();
    try { await audio.play(); player.playing = true; }
    catch (e) { player.playing = false; toast('Audio belum bisa diputar. Periksa koneksi internet.'); }
    renderMini(); markPlaying();
    if (player.playing && cur.s === s) {
      const el = $('[data-ayat="' + n + '"]'); if (el && !motionReduced()) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); else if (el) el.scrollIntoView({ block: 'center' });
    }
    S.last = { s, a: n }; QJ.save();
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: name + ' · ayat ' + n, artist: 'Abu Bakr Ash-Shaatree', album: 'Quran Journey', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
        navigator.mediaSession.setActionHandler('play', () => audio.play()); navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('nexttrack', () => step(1)); navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
      } catch (e) { /* tidak didukung */ }
    }
  }
  function step(d) { const n = player.n + d; if (n >= 1 && n <= player.count) startAudio(player.s, n, player.name, player.count); }
  audio.addEventListener('ended', () => { if (player.n < player.count) step(1); else { player.playing = false; renderMini(); markPlaying(); } });
  audio.addEventListener('pause', () => { if (!audio.ended) { player.playing = false; renderMini(); markPlaying(); } });
  audio.addEventListener('play', () => { player.playing = true; renderMini(); markPlaying(); });
  audio.addEventListener('error', () => { if (player.active) { player.playing = false; renderMini(); toast('Audio ayat ini tidak bisa dimuat. Periksa koneksi internet.'); } });
  audio.addEventListener('timeupdate', () => {
    const bar = $('#mbar'); if (!bar || !audio.duration) return;
    bar.style.width = (((player.n - 1) + audio.currentTime / audio.duration) / player.count * 100).toFixed(1) + '%';
  });

  /* ================= IBADAH ================= */
  let ibKey = null, pfY = null, pfM = null;
  function renderIbadah() {
    const z = nowZ(); const today = z.key;
    if (!ibKey) ibKey = today;
    if (pfY == null) { pfY = z.y; pfM = z.m; }
    const marks = S.marks[ibKey] || {};
    const T = timesOf(ibKey);
    const cnt = QJ.PRAYERS.filter((p) => marks[p.id]).length;
    const rows = QJ.PRAYERS.map((p) => {
      const on = !!marks[p.id];
      return '<button type="button" class="prow row" data-act="pmark" data-id="' + p.id + '" aria-pressed="' + on + '"><span class="ck">' + ICO.check + '</span><span class="nm">' + p.name + '</span><span class="st">' + (on ? 'Ditandai' : 'Belum dicatat') + '</span><span class="tm">' + (T && T[p.id] != null ? QJ.fmtMin(T[p.id]) : '—') + '</span></button>';
    }).join('');
    const week = []; for (let i = 6; i >= 0; i--) { const k = QJ.addDays(ibKey, -i); const m = S.marks[k] || {}; const n = QJ.PRAYERS.filter((p) => m[p.id]).length; week.push('<div class="w">' + QJ.HARI[QJ.dow(k)].slice(0, 3) + '<i title="' + n + ' dari 5"><b style="width:' + n * 20 + '%"></b></i></div>'); }
    // puasa
    const types = [['ramadan', 'Ramadan'], ['qadha', 'Qadha'], ['sunah', 'Sunah']];
    const dim = QJ.daysInMonth(pfY, pfM), lead = (new Date(Date.UTC(pfY, pfM - 1, 1)).getUTCDay() + 6) % 7;
    let cells = ''; for (let i = 0; i < lead; i++) cells += '<span></span>';
    let monthCount = 0;
    for (let d = 1; d <= dim; d++) {
      const k = QJ.key(pfY, pfM, d), ft = S.fast[k], fut = k > today; if (ft) monthCount++;
      cells += '<button type="button" class="day" data-act="fast" data-k="' + k + '" ' + (fut ? 'disabled style="opacity:.4"' : '') + ' aria-pressed="' + !!ft + '" aria-label="' + QJ.fmtLong(k) + (ft ? ', puasa ' + ft : ', belum dicatat') + '" style="' + (ft ? 'background:var(--champagne)' : '') + '"><span class="g">' + d + '</span><span class="h">' + (ft ? ft[0].toUpperCase() : '') + '</span></button>';
    }
    const yr = pfY, hy = (hij(today) || {}).y;
    const count = (f) => Object.keys(S.fast).filter(f).length;
    const sumM = (t) => count((k) => S.fast[k] === t && k.startsWith(yr + '-'));
    const sumH = (t) => count((k) => S.fast[k] === t && (hij(k) || {}).y === hy);
    view.className = 'view';
    view.innerHTML = '<div class="page"><div class="h1">Ibadah</div><div class="sub">Catatan pribadi di perangkat Anda. Yang belum diisi berarti belum dicatat, bukan ditinggalkan.</div>' +
      '<div class="daynav"><button type="button" class="icon-btn" data-act="dayprev" aria-label="Hari sebelumnya">' + ICO.back + '</button><div class="d"><strong>' + (ibKey === today ? 'Hari ini' : QJ.fmtLong(ibKey).split(',')[0]) + '</strong><span>' + QJ.fmtLong(ibKey).split(', ')[1] + ' · ≈ ' + hijText(ibKey) + '</span></div><button type="button" class="icon-btn" data-act="daynext" aria-label="Hari berikutnya" ' + (ibKey >= today ? 'disabled style="opacity:.4"' : '') + '>' + ICO.next + '</button></div>' +
      '<div class="card plist"><div class="head"><b>Salat</b><span class="small">' + cnt + ' dari 5 ditandai</span></div>' + rows + '<div class="weekdots" aria-label="Tujuh hari terakhir">' + week.join('') + '</div></div>' +
      (T ? '' : '<div class="small" style="margin-top:8px">Jadwal untuk tanggal ini belum tersimpan. Buka Beranda saat online untuk memuatnya.</div>') +
      '<div class="card puasa"><div class="ringrow"><div class="ringbox"><svg viewBox="0 0 120 120" width="112" height="112" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="#EFE4D0" stroke-width="9"/><circle class="ring" cx="60" cy="60" r="52" pathLength="100" fill="none" stroke="#D4B27A" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + (monthCount / dim * 100).toFixed(1) + ' 100" transform="rotate(-90 60 60)"/></svg><div class="mid">' + ICO.moon + '<b>' + monthCount + '</b></div></div>' +
      '<div style="flex:1"><b style="font-size:15px">Perjalanan puasa</b><div class="sub">' + monthCount + ' hari dicatat di ' + QJ.BULAN[pfM - 1] + ' ' + pfY + '. Ketuk tanggal untuk menandai atau membatalkan.</div></div></div>' +
      '<div class="types" role="group" aria-label="Jenis puasa">' + types.map((t) => '<button type="button" class="chip" data-act="ftype" data-t="' + t[0] + '" aria-pressed="' + (S.fastType === t[0]) + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div class="cal-head" style="margin-top:12px"><button type="button" class="icon-btn" data-act="pfprev" aria-label="Bulan sebelumnya">' + ICO.back + '</button><div><strong>' + QJ.BULAN[pfM - 1] + ' ' + pfY + '</strong></div><button type="button" class="icon-btn" data-act="pfnext" aria-label="Bulan berikutnya">' + ICO.next + '</button></div>' +
      '<div class="cal-dow"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div><div class="cal-grid">' + cells + '</div>' +
      '<div class="small" style="margin-top:10px">Ringkasan ' + yr + ' (Masehi): Ramadan ' + sumM('ramadan') + ' · Qadha ' + sumM('qadha') + ' · Sunah ' + sumM('sunah') + (hy ? '<br>Ringkasan ' + hy + ' H (Hijriah, perkiraan): Ramadan ' + sumH('ramadan') + ' · Qadha ' + sumH('qadha') + ' · Sunah ' + sumH('sunah') : '') + '</div></div></div>';
  }

  /* ================= KALENDER ================= */
  let kY = null, kM = null, kSel = null;
  function renderKalender() {
    const z = nowZ(); const today = z.key;
    if (kY == null) { kY = z.y; kM = z.m; }
    if (!kSel) kSel = today;
    const dim = QJ.daysInMonth(kY, kM), lead = (new Date(Date.UTC(kY, kM - 1, 1)).getUTCDay() + 6) % 7;
    let cells = ''; for (let i = 0; i < lead; i++) cells += '<span></span>';
    for (let d = 1; d <= dim; d++) {
      const k = QJ.key(kY, kM, d), h = hij(k), ev = h && QJ.eventOf(h), ft = S.fast[k];
      cells += '<button type="button" class="day ' + (h && h.m % 2 ? 'ma' : 'mb') + (h && h.d === 1 ? ' first' : '') + (k === today ? ' today' : '') + (k === kSel ? ' sel' : '') + '" data-act="kpick" data-k="' + k + '" aria-pressed="' + (k === kSel) + '" aria-label="' + QJ.fmtLong(k) + (ev ? ', ' + ev : '') + '"><span class="g">' + d + '</span><span class="h">' + (h ? h.d : '') + '</span>' + (ev ? '<i class="dot"></i>' : '') + (ft ? '<span class="tag">' + ft[0].toUpperCase() + '</span>' : '') + '</button>';
    }
    const hs = hij(QJ.key(kY, kM, 1)), he = hij(QJ.key(kY, kM, dim));
    const hr = hs && he ? (hs.name === he.name ? hs.name + ' ' + hs.y + ' H' : hs.name + ' – ' + he.name + ' ' + he.y + ' H') : '';
    const legend = []; for (let d = 1; d <= dim; d++) { const hh = hij(QJ.key(kY, kM, d)); if (hh && !legend.some((x) => x.m === hh.m)) legend.push({ m: hh.m, name: hh.name, y: hh.y }); }
    const legHTML = '<div class="cal-leg">' + legend.map((x) => '<span><i class="sw ' + (x.m % 2 ? 'ma' : 'mb') + '"></i>' + esc(x.name) + ' ' + x.y + '</span>').join('') + '</div>';
    const selH = hij(kSel), selEv = selH && QJ.eventOf(selH);
    const rd = QJ.daysToRamadan(today, S.settings.hijriAdj);
    const up = QJ.upcoming(today, S.settings.hijriAdj, 6);
    view.className = 'view';
    view.innerHTML = '<div class="page"><div class="h1">Kalender</div><div class="sub">Angka besar = Masehi · angka cokelat di bawahnya = Hijriah</div>' +
      '<div class="card cal"><div class="cal-head"><button type="button" class="icon-btn" data-act="kprev" aria-label="Bulan sebelumnya">' + ICO.back + '</button><div><strong>' + QJ.BULAN[kM - 1] + ' ' + kY + '</strong><span>≈ ' + hr + '</span></div><button type="button" class="icon-btn" data-act="knext" aria-label="Bulan berikutnya">' + ICO.next + '</button></div>' +
      legHTML + '<div class="cal-dow"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div><div class="cal-grid">' + cells + '</div></div>' +
      '<div class="infocard"><b>' + QJ.fmtLong(kSel) + '</b><p>≈ ' + hijText(kSel) + (selEv ? ' · <b style="color:var(--text)">' + esc(selEv) + '</b>' : '') + '</p></div>' +
      (rd != null ? '<div class="card" style="margin-top:12px;padding:14px 16px;display:flex;gap:14px;align-items:center">' + ICO.moon + '<div><b style="font-size:15px">' + (rd === 0 ? 'Hari ini awal Ramadan (perkiraan)' : 'Ramadan ± ' + rd + ' hari lagi') + '</b><div class="small" style="line-height:1.5">Perkiraan awal ' + QJ.fmtLong(QJ.addDays(today, rd)) + '. Tanggal resmi menunggu penetapan Kemenag.</div></div></div>' : '') +
      '<div class="card" style="margin-top:12px;padding:8px 14px"><div style="padding:8px 0 2px"><b style="font-size:15px">Hari penting berikutnya</b></div>' + up.map((e) => '<div class="event"><div class="dt">' + parseInt(e.key.slice(8), 10) + ' ' + QJ.BULAN[parseInt(e.key.slice(5, 7), 10) - 1].slice(0, 3) + '</div><div><div class="nm">' + esc(e.name) + '</div><div class="ex">' + (e.days === 0 ? 'Hari ini' : e.days + ' hari lagi') + ' · perkiraan</div></div></div>').join('') + '</div>' +
      '<div class="small" style="margin-top:14px;line-height:1.6">Tanggal Hijriah dihitung dengan kalender Umm al-Qura dan bersifat <b>perkiraan</b>. Untuk Indonesia, tanggal resmi mengikuti penetapan Kemenag dan bisa berbeda satu hari. Anda dapat menyesuaikan di Pengaturan.</div></div>';
  }

  /* ================= PENGATURAN ================= */
  let installEvt = null, wipeArmed = false;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (parseHash().name === 'settings') route(); });
  function adzanCard() {
    const ad = window.QJAdzan ? window.QJAdzan.cfg() : { on: false };
    const sw1 = (act, on, label, id) => '<span class="swwrap"><button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-label="' + label + '" data-act="' + act + '"' + (id ? ' data-id="' + id + '"' : '') + '></button></span>';
    let h = '<div class="card sec"><h3>Adzan</h3><div class="setrow"><div class="lb"><b>Adzan otomatis</b><span>Berbunyi saat masuk waktu salat selama aplikasi terbuka. Jika aplikasi ditutup atau HP terkunci, adzan belum bisa berbunyi.</span></div>' + sw1('adzanon', !!ad.on, 'Adzan otomatis') + '</div>';
    if (ad.on) {
      h += QJ.PRAYERS.map((p) => '<div class="setrow"><div class="lb"><b>' + p.name + '</b></div>' + sw1('adzanp', ad[p.id] !== false, 'Adzan ' + p.name, p.id) + '</div>').join('');
    }
    h += '<div class="btnrow"><button class="btn soft" type="button" data-act="adzantest" data-id="subuh">Coba adzan Subuh</button><button class="btn soft" type="button" data-act="adzantest" data-id="zuhur">Coba adzan biasa</button></div>' +
      '<div class="small" style="margin-top:8px;line-height:1.6">Tekan sekali tombol coba di atas agar HP mengizinkan suara. Adzan memakai jadwal asli; bila jadwal belum termuat, adzan tidak berbunyi.</div></div>';
    return h;
  }
  function pushCard() {
    const P = window.QJPush, sy = window.QJSync;
    const sw1 = (on) => '<span class="swwrap"><button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-label="Notifikasi waktu salat" data-act="pushon"></button></span>';
    let body;
    if (!P || !P.supported()) body = '<div class="setrow"><div class="lb"><b>Belum didukung</b><span>Browser atau HP ini belum mendukung notifikasi. Di iPhone, pasang dulu aplikasi ke layar utama lewat Safari (Bagikan → Tambah ke Layar Utama), lalu buka dari ikonnya.</span></div></div>';
    else if (!sy || !sy.enabled || !P.ready()) body = '<div class="setrow"><div class="lb"><b>Belum diaktifkan</b><span>Fitur ini perlu Firebase dan pengirim notifikasi yang diaktifkan oleh pembuat aplikasi.</span></div></div>';
    else if (!sy.user) body = '<div class="setrow"><div class="lb"><b>Masuk dengan Google dulu</b><span>Notifikasi dikirim lewat akun Anda. Masuk di bagian Akun &amp; sinkronisasi di atas.</span></div></div>';
    else {
      const on = !!P.cfg().on;
      body = '<div class="setrow"><div class="lb"><b>Notifikasi waktu salat</b><span>Muncul di HP walau aplikasi ditutup. Bisa terlambat beberapa menit dan berbunyi nada notifikasi biasa, bukan adzan. Ketuk notifikasinya untuk memutar adzan.</span></div>' + sw1(on) + '</div>' +
        (on ? '<div class="small" style="margin-top:4px">' + esc(P.status() || 'Menyiapkan…') + '</div><div class="btnrow"><button class="btn soft" type="button" data-act="pushtest">Coba notifikasi</button></div>' : '');
    }
    return '<div class="card sec"><h3>Notifikasi</h3>' + body + '</div>';
  }
  function renderSettings() {
    const c = cityNow(), sy = window.QJSync;
    const opt = (v, l, cur) => '<option value="' + v + '"' + (String(cur) === String(v) ? ' selected' : '') + '>' + l + '</option>';
    const cityOpts = QJ.CITIES.map((x) => opt(x.name, x.name + ', ' + x.country, c.gps ? '' : c.name)).join('');
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const sw = (act, on, label) => '<span class="swwrap"><button type="button" class="switch" role="switch" aria-checked="' + on + '" aria-label="' + label + '" data-act="' + act + '"></button></span>';
    const acct = !sy || !sy.enabled ? '<div class="setrow"><div class="lb"><b>Sinkronisasi belum diaktifkan</b><span>Catatan Anda tersimpan di perangkat ini. Sinkronisasi antar-HP bersifat opsional dan perlu diaktifkan oleh pembuat aplikasi.</span></div></div>' :
      (sy.user ? '<div class="setrow"><div class="lb"><b>' + esc(sy.user.name || sy.user.email) + '</b><span>' + esc(sy.status) + '</span></div></div><div class="btnrow"><button class="btn soft" type="button" data-act="signout">Keluar</button></div>' :
        '<div class="setrow"><div class="lb"><b>Masuk dengan Google</b><span>Agar catatan salat, puasa, dan bookmark ikut ada di HP lain. Tidak wajib. ' + esc(sy.status) + '</span></div></div><div class="btnrow"><button class="btn" type="button" data-act="signin">Masuk dengan Google</button></div>');
    view.className = 'view';
    view.innerHTML = '<div class="page"><div class="reader-head"><a class="icon-btn" href="#/home" aria-label="Kembali">' + ICO.back + '</a><div class="t"><strong>Pengaturan</strong></div><div style="width:44px"></div></div>' +
      '<div class="card sec"><h3>Lokasi & jadwal</h3><div class="setrow"><div class="lb"><b>' + esc(c.name) + (c.country ? ', ' + esc(c.country) : '') + '</b><span>Zona waktu ' + esc(c.tz) + ' · ' + (c.gps ? 'dari lokasi perangkat' : 'kota pilihan manual') + '</span></div></div><div class="btnrow"><button class="btn" type="button" data-act="askgps">Gunakan lokasi saya</button><button class="btn soft" type="button" data-act="refreshtimes">Perbarui jadwal</button></div>' +
      '<div class="setrow"><div class="lb"><b>Kota manual</b></div><select id="selCity" aria-label="Pilih kota">' + (c.gps ? '<option value="" selected>Pilih…</option>' : '') + cityOpts + '</select></div>' +
      '<div class="setrow"><div class="lb"><b>Metode jadwal salat</b><span>Otomatis: Kemenag RI untuk Indonesia, Muslim World League di luar Indonesia. Pindah lokasi tidak mengubah pilihan Anda.</span></div><select id="selMethod" aria-label="Metode jadwal">' + opt('auto', 'Otomatis', S.settings.method) + opt(20, 'Kemenag RI', S.settings.method) + opt(3, 'Muslim World League', S.settings.method) + opt(4, 'Umm al-Qura', S.settings.method) + opt(2, 'ISNA', S.settings.method) + '</select></div>' +
      '<div class="setrow"><div class="lb"><b>Penyesuaian tanggal Hijriah</b><span>Gunakan bila penetapan resmi berbeda dari perkiraan. Saat aktif, aplikasi memberi tahu.</span></div><select id="selAdj" aria-label="Penyesuaian Hijriah">' + [-2, -1, 0, 1, 2].map((v) => opt(v, (v > 0 ? '+' : '') + v + ' hari', S.settings.hijriAdj)).join('') + '</select></div></div>' +
      adzanCard() + pushCard() +
      '<div class="card sec"><h3>Tampilan</h3><div class="setrow"><div class="lb"><b>Suasana</b><span>Otomatis mengikuti Ramadan dan hari raya (perkiraan).</span></div><select id="selMood" aria-label="Suasana">' + opt('auto', 'Otomatis', S.settings.mood) + opt('biasa', 'Biasa', S.settings.mood) + opt('ramadan', 'Ramadan', S.settings.mood) + opt('eid', 'Idulfitri', S.settings.mood) + '</select></div>' +
      '<div class="setrow"><div class="lb"><b>Animasi</b><span>Ikuti pengaturan HP, kurangi, atau penuh.</span></div><select id="selMotion" aria-label="Animasi">' + opt('system', 'Ikuti sistem', S.settings.motion) + opt('reduce', 'Dikurangi', S.settings.motion) + opt('full', 'Penuh', S.settings.motion) + '</select></div>' +
      '<div class="setrow"><div class="lb"><b>Ukuran teks Arab</b><span id="arabVal">' + S.settings.arab + ' px</span></div><input id="rngArab" type="range" min="24" max="48" step="2" value="' + S.settings.arab + '" aria-label="Ukuran teks Arab" style="width:150px;accent-color:var(--champagne-deep)"></div>' +
      '<div class="setrow"><div class="lb"><b>Pratinjau waktu di Beranda</b><span>Menampilkan penggeser untuk melihat lengkung di jam lain.</span></div>' + sw('prevsw', preview, 'Pratinjau waktu') + '</div>' +
      '<div class="btnrow"><button class="btn soft" type="button" data-act="replay">Putar ulang animasi pembuka</button></div></div>' +
      '<div class="card sec"><h3>Akun & sinkronisasi</h3>' + acct + '</div>' +
      '<div class="card sec"><h3>Aplikasi</h3>' + (standalone ? '<div class="setrow"><div class="lb"><b>Sudah terpasang</b><span>Anda memakai aplikasi dari layar utama.</span></div></div>' : installEvt ? '<div class="btnrow"><button class="btn" type="button" data-act="install">Pasang aplikasi ke layar utama</button></div>' : '<div class="setrow"><div class="lb"><b>Pasang ke layar utama</b><span>' + (isIOS ? 'Di iPhone/iPad: ketuk tombol Bagikan di Safari, lalu “Tambah ke Layar Utama”.' : 'Gunakan menu browser, lalu “Instal aplikasi” atau “Tambahkan ke layar utama”.') + '</span></div></div>') + '</div>' +
      '<div class="card sec"><h3>Data Anda</h3><div class="setrow"><div class="lb"><span>Catatan salat, puasa, dan bookmark tersimpan di perangkat ini' + (QJ.memoryOnly ? ' <b>(penyimpanan browser dimatikan, data hilang saat ditutup)</b>' : '') + '. Tidak ada yang dikirim ke server kecuali Anda masuk dengan Google.</span></div></div><div class="btnrow"><button class="btn soft" type="button" data-act="export">Cadangkan (unduh)</button><label class="btn soft" style="cursor:pointer">Pulihkan<input type="file" id="fileImp" accept="application/json" class="sr"></label><button class="btn danger" type="button" data-act="wipe">' + (wipeArmed ? 'Ketuk lagi untuk menghapus' : 'Hapus semua data') + '</button></div></div>' +
      '<div class="card sec"><h3>Tentang & sumber data</h3><div class="setrow"><div class="lb"><span style="line-height:1.6">Teks Arab dan terjemahan Indonesia: Kementerian Agama RI (quran.kemenag.go.id). Audio murattal: Abu Bakr Ash-Shaatree melalui media.qurankemenag.net. Jadwal salat: Aladhan (aladhan.com) dengan metode yang Anda pilih. Tanggal Hijriah: kalender Umm al-Qura (perkiraan). Tafsir belum tersedia. Adzan: rekaman dari repositori adhan-audio. Kisah Nabi: ringkasan yang disusun dari ayat-ayat Al-Qur\'an, bukan tafsir resmi.<br>Quran Journey v1.0 · Tahap 1</span></div></div></div></div>';
    $('#selCity').addEventListener('change', (e) => { const x = QJ.CITIES.find((q) => q.name === e.target.value); if (x) { QJ.setCity(x); refreshLocation(); } });
    $('#selMethod').addEventListener('change', (e) => { S.settings.method = e.target.value; QJ.save(); refreshTimes(true); });
    $('#selAdj').addEventListener('change', (e) => { S.settings.hijriAdj = Number(e.target.value); QJ.save(); toast('Penyesuaian Hijriah: ' + (S.settings.hijriAdj > 0 ? '+' : '') + S.settings.hijriAdj + ' hari'); });
    $('#selMood').addEventListener('change', (e) => { S.settings.mood = e.target.value; QJ.save(); toast('Suasana diubah. Lihat di Beranda.'); });
    $('#selMotion').addEventListener('change', (e) => { S.settings.motion = e.target.value; QJ.save(); applyMotion(); });
    $('#rngArab').addEventListener('input', (e) => { S.settings.arab = Number(e.target.value); $('#arabVal').textContent = S.settings.arab + ' px'; applyArabSize(); QJ.save(); });
    $('#fileImp').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { try { const o = JSON.parse(rd.result); if (!o || typeof o !== 'object' || !o.marks) throw new Error('x'); QJ.importAll(o); toast('Data berhasil dipulihkan.'); } catch (err) { toast('File cadangan tidak dikenali.'); } };
      rd.readAsText(f);
    });
    if (sy) { sy.on(() => { if (parseHash().name === 'settings') route(); }); }
  }

  /* ================= aksi klik ================= */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const act = t.dataset.act, today = nowZ().key;
    switch (act) {
      case 'lamp': { const id = t.dataset.id; const m = S.marks[today] || (S.marks[today] = {}); if (m[id]) delete m[id]; else m[id] = true; QJ.save(); tickHome(false); break; }
      case 'refreshloc': refreshLocation({ ask: !S.settings.locAsked }); break;
      case 'askgps': refreshLocation({ ask: true }).then(() => {}); break;
      case 'manualcity': S.settings.locAsked = true; QJ.save(); go('#/settings'); break;
      case 'refreshtimes': refreshTimes(true).then((r) => toast(r === 'ok' ? 'Jadwal diperbarui.' : 'Belum bisa memuat jadwal. Periksa koneksi.')); break;
      case 'resume': go('#/read/' + (S.last.s || 1) + '/' + (S.last.a || 1)); break;
      case 'view': S.settings.view = t.dataset.v; QJ.save(); if (cur.draw) cur.draw(); break;
      case 'fontup': S.settings.arab = Math.min(48, S.settings.arab + 2); applyArabSize(); QJ.save(); break;
      case 'fontdn': S.settings.arab = Math.max(24, S.settings.arab - 2); applyArabSize(); QJ.save(); break;
      case 'ayat': { const n = Number(t.dataset.n); cur.sel = cur.sel === n ? 0 : n; S.last = { s: cur.s, a: n }; QJ.save(true); cur.draw && cur.draw(); break; }
      case 'playfrom': startAudio(cur.s, Number(t.dataset.n), cur.meta.name, cur.meta.count); break;
      case 'playsurah': startAudio(cur.s, 1, cur.meta.name, cur.meta.count); break;
      case 'savebm': { const k = cur.s + ':' + t.dataset.n; if (S.bm[k]) delete S.bm[k]; else S.bm[k] = Date.now(); QJ.save(); cur.draw && cur.draw(); break; }
      case 'share': {
        const a = cur.data[Number(t.dataset.n) - 1];
        const text = a.ar + '\n\n' + cleanTr(a.tr) + '\n\n— QS ' + cur.meta.name + ' ayat ' + a.n + ' (terjemahan Kemenag RI)';
        if (navigator.share) navigator.share({ text }).catch(() => {});
        else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Ayat disalin beserta sumbernya.'), () => toast('Tidak bisa menyalin ayat.'));
        break;
      }
      case 'mplay': if (audio.paused) audio.play().catch(() => toast('Audio belum bisa diputar.')); else audio.pause(); break;
      case 'mprev': step(-1); break;
      case 'mnext': step(1); break;
      case 'mstop': audio.pause(); player.active = false; player.playing = false; renderMini(); markPlaying(); break;
      case 'pmark': { const id = t.dataset.id; const m = S.marks[ibKey] || (S.marks[ibKey] = {}); if (m[id]) delete m[id]; else m[id] = true; QJ.save(); renderIbadah(); break; }
      case 'dayprev': ibKey = QJ.addDays(ibKey, -1); renderIbadah(); break;
      case 'daynext': if (ibKey < today) { ibKey = QJ.addDays(ibKey, 1); renderIbadah(); } break;
      case 'ftype': S.fastType = t.dataset.t; QJ.save(true); renderIbadah(); break;
      case 'fast': { const k = t.dataset.k; if (k > today) break; if (S.fast[k] === S.fastType) delete S.fast[k]; else S.fast[k] = S.fastType; QJ.save(); renderIbadah(); break; }
      case 'pfprev': pfM--; if (pfM < 1) { pfM = 12; pfY--; } renderIbadah(); break;
      case 'pfnext': pfM++; if (pfM > 12) { pfM = 1; pfY++; } renderIbadah(); break;
      case 'kprev': kM--; if (kM < 1) { kM = 12; kY--; } renderKalender(); break;
      case 'knext': kM++; if (kM > 12) { kM = 1; kY++; } renderKalender(); break;
      case 'kpick': kSel = t.dataset.k; renderKalender(); break;
      case 'pushon': {
        const P = window.QJPush;
        (P.cfg().on ? P.disable() : P.enable()).then(() => renderSettings()).catch((err) => {
          const m = { 'belum-masuk': 'Masuk dengan Google dulu.', ditolak: 'Izin notifikasi ditolak. Aktifkan lewat pengaturan browser.', 'belum-didukung': 'Browser ini belum mendukung notifikasi.', 'tanpa-kunci': 'Kunci notifikasi belum dipasang.' }[err && err.message] || 'Notifikasi belum bisa diaktifkan.';
          toast(m, true); renderSettings();
        });
        break;
      }
      case 'pushtest': window.QJPush.test().then(() => toast('Notifikasi contoh dikirim.', true)).catch(() => toast('Izin notifikasi belum diberikan.', true)); break;
      case 'adzanon': { const on = !(window.QJAdzan.cfg().on); window.QJAdzan.setOn(on); renderSettings(); break; }
      case 'adzanp': { const id = t.dataset.id; window.QJAdzan.setPrayer(id, !(window.QJAdzan.cfg()[id] !== false)); renderSettings(); break; }
      case 'adzantest': window.QJAdzan.test(t.dataset.id); break;
      case 'prevsw': preview = !preview; renderSettings(); break;
      case 'replay': go('#/home'); startSplash(); break;
      case 'install': if (installEvt) { installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; route(); }); } break;
      case 'signin': window.QJSync && window.QJSync.signIn(); break;
      case 'signout': window.QJSync && window.QJSync.signOut(); break;
      case 'export': {
        const blob = new Blob([JSON.stringify({ app: 'quran-journey', version: 1, exportedAt: new Date().toISOString(), marks: S.marks, fast: S.fast, bm: S.bm, last: S.last, fastType: S.fastType, settings: S.settings }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quran-journey-cadangan-' + today + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        break;
      }
      case 'wipe': if (!wipeArmed) { wipeArmed = true; renderSettings(); setTimeout(() => { wipeArmed = false; }, 5000); } else { wipeArmed = false; QJ.resetAll(); toast('Semua data dihapus dari perangkat ini.'); go('#/home'); } break;
      default: break;
    }
  });

  /* ================= mulai ================= */
  applyMotion(); applyArabSize();
  if (!window.QJSync) window.QJSync = { enabled: false, on() {}, push() {} };
  if (window.QJSync.enabled) window.QJSync.init({ exportState: QJ.exportState, mergeState: QJ.mergeState, applyState: QJ.applyState });
  if (!location.hash) history.replaceState(null, '', '#/home');
  route();
  startSplash();
})();
