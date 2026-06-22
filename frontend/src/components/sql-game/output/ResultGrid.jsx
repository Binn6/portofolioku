export function ResultGrid({ columns, rows }) {
  if (!columns || columns.length === 0) return (
    <p className="text-xs font-mono text-sql-dim p-3">Query executed — no rows returned.</p>
  )

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs font-mono border-collapse">
        <thead className="sticky top-0 bg-surface z-10">
          <tr>
            {columns.map(col => (
              <th key={col} className="text-left px-3 py-2 text-sql-secondary border-b border-border whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-surface-2 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 border-b border-border/40 text-accent whitespace-nowrap">
                  {cell === null ? <span className="text-sql-dim italic">NULL</span> : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
