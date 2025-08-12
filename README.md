# PajakApp Backend (Express.js)

Backend API untuk aplikasi PajakApp menggunakan Express.js dan MongoDB.

## Fitur

-   ✅ Autentikasi JWT
-   ✅ CRUD Tax Records
-   ✅ Statistik Dashboard
-   ✅ Admin Routes
-   ✅ Validasi Input
-   ✅ Error Handling
-   ✅ CORS Support

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env` (opsional, sudah ada default yang aman untuk dev):

```
PORT=8000
MONGODB_URI=mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGINS=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
NODE_ENV=development
```

### 3. Pastikan MongoDB Berjalan

Database menggunakan MongoDB remote:

```
mongodb://iqbal:iqbal@100.64.75.107:27017/relajak
```

### 4. Jalankan Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

-   `POST /api/auth/register` - Register user baru
-   `POST /api/auth/login` - Login user
-   `POST /api/auth/logout` - Logout user
-   `GET /api/auth/user` - Get user data

### Tax Records

-   `GET /api/tax-records` - Get semua tax records user
-   `GET /api/tax-records/statistics` - Get statistik dashboard
-   `POST /api/tax-records` - Create tax record baru
-   `GET /api/tax-records/:id` - Get tax record by ID
-   `PUT /api/tax-records/:id` - Update tax record
-   `DELETE /api/tax-records/:id` - Delete tax record

### Admin Routes

-   `GET /api/admin/users` - Get semua users (admin only)

## Default User

Saat pertama kali menjalankan server, akan dibuat user default:

-   **Email**: `iqbaldev.site@gmail.com`
-   **Password**: `iqbaldev.site`
-   **Name**: `Admin Iqbal`

## Sample Data

Server akan otomatis membuat sample tax records untuk user default:

1. **SPT-2024-001**: Rp 2.500.000 (Lunas)
2. **SPT-2024-002**: Rp 2.800.000 (Belum Lunas)
3. **SPT-2023-001**: Rp 2.200.000 (Lunas)

**Total**: Rp 7.500.000
**Lunas**: Rp 4.700.000
**Belum Lunas**: Rp 2.800.000

## Testing

### Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"iqbaldev.site@gmail.com","password":"iqbaldev.site"}'
```

### Test Statistics

```bash
curl -X GET http://localhost:8000/api/tax-records/statistics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### MongoDB Connection Error

-   Pastikan kredensial MongoDB benar
-   Periksa koneksi internet ke server MongoDB
-   Periksa connection string di `.env`

### JWT Token Error

-   Periksa JWT_SECRET di `.env`
-   Pastikan token tidak expired

### CORS Error

-   CORS sudah dikonfigurasi untuk development
-   Untuk production, sesuaikan origin di `cors()`

## Development

### Logs

Server akan menampilkan log untuk setiap request dan error.

### Hot Reload

Gunakan `npm run dev` untuk development dengan nodemon.

### Database

Data tersimpan di MongoDB database `relajak` pada server remote.

### Development structure

-   `src/server.js` server bootstrap (start HTTP, DB connect, seed)
-   `src/app.js` Express app, middleware, routes
-   `src/config/` env, db
-   `src/models/` Mongoose models
-   `src/controllers/` route handlers
-   `src/routes/` route definitions
-   `src/middlewares/` auth + error handler
-   `src/utils/seed.js` seeding data
