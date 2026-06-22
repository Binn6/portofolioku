import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  adminGetSqlChapters, adminCreateSqlChapter,
  adminUpdateSqlChapter, adminDeleteSqlChapter,
} from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const COLORS = ['#00FF41', '#00E5FF', '#FF00E5', '#FFE500', '#FF6B00']

const empty = { name: '', description: '', order: 1, color: '#00FF41' }

export default function SqlGameChapters() {
  const navigate = useNavigate()
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | chapter obj
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { confirm, dialogProps } = useConfirm()

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    adminGetSqlChapters().then(setChapters).finally(() => setLoading(false))
  }

  const openNew = () => {
    setForm({ ...empty, order: chapters.length + 1 })
    setError('')
    setModal('new')
  }

  const openEdit = (c) => {
    setForm({ name: c.name, description: c.description || '', order: c.order, color: c.color || '#00FF41' })
    setError('')
    setModal(c)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nama wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      if (modal === 'new') {
        await adminCreateSqlChapter(form)
      } else {
        await adminUpdateSqlChapter(modal.id, form)
      }
      setModal(null)
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!await confirm(`Hapus "${c.name}"? Semua sub-chapter dan dataset terkait akan di-unlink.`)) return
    await adminDeleteSqlChapter(c.id)
    load()
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-accent">SQL Game — Chapters</h1>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded-md font-medium"
          >
            <Plus size={14} /> Tambah Chapter
          </button>
        </div>

        {loading ? (
          <p className="text-accent-muted text-sm">Memuat...</p>
        ) : chapters.length === 0 ? (
          <p className="text-accent-muted text-sm">Belum ada chapter.</p>
        ) : (
          <div className="space-y-2">
            {chapters.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color || '#00FF41' }}
                  />
                  <div className="min-w-0">
                    <p className="text-accent font-mono font-semibold text-sm truncate">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-accent-muted mt-0.5 truncate">{c.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/binn/sql-game/subchapters?chapter_id=${c.id}&chapter_name=${encodeURIComponent(c.name)}`)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded text-accent-muted hover:text-accent transition"
                  >
                    Sub-BAB <ChevronRight size={12} />
                  </button>
                  <button onClick={() => openEdit(c)} className="p-1.5 text-accent-muted hover:text-accent transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 text-accent-muted hover:text-red-400 transition">
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
              {modal === 'new' ? 'Tambah Chapter' : `Edit: ${modal.name}`}
            </h3>
            <div className="space-y-3">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-accent-muted mb-1">Urutan</label>
                  <input type="number" value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs text-accent-muted mb-1">Warna</label>
                  <div className="flex gap-1.5 mt-1">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setForm(f => ({ ...f, color }))}
                        className="w-6 h-6 rounded-full flex-shrink-0 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          outline: form.color === color ? `2px solid ${color}` : undefined,
                          outlineOffset: '2px',
                        }}
                      />
                    ))}
                  </div>
                </div>
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
