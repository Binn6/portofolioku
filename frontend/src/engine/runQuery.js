// frontend/src/engine/runQuery.js

/**
 * Execute a SQL query against a sql.js Database instance.
 * @param {import('sql.js').Database} db
 * @param {string} sql
 * @returns {{ columns: string[], rows: any[][] } | { error: string }}
 */
export function runQuery(db, sql) {
  try {
    const results = db.exec(sql)
    if (!results || results.length === 0) {
      return { columns: [], rows: [] }
    }
    const { columns, values } = results[0]
    return { columns, rows: values }
  } catch (err) {
    return { error: err.message }
  }
}
