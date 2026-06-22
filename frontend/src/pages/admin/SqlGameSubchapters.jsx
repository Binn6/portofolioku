import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  adminGetSqlSubchapters, adminCreateSqlSubchapter,
  adminUpdateSqlSubchapter, adminDeleteSqlSubchapter,
  adminGetSqlChapters,
} from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const empty = { chapter_id: '', name: '', description: '', order: 1 }

export default function SqlGameSubchapters() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const chapterIdFilter = params.get('chapter_id') || ''
  const chapterNameFilter = params.get('chapter_name') || ''

  const [chapters, setChapters] = useState([])
  const [subchapters, setSubchapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ ...empty, chapter_id: chapterIdFilter })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { confirm, dialogProps } = useConfirm()

  useEffect(() => {
    adminGetSqlChapters().then(setChapters)
    load()
  }, [chapterIdFilter])

  const load = () => {
    setLoading(true)
    adminGetSqlSubchapters(chapterIdFilter || undefined)
      .then(setSubchapters)
      .finally(() => setLoading(false))
  }

  const openNew = () => {
    setForm({ ...empty, chapter_id: chapterIdFilter, order: subchapters.length + 1 })
    setError('')
    setModal('new')
  }

  const openEdit = (s) => {
    setForm({ chapter_id: s.chapter_id, name: s.name, description: s.description || '', order: s.order })
    setError('')
    setModal(s)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.chapter_id) { setError('Nama dan chapter wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      if (modal === 'new') {
        await adminCreateSqlSubchapter(form)
      } else {
        await adminUpdateSqlSubchapter(modal.id, form)
      }
      setModal(null)
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s) => {
    if (!await confirm(`Hapus "${s.name}"? Dataset yang terhubung akan di-unlink.`)) return
    await adminDeleteSqlSubchapter(s.id)
    load()
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c]))

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          {chapterIdFilter && (
            <button onClick={() => navigate('/binn/sql-game/chapters')}
              className="text-accent-muted hover:text-accent transition">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-accent">SQL Game — Sub-Chapter</h1>
            {chapterNameFilter && (
              <p className="text-xs text-accent-muted mt-0.5">Filter: {chapterNameFilter}</p>
            )}
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded-md font-medium"
          >
            <Plus size={14} /> Tambah Sub-Chapter
          </button>
        </div>

        {loading ? (
          <p className="text-accent-muted text-sm">Memuat...</p>
        ) : subchapters.length === 0 ? (
          <p className="text-accent-muted text-sm">Belum ada sub-chapter.</p>
        ) : (
          <div className="space-y-2">
            {subchapters.map(s => (
              <div key={s.id}
                className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-accent font-mono text-sm truncate">{s.name}</p>
                    {!chapterIdFilter && chapterMap[s.chapter_id] && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-2 text-accent-muted rounded font-mono flex-shrink-0">
                        {chapterMap[s.chapter_id].name.split(':')[0]}
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-accent-muted mt-0.5 truncate">{s.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-accent-muted hover:text-accent transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(s)} className="p-1.5 text-accent-muted hover:text-red-400 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-accent font-semibold mb-4">
              {modal === 'new' ? 'Tambah Sub-Chapter' : `Edit: ${modal.name}`}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-accent-muted mb-1">Chapter *</label>
                <select value={form.chapter_id} onChange={set('chapter_id')}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
                  <option value="">Pilih chapter...</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-accent-muted mb-1">Nama *</label>
                <input value={form.name} onChange={set('name')}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs text-accent-muted mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={set('description')} rows={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent resize-none" />
              </div>
              <div>
                <label className="block text-xs text-accent-muted mb-1">Urutan</label>
                <input type="number" value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-accent-muted hover:text-accent">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-accent text-background rounded-lg disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  )
}
