import { Check } from 'lucide-react'

export function ObjectivesList({ objectives, checkedCols = {} }) {
  const done  = objectives.filter(obj => checkedCols[obj.col] === true).length
  const total = objectives.length

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-mono tracking-[0.25em] text-sql-dim uppercase">Objectives</span>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[9px] font-mono"
          style={{ color: done === total && total > 0 ? '#00FF41' : '#444' }}>
          {done}/{total}
        </span>
      </div>

      <div className="space-y-1">
        {objectives.map((obj, i) => {
          const checked = checkedCols[obj.col] === true
          return (
            <div key={i}
              className="flex items-start gap-2 rounded px-2 py-1.5 transition-all duration-300"
              style={{ background: checked ? 'rgba(0,255,65,0.05)' : 'transparent' }}>
              <div
                className="flex-shrink-0 mt-0.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all duration-300"
                style={{
                  borderColor: checked ? '#00FF41' : '#333',
                  background: checked ? 'rgba(0,255,65,0.15)' : 'transparent',
                  boxShadow: checked ? '0 0 5px rgba(0,255,65,0.3)' : undefined,
                }}
              >
                {checked && <Check size={8} strokeWidth={3} style={{ color: '#00FF41' }} />}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-bold"
                  style={{ color: checked ? '#00FF41' : '#ccc' }}>
                  {obj.col}
                </span>
                <span className="text-[10px] font-mono ml-1.5"
                  style={{ color: checked ? 'rgba(0,255,65,0.5)' : '#555' }}>
                  {obj.desc}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
