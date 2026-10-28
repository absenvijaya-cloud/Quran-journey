/* ============================================================
   KONFIGURASI FIREBASE (OPSIONAL)

   Selama file ini dibiarkan seperti ini (null), aplikasi tetap
   berjalan penuh: semua catatan tersimpan di HP pengguna.

   Untuk mengaktifkan login Google dan sinkronisasi antar-HP,
   ikuti PANDUAN.md bagian "Menyalakan Firebase", lalu ganti
   `null` di bawah dengan blok firebaseConfig dari akun Firebase
   milik klien. Contoh bentuknya:

   window.FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "nama-proyek.firebaseapp.com",
     projectId: "nama-proyek",
     storageBucket: "nama-proyek.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ============================================================ */
window.FIREBASE_CONFIG = null;
