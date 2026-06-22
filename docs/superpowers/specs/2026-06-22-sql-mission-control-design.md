# SQL Mission Control — Design Spec

**Date:** 2026-06-22  
**Status:** Approved  
**Project:** Portfolio — new page feature

---

## 0. Ringkasan

SQL Mission Control adalah web game latihan SQL bertema cyberpunk/terminal yang diintegrasikan ke dalam portofolio sebagai halaman baru (`/sql-mission-control`). User mendapat "mission" (tantangan SQL), menulis query di editor, menjalankannya ke database SQLite yang berjalan **sepenuhnya di dalam browser** (sql.js/WASM), lalu hasilnya divalidasi otomatis terhadap `solutionQuery` yang disimpan di backend.

**Tujuan:** Portfolio piece yang clean, fully client-side untuk eksekusi SQL, bisa diakses dari navbar portofolio dan section Projects.

---

## 1. Keputusan Desain (Confirmed)

| Keputusan | Pilihan |
|---|---|
| Warna | Hybrid: base `#0a0a0a` (sama dengan portofolio) + neon accents (hijau/cyan/magenta) eksklusif di dalam game |
| Akses dari portofolio | Navbar item "SQL Lab" + project card di section Projects |
| Missions | Admin-managed via dashboard (`/binn/sql-game`) |
| Bahasa | JSX (konsisten dengan codebase existing) |
| Datasets | Admin-managed: import UCI, fetch URL, upload CSV/JSON |
| SQL execution | sql.js (SQLite WASM), full client-side, no backend |

---

## 2. Tech Stack

Menggunakan stack existing portofolio, tambahan:

| Tambahan | Pilihan | Alasan |
|---|---|---|
| SQL Editor | `@uiw/react-codemirror` + `@codemirror/lang-sql` | Line numbers + syntax highlight |
| SQL Engine | `sql.js` (SQLite WASM) | Client-side, sandboxed, no injection risk |
| State | `zustand` (install baru) | Simpel, tidak perlu tambah Redux/Context |
| Unit test | `vitest` (install baru) | Sudah kompatibel dengan Vite, zero config |
| Drag reorder | `@dnd-kit/core` + `@dnd-kit/sortable` | Reorder missions di admin |

`sql-wasm.wasm` disalin ke `frontend/public/` via postinstall script atau secara manual dari `node_modules/sql.js/dist/`. Init sekali saat dataset dipilih, simpan instance di Zustand store.

---

## 3. Desain Sistem Warna

Base tetap identik dengan portofolio (`#0a0a0a`). Neon accents hanya muncul di dalam `/sql-mission-control`:

```js
// Warna existing portofolio (tidak diubah)
background:  '#0a0a0a'
surface:     '#111111'
surface-2:   '#1a1a1a'
border:      '#2a2a2a'
accent:      '#fafaf9'
accent-muted:'#a8a29e'

// Tambahan khusus SQL game (extend tailwind.config.js)
'sql-primary':   '#00FF41'  // matrix green — aksi utama, sukses
'sql-secondary': '#00E5FF'  // cyan — info, RUN button
'sql-tertiary':  '#FF00E5'  // magenta — table pills, hint
'sql-dim':       '#6B7280'  // komentar, teks sekunder
```

Font: tetap Inter + Playfair Display dari portofolio. Tambah `JetBrains Mono` (Google Fonts) khusus untuk editor, output terminal, dan label game.

---

## 4. Arsitektur Keseluruhan

```
┌─────────────────────────────────────────────┐
│  FRONTEND (React + Vite, existing)           │
│                                              │
│  /sql-mission-control  ← game page           │
│  Navbar (+ "SQL Lab" item)                   │
│  Projects section (+ SQL MC card)           │
│                                              │
│  sql.js (SQLite WASM, in-browser)            │
│  Zustand store (db instance, game state)    │
└───────────────────┬─────────────────────────┘
                    │ GET /api/sql-game/config
                    │ (active datasets + missions)
                    ▼
┌─────────────────────────────────────────────┐
│  BACKEND (Laravel, existing)                │
│                                              │
│  sql_datasets   — schema_sql, seed_sql       │
│  sql_missions   — briefing, objectives,      │
│                   solutionQuery per dataset  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  ADMIN (/binn/sql-game)                     │
│                                              │
│  /datasets  — import UCI / URL / upload     │
│  /missions  — CRUD missions per dataset     │
└─────────────────────────────────────────────┘
```

**Alur kerja game:**
1. User buka `/sql-mission-control` → fetch `GET /api/sql-game/config`
2. Jika active datasets > 1 → tampilkan "Select Database" screen
3. User pilih dataset → `useDatabase` init sql.js dengan `schema_sql` + `seed_sql`
4. User nulis query → **RUN** (sandbox saja) / **DEPLOY** (validasi vs `solutionQuery`)
5. Progress disimpan di Zustand in-memory (reset on reload — cukup untuk showcase)

---

## 5. Database Schema (Laravel — tabel baru)

```sql
-- Dataset: sumber data yang bisa dipilih user sebagai "dunia latihan"
CREATE TABLE sql_datasets (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  source      ENUM('uci','url','upload') NOT NULL,
  source_ref  VARCHAR(500),          -- URL atau UCI dataset id
  schema_sql  LONGTEXT NOT NULL,     -- DDL (CREATE TABLE ...)
  seed_sql    LONGTEXT NOT NULL,     -- INSERT statements
  is_active   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
);

-- Mission: satu soal SQL yang terikat ke satu dataset
CREATE TABLE sql_missions (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  dataset_id     BIGINT NOT NULL REFERENCES sql_datasets(id),
  stage_order    INT NOT NULL,
  title          VARCHAR(255) NOT NULL,
  briefing       TEXT NOT NULL,
  tables         JSON NOT NULL,      -- ["instruktur", "kursus", ...]
  objectives     JSON NOT NULL,      -- [{"col":"nama","desc":"..."}]
  ordering_hint  VARCHAR(500),
  ordered        BOOLEAN DEFAULT FALSE,
  starter_sql    TEXT,
  solution_query TEXT NOT NULL,
  rank_unlock    VARCHAR(100),
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP
);
```

---

## 6. API Endpoints (Backend)

```
# Public (game, no auth)
GET  /api/sql-game/config
     → { datasets: [...active], missions: [...active per dataset] }

# Admin (semua di bawah auth middleware existing)
GET    /api/admin/sql-game/datasets
POST   /api/admin/sql-game/datasets
PUT    /api/admin/sql-game/datasets/:id
DELETE /api/admin/sql-game/datasets/:id
PATCH  /api/admin/sql-game/datasets/:id/toggle    → toggle is_active

POST   /api/admin/sql-game/datasets/fetch-uci
       body: { uci_id: 53 }
       → Laravel download ZIP dari archive.ics.uci.edu/static/public/{id}/
         parse → auto-generate schema_sql + seed_sql → return preview

POST   /api/admin/sql-game/datasets/fetch-url
       body: { url: "https://..." }
       → Laravel fetch CSV/JSON → parse → return preview schema+seed

GET    /api/admin/sql-game/missions
POST   /api/admin/sql-game/missions
PUT    /api/admin/sql-game/missions/:id
DELETE /api/admin/sql-game/missions/:id
```

UCI API yang dipakai Laravel (public, no auth):
- `GET https://archive.ics.uci.edu/api/datasets/list` → 400+ dataset list
- `GET https://archive.ics.uci.edu/api/dataset?id={id}` → metadata + download URL
- `GET https://archive.ics.uci.edu/static/public/{id}/{file}.zip` → download

---

## 7. Admin Panel Structure (`/binn/sql-game`)

Entry baru di sidebar admin existing. Dua sub-halaman:

### `/binn/sql-game/datasets`

```
[🔍 Browse UCI]  [🔗 Fetch from URL]  [📁 Upload CSV/JSON]

● Iris Dataset (UCI #53)        [ON]  [Edit] [Del]
● Data Kursus Online (upload)   [ON]  [Edit] [Del]
○ Titanic (UCI #27)             [OFF] [Edit] [Del]
```

- **Browse UCI** → modal: search field → list hasil dari UCI `/api/datasets/list` → pilih → konfirmasi → backend fetch + parse (best-effort: UCI memakai format `.data` tanpa header, Laravel coba parse dari file `*.names` untuk nama kolom) → **selalu tampilkan preview schema+seed yang fully editable** sebelum save, karena auto-parse tidak selalu sempurna
- **Fetch from URL** → modal: input URL → backend fetch → preview → edit → save
- **Upload** → form upload file CSV/JSON → parse di backend → preview → edit → save
- Edit dataset → dua textarea (Schema SQL + Seed SQL) yang fully editable

### `/binn/sql-game/missions`

```
Filter dataset: [Iris Dataset ▼]          [+ New Mission]

Stage 1  "Manifest Kursus"      ● Active   [Edit] [Del]
Stage 2  "Scorecard"            ● Active   [Edit] [Del]
Stage 3  "Duo Kursus"           ● Active   [Edit] [Del]
[drag handle untuk reorder]
```

Form mission:
- Judul, dataset (dropdown), stage order
- Briefing (textarea)
- Tables: tag input → jadi pill magenta di game
- Objectives: dynamic row list `[kolom] [deskripsi]`
- Ordering hint (teks magenta di sidebar game)
- Checkbox `ordered` (apakah urutan baris diuji)
- Starter SQL (textarea)
- Solution Query (textarea) + tombol **"Test Query"** — jalankan ke sql.js di browser untuk verifikasi sebelum save
- Rank Unlock (text input)

---

## 8. Frontend Game Page

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR (existing, + "SQL Lab" item neon kanan)         │
├──────────────┬──────────────────────────────────────────┤
│              │  [██████████░░░░░░░] progress bar hijau  │
│   SIDEBAR    │  ┌─ SQL COMMAND LINE ─────────────────┐  │
│              │  │  CodeMirror editor                  │  │
│  UserCard    │  └────────────────────────────────────┘  │
│  Mission     │  Characters: N / CPU: Normal  [RUN][DEPLOY]│
│  Briefing    │  ┌─ TERMINAL OUTPUT ──────────────────┐  │
│  Objectives  │  │  ResultGrid / EmptyState            │  │
│  TablePills  │  └────────────────────────────────────┘  │
├──────────────┴──────────────────────────────────────────┤
│  SYSTEM VERSION 1.0.8-BIT          [PREVIOUS] [NEXT STAGE]│
└─────────────────────────────────────────────────────────┘
```

### Struktur file

```
src/pages/SqlMissionControl.jsx        ← entry: fetch config, init

src/components/sql-game/
  GameShell.jsx                        ← layout 3-kolom
  DatabaseSelector.jsx                 ← screen pilih dataset (jika >1 aktif)
  ProgressBar.jsx                      ← bar neon tipis

  sidebar/
    UserCard.jsx                       ← rank + nama user
    MissionBriefing.jsx                ← judul + teks dalam kutip
    ObjectivesList.jsx                 ← checkboxes (auto-centang dari deploy)
    TablePills.jsx                     ← tag magenta nama tabel

  editor/
    SqlEditor.jsx                      ← CodeMirror 6
    EditorToolbar.jsx                  ← char count + RUN + DEPLOY

  output/
    TerminalOutput.jsx                 ← container panel output
    ResultGrid.jsx                     ← tabel hasil query
    EmptyState.jsx                     ← "AWAITING INSTRUCTIONS."

  StageFooter.jsx                      ← PREV + NEXT STAGE
  ui/
    Button.jsx                         ← varian: primary|secondary|outlined|inverted
    TablePill.jsx                      ← tag pill magenta

src/engine/
  runQuery.js                          ← eksekusi ke sql.js instance
  compareResults.js                    ← validasi: kolom, baris, NULL, float
  compareResults.test.js               ← unit tests Vitest

src/hooks/
  useDatabase.js                       ← init sql.js, re-init per dataset switch
  useSqlGame.js                        ← run query, deploy, advance stage

src/store/
  useSqlGameStore.js                   ← Zustand store
```

### Zustand Store Shape

```js
{
  // dari API
  datasets: [],           // semua active datasets
  missions: [],           // semua active missions

  // session
  selectedDataset: null,  // dataset yang sedang aktif
  db: null,               // sql.js Database instance
  currentMissionId: null,
  solvedMissions: [],     // [id, id, ...] — in-memory
  rank: 'Script Kiddie',
  lastResult: null,       // { columns, rows } | { error: string }
  queryText: '',
  isLoading: true,
  isInitializingDb: false,
}
```

---

## 9. Engine: `compareResults`

```js
// src/engine/compareResults.js
compareResults(userResult, expectedResult, { ordered })
// → { pass: boolean, diffs: string[] }
```

Aturan validasi:
- **Kolom**: cocokkan nama kolom case-insensitive. Kolom dari `objectives` harus ada → nyentang checkbox
- **Baris ordered: true** → bandingkan baris per baris berurutan
- **Baris ordered: false** → sort kedua sisi secara kanonik (JSON.stringify tiap row setelah normalize), baru bandingkan sebagai set
- **NULL**: `null === null` (bukan `null == 0` atau `null == ""`)
- **Angka**: coerce string ke number sebelum compare (`"3" == 3`)
- **Float**: `Math.round(val * 100) / 100` untuk keduanya sebelum compare
- **Diffs**: hanya lapor "baris ke-N berbeda" atau "kolom X tidak ditemukan" — **tidak bocorkan nilai benar**

Unit tests wajib cover: ordered match, ordered mismatch, unordered match, unordered mismatch, NULL handling, float tolerance, missing column, extra column.

---

## 10. Perubahan Navigasi

### Navbar (`/frontend/src/components/layout/Navbar.jsx`)

Tambah item "SQL Lab" paling kanan, dengan styling berbeda:
- Border tipis warna `#00FF41` dengan subtle glow
- `onClick`: `navigate('/sql-mission-control')` via React Router
- Tidak scroll ke section — ini buka halaman baru
- Di mobile: masuk ke dalam hamburger menu

### Projects Section

Tambah card SQL Mission Control di antara project cards existing:
- Border `#00FF41` dengan box-shadow glow tipis
- Badge "Interactive" kecil di sudut
- Tech tags: `SQL`, `React`, `WebAssembly`, `sql.js`
- Tombol "Play →" → `navigate('/sql-mission-control')`

---

## 11. Dataset Sources

| Sumber | Status | Implementasi |
|---|---|---|
| UCI ML Repository | ✅ Public API, no auth | Built-in browser di admin. API: `archive.ics.uci.edu/api/*` |
| URL (data.go.id, GitHub raw, dll) | ✅ Server-side fetch | Admin paste URL → Laravel fetch (bypass CORS) → parse |
| Upload CSV/JSON | ✅ Always works | Standard file upload di admin |
| BPS (webapi.bps.go.id) | ⚠️ Butuh API key | Bisa via URL fetch jika key di-append ke URL |
| Kaggle | ⚠️ Butuh API key | Bisa via URL fetch jika kaggle API URL digunakan |

---

## 12. Contoh Missions Awal (seed data admin)

4 missions dari brief asli, semua untuk dataset "Data Kursus Online" (schema + seed custom):

| Stage | Judul | Konsep | `ordered` |
|---|---|---|---|
| 1 | Manifest Kursus | INNER JOIN | false |
| 2 | Scorecard Instruktur | LEFT JOIN + agregasi + subquery anti fan-out | true |
| 3 | Duo Kursus | Self-join / CROSS JOIN | false |
| 4 | Mahasiswa Rajin | GROUP BY + HAVING | true |

Rank progression: `Script Kiddie` → `Query Runner` → `Join Master` → `Index Wizard`

---

## 13. Acceptance Criteria

- [ ] Tampilan `/sql-mission-control` cocok dengan layout brief: nav, sidebar, editor, output, footer
- [ ] Warna: base `#0a0a0a` + neon accents hanya di dalam game page
- [ ] Font: JetBrains Mono untuk editor/output/label game
- [ ] sql.js full client-side; query error hanya tampilkan pesan, app tidak crash
- [ ] RUN → tampilkan grid hasil; DEPLOY → validasi vs `solutionQuery`
- [ ] Validasi handle: LEFT JOIN (NULL ≠ 0), ORDER BY (ordered missions), set comparison (non-ordered)
- [ ] `compareResults` punya unit tests lulus (Vitest)
- [ ] Solve stage N → unlock NEXT STAGE → rank naik
- [ ] Admin dapat import dataset via UCI browser, URL fetch, dan upload
- [ ] Admin dapat toggle dataset ON/OFF → langsung reflected di game
- [ ] Admin dapat CRUD missions, reorder, test solution query
- [ ] Navbar portofolio punya item "SQL Lab" dengan styling neon
- [ ] Section Projects punya card SQL Mission Control dengan tombol "Play →"
- [ ] `npm run build` sukses, output static deployable

---

## 14. Urutan Build (Milestones)

1. **Backend**: migrasi tabel, models, endpoints, admin pages (datasets + missions)
2. **Scaffold game page**: layout shell statik, warna + font, komponen UI dasar
3. **DB layer**: init sql.js, load schema+seed dari API, sanity check di console
4. **Editor + RUN**: CodeMirror, tombol RUN → ResultGrid + error handling
5. **Engine + DEPLOY**: `compareResults` + unit tests, validasi, animasi sukses, unlock
6. **Mission system**: navigasi PREV/NEXT, progress bar, rank, dataset selector
7. **Navigation**: navbar item + project card
8. **Polish**: glow/neon effects, empty states, responsive (desktop-first)
