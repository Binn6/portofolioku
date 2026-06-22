import { Database } from 'lucide-react'

export function DatabaseSelector({ datasets, onSelect }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <p className="text-sql-primary font-mono text-sm tracking-widest uppercase mb-2">▶ SQL MISSION CONTROL</p>
          <h1 className="text-2xl font-display font-bold text-accent">SELECT DATABASE</h1>
          <p className="text-accent-muted font-mono text-sm mt-2">Pilih dataset untuk mulai latihan SQL</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {datasets.map(d => (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className="text-left p-5 bg-surface border border-border rounded-xl
                hover:border-sql-primary hover:shadow-[0_0_16px_rgba(0,255,65,0.1)]
                transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <Database size={18} className="text-sql-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-accent font-mono font-semibold text-sm group-hover:text-sql-primary transition-colors">
                    {d.name}
                  </p>
                  {d.description && (
                    <p className="text-xs text-accent-muted mt-1 line-clamp-2">{d.description}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
