# PajakApp Backend (Node.js, Express, MongoDB)

Backend API untuk pengelolaan data pajak (PBB) dengan autentikasi JWT, validasi input, statistik, laporan, dan role admin.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org) [![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com) [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg)](https://mongoosejs.com) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Fitur

- Autentikasi JWT (register, login, me, logout)
- CRUD Tax Records + validasi input
- Statistik pengguna dan admin
- Laporan ringkasan dan per-properti (date range)
- Role-based access (Admin)
- Keamanan & performa: Helmet, Rate Limit, CORS, Compression, Logging
- Health check endpoint

## Teknologi

- Node.js, Express.js
- MongoDB + Mongoose
- JSON Web Token (JWT)
- express-validator

---

## Quick Start

1) Install dependencies
```bash
npm install
```

2) Konfigurasi environment (opsional — sudah ada default aman untuk dev)
Buat file `.env` di root proyek:
```env
PORT=8000
MONGODB_URI=mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGINS=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
NODE_ENV=development
```

3) Jalankan server (development)
```bash
npm run dev
```

4) Cek health
```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

API Base URL: `http://localhost:8000/api`

---

## Struktur Proyek

```text
src/
  app.js                 # Inisialisasi Express, middleware, routes
  server.js              # Bootstrap server, DB connect, seed
  config/
    env.js               # Konfigurasi environment
    db.js                # Koneksi MongoDB (Mongoose)
  controllers/           # Logika bisnis per domain
    auth.controller.js
    tax.controller.js
    admin.controller.js
    reports.controller.js
  middlewares/
    auth.js              # JWT auth & admin guard
    errorHandler.js      # 404 & centralized error handler
  models/
    User.js
    TaxRecord.js
  routes/
    auth.routes.js
    tax.routes.js
    admin.routes.js
    reports.routes.js
  utils/
    seed.js              # Seeding default user & contoh data
```

---

## Endpoints Inti (ringkas)

- Auth (`/api/auth`)
  - `POST /register`
  - `POST /login`
  - `POST /logout` (auth)
  - `GET /user` (auth)

- Tax Records (`/api/tax-records`, auth)
  - `GET /` (list)
  - `POST /` (create)
  - `GET /:id`
  - `PUT /:id`
  - `DELETE /:id`
  - `GET /statistics`
  - `GET /outstanding`
  - `GET /year/:year`
  - `GET /check-year`
  - `POST /auto-create`

- Reports (`/api/reports`, auth)
  - `GET /summary?dateRange=this_year|this_month|last_month|this_quarter|last_year`
  - `GET /property?dateRange=...`

- Admin (`/api/admin`, auth + admin)
  - `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`, `PUT /users/:id/toggle-status`
  - `GET /tax-records`, `GET /tax-records/:id`, `PUT /tax-records/:id`
  - `GET /statistics`

- Health
  - `GET /health`

---

## Contoh Penggunaan

Login default (dibuat otomatis saat start):
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"iqbaldev.site@gmail.com","password":"iqbaldev.site"}'
```

Ambil statistik (ganti `YOUR_TOKEN`):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/tax-records/statistics
```

---

## Skrip NPM

```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "lint": "echo 'add linter here'",
  "test": "echo 'no tests'"
}
```

---

## Keamanan & Performa

- Helmet: header keamanan default
- Rate Limit: dibatasi via `RATE_LIMIT_WINDOW_MS` & `RATE_LIMIT_MAX`
- CORS: whitelist melalui `CORS_ORIGINS` (pisahkan dengan koma). `*` untuk dev
- Compression: gzip responses
- Logging: morgan (format `dev` saat development, `combined` saat production)

---

## Default User & Seeding

Saat server pertama kali berjalan, otomatis dibuat user admin dan contoh data:
- Email: `iqbaldev.site@gmail.com`
- Password: `iqbaldev.site`

Catatan: ubah password dan `JWT_SECRET` saat production.

Kontrol seeding via ENV:
```env
SEED_ADMIN=true   # buat admin default (default: true)
SEED_SAMPLE=false # JANGAN buat data sample (default: false)
```

---

## Troubleshooting (singkat)

- Gagal konek MongoDB: cek `MONGODB_URI`, konektivitas ke host/port, dan kredensial
- 401 Unauthorized: pastikan `Authorization: Bearer <token>` benar & belum kadaluarsa
- CORS error: atur `CORS_ORIGINS` agar mengizinkan origin frontend

---

## Lisensi

MIT
