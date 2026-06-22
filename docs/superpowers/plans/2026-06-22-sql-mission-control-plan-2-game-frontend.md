# SQL Mission Control — Plan 2: Frontend Game + Navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** Plan 1 (Backend + Admin) must be complete and the backend running. The `GET /api/sql-game/config` endpoint must return at least one active dataset with `schema_sql`, `seed_sql`, and at least one mission.

**Goal:** Build the SQL Mission Control game page with sql.js in-browser SQLite execution, CodeMirror SQL editor, validation engine, and wire the game into the portfolio navbar and Projects section.

**Architecture:** A Zustand store holds the sql.js Database instance and all game state. `useDatabase` initialises sql.js from a dataset's `schema_sql`+`seed_sql`. `compareResults` validates user output against the `solutionQuery` result. The game page is a 3-zone layout (sidebar / editor+output / footer) at route `/sql-mission-control`. The existing portfolio Navbar gains a "SQL Lab" item; the Projects section gains a special card.

**Tech Stack:** sql.js (SQLite WASM, in-browser), Zustand, @uiw/react-codemirror + @codemirror/lang-sql (CodeMirror 6), Vitest + jsdom (unit tests), @dnd-kit already installed in Plan 1.

---

## File Map

**Install (new):**
- `zustand`
- `@uiw/react-codemirror @codemirror/lang-sql @codemirror/theme-one-dark`
- `sql.js`
- `vitest @vitest/ui jsdom @testing-library/react`

**Copy to public:**
- `frontend/public/sql-wasm.wasm` (from `node_modules/sql.js/dist/sql-wasm.wasm`)

**Create:**
- `frontend/src/engine/compareResults.js`
- `frontend/src/engine/compareResults.test.js`
- `frontend/src/engine/runQuery.js`
- `frontend/src/store/useSqlGameStore.js`
- `frontend/src/hooks/useDatabase.js`
- `frontend/src/hooks/useSqlGame.js`
- `frontend/src/components/sql-game/ui/Button.jsx`
- `frontend/src/components/sql-game/ui/TablePill.jsx`
- `frontend/src/components/sql-game/ProgressBar.jsx`
- `frontend/src/components/sql-game/sidebar/UserCard.jsx`
- `frontend/src/components/sql-game/sidebar/MissionBriefing.jsx`
- `frontend/src/components/sql-game/sidebar/ObjectivesList.jsx`
- `frontend/src/components/sql-game/sidebar/TablePills.jsx`
- `frontend/src/components/sql-game/editor/SqlEditor.jsx`
- `frontend/src/components/sql-game/editor/EditorToolbar.jsx`
- `frontend/src/components/sql-game/output/EmptyState.jsx`
- `frontend/src/components/sql-game/output/ResultGrid.jsx`
- `frontend/src/components/sql-game/output/TerminalOutput.jsx`
- `frontend/src/components/sql-game/StageFooter.jsx`
- `frontend/src/components/sql-game/DatabaseSelector.jsx`
- `frontend/src/components/sql-game/GameShell.jsx`
- `frontend/src/pages/SqlMissionControl.jsx`

**Modify:**
- `frontend/vite.config.js` — add Vitest config + sql.js WASM headers
- `frontend/package.json` — add test script
- `frontend/src/App.jsx` — add `/sql-mission-control` route
- `frontend/src/components/layout/Navbar.jsx` — add "SQL Lab" item
- `frontend/src/components/sections/Projects.jsx` — add SQL MC project card

---

## Task 1: Install Packages + WASM Setup

**Files:**
- Modify: `frontend/vite.config.js`
- Modify: `frontend/package.json`

- [ ] **Step 1: Install packages**

```bash
cd frontend
npm install zustand sql.js @uiw/react-codemirror @codemirror/lang-sql @codemirror/theme-one-dark
npm install -D vitest @vitest/ui jsdom @testing-library/react
```

- [ ] **Step 2: Copy WASM to public/**

```bash
cp node_modules/sql.js/dist/sql-wasm.wasm public/sql-wasm.wasm
```

- [ ] **Step 3: Update vite.config.js**

Read the existing `vite.config.js` first, then add Vitest config and WASM CORS headers:

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Allow WASM content-type in dev server
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // Vitest configuration
  test: {
    environment: 'jsdom',
    globals: true,
  },
  optimizeDeps: {
    exclude: ['sql.js'],
  },
})
```

- [ ] **Step 4: Add test script to package.json**

In `frontend/package.json`, add to the `"scripts"` section:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Commit**

```bash
git add frontend/vite.config.js frontend/package.json frontend/package-lock.json frontend/public/sql-wasm.wasm
git commit -m "feat(sql-game): install sql.js, zustand, codemirror, vitest; copy WASM to public"
```

---

## Task 2: compareResults Engine + Unit Tests

**Files:**
- Create: `frontend/src/engine/compareResults.js`
- Create: `frontend/src/engine/compareResults.test.js`

- [ ] **Step 1: Write the failing tests first**

```js
// frontend/src/engine/compareResults.test.js
import { describe, it, expect } from 'vitest'
import { compareResults } from './compareResults'

const makeResult = (columns, rows) => ({ columns, rows })

describe('compareResults — ordered', () => {
  it('passes when rows match in order', () => {
    const user = makeResult(['name', 'score'], [['Alice', '90'], ['Bob', '80']])
    const exp  = makeResult(['name', 'score'], [['Alice', '90'], ['Bob', '80']])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })

  it('fails when row order differs', () => {
    const user = makeResult(['name', 'score'], [['Bob', '80'], ['Alice', '90']])
    const exp  = makeResult(['name', 'score'], [['Alice', '90'], ['Bob', '80']])
    const r = compareResults(user, exp, { ordered: true })
    expect(r.pass).toBe(false)
    expect(r.diffs.length).toBeGreaterThan(0)
  })
})

describe('compareResults — unordered', () => {
  it('passes when rows match as a set regardless of order', () => {
    const user = makeResult(['name'], [['Bob'], ['Alice']])
    const exp  = makeResult(['name'], [['Alice'], ['Bob']])
    expect(compareResults(user, exp, { ordered: false }).pass).toBe(true)
  })

  it('fails when a row is missing', () => {
    const user = makeResult(['name'], [['Alice']])
    const exp  = makeResult(['name'], [['Alice'], ['Bob']])
    expect(compareResults(user, exp, { ordered: false }).pass).toBe(false)
  })
})

describe('compareResults — NULL handling', () => {
  it('treats null as null, not as 0 or empty string', () => {
    const user = makeResult(['val'], [[null]])
    const exp  = makeResult(['val'], [[null]])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })

  it('fails when user returns 0 but expected is null', () => {
    const user = makeResult(['val'], [['0']])
    const exp  = makeResult(['val'], [[null]])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(false)
  })
})

describe('compareResults — numeric coercion', () => {
  it('treats "3" and 3 as equal', () => {
    const user = makeResult(['n'], [['3']])
    const exp  = makeResult(['n'], [[3]])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })
})

describe('compareResults — float tolerance', () => {
  it('rounds to 2 decimal places before comparing', () => {
    const user = makeResult(['avg'], [['3.14159']])
    const exp  = makeResult(['avg'], [[3.14]])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })
})

describe('compareResults — column matching', () => {
  it('is case-insensitive for column names', () => {
    const user = makeResult(['NAME', 'SCORE'], [['Alice', '90']])
    const exp  = makeResult(['name', 'score'], [['Alice', '90']])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })

  it('returns checkedCols listing which objective columns are present', () => {
    const user = makeResult(['nama', 'jumlah'], [['Alice', '5']])
    const exp  = makeResult(['nama', 'jumlah'], [['Alice', '5']])
    const r = compareResults(user, exp, { ordered: true, objectives: ['nama', 'jumlah', 'missing_col'] })
    expect(r.checkedCols).toEqual({ nama: true, jumlah: true, missing_col: false })
  })

  it('fails and reports missing column when required column absent', () => {
    const user = makeResult(['name'], [['Alice']])
    const exp  = makeResult(['name', 'score'], [['Alice', '90']])
    const r = compareResults(user, exp, { ordered: true })
    expect(r.pass).toBe(false)
    expect(r.diffs.some(d => d.includes('score'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to confirm they all FAIL**

```bash
cd frontend && npm test
# Expected: all tests FAIL (compareResults is not defined)
```

- [ ] **Step 3: Implement compareResults**

```js
// frontend/src/engine/compareResults.js

/**
 * @param {{ columns: string[], rows: any[][] }} userResult
 * @param {{ columns: string[], rows: any[][] }} expectedResult
 * @param {{ ordered: boolean, objectives?: string[] }} options
 * @returns {{ pass: boolean, diffs: string[], checkedCols: Record<string, boolean> }}
 */
export function compareResults(userResult, expectedResult, { ordered, objectives = [] }) {
  const diffs = []

  // Normalise column names to lowercase
  const userCols = userResult.columns.map(c => c.toLowerCase())
  const expCols  = expectedResult.columns.map(c => c.toLowerCase())

  // Check all expected columns exist in user result
  for (const col of expCols) {
    if (!userCols.includes(col)) {
      diffs.push(`Kolom "${col}" tidak ditemukan dalam hasil query kamu`)
    }
  }

  if (diffs.length > 0) {
    return { pass: false, diffs, checkedCols: buildCheckedCols(userCols, objectives) }
  }

  // Build column index map: expCol -> userColIndex
  const colMap = {}
  for (const col of expCols) {
    colMap[col] = userCols.indexOf(col)
  }

  // Normalise a row to match expected column order
  const normalise = (row, srcCols) => {
    const srcLower = srcCols.map(c => c.toLowerCase())
    return expCols.map(col => normaliseValue(row[srcLower.indexOf(col)]))
  }

  const userRows = userResult.rows.map(r => normalise(r, userResult.columns))
  const expRows  = expectedResult.rows.map(r => normalise(r, expectedResult.columns))

  if (ordered) {
    if (userRows.length !== expRows.length) {
      diffs.push(`Jumlah baris berbeda: kamu ${userRows.length}, seharusnya ${expRows.length}`)
    } else {
      for (let i = 0; i < expRows.length; i++) {
        if (!rowsEqual(userRows[i], expRows[i])) {
          diffs.push(`Baris ke-${i + 1} tidak sesuai`)
          if (diffs.length >= 3) break // cap at 3 diffs
        }
      }
    }
  } else {
    // Set comparison: sort canonically then compare
    const sortKey = rows => rows.map(r => JSON.stringify(r)).sort()
    const userSorted = sortKey(userRows)
    const expSorted  = sortKey(expRows)

    if (userSorted.length !== expSorted.length) {
      diffs.push(`Jumlah baris berbeda: kamu ${userRows.length}, seharusnya ${expRows.length}`)
    } else {
      for (let i = 0; i < expSorted.length; i++) {
        if (userSorted[i] !== expSorted[i]) {
          diffs.push('Terdapat baris yang tidak cocok (urutan tidak diuji, tapi isi harus sama)')
          break
        }
      }
    }
  }

  const pass = diffs.length === 0
  return { pass, diffs, checkedCols: buildCheckedCols(userCols, objectives) }
}

function normaliseValue(v) {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (s === '') return null
  const n = Number(s)
  if (!isNaN(n)) return Math.round(n * 100) / 100
  return s
}

function rowsEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] === null && b[i] === null) continue
    if (a[i] !== b[i]) return false
  }
  return true
}

function buildCheckedCols(userCols, objectives) {
  const result = {}
  for (const obj of objectives) {
    result[obj] = userCols.includes(obj.toLowerCase())
  }
  return result
}
```

- [ ] **Step 4: Run tests — all must PASS**

```bash
npm test
# Expected: all 9 test cases PASS
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/engine/compareResults.js frontend/src/engine/compareResults.test.js
git commit -m "feat(sql-game): add compareResults engine with full unit test suite"
```

---

## Task 3: runQuery + Zustand Store

**Files:**
- Create: `frontend/src/engine/runQuery.js`
- Create: `frontend/src/store/useSqlGameStore.js`

- [ ] **Step 1: Create runQuery**

```js
// frontend/src/engine/runQuery.js

/**
 * Execute a SQL query against a sql.js Database instance.
 * @param {import('sql.js').Database} db
 * @param {string} sql
 * @returns {{ columns: string[], rows: any[][] } | { error: string }}
 */
export function runQuery(db, sql) {
  try {
    const results = db.exec(sql)
    if (!results || results.length === 0) {
      return { columns: [], rows: [] }
    }
    const { columns, values } = results[0]
    return { columns, rows: values }
  } catch (err) {
    return { error: err.message }
  }
}
```

- [ ] **Step 2: Create Zustand store**

```js
// frontend/src/store/useSqlGameStore.js
import { create } from 'zustand'

const RANK_PROGRESSION = [
  'Script Kiddie',
  'Query Runner',
  'Join Master',
  'Index Wizard',
]

export const useSqlGameStore = create((set, get) => ({
  // From API
  datasets: [],
  missions: [],

  // Session state
  selectedDataset: null,
  db: null,
  currentMissionId: null,
  solvedMissions: [],   // array of mission ids
  rank: RANK_PROGRESSION[0],
  lastResult: null,     // { columns, rows } | { error }
  queryText: '',
  isLoading: true,
  isInitializingDb: false,

  // Actions
  setApiData: (datasets, missions) => set({ datasets, missions, isLoading: false }),

  setQueryText: (text) => set({ queryText: text }),

  setLastResult: (result) => set({ lastResult: result }),

  selectDataset: (dataset) => {
    const { missions } = get()
    const datasetMissions = missions
      .filter(m => m.dataset_id === dataset.id)
      .sort((a, b) => a.stage_order - b.stage_order)
    const first = datasetMissions[0] ?? null
    set({
      selectedDataset: dataset,
      currentMissionId: first?.id ?? null,
      solvedMissions: [],
      rank: RANK_PROGRESSION[0],
      lastResult: null,
      queryText: first?.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
    })
  },

  setDb: (db) => set({ db, isInitializingDb: false }),

  setInitializingDb: (v) => set({ isInitializingDb: v }),

  getCurrentMission: () => {
    const { missions, currentMissionId } = get()
    return missions.find(m => m.id === currentMissionId) ?? null
  },

  getDatasetMissions: () => {
    const { missions, selectedDataset } = get()
    if (!selectedDataset) return []
    return missions
      .filter(m => m.dataset_id === selectedDataset.id)
      .sort((a, b) => a.stage_order - b.stage_order)
  },

  solveMission: (missionId) => {
    const { solvedMissions, missions, selectedDataset } = get()
    if (solvedMissions.includes(missionId)) return

    const solved = [...solvedMissions, missionId]
    const mission = missions.find(m => m.id === missionId)

    // Advance rank if mission unlocks one
    let rank = get().rank
    if (mission?.rank_unlock) rank = mission.rank_unlock

    set({ solvedMissions: solved, rank })
  },

  goToNextMission: () => {
    const { getDatasetMissions, currentMissionId } = get()
    const ordered = getDatasetMissions()
    const idx = ordered.findIndex(m => m.id === currentMissionId)
    if (idx < ordered.length - 1) {
      const next = ordered[idx + 1]
      set({
        currentMissionId: next.id,
        lastResult: null,
        queryText: next.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
      })
    }
  },

  goToPrevMission: () => {
    const { getDatasetMissions, currentMissionId } = get()
    const ordered = getDatasetMissions()
    const idx = ordered.findIndex(m => m.id === currentMissionId)
    if (idx > 0) {
      const prev = ordered[idx - 1]
      set({
        currentMissionId: prev.id,
        lastResult: null,
        queryText: prev.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
      })
    }
  },
}))
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/engine/runQuery.js frontend/src/store/useSqlGameStore.js
git commit -m "feat(sql-game): add runQuery engine and Zustand game store"
```

---

## Task 4: useDatabase + useSqlGame Hooks

**Files:**
- Create: `frontend/src/hooks/useDatabase.js`
- Create: `frontend/src/hooks/useSqlGame.js`

- [ ] **Step 1: Create useDatabase**

```js
// frontend/src/hooks/useDatabase.js
import { useEffect } from 'react'
import initSqlJs from 'sql.js'
import { useSqlGameStore } from '../store/useSqlGameStore'

export function useDatabase() {
  const { selectedDataset, setDb, setInitializingDb, db } = useSqlGameStore()

  useEffect(() => {
    if (!selectedDataset) return

    let cancelled = false
    // Destroy previous instance
    if (db) {
      try { db.close() } catch (_) {}
    }

    setInitializingDb(true)

    initSqlJs({ locateFile: () => '/sql-wasm.wasm' })
      .then(SQL => {
        if (cancelled) return
        const newDb = new SQL.Database()
        // Run schema then seed
        newDb.run(selectedDataset.schema_sql)
        if (selectedDataset.seed_sql) {
          newDb.run(selectedDataset.seed_sql)
        }
        setDb(newDb)
      })
      .catch(err => {
        console.error('sql.js init failed:', err)
        if (!cancelled) setInitializingDb(false)
      })

    return () => { cancelled = true }
  }, [selectedDataset?.id])
}
```

- [ ] **Step 2: Create useSqlGame**

```js
// frontend/src/hooks/useSqlGame.js
import { useSqlGameStore } from '../store/useSqlGameStore'
import { runQuery } from '../engine/runQuery'
import { compareResults } from '../engine/compareResults'

export function useSqlGame() {
  const store = useSqlGameStore()

  const handleRun = () => {
    const { db, queryText } = store
    if (!db || !queryText.trim()) return
    const result = runQuery(db, queryText)
    store.setLastResult(result)
  }

  const handleDeploy = () => {
    const { db, queryText } = store
    const mission = store.getCurrentMission()
    if (!db || !queryText.trim() || !mission) return

    // Run user query
    const userResult = runQuery(db, queryText)
    if (userResult.error) {
      store.setLastResult(userResult)
      return
    }

    // Run solution query
    const expectedResult = runQuery(db, mission.solution_query)
    if (expectedResult.error) {
      store.setLastResult({ error: `Kesalahan internal: ${expectedResult.error}` })
      return
    }

    const objectiveCols = (mission.objectives || []).map(o => o.col)
    const { pass, diffs, checkedCols } = compareResults(
      userResult,
      expectedResult,
      { ordered: mission.ordered, objectives: objectiveCols }
    )

    store.setLastResult({
      ...userResult,
      deployResult: { pass, diffs, checkedCols },
    })

    if (pass) {
      store.solveMission(mission.id)
    }
  }

  return { handleRun, handleDeploy }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useDatabase.js frontend/src/hooks/useSqlGame.js
git commit -m "feat(sql-game): add useDatabase (sql.js init) and useSqlGame (run/deploy) hooks"
```

---

## Task 5: UI Primitives

**Files:**
- Create: `frontend/src/components/sql-game/ui/Button.jsx`
- Create: `frontend/src/components/sql-game/ui/TablePill.jsx`
- Create: `frontend/src/components/sql-game/ProgressBar.jsx`

- [ ] **Step 1: Create Button**

```jsx
// frontend/src/components/sql-game/ui/Button.jsx
const variants = {
  primary:   'bg-sql-primary text-background font-bold hover:opacity-90 shadow-[0_0_12px_rgba(0,255,65,0.3)]',
  secondary: 'border border-sql-secondary text-sql-secondary hover:bg-sql-secondary/10',
  outlined:  'border border-border text-accent hover:border-accent',
  inverted:  'bg-[#E0D7FF] text-background hover:opacity-90',
}

export function Button({ variant = 'outlined', className = '', children, ...props }) {
  return (
    <button
      className={`px-4 py-1.5 rounded text-sm font-mono transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create TablePill**

```jsx
// frontend/src/components/sql-game/ui/TablePill.jsx
export function TablePill({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono
      bg-sql-tertiary/10 border border-sql-tertiary/40 text-sql-tertiary
      shadow-[0_0_6px_rgba(255,0,229,0.2)]">
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Create ProgressBar**

```jsx
// frontend/src/components/sql-game/ProgressBar.jsx
export function ProgressBar({ solved, total }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0
  return (
    <div className="w-full h-0.5 bg-border relative">
      <div
        className="h-full bg-sql-primary transition-all duration-500 shadow-[0_0_6px_rgba(0,255,65,0.5)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/sql-game/ui/Button.jsx \
        frontend/src/components/sql-game/ui/TablePill.jsx \
        frontend/src/components/sql-game/ProgressBar.jsx
git commit -m "feat(sql-game): add Button, TablePill, ProgressBar UI components"
```

---

## Task 6: Sidebar Components

**Files:**
- Create: `frontend/src/components/sql-game/sidebar/UserCard.jsx`
- Create: `frontend/src/components/sql-game/sidebar/MissionBriefing.jsx`
- Create: `frontend/src/components/sql-game/sidebar/ObjectivesList.jsx`
- Create: `frontend/src/components/sql-game/sidebar/TablePills.jsx`

- [ ] **Step 1: Create all four sidebar components**

```jsx
// frontend/src/components/sql-game/sidebar/UserCard.jsx
import { User } from 'lucide-react'

export function UserCard({ rank }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-accent-muted" />
      </div>
      <div>
        <p className="text-xs font-mono text-accent">SQL INTERN #042</p>
        <p className="text-xs font-mono text-sql-secondary">Rank: {rank}</p>
      </div>
    </div>
  )
}
```

```jsx
// frontend/src/components/sql-game/sidebar/MissionBriefing.jsx
import { FileText } from 'lucide-react'

export function MissionBriefing({ title, briefing }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-sql-dim flex-shrink-0" />
        <span className="text-xs font-mono text-accent font-semibold truncate">{title}</span>
      </div>
      <p className="text-xs font-mono text-accent-muted leading-relaxed border-l-2 border-border pl-3">
        "{briefing}"
      </p>
    </div>
  )
}
```

```jsx
// frontend/src/components/sql-game/sidebar/ObjectivesList.jsx
import { CheckSquare, Square } from 'lucide-react'

export function ObjectivesList({ objectives, checkedCols = {} }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-mono text-sql-dim uppercase tracking-widest mb-2">Mission Objectives</p>
      {objectives.map((obj, i) => {
        const done = checkedCols[obj.col] === true
        return (
          <div key={i} className="flex items-start gap-2">
            {done
              ? <CheckSquare size={13} className="text-sql-primary flex-shrink-0 mt-0.5 drop-shadow-[0_0_4px_rgba(0,255,65,0.6)]" />
              : <Square size={13} className="text-sql-dim flex-shrink-0 mt-0.5" />}
            <span className={`text-xs font-mono leading-relaxed ${done ? 'text-sql-primary' : 'text-accent-muted'}`}>
              <span className="text-accent">{obj.col}</span>
              {' — '}{obj.desc}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

```jsx
// frontend/src/components/sql-game/sidebar/TablePills.jsx
import { TablePill } from '../ui/TablePill'

export function TablePills({ tables, orderingHint }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tables.map(t => <TablePill key={t}>{t}</TablePill>)}
      </div>
      {orderingHint && (
        <p className="text-xs font-mono text-sql-tertiary">{orderingHint}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/sql-game/sidebar/
git commit -m "feat(sql-game): add sidebar components (UserCard, Briefing, Objectives, TablePills)"
```

---

## Task 7: Editor Components

**Files:**
- Create: `frontend/src/components/sql-game/editor/SqlEditor.jsx`
- Create: `frontend/src/components/sql-game/editor/EditorToolbar.jsx`

- [ ] **Step 1: Create SqlEditor**

```jsx
// frontend/src/components/sql-game/editor/SqlEditor.jsx
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

const sqlGameTheme = EditorView.theme({
  '&': { background: '#111111 !important', fontSize: '13px' },
  '.cm-content': { fontFamily: '"JetBrains Mono", monospace', padding: '12px 0' },
  '.cm-line': { padding: '0 12px' },
  '.cm-gutters': { background: '#0a0a0a', borderRight: '1px solid #2a2a2a' },
  '.cm-activeLineGutter': { background: '#1a1a1a' },
  '.cm-activeLine': { background: '#1a1a1a' },
  '.cm-cursor': { borderLeftColor: '#00FF41' },
  '.cm-selectionBackground': { background: 'rgba(0,255,65,0.15) !important' },
})

export function SqlEditor({ value, onChange }) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[sql(), sqlGameTheme]}
      theme={oneDark}
      basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: true }}
      className="flex-1 min-h-0 overflow-hidden border border-border rounded"
    />
  )
}
```

- [ ] **Step 2: Create EditorToolbar**

```jsx
// frontend/src/components/sql-game/editor/EditorToolbar.jsx
import { Button } from '../ui/Button'
import { Loader2 } from 'lucide-react'

export function EditorToolbar({ charCount, onRun, onDeploy, isInitializing }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border border-border border-t-0 rounded-b bg-surface">
      <span className="text-xs font-mono text-sql-dim">
        Characters: {charCount} / CPU: Normal
      </span>
      <div className="flex gap-2">
        {isInitializing ? (
          <span className="flex items-center gap-1.5 text-xs font-mono text-sql-dim">
            <Loader2 size={12} className="animate-spin" /> Initializing DB...
          </span>
        ) : (
          <>
            <Button variant="secondary" onClick={onRun}>RUN QUERY</Button>
            <Button variant="primary" onClick={onDeploy}>DEPLOY QUERY</Button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sql-game/editor/
git commit -m "feat(sql-game): add SqlEditor (CodeMirror 6) and EditorToolbar components"
```

---

## Task 8: Output Components

**Files:**
- Create: `frontend/src/components/sql-game/output/EmptyState.jsx`
- Create: `frontend/src/components/sql-game/output/ResultGrid.jsx`
- Create: `frontend/src/components/sql-game/output/TerminalOutput.jsx`

- [ ] **Step 1: Create all three output components**

```jsx
// frontend/src/components/sql-game/output/EmptyState.jsx
import { Database } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-sql-dim">
      <Database size={28} className="opacity-30" />
      <div className="text-center font-mono">
        <p className="text-xs tracking-widest uppercase">AWAITING INSTRUCTIONS.</p>
        <p className="text-xs tracking-widest uppercase opacity-60 mt-1">EXECUTE QUERY TO POPULATE DATA GRID.</p>
      </div>
    </div>
  )
}
```

```jsx
// frontend/src/components/sql-game/output/ResultGrid.jsx
export function ResultGrid({ columns, rows }) {
  if (!columns || columns.length === 0) return (
    <p className="text-xs font-mono text-sql-dim p-3">Query executed — no rows returned.</p>
  )

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs font-mono border-collapse">
        <thead className="sticky top-0 bg-surface z-10">
          <tr>
            {columns.map(col => (
              <th key={col} className="text-left px-3 py-2 text-sql-secondary border-b border-border whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-surface-2 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 border-b border-border/40 text-accent whitespace-nowrap">
                  {cell === null ? <span className="text-sql-dim italic">NULL</span> : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

```jsx
// frontend/src/components/sql-game/output/TerminalOutput.jsx
import { EmptyState } from './EmptyState'
import { ResultGrid } from './ResultGrid'
import { CheckCircle, XCircle, Terminal } from 'lucide-react'

export function TerminalOutput({ result }) {
  const deployResult = result?.deployResult

  return (
    <div className="flex flex-col h-full border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <Terminal size={12} className="text-sql-dim ml-2" />
          <span className="text-xs font-mono text-sql-dim">TERMINAL OUTPUT</span>
        </div>
        {deployResult && (
          deployResult.pass
            ? <span className="flex items-center gap-1 text-xs font-mono text-sql-primary">
                <CheckCircle size={12} /> MISSION COMPLETE
              </span>
            : <span className="flex items-center gap-1 text-xs font-mono text-red-400">
                <XCircle size={12} /> VALIDATION FAILED
              </span>
        )}
      </div>

      {/* Error state */}
      {result?.error && (
        <div className="p-3 flex-shrink-0">
          <p className="text-xs font-mono text-red-400 whitespace-pre-wrap">{result.error}</p>
        </div>
      )}

      {/* Deploy diffs */}
      {deployResult && !deployResult.pass && deployResult.diffs.length > 0 && (
        <div className="p-3 border-b border-border flex-shrink-0">
          {deployResult.diffs.map((d, i) => (
            <p key={i} className="text-xs font-mono text-red-400">▶ {d}</p>
          ))}
        </div>
      )}

      {/* Result grid or empty state */}
      <div className="flex-1 min-h-0">
        {!result || (!result.columns && !result.error) ? (
          <EmptyState />
        ) : result.columns ? (
          <ResultGrid columns={result.columns} rows={result.rows} />
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/sql-game/output/
git commit -m "feat(sql-game): add output components (EmptyState, ResultGrid, TerminalOutput)"
```

---

## Task 9: StageFooter + DatabaseSelector

**Files:**
- Create: `frontend/src/components/sql-game/StageFooter.jsx`
- Create: `frontend/src/components/sql-game/DatabaseSelector.jsx`

- [ ] **Step 1: Create StageFooter**

```jsx
// frontend/src/components/sql-game/StageFooter.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function StageFooter({ onPrev, onNext, canPrev, canNext }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface flex-shrink-0">
      <span className="text-xs font-mono text-sql-dim">SYSTEM VERSION 1.0.8-BIT</span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-1 px-3 py-1 text-xs font-mono border border-border rounded
            text-accent-muted hover:text-accent hover:border-accent transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={12} /> PREVIOUS
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-1 px-3 py-1 text-xs font-mono border rounded transition
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:border-sql-primary enabled:text-sql-primary enabled:shadow-[0_0_8px_rgba(0,255,65,0.2)]
            enabled:hover:bg-sql-primary/10"
        >
          NEXT STAGE <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create DatabaseSelector**

```jsx
// frontend/src/components/sql-game/DatabaseSelector.jsx
import { Database } from 'lucide-react'

export function DatabaseSelector({ datasets, onSelect }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <p className="text-sql-primary font-mono text-sm tracking-widest uppercase mb-2">▶ SQL MISSION CONTROL</p>
          <h1 className="text-2xl font-display font-bold text-accent">SELECT DATABASE</h1>
          <p className="text-accent-muted font-mono text-sm mt-2">Pilih dataset untuk mulai latihan SQL</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {datasets.map(d => (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className="text-left p-5 bg-surface border border-border rounded-xl
                hover:border-sql-primary hover:shadow-[0_0_16px_rgba(0,255,65,0.1)]
                transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <Database size={18} className="text-sql-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-accent font-mono font-semibold text-sm group-hover:text-sql-primary transition-colors">
                    {d.name}
                  </p>
                  {d.description && (
                    <p className="text-xs text-accent-muted mt-1 line-clamp-2">{d.description}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sql-game/StageFooter.jsx \
        frontend/src/components/sql-game/DatabaseSelector.jsx
git commit -m "feat(sql-game): add StageFooter and DatabaseSelector components"
```

---

## Task 10: GameShell Layout

**Files:**
- Create: `frontend/src/components/sql-game/GameShell.jsx`

- [ ] **Step 1: Create GameShell**

```jsx
// frontend/src/components/sql-game/GameShell.jsx
import { useSqlGameStore } from '../../store/useSqlGameStore'
import { useSqlGame } from '../../hooks/useSqlGame'
import { ProgressBar } from './ProgressBar'
import { UserCard } from './sidebar/UserCard'
import { MissionBriefing } from './sidebar/MissionBriefing'
import { ObjectivesList } from './sidebar/ObjectivesList'
import { TablePills } from './sidebar/TablePills'
import { SqlEditor } from './editor/SqlEditor'
import { EditorToolbar } from './editor/EditorToolbar'
import { TerminalOutput } from './output/TerminalOutput'
import { StageFooter } from './StageFooter'

export function GameShell() {
  const {
    rank, queryText, setQueryText, lastResult,
    solvedMissions, getDatasetMissions, getCurrentMission,
    currentMissionId, goToNextMission, goToPrevMission, isInitializingDb,
  } = useSqlGameStore()

  const { handleRun, handleDeploy } = useSqlGame()

  const mission = getCurrentMission()
  const allMissions = getDatasetMissions()
  const missionIdx = allMissions.findIndex(m => m.id === currentMissionId)
  const canPrev = missionIdx > 0
  const canNext = missionIdx < allMissions.length - 1 && solvedMissions.includes(currentMissionId)

  const checkedCols = lastResult?.deployResult?.checkedCols ?? {}

  // Heading panel decorators
  const PanelHeader = ({ title }) => (
    <div className="flex items-center justify-between px-3 py-2 border border-border border-b-0 rounded-t bg-surface flex-shrink-0">
      <span className="text-xs font-mono text-sql-dim uppercase tracking-widest">{title}</span>
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF79C6] opacity-60" />
        <div className="w-2.5 h-2.5 rounded-full bg-sql-primary opacity-60" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-background text-accent overflow-hidden">
      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-border flex flex-col overflow-y-auto p-4 gap-4 bg-surface">
          <UserCard rank={rank} />
          {mission && (
            <>
              <MissionBriefing title={mission.title} briefing={mission.briefing} />
              <TablePills tables={mission.tables || []} orderingHint={mission.ordering_hint} />
              <ObjectivesList objectives={mission.objectives || []} checkedCols={checkedCols} />
            </>
          )}
        </aside>

        {/* Main panel */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Progress bar */}
          <ProgressBar solved={solvedMissions.length} total={allMissions.length} />

          <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
            {/* Editor */}
            <div className="flex flex-col flex-shrink-0" style={{ height: '40%' }}>
              <PanelHeader title="SQL COMMAND LINE" />
              <SqlEditor value={queryText} onChange={setQueryText} />
              <EditorToolbar
                charCount={queryText.length}
                onRun={handleRun}
                onDeploy={handleDeploy}
                isInitializing={isInitializingDb}
              />
            </div>

            {/* Output */}
            <div className="flex-1 min-h-0">
              <TerminalOutput result={lastResult} />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <StageFooter
        onPrev={goToPrevMission}
        onNext={goToNextMission}
        canPrev={canPrev}
        canNext={canNext}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/sql-game/GameShell.jsx
git commit -m "feat(sql-game): add GameShell layout component"
```

---

## Task 11: SqlMissionControl Page

**Files:**
- Create: `frontend/src/pages/SqlMissionControl.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create page**

```jsx
// frontend/src/pages/SqlMissionControl.jsx
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useSqlGameStore } from '../store/useSqlGameStore'
import { useDatabase } from '../hooks/useDatabase'
import { getSqlGameConfig } from '../services/api'
import { DatabaseSelector } from '../components/sql-game/DatabaseSelector'
import { GameShell } from '../components/sql-game/GameShell'

export default function SqlMissionControl() {
  const {
    datasets, isLoading, selectedDataset, db,
    setApiData, selectDataset, isInitializingDb,
  } = useSqlGameStore()

  // Init sql.js when dataset selected
  useDatabase()

  useEffect(() => {
    getSqlGameConfig()
      .then(({ datasets, missions }) => {
        setApiData(datasets, missions)
        // Auto-select if only one active dataset
        // Zustand set() is synchronous so get().missions is already updated here
        if (datasets.length === 1) {
          selectDataset(datasets[0])
        }
      })
      .catch(err => {
        console.error('Failed to load sql game config:', err)
        setApiData([], [])
      })
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-sql-primary" />
      </div>
    )
  }

  if (datasets.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center p-8">
        <div className="font-mono">
          <p className="text-sql-primary text-sm tracking-widest uppercase mb-3">SQL MISSION CONTROL</p>
          <p className="text-accent-muted text-sm">Belum ada dataset aktif. Admin perlu mengaktifkan dataset terlebih dahulu.</p>
        </div>
      </div>
    )
  }

  if (!selectedDataset || (!db && !isInitializingDb)) {
    return (
      <DatabaseSelector
        datasets={datasets}
        onSelect={selectDataset}
      />
    )
  }

  if (isInitializingDb) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center font-mono">
          <Loader2 size={24} className="animate-spin text-sql-primary mx-auto mb-3" />
          <p className="text-sql-dim text-xs tracking-widest uppercase">Initializing database...</p>
        </div>
      </div>
    )
  }

  return <GameShell />
}
```

- [ ] **Step 2: Add route to App.jsx**

In `frontend/src/App.jsx`, add import and route:

```jsx
// Add import:
import SqlMissionControl from './pages/SqlMissionControl'

// Add route (outside the /binn group, alongside / and /thank-you):
<Route path="/sql-mission-control" element={<SqlMissionControl />} />
```

- [ ] **Step 3: Quick smoke test**

Start dev server, open `http://localhost:5173/sql-mission-control`. Should see either the loading spinner or DatabaseSelector (if backend has active datasets).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/SqlMissionControl.jsx frontend/src/App.jsx
git commit -m "feat(sql-game): add SqlMissionControl page and route"
```

---

## Task 12: Portfolio Navigation Integration

**Files:**
- Modify: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/src/components/sections/Projects.jsx`

- [ ] **Step 1: Read Navbar.jsx current content, then add "SQL Lab" item**

In the desktop nav links array (wherever About, Skills, Projects etc are defined), add a "SQL Lab" entry that uses `navigate` instead of `scrollIntoView`. The item gets distinct neon styling:

```jsx
// Add at the top of Navbar.jsx:
import { useNavigate } from 'react-router-dom'

// Inside the component, add:
const navigate = useNavigate()

// In the desktop nav, after the existing links, add:
<button
  onClick={() => navigate('/sql-mission-control')}
  className="text-sm font-mono px-2.5 py-1 rounded border border-sql-primary/40 text-sql-primary
    hover:border-sql-primary hover:shadow-[0_0_8px_rgba(0,255,65,0.25)] transition-all duration-200"
>
  SQL Lab ↗
</button>

// In the mobile menu, add the same button styled consistently with the other mobile items.
```

- [ ] **Step 2: Read Projects.jsx current content, then add SQL MC card**

Find where project cards are rendered. Add the SQL Mission Control card as a static entry (not from API — it's a special featured project). Insert it before the API-fetched projects, or at the start of the grid:

```jsx
{/* SQL Mission Control — featured interactive project */}
<div
  className="relative group cursor-pointer border border-sql-primary/30 rounded-xl overflow-hidden
    bg-surface hover:border-sql-primary hover:shadow-[0_0_20px_rgba(0,255,65,0.12)] transition-all duration-300"
  onClick={() => navigate('/sql-mission-control')}
>
  {/* Badge */}
  <div className="absolute top-3 right-3 z-10">
    <span className="text-xs font-mono px-2 py-0.5 bg-sql-primary text-background rounded font-bold">
      Interactive
    </span>
  </div>

  <div className="p-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sql-primary font-mono text-lg">▶</span>
      <h3 className="font-display font-semibold text-accent group-hover:text-sql-primary transition-colors">
        SQL Mission Control
      </h3>
    </div>
    <p className="text-accent-muted text-sm leading-relaxed mb-4">
      Web game latihan SQL bertema terminal. Nulis query nyata ke SQLite yang jalan di browser — JOIN, agregasi, subquery — dan validasi otomatis.
    </p>
    <div className="flex flex-wrap gap-1.5 mb-4">
      {['SQL', 'React', 'WebAssembly', 'sql.js', 'CodeMirror'].map(tag => (
        <span key={tag} className="text-xs font-mono px-2 py-0.5 bg-surface-2 text-accent-muted rounded border border-border">
          {tag}
        </span>
      ))}
    </div>
    <button className="text-sm font-mono text-sql-primary hover:underline">
      Play → 
    </button>
  </div>
</div>
```

Also add `import { useNavigate } from 'react-router-dom'` and `const navigate = useNavigate()` if not already present in Projects.jsx.

- [ ] **Step 3: Verify navigation works**

Start dev server. Check:
1. Navbar shows "SQL Lab ↗" with green glow on hover
2. Clicking it navigates to `/sql-mission-control`
3. Projects section shows the SQL Mission Control card with green border
4. Clicking card also navigates to game

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Navbar.jsx frontend/src/components/sections/Projects.jsx
git commit -m "feat(sql-game): add SQL Lab navbar item and project card in Projects section"
```

---

## Task 13: Full Integration Test + Build

- [ ] **Step 1: Run unit tests**

```bash
cd frontend && npm test
# Expected: all compareResults tests PASS
```

- [ ] **Step 2: End-to-end smoke test**

With backend running and at least one active dataset with missions:

1. Open `http://localhost:5173/sql-mission-control`
2. If multiple datasets: DatabaseSelector screen appears → pick one
3. DB initializes (brief spinner) → GameShell loads
4. Sidebar shows mission title, briefing, objectives, table pills
5. Editor has starter SQL pre-filled
6. Click **RUN QUERY** → result grid populates
7. Click **RUN QUERY** with a bad query (e.g. `SELECT @@invalid`) → error message in red, app doesn't crash
8. Click **DEPLOY QUERY** with the correct query → mission solved:
   - Objectives all checked (green)
   - "MISSION COMPLETE" shows in output header
   - NEXT STAGE button becomes active (green glow)
9. Click **NEXT STAGE** → moves to next mission, editor resets
10. PREV navigates back

- [ ] **Step 3: Production build**

```bash
npm run build
# Expected: no errors, dist/ generated
```

Fix any TypeScript/lint errors that surface during build before proceeding.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(sql-game): complete Plan 2 — frontend game + navigation

- compareResults engine with unit tests (ordered/unordered, NULL, float, columns)
- runQuery engine (sql.js wrapper)
- Zustand game store (datasets, missions, session state, rank)
- useDatabase hook (sql.js init/re-init per dataset)
- useSqlGame hook (run + deploy logic)
- Full component tree: GameShell, sidebar, editor, output, footer, DatabaseSelector
- SqlMissionControl page at /sql-mission-control
- Navbar SQL Lab item + Projects section card"
```
