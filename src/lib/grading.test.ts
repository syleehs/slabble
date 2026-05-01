import { describe, it, expect } from 'vitest'
import { PSA_CRITERIA, PSA_REFERENCE_URL, getCriteriaFor } from './grading'

describe('PSA_CRITERIA', () => {
  it('has entries for grades 7, 8, 9, 10', () => {
    expect(Object.keys(PSA_CRITERIA).map(Number).sort((a, b) => a - b)).toEqual([7, 8, 9, 10])
  })

  it('every entry has grade, label, summary, source', () => {
    for (const grade of [7, 8, 9, 10] as const) {
      const c = PSA_CRITERIA[grade]
      expect(c.grade).toBe(grade)
      expect(c.label.length).toBeGreaterThan(0)
      expect(c.summary.length).toBeGreaterThan(0)
      expect(c.source).toBe('PSA')
    }
  })
})

describe('PSA_REFERENCE_URL', () => {
  it('points to psacard.com', () => {
    expect(PSA_REFERENCE_URL).toMatch(/^https:\/\/(www\.)?psacard\.com\//)
  })
})

describe('getCriteriaFor', () => {
  it('returns the in-range entry for grades 7-10', () => {
    expect(getCriteriaFor(9).grade).toBe(9)
    expect(getCriteriaFor(9).label.length).toBeGreaterThan(0)
  })

  it('returns the below-7 placeholder for grades 1-6', () => {
    const placeholder = getCriteriaFor(5)
    expect(placeholder.grade).toBe(5)
    expect(placeholder.label).toBe('Below 7')
    expect(placeholder.summary.length).toBeGreaterThan(0)
  })

  it('returns the below-7 placeholder for grade 0 / negative inputs', () => {
    expect(getCriteriaFor(0).label).toBe('Below 7')
    expect(getCriteriaFor(-1).label).toBe('Below 7')
  })
})
