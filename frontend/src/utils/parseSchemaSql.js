/**
 * Parses a CREATE TABLE DDL string into a structured schema array.
 * @param {string} schemaSql
 * @returns {{ name: string, columns: { name: string, type: string }[] }[]}
 */
export function parseSchemaSql(schemaSql) {
  if (!schemaSql) return []
  const tables = []
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(([^;]+)\)/gi
  let match
  while ((match = tableRegex.exec(schemaSql)) !== null) {
    const tableName = match[1]
    const columnsStr = match[2]
    const columns = columnsStr
      .split('\n')
      .map(line => line.trim().replace(/,\s*$/, ''))
      .filter(line => {
        if (!line) return false
        const upper = line.toUpperCase()
        return (
          !upper.startsWith('PRIMARY') &&
          !upper.startsWith('UNIQUE') &&
          !upper.startsWith('FOREIGN') &&
          !upper.startsWith('CONSTRAINT') &&
          !upper.startsWith('CHECK') &&
          !upper.startsWith('--')
        )
      })
      .map(line => {
        const parts = line.split(/\s+/)
        const name = parts[0]?.replace(/^["'`]|["'`]$/g, '')
        const rawType = parts[1]?.toUpperCase() || 'TEXT'
        // Normalise: INTEGER PRIMARY KEY → INTEGER
        const type = rawType.replace(/[^A-Z]/g, '') || 'TEXT'
        return { name, type }
      })
      .filter(col => col.name && /^[a-zA-Z_]\w*$/.test(col.name))
    if (tableName && columns.length > 0) {
      tables.push({ name: tableName, columns })
    }
  }
  return tables
}
