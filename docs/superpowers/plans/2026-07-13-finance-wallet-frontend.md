# Finance Wallet Demo — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public `/finance-wallet` portfolio page — a case-study section about the n8n/Gemini/Telegram automation, an interactive chat widget wired to the backend endpoints, and a live-updating table of the shared demo wallet.

**Architecture:** One new route/page (`FinanceWallet.jsx`, using `Navbar`/`Footer` like `Portfolio.jsx`, not the standalone shell `SqlMissionControl.jsx` uses) composed of three new presentational/interactive components, talking to the 4 backend endpoints from `docs/superpowers/plans/2026-07-13-finance-wallet-backend.md` (Task 7) via new functions added to the existing `frontend/src/services/api.js`.

**Tech Stack:** React 19 + Vite (existing), Tailwind (existing design tokens: `bg-surface`, `bg-surface-2`, `border-border`, `text-accent`, `text-accent-muted`, `bg-accent`/`text-background`), `axios` via the existing `api` instance, `lucide-react` icons, `vitest` + `@testing-library/react` (already installed; no `@testing-library/jest-dom` matchers available, so tests use `getByText`/`getByRole`/`findByRole` — which throw/resolve on their own — as the assertion, not `.toBeInTheDocument()`).

## Global Constraints

- This plan depends on Task 7 of the backend plan being done first (routes `POST /api/finance-wallet/message`, `POST /api/finance-wallet/photo`, `POST /api/finance-wallet/confirm`, `GET /api/finance-wallet/state` must exist).
- New API calls are added to the existing `frontend/src/services/api.js` (this codebase does not split services per-feature outside of the SQL game's player-auth instance) — do not create a new services file.
- Match existing Tailwind tokens and component structure (see `frontend/src/components/ui/ChatWidget.jsx` for the established chat-bubble visual language) — do not introduce a new color system.
- Frontend tests use `vitest`'s built-in `expect` plus RTL's throwing `getBy*`/resolving `findBy*` queries. Do **not** use `.toBeInTheDocument()` or other `@testing-library/jest-dom` matchers — that package is not installed here.
- Visitor identity is a short client-generated tag (`getOrCreateVisitorTag()`), stored in `localStorage`, matching the pattern already used for chat sessions in `ChatWidget.jsx` (`getOrCreateSession`). It must satisfy the backend's validation regex `^[a-zA-Z0-9]+$`, max 20 chars.

---

### Task 1: Utils, API service functions, and route stub

**Files:**
- Create: `frontend/src/utils/financeWallet.js`
- Test: `frontend/src/utils/financeWallet.test.js`
- Modify: `frontend/src/services/api.js`
- Create: `frontend/src/pages/FinanceWallet.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: backend routes from backend-plan Task 7.
- Produces: `getOrCreateVisitorTag(): string`, `formatRupiah(amount: number): string` (used by Tasks 3–5); `financeWalletSendMessage(data)`, `financeWalletSendPhoto(formData)`, `financeWalletConfirm(data)`, `financeWalletGetState()` (all return `Promise<responseBodyObject>`, used by Tasks 3–5); route `/finance-wallet` rendering `FinanceWallet` page (extended by Task 6).

- [ ] **Step 1: Write the failing test**

`frontend/src/utils/financeWallet.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { getOrCreateVisitorTag, formatRupiah } from './financeWallet'

describe('getOrCreateVisitorTag', () => {
  beforeEach(() => localStorage.clear())

  it('creates an alphanumeric tag and persists it across calls', () => {
    const first = getOrCreateVisitorTag()
    const second = getOrCreateVisitorTag()

    expect(first).toMatch(/^[a-zA-Z0-9]+$/)
    expect(first.length).toBeLessThanOrEqual(20)
    expect(second).toBe(first)
  })
})

describe('formatRupiah', () => {
  it('formats a number as Indonesian rupiah', () => {
    expect(formatRupiah(25000)).toBe('Rp25.000')
  })

  it('treats missing amounts as zero', () => {
    expect(formatRupiah(undefined)).toBe('Rp0')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/utils/financeWallet.test.js`
Expected: FAIL — `Failed to resolve import "./financeWallet"`

- [ ] **Step 3: Implement the utils**

`frontend/src/utils/financeWallet.js`:
```js
const VISITOR_TAG_KEY = 'finance_wallet_visitor_tag'

export function getOrCreateVisitorTag() {
  let tag = localStorage.getItem(VISITOR_TAG_KEY)
  if (!tag) {
    tag = Math.random().toString(36).slice(2, 6).toUpperCase()
    localStorage.setItem(VISITOR_TAG_KEY, tag)
  }
  return tag
}

export function formatRupiah(amount) {
  return 'Rp' + Number(amount || 0).toLocaleString('id-ID')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/utils/financeWallet.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Add the API service functions**

Modify `frontend/src/services/api.js` — append after the existing `// Public chat` block (currently lines 83-85):
```js
// Public — Finance Wallet demo
export const financeWalletSendMessage = (data) =>
  api.post('/finance-wallet/message', data).then(r => r.data)

export const financeWalletSendPhoto = (formData) =>
  api.post('/finance-wallet/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)

export const financeWalletConfirm = (data) =>
  api.post('/finance-wallet/confirm', data).then(r => r.data)

export const financeWalletGetState = () =>
  api.get('/finance-wallet/state').then(r => r.data)
```

- [ ] **Step 6: Create the page stub**

`frontend/src/pages/FinanceWallet.jsx`:
```jsx
import Navbar from '../components/layout/Navbar'

export default function FinanceWallet() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-semibold text-accent">Finance Wallet — AI Automation Demo</h1>
        <p className="text-accent-muted mt-2">Halaman ini sedang dibangun.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Register the route**

Modify `frontend/src/App.jsx` — add the import after the `SqlMissionControl` import (line 19):
```js
import FinanceWallet from './pages/FinanceWallet'
```

Then add the route after the `/sql-mission-control` route (line 29):
```jsx
          <Route path="/finance-wallet" element={<FinanceWallet />} />
```

- [ ] **Step 8: Manually verify the route renders**

Run: `cd frontend && npm run dev`
Visit `http://localhost:3001/finance-wallet` in a browser — expect to see the "Finance Wallet — AI Automation Demo" heading under the site navbar with no console errors. Stop the dev server after confirming.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/utils/financeWallet.js frontend/src/utils/financeWallet.test.js frontend/src/services/api.js frontend/src/pages/FinanceWallet.jsx frontend/src/App.jsx
git commit -m "feat: add Finance Wallet demo page stub, route, and API bindings"
```

---

### Task 2: Case-study section and sanitized workflow download

**Files:**
- Create: `frontend/src/components/finance-wallet/FinanceWalletCaseStudy.jsx`
- Create: `frontend/public/downloads/finance-wallet-workflow.json` (copied, not hand-written — see Step 1)

**Interfaces:**
- Consumes: nothing from other frontend tasks.
- Produces: `<FinanceWalletCaseStudy />` component, composed into the page by Task 6.

**Prerequisite:** Backend-plan Task 9 (sanitizing `n8n/Finance Wallet V.1.json`) must be done first — this task copies that already-sanitized file.

- [ ] **Step 1: Copy the sanitized n8n workflow into the frontend's static assets**

```bash
mkdir -p frontend/public/downloads
cp "n8n/Finance Wallet V.1.json" "frontend/public/downloads/finance-wallet-workflow.json"
```

Confirm the copy has no secrets before committing:
```bash
grep -c "AQ.Ab8RN6Kf\|8948623819:AA" frontend/public/downloads/finance-wallet-workflow.json
```
Expected: `0` (no matches). If this prints anything other than `0`, stop — backend-plan Task 9 was not completed correctly; do not proceed until the source file is clean.

- [ ] **Step 2: Build the case-study component**

`frontend/src/components/finance-wallet/FinanceWalletCaseStudy.jsx`:
```jsx
const TECH_BADGES = ['n8n', 'Telegram Bot API', 'Gemini AI', 'Notion API', 'Laravel', 'MongoDB Atlas']

export default function FinanceWalletCaseStudy() {
  return (
    <section className="mb-12">
      <p className="text-xs uppercase tracking-widest text-accent-muted mb-2">Case Study</p>
      <h1 className="text-3xl font-semibold text-accent mb-4">Finance Wallet — Pencatatan Keuangan Otomatis via Chat</h1>
      <p className="text-accent-muted leading-relaxed max-w-3xl">
        Otomatisasi pencatatan keuangan pribadi yang jalan lewat chat: kirim pesan seperti
        "makan siang 25rb" atau foto struk belanja, dan AI (Gemini) langsung mengklasifikasi,
        mencatat transaksi, memperbarui saldo &amp; budget, sampai menyarankan realokasi budget
        kalau salah satu kategori mepet limit. Dibangun dengan n8n sebagai automation engine,
        Telegram sebagai antarmuka chat, dan Notion sebagai database personal.
      </p>

      <div className="flex flex-wrap gap-2 mt-5">
        {TECH_BADGES.map((tech) => (
          <span key={tech} className="text-xs px-3 py-1 rounded-full border border-border text-accent-muted">
            {tech}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mt-6 text-sm">
        <a
          href="/downloads/finance-wallet-workflow.json"
          download
          className="px-4 py-2 rounded-lg border border-border text-accent hover:border-accent-dim transition-colors"
        >
          Download workflow n8n (JSON)
        </a>
        <a
          href="https://t.me/+JfrV0lq3Yl5mZDQ9"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg border border-border text-accent hover:border-accent-dim transition-colors"
        >
          Tonton live feed di Telegram (view-only)
        </a>
      </div>

      <p className="text-xs text-accent-muted mt-6 max-w-3xl">
        Demo di bawah ini <strong>bukan</strong> workflow n8n asli di atas — demo publik jalan di
        atas data dummy tersendiri (MongoDB), supaya siapa pun bisa coba tanpa menyentuh data
        keuangan pribadi. Setiap pesan yang kamu kirim di sini juga disiarkan satu arah ke grup
        Telegram demo di atas, biar kamu bisa lihat buktinya real-time.
      </p>
    </section>
  )
}
```

- [ ] **Step 3: Manually verify the download link works**

With `npm run dev` running in `frontend/`, temporarily render `<FinanceWalletCaseStudy />` in `FinanceWallet.jsx` (this wiring becomes permanent in Task 6) and click "Download workflow n8n (JSON)" in the browser — confirm a JSON file downloads and, opened in an editor, contains no `AQ.Ab8RN6Kf` or `8948623819:AA` substrings.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/finance-wallet/FinanceWalletCaseStudy.jsx frontend/public/downloads/finance-wallet-workflow.json
git commit -m "feat: add Finance Wallet case-study section and sanitized workflow download"
```

---

### Task 3: Text chat widget

**Files:**
- Create: `frontend/src/components/finance-wallet/FinanceChatWidget.jsx`
- Test: `frontend/src/components/finance-wallet/FinanceChatWidget.test.jsx`

**Interfaces:**
- Consumes: `financeWalletSendMessage`, `financeWalletConfirm` (Task 1), `getOrCreateVisitorTag` (Task 1). Backend response shapes (from backend-plan Task 7): `{type:'transaction', reply, realokasi_suggestion: null|{pending_id,...}}`, `{type:'pending_account', pending_id, reply, options}`, `{type:'pending_category', pending_id, reply}`, `{type:'balance', reply, accounts}`, `{type:'unknown', reply}`, `{type:'confirm_result', reply, transaction, realokasi_suggestion}`.
- Produces: `<FinanceChatWidget onStateChanged={() => void} />` — calls `onStateChanged` after every successful send/confirm so Task 5's live table can refresh immediately instead of waiting for its next poll tick. Composed into the page by Task 6.

- [ ] **Step 1: Write the failing tests**

`frontend/src/components/finance-wallet/FinanceChatWidget.test.jsx`:
```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FinanceChatWidget from './FinanceChatWidget'
import { financeWalletSendMessage, financeWalletConfirm } from '../../services/api'

vi.mock('../../services/api', () => ({
  financeWalletSendMessage: vi.fn(),
  financeWalletConfirm: vi.fn(),
}))

describe('FinanceChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('sends a message and renders the bot reply', async () => {
    financeWalletSendMessage.mockResolvedValue({
      type: 'transaction',
      reply: 'Tercatat: makan siang - Rp25.000 (Makanan).',
      realokasi_suggestion: null,
    })

    render(<FinanceChatWidget />)

    fireEvent.change(screen.getByPlaceholderText(/makan siang/i), {
      target: { value: 'makan siang 25rb dari mandiri' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim pesan' }))

    await waitFor(() => {
      screen.getByText(/Tercatat: makan siang/)
    })
    expect(financeWalletSendMessage).toHaveBeenCalledWith({
      visitor_tag: expect.any(String),
      message: 'makan siang 25rb dari mandiri',
    })
  })

  it('renders account choice buttons and confirms the chosen account', async () => {
    financeWalletSendMessage.mockResolvedValue({
      type: 'pending_account',
      pending_id: 'pending123',
      reply: 'Ini dari rekening mana?',
      options: ['Mandiri', 'BSI'],
    })
    financeWalletConfirm.mockResolvedValue({
      type: 'confirm_result',
      reply: 'Tercatat: makan siang - Rp25.000 (Makanan).',
      transaction: {},
      realokasi_suggestion: null,
    })

    render(<FinanceChatWidget />)
    fireEvent.change(screen.getByPlaceholderText(/makan siang/i), { target: { value: 'makan siang 25rb' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim pesan' }))

    const mandiriButton = await screen.findByRole('button', { name: 'Mandiri' })
    fireEvent.click(mandiriButton)

    await waitFor(() => {
      expect(financeWalletConfirm).toHaveBeenCalledWith({ pending_id: 'pending123', action: 'accept', choice: 'Mandiri' })
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/components/finance-wallet/FinanceChatWidget.test.jsx`
Expected: FAIL — `Failed to resolve import "./FinanceChatWidget"`

- [ ] **Step 3: Implement the chat widget**

`frontend/src/components/finance-wallet/FinanceChatWidget.jsx`:
```jsx
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { financeWalletSendMessage, financeWalletConfirm } from '../../services/api'
import { getOrCreateVisitorTag } from '../../utils/financeWallet'

const ACCOUNT_OPTIONS = ['Mandiri', 'BSI', 'Jago', 'Dana', 'Gopay', 'OVO']

function makeMessage(role, text, pending = null) {
  return { id: crypto.randomUUID(), role, text, pending }
}

function buildPending(payload) {
  if (payload.type === 'pending_account') {
    return { kind: 'account', pendingId: payload.pending_id, options: payload.options || ACCOUNT_OPTIONS }
  }
  if (payload.type === 'pending_category') {
    return { kind: 'yesno', pendingId: payload.pending_id }
  }
  if (payload.realokasi_suggestion) {
    return { kind: 'yesno', pendingId: payload.realokasi_suggestion.pending_id }
  }
  return null
}

export default function FinanceChatWidget({ onStateChanged }) {
  const [messages, setMessages] = useState([
    makeMessage('bot', 'Halo! Coba tulis transaksi (misal "makan siang 25rb dari mandiri") atau tanya "sisa saldo gua berapa?".'),
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const visitorTag = useRef(getOrCreateVisitorTag())
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setMessages((prev) => [...prev, makeMessage('user', text)])
    setInput('')
    setSending(true)
    try {
      const payload = await financeWalletSendMessage({ visitor_tag: visitorTag.current, message: text })
      setMessages((prev) => [...prev, makeMessage('bot', payload.reply, buildPending(payload))])
      onStateChanged?.()
    } catch (err) {
      const reply = err?.response?.status === 429
        ? (err.response.data?.reply || 'Demo lagi ramai, coba lagi besok.')
        : 'Gagal mengirim pesan. Coba lagi.'
      setMessages((prev) => [...prev, makeMessage('bot', reply)])
    } finally {
      setSending(false)
    }
  }

  const handleConfirm = async (pendingId, action, choice) => {
    setMessages((prev) => prev.map((m) => (m.pending?.pendingId === pendingId ? { ...m, pending: null } : m)))
    setSending(true)
    try {
      const result = await financeWalletConfirm({ pending_id: pendingId, action, choice })
      setMessages((prev) => [...prev, makeMessage('bot', result.reply, buildPending(result))])
      onStateChanged?.()
    } catch {
      setMessages((prev) => [...prev, makeMessage('bot', 'Gagal memproses konfirmasi. Coba lagi.')])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: 480 }}>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'bot' ? 'items-start' : 'items-end'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'bot' ? 'bg-surface-2 text-accent rounded-bl-sm' : 'bg-accent text-background rounded-br-sm'
              }`}
            >
              {msg.text}
            </div>
            {msg.pending?.kind === 'account' && (
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.pending.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleConfirm(msg.pending.pendingId, 'accept', opt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-accent hover:border-accent-dim"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {msg.pending?.kind === 'yesno' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleConfirm(msg.pending.pendingId, 'accept')}
                  className="text-xs px-3 py-1.5 rounded-full bg-accent text-background"
                >
                  Ya
                </button>
                <button
                  onClick={() => handleConfirm(msg.pending.pendingId, 'reject')}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-accent hover:border-accent-dim"
                >
                  Gak usah
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Coba: "makan siang 25rb dari mandiri"'
          className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim"
        />
        <button
          type="submit"
          aria-label="Kirim pesan"
          disabled={sending || !input.trim()}
          className="bg-accent text-background px-3 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/components/finance-wallet/FinanceChatWidget.test.jsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/finance-wallet/FinanceChatWidget.jsx frontend/src/components/finance-wallet/FinanceChatWidget.test.jsx
git commit -m "feat: add Finance Wallet text chat widget with confirmation flows"
```

---

### Task 4: Receipt photo upload

**Files:**
- Modify: `frontend/src/components/finance-wallet/FinanceChatWidget.jsx`
- Modify: `frontend/src/components/finance-wallet/FinanceChatWidget.test.jsx`

**Interfaces:**
- Consumes: `financeWalletSendPhoto` (Task 1), `buildPending` (this file, Task 3).
- Produces: extends `<FinanceChatWidget>` with a photo-upload button next to the text input; no new exported interface.

- [ ] **Step 1: Write the failing test**

Add to `frontend/src/components/finance-wallet/FinanceChatWidget.test.jsx`, inside the existing `describe('FinanceChatWidget', ...)` block, and update the mock at the top of the file to also export `financeWalletSendPhoto`:

Change the `vi.mock` block to:
```js
vi.mock('../../services/api', () => ({
  financeWalletSendMessage: vi.fn(),
  financeWalletSendPhoto: vi.fn(),
  financeWalletConfirm: vi.fn(),
}))
```

Add the import for the new mock at the top with the others:
```js
import { financeWalletSendMessage, financeWalletSendPhoto, financeWalletConfirm } from '../../services/api'
```

Add this test:
```jsx
  it('uploads a receipt photo and renders the bot reply', async () => {
    financeWalletSendPhoto.mockResolvedValue({
      type: 'transaction',
      reply: 'Tercatat: struk indomaret - Rp45.000 (Belanja).',
      realokasi_suggestion: null,
    })

    render(<FinanceChatWidget />)

    const file = new File(['fake-bytes'], 'struk.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/upload struk/i)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      screen.getByText(/Tercatat: struk indomaret/)
    })
    expect(financeWalletSendPhoto).toHaveBeenCalledTimes(1)
    const sentFormData = financeWalletSendPhoto.mock.calls[0][0]
    expect(sentFormData.get('photo')).toBe(file)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/finance-wallet/FinanceChatWidget.test.jsx`
Expected: FAIL — `Unable to find a label with the text of: /upload struk/i`

- [ ] **Step 3: Add the photo upload control**

Modify `frontend/src/components/finance-wallet/FinanceChatWidget.jsx`:

Change the import line:
```js
import { financeWalletSendMessage, financeWalletConfirm } from '../../services/api'
```
to:
```js
import { financeWalletSendMessage, financeWalletSendPhoto, financeWalletConfirm } from '../../services/api'
```

Change the icon import line:
```js
import { Send, Loader2 } from 'lucide-react'
```
to:
```js
import { Send, Loader2, Paperclip } from 'lucide-react'
```

Add this handler inside the component, after `handleSend`:
```js
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || sending) return

    setMessages((prev) => [...prev, makeMessage('user', `📷 ${file.name}`)])
    setSending(true)
    try {
      const form = new FormData()
      form.append('visitor_tag', visitorTag.current)
      form.append('photo', file)
      const payload = await financeWalletSendPhoto(form)
      setMessages((prev) => [...prev, makeMessage('bot', payload.reply, buildPending(payload))])
      onStateChanged?.()
    } catch (err) {
      const reply = err?.response?.status === 429
        ? (err.response.data?.reply || 'Demo lagi ramai, coba lagi besok.')
        : 'Gagal membaca struk. Coba foto yang lebih jelas.'
      setMessages((prev) => [...prev, makeMessage('bot', reply)])
    } finally {
      setSending(false)
    }
  }
```

Change the `<form onSubmit={handleSend} ...>` block to add the upload button before the text input:
```jsx
      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border">
        <label
          htmlFor="finance-wallet-receipt-upload"
          className="flex items-center justify-center w-9 h-9 shrink-0 rounded-lg border border-border text-accent-muted hover:text-accent hover:border-accent-dim cursor-pointer"
          title="Upload struk"
        >
          <Paperclip size={14} />
          <span className="sr-only">Upload struk</span>
          <input
            id="finance-wallet-receipt-upload"
            type="file"
            accept="image/*"
            className="hidden"
            disabled={sending}
            onChange={handlePhotoChange}
          />
        </label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Coba: "makan siang 25rb dari mandiri"'
          className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim"
        />
        <button
          type="submit"
          aria-label="Kirim pesan"
          disabled={sending || !input.trim()}
          className="bg-accent text-background px-3 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/components/finance-wallet/FinanceChatWidget.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/finance-wallet/FinanceChatWidget.jsx frontend/src/components/finance-wallet/FinanceChatWidget.test.jsx
git commit -m "feat: add receipt photo upload to Finance Wallet chat widget"
```

---

### Task 5: Live state table

**Files:**
- Create: `frontend/src/components/finance-wallet/FinanceWalletStateTable.jsx`
- Test: `frontend/src/components/finance-wallet/FinanceWalletStateTable.test.jsx`

**Interfaces:**
- Consumes: `financeWalletGetState` (Task 1), `formatRupiah` (Task 1).
- Produces: `<FinanceWalletStateTable ref={tableRef} />` where `ref.current.refresh()` triggers an immediate re-fetch (called from the page in Task 6 via `FinanceChatWidget`'s `onStateChanged`). Also polls every 5 seconds on its own.

- [ ] **Step 1: Write the failing test**

`frontend/src/components/finance-wallet/FinanceWalletStateTable.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import FinanceWalletStateTable from './FinanceWalletStateTable'
import { financeWalletGetState } from '../../services/api'

vi.mock('../../services/api', () => ({
  financeWalletGetState: vi.fn(),
}))

describe('FinanceWalletStateTable', () => {
  it('fetches and renders wallet state on mount', async () => {
    financeWalletGetState.mockResolvedValue({
      accounts: [{ nama: 'Mandiri', saldo_sekarang: 5000000 }],
      budgets: [{ kategori: 'Makanan', limit_bulanan: 1500000, terpakai_bulan_ini: 25000 }],
      transactions: [],
    })

    render(<FinanceWalletStateTable />)

    await waitFor(() => {
      screen.getByText('Mandiri')
    })
    expect(financeWalletGetState).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/finance-wallet/FinanceWalletStateTable.test.jsx`
Expected: FAIL — `Failed to resolve import "./FinanceWalletStateTable"`

- [ ] **Step 3: Implement the state table**

`frontend/src/components/finance-wallet/FinanceWalletStateTable.jsx`:
```jsx
import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { financeWalletGetState } from '../../services/api'
import { formatRupiah } from '../../utils/financeWallet'

const POLL_INTERVAL_MS = 5000

const FinanceWalletStateTable = forwardRef(function FinanceWalletStateTable(_props, ref) {
  const [state, setState] = useState({ accounts: [], budgets: [], transactions: [] })
  const [error, setError] = useState(null)

  const refresh = useCallback(() => {
    financeWalletGetState()
      .then(setState)
      .catch(() => setError('Gagal memuat data terbaru.'))
  }, [])

  useImperativeHandle(ref, () => ({ refresh }))

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-accent mb-3">Saldo Rekening</h3>
        <div className="space-y-2">
          {state.accounts.map((acc) => (
            <div key={acc.nama} className="flex justify-between text-sm">
              <span className="text-accent-muted">{acc.nama}</span>
              <span className="text-accent font-medium">{formatRupiah(acc.saldo_sekarang)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-accent mb-3">Budget Kategori</h3>
        <div className="space-y-3">
          {state.budgets.map((b) => {
            const persen = b.limit_bulanan > 0
              ? Math.min(100, Math.round((b.terpakai_bulan_ini / b.limit_bulanan) * 100))
              : 0
            const barColor = persen >= 90 ? 'bg-red-500' : persen >= 80 ? 'bg-yellow-500' : 'bg-accent'
            return (
              <div key={b.kategori}>
                <div className="flex justify-between text-xs text-accent-muted mb-1">
                  <span>{b.kategori}</span>
                  <span>{formatRupiah(b.terpakai_bulan_ini)} / {formatRupiah(b.limit_bulanan)}</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${persen}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 md:col-span-2">
        <h3 className="text-sm font-semibold text-accent mb-3">Transaksi Terbaru</h3>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {state.transactions.length === 0 && (
            <p className="text-xs text-accent-muted">Belum ada transaksi. Coba kirim pesan di chat sebelah.</p>
          )}
          {state.transactions.map((tx) => (
            <div key={tx._id} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
              <div>
                <p className="text-accent">{tx.deskripsi}</p>
                <p className="text-xs text-accent-muted">{tx.kategori} · {tx.rekening} · {tx.sumber} · #{tx.visitor_tag}</p>
              </div>
              <span className={tx.tipe === 'Expense' ? 'text-red-400' : 'text-green-400'}>
                {tx.tipe === 'Expense' ? '-' : '+'}{formatRupiah(tx.jumlah)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default FinanceWalletStateTable
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/finance-wallet/FinanceWalletStateTable.test.jsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/finance-wallet/FinanceWalletStateTable.jsx frontend/src/components/finance-wallet/FinanceWalletStateTable.test.jsx
git commit -m "feat: add Finance Wallet live state table with polling"
```

---

### Task 6: Assemble the page and manual QA

**Files:**
- Modify: `frontend/src/pages/FinanceWallet.jsx`

**Interfaces:**
- Consumes: `FinanceWalletCaseStudy` (Task 2), `FinanceChatWidget` (Tasks 3–4), `FinanceWalletStateTable` (Task 5), `getProfile` (existing, from `frontend/src/services/api.js`) for the `Footer`.
- Produces: the finished `/finance-wallet` page. Nothing else depends on this task.

- [ ] **Step 1: Replace the page stub with the full composition**

Replace the full contents of `frontend/src/pages/FinanceWallet.jsx`:
```jsx
import { useEffect, useRef, useState } from 'react'
import { getProfile } from '../services/api'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import FinanceWalletCaseStudy from '../components/finance-wallet/FinanceWalletCaseStudy'
import FinanceChatWidget from '../components/finance-wallet/FinanceChatWidget'
import FinanceWalletStateTable from '../components/finance-wallet/FinanceWalletStateTable'

export default function FinanceWallet() {
  const [profile, setProfile] = useState(null)
  const tableRef = useRef(null)

  useEffect(() => {
    getProfile().then(({ data }) => setProfile(data)).catch(() => setProfile(null))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <FinanceWalletCaseStudy />

        <div className="grid gap-6 lg:grid-cols-[360px_1fr] items-start">
          <FinanceChatWidget onStateChanged={() => tableRef.current?.refresh()} />
          <FinanceWalletStateTable ref={tableRef} />
        </div>
      </div>

      <Footer profile={profile} />
    </div>
  )
}
```

- [ ] **Step 2: Run the full frontend test suite to check for regressions**

Run: `cd frontend && npm run test`
Expected: PASS (all tests, including `compareResults.test.js` and every Finance Wallet test from Tasks 1, 3, 4, 5)

- [ ] **Step 3: Manual browser QA (both backend and frontend must be running)**

Start the backend: `cd backend && php artisan serve --port=8001`
Start the frontend: `cd frontend && npm run dev`
Visit `http://localhost:3001/finance-wallet` and walk through:
1. Send `makan siang 25rb` (no account named) → expect account-choice buttons; click `Mandiri` → expect a "Tercatat" confirmation and the live table's "Saldo Rekening" / "Transaksi Terbaru" panels to update within ~5 seconds without a manual page refresh.
2. Send `gaji bulan ini 5jt dari mandiri` → expect all budget category limits in the "Budget Kategori" panel to increase.
3. Send `sisa saldo gua berapa?` → expect a balance summary reply.
4. Send `bikin kategori baru donasi limit 200rb` → expect a Ya/Gak usah confirmation; click `Ya` → expect "Donasi" to eventually appear once a transaction is logged against it, and no error in the browser console.
5. Upload a photo via the paperclip button (any JPG) → expect either a parsed transaction reply or a graceful error message (Gemini may fail to parse an arbitrary test image — that's an acceptable outcome as long as no crash occurs).
6. Repeatedly send expenses in one category (e.g. `Makanan`) until its usage crosses 80–90% of its limit → expect a reallocation-suggestion Ya/Gak usah prompt to appear, and confirm both the accept and reject paths update (or don't update) the budget limits as expected.
7. Click "Download workflow n8n (JSON)" and "Tonton live feed di Telegram" — confirm both open/download correctly.
8. Check the browser console throughout for errors — expect none.

Report any failures found during this pass before considering the feature done — do not claim completion without having actually run through this checklist in a browser.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/FinanceWallet.jsx
git commit -m "feat: assemble the Finance Wallet demo page"
```

---

## Manual follow-up (not code — do after both plans are deployed)

1. Rotate the three credentials that were exposed during design (Telegram bot token, Gemini API key, Notion integration token) if not already done.
2. Set the real values for `FINANCE_DEMO_TELEGRAM_BOT_TOKEN`, `FINANCE_DEMO_TELEGRAM_GROUP_CHAT_ID`, `FINANCE_DEMO_GEMINI_API_KEY` in the Render backend service's environment variables (never commit them).
3. Apply the safeguard filter node to the **live** n8n instance (backend-plan Task 9, Step 9).
4. In the admin panel (`/binn/projects`), add a new `Project` entry for "Finance Wallet" with `live_url` set to `/finance-wallet`, so it appears as a project card in the portfolio's Projects section.
5. Verify the Render Cron Job (or its fallback) is actually running in production a day or two after deploy — check that the demo wallet resets at midnight WIB.
