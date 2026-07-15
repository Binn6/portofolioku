import { describe, it, expect } from 'vitest'
import { tiuQuestions } from './tiuQuestions'

describe('tiuQuestions', () => {
  it('has exactly 10 questions, each with 5 valid options A-E and a valid correctIndex', () => {
    expect(tiuQuestions).toHaveLength(10)

    tiuQuestions.forEach((q) => {
      expect(q.options).toHaveLength(5)
      expect(q.options.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D', 'E'])
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(5)
      expect(typeof q.category).toBe('string')
      expect(q.category.length).toBeGreaterThan(0)
      expect(typeof q.explanation).toBe('string')
      expect(q.explanation.length).toBeGreaterThan(0)
      q.options.forEach((o) => {
        expect(o.text || o.image).toBeTruthy()
      })
    })
  })

  it('includes the two figural questions with image-based stems and options', () => {
    const figural = tiuQuestions.filter((q) => q.category.startsWith('Figural'))
    expect(figural).toHaveLength(2)
    figural.forEach((q) => {
      expect(q.options.every((o) => o.image)).toBe(true)
    })
  })
})
