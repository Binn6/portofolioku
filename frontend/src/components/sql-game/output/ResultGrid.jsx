export function ResultGrid({ columns, rows }) {
  if (!columns || columns.length === 0) return (
    <p className="text-[11px] font-mono text-sql-dim p-4 opacity-60">
      Query executed — no rows returned.
    </p>
  )

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-[11px] font-mono border-collapse">
        <thead className="sticky top-0 z-10" style={{ background: '#0e0e0e' }}>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="text-left px-3 py-2 border-b whitespace-nowrap font-bold tracking-wide"
                style={{ color: '#00E5FF', borderColor: '#1e1e1e' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              className="transition-colors"
              style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)'}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 whitespace-nowrap"
                  style={{ color: cell === null ? '#333' : '#c0c0c0', borderBottom: '1px solid #111', fontStyle: cell === null ? 'italic' : undefined }}>
                  {cell === null ? 'NULL' : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
