import { ChevronLeft, ChevronRight } from 'lucide-react'

export function StageFooter({ onPrev, onNext, canPrev, canNext }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface flex-shrink-0">
      <span className="text-xs font-mono text-sql-dim">SYSTEM VERSION 1.0.8-BIT</span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-1 px-3 py-1 text-xs font-mono border border-border rounded
            text-accent-muted hover:text-accent hover:border-accent transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={12} /> PREVIOUS
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-1 px-3 py-1 text-xs font-mono border rounded transition
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:border-sql-primary enabled:text-sql-primary enabled:shadow-[0_0_8px_rgba(0,255,65,0.2)]
            enabled:hover:bg-sql-primary/10"
        >
          NEXT STAGE <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}
