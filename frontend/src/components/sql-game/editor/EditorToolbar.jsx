import { Button } from '../ui/Button'
import { Loader2 } from 'lucide-react'

export function EditorToolbar({ charCount, onRun, onDeploy, isInitializing }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border border-border border-t-0 rounded-b bg-surface">
      <span className="text-xs font-mono text-sql-dim">
        Characters: {charCount} / CPU: Normal
      </span>
      <div className="flex gap-2">
        {isInitializing ? (
          <span className="flex items-center gap-1.5 text-xs font-mono text-sql-dim">
            <Loader2 size={12} className="animate-spin" /> Initializing DB...
          </span>
        ) : (
          <>
            <Button variant="secondary" onClick={onRun}>RUN QUERY</Button>
            <Button variant="primary" onClick={onDeploy}>DEPLOY QUERY</Button>
          </>
        )}
      </div>
    </div>
  )
}
