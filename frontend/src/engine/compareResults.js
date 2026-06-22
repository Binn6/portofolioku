export function compareResults(userResult, expectedResult, { ordered, objectives = [] }) {
  const diffs = []

  const userCols = userResult.columns.map(c => c.toLowerCase())
  const expCols  = expectedResult.columns.map(c => c.toLowerCase())

  for (const col of expCols) {
    if (!userCols.includes(col)) {
      diffs.push(`Kolom "${col}" tidak ditemukan dalam hasil query kamu`)
    }
  }

  if (diffs.length > 0) {
    return { pass: false, diffs, checkedCols: buildCheckedCols(userCols, objectives) }
  }

  const normalise = (row, srcCols) => {
    const srcLower = srcCols.map(c => c.toLowerCase())
    return expCols.map(col => normaliseValue(row[srcLower.indexOf(col)]))
  }

  const userRows = userResult.rows.map(r => normalise(r, userResult.columns))
  const expRows  = expectedResult.rows.map(r => normalise(r, expectedResult.columns))

  if (ordered) {
    if (userRows.length !== expRows.length) {
      diffs.push(`Jumlah baris berbeda: kamu ${userRows.length}, seharusnya ${expRows.length}`)
    } else {
      for (let i = 0; i < expRows.length; i++) {
        if (!rowsEqual(userRows[i], expRows[i])) {
          diffs.push(`Baris ke-${i + 1} tidak sesuai`)
          if (diffs.length >= 3) break
        }
      }
    }
  } else {
    const sortKey = rows => rows.map(r => JSON.stringify(r)).sort()
    const userSorted = sortKey(userRows)
    const expSorted  = sortKey(expRows)

    if (userSorted.length !== expSorted.length) {
      diffs.push(`Jumlah baris berbeda: kamu ${userRows.length}, seharusnya ${expRows.length}`)
    } else {
      for (let i = 0; i < expSorted.length; i++) {
        if (userSorted[i] !== expSorted[i]) {
          diffs.push('Terdapat baris yang tidak cocok (urutan tidak diuji, tapi isi harus sama)')
          break
        }
      }
    }
  }

  return { pass: diffs.length === 0, diffs, checkedCols: buildCheckedCols(userCols, objectives) }
}

function normaliseValue(v) {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (s === '') return null
  const n = Number(s)
  if (!isNaN(n)) return Math.round(n * 100) / 100
  return s
}

function rowsEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] === null && b[i] === null) continue
    if (a[i] !== b[i]) return false
  }
  return true
}

function buildCheckedCols(userCols, objectives) {
  const result = {}
  for (const obj of objectives) {
    result[obj] = userCols.includes(obj.toLowerCase())
  }
  return result
}
