/* Sinkronisasi opsional lewat Firebase (login Google + Firestore).
   Jika js/firebase-config.js masih null, file ini tidak melakukan apa-apa. */
(function () {
  'use strict';
  const cfg = window.FIREBASE_CONFIG;
  const VER = '10.14.1';
  const BASE = 'https://www.gstatic.com/firebasejs/' + VER + '/';
  const listeners = [];
  const S = {
    enabled: !!cfg,
    user: null,
    status: cfg ? 'Belum masuk' : 'Belum diaktifkan',
    on(fn) { listeners.push(fn); },
    emit() { listeners.forEach((f) => { try { f(); } catch (e) { /* abaikan */ } }); }
  };
  window.QJSync = S;
  if (!cfg) { S.init = async () => {}; S.signIn = async () => {}; S.signOut = async () => {}; S.push = () => {}; S.saveDevice = async () => false; S.removeDevice = async () => false; S.deviceId = ''; return; }

  let mod = {}, auth, db, api, pushTimer, unsub, lastRemoteStamp = 0;
  const deviceId = (() => {
    try {
      let d = localStorage.getItem('qj.device');
      if (!d) { d = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('qj.device', d); }
      return d;
    } catch (e) { return 'tanpa-penyimpanan'; }
  })();

  S.deviceId = deviceId;
  S.saveDevice = async function (data) {
    if (!S.user || !db) return false;
    await mod.setDoc(mod.doc(db, 'users', S.user.uid, 'devices', deviceId), data);
    return true;
  };
  S.removeDevice = async function () {
    if (!S.user || !db) return false;
    await mod.deleteDoc(mod.doc(db, 'users', S.user.uid, 'devices', deviceId));
    return true;
  };

  function setStatus(t) { S.status = t; S.emit(); }

  S.init = async function (appApi) {
    api = appApi; // { exportState(), mergeState(remote), applyState(remote) }
    try {
      const [a, au, fs] = await Promise.all([
        import(BASE + 'firebase-app.js'),
        import(BASE + 'firebase-auth.js'),
        import(BASE + 'firebase-firestore.js')
      ]);
      mod = { ...a, ...au, ...fs };
      const app = mod.initializeApp(cfg);
      auth = mod.getAuth(app);
      db = mod.getFirestore(app);
      try { await mod.getRedirectResult(auth); } catch (e) { /* abaikan */ }
      mod.onAuthStateChanged(auth, (u) => {
        S.user = u ? { uid: u.uid, name: u.displayName || '', email: u.email || '' } : null;
        if (u) { if (window.QJ && window.QJ.switchOwner) window.QJ.switchOwner(u.uid); setStatus('Menyambung…'); start(u.uid); }
        else { if (unsub) { unsub(); unsub = null; } setStatus('Belum masuk'); }
        S.emit();
      });
    } catch (e) {
      setStatus('Gagal memuat Firebase (periksa koneksi)');
    }
  };

  async function start(uid) {
    try {
      const ref = mod.doc(db, 'users', uid);
      const snap = await mod.getDoc(ref);
      if (snap.exists() && snap.data().state) {
        api.mergeState(snap.data().state); // gabungkan tanpa menghapus catatan lokal
      }
      await pushNow();
      if (unsub) unsub();
      unsub = mod.onSnapshot(ref, (s) => {
        const d = s.data();
        if (!d || !d.state) return;
        if (d.device === deviceId) return;
        if ((d.updatedAt || 0) <= lastRemoteStamp) return;
        lastRemoteStamp = d.updatedAt || 0;
        api.applyState(d.state);
        setStatus('Tersinkron ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }, () => setStatus('Sinkronisasi terputus'));
    } catch (e) {
      setStatus('Gagal menyambung (periksa aturan Firestore)');
    }
  }

  async function pushNow() {
    if (!S.user || !db) return;
    try {
      const stamp = Date.now();
      lastRemoteStamp = stamp;
      await mod.setDoc(mod.doc(db, 'users', S.user.uid), { state: api.exportState(), updatedAt: stamp, device: deviceId });
      setStatus('Tersinkron ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setStatus('Belum terkirim (offline?) — dicoba lagi nanti');
    }
  }

  S.push = function () {
    if (!S.user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 2500);
  };
  window.addEventListener('online', () => { if (S.user) pushNow(); });

  S.signIn = async function () {
    if (!auth) { setStatus('Firebase belum siap'); return; }
    const provider = new mod.GoogleAuthProvider();
    try {
      await mod.signInWithPopup(auth, provider);
    } catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
        await mod.signInWithRedirect(auth, provider);
      } else if (!(e && e.code === 'auth/popup-closed-by-user')) {
        setStatus('Gagal masuk: ' + ((e && e.code) || 'tidak diketahui'));
      }
    }
  };

  S.signOut = async function () {
    if (!auth) return;
    // Lepas notifikasi perangkat ini dari akun yang sedang keluar (harus dilakukan selagi masih masuk).
    try { if (window.QJPush) await window.QJPush.disable(); else await S.removeDevice(); } catch (e) { /* abaikan */ }
    await mod.signOut(auth);
  };
})();
