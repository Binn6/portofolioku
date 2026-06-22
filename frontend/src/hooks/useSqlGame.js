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

    if (!db) {
      store.setLastResult({ error: 'Database belum siap. Coba refresh halaman.' })
      return
    }
    if (!queryText.trim()) {
      store.setLastResult({ error: 'Tulis query SQL terlebih dahulu.' })
      return
    }
    if (!mission) {
      store.setLastResult({ error: 'Tidak ada misi yang aktif.' })
      return
    }

    const userResult = runQuery(db, queryText)
    if (userResult.error) {
      store.setLastResult(userResult)
      return
    }

    if (!mission.solution_query) {
      store.setLastResult({ error: 'Kesalahan internal: misi tidak memiliki query solusi.' })
      return
    }

    const expectedResult = runQuery(db, mission.solution_query)
    if (expectedResult.error) {
      store.setLastResult({ error: `Kesalahan internal: ${expectedResult.error}` })
      return
    }

    try {
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
    } catch (err) {
      store.setLastResult({ error: `Kesalahan internal: ${err.message}` })
    }
  }

  return { handleRun, handleDeploy }
}
