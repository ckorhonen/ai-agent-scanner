import { describe, it, expect } from 'vitest'
import { analyzeContent } from '../content'

const loremWords = Array(120).fill('lorem ipsum dolor sit amet').join(' ')

describe('analyzeContent', () => {
  it('returns max score for page with alt text and sufficient content', () => {
    const html = `<html><body>
      <img src="a.png" alt="Descriptive alt text for image" />
      <img src="b.png" alt="Another descriptive alt" />
      <p>${loremWords}</p>
    </body></html>`
    const { score } = analyzeContent(html)
    expect(score).toBe(5)
  })

  it('penalises missing alt text', () => {
    const html = `<html><body>
      <img src="a.png" />
      <img src="b.png" />
      <img src="c.png" />
      <p>${loremWords}</p>
    </body></html>`
    const { score, checks } = analyzeContent(html)
    const altCheck = checks.find(c => c.name.includes('alt'))!
    expect(altCheck.passed).toBe(false)
    expect(score).toBeLessThan(5)
    expect(altCheck.fix).toBeDefined()
    expect(altCheck.example).toBeDefined()
  })

  it('passes alt check when 80%+ images have alt text', () => {
    const html = `<html><body>
      <img src="a.png" alt="Image A" />
      <img src="b.png" alt="Image B" />
      <img src="c.png" alt="Image C" />
      <img src="d.png" alt="Image D" />
      <img src="e.png" />
      <p>${loremWords}</p>
    </body></html>`
    const { checks } = analyzeContent(html)
    const altCheck = checks.find(c => c.name.includes('alt'))!
    expect(altCheck.passed).toBe(true)
  })

  it('penalises sparse text content', () => {
    const html = `<html><body><p>Short.</p></body></html>`
    const { score, checks } = analyzeContent(html)
    const textCheck = checks.find(c => c.name.includes('Sufficient'))!
    expect(textCheck.passed).toBe(false)
    expect(score).toBeLessThan(5)
  })

  it('passes when no images present (no alt deduction)', () => {
    const html = `<html><body><p>${loremWords}</p></body></html>`
    const { score, checks } = analyzeContent(html)
    const altCheck = checks.find(c => c.name.includes('alt'))!
    expect(altCheck.passed).toBe(true)
    expect(altCheck.detail).toMatch(/No images/)
    expect(score).toBe(5)
  })

  it('score does not exceed 5', () => {
    const html = `<html><body>
      ${Array(10).fill('<img src="x.png" alt="described" />').join('')}
      <p>${loremWords}</p>
    </body></html>`
    const { score } = analyzeContent(html)
    expect(score).toBeLessThanOrEqual(5)
  })

  it('score never goes below 0', () => {
    const html = `<html><body>
      ${Array(20).fill('<img src="x.png" />').join('')}
    </body></html>`
    const { score } = analyzeContent(html)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})
