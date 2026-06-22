import { useMemo } from 'react'
import { useSqlGameStore } from '../../store/useSqlGameStore'
import { useSqlGame } from '../../hooks/useSqlGame'
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

export function GameShell() {
  const {
    rank, queryText, setQueryText, lastResult,
    solvedMissions, getDatasetMissions, getCurrentMission,
    currentMissionId, goToNextMission, goToPrevMission, isInitializingDb,
    getSelectedChapter, getSelectedSubchapter, getDbSchema,
  } = useSqlGameStore()

  const chapter = getSelectedChapter()
  const subchapter = getSelectedSubchapter()

  // Memoize schema so SqlEditor doesn't recompute schemaMap on every render
  const schema = useMemo(() => getDbSchema(), [getDbSchema])

  const { handleRun, handleDeploy } = useSqlGame()

  const mission = getCurrentMission()
  const allMissions = getDatasetMissions()
  const missionIdx = allMissions.findIndex(m => m.id === currentMissionId)
  const canPrev = missionIdx > 0
  const canNext = missionIdx < allMissions.length - 1 && solvedMissions.includes(currentMissionId)

  const checkedCols = lastResult?.deployResult?.checkedCols ?? {}

  const PanelHeader = ({ title }) => (
    <div className="flex items-center justify-between px-3 py-2 border border-border border-b-0 rounded-t bg-surface flex-shrink-0">
      <span className="text-xs font-mono text-sql-dim uppercase tracking-widest">{title}</span>
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF79C6] opacity-60" />
        <div className="w-2.5 h-2.5 rounded-full bg-sql-primary opacity-60" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-background text-accent overflow-hidden">
      <SqlGameNavbar />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-border flex flex-col overflow-y-auto p-4 gap-4 bg-surface">
          {chapter && (
            <div className="font-mono text-xs border-b border-border pb-3">
              <p className="text-sql-dim uppercase tracking-widest mb-1">Modul</p>
              <p className="font-semibold" style={{ color: chapter.color || '#00FF41' }}>
                {chapter.name}
              </p>
              {subchapter && (
                <p className="text-accent-muted mt-0.5">{subchapter.name}</p>
              )}
            </div>
          )}
          <UserCard rank={rank} />
          {mission && (
            <>
              <MissionBriefing title={mission.title} briefing={mission.briefing} />
              <ObjectivesList objectives={mission.objectives || []} checkedCols={checkedCols} />
            </>
          )}
          {schema.length > 0 && <SchemaPanel schema={schema} />}
        </aside>

        {/* Main panel */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          <ProgressBar solved={solvedMissions.length} total={allMissions.length} />

          <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
            {/* Editor section */}
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

            {/* Output section */}
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
    </div>
  )
}
