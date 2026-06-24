import { useMemo, useState, useEffect } from 'react'
import { useSqlGameStore } from '../../store/useSqlGameStore'
import { useSqlGame } from '../../hooks/useSqlGame'
import { sqlPlayerMe, sqlPlayerLogout, sqlGetProgress } from '../../services/api'
import { ProgressBar } from './ProgressBar'
import { UserCard } from './sidebar/UserCard'
import { MissionBriefing } from './sidebar/MissionBriefing'
import { ObjectivesList } from './sidebar/ObjectivesList'
import { SchemaPanel } from './sidebar/SchemaPanel'
import { SqlEditor } from './editor/SqlEditor'
import { EditorToolbar } from './editor/EditorToolbar'
import { TerminalOutput } from './output/TerminalOutput'
import { DeployHint } from './output/DeployHint'
import { StageFooter } from './StageFooter'
import { SqlGameNavbar } from './SqlGameNavbar'
import { AuthModal } from './auth/AuthModal'
import { LeaderboardModal } from './leaderboard/LeaderboardModal'

function PanelHeader({ title, badge }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border border-border border-b-0 rounded-t flex-shrink-0"
      style={{ background: '#0c0c0c' }}>
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 rounded-sm" style={{ background: '#00FF41', boxShadow: '0 0 4px #00FF41' }} />
        <span className="text-[10px] font-mono text-sql-dim tracking-widest uppercase">{title}</span>
        {badge && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#555', background: '#111', border: '1px solid #222' }}>{badge}</span>}
      </div>
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: '#FF5F57', opacity: 0.6 }} />
        <div className="w-2 h-2 rounded-full" style={{ background: '#FEBC2E', opacity: 0.6 }} />
        <div className="w-2 h-2 rounded-full" style={{ background: '#28C840', opacity: 0.6 }} />
      </div>
    </div>
  )
}

export function GameShell() {
  const store = useSqlGameStore()
  const {
    rank, queryText, setQueryText, lastResult,
    solvedMissions, getDatasetMissions, getCurrentMission,
    currentMissionId, goToNextMission, goToPrevMission, isInitializingDb,
    getSelectedChapter, getSelectedSubchapter, getDbSchema,
    player, datasets,
    setPlayer, clearPlayer, hydrateProgress, selectedDataset, clearDataset,
  } = store

  const [showAuth, setShowAuth]               = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const chapter    = getSelectedChapter()
  const subchapter = getSelectedSubchapter()
  const schema     = useMemo(() => getDbSchema(), [getDbSchema])
  const { handleRun, handleDeploy } = useSqlGame()
  const mission    = getCurrentMission()
  const allMissions = getDatasetMissions()
  const missionIdx  = allMissions.findIndex(m => m.id === currentMissionId)
  const canPrev = missionIdx > 0
  const canNext = missionIdx < allMissions.length - 1 && solvedMissions.includes(currentMissionId)
  const checkedCols = lastResult?.deployResult?.checkedCols ?? {}

  // On mount: restore session from localStorage token
  useEffect(() => {
    const token = localStorage.getItem('sql_player_token')
    if (!token) return
    sqlPlayerMe()
      .then(p => setPlayer(p, token))
      .catch(() => localStorage.removeItem('sql_player_token'))
  }, [])

  const handleLoginSuccess = async (p, token) => {
    setPlayer(p, token)
    setShowAuth(false)
    if (selectedDataset) {
      try {
        const progress = await sqlGetProgress(selectedDataset.id)
        if (progress) {
          hydrateProgress(progress.solved_missions ?? [], progress.mission_times ?? {})
        }
      } catch (_) {}
    }
  }

  const handleLogout = async () => {
    try { await sqlPlayerLogout() } catch (_) {}
    clearPlayer()
  }

  return (
    <div className="flex flex-col h-screen bg-background text-accent overflow-hidden">
      <SqlGameNavbar
        player={player}
        onBack={clearDataset}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
        onLeaderboard={() => setShowLeaderboard(true)}
      />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-border flex flex-col min-h-0"
          style={{ background: '#0a0a0a' }}>

          {/* ── Sticky top: chapter label + player card ── */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3 border-b border-border/30">
            {chapter && (
              <div className="font-mono text-xs">
                <p className="text-[9px] tracking-[0.25em] text-sql-dim uppercase mb-1">Modul Aktif</p>
                <p className="font-bold text-sm"
                  style={{ color: chapter.color || '#00FF41', textShadow: `0 0 8px ${chapter.color || '#00FF41'}40` }}>
                  {chapter.name}
                </p>
                {subchapter && (
                  <p className="text-accent-muted text-xs mt-0.5 opacity-70">{subchapter.name}</p>
                )}
              </div>
            )}
            <UserCard rank={rank} player={player} />
          </div>

          {/* ── Scrollable body: mission intel + schema ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
            {mission && (
              <>
                <MissionBriefing title={mission.title} briefing={mission.briefing} />
                <ObjectivesList objectives={mission.objectives || []} checkedCols={checkedCols} />
              </>
            )}
            {schema.length > 0 && <SchemaPanel schema={schema} />}
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          <ProgressBar solved={solvedMissions.length} total={allMissions.length} />

          <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
            <div className="flex flex-col flex-shrink-0" style={{ height: '40%' }}>
              <PanelHeader title="SQL COMMAND LINE" />
              <SqlEditor
                value={queryText}
                onChange={setQueryText}
                schema={schema}
                onRun={handleRun}
                onDeploy={handleDeploy}
              />
              <EditorToolbar
                charCount={queryText.length}
                onRun={handleRun}
                onDeploy={handleDeploy}
                isInitializing={isInitializingDb}
              />
            </div>

            <DeployHint deployResult={lastResult?.deployResult} />

            <div className="flex-1 min-h-0">
              <TerminalOutput result={lastResult} />
            </div>
          </div>
        </main>
      </div>

      <StageFooter
        onPrev={goToPrevMission}
        onNext={goToNextMission}
        canPrev={canPrev}
        canNext={canNext}
      />

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          onClose={() => setShowLeaderboard(false)}
          datasets={datasets}
          currentDataset={selectedDataset}
          player={player}
        />
      )}
    </div>
  )
}
