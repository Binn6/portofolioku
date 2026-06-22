// frontend/src/store/useSqlGameStore.js
import { create } from 'zustand'

const RANK_PROGRESSION = [
  'Script Kiddie',
  'Query Runner',
  'Join Master',
  'Index Wizard',
]

export const useSqlGameStore = create((set, get) => ({
  // From API
  datasets: [],
  missions: [],

  // Session state
  selectedDataset: null,
  db: null,
  currentMissionId: null,
  solvedMissions: [],
  rank: RANK_PROGRESSION[0],
  lastResult: null,
  queryText: '',
  isLoading: true,
  isInitializingDb: false,

  // Actions
  setApiData: (datasets, missions) => set({ datasets, missions, isLoading: false }),

  setQueryText: (text) => set({ queryText: text }),

  setLastResult: (result) => set({ lastResult: result }),

  selectDataset: (dataset) => {
    const { missions } = get()
    const datasetMissions = missions
      .filter(m => m.dataset_id === dataset.id)
      .sort((a, b) => a.stage_order - b.stage_order)
    const first = datasetMissions[0] ?? null
    set({
      selectedDataset: dataset,
      currentMissionId: first?.id ?? null,
      solvedMissions: [],
      rank: RANK_PROGRESSION[0],
      lastResult: null,
      queryText: first?.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
    })
  },

  setDb: (db) => set({ db, isInitializingDb: false }),

  setInitializingDb: (v) => set({ isInitializingDb: v }),

  getCurrentMission: () => {
    const { missions, currentMissionId } = get()
    return missions.find(m => m.id === currentMissionId) ?? null
  },

  getDatasetMissions: () => {
    const { missions, selectedDataset } = get()
    if (!selectedDataset) return []
    return missions
      .filter(m => m.dataset_id === selectedDataset.id)
      .sort((a, b) => a.stage_order - b.stage_order)
  },

  solveMission: (missionId) => {
    const { solvedMissions, missions } = get()
    if (solvedMissions.includes(missionId)) return

    const solved = [...solvedMissions, missionId]
    const mission = missions.find(m => m.id === missionId)

    let rank = get().rank
    if (mission?.rank_unlock) rank = mission.rank_unlock

    set({ solvedMissions: solved, rank })
  },

  goToNextMission: () => {
    const { getDatasetMissions, currentMissionId } = get()
    const ordered = getDatasetMissions()
    const idx = ordered.findIndex(m => m.id === currentMissionId)
    if (idx < ordered.length - 1) {
      const next = ordered[idx + 1]
      set({
        currentMissionId: next.id,
        lastResult: null,
        queryText: next.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
      })
    }
  },

  goToPrevMission: () => {
    const { getDatasetMissions, currentMissionId } = get()
    const ordered = getDatasetMissions()
    const idx = ordered.findIndex(m => m.id === currentMissionId)
    if (idx > 0) {
      const prev = ordered[idx - 1]
      set({
        currentMissionId: prev.id,
        lastResult: null,
        queryText: prev.starter_sql ?? '-- Tulis query SQL-mu di sini...\n\nSELECT ',
      })
    }
  },
}))
