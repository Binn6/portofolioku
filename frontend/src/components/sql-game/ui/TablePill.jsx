export function TablePill({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono
      bg-sql-tertiary/10 border border-sql-tertiary/40 text-sql-tertiary
      shadow-[0_0_6px_rgba(255,0,229,0.2)]">
      {children}
    </span>
  )
}
