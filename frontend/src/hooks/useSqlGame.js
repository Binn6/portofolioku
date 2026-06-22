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
    if (!db || !queryText.trim() || !mission) return

    const userResult = runQuery(db, queryText)
    if (userResult.error) {
      store.setLastResult(userResult)
      return
    }

    const expectedResult = runQuery(db, mission.solution_query)
    if (expectedResult.error) {
      store.setLastResult({ error: `Kesalahan internal: ${expectedResult.error}` })
      return
    }

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
  }

  return { handleRun, handleDeploy }
}
