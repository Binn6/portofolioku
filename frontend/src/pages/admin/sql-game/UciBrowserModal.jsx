// frontend/src/pages/admin/sql-game/UciBrowserModal.jsx
import { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { adminGetUciList, adminFetchUciDataset } from '../../../services/api'

export default function UciBrowserModal({ onSelect, onClose }) {
  const [list, setList] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [fetchLoading, setFetchLoading] = useState(null) // id being fetched
  const [error, setError] = useState('')

  useEffect(() => {
    adminGetUciList()
      .then(data => { setList(data); setFiltered(data) })
      .catch(() => setError('Gagal memuat daftar UCI datasets'))
      .finally(() => setListLoading(false))
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(list.filter(d => d.name.toLowerCase().includes(q)))
  }, [query, list])

  const handleSelect = async (dataset) => {
    setFetchLoading(dataset.id)
    setError('')
    try {
      const preview = await adminFetchUciDataset(dataset.id)
      onSelect(preview)
    } catch (e) {
      setError(e.response?.data?.error || `Gagal mengambil dataset ${dataset.name}`)
      setFetchLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-accent font-semibold">Browse UCI ML Repository</h3>
          <button onClick={onClose} className="text-accent-muted hover:text-accent">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-muted" />
            <input
              type="text"
              placeholder="Cari dataset..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-accent text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {listLoading ? (
            <div className="flex items-center justify-center py-12 text-accent-muted">
              <Loader2 size={18} className="animate-spin mr-2" /> Memuat...
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm text-center py-8">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-accent-muted text-sm text-center py-8">Tidak ditemukan</p>
          ) : (
            filtered.slice(0, 100).map(d => (
              <button
                key={d.id}
                onClick={() => handleSelect(d)}
                disabled={fetchLoading !== null}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-2 transition text-left disabled:opacity-60"
              >
                <span className="text-accent text-sm">{d.name}</span>
                {fetchLoading === d.id && <Loader2 size={14} className="animate-spin text-accent-muted" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
