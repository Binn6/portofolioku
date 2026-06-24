import { useMemo, useState, useEffect, useRef } from 'react'
import { FileText, Code2, BarChart2, Database, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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

const MOBILE_TABS = [
  { id: 'intel',  label: 'INTEL',  Icon: FileText  },
  { id: 'code',   label: 'CODE',   Icon: Code2     },
  { id: 'output', label: 'OUTPUT', Icon: BarChart2 },
  { id: 'schema', label: 'SCHEMA', Icon: Database  },
]

function PanelHeader({ title, badge }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border border-border border-b-0 rounded-t flex-shrink-0"
      style={{ background: '#0c0c0c' }}>
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 rounded-sm" style={{ background: '#00FF41', boxShadow: '0 0 4px #00FF41' }} />
        <span className="text-[10px] font-mono text-sql-dim tracking-widest uppercase">{title}</span>
        {badge && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ color: '#555', background: '#111', border: '1px solid #222' }}>
            {badge}
          </span>
        )}
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
  const [activeTab, setActiveTab]             = useState('code')
  const [outputDot, setOutputDot]             = useState(false)
  const prevResultRef                         = useRef(null)

  const chapter     = getSelectedChapter()
  const subchapter  = getSelectedSubchapter()
  const schema      = useMemo(() => getDbSchema(), [getDbSchema])
  const { handleRun, handleDeploy } = useSqlGame()
  const mission     = getCurrentMission()
  const allMissions = getDatasetMissions()
  const missionIdx  = allMissions.findIndex(m => m.id === currentMissionId)
  const canPrev = missionIdx > 0
  const canNext = missionIdx < allMissions.length - 1 && solvedMissions.includes(currentMissionId)
  const checkedCols = lastResult?.deployResult?.checkedCols ?? {}

  useEffect(() => {
    const token = localStorage.getItem('sql_player_token')
    if (!token) return
    sqlPlayerMe()
      .then(p => setPlayer(p, token))
      .catch(() => localStorage.removeItem('sql_player_token'))
  }, [])

  // Auto-switch to output on new result (mobile)
  useEffect(() => {
    if (lastResult && lastResult !== prevResultRef.current) {
      prevResultRef.current = lastResult
      setActiveTab('output')
      setOutputDot(false)
    }
  }, [lastResult])

  const handleTabChange = (id) => {
    setActiveTab(id)
    if (id === 'output') setOutputDot(false)
  }

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

  const chapterColor = chapter?.color || '#00FF41'

  return (
    <div className="flex flex-col h-screen bg-background text-accent overflow-hidden">
      <SqlGameNavbar
        player={player}
        onBack={clearDataset}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
        onLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* ─────────────────────────────────────────────────────────────────
          DESKTOP LAYOUT  md+
      ───────────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 min-h-0">
        <aside className="w-64 flex-shrink-0 border-r border-border flex flex-col min-h-0"
          style={{ background: '#0a0a0a' }}>
          <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3 border-b border-border/30">
            {chapter && (
              <div className="font-mono text-xs">
                <p className="text-[9px] tracking-[0.25em] text-sql-dim uppercase mb-1">Modul Aktif</p>
                <p className="font-bold text-sm"
                  style={{ color: chapterColor, textShadow: `0 0 8px ${chapterColor}40` }}>
                  {chapter.name}
                </p>
                {subchapter && (
                  <p className="text-accent-muted text-xs mt-0.5 opacity-70">{subchapter.name}</p>
                )}
              </div>
            )}
            <UserCard rank={rank} player={player} />
          </div>
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

      <div className="hidden md:block">
        <StageFooter
          onPrev={goToPrevMission}
          onNext={goToNextMission}
          canPrev={canPrev}
          canNext={canNext}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          MOBILE LAYOUT  < md
      ───────────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col flex-1 min-h-0">

        {/* ── Mission strip ── */}
        <div className="flex items-center gap-2 px-2 flex-shrink-0 border-b border-border"
          style={{ background: '#080808', height: '48px' }}>

          <button
            onClick={goToPrevMission}
            disabled={!canPrev}
            className="flex items-center justify-center w-8 h-8 rounded border flex-shrink-0 disabled:opacity-20 transition-colors"
            style={{ borderColor: '#252525', color: '#555' }}
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex-1 min-w-0 px-1">
            {chapter && (
              <p className="text-[9px] font-mono tracking-[0.2em] uppercase leading-none mb-0.5 truncate"
                style={{ color: chapterColor }}>
                {chapter.name}
              </p>
            )}
            <p className="text-[11px] font-mono text-accent truncate leading-tight">
              {subchapter?.name || mission?.title || '—'}
            </p>
          </div>

          {/* Progress dots — current mission in set */}
          <div className="flex items-center gap-[3px] flex-shrink-0">
            {allMissions.map((m, i) => {
              const isCurrent = i === missionIdx
              const isDone    = solvedMissions.includes(m.id)
              return (
                <div key={m.id}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width:  isCurrent ? '7px' : '4px',
                    height: isCurrent ? '7px' : '4px',
                    backgroundColor: isDone
                      ? '#00FF41'
                      : isCurrent
                        ? 'rgba(0,255,65,0.55)'
                        : '#252525',
                    boxShadow: isCurrent ? '0 0 5px rgba(0,255,65,0.7)' : undefined,
                  }}
                />
              )
            })}
          </div>

          <button
            onClick={goToNextMission}
            disabled={!canNext}
            className="flex items-center justify-center w-8 h-8 rounded border flex-shrink-0 disabled:opacity-20 transition-colors"
            style={{
              borderColor: canNext ? 'rgba(0,255,65,0.35)' : '#252525',
              color: canNext ? '#00FF41' : '#555',
            }}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <ProgressBar solved={solvedMissions.length} total={allMissions.length} />

        {/* ── Panel content ── */}
        <div className="flex-1 min-h-0 relative overflow-hidden">

          {/* INTEL */}
          <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-150 ${
            activeTab === 'intel' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
          }`}>
            <div className="p-4 space-y-4 pb-6">
              <UserCard rank={rank} player={player} />
              {mission ? (
                <>
                  <MissionBriefing title={mission.title} briefing={mission.briefing} />
                  <ObjectivesList objectives={mission.objectives || []} checkedCols={checkedCols} />
                </>
              ) : (
                <p className="text-sql-dim text-xs font-mono mt-2">Pilih misi untuk memulai.</p>
              )}
            </div>
          </div>

          {/* CODE */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-150 ${
            activeTab === 'code' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
          }`}>
            <div className="flex-1 min-h-0">
              <SqlEditor
                value={queryText}
                onChange={setQueryText}
                schema={schema}
                onRun={handleRun}
                onDeploy={handleDeploy}
              />
            </div>

            {/* Mobile action bar */}
            <div className="flex-shrink-0 border-t border-border" style={{ background: '#070707' }}>
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/20">
                <span className="text-[10px] font-mono" style={{ color: '#3a3a3a' }}>
                  {queryText.length} chars
                </span>
                {isInitializingDb && (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#555' }}>
                    <Loader2 size={10} className="animate-spin" /> INIT DB...
                  </span>
                )}
              </div>
              {!isInitializingDb && (
                <div className="flex">
                  <button
                    onClick={handleRun}
                    className="flex-1 flex items-center justify-center gap-2 py-4 transition-all active:scale-95 active:opacity-80"
                    style={{
                      color: '#00E5FF',
                      borderRight: '1px solid #1c1c1c',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.15em',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>▷</span> RUN
                  </button>
                  <button
                    onClick={handleDeploy}
                    className="flex-1 flex items-center justify-center gap-2 py-4 transition-all active:scale-95 active:opacity-80"
                    style={{
                      color: '#00FF41',
                      background: 'rgba(0,255,65,0.04)',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.15em',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>⚡</span> DEPLOY
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* OUTPUT */}
          <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-150 ${
            activeTab === 'output' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
          }`}>
            <div className="p-3 space-y-3 pb-6">
              {lastResult?.deployResult && (
                <DeployHint deployResult={lastResult.deployResult} />
              )}
              <TerminalOutput result={lastResult} />
            </div>
          </div>

          {/* SCHEMA */}
          <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-150 ${
            activeTab === 'schema' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
          }`}>
            <div className="p-4 pb-6">
              {schema.length > 0
                ? <SchemaPanel schema={schema} />
                : <p className="text-sql-dim text-xs font-mono">Schema belum tersedia.</p>
              }
            </div>
          </div>
        </div>

        {/* ── Bottom HUD nav ── */}
        <div className="flex-shrink-0 border-t border-border"
          style={{
            background: '#050505',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
          <div className="flex">
            {MOBILE_TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id
              const showDot  = id === 'output' && outputDot
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 relative transition-colors"
                  style={{ color: isActive ? '#00FF41' : '#3a3a3a' }}
                >
                  {/* Top glow bar when active */}
                  {isActive && (
                    <div
                      className="absolute top-0 left-[20%] right-[20%] h-px"
                      style={{
                        background: '#00FF41',
                        boxShadow: '0 0 8px #00FF41, 0 0 16px rgba(0,255,65,0.35)',
                      }}
                    />
                  )}
                  <div className="relative">
                    <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                    {showDot && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: '#00FF41', boxShadow: '0 0 4px #00FF41' }}
                      />
                    )}
                  </div>
                  <span className="text-[8px] font-mono tracking-[0.12em] leading-none">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

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
