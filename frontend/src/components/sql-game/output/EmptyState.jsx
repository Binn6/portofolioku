import { Database } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-sql-dim">
      <Database size={28} className="opacity-30" />
      <div className="text-center font-mono">
        <p className="text-xs tracking-widest uppercase">AWAITING INSTRUCTIONS.</p>
        <p className="text-xs tracking-widest uppercase opacity-60 mt-1">EXECUTE QUERY TO POPULATE DATA GRID.</p>
      </div>
    </div>
  )
}
