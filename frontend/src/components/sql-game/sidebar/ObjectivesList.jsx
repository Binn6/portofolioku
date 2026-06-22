import { CheckSquare, Square } from 'lucide-react'

export function ObjectivesList({ objectives, checkedCols = {} }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-mono text-sql-dim uppercase tracking-widest mb-2">Mission Objectives</p>
      {objectives.map((obj, i) => {
        const done = checkedCols[obj.col] === true
        return (
          <div key={i} className="flex items-start gap-2">
            {done
              ? <CheckSquare size={13} className="text-sql-primary flex-shrink-0 mt-0.5 drop-shadow-[0_0_4px_rgba(0,255,65,0.6)]" />
              : <Square size={13} className="text-sql-dim flex-shrink-0 mt-0.5" />}
            <span className={`text-xs font-mono leading-relaxed ${done ? 'text-sql-primary' : 'text-accent-muted'}`}>
              <span className="text-accent">{obj.col}</span>
              {' — '}{obj.desc}
            </span>
          </div>
        )
      })}
    </div>
  )
}
