# 🛡️ EXAM BROWSER & CBT INTEGRATED SYSTEM

Aplikasi **Exam Browser (Exambro)** desktop dan web modern yang dirancang untuk pelaksanaan ujian berbasis komputer (CBT) di sekolah, madrasah, universitas, maupun lembaga kursus dengan tingkat keamanan tinggi dan fitur anti-curang komprehensif.

---

## ✨ Fitur Utama

### 1. 🔒 Mode Kiosk Terkunci (Desktop Lock)
- **True Fullscreen Kiosk:** Layar terkunci dalam mode penuh tanpa address bar, toolbar, atau tombol keluar bawaan browser.
- **Profil Bersih Tanpa Ekstensi:** Dijalankan dengan profil terisolasi tanpa akses histori, bookmark, password, atau ekstensi berbahaya (ChatGPT / bot AI).
- **Pemblokiran Pintasan Keyboard:**
  - Mencegah `F11`, `F12`, `Ctrl+Shift+I` (Developer Tools / Inspect Element)
  - Mencegah `Ctrl+U` (Lihat Sumber Halaman)
  - Mencegah `Alt+Tab`, `Alt+F4`, `Ctrl+W`, `Ctrl+T`, `Ctrl+N`
  - Mencegah `Ctrl+R` / `F5` yang dapat merusak sesi ujian
  - Mencegah PrintScreen & Screenshot (membersihkan clipboard otomatis)
- **Proteksi Klik Kanan & Salin-Tempel:** Menonaktifkan klik kanan mouse dan blokir copy-paste teks soal.

### 2. 🚨 Sistem Deteksi Kecurangan Real-Time (Anti-Cheat Strike)
- **Deteksi Pindah Tab & Blur Jendela:** Jika siswa mencoba meminimalkan jendela atau beralih aplikasi, alarm audio berbunyi dan peringatan pelanggaran muncul.
- **Sistem 3 Pelanggaran (3 Strikes):**
  - **Pelanggaran 1 & 2:** Muncul peringatan visual dan suara alarm peringatan.
  - **Pelanggaran 3:** Akun ujian otomatis **TERKUNCI** (*Lockout Screen*). Hanya Guru / Pengawas yang bisa membukanya menggunakan PIN.

### 3. 📝 Sistem Ujian CBT Internal Terpadu
- **Autentikasi Siswa:** Login menggunakan NISN, Nama, dan Token Ujian 6 karakter.
- **Timer Hitung Mundur Interaktif:** Dilengkapi peringatan warna dinamis (berkedip merah saat sisa waktu kurang dari 5 menit) dan pengumpulan otomatis jika waktu habis.
- **Papan Navigasi Soal (Palette 1..N):**
  - Warna Abu-abu: Belum dijawab
  - Warna Hijau: Sudah dijawab
  - Warna Kuning: Ragu-ragu (bisa ditandai kembali)
- **Penyimpanan Otomatis (Auto-Save):** Setiap kali siswa memilih opsi (A/B/C/D/E) atau mengetik jawaban esai, jawaban langsung tersimpan di database server.
- **Alat Bantu Tambahan:**
  - Pengatur ukuran teks (*Font Size*: Kecil, Sedang, Besar)
  - Kalkulator bawaan untuk ujian matematika/eksakta
- **Koreksi & Nilai Otomatis:** Menghitung skor, persentase nilai, jumlah jawaban benar, dan salah secara instan.

### 4. 🌐 Mode Browser Ujian Eksternal
- Siswa dapat membuka link ujian dari luar seperti:
  - **Google Forms** (`forms.gle`)
  - **Moodle LMS**
  - **Candy CBT / BeeSMART / Edmodo / Quizizz**
  - **Server CBT Lokal Sekolah** (contoh: `http://192.168.1.100:8080`)
- Proteksi Kiosk dan Anti-Cheat tetap aktif menjaga siswa selama mengerjakan ujian eksternal.

### 5. 👨‍🏫 Panel Guru & Pengawas Ujian (`/admin`)
- **Live Monitoring Siswa:** Pantau nomor soal yang sedang dikerjakan siswa, jumlah jawaban tersimpan, dan jumlah pelanggaran secara real-time.
- **Buka Kunci Siswa:** Guru dapat mereset status pelanggaran dan membuka kunci siswa yang terblokir.
- **Paksa Kumpulkan (Force Submit):** Mengumpulkan ujian siswa dari jarak jauh jika siswa melanggar aturan.
- **Bank Soal & Token:** Buat ujian baru, generate token baru secara dinamis, dan atur durasi ujian.
- **Ekspor Nilai (Excel / CSV):** Unduh rekapitulasi nilai seluruh siswa dengan 1 kali klik dalam format CSV berstandar Excel (UTF-8 BOM).

---

## 🚀 Cara Menjalankan Aplikasi

### Cara 1: Menggunakan File Batch (Paling Praktis Sekali Klik)
Cukup **klik dua kali** pada file:
```
JALANKAN_EXAM_BROWSER.bat
```
Aplikasi akan otomatis menyalakan server lokal dan membuka Microsoft Edge / Google Chrome dalam mode **Kiosk Terkunci**.

> 💡 **Tip:** Anda juga dapat klik dua kali `BUAT_SHORTCUT_DESKTOP.bat` untuk membuat icon pintasan langsung di layar Desktop komputer Anda!

---

### Cara 2: Melalui Terminal / Command Prompt
```bash
npm start
```
Atau jika ingin menjalankan server saja (untuk diakses oleh siswa di jaringan Wi-Fi):
```bash
npm run server
```

---

## 🏠 Pelaksanaan Ujian Dari Rumah (Jaringan Berbeda / PJJ Daring)

Jika siswa mengerjakan ujian dari rumah masing-masing menggunakan kuota internet atau Wi-Fi yang berbeda:

### 1. Jalankan Mode Online Instan (Tunneling Otomatis)
Klik dua kali file:
```
JALANKAN_ONLINE_DARI_RUMAH.bat
```
Script ini akan:
- Menyalakan server ujian lokal di laptop/komputer Anda.
- Menghubungkan ke **Tunneling Internet Publik (HTTPS)** secara gratis dan instan.
- Memberikan **Link Ujian Publik** (contoh: `https://slow-coins-invite.loca.lt`) yang bisa dibuka siswa dari seluruh Indonesia tanpa perlu 1 jaringan Wi-Fi!
- Menyediakan format teks pengumuman yang siap langsung di-*copy-paste* ke WhatsApp / Telegram grup kelas.

### 2. Bagaimana Siswa Mengerjakan di Rumah?
- **Jika Siswa Memakai Laptop / Komputer:**
  Siswa cukup membuka link ujian di Google Chrome / Edge. Saat klik "Mulai Ujian", layar otomatis terkunci penuh (*Fullscreen Kiosk*), anti-pindah tab, dan jika siswa mencoba membuka tab Google/WA Web, alarm berbunyi keras dan ujian terkunci otomatis (*3 Strikes*).
- **Jika Siswa Memakai Smartphone (HP Android / iPhone):**
  - **Opsi A:** Buka langsung link ujian di browser Google Chrome HP.
  - **Opsi B (Rekomendasi Ujian Ketat):** Buka link ujian melalui aplikasi **Exambro** dari Play Store (seperti *Exambro Play* atau *FlyExam Browser*) agar tombol *Home*, *Recent Apps*, dan *Split Screen* terkunci total di HP siswa.

---

## 📱 Akses di Sekolah / Lab Komputer (Jaringan Wi-Fi Sama)
Jika seluruh siswa berada di sekolah dan terhubung ke Wi-Fi / LAN yang sama:
1. Jalankan `JALANKAN_EXAM_BROWSER.bat`
2. Siswa membuka browser dan memasukkan alamat IP Pengawas lokal:
   ```
   http://192.168.1.112:3000
   ```
   *(Ganti dengan IP lokal yang tertera di layar konsol)*

---

## 🔑 Data Akun & Akses Pengawas

| Keterangan | Nilai Default |
|---|---|
| **PIN Pengawas / Keluar Kiosk** | `1234` |
| **Token Ujian Simulasi** | `EXM2026` |
| **Kombinasi Tombol Darurat Pengawas** | <kbd>Ctrl + Shift + Q</kbd> atau <kbd>Alt + X</kbd> |

---

## 📁 Struktur Direktori

```
EXAM BROWSER/
├── server/
│   ├── app.js               # Express server utama & routing
│   ├── db.js                # Database JSON persisten
│   ├── routes/
│   │   └── api.js           # Endpoint REST API ujian & proctor
│   └── data/
│       └── database.json    # File penyimpanan bank soal, sesi, dan nilai
├── public/
│   ├── favicon.svg          # Favicon resmi Exam Browser
│   ├── index.html           # Halaman utama aplikasi (Kiosk & CBT)
│   ├── css/
│   │   ├── style.css        # Desain dasar, navigasi, dan glassmorphism
│   │   ├── exam.css         # Gaya antarmuka ujian siswa & palet soal
│   │   └── admin.css        # Gaya dasbor pengawas & tabel pemantauan
│   └── js/
│       ├── anti-cheat.js    # Engine pelindung anti-curang & pintasan
│       ├── cbt-student.js   # Logika ujian siswa & timer
│       ├── cbt-admin.js     # Logika dasbor pengawas & live monitor
│       └── external-browser.js # Pengendali browser ujian eksternal
├── start.js                 # Launcher mode kiosk Windows (Edge/Chrome)
├── online-launcher.js       # Launcher mode ujian online dari rumah (Tunneling HTTPS)
├── JALANKAN_EXAM_BROWSER.bat# Script batch lokal / sekolah sekali klik
├── JALANKAN_ONLINE_DARI_RUMAH.bat # Script batch ujian online daring dari rumah
├── BUAT_SHORTCUT_DESKTOP.bat# Generator shortcut Desktop Windows
└── package.json             # Konfigurasi dependensi Node.js
```
