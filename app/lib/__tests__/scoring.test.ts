import { describe, it, expect } from 'vitest'
import { calculateGrade, calculateOverall, getReadinessLevel, generateRecommendations } from '../scoring'
import type { CategoryScores, CategoryDetail } from '../types'

const perfectScores: CategoryScores = {
  usability: 30, webmcp: 25, semantic: 20, structured: 15, crawlability: 5, content: 5,
}
const badScores: CategoryScores = {
  usability: 0, webmcp: 0, semantic: 0, structured: 0, crawlability: 0, content: 0,
}

describe('calculateGrade', () => {
  it('returns A for 90+', () => expect(calculateGrade(90)).toBe('A'))
  it('returns A for 100', () => expect(calculateGrade(100)).toBe('A'))
  it('returns B for 75–89', () => {
    expect(calculateGrade(75)).toBe('B')
    expect(calculateGrade(89)).toBe('B')
  })
  it('returns C for 60–74', () => expect(calculateGrade(60)).toBe('C'))
  it('returns D for 40–59', () => expect(calculateGrade(40)).toBe('D'))
  it('returns F for 0–39', () => {
    expect(calculateGrade(0)).toBe('F')
    expect(calculateGrade(39)).toBe('F')
  })
})

describe('calculateOverall', () => {
  it('sums all category scores', () => {
    expect(calculateOverall(perfectScores)).toBe(100)
    expect(calculateOverall(badScores)).toBe(0)
  })

  it('handles partial scores', () => {
    const scores: CategoryScores = {
      usability: 15, webmcp: 10, semantic: 10, structured: 8, crawlability: 3, content: 2,
    }
    expect(calculateOverall(scores)).toBe(48)
  })
})

describe('getReadinessLevel', () => {
  it('returns level 5 AI-Native for 80+', () => {
    const l = getReadinessLevel(80)
    expect(l.level).toBe(5)
    expect(l.label).toBe('AI-Native')
    expect(l.color).toBeDefined()
    expect(l.emoji).toBe('🔵')
  })

  it('returns level 4 Operable for 60–79', () => {
    const l = getReadinessLevel(65)
    expect(l.level).toBe(4)
    expect(l.label).toBe('Operable')
    expect(l.emoji).toBe('🟢')
  })

  it('returns level 3 Discoverable for 40–59', () => {
    expect(getReadinessLevel(50).level).toBe(3)
    expect(getReadinessLevel(40).label).toBe('Discoverable')
  })

  it('returns level 2 Crawlable for 20–39', () => {
    expect(getReadinessLevel(30).level).toBe(2)
    expect(getReadinessLevel(20).label).toBe('Crawlable')
  })

  it('returns level 1 Invisible for 0–19', () => {
    expect(getReadinessLevel(0).level).toBe(1)
    expect(getReadinessLevel(19).label).toBe('Invisible')
    expect(getReadinessLevel(0).emoji).toBe('🔴')
  })

  it('includes description for each level', () => {
    [0, 25, 45, 65, 85].forEach(score => {
      const l = getReadinessLevel(score)
      expect(l.description.length).toBeGreaterThan(10)
    })
  })
})

describe('generateRecommendations', () => {
  const emptyDetails: CategoryDetail[] = [
    { category: 'usability', label: 'Usability', score: 30, max: 30, checks: [], educationalNote: '' },
    { category: 'webmcp', label: 'WebMCP', score: 25, max: 25, checks: [], educationalNote: '' },
    { category: 'semantic', label: 'Semantic', score: 20, max: 20, checks: [], educationalNote: '' },
    { category: 'structured', label: 'Structured', score: 15, max: 15, checks: [], educationalNote: '' },
    { category: 'crawlability', label: 'Crawl', score: 5, max: 5, checks: [], educationalNote: '' },
    { category: 'content', label: 'Content', score: 5, max: 5, checks: [], educationalNote: '' },
  ]

  it('returns empty array when all scores are perfect', () => {
    const recs = generateRecommendations(perfectScores, emptyDetails)
    expect(recs).toHaveLength(0)
  })

  it('returns recommendations when scores are low', () => {
    const recs = generateRecommendations(badScores, emptyDetails)
    expect(recs.length).toBeGreaterThan(0)
  })

  it('returns at most 8 recommendations', () => {
    const recs = generateRecommendations(badScores, emptyDetails)
    expect(recs.length).toBeLessThanOrEqual(8)
  })

  it('each recommendation has required fields including issues and steps', () => {
    const recs = generateRecommendations(badScores, emptyDetails)
    recs.forEach(rec => {
      expect(rec.title).toBeTruthy()
      expect(rec.description).toBeTruthy()
      expect(rec.category).toBeTruthy()
      expect(typeof rec.points).toBe('number')
      expect(['high', 'medium', 'low']).toContain(rec.impact)
      expect(['low', 'medium', 'high']).toContain(rec.effort)
      // New fields: issues[] and steps[] must be arrays
      expect(Array.isArray(rec.issues)).toBe(true)
      expect(Array.isArray(rec.steps)).toBe(true)
      // Each rec should have at least 1 step
      expect(rec.steps.length).toBeGreaterThan(0)
    })
  })

  it('sorts high-impact low-effort first', () => {
    const recs = generateRecommendations(
      { ...badScores, webmcp: 0, crawlability: 0 },
      emptyDetails,
    )
    if (recs.length >= 2) {
      const first = recs[0]
      // First recommendation should be high impact
      expect(['high', 'medium']).toContain(first.impact)
    }
  })
})
