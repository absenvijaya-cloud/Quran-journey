# Panduan Quran Journey (Tahap 1)

Panduan ini ditulis sederhana. Ikuti urutannya, tidak perlu mengedit kode kecuali satu file kecil di Bagian C.

## Isi folder

| File / folder | Fungsinya |
|---|---|
| `index.html` | Halaman utama aplikasi |
| `css/style.css` | Tampilan (warna Serene Sand, animasi) |
| `js/core.js`, `js/app.js` | Cara kerja aplikasi |
| `js/sync.js` | Sinkronisasi Firebase (hanya aktif kalau Bagian C dikerjakan) |
| `js/firebase-config.js` | **Satu-satunya file yang diisi untuk Firebase** |
| `data/` | Teks Al-Qur'an dan terjemahan dari Kemenag (114 surah) |
| `icons/` | Ikon aplikasi (dari gambar yang Anda kirim) |
| `manifest.webmanifest`, `sw.js` | Membuat aplikasi bisa dipasang dan bisa offline |
| `firestore.rules` | Aturan keamanan untuk Firebase (ditempel di Bagian C) |

Aplikasi sudah berjalan penuh **tanpa Firebase**: semua catatan tersimpan di HP pengguna. Firebase hanya menambah login Google dan sinkronisasi antar-HP.

---

## A. Menayangkan di GitHub Pages (tanpa Firebase)

1. Buka github.com, buat repositori baru, misalnya `quran-journey`. Pilih **Public**.
2. Klik **Add file → Upload files**. Seret **semua isi** folder `quran-journey` (bukan folder luarnya) ke halaman itu. Folder `data` berisi 114 file, pastikan ikut terunggah (kalau browser menolak banyak file sekaligus, unggah per bagian: `data/surah` terpisah).
3. Klik **Commit changes**.
4. Buka **Settings → Pages**. Di bagian *Branch*, pilih `main` dan folder `/ (root)`, lalu **Save**.
5. Tunggu 1–2 menit. Alamatnya muncul di halaman yang sama, bentuknya `https://namauser.github.io/quran-journey/`.
6. Buka alamat itu di HP. Di Chrome Android pilih menu **Instal aplikasi**. Di iPhone buka lewat Safari, ketuk **Bagikan → Tambah ke Layar Utama**.

---

## B. Yang perlu diketahui klien

- **Internet dibutuhkan** untuk memutar audio, memuat jadwal salat pertama kali, dan memuat font pertama kali. Setelah itu teks surah yang pernah dibuka, jadwal bulan ini, dan catatan bisa dipakai offline.
- **Jadwal salat** diambil dari layanan Aladhan (gratis, tanpa kunci rahasia) memakai metode Kemenag RI untuk Indonesia. Jika gagal dimuat, aplikasi memberi tahu dan memakai jadwal contoh yang diberi label.
- **Tanggal Hijriah** adalah perkiraan (kalender Umm al-Qura). Penetapan resmi Kemenag bisa berbeda satu hari. Pengguna bisa menyesuaikan di Pengaturan.
- **Tafsir belum ada.** Data Kemenag yang dipakai hanya berisi teks dan terjemahan.
- **Audio** satu qari (Abu Bakr Ash-Shaatree) langsung dari server Kemenag. Kalau Kemenag mengubah alamat file audionya, audio berhenti sampai alamat di `js/app.js` (`AUDIO_BASE`) diperbarui.
- **Izin data:** repositori `quran-json-kemenag` tidak menyebut lisensi tertulis. Sebelum aplikasi dijual, sebaiknya pastikan izin pemakaian data Kemenag dan tampilkan atribusi (sudah ada di aplikasi: "Sumber: Kemenag RI").

---

## C. Menyalakan Firebase (opsional, per klien)

Lakukan di **akun Google milik klien**, supaya data dan tagihan (kalau ada) ada di akun klien. Paket gratis (Spark) cukup untuk pemakaian wajar dan tidak butuh kartu kredit.

1. Buka console.firebase.google.com, masuk dengan akun klien, klik **Create a project**, beri nama (misalnya `quran-journey-nama-klien`). Analytics boleh dimatikan.
2. Menu **Build → Authentication → Get started → Sign-in method → Google → Enable**, isi email dukungan, **Save**.
3. Menu **Build → Firestore Database → Create database**. Pilih lokasi `asia-southeast2 (Jakarta)`, mode **Production**.
4. Buka tab **Rules** di Firestore, hapus isinya, tempel seluruh isi file `firestore.rules`, klik **Publish**.
5. Klik ikon roda gigi → **Project settings**. Di bagian *Your apps* klik ikon **`</>` (Web)**, beri nama, **Register app**. Salin blok `firebaseConfig` yang muncul.
6. Buka file `js/firebase-config.js`. Ganti tulisan `null` dengan blok itu sehingga bentuknya:
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   (Kunci ini memang boleh terlihat publik. Keamanannya dijaga oleh aturan di langkah 4.)
7. Kembali ke **Authentication → Settings → Authorized domains → Add domain**, isi `namauser.github.io`.
8. Unggah ulang `js/firebase-config.js` ke GitHub. Buka `sw.js` dan naikkan angka `VERSI` (misalnya `qj-v1` menjadi `qj-v2`) lalu unggah juga, supaya HP pengguna memperbarui file lamanya.
9. Buka aplikasi → Beranda → ikon roda gigi → bagian **Akun & sinkronisasi** → **Masuk dengan Google**.

Cara kerja sinkronisasi: saat pertama masuk, catatan di HP digabung dengan catatan di Firebase (tidak ada yang dihapus). Setelah itu setiap perubahan dikirim otomatis dan perubahan dari HP lain ikut masuk. Jika dua HP mengubah hal yang sama bersamaan, yang terakhir menang.

---

## D. Mengganti ikon atau nama

- **Ikon:** ganti file di folder `icons/` dengan nama yang sama (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-64.png`). Naikkan `VERSI` di `sw.js`.
- **Nama aplikasi:** ubah di `manifest.webmanifest` (`name`, `short_name`) dan `<title>` di `index.html`.

## E. Setiap kali ada perubahan file

Naikkan angka `VERSI` di `sw.js` (satu baris di atas file). Tanpa itu, HP yang sudah memasang aplikasi bisa tetap memakai file lama.

## F. Daftar cek sebelum diserahkan ke klien

- [ ] Aplikasi terbuka di alamat GitHub Pages dan bisa dipasang ke layar utama
- [ ] Surah terbuka, terjemahan tampil, tombol putar bersuara
- [ ] Jadwal salat muncul dengan tulisan "Jadwal Kemenag RI" di bawah lengkung (bukan "contoh")
- [ ] Tandai satu salat, tutup aplikasi, buka lagi: tanda masih ada
- [ ] Matikan internet, buka lagi: surah yang pernah dibuka dan jadwal masih tampil
- [ ] (Jika Firebase) masuk dengan Google di dua HP, tanda salat ikut muncul di HP kedua

## Kisah Nabi (fitur baru)

- Letaknya di tab Al-Qur'an, pilihan "Kisah Nabi" (25 nabi). Isinya di folder `data/kisah/` (satu file JSON per nabi, ditambah `index.json`).
- Setiap bagian cerita punya "Ayat rujukan" yang menampilkan teks Arab dan terjemahan Kemenag asli.
- Ringkasannya disusun berdasarkan ayat Al-Qur'an, bukan tafsir resmi. **Sebelum dijual ke klien, mintalah seorang ustaz/ustazah meninjau isinya.** Bila ada yang perlu diubah, edit langsung file JSON nabi terkait.
- Menambah nabi baru: salin satu file JSON sebagai contoh, isi `parts` (h = judul, t = isi, r = daftar [surah, ayat awal, ayat akhir]), lalu tambahkan ke `data/kisah/index.json` dan naikkan `VERSI` di `sw.js`.

## Adzan otomatis

- Pengaturan → bagian **Adzan**. Saklar utama menyalakan adzan, lalu tiap waktu salat bisa dinyalakan atau dimatikan sendiri.
- Subuh memakai `data/adzan/fajr.mp3`, waktu lain memakai `data/adzan/makkah.mp3`. Untuk mengganti suara, ganti file dengan nama yang sama lalu naikkan `VERSI` di `sw.js`.
- Adzan hanya berbunyi saat aplikasi terbuka, dan hanya memakai jadwal asli (bukan jadwal contoh). Satu kali per waktu salat per hari.
- Sebelum dijual, pastikan izin pemakaian rekaman adzan. Sumbernya repositori `adhan-audio` yang tidak mencantumkan lisensi.
