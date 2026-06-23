import { Play, Zap, Loader2 } from 'lucide-react'

export function EditorToolbar({ charCount, onRun, onDeploy, isInitializing }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border border-border border-t-0 rounded-b flex-shrink-0"
      style={{ background: '#080808' }}>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-sql-dim">{charCount} chars</span>
        <span className="text-border hidden lg:block">│</span>
        <span className="text-[9px] font-mono text-sql-dim/50 hidden lg:flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 border border-border/50 rounded text-[8px] font-mono">Ctrl+↵</kbd> RUN
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 border border-border/50 rounded text-[8px] font-mono">Ctrl+⇧+↵</kbd> DEPLOY
          </span>
        </span>
      </div>

      <div className="flex gap-2">
        {isInitializing ? (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-sql-dim px-3 py-1.5">
            <Loader2 size={11} className="animate-spin" /> INIT DB...
          </span>
        ) : (
          <>
            <button
              onClick={onRun}
              className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono rounded transition-all duration-150"
              style={{
                border: '1px solid rgba(0,229,255,0.4)',
                color: '#00E5FF',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,229,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,229,255,0.8)'
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0,229,255,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <Play size={9} strokeWidth={3} /> RUN
            </button>
            <button
              onClick={onDeploy}
              className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono rounded transition-all duration-150"
              style={{
                border: '1px solid rgba(0,255,65,0.5)',
                color: '#00FF41',
                background: 'rgba(0,255,65,0.08)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,255,65,0.15)'
                e.currentTarget.style.borderColor = '#00FF41'
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0,255,65,0.35)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,255,65,0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,255,65,0.5)'
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <Zap size={9} strokeWidth={3} /> DEPLOY
            </button>
          </>
        )}
      </div>
    </div>
  )
}
