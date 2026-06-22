import { FileText } from 'lucide-react'

export function MissionBriefing({ title, briefing }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-sql-dim flex-shrink-0" />
        <span className="text-xs font-mono text-accent font-semibold truncate">{title}</span>
      </div>
      <p className="text-xs font-mono text-accent-muted leading-relaxed border-l-2 border-border pl-3">
        "{briefing}"
      </p>
    </div>
  )
}
