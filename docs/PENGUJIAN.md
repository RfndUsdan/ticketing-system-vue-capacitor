# Panduan Pengujian

Dokumen ini merangkum skenario pengujian untuk fitur yang telah diimplementasikan/diperbarui: notifikasi in-app, multi-gambar tiket, serta pembatasan (duplikat, cooldown/batas harian, rate limit).

## 1. Persiapan

- **Backend** berjalan (`npm run dev:api` dari root atau `npm run dev` di `backend/`) dan `.env` backend terkonfigurasi (DB, JWT, `PUBLIC_BASE_URL`, storage).
- **Frontend** berjalan (`npm run dev`) dengan `VITE_API_BASE_URL` mengarah ke API backend.
- **Database** dapat diakses. Terapkan migrasi yang tertunda:
  - `cd backend && npx prisma migrate deploy` (atau `npx prisma migrate dev`)
  - Pastikan migrasi notifikasi `20261119120000_add_notifications` sudah teraplikasi (tabel `notifications`, `device_tokens` ada).
- Siapkan akun uji: minimal **1 user/pelapor** dan **1 admin**.
- Untuk pengujian Android/Capacitor: build/sync sesuai konfigurasi Capacitor, uji izin kamera/galeri/penyimpanan, dan pastikan URL API dapat dijangkau dari perangkat.

## 2. Notifikasi in-app (balasan & perubahan status tiket)

Notifikasi dibuat saat balasan tiket (best-effort, tidak menggagalkan respons balasan utama) dan ditampilkan sebagai in-app (badge + halaman notifikasi) dengan polling unread count.

### 2.1 Admin membalas tiket pelapor
1. Login sebagai **user**, buat tiket (atau gunakan tiket milik user tersebut).
2. Login sebagai **admin**, buka detail tiket yang sama, kirim balasan (opsional ubah status, mis. `in_progress`).
3. **Ekspektasi**:
   - Balasan tersimpan dan tampil di detail tiket.
   - Akun **pelapor** menerima notifikasi in-app: judul/update tiket, pesan menyebut admin membalas; jika status diubah, tipe/status perubahan tercermin pada notifikasi.
   - Badge unread pada navbar (desktop), tab Notifikasi (mobile), dan/atau halaman notifikasi pelapor bertambah.
   - Membuka notifikasi menandainya sebagai dibaca dan mengarahkan ke detail tiket terkait (`app.ticket.detail`).

### 2.2 Admin mengubah status saat membalas
1. Dari detail tiket (admin), kirim balasan sekaligus ubah status (mis. `resolved` atau `rejected`).
2. **Ekspektasi**: pelapor menerima notifikasi pembaruan status/tiket; data/status pada notifikasi sesuai; status tiket di sisi pelapor terbarui setelah refresh/detail dimuat.

### 2.3 User/pelapor membalas tiket
1. Login sebagai **user (pelapor tiket)**, buka detail tiket miliknya, kirim balasan.
2. **Ekspektasi**:
   - Semua **admin** (kecuali aktor, jika relevan) menerima notifikasi in-app balasan baru (berisi nama pelapor/judul/tiket).
   - Badge/menu Notifikasi admin (topbar/sidebar/halaman notifikasi) menampilkan unread count.
   - Klik notifikasi admin mengarah ke detail tiket admin (`admin.ticket.detail`).

### 2.4 Halaman & aksi notifikasi
1. Buka halaman **Notifikasi** (user: `/notifications`, admin: `/admin/notifications`).
2. **Ekspektasi**:
   - Daftar notifikasi tampil (terbaru dulu), item belum dibaca terindikasi.
   - **Tandai dibaca** (klik item) mengurangi unread count dan memperbarui status baca.
   - **Tandai semua dibaca** mengosongkan unread count.
   - State kosong/loading tampil dengan benar saat tidak ada data/sedang memuat.

### 2.5 Polling & konsistensi
1. Biarkan aplikasi terbuka, picu notifikasi dari akun lain.
2. **Ekspektasi**: unread count/badge terbarui secara periodik (polling) tanpa perlu reload penuh; berhenti polling saat layout unmount/logout (tidak ada request berulang setelah keluar).

### 2.6 Device token & push (fondasi/scaffold)
- Endpoint: `POST /api/notifications/device-token` (autentikasi) dengan body `{ "token": "...", "platform": "web|android|ios" }`.
- **Ekspektasi**: token tersimpan/di-*upsert* untuk user; respons sukses.
- Pengiriman push nyata (FCM/APNs) **belum aktif** (stub `sendPushToUser` di `backend/src/services/notification.ts`). Untuk mengaktifkan: integrasi FCM/Capacitor Push Notifications di frontend + credential & pengiriman FCM di backend.

### 2.7 Kasus negatif / ketahanan
- DB/tabel notifikasi belum ada (migrasi belum diterapkan): pembuatan notifikasi dapat gagal di backend, tetapi respons balasan tiket tetap harus sukses (best-effort). Terapkan migrasi untuk fungsi penuh.
- User tidak terautentikasi mengakses endpoint notifikasi → ditolak (401).
- User tidak boleh membaca/menandai notifikasi milik user lain.

## 3. Multi-gambar tiket (upload & tampilan)

- Batas: hingga **5 gambar** per tiket, format **JPG/PNG/WEBP**, maks **10 MB per file** (sesuai konfigurasi backend). Field upload kompatibel (`images` dan `image`); respons menyertakan `image_url` (kompatibilitas) dan `images[]`.

### 3.1 Unggah valid
1. Buat tiket dengan 1–5 gambar valid.
2. **Ekspektasi**: tiket tersimpan; semua gambar tampil di detail tiket (user & admin) dengan fallback yang benar.

### 3.2 Gambar rusak / tidak valid
1. Coba unggah file dengan ekstensi/isi bukan gambar valid (mis. file teks di-rename `.jpg`, atau file korup).
2. **Ekspektasi**: server menolak/menangani sebagai input tidak valid sesuai validasi; frontend menampilkan pesan kesalahan yang jelas; tidak ada tiket/gambar rusak tersimpan diam-diam.

### 3.3 Ukuran tepat batas maksimum
1. Siapkan file gambar valid berukuran **tepat 10.485.760 bytes (10 MB)** dan satu file **> 10 MB**.
2. **Ekspektasi**:
   - File tepat 10 MB: diterima (jika sesuai kebijakan `<=` batas).
   - File > 10 MB: ditolak dengan pesan/validasi ukuran; UI menampilkan error yang sesuai.

### 3.4 Batas jumlah gambar
1. Coba pilih/unggah lebih dari 5 gambar.
2. **Ekspektasi**: UI membatasi/mencegah melebihi 5; server menolak kelebihan (maks 5).

## 4. Duplikat, batas jumlah, dan rate limit tiket

### 4.1 Tiket duplikat
1. Kirim tiket dengan kategori/lokasi/judul+deskripsi yang dinormalisasi sama dalam jendela **10 menit**.
2. **Ekspektasi**: backend merespons `409` dengan kode `DUPLICATE_TICKET` (dan informasi pendukung) kecuali permintaan eksplisit mengizinkan duplikat (mis. header `X-Allow-Duplicate: true` sesuai implementasi). Frontend meminta konfirmasi/menangani sesuai alur.

### 4.2 Cooldown & batas harian
1. Kirim tiket beruntun cepat (cooldown **1 menit**) dan/atau buat hingga lebih dari **5 tiket/hari/user**.
2. **Ekspektasi**: server menolak dengan `429` dan header `Retry-After` (jika disediakan); UI menampilkan pesan yang jelas dan mencegah asumsi sukses.

### 4.3 Rate limit
1. Lakukan pembuatan tiket berulang cepat dari IP+akun yang sama (> **5/60s**) atau beban request tinggi ke `/api` (> **120/60s**).
2. **Ekspektasi**: respons rate limit (`429`) dengan pesan sesuai; tidak ada tiket ganda tercipta akibat retry (idempotency/create flow).
3. Uji juga batas login (**10/15 menit**) jika relevan.

## 5. Catatan verifikasi

- Catat hasil (tanggal, akun/peran, perangkat/browser/Android, dan tangkapan layar/log bila ada kegagalan).
- Jika muncul error umum di UI ("terjadi kesalahan..."), periksa **Network (request/response)** dan **log backend** untuk pesan/stack trace spesifik.
- Setelah deploy ulang, pastikan storage gambar persisten dan URL publik (`PUBLIC_BASE_URL`/`/storage`) dapat diakses.
