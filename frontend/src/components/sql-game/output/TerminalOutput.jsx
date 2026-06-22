import { EmptyState } from './EmptyState'
import { ResultGrid } from './ResultGrid'
import { CheckCircle, XCircle, Terminal } from 'lucide-react'

export function TerminalOutput({ result }) {
  const deployResult = result?.deployResult

  return (
    <div className="flex flex-col h-full border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <Terminal size={12} className="text-sql-dim ml-2" />
          <span className="text-xs font-mono text-sql-dim">TERMINAL OUTPUT</span>
        </div>
        {deployResult && (
          deployResult.pass
            ? <span className="flex items-center gap-1 text-xs font-mono text-sql-primary">
                <CheckCircle size={12} /> MISSION COMPLETE
              </span>
            : <span className="flex items-center gap-1 text-xs font-mono text-red-400">
                <XCircle size={12} /> VALIDATION FAILED
              </span>
        )}
      </div>

      {/* Error state */}
      {result?.error && (
        <div className="p-3 flex-shrink-0">
          <p className="text-xs font-mono text-red-400 whitespace-pre-wrap">{result.error}</p>
        </div>
      )}

      {/* Result grid or empty state */}
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
