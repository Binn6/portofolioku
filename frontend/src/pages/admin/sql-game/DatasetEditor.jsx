// frontend/src/pages/admin/sql-game/DatasetEditor.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import AdminLayout from '../../../components/layout/AdminLayout'
import {
  adminCreateSqlDataset, adminUpdateSqlDataset, adminGetSqlDatasets,
} from '../../../services/api'

const empty = {
  name: '', description: '', source: 'upload',
  source_ref: '', schema_sql: '', seed_sql: '', is_active: false,
}

export default function DatasetEditor() {
  const navigate = useNavigate()
  const { id } = useParams()           // undefined = new
  const { state } = useLocation()      // { preview } from import flow
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isNew = !id || id === 'new'

  useEffect(() => {
    if (state?.preview) {
      setForm(f => ({ ...f, ...state.preview }))
    } else if (!isNew) {
      adminGetSqlDatasets().then(list => {
        const found = list.find(d => d.id === id)
        if (found) setForm({ ...empty, ...found })
      })
    }
  }, [id])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setCheck = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.checked }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.schema_sql.trim() || !form.seed_sql.trim()) {
      setError('Nama, Schema SQL, dan Seed SQL wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        await adminCreateSqlDataset({ ...form, source: form.source || 'upload' })
      } else {
        await adminUpdateSqlDataset(id, form)
      }
      navigate('/binn/sql-game/datasets')
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/binn/sql-game/datasets')}
            className="text-accent-muted hover:text-accent transition">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-semibold text-accent">
            {isNew ? 'Import Dataset Baru' : 'Edit Dataset'}
          </h1>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-accent-muted mb-1">Nama Dataset *</label>
              <input value={form.name} onChange={set('name')}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-accent-muted mb-1">Sumber</label>
              <select value={form.source} onChange={set('source')}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
                <option value="uci">UCI ML Repository</option>
                <option value="url">URL</option>
                <option value="upload">Upload</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-accent-muted mb-1">Deskripsi</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent resize-none" />
          </div>

          <div>
            <label className="block text-xs text-accent-muted mb-1">Schema SQL (DDL) *</label>
            <textarea value={form.schema_sql} onChange={set('schema_sql')} rows={10}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm font-mono outline-none focus:border-accent resize-y" />
          </div>

          <div>
            <label className="block text-xs text-accent-muted mb-1">Seed SQL (INSERT) *</label>
            <textarea value={form.seed_sql} onChange={set('seed_sql')} rows={10}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm font-mono outline-none focus:border-accent resize-y" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={setCheck('is_active')}
              className="rounded" />
            <label htmlFor="is_active" className="text-sm text-accent">Aktifkan dataset (tampil di game)</label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-background rounded-lg text-sm font-medium disabled:opacity-50">
              <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Dataset'}
            </button>
            <button onClick={() => navigate('/binn/sql-game/datasets')}
              className="px-5 py-2 border border-border rounded-lg text-sm text-accent-muted hover:text-accent transition">
              Batal
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
