// frontend/src/components/sql-game/leaderboard/LeaderboardModal.jsx
import { useState, useEffect, useCallback } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { sqlGetLeaderboard } from '../../../services/api'
import { LeaderboardTable } from './LeaderboardTable'

export function LeaderboardModal({ onClose, datasets = [], currentDataset, player }) {
  const [selectedDatasetId, setSelectedDatasetId] = useState(currentDataset?.id ?? datasets[0]?.id ?? '')
  const [tab, setTab]         = useState('xp')
  const [data, setData]       = useState(null)
  const [callerRow, setCallerRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetchLeaderboard = useCallback(async () => {
    if (!selectedDatasetId) return
    setLoading(true)
    setError(null)
    setData(null)
    setCallerRow(null)
    try {
      const res = await sqlGetLeaderboard(selectedDatasetId, tab)
      setData(res.data ?? [])
      setCallerRow(res.caller_row ?? null)
    } catch {
      setError('Gagal memuat leaderboard.')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [selectedDatasetId, tab])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl mx-4 bg-surface border border-border rounded-lg flex flex-col font-mono"
           style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="text-xs text-sql-primary tracking-widest uppercase">LEADERBOARD</span>
          <button onClick={onClose} className="text-sql-dim hover:text-accent transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 flex-wrap gap-y-2">
          <select
            value={selectedDatasetId}
            onChange={e => setSelectedDatasetId(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-xs text-accent outline-none flex-1 min-w-0"
          >
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div className="flex gap-1">
            {['xp', 'speed'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  tab === t
                    ? 'border-sql-primary text-sql-primary bg-sql-primary/10'
                    : 'border-border text-sql-dim hover:border-accent'
                }`}
              >
                {t === 'xp' ? 'XP' : 'SPEED'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="text-sql-dim hover:text-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table */}
        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 h-32">
            <p className="text-red-400 text-xs">{error}</p>
            <button onClick={fetchLeaderboard} className="text-xs text-sql-dim hover:text-accent">
              Coba lagi
            </button>
          </div>
        ) : (
          <LeaderboardTable
            rows={loading ? null : (data ?? [])}
            callerRow={callerRow}
            type={tab}
            loggedIn={!!player}
          />
        )}
      </div>
    </div>
  )
}
