import { describe, it, expect } from 'vitest'
import { analyzeContent } from '../content'

const makeHtml = (body: string) => `<html lang="en"><body>${body}</body></html>`

const manyWords = Array(120).fill('word').join(' ')

describe('analyzeContent', () => {
  it('gives max score for rich content with alt text', () => {
    const html = makeHtml(`
      <img src="chart.png" alt="Sales chart showing 40% growth in Q4 2024" />
      <img src="logo.svg" alt="Acme Corp logo" />
      <p>${manyWords}</p>
    `)
    const { score } = analyzeContent(html)
    expect(score).toBe(5)
  })

  it('penalises images without alt text', () => {
    const html = makeHtml(`
      <img src="a.png" />
      <img src="b.png" />
      <img src="c.png" />
      <p>${manyWords}</p>
    `)
    const { score, checks } = analyzeContent(html)
    const altCheck = checks.find(c => c.name.includes('alt'))!
    expect(altCheck.passed).toBe(false)
    expect(altCheck.fix).toBeDefined()
    expect(score).toBeLessThan(5)
  })

  it('passes alt check when ≥80% of images have alt text', () => {
    // 4 images, 4 with alt → 100%
    const html = makeHtml(`
      <img src="a.png" alt="A" />
      <img src="b.png" alt="B" />
      <img src="c.png" alt="C" />
      <img src="d.png" alt="D" />
    `)
    const { checks } = analyzeContent(html)
    const altCheck = checks.find(c => c.name.includes('alt'))!
    expect(altCheck.passed).toBe(true)
  })

  it('does not penalise when no images present', () => {
    const html = makeHtml(`<p>${manyWords}</p>`)
    const { checks } = analyzeContent(html)
    const altCheck = checks.find(c => c.name.includes('alt'))!
    expect(altCheck.passed).toBe(true)
    expect(altCheck.detail).toContain('No images')
  })

  it('penalises insufficient text content', () => {
    const html = makeHtml(`<p>Hello world.</p>`)
    const { score, checks } = analyzeContent(html)
    const textCheck = checks.find(c => c.name.includes('text content'))!
    expect(textCheck.passed).toBe(false)
    expect(score).toBeLessThan(5)
  })

  it('passes text check with ≥100 words', () => {
    const html = makeHtml(`<p>${manyWords}</p>`)
    const { checks } = analyzeContent(html)
    const textCheck = checks.find(c => c.name.includes('text content'))!
    expect(textCheck.passed).toBe(true)
  })

  it('strips HTML tags when counting words', () => {
    // Tags should not count as words
    const html = makeHtml(`<h1>Title</h1><p><strong>Bold</strong> content</p>`)
    const { checks } = analyzeContent(html)
    const textCheck = checks.find(c => c.name.includes('text content'))!
    expect(textCheck.detail).not.toContain('h1')
    expect(textCheck.detail).not.toContain('strong')
  })

  it('returns score between 0 and 5 for any input', () => {
    for (const html of ['', '<html></html>', makeHtml(manyWords)]) {
      const { score } = analyzeContent(html)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(5)
    }
  })
})
