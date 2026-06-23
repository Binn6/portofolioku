import { EmptyState } from './EmptyState'
import { ResultGrid } from './ResultGrid'
import { CheckCircle2, XCircle, Activity } from 'lucide-react'

export function TerminalOutput({ result }) {
  const deployResult = result?.deployResult

  return (
    <div className="flex flex-col h-full rounded border border-border overflow-hidden"
      style={{ background: '#060606' }}>

      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0"
        style={{ background: '#0c0c0c' }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#FF5F57' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#FEBC2E' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: '#28C840' }} />
          </div>
          <span className="text-border mx-1">│</span>
          <Activity size={10} className="text-sql-dim" />
          <span className="text-[10px] font-mono tracking-widest text-sql-dim">DATA OUTPUT</span>
        </div>

        {deployResult ? (
          deployResult.pass ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-wide"
              style={{ color: '#00FF41', textShadow: '0 0 6px rgba(0,255,65,0.5)' }}>
              <CheckCircle2 size={11} /> MISSION COMPLETE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 tracking-wide">
              <XCircle size={11} /> VALIDATION FAILED
            </span>
          )
        ) : (
          result?.columns ? (
            <span className="text-[10px] font-mono text-sql-dim">
              {result.rows?.length ?? 0} rows
            </span>
          ) : null
        )}
      </div>

      {/* Error */}
      {result?.error && (
        <div className="px-4 py-3 flex-shrink-0 border-b border-border/40">
          <p className="text-[11px] font-mono text-red-400 whitespace-pre-wrap leading-relaxed">
            <span className="text-red-500/60 mr-2">ERR!</span>{result.error}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {!result || (!result.columns && !result.error) ? (
          <EmptyState />
        ) : result.columns ? (
          <ResultGrid columns={result.columns} rows={result.rows} />
        ) : null}
      </div>
    </div>
  )
}
