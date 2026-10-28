/* Pengirim notifikasi waktu salat. Dijalankan GitHub Actions tiap 5 menit.
   Membaca semua perangkat di Firestore (users/{uid}/devices/{id}), lalu mengirim
   notifikasi bagi yang waktu salatnya baru masuk dan belum pernah dikirimi hari itu. */
'use strict';

const NAMES = { subuh: 'Subuh', zuhur: 'Zuhur', asar: 'Asar', magrib: 'Magrib', isya: 'Isya' };
const WINDOW_MIN = 20; // lewat dari ini dianggap terlambat dan dilewati

/* Tanggal dan menit setempat di zona waktu perangkat. */
function localNow(tz, nowMs) {
  const p = {};
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(nowMs)).forEach((x) => { p[x.type] = x.value; });
  return { key: p.year + '-' + p.month + '-' + p.day, min: Number(p.hour) * 60 + Number(p.minute) };
}
const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

/* Fungsi murni: daftar notifikasi yang harus dikirim sekarang untuk satu perangkat. */
function due(dev, sent, nowMs) {
  const out = [];
  if (!dev || dev.enabled === false || !dev.sub || !dev.tz || !dev.times) return out;
  let z; try { z = localNow(dev.tz, nowMs); } catch (e) { return out; }
  const T = dev.times[z.key];
  if (!T) return out;
  for (const id of Object.keys(NAMES)) {
    const t = T[id];
    if (typeof t !== 'number') continue;
    const k = z.key + ':' + id;
    if (sent && sent[k]) continue;
    const late = z.min - t;
    if (late >= 0 && late < WINDOW_MIN) out.push({ id, key: k, time: fmt(t), late });
  }
  return out;
}

function payload(n, city) {
  return {
    id: n.id,
    tag: 'adzan-' + n.id,
    title: 'Waktu ' + NAMES[n.id] + ' telah tiba',
    body: n.time + (city ? ' · ' + city : '') + (n.late >= 6 ? ' (notifikasi terlambat ' + n.late + ' menit)' : '') + '. Ketuk untuk memutar adzan.'
  };
}

async function main() {
  const admin = require('firebase-admin');
  const webpush = require('web-push');
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  const db = admin.firestore();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://github.com/', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

  const now = Date.now();
  const snap = await db.collectionGroup('devices').get();
  let sentCount = 0;
  console.log('Perangkat terdaftar:', snap.size);

  for (const doc of snap.docs) {
    const dev = doc.data();
    const logRef = db.collection('pushSent').doc(doc.ref.parent.parent.id + '_' + doc.id);
    const logSnap = await logRef.get();
    const sent = (logSnap.exists && logSnap.data().sent) || {};
    const todo = due(dev, sent, now);
    if (!todo.length) continue;
    let gone = false;
    const z = localNow(dev.tz, now);
    const next = {};
    Object.keys(sent).forEach((k) => { if (k.startsWith(z.key)) next[k] = true; }); // buang catatan hari lain
    for (const n of todo) {
      try {
        await webpush.sendNotification(dev.sub, JSON.stringify(payload(n, dev.city)), { TTL: 900, urgency: 'high' });
        next[n.key] = true; sentCount++;
        console.log('Terkirim:', n.id, n.time, dev.city || '', 'terlambat', n.late, 'menit');
      } catch (e) {
        console.log('Gagal kirim', n.id, e.statusCode || e.message);
        if (e.statusCode === 404 || e.statusCode === 410) { gone = true; break; }
        next[n.key] = true; // jangan coba berulang-ulang
      }
    }
    if (gone) { await doc.ref.delete(); await logRef.delete().catch(() => {}); console.log('Perangkat tidak berlaku lagi, dihapus.'); }
    else await logRef.set({ sent: next, at: now });
  }
  console.log('Selesai. Terkirim:', sentCount);
}

module.exports = { due, localNow, payload };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
