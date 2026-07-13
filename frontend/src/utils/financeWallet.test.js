import { describe, it, expect, beforeEach } from 'vitest'
import { getOrCreateVisitorTag, formatRupiah } from './financeWallet'

describe('getOrCreateVisitorTag', () => {
  beforeEach(() => localStorage.clear())

  it('creates an alphanumeric tag and persists it across calls', () => {
    const first = getOrCreateVisitorTag()
    const second = getOrCreateVisitorTag()

    expect(first).toMatch(/^[a-zA-Z0-9]+$/)
    expect(first.length).toBeLessThanOrEqual(20)
    expect(second).toBe(first)
  })
})

describe('formatRupiah', () => {
  it('formats a number as Indonesian rupiah', () => {
    expect(formatRupiah(25000)).toBe('Rp25.000')
  })

  it('treats missing amounts as zero', () => {
    expect(formatRupiah(undefined)).toBe('Rp0')
  })
})
