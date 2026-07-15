# Latihan CPNS TIU Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, indexing-only practice page at `/latihan-cpns-tiu` with 10 hardcoded TIU CPNS questions (analogi, deret angka/huruf, silogisme, aritmatika sosial, figural/gambar), exam-terminal styling, per-question "Cek Jawaban" feedback, and no timer.

**Architecture:** A pure-data module (`tiuQuestions.js`) feeds a single self-contained page component (`LatihanCpnsTiu.jsx`) that holds all UI state locally (`useState`, no store, no backend). The component is wired into the router with one new `<Route>` and is never linked from the Navbar or any other page.

**Tech Stack:** React 19, Tailwind (existing project tokens: `bg-background`, `text-sql-primary`, `font-mono`, etc.), Vitest + `@testing-library/react` (via `npm run test`), react-router-dom v6 (already in use).

## Global Constraints

- Route path is exactly `/latihan-cpns-tiu`, added to `frontend/src/App.jsx`. No button, Navbar entry, or link anywhere in the app may point to it — direct URL/indexing access only.
- No timer or time limit anywhere on the page.
- No final score/summary screen — per-question feedback via "Cek Jawaban" is the entire loop.
- No persistence (localStorage/backend) — state resets on reload.
- Exactly 10 questions, each with exactly 5 options labeled A–E.
- Figural (image) questions use only these verified CDN URLs (Twemoji, CC-BY 4.0, via jsDelivr):
  - Red circle: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f534.png`
  - Red triangle up: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f53a.png`
  - Red triangle down: `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f53b.png`
- Test commands run from `frontend/`: `npm run test -- run <path>` (wraps `vitest`, per `scripts/run-vitest.mjs`). Use the exact existing project patterns: `render`/`screen`/`fireEvent`/`waitFor` from `@testing-library/react` (no `user-event` package installed).
- Full question content/answers/pembahasan are exactly as specified in `docs/superpowers/specs/2026-07-15-latihan-cpns-tiu-design.md` §5 and reproduced verbatim in Task 1 below.

---

### Task 1: Question data bank

**Files:**
- Create: `frontend/src/data/tiuQuestions.js`
- Test: `frontend/src/data/tiuQuestions.test.js`

**Interfaces:**
- Produces: `export const tiuQuestions` — an array of 10 objects:
  ```
  {
    id: number,
    category: string,
    stem: string,
    stemImages?: [{ label: string, src: string, alt: string, count: number }],
    options: [{ label: 'A'|'B'|'C'|'D'|'E', text?: string, image?: { src: string, alt: string, count?: number } }], // length 5
    correctIndex: number, // 0-4
    explanation: string,
  }
  ```
  Later tasks (2–7) import `tiuQuestions` from `'../data/tiuQuestions'` (from `pages/`) and rely on this exact shape.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/data/tiuQuestions.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { tiuQuestions } from './tiuQuestions'

describe('tiuQuestions', () => {
  it('has exactly 10 questions, each with 5 valid options A-E and a valid correctIndex', () => {
    expect(tiuQuestions).toHaveLength(10)

    tiuQuestions.forEach((q) => {
      expect(q.options).toHaveLength(5)
      expect(q.options.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D', 'E'])
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(5)
      expect(typeof q.category).toBe('string')
      expect(q.category.length).toBeGreaterThan(0)
      expect(typeof q.explanation).toBe('string')
      expect(q.explanation.length).toBeGreaterThan(0)
      q.options.forEach((o) => {
        expect(o.text || o.image).toBeTruthy()
      })
    })
  })

  it('includes the two figural questions with image-based stems and options', () => {
    const figural = tiuQuestions.filter((q) => q.category.startsWith('Figural'))
    expect(figural).toHaveLength(2)
    figural.forEach((q) => {
      expect(q.options.every((o) => o.image)).toBe(true)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm run test -- run src/data/tiuQuestions.test.js`
Expected: FAIL — `tiuQuestions.js` does not exist / `tiuQuestions` is not exported.

- [ ] **Step 3: Write the data file**

Create `frontend/src/data/tiuQuestions.js`:

```js
const CIRCLE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f534.png'
const TRIANGLE_UP = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f53a.png'
const TRIANGLE_DOWN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f53b.png'

export const tiuQuestions = [
  {
    id: 1,
    category: 'Analogi Verbal',
    stem: 'GURU : MURID = DOKTER : ...',
    options: [
      { label: 'A', text: 'Rumah Sakit' },
      { label: 'B', text: 'Obat' },
      { label: 'C', text: 'Pasien' },
      { label: 'D', text: 'Perawat' },
      { label: 'E', text: 'Klinik' },
    ],
    correctIndex: 2,
    explanation: 'Guru berinteraksi dengan murid dalam proses mengajar, sebagaimana dokter berinteraksi dengan pasien dalam proses mengobati. Hubungannya adalah pelaku profesi dengan pihak yang dilayani.',
  },
  {
    id: 2,
    category: 'Analogi Verbal',
    stem: 'NELAYAN : LAUT = PETANI : ...',
    options: [
      { label: 'A', text: 'Cangkul' },
      { label: 'B', text: 'Sawah' },
      { label: 'C', text: 'Padi' },
      { label: 'D', text: 'Traktor' },
      { label: 'E', text: 'Desa' },
    ],
    correctIndex: 1,
    explanation: 'Nelayan bekerja di laut, petani bekerja di sawah — hubungannya adalah pelaku profesi dengan tempat bekerja.',
  },
  {
    id: 3,
    category: 'Deret Angka',
    stem: '3, 6, 11, 18, 27, ...',
    options: [
      { label: 'A', text: '36' },
      { label: 'B', text: '37' },
      { label: 'C', text: '38' },
      { label: 'D', text: '40' },
      { label: 'E', text: '42' },
    ],
    correctIndex: 2,
    explanation: 'Selisih antar suku adalah bilangan ganjil yang terus bertambah 2: +3, +5, +7, +9, +11. Suku berikutnya = 27 + 11 = 38.',
  },
  {
    id: 4,
    category: 'Deret Angka',
    stem: '2, 5, 4, 6, 6, 7, 8, 8, ...',
    options: [
      { label: 'A', text: '8' },
      { label: 'B', text: '9' },
      { label: 'C', text: '11' },
      { label: 'D', text: '10' },
      { label: 'E', text: '12' },
    ],
    correctIndex: 3,
    explanation: 'Deret larik ganda dari dua pola berselang-seling. Suku ganjil (posisi 1,3,5,7): 2, 4, 6, 8 (+2). Suku genap (posisi 2,4,6,8): 5, 6, 7, 8 (+1). Suku ke-9 melanjutkan pola ganjil: 8 + 2 = 10.',
  },
  {
    id: 5,
    category: 'Deret Huruf',
    stem: 'A, C, F, J, O, ...',
    options: [
      { label: 'A', text: 'T' },
      { label: 'B', text: 'U' },
      { label: 'C', text: 'V' },
      { label: 'D', text: 'W' },
      { label: 'E', text: 'X' },
    ],
    correctIndex: 1,
    explanation: 'Selisih posisi huruf bertambah 1 tiap loncatan: +2, +3, +4, +5, +6. Posisi O = 15, maka 15 + 6 = 21 = U.',
  },
  {
    id: 6,
    category: 'Silogisme',
    stem: 'Premis 1: Semua siswa SMA wajib mengikuti ujian akhir. Premis 2: Sebagian siswa SMA adalah anggota OSIS. Kesimpulan yang tepat adalah...',
    options: [
      { label: 'A', text: 'Semua anggota OSIS wajib mengikuti ujian akhir' },
      { label: 'B', text: 'Sebagian anggota OSIS wajib mengikuti ujian akhir' },
      { label: 'C', text: 'Semua siswa SMA adalah anggota OSIS' },
      { label: 'D', text: 'Sebagian siswa yang bukan anggota OSIS tidak wajib ujian' },
      { label: 'E', text: 'Tidak ada kesimpulan yang dapat ditarik' },
    ],
    correctIndex: 1,
    explanation: 'Karena hanya "sebagian" siswa SMA yang merupakan anggota OSIS, kesimpulan valid hanya berlaku untuk irisan tersebut: sebagian anggota OSIS wajib mengikuti ujian akhir.',
  },
  {
    id: 7,
    category: 'Silogisme',
    stem: 'Premis 1: Jika hari hujan, maka jalan menjadi basah. Premis 2: Jalan tidak basah. Kesimpulan yang tepat adalah...',
    options: [
      { label: 'A', text: 'Hari hujan' },
      { label: 'B', text: 'Hari tidak hujan' },
      { label: 'C', text: 'Jalan basah' },
      { label: 'D', text: 'Hari akan hujan besok' },
      { label: 'E', text: 'Tidak dapat disimpulkan' },
    ],
    correctIndex: 1,
    explanation: 'Ini adalah bentuk modus tollens: jika P maka Q, dan Q terbukti salah (jalan tidak basah), maka P juga pasti salah (hari tidak hujan).',
  },
  {
    id: 8,
    category: 'Aritmatika Sosial',
    stem: 'Sebuah toko memberikan diskon 20% untuk sebuah tas seharga Rp250.000. Berapa harga yang harus dibayar setelah diskon?',
    options: [
      { label: 'A', text: 'Rp180.000' },
      { label: 'B', text: 'Rp190.000' },
      { label: 'C', text: 'Rp200.000' },
      { label: 'D', text: 'Rp210.000' },
      { label: 'E', text: 'Rp220.000' },
    ],
    correctIndex: 2,
    explanation: 'Diskon 20% dari Rp250.000 = Rp50.000. Harga setelah diskon = Rp250.000 − Rp50.000 = Rp200.000.',
  },
  {
    id: 9,
    category: 'Figural (Deret Gambar)',
    stem: 'Perhatikan pola jumlah gambar berikut. Manakah kelompok gambar yang tepat untuk melanjutkan pola?',
    stemImages: [
      { label: 'I', src: CIRCLE, alt: 'Kelompok gambar 1: 1 lingkaran merah', count: 1 },
      { label: 'II', src: CIRCLE, alt: 'Kelompok gambar 2: 2 lingkaran merah', count: 2 },
      { label: 'III', src: CIRCLE, alt: 'Kelompok gambar 3: 3 lingkaran merah', count: 3 },
      { label: 'IV', src: CIRCLE, alt: 'Kelompok gambar 4: 4 lingkaran merah', count: 4 },
    ],
    options: [
      { label: 'A', image: { src: CIRCLE, alt: '4 lingkaran merah', count: 4 } },
      { label: 'B', image: { src: CIRCLE, alt: '5 lingkaran merah', count: 5 } },
      { label: 'C', image: { src: CIRCLE, alt: '6 lingkaran merah', count: 6 } },
      { label: 'D', image: { src: CIRCLE, alt: '7 lingkaran merah', count: 7 } },
      { label: 'E', image: { src: CIRCLE, alt: '3 lingkaran merah', count: 3 } },
    ],
    correctIndex: 1,
    explanation: 'Pola menambahkan satu lingkaran di tiap suku (1, 2, 3, 4, ...), sehingga suku berikutnya berisi 5 lingkaran.',
  },
  {
    id: 10,
    category: 'Figural (Ketidaksamaan Gambar)',
    stem: 'Manakah gambar yang berbeda arah/orientasinya dibandingkan gambar lainnya?',
    options: [
      { label: 'A', image: { src: TRIANGLE_UP, alt: 'segitiga mengarah ke atas' } },
      { label: 'B', image: { src: TRIANGLE_UP, alt: 'segitiga mengarah ke atas' } },
      { label: 'C', image: { src: TRIANGLE_DOWN, alt: 'segitiga mengarah ke bawah' } },
      { label: 'D', image: { src: TRIANGLE_UP, alt: 'segitiga mengarah ke atas' } },
      { label: 'E', image: { src: TRIANGLE_UP, alt: 'segitiga mengarah ke atas' } },
    ],
    correctIndex: 2,
    explanation: 'Empat segitiga mengarah ke atas, sedangkan opsi C mengarah ke bawah (dicerminkan/rotasi 180°), sehingga berbeda dari kelompoknya.',
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- run src/data/tiuQuestions.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/tiuQuestions.js frontend/src/data/tiuQuestions.test.js
git commit -m "feat: add TIU CPNS question data bank"
```

---

### Task 2: Page skeleton — render current question

**Files:**
- Create: `frontend/src/pages/LatihanCpnsTiu.jsx`
- Test: `frontend/src/pages/LatihanCpnsTiu.test.jsx`

**Interfaces:**
- Consumes: `tiuQuestions` array from Task 1 (`frontend/src/data/tiuQuestions.js`), exact shape as documented there.
- Produces: `export default function LatihanCpnsTiu()`. Renders (for the currently-selected question):
  - Header text `Soal {n}/10` (e.g. `Soal 1/10`)
  - The question's `category` text
  - The question's `stem` text
  - Each option's `text` (or, if `option.image` is set, an `<img>` per `count` with the given `alt`)
  - A `Cek Jawaban` button, disabled until an option is selected (behavior wired in Task 3)
  Later tasks (3–6) add interaction to this same file; Task 7 imports this component into `App.jsx`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/LatihanCpnsTiu.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LatihanCpnsTiu from './LatihanCpnsTiu'

describe('LatihanCpnsTiu', () => {
  it('renders the first question with its category, stem, and 5 options', () => {
    render(<LatihanCpnsTiu />)

    expect(screen.getByText('Soal 1/10')).toBeInTheDocument()
    expect(screen.getByText('Analogi Verbal')).toBeInTheDocument()
    expect(screen.getByText('GURU : MURID = DOKTER : ...')).toBeInTheDocument()
    expect(screen.getByText('Rumah Sakit')).toBeInTheDocument()
    expect(screen.getByText('Obat')).toBeInTheDocument()
    expect(screen.getByText('Pasien')).toBeInTheDocument()
    expect(screen.getByText('Perawat')).toBeInTheDocument()
    expect(screen.getByText('Klinik')).toBeInTheDocument()

    const checkButton = screen.getByRole('button', { name: 'Cek Jawaban' })
    expect(checkButton).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: FAIL — `LatihanCpnsTiu.jsx` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `frontend/src/pages/LatihanCpnsTiu.jsx`:

```jsx
import { useState } from 'react'
import { tiuQuestions } from '../data/tiuQuestions'

function ImageGroup({ src, alt, count = 1 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <img key={i} src={src} alt={i === 0 ? alt : ''} width={28} height={28} loading="lazy" />
      ))}
    </div>
  )
}

export default function LatihanCpnsTiu() {
  const [currentIndex] = useState(0)
  const question = tiuQuestions[currentIndex]
  const selectedIndex = null

  return (
    <div className="min-h-screen bg-background text-accent font-mono px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="text-sql-primary text-xs tracking-widest uppercase mb-2">
            LATIHAN TIU · CPNS
          </p>
          <p className="text-accent-muted text-sm">
            Soal {currentIndex + 1}/{tiuQuestions.length}
          </p>
          <div className="h-1 bg-surface-2 rounded mt-2">
            <div
              className="h-1 bg-sql-primary rounded"
              style={{ width: `${((currentIndex + 1) / tiuQuestions.length) * 100}%` }}
            />
          </div>
        </header>

        <div className="border border-border rounded-xl bg-surface p-5">
          <span className="inline-block text-xs px-2 py-1 rounded-full border border-sql-secondary/40 text-sql-secondary mb-4">
            {question.category}
          </span>

          {question.stemImages && (
            <div className="flex flex-wrap gap-4 mb-4">
              {question.stemImages.map((group) => (
                <div key={group.label} className="text-center">
                  <ImageGroup src={group.src} alt={group.alt} count={group.count} />
                  <p className="text-accent-dim text-xs mt-1">{group.label}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-accent mb-5">{question.stem}</p>

          <div className="flex flex-col gap-2">
            {question.options.map((option, i) => (
              <button
                key={option.label}
                type="button"
                className="w-full text-left border border-border rounded-lg p-3 flex items-center gap-3 hover:border-sql-secondary/60"
              >
                <span className="text-sql-dim">{option.label}.</span>
                {option.image ? (
                  <ImageGroup src={option.image.src} alt={option.image.alt} count={option.image.count} />
                ) : (
                  <span>{option.text}</span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={selectedIndex === null}
            className="mt-5 px-4 py-2 rounded-lg border border-sql-primary/40 text-sql-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sql-primary/10"
          >
            Cek Jawaban
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LatihanCpnsTiu.jsx frontend/src/pages/LatihanCpnsTiu.test.jsx
git commit -m "feat: render first TIU question skeleton"
```

---

### Task 3: Option selection and "Cek Jawaban" feedback

**Files:**
- Modify: `frontend/src/pages/LatihanCpnsTiu.jsx`
- Modify: `frontend/src/pages/LatihanCpnsTiu.test.jsx`

**Interfaces:**
- Consumes: same `tiuQuestions` shape from Task 1.
- Produces: clicking an option button selects it (enables `Cek Jawaban`); clicking `Cek Jawaban` sets a `checked` state that (a) adds a distinguishing class to the correct option and to a wrongly-selected option, and (b) renders `question.explanation` in a "Pembahasan" box. State is keyed by `question.id` in an `answers` object: `{ [id]: { selectedIndex, checked } }` — Task 4 reads/writes this same `answers` state when navigating.

- [ ] **Step 1: Write the failing test**

Add to `frontend/src/pages/LatihanCpnsTiu.test.jsx` (append inside the existing `describe` block, add `fireEvent` to the import):

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LatihanCpnsTiu from './LatihanCpnsTiu'
```

```jsx
  it('enables Cek Jawaban after selecting an option and reveals feedback on click', () => {
    render(<LatihanCpnsTiu />)

    const checkButton = screen.getByRole('button', { name: 'Cek Jawaban' })
    expect(checkButton).toBeDisabled()

    fireEvent.click(screen.getByText('Pasien'))
    expect(checkButton).toBeEnabled()

    fireEvent.click(checkButton)
    expect(screen.getByText(/Guru berinteraksi dengan murid/)).toBeInTheDocument()
  })

  it('marks a wrong selection distinctly from the correct answer after checking', () => {
    render(<LatihanCpnsTiu />)

    fireEvent.click(screen.getByText('Obat'))
    fireEvent.click(screen.getByRole('button', { name: 'Cek Jawaban' }))

    const wrongOptionButton = screen.getByText('Obat').closest('button')
    const correctOptionButton = screen.getByText('Pasien').closest('button')
    expect(wrongOptionButton.className).toMatch(/red/)
    expect(correctOptionButton.className).toMatch(/sql-primary/)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: FAIL — clicking options has no effect yet, `Cek Jawaban` stays disabled.

- [ ] **Step 3: Implement selection and feedback**

Replace the body of `frontend/src/pages/LatihanCpnsTiu.jsx` with:

```jsx
import { useState } from 'react'
import { tiuQuestions } from '../data/tiuQuestions'

function ImageGroup({ src, alt, count = 1 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <img key={i} src={src} alt={i === 0 ? alt : ''} width={28} height={28} loading="lazy" />
      ))}
    </div>
  )
}

export default function LatihanCpnsTiu() {
  const [currentIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  const question = tiuQuestions[currentIndex]
  const answer = answers[question.id] || { selectedIndex: null, checked: false }

  const selectOption = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { selectedIndex: optionIndex, checked: false },
    }))
  }

  const checkAnswer = () => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], checked: true },
    }))
  }

  return (
    <div className="min-h-screen bg-background text-accent font-mono px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="text-sql-primary text-xs tracking-widest uppercase mb-2">
            LATIHAN TIU · CPNS
          </p>
          <p className="text-accent-muted text-sm">
            Soal {currentIndex + 1}/{tiuQuestions.length}
          </p>
          <div className="h-1 bg-surface-2 rounded mt-2">
            <div
              className="h-1 bg-sql-primary rounded"
              style={{ width: `${((currentIndex + 1) / tiuQuestions.length) * 100}%` }}
            />
          </div>
        </header>

        <div className="border border-border rounded-xl bg-surface p-5">
          <span className="inline-block text-xs px-2 py-1 rounded-full border border-sql-secondary/40 text-sql-secondary mb-4">
            {question.category}
          </span>

          {question.stemImages && (
            <div className="flex flex-wrap gap-4 mb-4">
              {question.stemImages.map((group) => (
                <div key={group.label} className="text-center">
                  <ImageGroup src={group.src} alt={group.alt} count={group.count} />
                  <p className="text-accent-dim text-xs mt-1">{group.label}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-accent mb-5">{question.stem}</p>

          <div className="flex flex-col gap-2">
            {question.options.map((option, i) => {
              const isSelected = answer.selectedIndex === i
              const isCorrect = i === question.correctIndex
              let stateClass = 'border-border hover:border-sql-secondary/60'
              if (answer.checked) {
                if (isCorrect) stateClass = 'border-sql-primary bg-sql-primary/10'
                else if (isSelected) stateClass = 'border-red-500 bg-red-500/10'
              } else if (isSelected) {
                stateClass = 'border-sql-secondary'
              }

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => selectOption(i)}
                  className={`w-full text-left border rounded-lg p-3 flex items-center gap-3 ${stateClass}`}
                >
                  <span className="text-sql-dim">{option.label}.</span>
                  {option.image ? (
                    <ImageGroup src={option.image.src} alt={option.image.alt} count={option.image.count} />
                  ) : (
                    <span>{option.text}</span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            disabled={answer.selectedIndex === null}
            onClick={checkAnswer}
            className="mt-5 px-4 py-2 rounded-lg border border-sql-primary/40 text-sql-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sql-primary/10"
          >
            Cek Jawaban
          </button>

          {answer.checked && (
            <div className="mt-4 border border-sql-primary/40 rounded-lg p-4 text-sm text-accent-muted">
              <p className="text-sql-primary font-mono text-xs uppercase mb-1">Pembahasan</p>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LatihanCpnsTiu.jsx frontend/src/pages/LatihanCpnsTiu.test.jsx
git commit -m "feat: add option selection and answer-check feedback"
```

---

### Task 4: Prev/Next navigation with per-question state preservation

**Files:**
- Modify: `frontend/src/pages/LatihanCpnsTiu.jsx`
- Modify: `frontend/src/pages/LatihanCpnsTiu.test.jsx`

**Interfaces:**
- Consumes: `answers` state and `tiuQuestions` from Task 3.
- Produces: a `goTo(index)` handler (bounds-checked to `[0, tiuQuestions.length - 1]`), and two buttons — `Soal Sebelumnya` (disabled when `currentIndex === 0`) and `Soal Berikutnya` (disabled when `currentIndex === tiuQuestions.length - 1`). Task 5 reuses `goTo` for the number-pill navigator.

- [ ] **Step 1: Write the failing test**

Add to `frontend/src/pages/LatihanCpnsTiu.test.jsx`:

```jsx
  it('navigates with Prev/Next, disables at bounds, and preserves selection per question', () => {
    render(<LatihanCpnsTiu />)

    const prevButton = screen.getByRole('button', { name: /Soal Sebelumnya/ })
    const nextButton = screen.getByRole('button', { name: /Soal Berikutnya/ })
    expect(prevButton).toBeDisabled()

    fireEvent.click(screen.getByText('Pasien'))
    fireEvent.click(nextButton)
    expect(screen.getByText('Soal 2/10')).toBeInTheDocument()

    fireEvent.click(prevButton)
    expect(screen.getByText('Soal 1/10')).toBeInTheDocument()
    expect(screen.getByText('Pasien').closest('button').className).toMatch(/sql-secondary/)
  })

  it('disables Soal Berikutnya on the last question', () => {
    render(<LatihanCpnsTiu />)

    const nextButton = screen.getByRole('button', { name: /Soal Berikutnya/ })
    for (let i = 0; i < 9; i++) {
      fireEvent.click(nextButton)
    }

    expect(screen.getByText('Soal 10/10')).toBeInTheDocument()
    expect(nextButton).toBeDisabled()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: FAIL — no "Soal Sebelumnya"/"Soal Berikutnya" buttons exist yet.

- [ ] **Step 3: Implement navigation**

In `frontend/src/pages/LatihanCpnsTiu.jsx`, change `const [currentIndex] = useState(0)` to:

```jsx
  const [currentIndex, setCurrentIndex] = useState(0)
```

Add, alongside `checkAnswer`:

```jsx
  const goTo = (index) => {
    if (index >= 0 && index < tiuQuestions.length) setCurrentIndex(index)
  }
```

Find this exact block (added in Task 3, sitting between the options `<div>` and the "Pembahasan" box):

```jsx
          <button
            type="button"
            disabled={answer.selectedIndex === null}
            onClick={checkAnswer}
            className="mt-5 px-4 py-2 rounded-lg border border-sql-primary/40 text-sql-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sql-primary/10"
          >
            Cek Jawaban
          </button>
```

Replace it with (same position — right before the `{answer.checked && (...)}` block, which stays unchanged):

```jsx
          <div className="flex items-center justify-between mt-5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goTo(currentIndex - 1)}
              className="px-3 py-2 rounded-lg border border-border text-accent-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-accent-dim"
            >
              ◀ Soal Sebelumnya
            </button>

            <button
              type="button"
              disabled={answer.selectedIndex === null}
              onClick={checkAnswer}
              className="px-4 py-2 rounded-lg border border-sql-primary/40 text-sql-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sql-primary/10"
            >
              Cek Jawaban
            </button>

            <button
              type="button"
              disabled={currentIndex === tiuQuestions.length - 1}
              onClick={() => goTo(currentIndex + 1)}
              className="px-3 py-2 rounded-lg border border-border text-accent-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-accent-dim"
            >
              Soal Berikutnya ▶
            </button>
          </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LatihanCpnsTiu.jsx frontend/src/pages/LatihanCpnsTiu.test.jsx
git commit -m "feat: add Prev/Next navigation with preserved per-question state"
```

---

### Task 5: Number-pill question navigator

**Files:**
- Modify: `frontend/src/pages/LatihanCpnsTiu.jsx`
- Modify: `frontend/src/pages/LatihanCpnsTiu.test.jsx`

**Interfaces:**
- Consumes: `goTo`, `currentIndex`, `answers`, `tiuQuestions` from Task 4.
- Produces: 10 pill buttons (accessible name = question number as a string, e.g. `'5'`) rendered above the question card; clicking one calls `goTo(index)`. Task 6 uses this navigator to reach the figural questions (9 and 10) in tests.

- [ ] **Step 1: Write the failing test**

Add to `frontend/src/pages/LatihanCpnsTiu.test.jsx`:

```jsx
  it('jumps directly to a question via the number-pill navigator', () => {
    render(<LatihanCpnsTiu />)

    fireEvent.click(screen.getByRole('button', { name: '5' }))

    expect(screen.getByText('Soal 5/10')).toBeInTheDocument()
    expect(screen.getByText('Deret Huruf')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: FAIL — no button named `'5'` exists.

- [ ] **Step 3: Implement the pill navigator**

In `frontend/src/pages/LatihanCpnsTiu.jsx`, insert this block right after the closing `</header>` tag and before the `<div className="border border-border rounded-xl bg-surface p-5">` question card:

```jsx
        <div className="flex flex-wrap gap-2 mb-6">
          {tiuQuestions.map((q, i) => {
            const qa = answers[q.id]
            let pillClass = 'border-border text-accent-muted'
            if (i === currentIndex) pillClass = 'border-sql-primary text-sql-primary'
            else if (qa?.checked) {
              pillClass = qa.selectedIndex === q.correctIndex
                ? 'border-sql-primary/50 text-sql-primary/70'
                : 'border-red-500/50 text-red-400/70'
            } else if (qa) pillClass = 'border-sql-secondary/50 text-sql-secondary/70'

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goTo(i)}
                className={`w-8 h-8 text-xs rounded-full border ${pillClass}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LatihanCpnsTiu.jsx frontend/src/pages/LatihanCpnsTiu.test.jsx
git commit -m "feat: add number-pill question navigator"
```

---

### Task 6: Verify figural (image-based) questions end-to-end

**Files:**
- Modify: `frontend/src/pages/LatihanCpnsTiu.test.jsx`

**Interfaces:**
- Consumes: the fully-built component from Tasks 2–5 and the figural question data from Task 1 (questions 9 and 10, `category` starting with `'Figural'`). No production code changes expected — this task is a coverage/regression check that the generic option/stem rendering already handles image-based content correctly.

- [ ] **Step 1: Write the test**

Add to `frontend/src/pages/LatihanCpnsTiu.test.jsx`:

```jsx
  it('renders image-based stem groups and options for the figural questions, and answer-checking still works', () => {
    render(<LatihanCpnsTiu />)

    fireEvent.click(screen.getByRole('button', { name: '9' }))
    expect(screen.getByText('Figural (Deret Gambar)')).toBeInTheDocument()
    expect(screen.getAllByAltText(/lingkaran/i).length).toBeGreaterThan(0)

    const fiveCircleOption = screen.getByAltText('5 lingkaran merah').closest('button')
    fireEvent.click(fiveCircleOption)
    fireEvent.click(screen.getByRole('button', { name: 'Cek Jawaban' }))
    expect(screen.getByText(/Pola menambahkan satu lingkaran/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '10' }))
    expect(screen.getByText('Figural (Ketidaksamaan Gambar)')).toBeInTheDocument()
    expect(screen.getAllByAltText(/segitiga/i)).toHaveLength(5)
  })
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `npm run test -- run src/pages/LatihanCpnsTiu.test.jsx`
Expected: PASS immediately (7 tests) — Tasks 2–5 already implemented generic image rendering and answer-checking that this test exercises. If it fails, the gap is almost certainly in the `ImageGroup` `alt` logic (only the first `<img>` in a repeated group gets the real `alt`, per Task 2's implementation) — check the failing assertion against that behavior before changing anything.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LatihanCpnsTiu.test.jsx
git commit -m "test: verify figural image-based questions end-to-end"
```

---

### Task 7: Wire the route (indexing-only, no nav link)

**Files:**
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/App.test.jsx`

**Interfaces:**
- Consumes: `LatihanCpnsTiu` default export from Task 2 (`frontend/src/pages/LatihanCpnsTiu.jsx`).
- Produces: route `/latihan-cpns-tiu` registered in the app's `<Routes>`. No changes to `Navbar.jsx`, `Projects.jsx`, or any other file — this route must not be linked from anywhere.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/App.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App routing', () => {
  it('renders the CPNS TIU practice page at /latihan-cpns-tiu', () => {
    window.history.pushState({}, '', '/latihan-cpns-tiu')

    render(<App />)

    expect(screen.getByText('LATIHAN TIU · CPNS')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- run src/App.test.jsx`
Expected: FAIL — route not registered, page renders whatever `/latihan-cpns-tiu` currently falls through to (the `Portfolio` `:section` catch-all), so the header text is absent.

- [ ] **Step 3: Add the route**

In `frontend/src/App.jsx`, add the import alongside the other page imports (after `import FinanceWallet from './pages/FinanceWallet'`):

```jsx
import LatihanCpnsTiu from './pages/LatihanCpnsTiu'
```

Add the route alongside the other standalone routes (after `<Route path="/finance-wallet" element={<FinanceWallet />} />`):

```jsx
          <Route path="/latihan-cpns-tiu" element={<LatihanCpnsTiu />} />
```

Do not touch `Navbar.jsx`, `Projects.jsx`, or any other file.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- run src/App.test.jsx`
Expected: PASS (1 test)

- [ ] **Step 5: Run the full test suite**

Run: `npm run test -- run`
Expected: all tests pass, including the 7 in `LatihanCpnsTiu.test.jsx`, 2 in `tiuQuestions.test.js`, and 1 in `App.test.jsx`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.test.jsx
git commit -m "feat: wire /latihan-cpns-tiu route (indexing-only, no nav link)"
```

---

### Task 8: Manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run (from `frontend/`): `npm run dev`

- [ ] **Step 2: Open the page directly by URL**

Navigate to `http://localhost:5173/latihan-cpns-tiu` (or whatever port Vite reports) directly in the browser — do not navigate via any in-app link, confirming there is none.

- [ ] **Step 3: Walk through the exam flow**

Confirm: progress bar and `Soal 1/10` counter update as you move between questions; clicking an option highlights it before checking; `Cek Jawaban` is disabled until an option is picked and, once clicked, shows the correct option in green, a wrong pick in red, and the pembahasan text; `Soal Sebelumnya` is disabled on question 1 and `Soal Berikutnya` is disabled on question 10; the number-pill navigator jumps directly to any question and reflects checked/unchecked/current state; questions 9 and 10 render their CDN images (circle counts and triangle orientations) correctly and load quickly; no timer is present anywhere.

- [ ] **Step 4: Confirm no navbar/link exposure**

Grep the frontend for any accidental link to the new route: `grep -rn "latihan-cpns-tiu" frontend/src --include=*.jsx | grep -v "App.jsx\|LatihanCpnsTiu"` should return nothing.
