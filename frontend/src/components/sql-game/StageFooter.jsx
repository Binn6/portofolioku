import { ChevronLeft, ChevronRight } from 'lucide-react'

export function StageFooter({ onPrev, onNext, canPrev, canNext }) {
  return (
    <div className="flex items-center justify-between px-4 h-10 border-t border-border flex-shrink-0"
      style={{ background: '#0a0a0a' }}>
      <span className="text-[9px] font-mono tracking-widest" style={{ color: '#2a2a2a' }}>
        SYS v1.0
      </span>

      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-1 px-3 py-1 text-[11px] font-mono border rounded transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed"
          style={{ borderColor: '#2a2a2a', color: '#888' }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = '#555', e.currentTarget.style.color = '#ccc')}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888' }}
        >
          <ChevronLeft size={11} /> PREV
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-1 px-3 py-1 text-[11px] font-mono border rounded transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed"
          style={{
            borderColor: canNext ? 'rgba(0,255,65,0.5)' : '#2a2a2a',
            color: canNext ? '#00FF41' : '#888',
            background: canNext ? 'rgba(0,255,65,0.07)' : 'transparent',
            boxShadow: canNext ? '0 0 8px rgba(0,255,65,0.15)' : undefined,
          }}
          onMouseEnter={e => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.borderColor = '#00FF41'
              e.currentTarget.style.boxShadow = '0 0 14px rgba(0,255,65,0.3)'
            }
          }}
          onMouseLeave={e => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.borderColor = 'rgba(0,255,65,0.5)'
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0,255,65,0.15)'
            }
          }}
        >
          NEXT <ChevronRight size={11} />
        </button>
      </div>
    </div>
  )
}
