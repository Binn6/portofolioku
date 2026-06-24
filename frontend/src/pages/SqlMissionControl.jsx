import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useSqlGameStore } from '../store/useSqlGameStore'
import { useDatabase } from '../hooks/useDatabase'
import { getSqlGameConfig } from '../services/api'
import { LearningPathSelector } from '../components/sql-game/LearningPathSelector'
import { DatabaseSelector } from '../components/sql-game/DatabaseSelector'
import { GameShell } from '../components/sql-game/GameShell'

export default function SqlMissionControl() {
  const {
    datasets, chapters, subchapters, isLoading,
    selectedDataset, db, setApiData, selectDataset, isInitializingDb,
  } = useSqlGameStore()

  useDatabase()

  const loadConfig = () => {
    getSqlGameConfig()
      .then(({ datasets, missions, chapters = [], subchapters = [] }) => {
        setApiData(datasets, missions, chapters, subchapters)
        if (datasets.length === 1) {
          selectDataset(datasets[0])
        }
      })
      .catch(err => {
        console.error('Failed to load sql game config:', err)
        setApiData([], [], [], [])
      })
  }

  useEffect(() => { loadConfig() }, [])

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
    if (chapters.length > 0) {
      return (
        <LearningPathSelector
          chapters={chapters}
          subchapters={subchapters}
          datasets={datasets}
          onSelect={selectDataset}
          onRefresh={loadConfig}
        />
      )
    }
    return <DatabaseSelector datasets={datasets} onSelect={selectDataset} />
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
