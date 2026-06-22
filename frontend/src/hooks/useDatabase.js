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
