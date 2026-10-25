# Backend Apa Kabar — Scaffold

REST API untuk aplikasi **Apa Kabar** menggunakan **Node.js + Express 5 + TypeScript + Prisma 7 + PostgreSQL**.

> **Status: scaffold.**
> Frontend **belum diintegrasikan** ke backend ini. Yang sudah berfungsi:
> `GET /api/health`, `POST /api/register` (termasuk avatar), `POST /api/login`, `GET /api/me`,
> `POST /api/logout`, middleware JWT, validasi, upload, CORS, dan error handler.
> Endpoint tiket, user, profil, dan dashboard masih mengembalikan **501** dan
> sengaja disiapkan sebagai TODO untuk tahap implementasi berikutnya.

---

## Stack

| Komponen | Versi / pilihan |
|---|---|
| Runtime | Node.js >= 20.19 |
| Framework | Express 5 |
| Bahasa | TypeScript 5.9 |
| ORM | Prisma 7 (`prisma-client` generator) |
| Database | PostgreSQL 16 |
| Validasi | Zod 4 |
| Auth | JWT + bcryptjs |
| Upload | Multer (lokal: `storage/`, URL publik `/storage/`) |
| Keamanan | Helmet, CORS, rate limit |

---

## Struktur

```
backend/
├── prisma/
│   ├── schema.prisma        # User, Ticket, TicketReply
│   └── seed.ts              # admin + mahasiswa demo
├── storage/
│   ├── tickets/             # upload bukti kerusakan
│   └── avatars/
├── src/
│   ├── config/
│   │   ├── env.ts           # validasi environment dengan Zod
│   │   └── prisma.ts        # Prisma Client + adapter-pg
│   ├── controllers/         # auth sudah jalan; sisanya stub
│   ├── middlewares/         # auth, validate, upload, error
│   ├── routes/              # kontrak endpoint
│   ├── types/               # augmentasi Request.user
│   ├── utils/               # response, JWT, serializer, konstanta
│   ├── validators/          # skema Zod
│   ├── app.ts               # konfigurasi Express
│   ├── server.ts            # bootstrap + graceful shutdown
│   └── generated/           # Prisma Client (gitignored, hasil generate)
├── .env.example
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

---

## Quick start

> `db:up` membutuhkan **Docker Desktop + Docker Compose**. Jika Docker belum
> tersedia, gunakan PostgreSQL lokal/cloud (Neon, Supabase, Railway, dsb.) lalu
> ganti `DATABASE_URL` di `backend/.env` sesuai connection string yang diberikan.

Dari **root repo**:

```bash
# 1. Install dependency frontend + backend (npm workspaces)
npm install

# 2. Jalankan PostgreSQL
npm run db:up

# 3. Generate Prisma Client
npm run api:generate

# 4. Buat migration pertama (belum dijalankan pada scaffold ini)
npm run api:migrate -- --name init

# 5. Isi data demo
npm run api:seed

# 6. Jalankan API (http://localhost:8000)
npm run dev:api
```

Cek health:

```bash
curl http://localhost:8000/api/health
```

Login demo:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@apakabar.local\",\"password\":\"Admin123!\"}"
```

Akun seed:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@apakabar.local` | `Admin123!` |
| Mahasiswa | `mahasiswa@apakabar.local` | `User123!` |

> Jika `npm run api:migrate -- --name init` tidak meneruskan argumen dengan benar
> di shell tertentu, jalankan langsung dari folder backend:
> `cd backend && npm run prisma:migrate -- --name init`

---

## Scripts backend

| Script | Fungsi |
|---|---|
| `npm run dev` | Jalankan API dengan hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript ke `dist/` |
| `npm run start` | Jalankan hasil build |
| `npm run typecheck` | Cek tipe tanpa emit |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:validate` | Validasi schema |
| `npm run prisma:migrate` | Buat/terapkan migration (dev) |
| `npm run prisma:deploy` | Terapkan migration (produksi) |
| `npm run prisma:studio` | Buka Prisma Studio |
| `npm run db:seed` | Jalankan `prisma/seed.ts` |

Dari root repo, gunakan prefix `api:` (mis. `npm run api:generate`).

---

## Kontrak endpoint

Format sukses standar (auth/profile/ticket/dashboard):

```json
{ "message": "OK", "data": {} }
```

User CRUD mengikuti kontrak Laravel: response memakai `{ "data": ... }` dan daftar user
memakai `{ "data": [...], "links": ..., "meta": ... }`.

Format validasi (422):

```json
{
  "message": "Email wajib diisi.",
  "errors": { "email": ["Email wajib diisi."] }
}
```

| Method | Endpoint | Status scaffold |
|---|---|---|
| GET | `/api/health` | ✅ jalan |
| POST | `/api/register` | ✅ jalan |
| POST | `/api/login` | ✅ jalan |
| GET | `/api/me` | ✅ jalan |
| POST | `/api/logout` | ✅ jalan (stateless) |
| GET | `/api/ticket` | 🚧 501 |
| POST | `/api/ticket` | 🚧 501 |
| GET | `/api/ticket/:code` | 🚧 501 |
| DELETE | `/api/ticket/:code` | 🚧 501 |
| POST | `/api/ticket-reply/:code` | 🚧 501 |
| GET | `/api/users` | 🚧 501 |
| GET | `/api/users/:id` | 🚧 501 |
| POST | `/api/users` | 🚧 501 |
| POST | `/api/users/:id` | 🚧 501 (alias frontend) |
| PUT | `/api/users/:id` | 🚧 501 |
| PATCH | `/api/users/:id` | 🚧 501 |
| DELETE | `/api/users/:id` | 🚧 501 |
| POST | `/api/profile` | 🚧 501 |
| DELETE | `/api/profile/avatar` | 🚧 501 |
| GET | `/api/dashboard/statistic` | 🚧 501 |

Endpoint admin dilindungi `authenticate` + `requireAdmin`.

### Bentuk data yang harus dihasilkan nanti

- `user`: `id`, `name`, `email`, `nim`, `avatar` (URL absolut `/storage/...`), `role`
- `ticket`: `code`, `title`, `category`, `priority` (`low/medium/high`), `description`, `image_url`, `status`, `created_at`, `completed_at`, `user`, `ticket_replies`
- `reply`: `id`, `content`, `created_at`, `user`
- `statistic`: `total_tickets`, `active_tickets`, `resolved_tickets`, `avg_resolution_time`, `status_distribution.{open,in_progress,resolved,rejected}`

Serializer untuk bentuk tersebut tersedia di `src/utils/serializers.ts`.
Input priority `normal` dari frontend diterima sebagai alias dan disimpan sebagai `medium`.

---

## Catatan Prisma 7

- Generator `prisma-client` menghasilkan **TypeScript** di `src/generated/prisma`.
  Folder ini **gitignored**; jalankan `npm run api:generate` setelah clone/install.
- Prisma 7 mewajibkan **driver adapter**; project ini memakai `@prisma/adapter-pg`.
- URL database tidak lagi ditulis di `datasource`; letakkan di
  `prisma.config.ts` (dibaca dari `DATABASE_URL`).
- Schema memakai `String` untuk `status`, `priority`, dan `role`; nilai valid ada di
  `src/utils/constants.ts`. Tiket memakai soft delete (`deletedAt`), `completedAt`, dan `image`.
- Upload avatar dibatasi 2 MB; gambar tiket 10 MB. GIF diizinkan untuk avatar register/admin,
  tetapi tidak untuk update profil sendiri.
- Migration **belum dibuat** pada scaffold ini. Itu sebabnya langkah
  `prisma:migrate` di atas belum dijalankan.

---

## Catatan integrasi frontend (belum dilakukan)

Saat nanti diintegrasikan:

1. Tambahkan `.env` di root frontend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
2. Ubah `src/plugins/axios.js` agar memakai `import.meta.env.VITE_API_BASE_URL`.
3. Untuk emulator Android gunakan `http://10.0.2.2:8000/api`.
4. Untuk HP fisik gunakan IP LAN PC, atau HTTPS tunnel saat testing di luar jaringan lokal.
5. Pastikan origin Capacitor (`http://localhost` / `capacitor://localhost`)
   ada di `CORS_ORIGINS`.
6. `image_url` harus absolut agar tampil di WebView. Serializer sudah membentuk
   URL dari `PUBLIC_BASE_URL`.

---

## TODO keamanan sebelum produksi

- [ ] Ganti `JWT_SECRET` dengan nilai acak yang kuat dan simpan di secret manager.
- [ ] Gunakan HTTPS dan jangan aktifkan cleartext traffic di Android release.
- [ ] Pindahkan upload ke S3/R2 dan batasi akses file.
- [ ] Tambahkan refresh token/denylist jika butuh revoke sesi.
- [ ] Tambahkan rate limit khusus login/register.
- [ ] Tambahkan test otomatis dan CI.
- [ ] Ganti `console.error` dengan logger terstruktur.
