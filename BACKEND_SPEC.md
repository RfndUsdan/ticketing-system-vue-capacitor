# Spesifikasi Backend: Laravel → Node.js/Express + Prisma (PostgreSQL)

> **Tujuan dokumen ini:** menjadi *source of truth* untuk membangun ulang backend Laravel
> (`student-ticket`, Laravel 12 + Sanctum + MySQL) menjadi **Node.js/Express + Prisma + PostgreSQL**
> dengan **kontrak API yang identik**, sehingga frontend yang sudah ada tidak perlu diubah.
>
> Sumber: kode Laravel pada repo ini (commit `e4a6d13`), termasuk routes, controllers, FormRequest,
> Resources, models, migrations, seeder, dan feature tests.
>
> Bentuk response di §4 sudah diverifikasi dengan menjalankan request nyata lewat test suite
> (SQLite in-memory). Exercise sementara tidak di-commit; hanya dokumen ini yang ditambahkan.

---

## 0. Cara memakai dokumen ini

Saat mengerjakan backend baru, ikuti aturan berikut:

1. **Jangan mengubah nama field JSON.** Semua response memakai `snake_case`
   (`image_url`, `completed_at`, `ticket_replies`, `avg_resolution_time`, ...).
   Jangan meng-camelCase-kan output Prisma.
2. **Jangan mengubah envelope response.** Sebagian endpoint memakai `{ message, data }`,
   sebagian lain mengembalikan resource Laravel langsung (`{ data: ... }` atau paginated
   `{ data, links, meta }`). Detail persisnya ada di §4.
3. **Jangan mengubah status code** yang sudah dipakai frontend (200/201/401/403/404/422/500).
4. **Soft delete hanya untuk `tickets`.** `users` dan `ticket_replies` hard delete.
5. **Semua query ticket harus mengecualikan `deleted_at IS NOT NULL`** (perilaku trait `SoftDeletes`).
6. Urutan implementasi yang disarankan:
   schema + seed → auth + middleware → users (admin) → tickets → replies → dashboard → upload/static file.

Target teknis yang disarankan: Express 5, Prisma 6+, PostgreSQL 16, `zod` untuk validasi,
`bcryptjs` (cost 12), `multer` untuk upload, token opaque di tabel `auth_tokens` (pengganti Sanctum)
atau JWT (lihat §7.4).

---

## 1. Ringkasan stack Laravel yang dimigrasikan

| Aspek | Laravel | Target Node/Express |
|---|---|---|
| Framework | Laravel 12 | Express 5 |
| Auth API | Laravel Sanctum, **Bearer token opaque**, tanpa expiry | token opaque (DB) *atau* JWT |
| Guard | `auth:sanctum` + middleware alias `admin` | `requireAuth` + `requireAdmin` |
| DB | MySQL (`student_ticket`) | PostgreSQL |
| ORM | Eloquent | Prisma |
| Validasi | FormRequest (`422` + `{message, errors}`) | zod → mapper error yang sama |
| Password | bcrypt (cast `hashed`) | `bcryptjs`, cost 12 |
| Upload | `Storage::disk('public')` → `storage/app/public/...` | folder `uploads/...`, disajikan di `/storage/...` |
| URL file | `asset('storage/'.$path)` (absolut, pakai `APP_URL`) | `PUBLIC_BASE_URL` + `/storage/<path>` |
| Soft delete | `Ticket` (`deleted_at`) | kolom `deleted_at` di Prisma |
| Pagination | `paginate(10)` | page-based, `per_page = 10` |
| CORS | default Laravel: `paths = api/*`, origin `*` | `cors()` untuk `/api/*` |
| Base URL API | `/api/...` | `/api/...` (prefix wajib sama) |
| Health check | `GET /up` | opsional, tidak dipakai frontend |

---

## 2. Konvensi umum response

### 2.1 Envelope

| Pola | Dipakai oleh | Bentuk |
|---|---|---|
| A | Auth, profile, ticket, dashboard | `{ "message": string, "data": <objek/array/null> }` |
| B | `UserController` (resource langsung) | `{ "data": <objek> }` atau paginated `{ "data": [...], "links": {...}, "meta": {...} }` |
| C | Hapus | `{ "message": string }` (tanpa `data`) |
| D | Error | `{ "message": string }`, `{ "message", "errors" }`, atau `{ "message", "error" }` |

**Penting:** pada pola A, nilai `data` diisi resource Laravel yang di-*embed* ke array,
sehingga resource **tidak** dibungkus `data` lagi. Hasilnya tetap satu level `data`.

### 2.2 Status code yang dipakai

| Code | Kapan |
|---|---|
| 200 | GET/POST/PUT/DELETE sukses (mayoritas) |
| 201 | `POST /api/register`, `POST /api/ticket`, `POST /api/ticket-reply/{code}`, `POST /api/users` |
| 401 | belum login / token invalid (`{"message":"Unauthenticated."}`), login gagal (`{"message":"Unauthorized","data":null}`) |
| 403 | bukan admin, akses ticket orang lain |
| 404 | ticket/user tidak ditemukan |
| 422 | validasi gagal |
| 500 | exception tak tertangani / error database |

### 2.3 Format waktu

- Semua timestamp adalah ISO-8601 UTC, contoh Laravel:
  `"2026-05-08T01:23:28.000000Z"` (6 digit mikrodetik).
- Node `Date.toISOString()` menghasilkan `"2026-05-08T01:23:28.000Z"` (3 digit).
  Ini **aman** untuk `new Date(...)` di frontend. Bila ingin identik, serializer bisa menambahkan
  `000` di belakang milidetik. Jangan mengirim format `YYYY-MM-DD HH:mm:ss`.
- `completed_at` = `null` selama tiket belum `resolved`.

### 2.4 Format error validasi (422)

Laravel (default) mengembalikan:

```json
{
  "message": "The title field is required. (and 1 more error)",
  "errors": {
    "title": ["The title field is required."],
    "priority": ["The selected priority is invalid."]
  }
}
```

- `message` = error pertama, ditambah ` (and N more error/errors)` bila ada lebih dari satu.
- Frontend harus dianggap hanya mengandalkan `errors.<field>[0]`; teks `message` tidak perlu
  diterjemahkan ulang. Node cukup menghasilkan bentuk yang sama.

### 2.5 Format error lain

| Kasus | Body |
|---|---|
| Unauthenticated (401) | `{"message":"Unauthenticated."}` |
| Login gagal (401) | `{"message":"Unauthorized","data":null}` |
| Bukan admin (403) | `{"message":"Akses Ditolak, Anda bukan admin"}` |
| Ticket milik orang lain (403) | `{"message":"Anda tidak memiliki akses ke ticket ini"}` |
| Balas ticket orang lain (403) | `{"message":"Anda tidak bisa membalas tiket ini"}` |
| Ticket tidak ada (404, show/destroy) | `{"message":"Ticket tidak ditemukan"}` |
| Ticket tidak ada (404, reply) | `{"message":"Tiket tidak ditemukan"}` |
| User tidak ada (404, admin) | `{"message": ...}` (teks tidak dikontrak, cukup 404) |
| Error server (500) | `{"message":"Terjadi Kesalahan","error":"..."}` (lihat §4 per endpoint) |

> Saat `APP_DEBUG=true` (default di `.env` repo ini), error 500 dan 404 exception juga menyertakan
> `exception`, `file`, `line`, dan `trace`. Itu **bukan** kontrak; di produksi (`APP_DEBUG=false`)
> hanya `{"message":"Server Error"}`. Jangan meniru trace di Node.
>
> Contoh terverifikasi lain: admin menghapus user yang masih punya tiket → **500** karena FK
> restrict (lihat §4.16 dan §6).

> Perbedaan ejaan **"Ticket"** vs **"Tiket"** di atas disengaja dan ada di kode Laravel.
> Bila ingin 100% kompatibel, pertahankan.

---

## 3. Peta route lengkap

Base path: **`/api`**. Semua route butuh header `Authorization: Bearer <token>`
kecuali `login` dan `register`.

| # | Method | Path | Auth | Admin | Handler Laravel | Sukses |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/login` | – | – | `AuthController@login` | 200 |
| 2 | POST | `/api/register` | – | – | `AuthController@register` | 201 |
| 3 | GET | `/api/me` | ✔ | – | `AuthController@me` | 200 |
| 4 | POST | `/api/logout` | ✔ | – | `AuthController@logout` | 200 |
| 5 | POST | `/api/profile` | ✔ | – | `AuthController@updateProfile` | 200 |
| 6 | DELETE | `/api/profile/avatar` | ✔ | – | `AuthController@deleteAvatar` | 200 |
| 7 | GET | `/api/dashboard/statistic` | ✔ | ✔ | `DashboardController@getStatistic` | 200 |
| 8 | GET | `/api/ticket` | ✔ | – | `TicketController@index` | 200 |
| 9 | GET | `/api/ticket/{code}` | ✔ | – | `TicketController@show` | 200 |
| 10 | POST | `/api/ticket` | ✔ | – | `TicketController@store` | 201 |
| 11 | POST | `/api/ticket-reply/{code}` | ✔ | – | `TicketController@storeReply` | 201 |
| 12 | DELETE | `/api/ticket/{code}` | ✔ | ✔ | `TicketController@destroy` | 200 |
| 13 | GET | `/api/users` | ✔ | ✔ | `UserController@index` | 200 |
| 14 | POST | `/api/users` | ✔ | ✔ | `UserController@store` | 201 |
| 15 | GET | `/api/users/{user}` | ✔ | ✔ | `UserController@show` | 200 |
| 16 | PUT/PATCH | `/api/users/{user}` | ✔ | ✔ | `UserController@update` | 200 |
| 17 | DELETE | `/api/users/{user}` | ✔ | ✔ | `UserController@destroy` | 200 |

Catatan:
- `{user}` = **ID numerik** (route model binding), bukan NIM/email.
- `{code}` = kode ticket, contoh `TICS48123`.
- `PUT` dan `PATCH` sama-sama harus didaftarkan (Laravel `apiResource`).
- Route admin dicek middleware **setelah** auth; token valid tapi role `user` → 403.
- Tidak ada endpoint: lupa password, verifikasi email, ubah status ticket langsung,
  restore ticket, force delete, list notifikasi. Jangan menambahkannya tanpa diminta.

### 3.1 Peta controller → method

| File Laravel | Method | Endpoint | Inti perilaku |
|---|---|---|---|
| `AuthController` | `login` | `POST /login` | cek email+password, buat token, `role` dari DB |
| | `register` | `POST /register` | validasi, hash password, simpan avatar, buat token; `role` di response `null` (quirk) |
| | `me` | `GET /me` | user dari token |
| | `logout` | `POST /logout` | hapus token aktif saja |
| | `updateProfile` | `POST /profile` | update name/email/nim/password/avatar milik sendiri |
| | `deleteAvatar` | `DELETE /profile/avatar` | hapus file + set `avatar=null` |
| `TicketController` | `index` | `GET /ticket` | list + filter; user hanya miliknya; eager load `replies.user` |
| | `show` | `GET /ticket/{code}` | detail by code; owner check |
| | `store` | `POST /ticket` | buat kode `TICS#####`, status `open`, upload opsional |
| | `storeReply` | `POST /ticket-reply/{code}` | simpan balasan; admin ubah status + `completed_at` |
| | `destroy` | `DELETE /ticket/{code}` | soft delete (route admin) |
| `UserController` | `index` | `GET /users` | paginate 10, `latest()` |
| | `store` | `POST /users` | admin buat user (role bebas) → 201 `{data}` |
| | `show` | `GET /users/{id}` | detail → `{data}` |
| | `update` | `PUT/PATCH /users/{id}` | update parsial + `remove_avatar` |
| | `destroy` | `DELETE /users/{id}` | hapus avatar + hard delete (FK restrict) |
| `DashboardController` | `getStatistic` | `GET /dashboard/statistic` | agregat 30 hari (MySQL `TIMESTAMPDIFF`) |
| `AdminMiddleware` | `handle` | – | `role !== admin` → 403 |

FormRequest yang menjadi acuan validasi: `RegisterStoreRequest`, `TicketStoreRequest`,
`TicketReplyStoreRequest`, `UserStoreRequest`, `UserUpdateRequest`
(plus validasi inline di `AuthController@updateProfile`).

---

## 4. Detail per endpoint

### 4.1 `POST /api/login`

Request JSON:

```json
{ "email": "davidraya@email.com", "password": "password" }
```

Perilaku:
- **Tidak ada validasi FormRequest.** Body kosong / field hilang → langsung 401.
- Cocokkan `email` + `password` dengan bcrypt; status user tidak dicek (tidak ada banned).
- Buat token baru (Sanctum: nama `auth_Token`, tanpa expiry).
- Login tidak menghapus token lama; multi-device diperbolehkan.

Response 200:

```json
{
  "message": "Login berhasil",
  "data": {
    "token": "3|8fJ2k...opaque...",
    "user": {
      "id": 2,
      "name": "David Raya",
      "email": "davidraya@email.com",
      "nim": "2305101001",
      "avatar": "http://192.168.1.11:8000/storage/avatars/AbC123.jpg",
      "role": "user"
    }
  }
}
```

- `avatar` berupa **URL absolut** atau `null` (bukan path mentah).
- `role` ∈ `admin` | `user`.

Response 401:

```json
{ "message": "Unauthorized", "data": null }
```

Response 500 (exception): `{ "message": "Terjadi Kesalahan", "error": "..." }`.

---

### 4.2 `POST /api/register`

`Content-Type: multipart/form-data` (bila kirim avatar) atau JSON.

Field:

| Field | Tipe | Aturan |
|---|---|---|
| `name` | string | required, max 255 |
| `email` | string | required, email, max 255, unique `users.email` |
| `password` | string | required, min 6 (tanpa konfirmasi) |
| `nim` | string | required, max 20, unique `users.nim` |
| `avatar` | file | nullable, image, mimes `jpeg,png,jpg,gif`, max **2048 KB** |

Perilaku:
- `role` **tidak bisa** dikirim; selalu default `user` di level database.
- `nim` wajib (walaupun kolom DB nullable).
- Password di-hash bcrypt.
- Avatar disimpan ke `avatars/` lalu path-nya disimpan di kolom `avatar`.
- Dibungkus transaksi; token dibuat setelah user tersimpan.

> **Quirk Laravel yang terverifikasi:** karena `role` tidak di-set di model dan Eloquent tidak
> memuat ulang default DB setelah INSERT, response register berisi **`"role": null`**
> (bukan `"user"`). Login berikutnya baru mengembalikan `"user"`. Untuk Node, disarankan tetap
> mengembalikan `"user"` (lebih benar secara semantik dan tidak merusak UI non-admin);
> jika butuh byte-per-byte parity, kirim `null`. Catat pilihan ini di PR.

Response 201:

```json
{
  "message": "Registrasi berhasil",
  "data": {
    "token": "4|XyZ...opaque...",
    "user": {
      "id": 3,
      "name": "Mahasiswa Baru",
      "email": "mahasiswa@unipma.ac.id",
      "nim": "20260001",
      "avatar": null,
      "role": null
    }
  }
}
```

422 bila email/nim duplikat atau field tidak valid. 500: `{message:"Terjadi Kesalahan", error}`.

---

### 4.3 `GET /api/me`

Response 200:

```json
{
  "message": "Profile User berhasil diambil",
  "data": {
    "id": 2,
    "name": "David Raya",
    "email": "davidraya@email.com",
    "nim": "2305101001",
    "avatar": null,
    "role": "user"
  }
}
```

---

### 4.4 `POST /api/logout`

- Hapus **token yang sedang dipakai** saja (bukan semua token user).
- Idempotent: kalau token tidak ada, tetap 200.
- Setelahnya token tersebut harus 401.

Response 200:

```json
{ "message": "Logout berhasil", "data": null }
```

---

### 4.5 `POST /api/profile`

`multipart/form-data` bila upload avatar, JSON bila tidak.

Field (semua **required** kecuali yang nullable):

| Field | Tipe | Aturan |
|---|---|---|
| `name` | string | required, max 255 |
| `email` | string | required, email, max 255, unique kecuali milik sendiri |
| `nim` | string | required, max 20, unique kecuali milik sendiri |
| `password` | string | nullable, min 8; kosong/`null` = tidak diubah |
| `avatar` | file | nullable, image, mimes `jpeg,png,jpg` (gif **tidak** diizinkan di sini), max 2048 KB |

Perilaku:
- User hanya bisa mengubah dirinya sendiri (ID dari token).
- `role` tidak bisa diubah.
- Jika avatar baru diupload: **hapus file avatar lama** dari disk, simpan yang baru.
- Password baru langsung di-hash.

Response 200:

```json
{
  "message": "Profil berhasil diperbarui",
  "data": {
    "id": 2,
    "name": "Nama Baru",
    "email": "baru@unipma.ac.id",
    "nim": "20260002",
    "avatar": "http://.../storage/avatars/baru.png",
    "role": "user"
  }
}
```

500: `{ "message": "Terjadi Kesalahan saat update profil", "error": "..." }`.

---

### 4.6 `DELETE /api/profile/avatar`

- Hapus file avatar dari disk, set kolom `avatar = null`.
- Idempotent (kalau `avatar` null, tetap 200).

Response 200:

```json
{
  "message": "Foto profil berhasil dihapus",
  "data": { "id": 2, "name": "...", "email": "...", "nim": "...", "avatar": null, "role": "user" }
}
```

500: `{ "message": "Terjadi Kesalahan saat menghapus foto", "error": "..." }`.

---

### 4.7 `GET /api/ticket`

Query params (semua opsional):

| Param | Efek |
|---|---|
| `search` | `code LIKE %nilai%` **ATAU** `title LIKE %nilai%` |
| `status` | exact match `open` / `in_progress` / `resolved` / `rejected` |
| `priority` | exact match `low` / `normal` / `high` |

Perilaku:
- `user` hanya melihat tiket miliknya; `admin` melihat semua.
- Urutan: `created_at DESC`.
- **Tanpa pagination** — mengembalikan seluruh hasil.
- Eager load `user` dan `replies.user`.
- Filter tidak divalidasi; nilai asing → hasil kosong.
- Tidak ada filter tanggal.

Response 200:

```json
{
  "message": "Daftar Ticket berhasil ditampilkan",
  "data": [
    {
      "id": 12,
      "code": "TICS48123",
      "user": {
        "id": 2, "name": "David Raya", "email": "davidraya@email.com",
        "nim": "2305101001", "avatar": null, "role": "user"
      },
      "title": "AC Kelas Rusak",
      "description": "AC di ruang 302 mati total.",
      "image_url": "http://.../storage/tickets/xyz.jpg",
      "status": "open",
      "priority": "normal",
      "category": "Fasilitas",
      "created_at": "2026-05-08T01:23:28.000000Z",
      "updated_at": "2026-05-08T01:23:28.000000Z",
      "completed_at": null,
      "ticket_replies": [
        {
          "id": 5,
          "user": { "id": 3, "name": "...", "email": "...", "nim": "...", "avatar": null, "role": "admin" },
          "content": "Sedang kami proses.",
          "created_at": "2026-05-08T02:00:00.000000Z"
        }
      ]
    }
  ]
}
```

> `image_url` = URL absolut atau `null`. `ticket_replies` selalu ada di list/detail,
> urutannya **tidak dijamin** Laravel (praktisnya `id ASC`); tidak ada endpoint hapus/edit balasan.

**Bug parity yang perlu diputuskan:** implementasi Laravel menulis filter pencarian sebagai
`where(code like ?)->orWhere(title like ?)` **lalu** `where(user_id = ?)`. SQL efektifnya:

```sql
WHERE code LIKE '%q%' OR (title LIKE '%q%' AND user_id = ?)
```

Sudah diverifikasi di runtime: user A yang mencari **kode** tiket milik user B mendapat tiket B
(`?search=TICS22222` → 1 hasil), sedangkan mencari **judul** tidak bocor (`?search=Rahasia` → 0).
Rekomendasi: perbaiki di Node dengan mengelompokkan `(code LIKE ? OR title LIKE ?) AND user_id = ?`.
Catat perubahan ini karena berbeda dari Laravel.

500: `{ "message": "Terjadi Kesalahan", "error": "...", "file": "...", "line": 42 }`.

---

### 4.8 `GET /api/ticket/{code}`

- Cari berdasarkan `code`; soft-deleted tidak ditemukan.
- Eager load `user` + `replies.user`.
- `user` biasa hanya boleh tiket sendiri → 403; admin bebas.

Response 200:

```json
{
  "message": "Ticket berhasil ditampilkan",
  "data": { /* objek ticket sama seperti elemen array §4.7 */ }
}
```

404: `{ "message": "Ticket tidak ditemukan" }`
403: `{ "message": "Anda tidak memiliki akses ke ticket ini" }`
500: `{ "message": "Terjadi Kesalahan", "data": null }`

---

### 4.9 `POST /api/ticket`

`multipart/form-data` bila upload gambar, JSON bila tidak.

Field:

| Field | Tipe | Aturan |
|---|---|---|
| `title` | string | required, max 255 |
| `description` | string | required |
| `priority` | string | required, `low` / `normal` / `high` |
| `category` | string | required, `Fasilitas` / `Jaringan` / `Kebersihan` / `Administrasi` / `Lainnya` |
| `image` | file | nullable, image, mimes `jpeg,png,jpg,webp`, max **10240 KB** (10 MB) |

Perilaku:
- `user_id` diambil dari token (tidak bisa diisi dari body).
- `code` dibuat server: `'TICS' + random integer 10000–99999` (5 digit).
  Kode unik di DB; **tambahkan retry loop** di Node agar bentrok tidak jadi 500.
- `status` selalu `open`, `completed_at` selalu `null` saat create.
- Gambar disimpan ke `tickets/` (+ path di kolom `image`).

Response 201:

```json
{
  "message": "Ticket berhasil ditambahkan",
  "data": {
    "id": 13,
    "code": "TICS73104",
    "user": { "id": 2, "name": "...", "email": "...", "nim": "...", "avatar": null, "role": "user" },
    "title": "Kabel Proyektor Putus",
    "description": "Kabel HDMI terputus.",
    "image_url": "http://.../storage/tickets/foto.jpg",
    "status": "open",
    "priority": "high",
    "category": "Fasilitas",
    "created_at": "2026-05-08T02:10:00.000000Z",
    "updated_at": "2026-05-08T02:10:00.000000Z",
    "completed_at": null
  }
}
```

> **Perhatikan:** response create **tidak** memiliki key `ticket_replies`
> (relasi tidak di-load, `whenLoaded` menghilangkan key). Jangan menambahkan `[]`.

500: `{ "message": "Terjadi Kesalahan", "data": null }`.

---

### 4.10 `POST /api/ticket-reply/{code}`

Request JSON:

| Field | Tipe | Aturan |
|---|---|---|
| `content` | string | required |
| `status` | string | **wajib hanya untuk admin**: `open` / `in_progress` / `resolved` / `rejected`; untuk user `nullable` dan diabaikan |

Perilaku:
- Cari ticket by `code` (soft-deleted tidak ada → 404).
- User biasa hanya boleh membalas tiket sendiri (403); admin bebas.
- Simpan `ticket_replies` (`ticket_id`, `user_id` dari token, `content`).
- **Jika `user.role === 'admin'`:** update `tickets.status = body.status`;
  bila `status === 'resolved'` set `tickets.completed_at = now()`.
- Jika role `user`: `status` tidak mengubah apa pun.
- `completed_at` **tidak pernah dikosongkan** saat status berubah dari `resolved` ke status lain.
  (Perilaku Laravel; boleh diperbaiki tapi catat perubahannya.)
- Semua dalam satu transaksi.

Response 201:

```json
{
  "message": "Balasan tiket berhasil ditambahkan",
  "data": {
    "id": 21,
    "user": { "id": 1, "name": "Admin", "email": "admin@email.com", "nim": null, "avatar": null, "role": "admin" },
    "content": "Tiket sudah kami tangani.",
    "created_at": "2026-05-08T03:00:00.000000Z"
  }
}
```

404: `{ "message": "Tiket tidak ditemukan" }`
403: `{ "message": "Anda tidak bisa membalas tiket ini" }`
500: `{ "message": "Terjadi Kesalahan", "data": "..." }` ← `data` berisi pesan error (bukan `null`).

---

### 4.11 `DELETE /api/ticket/{code}`

- **Admin saja** (middleware). User biasa → 403 walau tiketnya sendiri.
- Soft delete: isi `deleted_at = now()`. Baris dan balasan tetap ada di DB.
- Tiket yang sudah soft-deleted → 404.
- Tidak ada endpoint restore.

Response 200:

```json
{ "message": "Ticket berhasil dihapus" }
```

404: `{ "message": "Ticket tidak ditemukan" }`
500: `{ "message": "Gagal menghapus ticket" }`

---

### 4.12 `GET /api/users` (admin)

- Urut `created_at DESC` (`latest()`), pagination **10 per halaman**.
- Query `?page=N`.
- Response **tanpa** `message`, memakai wrapper paginator Laravel.

Response 200:

```json
{
  "data": [
    {
      "id": 1, "name": "Admin", "email": "admin@email.com",
      "nim": null, "avatar": null, "role": "admin"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/users?page=1",
    "last": "http://localhost:8000/api/users?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [
      { "url": null, "label": "&laquo; Previous", "page": null, "active": false },
      { "url": "http://localhost:8000/api/users?page=1", "label": "1", "page": 1, "active": true },
      { "url": null, "label": "Next &raquo;", "page": null, "active": false }
    ],
    "path": "http://localhost:8000/api/users",
    "per_page": 10,
    "to": 1,
    "total": 1
  }
}
```

> Label paginator memakai HTML entity (`&laquo;`, `&raquo;`). Frontend biasanya hanya memakai
> `meta.current_page`, `meta.last_page`, `meta.total`. Node minimal harus menyediakan
> struktur `data`, `links.first/last/prev/next`, dan `meta` tersebut.
> Bangun URL absolut dari `PUBLIC_BASE_URL` + `/api/users?page=N` (bukan dari `APP_URL` Laravel).

---

### 4.13 `POST /api/users` (admin)

`multipart/form-data` bila upload avatar.

| Field | Aturan |
|---|---|
| `name` | required, string, max 255 |
| `email` | required, email, max 255, unique |
| `nim` | required, string, max **50**, unique |
| `password` | required, string, min **8** |
| `role` | required, `admin` / `user` |
| `avatar` | nullable, image, mimes `jpeg,png,jpg,gif`, max 2048 KB |

Response **201** (resource langsung, tanpa `message`):

```json
{
  "data": {
    "id": 9, "name": "Operator", "email": "op@email.com",
    "nim": "2305100099", "avatar": null, "role": "admin"
  }
}
```

---

### 4.14 `GET /api/users/{user}` (admin)

Response 200: `{ "data": { /* user */ } }`.
ID tidak ada → 404.

---

### 4.15 `PUT|PATCH /api/users/{user}` (admin)

Semua field **opsional** (`sometimes`), tetapi bila dikirim tidak boleh kosong:

| Field | Aturan |
|---|---|
| `name` | opsional, required-if-present, max 255 |
| `email` | opsional, email, max 255, unique kecuali user ini |
| `nim` | opsional, max **50**, unique kecuali user ini |
| `password` | nullable, min 8; kosong → tidak diubah |
| `role` | opsional, `admin` / `user` |
| `avatar` | nullable, image, mimes `jpeg,png,jpg,gif`, max 2048 KB |
| `remove_avatar` | opsional; truthy → hapus avatar & set `null` |

Perilaku:
- `remove_avatar` diproses **sebelum** file baru; jika keduanya dikirim, file baru menang.
- Hapus file fisik avatar lama saat diganti/dihapus.
- `password` kosong/null di-unset, bukan disimpan kosong.

Response 200: `{ "data": { /* user */ } }`.

---

### 4.16 `DELETE /api/users/{user}` (admin)

- Hapus file avatar (jika ada), lalu **hard delete** user.
- **Catatan:** FK `tickets.user_id` dan `ticket_replies.user_id` di Laravel tidak cascade.
  Menghapus user yang punya tiket/balasan akan gagal (500 DB error).
  Untuk Node: pilih `onDelete: Restrict` (parity) atau `Cascade` (lebih ramah); lihat §6.

Response 200:

```json
{ "message": "User berhasil dihapus" }
```

---

### 4.17 `GET /api/dashboard/statistic` (admin)

Rentang: **30 hari terakhir** (`created_at BETWEEN now()-30d AND now()`), hanya tiket
yang **belum soft-deleted**.

Definisi:
- `total_tickets` = semua tiket pada rentang.
- `active_tickets` = `status != 'resolved'` (termasuk `rejected`).
- `resolved_tickets` = `status = 'resolved'`.
- `avg_resolution_time` = rata-rata jam dari `created_at` → `completed_at` untuk tiket
  `resolved` dengan `completed_at NOT NULL`, dibulatkan 1 desimal; `0` bila tidak ada.
  Laravel memakai MySQL `TIMESTAMPDIFF(HOUR, ...)` yang **membulatkan ke bawah per baris**
  sebelum di-`AVG` (lihat SQL Postgres di §7.7).
- `status_distribution` = hitungan per status.
- `category_distribution` = hitungan 5 kategori tetap.

Response 200:

```json
{
  "message": "Dashboard statistic fetched successfully",
  "data": {
    "total_tickets": 24,
    "active_tickets": 9,
    "resolved_tickets": 15,
    "avg_resolution_time": 12.4,
    "status_distribution": { "open": 4, "in_progress": 5, "resolved": 15, "rejected": 0 },
    "category_distribution": {
      "Fasilitas": 10, "Jaringan": 6, "Kebersihan": 3,
      "Administrasi": 2, "Lainnya": 3
    }
  }
}
```

- `avg_resolution_time` adalah **number** (bukan string). Bila 0, Laravel mengirim `0`.
- Tidak ada `try/catch`, error → 500 default.
- Implementasi Laravel **MySQL-only** (`TIMESTAMPDIFF`); sudah diverifikasi gagal di SQLite.
  Saat pindah ke PostgreSQL, wajib memakai query §7.7, bukan menyalin SQL Laravel.

---

## 5. Aturan bisnis & jebakan parity

1. **Role** hanya `admin` | `user`, default `user`. Hanya admin bisa mengakses dashboard,
   hapus ticket, dan CRUD users. Role tidak bisa diubah lewat `/profile`.
2. **Semua endpoint ticket butuh login**, termasuk list. Tidak ada akses publik.
3. **Kepemilikan ticket** dicek di `show` dan `storeReply` untuk role `user`.
   `index` memfilter `user_id` (dengan bug OR di §4.7).
4. **Soft delete** `tickets` — semua query ticket wajib `deleted_at IS NULL`,
   termasuk dashboard dan pencarian by `code`.
5. **`completed_at`** hanya diisi saat admin mengirim balasan dengan `status=resolved`.
   Tidak pernah dikosongkan otomatis.
6. **Status ticket tidak punya endpoint khusus.** Satu-satunya cara mengubah status adalah
   lewat balasan admin. User tidak bisa menutup tiketnya sendiri.
7. **Kode ticket** `TICS` + 5 digit acak; unik. Jangan pakai ID; jangan ubah format.
8. **Case sensitivity pencarian:** MySQL (Laravel sekarang) umumnya case-insensitive.
   PostgreSQL `LIKE` case-sensitive. Gunakan `mode: 'insensitive'` di Prisma / `ILIKE`
   agar perilaku sama.
9. **Filter status/priority** exact match, tanpa validasi. Nilai asing → array kosong.
10. **Category** disimpan sebagai string (bukan enum DB), tetapi divalidasi whitelist 5 nilai.
    Pertahankan default DB `Lainnya` walau create selalu mengirim kategori.
11. **NIM** nullable + unique di DB, tetapi **wajib** di register/profile/admin create.
    Admin seed (`admin@email.com`) tidak punya NIM.
12. **Email** unik, case sensitivity mengikuti collation MySQL (case-insensitive).
    Di Postgres, gunakan unique index pada `lower(email)` atau `citext` bila ingin sama;
    minimal normalisasi `trim().toLowerCase()` sebelum simpan/cari.
13. **Password**: bcrypt. Hash lama MySQL tidak otomatis valid di Postgres bila data dimigrasi;
    opsi: migrasi hash apa adanya (bcrypt kompatibel), atau reset password.
14. **Token** Sanctum tidak pernah kedaluwarsa dan hanya token aktif yang dihapus saat logout.
15. **Avatar URL** absolut memakai `APP_URL`, path relatif disimpan di DB (`avatars/xxx.jpg`).
    Jangan menyimpan URL absolut ke DB.
16. **Upload**: nama file diacak (Laravel 40 char). Batas ukuran dan mime harus sama.
    Validasi `image` berarti file harus gambar valid, bukan hanya ekstensi.
17. **Tidak ada rate limit, refresh token, email verification, atau reset password.**
18. **Transaksi**: register, update profile, create ticket, create reply dibungkus transaksi.
19. **Balasan tidak bisa diedit/dihapus** lewat API.
20. **User delete tidak menghapus tiketnya** (FK restrict). Bila user dihapus, tiket yatim
    tidak mungkin terjadi karena DB menolak. Pilih kebijakan di §6.

---

## 6. Prisma schema (PostgreSQL)

Schema di bawah memetakan nama tabel/kolom Laravel apa adanya (`snake_case`) agar migrasi data
dan query manual mudah. Enum Prisma diserialisasi sebagai string, cocok dengan JSON Laravel.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  admin
  user
}

enum TicketStatus {
  open
  in_progress
  resolved
  rejected
}

enum TicketPriority {
  low
  normal
  high
}

model User {
  id              Int       @id @default(autoincrement())
  name            String
  email           String    @unique
  nim             String?   @unique
  avatar          String?
  emailVerifiedAt DateTime? @map("email_verified_at")
  password        String
  role            UserRole  @default(user)
  rememberToken   String?   @map("remember_token")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  tickets    Ticket[]
  replies    TicketReply[]
  authTokens AuthToken[]

  @@map("users")
}

model Ticket {
  id          Int            @id @default(autoincrement())
  userId      Int            @map("user_id")
  code        String         @unique
  title       String
  category    String         @default("Lainnya")
  description String
  image       String?
  status      TicketStatus   @default(open)
  priority    TicketPriority
  completedAt DateTime?      @map("completed_at")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")
  deletedAt   DateTime?      @map("deleted_at") // soft delete

  user    User          @relation(fields: [userId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  replies TicketReply[]

  @@index([userId])
  @@index([status])
  @@index([priority])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("tickets")
}

model TicketReply {
  id        Int      @id @default(autoincrement())
  ticketId  Int      @map("ticket_id")
  userId    Int      @map("user_id")
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  ticket Ticket @relation(fields: [ticketId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Restrict, onUpdate: Cascade)

  @@index([ticketId])
  @@index([userId])
  @@map("ticket_replies")
}

/// Pengganti tabel personal_access_tokens Sanctum.
/// Token asli (plain) hanya dikirim sekali ke client; DB menyimpan hash SHA-256.
/// Hapus model ini bila memilih JWT (lihat §7.4).
model AuthToken {
  id         Int       @id @default(autoincrement())
  userId     Int       @map("user_id")
  name       String    @default("auth_Token")
  tokenHash  String    @unique @map("token_hash")
  lastUsedAt DateTime? @map("last_used_at")
  expiresAt  DateTime? @map("expires_at") // null = tidak pernah kedaluwarsa
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("auth_tokens")
}
```

### Catatan mapping

| Laravel | Prisma | Catatan |
|---|---|---|
| `$table->id()` (bigint unsigned) | `Int @id @default(autoincrement())` | `Int` cukup; gunakan `BigInt` hanya jika migrasi data menuntut |
| `enum('role', ['admin','user'])` | `enum UserRole` | JSON tetap string |
| `enum('status', ...)` | `enum TicketStatus` | nama value harus persis |
| `enum('priority', ...)` | `enum TicketPriority` | |
| `string('category')->default('Lainnya')` | `String @default("Lainnya")` | bukan enum DB |
| `text('title')` | `String` | Postgres `text`; validasi max 255 di app |
| `longText('description')` | `String` | Postgres `text` |
| `longText('content')` | `String` | Postgres `text` |
| `timestamp` / `timestamps()` | `DateTime` + `@map` | simpan UTC |
| `softDeletes()` | `deletedAt DateTime?` | filter manual/extension |
| FK `constrained()` | `onDelete: Restrict, onUpdate: Cascade` | mirror Laravel (tanpa cascade) |
| `personal_access_tokens` | `AuthToken` | disederhanakan, bukan polymorphic |

**Tabel Laravel yang tidak perlu dimigrasikan:** `sessions`, `password_reset_tokens`,
`cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs` (tidak ada fitur API yang memakainya).

**Rekomendasi FK:** untuk parity pakai `Restrict`. Jika ingin admin bisa menghapus user,
ganti `tickets.userId`/`ticket_replies.userId` menjadi `Cascade`; ini **deviasi** dari Laravel,
jadi putuskan eksplisit.

**Soft delete:** Prisma tidak punya soft delete bawaan. Eksplisit di setiap query ticket:

```js
where: { deletedAt: null, ... }
```

atau buat Prisma Client Extension `softDelete('Ticket')` yang otomatis menambahkan filter
untuk `findMany`, `findFirst`, `count`, `aggregate`, dan mengubah `delete` menjadi `update`.
Jangan sampai dashboard/lookup by code lupa memfilter.

---

## 7. Rencana implementasi Node/Express

### 7.1 Dependency

```bash
npm i express @prisma/client bcryptjs multer zod cors dotenv
npm i -D prisma nodemon
# opsional: helmet, morgan, express-rate-limit
```

### 7.2 Struktur yang disarankan

```
server/
  prisma/
    schema.prisma
    seed.js
  src/
    app.js
    server.js
    config/env.js
    lib/prisma.js
    middlewares/auth.js          # requireAuth
    middlewares/admin.js         # requireAdmin
    middlewares/upload.js        # multer: avatar, ticketImage
    middlewares/validate.js      # zod -> 422 Laravel-style
    middlewares/error.js         # 404 + error handler
    routes/auth.routes.js
    routes/user.routes.js
    routes/ticket.routes.js
    routes/dashboard.routes.js
    controllers/auth.controller.js
    controllers/user.controller.js
    controllers/ticket.controller.js
    controllers/dashboard.controller.js
    schemas/auth.schema.js
    schemas/user.schema.js
    schemas/ticket.schema.js
    utils/response.js            # ok(), created(), fail()
    utils/serializers.js         # toUser(), toTicket(), toReply(), toPaginatedUsers()
    utils/file.js                # saveFile, deleteFile, publicUrl
    utils/ticketCode.js
  uploads/
    avatars/
    tickets/
  .env
```

### 7.3 Middleware order

```js
app.use(cors());                                    // default origin "*", sama seperti Laravel
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/storage', express.static(UPLOAD_ROOT));   // mirror public/storage symlink
app.use('/api', routes);
app.use(notFound);                                  // 404 { message }
app.use(errorHandler);                              // 500 { message }
```

- Pasang `requireAuth` pada semua route kecuali login/register.
- Pasang `requireAdmin` setelah `requireAuth` pada route admin.
- `requireAuth`:
  - baca `Authorization: Bearer <token>`;
  - hash token (SHA-256), cari `AuthToken` + `user`;
  - tolak bila tidak ada / `expiresAt` lewat → `401 {"message":"Unauthenticated."}`;
  - update `lastUsedAt` (opsional);
  - set `req.user`.
- `requireAdmin`: `req.user.role !== 'admin'` → `403 {"message":"Akses Ditolak, Anda bukan admin"}`.

### 7.4 Auth token: dua opsi

**Opsi A (direkomendasikan untuk parity): token opaque di DB**

- Login/register: `raw = crypto.randomBytes(32).toString('hex')`;
  simpan `sha256(raw)` di `auth_tokens.token_hash`;
  kirim `raw` sebagai `data.token` (boleh diberi prefix `id|` agar mirip Sanctum).
- Logout: hapus baris token yang cocok → token langsung invalid.
- Tanpa expiry (`expires_at = null`) seperti Sanctum.

**Opsi B: JWT**

- `jsonwebtoken` HS256, payload `{ sub: user.id, role }`, expiry panjang.
- Logout tidak benar-benar mencabut token; perlu `tokenVersion`/blacklist bila harus parity
  dengan test "token dihapus". Lebih rumit; pilih A bila tidak ada alasan khusus.

### 7.5 Serializer (bentuk JSON)

```js
const publicUrl = (p) => (p ? `${process.env.PUBLIC_BASE_URL}/storage/${p}` : null);

const toUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  nim: u.nim,
  avatar: publicUrl(u.avatar),
  role: u.role,
});

const toReply = (r) => ({
  id: r.id,
  user: toUser(r.user),
  content: r.content,
  created_at: r.createdAt,
});

const toTicket = (t, { withReplies = true } = {}) => ({
  id: t.id,
  code: t.code,
  user: toUser(t.user),
  title: t.title,
  description: t.description,
  image_url: publicUrl(t.image),
  status: t.status,
  priority: t.priority,
  category: t.category,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
  completed_at: t.completedAt,
  ...(withReplies && t.replies ? { ticket_replies: t.replies.map(toReply) } : {}),
});
```

Jangan lupa `deletedAt` **tidak** pernah diekspos.

### 7.6 Validasi (zod → 422)

Buat helper yang mengubah `ZodError` menjadi:

```js
const errors = {};
for (const issue of zodError.issues) {
  const key = issue.path.join('.');
  (errors[key] ??= []).push(issue.message);
}
res.status(422).json({ message: firstMessageWithCount(errors), errors });
```

Aturan per endpoint ada di §4. Untuk upload, validasi `file.mimetype` + `file.size`
(multer `limits.fileSize`), bukan hanya ekstensi.

### 7.7 Query dashboard (PostgreSQL)

```sql
-- total / active / resolved / avg (30 hari terakhir, exclude soft delete)
SELECT
  COUNT(*)::int AS total_tickets,
  COUNT(*) FILTER (WHERE status <> 'resolved')::int AS active_tickets,
  COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_tickets,
  COALESCE(
    ROUND(
      AVG(FLOOR(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600))::numeric,
      1
    ),
    0
  ) AS avg_resolution_time
FROM tickets
WHERE deleted_at IS NULL
  AND created_at BETWEEN $1 AND $2;
```

```sql
SELECT status, COUNT(*)::int AS count
FROM tickets
WHERE deleted_at IS NULL AND created_at BETWEEN $1 AND $2
GROUP BY status;
```

```sql
SELECT category, COUNT(*)::int AS count
FROM tickets
WHERE deleted_at IS NULL AND created_at BETWEEN $1 AND $2
GROUP BY category;
```

Lalu susun objek dengan **semua key tetap** (isi 0 bila tidak ada):

```js
const status_distribution = { open: 0, in_progress: 0, resolved: 0, rejected: 0 };
for (const row of statusRows) status_distribution[row.status] = row.count;

const category_distribution = {
  Fasilitas: 0, Jaringan: 0, Kebersihan: 0, Administrasi: 0, Lainnya: 0,
};
for (const row of categoryRows) category_distribution[row.category] = row.count;
```

`avg_resolution_time` di-cast ke `Number` sebelum dikirim (Prisma `$queryRaw` mengembalikan
`Decimal`/string untuk `numeric`).

### 7.8 Upload file

- Root: `UPLOAD_ROOT` (mis. `server/uploads`), subfolder `avatars/`, `tickets/`.
- Nama file: `crypto.randomUUID() + ext` (acak, tanpa nama asli).
- Simpan **path relatif** (`avatars/uuid.jpg`) ke DB.
- URL publik: `${PUBLIC_BASE_URL}/storage/avatars/uuid.jpg`.
- Hapus file lama secara best-effort saat replace/delete (abaikan ENOENT).
- Batas: avatar 2 MB, ticket image 10 MB.
- Mime avatar: `image/jpeg`, `image/png`, `image/gif` (profile: tanpa gif);
  ticket: + `image/webp`.

### 7.9 Pagination users

`GET /api/users?page=N`:

```js
const perPage = 10;
const page = Math.max(1, Number(req.query.page) || 1);
const [total, rows] = await prisma.$transaction([
  prisma.user.count(),
  prisma.user.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
]);
```

Bangun `links` dan `meta` seperti §4.12 (label HTML entity opsional; minimal struktur sama).

### 7.10 Seed

```js
// prisma/seed.js
await prisma.user.upsert({
  where: { email: 'admin@email.com' },
  update: {},
  create: { name: 'Admin', email: 'admin@email.com', password: bcrypt.hashSync('password', 12), role: 'admin' },
});

await prisma.user.upsert({
  where: { email: 'davidraya@email.com' },
  update: {},
  create: {
    name: 'David Raya',
    email: 'davidraya@email.com',
    nim: '2305101001',
    password: bcrypt.hashSync('password', 12),
    role: 'user',
  },
});
```

### 7.11 Environment

```dotenv
PORT=8000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_ticket?schema=public"
PUBLIC_BASE_URL="http://localhost:8000"
UPLOAD_ROOT="./uploads"
BCRYPT_ROUNDS=12
TOKEN_TTL_DAYS=            # kosong = tanpa expiry
CORS_ORIGIN=*              # samakan dengan perilaku Laravel
```

---

## 8. Checklist paritas (dari feature tests Laravel)

| # | Skenario | Ekspektasi |
|---|---|---|
| 1 | `GET /api/ticket` tanpa token | 401 |
| 2 | Register valid | 201, body punya `data.token` & `data.user`, user tersimpan (email+nim) |
| 3 | Register email/nim duplikat | 422, `errors.email` & `errors.nim` |
| 4 | Register dengan avatar | 201, file tersimpan, `user.avatar` URL |
| 5 | Login benar | 200, `data.token`, `data.user.{id,name,email}` |
| 6 | Login password salah | 401, `{message:"Unauthorized",data:null}` |
| 7 | Logout | 200, `{message:"Logout berhasil"}`, token invalid setelahnya |
| 8 | Update profil tanpa foto | 200, `{message:"Profil berhasil diperbarui"}`, field berubah |
| 9 | Update profil + avatar | 200, `user.avatar` terisi, file ada |
| 10 | Hapus avatar | 200, `{message:"Foto profil berhasil dihapus"}`, `avatar=null`, file terhapus |
| 11 | Create ticket tanpa gambar | 201, `data.{id,code,title,status}`, status `open`, `user_id` dari token |
| 12 | Create ticket + gambar | 201, file tersimpan, `image_url` terisi |
| 13 | Create ticket kategori/prioritas invalid | 422, `errors.priority`, `errors.category` |
| 14 | User A list ticket | 200, hanya tiket A |
| 15 | User A buka ticket B | 403, `{message:"Anda tidak memiliki akses ke ticket ini"}` |
| 16 | Admin list ticket | 200, semua tiket |
| 17 | Admin reply + `status=resolved` | 201, reply tersimpan, status ticket `resolved`, `completed_at` terisi |
| 18 | User reply | 201, status ticket tidak berubah |
| 19 | Admin hapus ticket | 200, ticket hilang dari list (soft delete) |
| 20 | Non-admin hapus ticket | 403 |
| 21 | Non-admin dashboard/users | 403, `{message:"Akses Ditolak, Anda bukan admin"}` |
| 22 | Admin CRUD user | 201/200/200, bentuk `{data:{...}}` |
| 23 | Dashboard | 200, 6 key data sesuai §4.17, key distribusi lengkap |
| 24 | `search` ticket milik user lain | **Bug Laravel** bisa bocor; putuskan fix dengan grouping (rekomendasi) |

---

## 9. Ringkasan parity file/gambar

| Aspek | Nilai |
|---|---|
| Disk | `uploads/` lokal |
| Path DB user | `avatars/<random>.<ext>` |
| Path DB ticket | `tickets/<random>.<ext>` |
| URL user | `PUBLIC_BASE_URL/storage/avatars/...` |
| URL ticket | `PUBLIC_BASE_URL/storage/tickets/...` |
| Avatar max | 2 MB (2048 KB) |
| Ticket image max | 10 MB (10240 KB) |
| Avatar mime | jpeg, png, jpg, gif (profil: tanpa gif) |
| Ticket mime | jpeg, png, jpg, webp |
| Hapus file | saat avatar diganti/dihapus, user dihapus; **tidak** saat ticket di-soft-delete |

---

## 10. Hal yang **tidak boleh** dilakukan saat implementasi

- Mengubah `/api` prefix atau nama route.
- Mengganti `snake_case` menjadi camelCase di response.
- Menambahkan pagination pada `GET /api/ticket` (frontend menganggap array penuh).
- Menambahkan `message` pada response `UserController` (show/store/update) atau
  menambahkan `ticket_replies` pada response create ticket.
- Mengembalikan `204 No Content` untuk delete; Laravel memakai `200` + `message`.
- Mengekspos `password`, `remember_token`, `deleted_at`, atau path file mentah.
- Mengizinkan user biasa mengubah `role`/`user_id`/`status` lewat endpoint selain aturan di atas.
- Menghapus `completed_at` otomatis tanpa keputusan eksplisit.
- Memakai `ILIKE`/case-sensitive yang berbeda dari MySQL tanpa mendokumentasikannya.

---

## 11. Urutan PR yang disarankan

1. **PR 1** — scaffold Express + Prisma + env + health + error handler + CORS.
2. **PR 2** — schema, migration, seed, serializer util.
3. **PR 3** — register/login/logout/me + auth middleware + upload avatar.
4. **PR 4** — profile update/delete avatar.
5. **PR 5** — ticket index/show/store + upload image + kode unik.
6. **PR 6** — ticket reply + transisi status + admin delete.
7. **PR 7** — admin users CRUD + pagination.
8. **PR 8** — dashboard (raw SQL) + verifikasi angka terhadap Laravel.
9. **PR 9** — kontrak test (supertest) mengikuti checklist §8, bandingkan response JSON
   dengan backend Laravel untuk 2–3 contoh per endpoint.
