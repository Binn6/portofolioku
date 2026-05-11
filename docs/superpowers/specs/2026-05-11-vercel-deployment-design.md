# Deployment Design — Portfolio ke Production (Gratis)

**Date:** 2026-05-11  
**Status:** Approved

---

## Ringkasan

Deploy portfolio fullstack (Laravel API + React/Vite) ke production secara gratis menggunakan Vercel (frontend), Render.com (backend PHP), MongoDB Atlas (database, sudah ada), dan Cloudinary (file storage). Domain menggunakan `binn.is-a.dev` via layanan is-a-dev gratis.

---

## Arsitektur

```
binn.is-a.dev  ──→  Vercel (React/Vite Frontend)
                         │
                    VITE_API_BASE_URL
                         │
               <name>.onrender.com (Laravel API)
                    /              \
             MongoDB Atlas       Cloudinary
             (database)          (foto, CV, gambar)
```

### Platform & Biaya

| Komponen | Platform | Biaya |
|---|---|---|
| Frontend (React/Vite) | Vercel | Gratis |
| Backend (Laravel/PHP 8.2) | Render.com (Docker) | Gratis |
| Database | MongoDB Atlas | Gratis |
| File Storage | Cloudinary | Gratis (25GB) |
| Domain | is-a.dev (`binn.is-a.dev`) | Gratis |

---

## Perubahan Kode

### 1. Backend — Dockerfile

Buat `backend/Dockerfile` dengan:
- Base image: `php:8.2-fpm`
- Install ekstensi: `mongodb`, `pdo`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`
- Install Composer
- Install Nginx sebagai web server
- Copy kode, jalankan `composer install --no-dev --optimize-autoloader`
- Expose port 10000 (default Render)
- Entrypoint: jalankan Nginx + PHP-FPM

### 2. Backend — Cloudinary Integration

Install package: `cloudinary/cloudinary_php` via Composer.

Buat `CloudinaryService` helper class untuk upload/delete file.

Refactor 4 controller yang saat ini memakai `Storage::disk('local')`:
- `AdminProfileController@updatePhoto` — upload foto profil
- `AdminCvController@update` — upload file CV
- `AdminProjectController@store/update` — upload gambar proyek
- `AdminCertificateController@store/update` — upload gambar sertifikat

Setiap upload: simpan URL Cloudinary ke MongoDB (bukan path lokal). Setiap update: hapus file lama di Cloudinary sebelum upload baru.

### 3. Backend — CORS

Update `config/cors.php`:
- `allowed_origins`: tambah `https://binn.is-a.dev` dan `https://<name>.onrender.com`
- Pertahankan `localhost` untuk development

### 4. Backend — Environment Variables di Render

Set via Render dashboard:
```
APP_NAME=Portfolio
APP_ENV=production
APP_KEY=<generate>
APP_DEBUG=false
APP_URL=https://<name>.onrender.com

DB_CONNECTION=mongodb
MONGODB_URI=<atlas-uri>
DB_DATABASE=portofolio

SESSION_DRIVER=array
CACHE_STORE=array
QUEUE_CONNECTION=sync

CLOUDINARY_URL=<cloudinary-url>
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

FRONTEND_URL=https://binn.is-a.dev
SANCTUM_STATEFUL_DOMAINS=binn.is-a.dev
```

### 5. Frontend — vercel.json

Buat `frontend/vercel.json` untuk SPA routing agar React Router bekerja:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 6. Frontend — Environment Variable di Vercel

Set di Vercel dashboard:
```
VITE_API_BASE_URL=https://<name>.onrender.com
```

### 7. DNS — is-a.dev

PR ke repo `is-a-dev/register` dengan file `domains/binn.json`:
```json
{
  "owner": {
    "username": "Binn6",
    "email": "mochsabilabyan12@gmail.com"
  },
  "record": {
    "CNAME": "cname.vercel-dns.com."
  }
}
```

Setelah PR merged, tambah domain `binn.is-a.dev` di Vercel dashboard.

---

## Alur Deploy

1. Push ke GitHub `main` → Vercel otomatis build & deploy frontend
2. Push ke GitHub `main` → Render otomatis build Docker image & deploy backend
3. Perubahan env vars → restart manual di masing-masing dashboard

---

## Urutan Implementasi

1. Daftar Cloudinary → dapatkan API credentials
2. Tambah Cloudinary SDK ke backend, buat `CloudinaryService`, refactor 4 controller upload
3. Update `cors.php`
4. Buat `Dockerfile` untuk backend
5. Buat `vercel.json` untuk frontend
6. Deploy backend ke Render → dapatkan URL
7. Deploy frontend ke Vercel → set env var `VITE_API_BASE_URL`
8. PR ke is-a-dev/register → tambah domain di Vercel setelah merged

---

## Catatan Penting

- **Render free tier**: service akan "sleep" setelah 15 menit tidak ada request. Request pertama setelah idle membutuhkan ~30 detik cold start. Ini normal untuk free tier.
- **Cloudinary**: URL file yang sudah disimpan di MongoDB tidak perlu diubah — Cloudinary URL langsung bisa diakses publik.
- **File lama di local disk**: tidak perlu dimigrasikan, karena portfolio baru akan re-upload asset lewat admin panel setelah deploy.
