# Vercel Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy portfolio fullstack (Laravel API + React/Vite) ke production gratis menggunakan Vercel, Render.com, Cloudinary, dan domain binn.is-a.dev.

**Architecture:** Frontend React/Vite di Vercel (auto-deploy dari GitHub), backend Laravel di Render.com via Docker (port 10000), file uploads disimpan di Cloudinary (bukan local disk), database MongoDB Atlas sudah ada.

**Tech Stack:** PHP 8.2, Laravel 11, MongoDB, Cloudinary PHP SDK v2, Nginx, Docker, React/Vite, Vercel, Render.com

---

## File Map

| File | Action | Deskripsi |
|---|---|---|
| `backend/composer.json` | Modify | Tambah `cloudinary/cloudinary_php` |
| `backend/config/services.php` | Modify | Tambah Cloudinary config block |
| `backend/.env.example` | Modify | Tambah CLOUDINARY_* vars |
| `backend/app/Services/CloudinaryService.php` | Create | Upload/delete ke Cloudinary |
| `backend/app/Models/Profile.php` | Modify | Tambah `photo_public_id`, `cv_public_id` ke fillable |
| `backend/app/Models/Project.php` | Modify | Tambah `thumbnail_public_id` ke fillable |
| `backend/app/Models/Certificate.php` | Modify | Tambah `file_public_id` ke fillable |
| `backend/app/Http/Controllers/Api/Admin/AdminProfileController.php` | Modify | Cloudinary photo upload, fix URL generation |
| `backend/app/Http/Controllers/Api/Admin/AdminCvController.php` | Modify | Cloudinary CV upload (raw) |
| `backend/app/Http/Controllers/Api/Admin/AdminProjectController.php` | Modify | Cloudinary thumbnail upload/delete |
| `backend/app/Http/Controllers/Api/Admin/AdminCertificateController.php` | Modify | Cloudinary file upload/delete |
| `backend/app/Http/Controllers/Api/ProfileController.php` | Modify | Hapus `url('storage/...')` wrapper |
| `backend/app/Http/Controllers/Api/ProjectController.php` | Modify | Hapus `url('storage/...')` wrapper |
| `backend/app/Http/Controllers/Api/CertificateController.php` | Modify | Hapus `url('storage/...')` wrapper |
| `backend/config/cors.php` | Modify | Izinkan Vercel preview URLs |
| `backend/Dockerfile` | Create | PHP 8.2-fpm + Nginx, expose 10000 |
| `backend/docker/nginx.conf` | Create | Nginx config untuk Laravel |
| `backend/docker/entrypoint.sh` | Create | Start PHP-FPM + Nginx |
| `backend/.dockerignore` | Create | Exclude vendor, node_modules, .env |
| `frontend/vercel.json` | Create | SPA routing rewrites |

---

## PREREQUISITE: Daftar Cloudinary (lakukan sekarang, sebelum Task 1)

1. Buka [cloudinary.com](https://cloudinary.com) → Sign Up gratis
2. Setelah masuk, buka **Dashboard** → salin:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Tambahkan ke file `backend/.env` lokal:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## Task 1: Install Cloudinary SDK dan tambah config

**Files:**
- Modify: `backend/composer.json`
- Modify: `backend/config/services.php`
- Modify: `backend/.env.example`

- [ ] **Step 1: Install Cloudinary PHP SDK**

Jalankan di folder `backend/`:
```bash
composer require cloudinary/cloudinary_php
```
Expected output: `cloudinary/cloudinary_php v2.x.x` berhasil diinstall.

- [ ] **Step 2: Tambah Cloudinary ke config/services.php**

Buka `backend/config/services.php`, tambah sebelum penutup `];`:
```php
    'cloudinary' => [
        'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
        'api_key'    => env('CLOUDINARY_API_KEY'),
        'api_secret' => env('CLOUDINARY_API_SECRET'),
    ],
```

- [ ] **Step 3: Update .env.example**

Tambah di akhir file `backend/.env.example`:
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

- [ ] **Step 4: Commit**
```bash
git add backend/composer.json backend/composer.lock backend/config/services.php backend/.env.example
git commit -m "feat: add cloudinary php sdk and config"
```

---

## Task 2: Buat CloudinaryService

**Files:**
- Create: `backend/app/Services/CloudinaryService.php`

- [ ] **Step 1: Buat file CloudinaryService**

Buat file baru `backend/app/Services/CloudinaryService.php`:
```php
<?php
namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;

class CloudinaryService
{
    private Cloudinary $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key'    => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
            'url' => ['secure' => true],
        ]);
    }

    /**
     * Upload file ke Cloudinary.
     * @return array{url: string, public_id: string}
     */
    public function upload(UploadedFile $file, string $folder, string $resourceType = 'image'): array
    {
        $result = $this->cloudinary->uploadApi()->upload(
            $file->getRealPath(),
            ['folder' => $folder, 'resource_type' => $resourceType]
        );

        return [
            'url'       => (string) $result['secure_url'],
            'public_id' => (string) $result['public_id'],
        ];
    }

    /**
     * Hapus file dari Cloudinary by public_id.
     */
    public function delete(string $publicId, string $resourceType = 'image'): void
    {
        if (!$publicId) return;
        $this->cloudinary->uploadApi()->destroy($publicId, ['resource_type' => $resourceType]);
    }
}
```

- [ ] **Step 2: Verifikasi class dapat di-resolve Laravel**

Jalankan di folder `backend/`:
```bash
php artisan tinker --execute="app(\App\Services\CloudinaryService::class);"
```
Expected: tidak ada error (CloudinaryService berhasil di-instantiate).

- [ ] **Step 3: Commit**
```bash
git add backend/app/Services/CloudinaryService.php
git commit -m "feat: add CloudinaryService for upload/delete"
```

---

## Task 3: Update Models — tambah public_id ke fillable

**Files:**
- Modify: `backend/app/Models/Profile.php`
- Modify: `backend/app/Models/Project.php`
- Modify: `backend/app/Models/Certificate.php`

- [ ] **Step 1: Update Profile model**

Edit `backend/app/Models/Profile.php`, ganti isi `$fillable`:
```php
    protected $fillable = [
        'name', 'title', 'bio', 'location', 'email', 'phone',
        'github', 'linkedin', 'instagram',
        'cv_path', 'photo_path',
        'photo_public_id', 'cv_public_id',
    ];
```

- [ ] **Step 2: Update Project model**

Edit `backend/app/Models/Project.php`, ganti isi `$fillable`:
```php
    protected $fillable = [
        'title', 'description', 'tech_stack', 'thumbnail_path',
        'github_url', 'live_url', 'is_featured', 'type',
        'thumbnail_public_id',
    ];
```

- [ ] **Step 3: Update Certificate model**

Edit `backend/app/Models/Certificate.php`, ganti isi `$fillable`:
```php
    protected $fillable = ['title', 'issuer', 'date', 'category', 'file_path', 'file_public_id'];
```

- [ ] **Step 4: Commit**
```bash
git add backend/app/Models/Profile.php backend/app/Models/Project.php backend/app/Models/Certificate.php
git commit -m "feat: add cloudinary public_id fields to models"
```

---

## Task 4: Refactor AdminProfileController

**Files:**
- Modify: `backend/app/Http/Controllers/Api/Admin/AdminProfileController.php`

- [ ] **Step 1: Tulis ulang controller**

Ganti seluruh isi `backend/app/Http/Controllers/Api/Admin/AdminProfileController.php`:
```php
<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class AdminProfileController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    private function withUrls(Profile $profile): Profile
    {
        // photo_path dan cv_path sudah berisi Cloudinary URL langsung
        if ($profile->photo_path) {
            $profile->photo_url = $profile->photo_path;
        }
        if ($profile->cv_path) {
            $profile->cv_url = $profile->cv_path;
        }
        return $profile;
    }

    public function show()
    {
        $profile = Profile::first();
        if ($profile) {
            $profile = $this->withUrls($profile);
        }
        return response()->json($profile);
    }

    public function update(Request $request)
    {
        $input = array_map(
            fn($v) => $v === '' ? null : $v,
            $request->only(['name', 'title', 'bio', 'location', 'email', 'phone', 'github', 'linkedin', 'instagram'])
        );

        $data = validator($input, [
            'name'      => 'sometimes|nullable|string|max:100',
            'title'     => 'sometimes|nullable|string|max:100',
            'bio'       => 'sometimes|nullable|string|max:2000',
            'location'  => 'sometimes|nullable|string|max:100',
            'email'     => 'sometimes|nullable|email',
            'phone'     => 'sometimes|nullable|string|max:20',
            'github'    => 'sometimes|nullable|url|max:255',
            'linkedin'  => 'sometimes|nullable|url|max:255',
            'instagram' => 'sometimes|nullable|url|max:255',
        ])->validate();

        $profile = Profile::first();
        if ($profile) {
            $profile->update($data);
        } else {
            $profile = Profile::create($data);
        }

        return response()->json($this->withUrls($profile));
    }

    public function updatePhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|file|mimes:jpeg,png,webp|max:2048',
        ]);

        $profile = Profile::first() ?? Profile::create([]);

        if ($profile->photo_public_id) {
            $this->cloudinary->delete($profile->photo_public_id);
        }

        $uploaded = $this->cloudinary->upload($request->file('photo'), 'portfolio/profile');

        $profile->photo_path      = $uploaded['url'];
        $profile->photo_public_id = $uploaded['public_id'];
        $profile->save();

        return response()->json(['photo_url' => $uploaded['url']]);
    }
}
```

- [ ] **Step 2: Test endpoint photo upload secara lokal**

Pastikan local `.env` sudah ada `CLOUDINARY_*` vars. Jalankan `php artisan serve` di folder `backend/`, lalu upload foto dari admin panel. Cek response — `photo_url` harus berupa URL `res.cloudinary.com/...`.

- [ ] **Step 3: Commit**
```bash
git add backend/app/Http/Controllers/Api/Admin/AdminProfileController.php
git commit -m "feat: refactor profile photo upload to cloudinary"
```

---

## Task 5: Refactor AdminCvController

**Files:**
- Modify: `backend/app/Http/Controllers/Api/Admin/AdminCvController.php`

- [ ] **Step 1: Tulis ulang controller**

Ganti seluruh isi `backend/app/Http/Controllers/Api/Admin/AdminCvController.php`:
```php
<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class AdminCvController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function update(Request $request)
    {
        $request->validate([
            'cv' => 'required|file|mimes:pdf|max:5120',
        ]);

        $profile = Profile::first();

        if ($profile && $profile->cv_public_id) {
            $this->cloudinary->delete($profile->cv_public_id, 'raw');
        }

        $uploaded = $this->cloudinary->upload($request->file('cv'), 'portfolio/cv', 'raw');

        Profile::updateOrCreate([], [
            'cv_path'      => $uploaded['url'],
            'cv_public_id' => $uploaded['public_id'],
        ]);

        return response()->json(['cv_url' => $uploaded['url']]);
    }
}
```

- [ ] **Step 2: Test upload CV lokal**

Upload CV PDF dari admin panel. Response `cv_url` harus URL Cloudinary.

- [ ] **Step 3: Commit**
```bash
git add backend/app/Http/Controllers/Api/Admin/AdminCvController.php
git commit -m "feat: refactor cv upload to cloudinary"
```

---

## Task 6: Refactor AdminProjectController

**Files:**
- Modify: `backend/app/Http/Controllers/Api/Admin/AdminProjectController.php`

- [ ] **Step 1: Tulis ulang controller**

Ganti seluruh isi `backend/app/Http/Controllers/Api/Admin/AdminProjectController.php`:
```php
<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class AdminProjectController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function index()
    {
        return response()->json(Project::all()->map(fn($p) => $this->withUrl($p)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:200',
            'description' => 'required|string',
            'tech_stack'  => 'required|array',
            'thumbnail'   => 'nullable|file|mimes:jpeg,png,webp|max:2048',
            'github_url'  => 'nullable|url',
            'live_url'    => 'nullable|url',
            'is_featured' => 'boolean',
            'type'        => 'nullable|string|max:50',
        ]);

        if ($request->hasFile('thumbnail')) {
            $uploaded = $this->cloudinary->upload($request->file('thumbnail'), 'portfolio/projects');
            $data['thumbnail_path']      = $uploaded['url'];
            $data['thumbnail_public_id'] = $uploaded['public_id'];
        }
        unset($data['thumbnail']);

        return response()->json($this->withUrl(Project::create($data)), 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $data = $request->validate([
            'title'       => 'sometimes|string|max:200',
            'description' => 'sometimes|string',
            'tech_stack'  => 'sometimes|array',
            'thumbnail'   => 'nullable|file|mimes:jpeg,png,webp|max:2048',
            'github_url'  => 'nullable|url',
            'live_url'    => 'nullable|url',
            'is_featured' => 'boolean',
            'type'        => 'nullable|string|max:50',
        ]);

        if ($request->hasFile('thumbnail')) {
            if ($project->thumbnail_public_id) {
                $this->cloudinary->delete($project->thumbnail_public_id);
            }
            $uploaded = $this->cloudinary->upload($request->file('thumbnail'), 'portfolio/projects');
            $data['thumbnail_path']      = $uploaded['url'];
            $data['thumbnail_public_id'] = $uploaded['public_id'];
        }
        unset($data['thumbnail']);

        $project->update($data);
        return response()->json($this->withUrl($project));
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        if ($project->thumbnail_public_id) {
            $this->cloudinary->delete($project->thumbnail_public_id);
        }
        $project->delete();
        return response()->json(null, 204);
    }

    private function withUrl($project)
    {
        if ($project->thumbnail_path) {
            $project->thumbnail_url = $project->thumbnail_path;
        }
        return $project;
    }
}
```

- [ ] **Step 2: Test create/update/delete project dengan thumbnail lokal**

Buat project baru dengan gambar dari admin panel. Cek `thumbnail_url` adalah URL Cloudinary.

- [ ] **Step 3: Commit**
```bash
git add backend/app/Http/Controllers/Api/Admin/AdminProjectController.php
git commit -m "feat: refactor project thumbnail upload to cloudinary"
```

---

## Task 7: Refactor AdminCertificateController

**Files:**
- Modify: `backend/app/Http/Controllers/Api/Admin/AdminCertificateController.php`

- [ ] **Step 1: Tulis ulang controller**

Ganti seluruh isi `backend/app/Http/Controllers/Api/Admin/AdminCertificateController.php`:
```php
<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class AdminCertificateController extends Controller
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function index()
    {
        return response()->json(Certificate::all()->map(fn($c) => $this->withUrl($c)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'    => 'required|string|max:200',
            'issuer'   => 'required|string|max:200',
            'date'     => 'required|string',
            'category' => 'required|in:Web,Data',
            'file'     => 'nullable|file|mimes:jpeg,png,webp,pdf|max:5120',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $resourceType = $file->getMimeType() === 'application/pdf' ? 'raw' : 'image';
            $uploaded = $this->cloudinary->upload($file, 'portfolio/certificates', $resourceType);
            $data['file_path']      = $uploaded['url'];
            $data['file_public_id'] = $uploaded['public_id'];
        }
        unset($data['file']);

        return response()->json($this->withUrl(Certificate::create($data)), 201);
    }

    public function update(Request $request, $id)
    {
        $cert = Certificate::findOrFail($id);
        $data = $request->validate([
            'title'    => 'sometimes|string|max:200',
            'issuer'   => 'sometimes|string|max:200',
            'date'     => 'sometimes|string',
            'category' => 'sometimes|in:Web,Data',
            'file'     => 'nullable|file|mimes:jpeg,png,webp,pdf|max:5120',
        ]);

        if ($request->hasFile('file')) {
            if ($cert->file_public_id) {
                // Cloudinary raw URL berisi "/raw/upload/", image URL berisi "/image/upload/"
                $resourceType = str_contains($cert->file_path ?? '', '/raw/upload/') ? 'raw' : 'image';
                $this->cloudinary->delete($cert->file_public_id, $resourceType);
            }
            $file = $request->file('file');
            $resourceType = $file->getMimeType() === 'application/pdf' ? 'raw' : 'image';
            $uploaded = $this->cloudinary->upload($file, 'portfolio/certificates', $resourceType);
            $data['file_path']      = $uploaded['url'];
            $data['file_public_id'] = $uploaded['public_id'];
        }
        unset($data['file']);

        $cert->update($data);
        return response()->json($this->withUrl($cert));
    }

    public function destroy($id)
    {
        $cert = Certificate::findOrFail($id);
        if ($cert->file_public_id) {
            $resourceType = str_contains($cert->file_path ?? '', '/raw/upload/') ? 'raw' : 'image';
            $this->cloudinary->delete($cert->file_public_id, $resourceType);
        }
        $cert->delete();
        return response()->json(null, 204);
    }

    private function withUrl($cert)
    {
        if ($cert->file_path) {
            $cert->file_url = $cert->file_path;
        }
        return $cert;
    }
}
```

- [ ] **Step 2: Test lokal**

Tambah sertifikat dengan file dari admin panel. Cek `file_url` adalah URL Cloudinary.

- [ ] **Step 3: Commit**
```bash
git add backend/app/Http/Controllers/Api/Admin/AdminCertificateController.php
git commit -m "feat: refactor certificate file upload to cloudinary"
```

---

## Task 8: Fix Public Controllers — hapus url('storage/...') wrapper

**Files:**
- Modify: `backend/app/Http/Controllers/Api/ProfileController.php`
- Modify: `backend/app/Http/Controllers/Api/ProjectController.php`
- Modify: `backend/app/Http/Controllers/Api/CertificateController.php`

- [ ] **Step 1: Update ProfileController**

Ganti seluruh isi `backend/app/Http/Controllers/Api/ProfileController.php`:
```php
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;

class ProfileController extends Controller
{
    public function show()
    {
        $profile = Profile::first();
        if (!$profile) {
            return response()->json(null);
        }

        // photo_path dan cv_path sudah berisi Cloudinary URL langsung
        if ($profile->cv_path) {
            $profile->cv_url = $profile->cv_path;
        }
        if ($profile->photo_path) {
            $profile->photo_url = $profile->photo_path;
        }

        $profile->makeHidden(['cv_path', 'photo_path', 'photo_public_id', 'cv_public_id']);

        return response()->json($profile);
    }
}
```

- [ ] **Step 2: Update ProjectController**

Ganti seluruh isi `backend/app/Http/Controllers/Api/ProjectController.php`:
```php
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::all()->map(function ($p) {
            if ($p->thumbnail_path) {
                $p->thumbnail_url = $p->thumbnail_path;
            }
            return $p;
        });
        return response()->json($projects);
    }
}
```

- [ ] **Step 3: Update CertificateController**

Ganti seluruh isi `backend/app/Http/Controllers/Api/CertificateController.php`:
```php
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;

class CertificateController extends Controller
{
    public function index()
    {
        $certs = Certificate::all()->map(function ($c) {
            if ($c->file_path) {
                $c->file_url = $c->file_path;
            }
            return $c;
        });
        return response()->json($certs);
    }
}
```

- [ ] **Step 4: Commit**
```bash
git add backend/app/Http/Controllers/Api/ProfileController.php backend/app/Http/Controllers/Api/ProjectController.php backend/app/Http/Controllers/Api/CertificateController.php
git commit -m "fix: use cloudinary url directly in public controllers"
```

---

## Task 9: Update CORS Config

**Files:**
- Modify: `backend/config/cors.php`

- [ ] **Step 1: Update cors.php**

Ganti seluruh isi `backend/config/cors.php`:
```php
<?php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3001')],
    'allowed_origins_patterns' => [
        '#^http://localhost:\d+$#',
        '#^http://192\.168\.\d+\.\d+:\d+$#',
        '#^https://[\w-]+\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

Pattern `#^https://[\w-]+\.vercel\.app$#` mengizinkan semua Vercel preview deployments selama testing.

- [ ] **Step 2: Commit**
```bash
git add backend/config/cors.php
git commit -m "fix: allow vercel preview urls in cors"
```

---

## Task 10: Buat Dockerfile dan Docker Config

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/docker/nginx.conf`
- Create: `backend/docker/entrypoint.sh`
- Create: `backend/.dockerignore`

- [ ] **Step 1: Buat .dockerignore**

Buat file `backend/.dockerignore`:
```
vendor/
node_modules/
.env
.env.*
storage/logs/*
storage/framework/cache/*
storage/framework/sessions/*
storage/framework/views/*
*.log
.git
.gitignore
docker/
```

- [ ] **Step 2: Buat docker/nginx.conf**

Buat file `backend/docker/nginx.conf`:
```nginx
server {
    listen 10000;
    server_name _;
    root /var/www/public;
    index index.php;

    client_max_body_size 10M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

- [ ] **Step 3: Buat docker/entrypoint.sh**

Buat file `backend/docker/entrypoint.sh`:
```bash
#!/bin/bash
set -e

cd /var/www

php artisan config:cache
php artisan route:cache

php-fpm -D

exec nginx -g "daemon off;"
```

- [ ] **Step 4: Buat Dockerfile**

Buat file `backend/Dockerfile`:
```dockerfile
FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    nginx \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && docker-php-ext-install mbstring exif bcmath gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Cache layer: install deps dulu sebelum copy kode
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

COPY . .

# Package discovery butuh APP_KEY — generate sementara, akan di-override env var di runtime
RUN cp .env.example .env \
    && php artisan key:generate \
    && php artisan package:discover --ansi \
    && rm .env

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 10000

CMD ["/entrypoint.sh"]
```

- [ ] **Step 5: Build Docker image lokal untuk verifikasi**

Jalankan di folder `backend/`:
```bash
docker build -t portfolio-backend .
```
Expected: build berhasil tanpa error. Jika ada error PHP extension, periksa apt-get deps.

- [ ] **Step 6: Commit**
```bash
git add backend/Dockerfile backend/docker/ backend/.dockerignore
git commit -m "feat: add dockerfile and docker config for render deployment"
```

---

## Task 11: Buat frontend/vercel.json

**Files:**
- Create: `frontend/vercel.json`

- [ ] **Step 1: Buat vercel.json**

Buat file `frontend/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

File ini memastikan React Router bekerja — semua URL di-serve ke `index.html`.

- [ ] **Step 2: Commit dan push**
```bash
git add frontend/vercel.json
git commit -m "feat: add vercel.json for spa routing"
git push origin main
```

---

## Task 12: Generate APP_KEY untuk Production

- [ ] **Step 1: Generate APP_KEY**

Jalankan di folder `backend/`:
```bash
php artisan key:generate --show
```
Output akan seperti: `base64:xxxxx...`

Salin output ini — akan dipakai di Render dashboard sebagai env var `APP_KEY`.

---

## Task 13: Deploy Backend ke Render.com (Manual)

- [ ] **Step 1: Buat akun Render dan connect GitHub**

Buka [render.com](https://render.com) → Sign Up → Connect GitHub account.

- [ ] **Step 2: Buat Web Service baru**

- Klik **New +** → **Web Service**
- Pilih repo GitHub portfolio
- Isi form:
  - **Name:** `portfolio-backend`
  - **Root Directory:** `backend`
  - **Environment:** `Docker`
  - **Instance Type:** `Free`
  - **Branch:** `main`

- [ ] **Step 3: Set Environment Variables di Render**

Di tab **Environment**, tambah semua vars berikut (klik **Add Environment Variable** satu per satu):

```
APP_NAME=Portfolio
APP_ENV=production
APP_KEY=base64:xxx...          ← hasil dari Task 12
APP_DEBUG=false
APP_URL=https://portfolio-backend.onrender.com

DB_CONNECTION=mongodb
MONGODB_URI=mongodb+srv://...  ← URI dari MongoDB Atlas
DB_DATABASE=portofolio

SESSION_DRIVER=array
CACHE_STORE=array
QUEUE_CONNECTION=sync

CLOUDINARY_CLOUD_NAME=...      ← dari dashboard Cloudinary
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

FRONTEND_URL=https://binn.is-a-dev.github.io
SANCTUM_STATEFUL_DOMAINS=binn.is-a.dev
LOG_CHANNEL=stderr
LOG_LEVEL=error
```

> **Catatan:** `FRONTEND_URL` bisa diupdate ke `https://binn.is-a.dev` setelah domain aktif.

- [ ] **Step 4: Deploy**

Klik **Create Web Service**. Render akan pull repo dan build Docker image. Pantau log di tab **Logs**.

Build pertama memakan waktu 5-10 menit karena install PHP extensions dan Composer deps.

- [ ] **Step 5: Verifikasi backend live**

Setelah deploy selesai, buka URL: `https://portfolio-backend.onrender.com/up`

Expected response: `{"status":"up","timestamp":"..."}`

- [ ] **Step 6: Catat URL backend**

Salin URL Render (format: `https://portfolio-backend.onrender.com`). Diperlukan untuk Task 14.

---

## Task 14: Deploy Frontend ke Vercel (Manual)

- [ ] **Step 1: Buka Vercel dan import project**

Buka [vercel.com](https://vercel.com) → Log in dengan GitHub → **Add New Project** → Import repo portfolio.

- [ ] **Step 2: Konfigurasi project**

- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

- [ ] **Step 3: Set Environment Variable**

Di bagian **Environment Variables**, tambah:
```
VITE_API_BASE_URL = https://portfolio-backend.onrender.com
```
(ganti dengan URL Render aktual dari Task 13 Step 6)

- [ ] **Step 4: Deploy**

Klik **Deploy**. Build memakan waktu 1-2 menit.

- [ ] **Step 5: Verifikasi frontend live**

Buka URL Vercel yang diberikan (format: `portfolio-xxx.vercel.app`). Cek apakah halaman portfolio muncul dan data dari API termuat.

- [ ] **Step 6: Update FRONTEND_URL di Render**

Kembali ke Render dashboard → **Environment** → update `FRONTEND_URL` ke URL Vercel aktual → **Save Changes** → Render akan redeploy otomatis.

---

## Task 15: Register Domain binn.is-a.dev (Manual)

- [ ] **Step 1: Fork repo is-a-dev/register**

Buka [github.com/is-a-dev/register](https://github.com/is-a-dev/register) → klik **Fork**.

- [ ] **Step 2: Buat file domain**

Di fork kamu, buat file `domains/binn.json` dengan isi:
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

- [ ] **Step 3: Buat Pull Request**

Buat PR dari fork ke repo `is-a-dev/register`. Title PR: `Add binn.is-a.dev`. Tunggu bot auto-check — jika lolos, PR akan di-merge dalam 1-24 jam.

- [ ] **Step 4: Tambah domain di Vercel (setelah PR merged)**

Setelah PR merged dan DNS propagasi (~5 menit):
- Buka Vercel project → **Settings** → **Domains**
- Ketik `binn.is-a.dev` → **Add**
- Vercel akan auto-verifikasi CNAME dan issue SSL certificate

- [ ] **Step 5: Update FRONTEND_URL di Render**

Di Render dashboard → **Environment**:
```
FRONTEND_URL = https://binn.is-a.dev
SANCTUM_STATEFUL_DOMAINS = binn.is-a.dev
```
Save → Render redeploy otomatis.

- [ ] **Step 6: Verifikasi domain aktif**

Buka `https://binn.is-a.dev` di browser. Portfolio harus muncul dengan HTTPS aktif (gembok hijau).

---

## Checklist Verifikasi Akhir

- [ ] `https://binn.is-a.dev` → portfolio tampil
- [ ] Data profil, proyek, skills, dll muncul (API tersambung)
- [ ] Upload foto di admin panel → URL Cloudinary tersimpan
- [ ] Upload CV → bisa didownload via link Cloudinary
- [ ] Login admin berfungsi (`/binn`)
- [ ] `https://portfolio-backend.onrender.com/up` → `{"status":"up"}`
- [ ] HTTPS aktif di semua domain
