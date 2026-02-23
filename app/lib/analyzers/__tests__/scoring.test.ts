import { describe, it, expect } from 'vitest'
import {
  calculateGrade,
  calculateOverall,
  getReadinessLevel,
  generateSummary,
} from '../../scoring'
import type { CategoryScores, CategoryDetail } from '../../types'

const fullScores: CategoryScores = {
  usability: 30, webmcp: 25, semantic: 20, structured: 15, crawlability: 5, content: 5,
}

const zeroScores: CategoryScores = {
  usability: 0, webmcp: 0, semantic: 0, structured: 0, crawlability: 0, content: 0,
}

const makeDetails = (scores: CategoryScores): CategoryDetail[] => [
  { category: 'usability',    label: 'Agent Usability',    score: scores.usability,    max: 30, checks: [], educationalNote: '' },
  { category: 'webmcp',       label: 'WebMCP Support',     score: scores.webmcp,       max: 25, checks: [], educationalNote: '' },
  { category: 'semantic',     label: 'Semantic HTML',      score: scores.semantic,     max: 20, checks: [], educationalNote: '' },
  { category: 'structured',   label: 'Structured Data',    score: scores.structured,   max: 15, checks: [], educationalNote: '' },
  { category: 'crawlability', label: 'AI Discoverability', score: scores.crawlability, max: 5,  checks: [], educationalNote: '' },
  { category: 'content',      label: 'Content Quality',    score: scores.content,      max: 5,  checks: [], educationalNote: '' },
]

describe('calculateGrade', () => {
  it('returns A for ≥90', ()  => expect(calculateGrade(95)).toBe('A'))
  it('returns A for 90',  ()  => expect(calculateGrade(90)).toBe('A'))
  it('returns B for 75',  ()  => expect(calculateGrade(75)).toBe('B'))
  it('returns B for 89',  ()  => expect(calculateGrade(89)).toBe('B'))
  it('returns C for 60',  ()  => expect(calculateGrade(60)).toBe('C'))
  it('returns C for 74',  ()  => expect(calculateGrade(74)).toBe('C'))
  it('returns D for 40',  ()  => expect(calculateGrade(40)).toBe('D'))
  it('returns D for 59',  ()  => expect(calculateGrade(59)).toBe('D'))
  it('returns F for 0',   ()  => expect(calculateGrade(0)).toBe('F'))
  it('returns F for 39',  ()  => expect(calculateGrade(39)).toBe('F'))
})

describe('calculateOverall', () => {
  it('sums all category scores', () => {
    expect(calculateOverall(fullScores)).toBe(100)
  })
  it('returns 0 for all-zero scores', () => {
    expect(calculateOverall(zeroScores)).toBe(0)
  })
  it('rounds the result', () => {
    const scores: CategoryScores = { usability: 10, webmcp: 10, semantic: 10, structured: 10, crawlability: 0, content: 0 }
    expect(Number.isInteger(calculateOverall(scores))).toBe(true)
  })
})

describe('getReadinessLevel', () => {
  it('level 5 (AI-Native) at 80+', () => {
    const l = getReadinessLevel(80)
    expect(l.level).toBe(5)
    expect(l.label).toBe('AI-Native')
  })
  it('level 4 (Operable) at 60–79', () => {
    const l = getReadinessLevel(65)
    expect(l.level).toBe(4)
    expect(l.label).toBe('Operable')
  })
  it('level 3 (Discoverable) at 40–59', () => {
    const l = getReadinessLevel(50)
    expect(l.level).toBe(3)
    expect(l.label).toBe('Discoverable')
  })
  it('level 2 (Crawlable) at 20–39', () => {
    const l = getReadinessLevel(25)
    expect(l.level).toBe(2)
    expect(l.label).toBe('Crawlable')
  })
  it('level 1 (Invisible) below 20', () => {
    const l = getReadinessLevel(10)
    expect(l.level).toBe(1)
    expect(l.label).toBe('Invisible')
  })
  it('returns an emoji and color for every level', () => {
    for (const score of [0, 25, 45, 65, 85]) {
      const l = getReadinessLevel(score)
      expect(l.emoji).toBeTruthy()
      expect(l.color).toMatch(/^#/)
    }
  })
})

describe('generateSummary', () => {
  it('returns a non-empty string', () => {
    const level = getReadinessLevel(62)
    const s = generateSummary('https://example.com', 62, level, fullScores, makeDetails(fullScores))
    expect(s.length).toBeGreaterThan(20)
  })

  it('includes the hostname', () => {
    const level = getReadinessLevel(62)
    const s = generateSummary('https://mysite.com', 62, level, fullScores, makeDetails(fullScores))
    expect(s).toContain('mysite.com')
  })

  it('returns different summaries for different levels', () => {
    const summaries = [0, 25, 45, 65, 85].map(score => {
      const level = getReadinessLevel(score)
      return generateSummary('https://example.com', score, level, zeroScores, makeDetails(zeroScores))
    })
    const unique = new Set(summaries)
    expect(unique.size).toBeGreaterThan(1)
  })
})
