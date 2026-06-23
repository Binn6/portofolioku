import { create } from 'zustand'
import { parseSchemaSql } from '../utils/parseSchemaSql'
import { sqlSyncProgress } from '../services/api'

const RANK_PROGRESSION = [
  'Script Kiddie',
  'Query Runner',
  'Join Master',
  'Index Wizard',
]

export const useSqlGameStore = create((set, get) => ({
  // From API
  chapters: [],
  subchapters: [],
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

  // Player auth
  player: null,
  playerToken: typeof window !== 'undefined' ? (localStorage.getItem('sql_player_token') ?? null) : null,

  // Mission timing
  missionStartTimes: {},
  missionTimes: {},

  // Actions
  setApiData: (datasets, missions, chapters = [], subchapters = []) =>
    set({ datasets, missions, chapters, subchapters, isLoading: false }),

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
      missionStartTimes: first ? { [first.id]: Date.now() } : {},
      missionTimes: {},
    })
  },

  clearDataset: () => {
    const { db } = get()
    if (db) { try { db.close() } catch (_) {} }
    set({
      selectedDataset: null,
      db: null,
      currentMissionId: null,
      lastResult: null,
      queryText: '',
      isInitializingDb: false,
      solvedMissions: [],
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

  getSelectedChapter: () => {
    const { chapters, selectedDataset } = get()
    if (!selectedDataset?.chapter_id) return null
    return chapters.find(c => c.id === selectedDataset.chapter_id) ?? null
  },

  getSelectedSubchapter: () => {
    const { subchapters, selectedDataset } = get()
    if (!selectedDataset?.subchapter_id) return null
    return subchapters.find(s => s.id === selectedDataset.subchapter_id) ?? null
  },

  getDbSchema: () => {
    const { selectedDataset } = get()
    return parseSchemaSql(selectedDataset?.schema_sql ?? '')
  },

  solveMission: (missionId) => {
    const { solvedMissions, missions } = get()
    if (solvedMissions.includes(missionId)) return

    get().recordMissionSolve(missionId)

    const solved  = [...solvedMissions, missionId]
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
      set(state => ({
        missionStartTimes: { ...state.missionStartTimes, [next.id]: Date.now() },
      }))
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
      set(state => ({
        missionStartTimes: { ...state.missionStartTimes, [prev.id]: Date.now() },
      }))
    }
  },

  setPlayer: (player, token) => {
    if (token) localStorage.setItem('sql_player_token', token)
    else localStorage.removeItem('sql_player_token')
    set({ player, playerToken: token })
  },

  clearPlayer: () => {
    localStorage.removeItem('sql_player_token')
    set({ player: null, playerToken: null })
  },

  recordMissionStart: (missionId) => {
    set(state => ({
      missionStartTimes: { ...state.missionStartTimes, [missionId]: Date.now() },
    }))
  },

  recordMissionSolve: (missionId) => {
    const { missionStartTimes, player, selectedDataset } = get()
    const startTime = missionStartTimes[missionId]
    const seconds   = startTime ? Math.round((Date.now() - startTime) / 1000) : 0

    set(state => ({
      missionTimes: { ...state.missionTimes, [missionId]: seconds },
    }))

    if (player && selectedDataset) {
      sqlSyncProgress({
        dataset_id: selectedDataset.id,
        mission_id: missionId,
        seconds,
      }).catch(() => {})  // silent fail — progress already in local state
    }
  },

  hydrateProgress: (solvedMissions, missionTimes) => {
    const { missions, selectedDataset } = get()
    const currentSolved = get().solvedMissions
    const currentTimes  = get().missionTimes

    const merged = [...new Set([...currentSolved, ...solvedMissions])]
    const times  = { ...missionTimes, ...currentTimes } // session times take precedence

    // Recompute rank from merged solved list
    let rank = RANK_PROGRESSION[0]
    if (selectedDataset) {
      const datasetMissions = missions
        .filter(m => m.dataset_id === selectedDataset.id)
        .sort((a, b) => a.stage_order - b.stage_order)
      for (const mId of merged) {
        const m = datasetMissions.find(m => m.id === mId)
        if (m?.rank_unlock) rank = m.rank_unlock
      }
    }

    set({ solvedMissions: merged, missionTimes: times, rank })
  },
}))
