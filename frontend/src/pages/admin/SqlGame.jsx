import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  Plus, Pencil, Trash2, X, Save, Search, Link, Upload,
  ToggleLeft, ToggleRight, GripVertical,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AdminLayout from '../../components/layout/AdminLayout'
import MissionForm from './sql-game/MissionForm'
import UciBrowserModal from './sql-game/UciBrowserModal'
import {
  adminGetSqlChapters, adminCreateSqlChapter, adminUpdateSqlChapter, adminDeleteSqlChapter,
  adminGetSqlSubchapters, adminCreateSqlSubchapter, adminUpdateSqlSubchapter, adminDeleteSqlSubchapter,
  adminGetSqlDatasets, adminCreateSqlDataset, adminUpdateSqlDataset, adminDeleteSqlDataset,
  adminToggleSqlDataset, adminFetchUrlDataset, adminUploadDataset,
  adminGetSqlMissions, adminCreateSqlMission, adminUpdateSqlMission,
  adminDeleteSqlMission, adminReorderSqlMissions, adminFixSqlObjectives,
} from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const TABS = [
  { id: 'chapters',    label: 'BAB (Chapters)' },
  { id: 'subchapters', label: 'Sub-BAB' },
  { id: 'datasets',   label: 'Dataset' },
  { id: 'missions',   label: 'Mission' },
]

const CHAPTER_COLORS = ['#00FF41', '#00E5FF', '#FF00E5', '#FFE500', '#FF6B00']

async function toUploadableFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') {
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    return new File([csv], file.name.replace(/\.[^.]+$/, '') + '.csv', { type: 'text/csv' })
  }
  return file
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SqlGame() {
  const [tab, setTab] = useState('chapters')
  const [chapters, setChapters] = useState([])
  const [subchapters, setSubchapters] = useState([])
  const [datasets, setDatasets] = useState([])
  const { confirm, dialogProps } = useConfirm()

  const loadChapters    = () => adminGetSqlChapters().then(setChapters)
  const loadSubchapters = () => adminGetSqlSubchapters().then(setSubchapters)
  const loadDatasets    = () => adminGetSqlDatasets().then(setDatasets)

  useEffect(() => {
    loadChapters()
    loadSubchapters()
    loadDatasets()
  }, [])

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl">
        <h1 className="text-xl font-semibold text-accent mb-6">SQL Game Admin</h1>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-border mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-accent-muted hover:text-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'chapters'    && <ChaptersSection    chapters={chapters}    refresh={loadChapters}    confirm={confirm} />}
        {tab === 'subchapters' && <SubchaptersSection chapters={chapters}    subchapters={subchapters} refresh={loadSubchapters} confirm={confirm} />}
        {tab === 'datasets'    && <DatasetsSection    datasets={datasets}    chapters={chapters}       subchapters={subchapters} refresh={loadDatasets}    confirm={confirm} />}
        {tab === 'missions'    && <MissionsSection    datasets={datasets}    confirm={confirm} />}
      </div>
      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  )
}

// ── ChaptersSection ────────────────────────────────────────────────────────────

const emptyChapter = { name: '', description: '', order: 1, color: '#00FF41' }

function ChaptersSection({ chapters, refresh, confirm }) {
  const [modal, setModal] = useState(null)
  const [form, setForm]   = useState(emptyChapter)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const openNew  = ()  => { setForm({ ...emptyChapter, order: chapters.length + 1 }); setError(''); setModal('new') }
  const openEdit = (c) => { setForm({ name: c.name, description: c.description || '', order: c.order, color: c.color || '#00FF41' }); setError(''); setModal(c) }

  const save = async () => {
    if (!form.name.trim()) { setError('Nama wajib diisi'); return }
    setSaving(true); setError('')
    try {
      modal === 'new'
        ? await adminCreateSqlChapter(form)
        : await adminUpdateSqlChapter(modal.id, form)
      setModal(null); refresh()
    } catch (e) { setError(e.response?.data?.message || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  const del = async (c) => {
    if (!await confirm(`Hapus "${c.name}"? Sub-chapter terkait juga akan dihapus.`)) return
    await adminDeleteSqlChapter(c.id); refresh()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded-md font-medium">
          <Plus size={14} /> Tambah BAB
        </button>
      </div>

      {chapters.length === 0
        ? <p className="text-accent-muted text-sm">Belum ada chapter.</p>
        : (
          <div className="space-y-2">
            {chapters.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || '#00FF41' }} />
                  <div>
                    <p className="text-accent font-mono font-semibold text-sm">{c.name}</p>
                    {c.description && <p className="text-xs text-accent-muted mt-0.5">{c.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-accent-muted hover:text-accent transition"><Pencil size={14} /></button>
                  <button onClick={() => del(c)} className="p-1.5 text-accent-muted hover:text-red-400 transition"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal !== null && (
        <Modal title={modal === 'new' ? 'Tambah BAB' : `Edit: ${modal.name}`} onClose={() => setModal(null)}>
          <Field label="Nama *"><input value={form.name} onChange={set('name')} className={inputCls} /></Field>
          <Field label="Deskripsi"><textarea value={form.description} onChange={set('description')} rows={2} className={`${inputCls} resize-none`} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Urutan"><input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className={inputCls} /></Field>
            <Field label="Warna">
              <div className="flex gap-1.5 mt-1">
                {CHAPTER_COLORS.map(color => (
                  <button key={color} onClick={() => setForm(f => ({ ...f, color }))} className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: color, outline: form.color === color ? `2px solid ${color}` : undefined, outlineOffset: 2 }} />
                ))}
              </div>
            </Field>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <ModalActions saving={saving} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </>
  )
}

// ── SubchaptersSection ─────────────────────────────────────────────────────────

const emptySub = { chapter_id: '', name: '', description: '', order: 1 }

function SubchaptersSection({ chapters, subchapters, refresh, confirm }) {
  const [filter, setFilter] = useState('')
  const [modal, setModal]   = useState(null)
  const [form, setForm]     = useState(emptySub)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const filtered = filter ? subchapters.filter(s => s.chapter_id === filter) : subchapters
  const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c]))

  const openNew  = ()  => { setForm({ ...emptySub, chapter_id: filter, order: filtered.length + 1 }); setError(''); setModal('new') }
  const openEdit = (s) => { setForm({ chapter_id: s.chapter_id, name: s.name, description: s.description || '', order: s.order }); setError(''); setModal(s) }

  const save = async () => {
    if (!form.name.trim() || !form.chapter_id) { setError('Nama dan chapter wajib diisi'); return }
    setSaving(true); setError('')
    try {
      modal === 'new'
        ? await adminCreateSqlSubchapter(form)
        : await adminUpdateSqlSubchapter(modal.id, form)
      setModal(null); refresh()
    } catch (e) { setError(e.response?.data?.message || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  const del = async (s) => {
    if (!await confirm(`Hapus "${s.name}"?`)) return
    await adminDeleteSqlSubchapter(s.id); refresh()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
          <option value="">Semua BAB</option>
          {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded-md font-medium">
          <Plus size={14} /> Tambah Sub-BAB
        </button>
      </div>

      {filtered.length === 0
        ? <p className="text-accent-muted text-sm">Belum ada sub-chapter.</p>
        : (
          <div className="space-y-2">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-accent text-sm font-mono">{s.name}</p>
                    {!filter && chapterMap[s.chapter_id] && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-2 text-accent-muted rounded font-mono">
                        {chapterMap[s.chapter_id].name.split(':')[0]}
                      </span>
                    )}
                  </div>
                  {s.description && <p className="text-xs text-accent-muted mt-0.5">{s.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-accent-muted hover:text-accent transition"><Pencil size={14} /></button>
                  <button onClick={() => del(s)} className="p-1.5 text-accent-muted hover:text-red-400 transition"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal !== null && (
        <Modal title={modal === 'new' ? 'Tambah Sub-BAB' : `Edit: ${modal.name}`} onClose={() => setModal(null)}>
          <Field label="BAB *">
            <select value={form.chapter_id} onChange={set('chapter_id')} className={inputCls}>
              <option value="">Pilih BAB...</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Nama *"><input value={form.name} onChange={set('name')} className={inputCls} /></Field>
          <Field label="Deskripsi"><textarea value={form.description} onChange={set('description')} rows={2} className={`${inputCls} resize-none`} /></Field>
          <Field label="Urutan"><input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className={inputCls} /></Field>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <ModalActions saving={saving} onSave={save} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </>
  )
}

// ── DatasetsSection ────────────────────────────────────────────────────────────

const emptyDataset = {
  name: '', description: '', source: 'upload', source_ref: '',
  schema_sql: '', seed_sql: '', is_active: false,
  chapter_id: '', subchapter_id: '',
}

function DatasetsSection({ datasets, chapters, subchapters, refresh, confirm }) {
  const [modal, setModal]         = useState(false)   // DatasetEditor overlay
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState(emptyDataset)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [showUci, setShowUci]     = useState(false)
  const [urlModal, setUrlModal]   = useState(false)
  const [urlInput, setUrlInput]   = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError]   = useState('')
  const [subOptions, setSubOptions] = useState([])

  useEffect(() => {
    if (form.chapter_id) {
      setSubOptions(subchapters.filter(s => s.chapter_id === form.chapter_id))
    } else {
      setSubOptions([])
    }
  }, [form.chapter_id, subchapters])

  const openNew  = ()  => { setForm(emptyDataset); setEditId(null); setError(''); setModal(true) }
  const openEdit = (d) => { setForm({ ...emptyDataset, ...d }); setEditId(d.id); setError(''); setModal(true) }

  const openWithPreview = (preview) => {
    setForm(f => ({ ...emptyDataset, ...f, ...preview }))
    setEditId(null); setError(''); setModal(true)
  }

  const handleUciImport = (preview) => {
    setShowUci(false)
    openWithPreview({ ...preview, source: 'uci' })
  }

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true); setUrlError('')
    try {
      const preview = await adminFetchUrlDataset(urlInput.trim())
      setUrlModal(false); setUrlInput('')
      openWithPreview({ ...preview, source: 'url', source_ref: urlInput.trim() })
    } catch (e) { setUrlError(e.response?.data?.error || 'Gagal mengambil data dari URL') }
    finally { setUrlLoading(false) }
  }

  const handleUpload = async (e) => {
    const rawFile = e.target.files[0]
    if (!rawFile) return
    const name = prompt('Nama dataset:', rawFile.name.replace(/\.[^.]+$/, ''))
    if (!name) return
    try {
      const file = await toUploadableFile(rawFile)
      const fd = new FormData(); fd.append('file', file); fd.append('name', name)
      const preview = await adminUploadDataset(fd)
      openWithPreview({ ...preview, name, source: 'upload' })
    } catch (e) { alert(e.response?.data?.error || 'Gagal memparse file') }
    e.target.value = ''
  }

  const save = async () => {
    if (!form.name.trim() || !form.schema_sql.trim() || !form.seed_sql.trim()) {
      setError('Nama, Schema SQL, dan Seed SQL wajib diisi'); return
    }
    setSaving(true); setError('')
    try {
      editId
        ? await adminUpdateSqlDataset(editId, form)
        : await adminCreateSqlDataset({ ...form, source: form.source || 'upload' })
      setModal(false); refresh()
    } catch (e) { setError(e.response?.data?.message || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  const toggle = async (id) => { await adminToggleSqlDataset(id); refresh() }
  const del    = async (d) => {
    if (!await confirm(`Hapus dataset "${d.name}"? Semua missions terkait juga akan dihapus.`)) return
    await adminDeleteSqlDataset(d.id); refresh()
  }

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const sourceLabel = { uci: 'UCI', url: 'URL', upload: 'Upload' }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setShowUci(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent-muted hover:text-accent hover:border-accent transition">
            <Search size={13} /> Browse UCI
          </button>
          <button onClick={() => setUrlModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent-muted hover:text-accent hover:border-accent transition">
            <Link size={13} /> Fetch URL
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent-muted hover:text-accent hover:border-accent transition cursor-pointer">
            <Upload size={13} /> Upload
            <input type="file" accept=".csv,.json,.txt,.xlsx,.xls" className="hidden" onChange={handleUpload} />
          </label>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded-md font-medium">
          <Plus size={14} /> Dataset Baru
        </button>
      </div>

      {datasets.length === 0
        ? <p className="text-accent-muted text-sm">Belum ada dataset.</p>
        : (
          <div className="space-y-2">
            {datasets.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-medium text-sm truncate">{d.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-surface-2 text-accent-muted rounded">{sourceLabel[d.source] || d.source}</span>
                  </div>
                  {d.description && <p className="text-xs text-accent-muted mt-0.5 truncate">{d.description}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => toggle(d.id)} title={d.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                    {d.is_active
                      ? <ToggleRight size={22} className="text-green-500" />
                      : <ToggleLeft size={22} className="text-accent-muted" />}
                  </button>
                  <button onClick={() => openEdit(d)} className="p-1.5 text-accent-muted hover:text-accent transition"><Pencil size={14} /></button>
                  <button onClick={() => del(d)} className="p-1.5 text-accent-muted hover:text-red-400 transition"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Dataset Editor overlay */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-3xl my-6">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-accent font-semibold">{editId ? 'Edit Dataset' : 'Dataset Baru'}</h3>
              <button onClick={() => setModal(false)} className="text-accent-muted hover:text-accent"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nama Dataset *"><input value={form.name} onChange={setF('name')} className={inputCls} /></Field>
                <Field label="Sumber">
                  <select value={form.source} onChange={setF('source')} className={inputCls}>
                    <option value="uci">UCI ML Repository</option>
                    <option value="url">URL</option>
                    <option value="upload">Upload</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="BAB">
                  <select value={form.chapter_id} onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value, subchapter_id: '' }))} className={inputCls}>
                    <option value="">— Tidak terhubung —</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Sub-BAB">
                  <select value={form.subchapter_id} onChange={setF('subchapter_id')} disabled={!form.chapter_id} className={`${inputCls} disabled:opacity-50`}>
                    <option value="">— Pilih BAB dulu —</option>
                    {subOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Deskripsi">
                <textarea value={form.description} onChange={setF('description')} rows={2} className={`${inputCls} resize-none`} />
              </Field>
              <Field label="Schema SQL (DDL) *">
                <textarea value={form.schema_sql} onChange={setF('schema_sql')} rows={10} className={`${inputCls} font-mono resize-y`} />
              </Field>
              <Field label="Seed SQL (INSERT) *">
                <textarea value={form.seed_sql} onChange={setF('seed_sql')} rows={10} className={`${inputCls} font-mono resize-y`} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-accent cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Aktifkan dataset (tampil di game)
              </label>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-accent text-background rounded-lg text-sm font-medium disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Dataset'}
                </button>
                <button onClick={() => setModal(false)} className="px-5 py-2 border border-border rounded-lg text-sm text-accent-muted hover:text-accent">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL modal */}
      {urlModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-accent font-semibold mb-4">Fetch dari URL</h3>
            <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
              placeholder="https://... (CSV atau JSON)"
              className={`${inputCls} mb-2`} />
            {urlError && <p className="text-red-400 text-xs mb-2">{urlError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setUrlModal(false); setUrlError('') }} className="px-4 py-2 text-sm text-accent-muted hover:text-accent">Batal</button>
              <button onClick={handleUrlFetch} disabled={urlLoading} className="px-4 py-2 text-sm bg-accent text-background rounded-lg disabled:opacity-50">
                {urlLoading ? 'Mengambil...' : 'Fetch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUci && <UciBrowserModal onSelect={handleUciImport} onClose={() => setShowUci(false)} />}
    </>
  )
}

// ── MissionsSection ────────────────────────────────────────────────────────────

const emptyMission = {
  dataset_id: '', stage_order: 1, title: '', briefing: '',
  tables: [], tablesRaw: '', objectives: [{ col: '', desc: '' }],
  ordering_hint: '', ordered: false, starter_sql: '', solution_query: '',
  rank_unlock: '', is_active: true,
}

function SortableRow({ mission, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: mission.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="text-accent-muted cursor-grab active:cursor-grabbing"><GripVertical size={16} /></button>
        <div>
          <span className="text-xs text-accent-muted mr-2">Stage {mission.stage_order}</span>
          <span className="text-accent text-sm font-medium">{mission.title}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(mission)} className="p-1.5 text-accent-muted hover:text-accent transition"><Pencil size={14} /></button>
        <button onClick={() => onDelete(mission)} className="p-1.5 text-accent-muted hover:text-red-400 transition"><Trash2 size={14} /></button>
      </div>
    </div>
  )
}

function MissionsSection({ datasets, confirm }) {
  const [missions, setMissions]     = useState([])
  const [filter, setFilter]         = useState('')
  const [modal, setModal]           = useState(false)
  const [form, setForm]             = useState(emptyMission)
  const [editId, setEditId]         = useState(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [fixing, setFixing]         = useState(false)
  const [fixMsg, setFixMsg]         = useState('')
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => { load() }, [filter])
  const load = () => adminGetSqlMissions(filter || null).then(setMissions)

  const openCreate = () => { setForm({ ...emptyMission, dataset_id: filter || '' }); setEditId(null); setError(''); setModal(true) }
  const openEdit   = (m) => { setForm({ ...emptyMission, ...m, tablesRaw: (m.tables || []).join(', ') }); setEditId(m.id); setError(''); setModal(true) }

  const del = async (m) => {
    if (!await confirm(`Hapus mission "${m.title}"?`)) return
    await adminDeleteSqlMission(m.id); load()
  }

  const save = async () => {
    if (!form.title || !form.dataset_id || !form.solution_query) {
      setError('Judul, Dataset, dan Solution Query wajib diisi'); return
    }
    setSaving(true); setError('')
    const payload = { ...form }; delete payload.tablesRaw
    try {
      editId
        ? await adminUpdateSqlMission(editId, payload)
        : await adminCreateSqlMission(payload)
      setModal(false); load()
    } catch (e) { setError(e.response?.data?.message || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  const handleFix = async () => {
    setFixing(true); setFixMsg('')
    try {
      const { fixed, skipped } = await adminFixSqlObjectives()
      setFixMsg(`Selesai: ${fixed} mission diperbaiki, ${skipped} dilewati (SELECT * atau tidak bisa di-parse).`)
      load()
    } catch (e) { setFixMsg('Gagal: ' + (e.response?.data?.message || e.message)) }
    finally { setFixing(false) }
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const reordered = arrayMove(missions, missions.findIndex(m => m.id === active.id), missions.findIndex(m => m.id === over.id))
    setMissions(reordered)
    await adminReorderSqlMissions(reordered.map(m => m.id))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
          <option value="">Semua Dataset</option>
          {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={handleFix} disabled={fixing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent-muted hover:text-accent hover:border-accent transition disabled:opacity-50">
            {fixing ? 'Memproses...' : 'Auto-fix Objectives'}
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded-md font-medium">
            <Plus size={14} /> Mission Baru
          </button>
        </div>
      </div>
      {fixMsg && (
        <p className="text-xs text-accent-muted mb-3 bg-surface border border-border rounded px-3 py-2">{fixMsg}</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={missions.map(m => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {missions.length === 0
              ? <p className="text-accent-muted text-sm">Belum ada mission.</p>
              : missions.map(m => (
                  <SortableRow key={m.id} mission={m} onEdit={openEdit} onDelete={del} />
                ))
            }
          </div>
        </SortableContext>
      </DndContext>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-accent font-semibold">{editId ? 'Edit Mission' : 'Mission Baru'}</h3>
              <button onClick={() => setModal(false)} className="text-accent-muted hover:text-accent"><X size={18} /></button>
            </div>
            <div className="p-5">
              <MissionForm form={form} onChange={setForm} datasets={datasets} />
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-accent text-background rounded-lg text-sm font-medium disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => setModal(false)} className="px-5 py-2 border border-border rounded-lg text-sm text-accent-muted hover:text-accent">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Shared UI helpers ──────────────────────────────────────────────────────────

const inputCls = 'w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-accent-muted mb-1">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-accent font-semibold">{title}</h3>
          <button onClick={onClose} className="text-accent-muted hover:text-accent"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalActions({ saving, onSave, onCancel }) {
  return (
    <div className="flex gap-2 justify-end pt-2">
      <button onClick={onCancel} className="px-4 py-2 text-sm text-accent-muted hover:text-accent">Batal</button>
      <button onClick={onSave} disabled={saving} className="px-4 py-2 text-sm bg-accent text-background rounded-lg disabled:opacity-50">
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  )
}
