import { Shield } from 'lucide-react'

export function MissionBriefing({ title, briefing }) {
  return (
    <div className="rounded border border-border overflow-hidden" style={{ background: '#080808' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50"
        style={{ background: '#0c0c0c' }}>
        <Shield size={10} className="text-sql-primary flex-shrink-0" />
        <span className="text-[9px] font-mono tracking-[0.25em] text-sql-dim uppercase">Intel Aktif</span>
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sql-primary"
          style={{ boxShadow: '0 0 4px #00FF41', animation: 'pulse 2s infinite' }} />
      </div>
      <div className="px-3 pt-2.5 pb-3 space-y-2">
        <p className="text-xs font-mono font-bold text-sql-primary leading-snug tracking-wide">
          {title}
        </p>
        <p className="text-[11px] font-mono text-accent-muted leading-relaxed border-l-2 pl-2"
          style={{ borderColor: '#2a2a2a' }}>
          {briefing}
        </p>
      </div>
    </div>
  )
}
