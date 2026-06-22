import { describe, it, expect } from 'vitest'
import { compareResults } from './compareResults'

const makeResult = (columns, rows) => ({ columns, rows })

describe('compareResults — ordered', () => {
  it('passes when rows match in order', () => {
    const user = makeResult(['name', 'score'], [['Alice', '90'], ['Bob', '80']])
    const exp  = makeResult(['name', 'score'], [['Alice', '90'], ['Bob', '80']])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })

  it('fails when row order differs', () => {
    const user = makeResult(['name', 'score'], [['Bob', '80'], ['Alice', '90']])
    const exp  = makeResult(['name', 'score'], [['Alice', '90'], ['Bob', '80']])
    const r = compareResults(user, exp, { ordered: true })
    expect(r.pass).toBe(false)
    expect(r.diffs.length).toBeGreaterThan(0)
  })
})

describe('compareResults — unordered', () => {
  it('passes when rows match as a set regardless of order', () => {
    const user = makeResult(['name'], [['Bob'], ['Alice']])
    const exp  = makeResult(['name'], [['Alice'], ['Bob']])
    expect(compareResults(user, exp, { ordered: false }).pass).toBe(true)
  })

  it('fails when a row is missing', () => {
    const user = makeResult(['name'], [['Alice']])
    const exp  = makeResult(['name'], [['Alice'], ['Bob']])
    expect(compareResults(user, exp, { ordered: false }).pass).toBe(false)
  })
})

describe('compareResults — NULL handling', () => {
  it('treats null as null, not as 0 or empty string', () => {
    const user = makeResult(['val'], [[null]])
    const exp  = makeResult(['val'], [[null]])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })

  it('fails when user returns 0 but expected is null', () => {
    const user = makeResult(['val'], [['0']])
    const exp  = makeResult(['val'], [[null]])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(false)
  })
})

describe('compareResults — numeric coercion', () => {
  it('treats "3" and 3 as equal', () => {
    const user = makeResult(['n'], [['3']])
    const exp  = makeResult(['n'], [[3]])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })
})

describe('compareResults — float tolerance', () => {
  it('rounds to 2 decimal places before comparing', () => {
    const user = makeResult(['avg'], [['3.14159']])
    const exp  = makeResult(['avg'], [[3.14]])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })
})

describe('compareResults — column matching', () => {
  it('is case-insensitive for column names', () => {
    const user = makeResult(['NAME', 'SCORE'], [['Alice', '90']])
    const exp  = makeResult(['name', 'score'], [['Alice', '90']])
    expect(compareResults(user, exp, { ordered: true }).pass).toBe(true)
  })

  it('returns checkedCols listing which objective columns are present', () => {
    const user = makeResult(['nama', 'jumlah'], [['Alice', '5']])
    const exp  = makeResult(['nama', 'jumlah'], [['Alice', '5']])
    const r = compareResults(user, exp, { ordered: true, objectives: ['nama', 'jumlah', 'missing_col'] })
    expect(r.checkedCols).toEqual({ nama: true, jumlah: true, missing_col: false })
  })

  it('fails and reports missing column when required column absent', () => {
    const user = makeResult(['name'], [['Alice']])
    const exp  = makeResult(['name', 'score'], [['Alice', '90']])
    const r = compareResults(user, exp, { ordered: true })
    expect(r.pass).toBe(false)
    expect(r.diffs.some(d => d.includes('score'))).toBe(true)
  })
})
