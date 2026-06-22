import { useState } from 'react'
import { ChevronDown, ChevronRight, Table2 } from 'lucide-react'

function typeColor(type) {
  if (!type) return 'text-sql-dim'
  const t = type.toUpperCase()
  if (t.includes('INT')) return 'text-sql-secondary'
  if (t.includes('REAL') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('NUMERIC')) return 'text-yellow-400'
  if (t.includes('TEXT') || t.includes('CHAR') || t.includes('CLOB')) return 'text-sql-primary'
  return 'text-sql-dim'
}

/**
 * @param {{ schema: {name:string, columns:{name:string,type:string}[]}[] }} props
 */
export function SchemaPanel({ schema }) {
  const [openMap, setOpenMap] = useState({})

  if (!schema.length) return null

  const toggle = (name) => setOpenMap(m => ({ ...m, [name]: !m[name] }))

  return (
    <div>
      <p className="text-[10px] font-mono text-sql-dim uppercase tracking-widest mb-1.5">Schema</p>
      <div className="space-y-0.5">
        {schema.map(table => (
          <div key={table.name}>
            <button
              onClick={() => toggle(table.name)}
              className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-left hover:bg-surface-2 transition-colors group"
            >
              {openMap[table.name]
                ? <ChevronDown size={10} className="text-sql-dim flex-shrink-0" />
                : <ChevronRight size={10} className="text-sql-dim flex-shrink-0" />}
              <Table2 size={10} className="text-sql-secondary flex-shrink-0" />
              <span className="text-xs font-mono text-accent group-hover:text-sql-primary transition-colors truncate">
                {table.name}
              </span>
              <span className="ml-auto text-[9px] font-mono text-sql-dim">
                {table.columns.length}
              </span>
            </button>

            {openMap[table.name] && (
              <div className="ml-4 pl-2 border-l border-border/60 mb-1">
                {table.columns.map(col => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between px-1.5 py-0.5 rounded hover:bg-surface-2 cursor-default"
                  >
                    <span className="text-[11px] font-mono text-accent-muted truncate">
                      {col.name}
                    </span>
                    <span className={`text-[9px] font-mono ml-2 flex-shrink-0 ${typeColor(col.type)}`}>
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
