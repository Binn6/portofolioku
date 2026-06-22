export function ProgressBar({ solved, total }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0
  return (
    <div className="w-full h-0.5 bg-border relative">
      <div
        className="h-full bg-sql-primary transition-all duration-500 shadow-[0_0_6px_rgba(0,255,65,0.5)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
