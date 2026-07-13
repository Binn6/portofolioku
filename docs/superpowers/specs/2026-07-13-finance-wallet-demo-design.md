# Finance Wallet Demo — Design Spec

**Date:** 2026-07-13
**Status:** Approved
**Project:** Portfolio — new page feature (showcase n8n/AI automation skill)

---

## 0. Ringkasan

Finance Wallet Demo adalah halaman portofolio baru yang menampilkan otomatisasi pencatatan keuangan berbasis AI (n8n + Telegram Bot API + Gemini + Notion) yang sudah dibangun untuk penggunaan pribadi, sekaligus versi **live interaktif** yang bisa dicoba siapa saja lewat website — tanpa perlu membuka Telegram.

Alih-alih membiarkan publik memicu workflow n8n asli (yang menulis ke Notion pribadi), logic-nya di-**port ulang ke backend Laravel** yang sudah ada, memakai data dummy tersendiri di MongoDB Atlas (koneksi yang sudah dipakai project ini). Bot Telegram asli tetap dipakai, tapi cuma sebagai kanal siaran satu arah ("live feed") ke grup Telegram khusus demo — bukan sebagai mesin eksekusi.

**Tujuan:** Portfolio piece yang membuktikan kemampuan membangun automation AI end-to-end (n8n, prompt engineering Gemini, integrasi Notion/Telegram), aman untuk diakses publik tanpa risiko ke data keuangan pribadi maupun tagihan API yang tak terkendali.

---

## 1. Keputusan Desain (Confirmed)

| Keputusan | Pilihan |
|---|---|
| Engine demo publik | Reimplementasi logic di Laravel + Mongo (bukan re-trigger n8n asli) |
| Data store demo | Koleksi MongoDB baru, terpisah total dari Notion pribadi |
| Model data | Satu wallet **global shared** — semua visitor lihat & kontribusi ke wallet yang sama |
| Reset data | Otomatis harian (00:00 WIB), balik ke saldo/budget/kategori seed awal |
| Scope fitur | **Full parity** dengan workflow asli: transaksi teks, foto struk (Gemini vision), kategori baru, pilih rekening, cek saldo, auto-expand budget saat income, saran realokasi budget |
| Peran Telegram | Bot yang sama, tapi cuma kirim (`sendMessage`) satu arah ke grup demo (`t.me/+JfrV0lq3Yl5mZDQ9`) sebagai live feed. Tidak pernah dengarkan input dari grup itu |
| Proteksi workflow asli | Tambah filter node di `Telegram Trigger` n8n: skip semua update yang `chat.id`-nya bukan chat pribadi owner |
| Kontrol biaya Gemini | Rate-limit per-IP + kuota harian global, dengan fallback message kalau kuota habis |
| Halaman | Route publik baru + project card baru di section Projects (pola sama seperti SQL Mission Control) |

---

## 2. Keamanan & Kredensial (kritis — baca dulu)

Tiga kredensial live sempat ter-paste di percakapan desain ini (Notion integration token, Telegram bot token, Gemini API key). Dua di antaranya (Telegram bot token, Gemini key) juga sempat ter-hardcode plaintext di `n8n/Finance Wallet V.1.json`.

**Prasyarat sebelum implementasi/deploy dimulai:**
1. User me-rotate/regenerate ketiga kredensial tersebut (Telegram via @BotFather `/revoke` lalu `/token`, Gemini via Google AI Studio, Notion via integration settings) — kredensial lama dianggap bocor terlepas dari langkah lain.
2. Kredensial baru hanya disimpan di `backend/.env` (sudah ter-`.gitignore`), tidak pernah di frontend, tidak pernah hardcode di kode atau file JSON yang masuk git.
3. `n8n/Finance Wallet V.1.json` yang akan ditaruh di repo untuk keperluan showcase (download di halaman) harus melalui proses "sanitasi": semua nilai token/key di dalam node (`x-goog-api-key`, URL `api.telegram.org/bot<token>/...`, catatan token di `notes`) diganti jadi placeholder/referensi credential, meniru pola node Notion yang sudah pakai `credentials` reference alih-alih key mentah.

Env var baru yang dibutuhkan di `backend/.env` (dan `.env.example`, tanpa nilai asli):
```
FINANCE_DEMO_TELEGRAM_BOT_TOKEN=
FINANCE_DEMO_TELEGRAM_GROUP_CHAT_ID=
FINANCE_DEMO_GEMINI_API_KEY=
FINANCE_DEMO_GEMINI_DAILY_QUOTA=300
```

---

## 3. Tech Stack

Seluruhnya memakai stack existing, tidak ada dependency besar baru:

| Layer | Pilihan | Alasan |
|---|---|---|
| Data | MongoDB Atlas (koneksi `mongodb` yang sudah ada) via `MongoDB\Laravel\Eloquent\Model` | Sudah dipakai model lain (`ChatMessage`, `Project`, dll), tidak perlu infra baru |
| AI klasifikasi & OCR struk | Gemini API (`gemini-flash-latest`), HTTP call langsung dari Laravel (Laravel `Http` facade) | Port langsung dari prompt yang sudah terbukti jalan di n8n workflow |
| Notifikasi live feed | Telegram Bot API (`sendMessage`, `sendPhoto` opsional) via `Http` facade | Bot yang sama, dipakai searah saja |
| Live update tabel | Polling `GET /api/finance-wallet/state` tiap ~5 detik dari frontend | Stack ini belum ada broadcast/websocket (`BROADCAST_CONNECTION=log`); polling paling murah untuk skala portofolio, tanpa infra tambahan |
| Reset terjadwal | Laravel scheduled command (`artisan schedule:run`) | Perlu dicek di tahap implementasi: Render free plan tidak menjalankan cron Laravel terus-menerus → kemungkinan pakai Render Cron Job terpisah yang hit endpoint admin ber-auth, atau lazy-reset saat request pertama melewati tengah malam |
| Frontend page | React (Vite), pola sama seperti `SqlMissionControl.jsx` | Konsisten dengan project showcase sebelumnya di repo ini |

---

## 4. Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (React, existing Vite app)                      │
│                                                            │
│  /finance-wallet  ← halaman baru (case study + demo)      │
│  - Chat widget (teks + upload foto struk)                 │
│  - Tombol konfirmasi inline (rekening/kategori/realokasi) │
│  - Tabel live: saldo, budget, riwayat transaksi           │
│  - Polling GET /state tiap 5 detik                        │
└───────────────────────┬────────────────────────────────────┘
                         │ REST (throttled)
┌───────────────────────▼────────────────────────────────────┐
│ BACKEND (Laravel, existing)                                │
│                                                              │
│  FinanceWalletController                                    │
│    POST /message   → klasifikasi teks (Gemini)              │
│    POST /photo     → OCR struk (Gemini vision)               │
│    POST /confirm    → eksekusi pending action                │
│    GET  /state      → snapshot saldo+budget+transaksi        │
│                                                              │
│  FinanceWalletService                                       │
│    - prompt klasifikasi teks (port dari n8n)                 │
│    - prompt OCR struk (port dari n8n)                        │
│    - business logic: threshold budget, ekspansi income,      │
│      saran realokasi                                        │
│    - kuota harian Gemini (cache-based counter)                │
│    - relay ke Telegram (sendMessage, satu arah)               │
└───────────────────────┬────────────────────┬────────────────┘
                         │                    │
              ┌──────────▼──────────┐   ┌─────▼─────────────┐
              │ MongoDB Atlas        │   │ Telegram Bot API   │
              │ - finance_accounts   │   │ (sendMessage only, │
              │ - finance_budgets    │   │  ke grup demo)     │
              │ - finance_transactions│  └────────────────────┘
              │ - finance_pending    │
              └──────────────────────┘
              ┌──────────────────────┐
              │ Gemini API            │
              │ (classify + OCR)      │
              └──────────────────────┘

──────────────────────────────────────────────────────────────
Terpisah & tidak terhubung ke atas:
n8n workflow asli (Telegram Trigger + Notion) → tetap jalan untuk
penggunaan pribadi, ditambah filter chat.id sebagai safeguard.
```

---

## 5. Model Data (MongoDB)

Mengikuti pola `ChatMessage` (koneksi `mongodb`, satu collection per model).

**`finance_accounts`** (pengganti "Saldo" Notion)
```
nama          string   // Mandiri, BSI, Jago, Dana, Gopay, OVO
saldo_awal    number
saldo_sekarang number
updated_at    datetime
```

**`finance_budgets`** (pengganti "Budget" Notion)
```
kategori           string   // Makanan, Transport, Belanja, Tagihan, Hiburan, Gaji, Lainnya
limit_bulanan       number
terpakai_bulan_ini  number
```

**`finance_transactions`** (pengganti "Transaksi" Notion)
```
deskripsi     string
tanggal       date
jumlah        number
tipe          string   // Expense | Income
kategori      string
rekening      string
sumber        string   // Chat | Foto Struk
visitor_tag   string   // label singkat per visitor, mis. "A3F2", untuk tampilan feed
saldo_setelah number
created_at    datetime
```

**`finance_pending_actions`** (pengganti 3 database "Pending *" Notion, digabung satu collection dengan field `tipe`)
```
tipe           string   // kategori | rekening | realokasi
payload        object   // data spesifik tipe (nama_kategori+limit / draft transaksi / dari+ke+jumlah)
status         string   // pending | approved | rejected
visitor_tag    string
created_at     datetime
```

Seed awal (dipakai ulang tiap reset harian): 6 rekening dengan saldo dummy, 7 kategori budget dengan limit dummy — nilai persis boleh ditentukan saat implementasi, tidak mengubah keputusan desain.

---

## 6. Alur Fitur (port dari workflow n8n asli)

Semua logic berikut adalah port 1:1 dari node-node n8n (`Gemini - Baca Teks`, `Gemini - Baca Struk`, `Cek Ambang Budget`, `Hitung Opsi Realokasi`, `Hitung Ekspansi Budget`, dst.) ke method di `FinanceWalletService`, dengan Mongo menggantikan Notion sebagai storage:

1. **Transaksi via teks** — Gemini mengklasifikasi jenis pesan (`transaksi` / `kategori_baru` / `cek_saldo` / `lainnya`). Kalau `rekening` tidak disebut, buat `finance_pending_actions` tipe `rekening` dan tampilkan tombol pilihan di chat widget.
2. **Transaksi via foto struk** — upload foto → Gemini vision ekstrak data → lanjut ke alur transaksi normal (kategori "Foto Struk" sebagai sumber).
3. **Kategori baru** — user minta bikin kategori → konfirmasi via tombol (approve/cancel) → kalau approve, insert ke `finance_budgets`.
4. **Cek saldo** — balas ringkasan saldo semua rekening.
5. **Ambang budget & realokasi** — tiap transaksi Expense dicek persentase pemakaian kategori terhadap limit; ≥80%/90% memicu saran realokasi dari kategori lain yang masih longgar, user approve/reject via tombol.
6. **Ekspansi budget saat income** — income masuk → limit tiap kategori bertambah proporsional terhadap limit lama.

Setiap balasan bot ke visitor **juga** diposting ke grup Telegram demo via `sendMessage`, diberi label `visitor_tag` supaya beberapa visitor yang chat bersamaan tidak tercampur di grup.

---

## 7. Rate Limit & Kontrol Biaya

- `POST /message`, `POST /photo`, `POST /confirm` pakai middleware `throttle` mengikuti pola endpoint `/chat` yang sudah ada (contoh: `throttle:15,1` per IP).
- Counter kuota harian panggilan Gemini disimpan di cache Laravel (`CACHE_STORE=database`, sudah ada), increment tiap panggilan, reset otomatis di hari berikutnya. Saat kuota (`FINANCE_DEMO_GEMINI_DAILY_QUOTA`) tercapai, endpoint balas pesan ramah ("demo lagi ramai, coba lagi besok") tanpa memanggil Gemini.

---

## 8. Safeguard di n8n Workflow Asli (aksi terpisah, manual)

File `n8n/Finance Wallet V.1.json` akan diberi tambahan node `Filter: Hanya Chat Pribadi` tepat setelah `Telegram Trigger`, mengecek `{{ $json.message?.chat?.id ?? $json.callback_query?.message?.chat?.id }}` sama dengan chat ID pribadi owner (disimpan sebagai credential/env di n8n, bukan hardcode). Kalau tidak cocok, workflow berhenti di situ.

**Ini perubahan pada instance n8n yang berjalan** — spec ini menyiapkan definisi node-nya di file JSON referensi, tapi penerapan ke instance n8n live dilakukan oleh user (import/edit manual), karena Claude tidak punya akses ke instance n8n tersebut.

---

## 9. Halaman & Komponen Frontend

- **Route baru**: `frontend/src/pages/FinanceWallet.jsx`, didaftarkan di `App.jsx`, mengikuti pola `SqlMissionControl.jsx`.
- **Project card baru** di `components/sections/Projects.jsx` (atau lewat data admin `Project` model yang sudah ada) dengan CTA "Coba Demo Live" → `/finance-wallet`.
- **Struktur halaman**:
  1. Case study: ringkasan masalah/solusi, diagram arsitektur, badge tech stack, link download JSON workflow (versi sanitized), link "tonton live feed" ke grup Telegram (jelas ditandai view-only).
  2. Chat widget interaktif (extend pola `ChatWidget.jsx` yang sudah ada): input teks, tombol upload foto, render tombol konfirmasi inline saat ada `finance_pending_actions`.
  3. Tabel live: saldo per rekening, progress bar budget per kategori, daftar transaksi terbaru — auto-refresh via polling.

---

## 10. Di Luar Scope / Perlu Diputuskan Saat Implementasi

- Mekanisme reset harian yang cocok dengan constraint Render free plan (cron eksternal vs lazy-reset) — diputuskan saat tahap plan, tidak mengubah desain data/fitur di atas.
- Nilai persis saldo/limit seed awal.
- Desain visual detail (warna/tema halaman) — ikut riset saat implementasi, boleh reuse identitas visual portofolio existing atau tema khusus seperti SQL Mission Control, diputuskan di tahap plan/implementasi.

---

## 11. Testing

- Unit test `FinanceWalletService`: klasifikasi Gemini (mock HTTP), perhitungan ambang budget, ekspansi budget, realokasi.
- Feature test endpoint Laravel: rate limit, kuota harian, alur pending action end-to-end (mock Gemini + Telegram HTTP calls, tidak memanggil API asli saat test).
- Manual test di browser: kirim transaksi teks, upload foto struk (dummy), approve/reject kategori baru & realokasi, verifikasi tabel live ter-update dan grup Telegram menerima siaran.
