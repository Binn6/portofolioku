# Latihan CPNS TIU — Design Spec

Date: 2026-07-15

## 1. Purpose

A standalone practice page with 10 hardcoded TIU (Tes Intelegensia Umum) CPNS questions
covering analogi verbal, deret angka, deret huruf, silogisme, aritmatika sosial, and
figural (image-based) reasoning. Exam-style UI, no timer, immediate per-question
feedback via a "Cek Jawaban" button.

The page is **indexing-only**: reachable solely by direct URL (`/latihan-cpns-tiu`) or
search-engine indexing. No button, nav link, or project-card link points to it anywhere
in the site.

## 2. Routing

Add one route to `frontend/src/App.jsx`, following the existing pattern used by
`/sql-mission-control` and `/finance-wallet`:

```jsx
<Route path="/latihan-cpns-tiu" element={<LatihanCpnsTiu />} />
```

No entry is added to `Navbar.jsx`, `Projects.jsx`, or any other component. This is the
only integration point with the rest of the app.

## 3. File structure

- `frontend/src/data/tiuQuestions.js` — the 10-question bank (pure data, no logic).
- `frontend/src/pages/LatihanCpnsTiu.jsx` — the exam page component (all UI + local state).

No backend/API involvement, no Zustand store — content is static and state is
ephemeral (resets on reload; no persistence requested).

## 4. Data schema (`tiuQuestions.js`)

```js
{
  id: number,
  category: string,          // e.g. 'Analogi Verbal', 'Deret Angka', 'Figural'
  stem: string,              // question text; may be '' when the stem is fully image-based
  stemImages: [{ src, alt }] | undefined,  // optional images shown above/inside the stem
  options: [
    { label: 'A', text: string } | { label: 'A', image: { src, alt } },
    // exactly 5 entries, labels A–E
  ],
  correctIndex: number,      // 0-based index into options
  explanation: string,       // shown after "Cek Jawaban" is pressed
}
```

## 5. Content — the 10 questions

1. **Analogi Verbal** — "GURU : MURID = DOKTER : ..."
   A. Rumah Sakit B. Obat **C. Pasien** D. Perawat E. Klinik
   *Pembahasan:* Guru berinteraksi dengan murid dalam proses mengajar, sebagaimana
   dokter berinteraksi dengan pasien dalam proses mengobati — relasi pelaku profesi
   dengan pihak yang dilayani.

2. **Analogi Verbal** — "NELAYAN : LAUT = PETANI : ..."
   A. Cangkul **B. Sawah** C. Padi D. Traktor E. Desa
   *Pembahasan:* Nelayan bekerja di laut, petani bekerja di sawah — relasi pelaku
   profesi dengan tempat bekerja.

3. **Deret Angka** — "3, 6, 11, 18, 27, ..."
   A. 36 B. 37 **C. 38** D. 40 E. 42
   *Pembahasan:* Selisih antar suku adalah bilangan ganjil yang terus bertambah 2:
   +3, +5, +7, +9, +11. Suku berikutnya = 27 + 11 = 38.

4. **Deret Angka** — "2, 5, 4, 6, 6, 7, 8, 8, ..." (larik ganda)
   A. 8 B. 9 C. 11 **D. 10** E. 12
   *Pembahasan:* Deret larik ganda dari dua pola berselang-seling. Suku ganjil
   (posisi 1,3,5,7): 2, 4, 6, 8 (+2). Suku genap (posisi 2,4,6,8): 5, 6, 7, 8 (+1).
   Suku ke-9 melanjutkan pola ganjil: 8 + 2 = 10.

5. **Deret Huruf** — "A, C, F, J, O, ..."
   A. T **B. U** C. V D. W E. X
   *Pembahasan:* Selisih posisi huruf bertambah 1 tiap loncatan: +2, +3, +4, +5, +6.
   Posisi O = 15, maka 15 + 6 = 21 = U.

6. **Silogisme** — "Premis 1: Semua siswa SMA wajib mengikuti ujian akhir. Premis 2:
   Sebagian siswa SMA adalah anggota OSIS. Kesimpulan yang tepat adalah..."
   A. Semua anggota OSIS wajib mengikuti ujian akhir
   **B. Sebagian anggota OSIS wajib mengikuti ujian akhir**
   C. Semua siswa SMA adalah anggota OSIS
   D. Sebagian siswa yang bukan anggota OSIS tidak wajib ujian
   E. Tidak ada kesimpulan yang dapat ditarik
   *Pembahasan:* Karena hanya "sebagian" siswa SMA yang merupakan anggota OSIS,
   kesimpulan valid hanya berlaku untuk irisan tersebut.

7. **Silogisme (kondisional)** — "Premis 1: Jika hari hujan, maka jalan menjadi basah.
   Premis 2: Jalan tidak basah. Kesimpulan yang tepat adalah..."
   A. Hari hujan **B. Hari tidak hujan** C. Jalan basah D. Hari akan hujan besok
   E. Tidak dapat disimpulkan
   *Pembahasan:* Modus tollens — jika P maka Q, dan Q terbukti salah, maka P juga pasti
   salah.

8. **Aritmatika Sosial** — "Sebuah toko memberikan diskon 20% untuk sebuah tas seharga
   Rp250.000. Berapa harga yang harus dibayar setelah diskon?"
   A. Rp180.000 B. Rp190.000 **C. Rp200.000** D. Rp210.000 E. Rp220.000
   *Pembahasan:* Diskon 20% dari Rp250.000 = Rp50.000. Harga akhir = Rp200.000.

9. **Figural (Deret Gambar, image-based)** — stem shows 4 image groups (1, 2, 3, 4 red
   circle icons) forming an increasing-count pattern; options are image groups.
   A. 4 lingkaran **B. 5 lingkaran** C. 6 lingkaran D. 7 lingkaran E. 3 lingkaran
   *Pembahasan:* Pola menambahkan satu lingkaran di tiap suku, sehingga suku
   berikutnya berisi 5 lingkaran.

10. **Figural (Ketidaksamaan Gambar, image-based)** — "Manakah gambar yang berbeda
    arah/orientasinya dibandingkan gambar lainnya?" Options are single triangle images,
    four pointing up, one pointing down.
    A. ▲ B. ▲ **C. ▼** D. ▲ E. ▲
    *Pembahasan:* Empat segitiga mengarah ke atas; opsi C mengarah ke bawah
    (dicerminkan/rotasi 180°), sehingga berbeda dari kelompoknya.

## 6. Images (CDN sourcing)

Rather than hotlinking copyrighted exam-bank images (legally risky and unstable),
question 9 and 10 use **Twemoji** shape icons — CC-BY 4.0 licensed, tiny PNGs, served
via jsDelivr's GitHub CDN mirror. Verified reachable (HTTP 200):

- Red circle: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f534.png`
- Red triangle up: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f53a.png`
- Red triangle down: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f53b.png`

Each `<img>` gets a descriptive `alt` (e.g. "3 lingkaran merah", "segitiga mengarah ke
bawah") for accessibility, and `loading="lazy"` + explicit `width`/`height` to keep the
page light.

## 7. UI / interaction design

Dark exam-terminal aesthetic, reusing the site's existing Tailwind tokens
(`bg-background`, `text-sql-primary`, `font-mono`, `border-border`, etc.) so it feels
native to the rest of the site rather than a bolted-on page.

**Layout (single component, local `useState`):**

- **Header bar:** "LATIHAN TIU · CPNS" label, "Soal {index+1}/10" counter, a thin
  progress bar (`(index+1)/10 * 100%` width).
- **Question navigator:** a row of 10 number pills (1–10). Current question highlighted;
  answered-but-unchecked / checked-correct / checked-incorrect get distinct subtle
  states. Clicking a pill jumps directly to that question (no restrictions — freely
  navigable, matches "tidak perlu pengecekan sudah terjawab atau belum").
- **Question card:**
  - Kategori tag (small pill, e.g. "Analogi Verbal").
  - Stem text and/or stem images.
  - 5 option cards (A–E), each a clickable `<button>` — radio-like single-select,
    rendering either text or an image per the data schema.
  - **"Cek Jawaban" button** — enabled once an option is selected for the current
    question. On click: reveals color state on all options (correct = green
    border/check icon, selected-but-wrong = red border/X icon) and shows the
    `explanation` text in a callout box below the options. Re-clickable if the user
    changes their selection before moving on.
  - **Prev / Next buttons** ("◀ Soal Sebelumnya" / "Soal Berikutnya ▶") — always
    enabled except at the natural bounds (Prev disabled on Q1, Next disabled on Q10).
    Navigating away and back preserves the selection/checked state for that question
    (state is keyed by question id, not reset on switch).
- **No timer anywhere.** No final "score summary" screen — per-question feedback is
  the whole loop; the header counter is the only aggregate indicator (shows how many
  of the 10 have been checked, not a running score), keeping scope minimal per the
  approved design.

**State shape:**

```js
const [currentIndex, setCurrentIndex] = useState(0)
const [answers, setAnswers] = useState({}) // { [questionId]: { selectedIndex, checked } }
```

No persistence (localStorage) — resets on page reload, matching "hanya sekedar
latihan" with no stated requirement to resume.

## 8. Testing

- Component test (Vitest + Testing Library, matching existing `scripts/run-vitest.mjs`
  setup) covering: selecting an option enables "Cek Jawaban"; checking reveals correct/
  incorrect state + explanation; Next/Prev navigate and preserve per-question state;
  Prev disabled on Q1 and Next disabled on Q10; number-pill navigation jumps directly.
- Manual verification in the browser (`npm run dev`) for visual/exam feel, and to
  confirm the two CDN image questions render correctly.

## 9. Out of scope (explicitly not building)

- Timer / time limit.
- Final score/summary screen.
- Persistence across reloads.
- Any nav/button link to the page (by design — indexing-only).
- Backend/API-driven question content (all 10 are hardcoded).
