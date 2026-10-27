# Backend Apa Kabar — Scaffold

REST API untuk aplikasi **Apa Kabar** menggunakan **Node.js + Express 5 + TypeScript + Prisma 7 + PostgreSQL**.

> **Status: backend inti bertahap.**
> Frontend Vue menggunakan `VITE_API_BASE_URL` untuk mengakses backend ini; konfigurasi Android/Capacitor
> belum diubah. Endpoint yang berfungsi:
> `GET /api/health`, `POST /api/register` (termasuk avatar), `POST /api/login`, `GET /api/me`,
> `POST /api/logout`, serta list/detail/create tiket dengan auth, ownership, filter, dan pagination opsional.
> Seluruh route tiket, user, profil, dan dashboard pada tabel endpoint sudah memiliki implementasi.

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
│   ├── controllers/         # implementasi endpoint API
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

# 4. Buat/terapkan migration jika database belum memilikinya
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

| Method | Endpoint | Status implementasi |
|---|---|---|
| GET | `/api/health` | ✅ jalan |
| POST | `/api/register` | ✅ jalan |
| POST | `/api/login` | ✅ jalan |
| GET | `/api/me` | ✅ jalan |
| POST | `/api/logout` | ✅ jalan (stateless) |
| GET | `/api/ticket` | ✅ list, filter, pagination opsional |
| POST | `/api/ticket` | ✅ create (gambar opsional) |
| GET | `/api/ticket/:code` | ✅ detail + ownership |
| DELETE | `/api/ticket/:code` | ✅ admin-only soft delete |
| POST | `/api/ticket-reply/:code` | ✅ owner/admin, admin dapat memperbarui status |
| GET | `/api/users` | ✅ admin, pagination 10 + filter search/role |
| GET | `/api/users/:id` | ✅ admin |
| POST | `/api/users` | ✅ admin |
| POST | `/api/users/:id` | ✅ alias frontend |
| PUT | `/api/users/:id` | ✅ admin |
| PATCH | `/api/users/:id` | ✅ admin |
| DELETE | `/api/users/:id` | ✅ admin (FK restrict dapat menolak user yang punya tiket/balasan) |
| POST | `/api/profile` | ✅ authenticated user |
| DELETE | `/api/profile/avatar` | ✅ authenticated user |
| GET | `/api/dashboard/statistic` | ✅ admin |

Endpoint admin dilindungi `authenticate` + `requireAdmin`.

### Bentuk data

- `user`: `id`, `name`, `email`, `nim`, `avatar` (URL absolut `/storage/...`), `role`
- `ticket`: `code`, `title`, `category`, `priority` (`low/medium/high`), `description`, `image_url`, `status`, `created_at`, `completed_at`, `user`, `ticket_replies`
- `reply`: `id`, `content`, `created_at`, `user`
- `statistic`: `total_tickets`, `active_tickets`, `resolved_tickets`, `avg_resolution_time`, `status_distribution.{open,in_progress,resolved,rejected}`, `category_distribution`

Serializer untuk bentuk tersebut tersedia di `src/utils/serializers.ts`.
Input priority `normal` dari frontend diterima sebagai alias dan disimpan sebagai `medium`.

### List tiket

`GET /api/ticket` menerima `search`, `status`, `priority`, dan `date` (`today`, `week`,
`month`). `on_progress` dinormalisasi ke `in_progress`; date window dihitung dalam UTC.
Tanpa `page`/`per_page`, endpoint mengembalikan seluruh array agar tetap kompatibel dengan
store Vue saat ini. Pagination dapat diminta dengan `?page=1&per_page=10`; response tetap
memiliki `data` array dan menambahkan `meta.current_page`, `meta.per_page`, `meta.last_page`,
dan `meta.total`.

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
- Migration awal tersedia di `prisma/migrations/` dan sudah diterapkan pada lingkungan saat ini.
- Jangan reset database atau menjalankan seed berulang tanpa mengecek efeknya.

---

## Konfigurasi frontend

`src/plugins/axios.js` membaca `VITE_API_BASE_URL`; contoh ada di root `.env.example`.
Untuk web lokal gunakan `http://localhost:8000/api`. Untuk emulator Android gunakan
`http://10.0.2.2:8000/api`; untuk perangkat fisik gunakan IP LAN backend. Atur juga
backend `PUBLIC_BASE_URL` ke host yang dapat dijangkau perangkat agar URL avatar/gambar absolut
berfungsi. Konfigurasi Capacitor belum diubah.

---

## TODO keamanan sebelum produksi

- [ ] Ganti `JWT_SECRET` dengan nilai acak yang kuat dan simpan di secret manager.
- [ ] Gunakan HTTPS dan jangan aktifkan cleartext traffic di Android release.
- [ ] Pindahkan upload ke S3/R2 dan batasi akses file.
- [ ] Tambahkan refresh token/denylist jika butuh revoke sesi.
- [ ] Tambahkan rate limit khusus login/register.
- [ ] Tambahkan test otomatis dan CI.
- [ ] Ganti `console.error` dengan logger terstruktur.
