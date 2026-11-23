# Panduan Operasional / DevOps / Deploy

Dokumen ini berisi panduan teknis untuk menjalankan, menguji, dan men-deploy project **Apa Kabar** (`fe-student-ticket`). README utama (`README.md`) tetap berfokus pada dokumen akademik/analisis kebutuhan; dokumen ini fokus operasional.

## 1. Arsitektur & Komponen

- **Frontend**: Vue 3 + Vite (`src/`), Pinia, Vue Router, Axios.
- **Backend/API**: Node.js + Express 5 + TypeScript + Prisma 7 (`backend/`).
- **Database**: PostgreSQL.
- **Mobile wrapper**: Capacitor Android.
- **Storage upload**: lokal di `backend/storage/` (disajikan via `/storage`); untuk produksi gunakan disk persisten/object storage.

## 2. Prasyarat

- Node.js `>=20.19` (lihat `backend/package.json` engines).
- npm.
- PostgreSQL 16+ (lokal atau Docker).
- Android Studio + Android SDK (untuk build Android).
- Git.

## 3. Konfigurasi Environment

### Frontend (`.env` di root)

Salin dari `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Catatan:
- Emulator Android: `http://10.0.2.2:8000/api`
- Perangkat fisik: gunakan IP LAN mesin pengembang, mis. `http://192.168.x.x:8000/api`

### Backend (`backend/.env`)

Salin dari `backend/.env.example` dan sesuaikan:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://apakabar:apakabar_dev_password@localhost:5432/apakabar?schema=public

JWT_SECRET=ganti-dengan-secret-acak-minimal-32-karakter
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Pisahkan dengan koma. Sertakan origin web + Capacitor Android.
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost,capacitor://localhost

# URL publik backend untuk image_url/avatar.
PUBLIC_BASE_URL=http://localhost:8000

AVATAR_MAX_UPLOAD_MB=2
TICKET_IMAGE_MAX_UPLOAD_MB=10
```

**Keamanan produksi:**
- Gunakan `JWT_SECRET` kuat/acak (minimal 32 karakter, rahasiakan).
- Batasi `CORS_ORIGINS` ke origin produksi yang valid.
- Gunakan HTTPS; set `PUBLIC_BASE_URL` ke domain HTTPS backend.
- Jangan commit `.env`.

## 4. Menjalankan Lokal (Development)

### 4.1 Database (Docker)

Dari root project:

```bash
npm run db:up
```

Ini menjalankan PostgreSQL sesuai `docker-compose.yml` (db `apakabar`, user `apakabar`, password dev). Untuk stop:

```bash
npm run db:down
```

Jika memakai PostgreSQL lokal sendiri, sesuaikan `DATABASE_URL`.

### 4.2 Backend API

```bash
npm install
npm run api:generate
npm run api:migrate
npm run dev:api
```

API default: `http://localhost:8000/api`.

### 4.3 Frontend Web

```bash
npm run dev
```

Vite default: `http://localhost:5173`.

## 5. Migrasi, Seed, dan Prisma

Jalankan dari root (workspace script) atau dari `backend/`.

| Kebutuhan | Perintah (root) | Perintah (backend/) |
|---|---|---|
| Generate Prisma Client | `npm run api:generate` | `npm run prisma:generate` |
| Validasi schema | - | `npm run prisma:validate` |
| Migrasi dev | `npm run api:migrate` | `npm run prisma:migrate` |
| Deploy migrasi (prod/CI) | `npm run api:deploy` | `npm run prisma:deploy` |
| Seed | `npm run api:seed` | `npm run db:seed` |
| Prisma Studio | - | `npm run prisma:studio` |

**Catatan migrasi notifikasi:** pastikan migrasi `20261119120000_add_notifications` teraplikasi. Jika DB sebelumnya belum terjangkau, jalankan:

```bash
cd backend
npx prisma migrate deploy
```

## 6. Storage Upload

- File tiket/avatar disimpan di `backend/storage/` dan disajikan lewat endpoint `/storage` (lihat `PUBLIC_BASE_URL`).
- Batas default: avatar 2 MB, gambar tiket 10 MB/file, maksimal 5 gambar/tiket (sesuai env/kode).
- **Produksi**: gunakan volume persisten atau object storage (S3/GCS/compatible). Disk ephemeral (container tanpa volume) menyebabkan file hilang saat redeploy/restart.
- Pastikan backup storage dan kebijakan retensi/cleanup orphan file (ticket soft-delete saat ini tidak otomatis menghapus file fisik).

## 7. Build & Deploy

### 7.1 Backend

```bash
npm run api:build
npm run api:deploy
npm run start --workspace @apakabar/api
```

Pastikan environment produksi di-set (DB, JWT, CORS, `PUBLIC_BASE_URL`, HTTPS reverse proxy).

### 7.2 Frontend Web

```bash
npm run build
npm run preview
```

Deploy folder `dist/` ke static hosting/reverse proxy. Pastikan `VITE_API_BASE_URL` mengarah ke API produksi saat build.

### 7.3 Android (Capacitor)

Konfigurasi: `capacitor.config.json` (`appId`, `appName`, `webDir=dist`).

Langkah umum:

```bash
npm install
npm run build
npx cap sync android
npx cap open android
```

Kemudian build/run dari Android Studio.

Catatan:
- Set `VITE_API_BASE_URL` sebelum build ke URL API yang bisa diakses perangkat/emulator.
- Origin Capacitor (`http://localhost`, `capacitor://localhost`) harus ada di `CORS_ORIGINS` backend sesuai kebutuhan.
- Periksa izin kamera/galeri/penyimpanan untuk upload gambar.
- Setelah perubahan web, jalankan `npm run build && npx cap sync android`.

## 8. Pengujian

### Frontend

```bash
npm run test
npm run test:watch
npm run build
```

### Backend

```bash
npm run api:typecheck
npm run api:test
```

### Integration test backend (butuh DB test)

Gunakan `DATABASE_URL` ke database khusus berakhiran `_test`:

```bash
npm run api:test:integration
```

### E2E Playwright

```bash
npx playwright install
npm run test:e2e
```

E2E smoke saat ini memakai mock/flow dasar; untuk E2E nyata jalankan frontend+backend+DB test.

Skenario manual: lihat `docs/PENGUJIAN.md`.

## 9. Troubleshooting

### DB tidak bisa diakses (`P1001`)
- Pastikan PostgreSQL berjalan (`npm run db:up` atau service lokal).
- Cek `DATABASE_URL`, host, port, user/password, dan firewall.

### CORS / API tidak bisa dipanggil dari web/mobile
- Cek `CORS_ORIGINS` di `backend/.env` mencakup origin frontend/Capacitor.
- Cek `VITE_API_BASE_URL` sesuai environment (localhost/emulator/LAN/domain).
- Pastikan backend berjalan dan port terbuka.

### Upload gambar gagal
- Cek format (JPG/PNG/WEBP), ukuran per file (default 10 MB), jumlah maks (5).
- Cek permission folder `backend/storage`.
- Cek `PUBLIC_BASE_URL` dan akses `/storage/...`.
- Pada produksi, pastikan storage persisten.

### Notifikasi tidak muncul
- Pastikan migrasi `20261119120000_add_notifications` sudah diterapkan.
- Cek endpoint `/api/notifications` dan `/api/notifications/unread-count` lewat Network.
- Pastikan user login dan polling berjalan (layout app/admin mount).
- Notifikasi dibuat best-effort saat balasan; cek log backend jika gagal.

### 429 / Rate limit / Duplicate
- `409 DUPLICATE_TICKET`: tiket serupa dalam 10 menit; bisa kirim ulang dengan konfirmasi (`X-Allow-Duplicate: true`) sesuai alur UI.
- `429` cooldown/batas harian: tunggu sesuai `Retry-After`.
- Rate limit: create tiket 5/60s per IP+akun, `/api` global 120/60s, login 10/15 menit.

### Android build tidak dapat akses API
- Gunakan `10.0.2.2` untuk emulator atau IP LAN untuk perangkat fisik.
- Hindari `localhost` pada perangkat fisik.
- Pastikan backend bind/terbuka ke jaringan yang dibutuhkan dan CORS sesuai.

### Perubahan kode tidak terlihat di Android
- Jalankan `npm run build` lalu `npx cap sync android`.
- Bersihkan/rebuild dari Android Studio jika perlu.

## 10. Checklist Deploy Produksi

- [ ] `.env` frontend/backend produksi terisi benar dan tidak dibocorkan.
- [ ] `JWT_SECRET` kuat, HTTPS aktif, CORS dibatasi.
- [ ] DB PostgreSQL produksi siap, backup aktif.
- [ ] `prisma migrate deploy` berhasil.
- [ ] Storage upload persisten dan dapat diakses via `PUBLIC_BASE_URL`.
- [ ] Build frontend/backend lulus; tes kritis dijalankan.
- [ ] Build Android diuji pada perangkat target.
- [ ] Monitoring/logging/error tracking aktif.
