// frontend/src/pages/admin/SqlGameDatasets.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Link, Upload, Search, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  adminGetSqlDatasets, adminDeleteSqlDataset, adminToggleSqlDataset,
  adminCreateSqlDataset, adminFetchUrlDataset, adminUploadDataset,
} from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import UciBrowserModal from './sql-game/UciBrowserModal'

const sourceLabel = { uci: 'UCI', url: 'URL', upload: 'Upload' }

export default function SqlGameDatasets() {
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUci, setShowUci] = useState(false)
  const [urlModal, setUrlModal] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const { confirm, dialogProps } = useConfirm()

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    adminGetSqlDatasets()
      .then(setDatasets)
      .finally(() => setLoading(false))
  }

  const handleToggle = async (id) => {
    await adminToggleSqlDataset(id)
    load()
  }

  const handleDelete = async (id, name) => {
    if (!await confirm(`Hapus dataset "${name}"? Semua missions terkait juga akan dihapus.`)) return
    await adminDeleteSqlDataset(id)
    load()
  }

  const handleUciImport = (preview) => {
    // preview = { name, description, source_ref, schema_sql, seed_sql }
    setShowUci(false)
    navigate('/binn/sql-game/datasets/new', { state: { preview: { ...preview, source: 'uci' } } })
  }

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setUrlError('')
    try {
      const preview = await adminFetchUrlDataset(urlInput.trim())
      setUrlModal(false)
      setUrlInput('')
      navigate('/binn/sql-game/datasets/new', { state: { preview: { ...preview, source: 'url', source_ref: urlInput.trim() } } })
    } catch (e) {
      setUrlError(e.response?.data?.error || 'Gagal mengambil data dari URL')
    } finally {
      setUrlLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const name = prompt('Nama dataset:', file.name.replace(/\.[^.]+$/, ''))
    if (!name) return
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    try {
      const preview = await adminUploadDataset(form)
      navigate('/binn/sql-game/datasets/new', { state: { preview: { ...preview, name, source: 'upload' } } })
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal memparse file')
    }
    e.target.value = ''
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-accent">SQL Game — Datasets</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowUci(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent hover:border-accent transition">
              <Search size={14} /> Browse UCI
            </button>
            <button onClick={() => setUrlModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent hover:border-accent transition">
              <Link size={14} /> Fetch URL
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md text-accent hover:border-accent transition cursor-pointer">
              <Upload size={14} /> Upload
              <input type="file" accept=".csv,.json,.txt" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>

        {loading ? (
          <p className="text-accent-muted text-sm">Memuat...</p>
        ) : datasets.length === 0 ? (
          <p className="text-accent-muted text-sm">Belum ada dataset. Import dataset pertama kamu.</p>
        ) : (
          <div className="space-y-2">
            {datasets.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-medium truncate">{d.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-surface-2 text-accent-muted rounded">
                      {sourceLabel[d.source] || d.source}
                    </span>
                  </div>
                  {d.description && (
                    <p className="text-xs text-accent-muted mt-0.5 truncate">{d.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => handleToggle(d.id)} title={d.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                    {d.is_active
                      ? <ToggleRight size={22} className="text-green-500" />
                      : <ToggleLeft size={22} className="text-accent-muted" />}
                  </button>
                  <button onClick={() => navigate(`/binn/sql-game/datasets/${d.id}/edit`)}
                    className="p-1.5 text-accent-muted hover:text-accent transition">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(d.id, d.name)}
                    className="p-1.5 text-accent-muted hover:text-red-400 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL Fetch Modal */}
      {urlModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-accent font-semibold mb-4">Fetch dari URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://... (CSV atau JSON)"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm mb-2 outline-none focus:border-accent"
            />
            {urlError && <p className="text-red-400 text-xs mb-2">{urlError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setUrlModal(false); setUrlError('') }}
                className="px-4 py-2 text-sm text-accent-muted hover:text-accent">Batal</button>
              <button onClick={handleUrlFetch} disabled={urlLoading}
                className="px-4 py-2 text-sm bg-accent text-background rounded-lg disabled:opacity-50">
                {urlLoading ? 'Mengambil...' : 'Fetch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUci && <UciBrowserModal onSelect={handleUciImport} onClose={() => setShowUci(false)} />}
      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  )
}
