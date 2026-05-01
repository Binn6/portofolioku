# Portfolio Website — Design Spec
**Date:** 2026-04-29  
**Owner:** Mochsabil Em Abyan  
**Status:** Approved

---

## 1. Project Overview

A production-ready personal portfolio website for job applications and freelance opportunities. Built as two fully decoupled projects inside a single git repository: a Laravel 11 REST API backend and a React + Vite frontend. Targets both data analyst and web developer recruiters.

---

## 2. Architecture

### Approach: Full Decoupled SPA (Approach A)

```
portofolio/                   ← git root
├── backend/                  ← Laravel 11 REST API
├── frontend/                 ← React + Vite SPA
├── docs/superpowers/specs/
└── README.md
```

- **Laravel** runs on port `8001`
- **React** runs on port `3001`
- React communicates with Laravel via Axios using `VITE_API_BASE_URL=http://localhost:8001`
- CORS configured in `config/cors.php` to allow `http://localhost:3001`
- Authentication: Laravel Sanctum token stored in `localStorage`, sent as `Authorization: Bearer <token>`

---

## 3. Backend Design (Laravel 11)

### Tech Stack
- PHP 8.2
- Laravel 11
- `mongodb/laravel-mongodb` (official maintained package)
- Laravel Sanctum (API token auth)
- MongoDB Atlas

### MongoDB Connection
- Driver: `mongodb/laravel-mongodb`
- Connection string stored in `.env` as `MONGODB_URI`
- Database name: `portofolio`

### MongoDB Collections
| Collection | Purpose |
|---|---|
| `users` | Admin credentials |
| `profiles` | Owner profile data + CV file path |
| `skills` | Skill list with category + level |
| `projects` | Portfolio projects with images |
| `experiences` | Work/internship/org experience |
| `education` | Education history |
| `certificates` | Certificates with title, issuer, date, category, image/PDF |
| `contacts` | Contact form submissions |

### API Routes

**Public endpoints:**
```
GET  /api/profile         ← includes cv_url field
GET  /api/skills
GET  /api/projects
GET  /api/experiences
GET  /api/education
GET  /api/certificates
POST /api/contact
```

**Admin endpoints (auth:sanctum middleware):**
```
POST /api/auth/login
POST /api/auth/logout

GET  /api/admin/messages

GET|POST|PUT|DELETE  /api/admin/profile
GET|POST|PUT|DELETE  /api/admin/skills/{id?}
GET|POST|PUT|DELETE  /api/admin/projects/{id?}   ← image upload
GET|POST|PUT|DELETE  /api/admin/experiences/{id?}
GET|POST|PUT|DELETE  /api/admin/education/{id?}
GET|POST|PUT|DELETE  /api/admin/certificates/{id?}  ← image/PDF upload
PUT                  /api/admin/cv                   ← upload CV PDF
```

### File Storage
| Type | Storage Path | Public URL | Validation |
|---|---|---|---|
| Project thumbnail | `storage/app/public/projects/` | `/storage/projects/file.webp` | `jpeg,png,webp`, max 2MB |
| Certificate image/PDF | `storage/app/public/certificates/` | `/storage/certificates/file.pdf` | `jpeg,png,webp,pdf`, max 5MB |
| CV/Resume PDF | `storage/app/public/cv/` | `/storage/cv/cv.pdf` | `pdf`, max 5MB |

- Symlink: `php artisan storage:link`

### Folder Structure
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── Auth/AuthController.php
│   │   │   ├── ProfileController.php
│   │   │   ├── SkillController.php
│   │   │   ├── ProjectController.php
│   │   │   ├── ExperienceController.php
│   │   │   ├── EducationController.php
│   │   │   └── ContactController.php
│   │   └── Requests/          ← Form request validation
│   ├── Models/                ← MongoDB Eloquent models
│   └── Services/              ← Business logic layer
├── database/seeders/
└── routes/api.php
```

### Seeders
Pre-seeded data for:
- Admin user (email + hashed password)
- Full profile (name, bio, location, email, phone, social links)
- 14 skills across categories: Languages, Frameworks, Data, Tools, Soft Skills
- 3 projects: Website Alamat Hutan, Website Desa, Thesis project
- 4 experiences: 2 internships (Balai LHK Jan-Feb 2025, Disbudpar Sul-Sel Mar-Jun 2025) + 2 org roles (Ketua Umum MPK 2021-2022, MPK Member 2019-2020)
- 1 education entry: S1 Statistics, Universitas Hasanuddin
- Admin user seeded with: username `abin`, email `mochsabilabyan12@gmail.com`, password `thisme`

---

## 4. Frontend Design (React + Vite)

### Tech Stack
- React 18
- Vite
- Tailwind CSS (custom design tokens)
- GSAP + ScrollTrigger
- Framer Motion
- Axios
- React Router v6
- lucide-react (icons)

### Design System

**Color Tokens:**
```js
// tailwind.config.js
colors: {
  background: '#0a0a0a',
  surface:    '#111111',
  'surface-2':'#1a1a1a',
  border:     '#2a2a2a',
  accent:     '#fafaf9',   // warm white — primary
  'accent-muted': '#a8a29e', // warm gray — body text
  'accent-dim':   '#44403c', // decorative
}
```

**Typography:**
- `Inter` — UI, body, labels (Google Fonts)
- `Playfair Display` — hero name, section headings (creates premium contrast)

**Visual Style:**
- Near-black background
- Glassmorphism cards (`bg-surface/60 backdrop-blur border border-border`)
- Soft warm-white gradients on headings
- Subtle glowing cream accents on hover
- No rainbow colors — strictly monochromatic warm palette

### Routes
```
/          → Portfolio (single-page, anchored sections)
/admin     → Redirects to /admin/login if unauthenticated
/admin/login
/admin/dashboard
/admin/projects
/admin/skills
/admin/experiences
/admin/education
/admin/certificates
/admin/cv
/admin/messages
```

### Splash Screen
A full-screen loading screen shown on initial page load while all API data is fetched. Dismissed once all requests resolve. Implemented as a GSAP-animated overlay:
- Displays name initials or logo mark with a fade+scale entrance
- Thin warm-white progress line animates across the bottom
- Exit: slides up and out revealing the portfolio beneath
- Skipped if data loads in under 300ms (no flash of loading screen)

### Page Sections (single-page portfolio)
0. `SplashScreen` — full-screen loader, dismissed after all API calls resolve
1. `Hero` — name, title, CTA buttons (including Download CV), profile photo
2. `About` — bio paragraph, photo, key facts
3. `Skills` — categorized skill badges with level indicator
4. `Projects` — filterable card grid with thumbnail
5. `Experience` — animated vertical timeline
6. `Education` — education card
7. `Certificates` — certificate cards with category filter (Web / Data), click to view image or download PDF
8. `Contact` — contact form + social links

### Reusable Components

**Animation:**
| Component | Library | Purpose |
|---|---|---|
| `SplashScreen` | GSAP | Full-screen loader, exits with slide-up once data is ready |
| `PageTransition` | Framer Motion | Wraps route pages, fade+slide transition |
| `AnimatedSection` | GSAP ScrollTrigger | Reveals section on scroll enter |
| `RevealText` | GSAP | Word/line split entrance on scroll |
| `ScrollProgressBar` | GSAP | Thin cream bar tracking scroll % at top |
| `MagneticButton` | Vanilla JS + Framer | Cursor-following CTA hover |
| `MotionButton` | Framer Motion | Scale/opacity animated button |
| `AnimatedProjectCard` | Framer Motion | Hover lift + image overlay reveal |

**Layout:**
| Component | Purpose |
|---|---|
| `Container` | Max-width centered wrapper |
| `SectionWrapper` | Vertical padding + anchor ID |
| `SectionTitle` | Heading + decorative underline |
| `GlassCard` | Glassmorphism card base |
| `Navbar` | Fixed top nav with scroll detection |
| `Footer` | Links, socials, copyright |
| `AdminLayout` | Sidebar layout for admin pages |

### Animation Strategy
- **GSAP only:** `SplashScreen` entrance + exit, Hero entrance timeline, ScrollTrigger section reveals, `RevealText` split text, `ScrollProgressBar`
- **Framer Motion only:** Page transitions, card hover states, button micro-interactions, admin sidebar/modal animations, navbar mobile drawer
- **Never mix both in the same component**
- `prefers-reduced-motion` respected: all GSAP timelines check `window.matchMedia('(prefers-reduced-motion: reduce)')`
- Mobile: animations simplified (no parallax, reduced translate distances)

### Folder Structure
```
frontend/
├── src/
│   ├── animations/
│   │   ├── gsap.js            ← GSAP plugin registration + helpers
│   │   └── variants.js        ← Framer Motion reusable variants
│   ├── components/
│   │   ├── animations/        ← AnimatedSection, RevealText, etc.
│   │   ├── layout/            ← Navbar, Footer, Container, etc.
│   │   ├── sections/          ← Hero, About, Skills, Projects, Experience, Education, Certificates, Contact
│   │   ├── admin/             ← AdminLayout, AdminSidebar, etc.
│   │   └── ui/                ← GlassCard, SectionTitle, Buttons
│   ├── pages/
│   │   ├── Portfolio.jsx       ← single page with all sections
│   │   └── admin/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Projects.jsx
│   │       ├── Skills.jsx
│   │       ├── Experiences.jsx
│   │       ├── Education.jsx
│   │       ├── Certificates.jsx
│   │       ├── CV.jsx
│   │       └── Messages.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useApi.js
│   ├── services/
│   │   └── api.js             ← axios instance + all API calls
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── profile.jpg            ← user's profile photo goes here
├── tailwind.config.js
├── vite.config.js
└── .env
```

---

## 5. Admin Dashboard

A minimal, clean dark dashboard for content management. Protected by Sanctum token auth.

**Features:**
- Login page (username or email + password → receives Bearer token)
- Dashboard overview (counts: projects, skills, certificates, unread messages)
- CRUD — Projects: title, description, tech stack tags, thumbnail upload, GitHub URL, live URL, is_featured toggle
- CRUD — Skills: name, category (Languages/Frameworks/Data/Tools/Soft Skills), level (1-5)
- CRUD — Experiences: title, company, type (internship/organization), start_date, end_date, description, is_current
- CRUD — Education: institution, degree, field, start_year, end_year, description
- CRUD — Certificates: title, issuer, date, category (Web/Data), file upload (image or PDF)
- CV Upload: replace the downloadable CV PDF (single file, always named `cv.pdf`)
- View contact messages (read-only inbox, mark as read)
- Logout

**UI:** Admin uses the same design system (dark, warm white) with a collapsible sidebar. Framer Motion for sidebar open/close and page transitions.

---

## 6. Environment Variables

**backend/.env (key entries):**
```
APP_PORT=8001
MONGODB_URI=mongodb+srv://...
DB_DATABASE=portofolio
SANCTUM_STATEFUL_DOMAINS=localhost:3001
FRONTEND_URL=http://localhost:3001
```

**frontend/.env:**
```
VITE_API_BASE_URL=http://localhost:8001
VITE_APP_NAME=Portofolio Mochsabil
```

---

## 7. Out of Scope
- Blog section (explicitly excluded)
- Email notifications (structure prepared, not implemented)
- Multi-admin / roles
- Dockerization / CI-CD
- Dark/light mode toggle (dark only)
