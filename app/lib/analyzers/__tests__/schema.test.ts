import { describe, it, expect } from 'vitest'
import { analyzeStructuredData } from '../schema'

const withWebsite = `<html><head>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Test","url":"https://example.com"}</script>
</head></html>`

const withSearch = `<html><head>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","url":"https://example.com","potentialAction":{"@type":"SearchAction","target":"https://example.com/search?q={search_term_string}","query-input":"required name=search_term_string"}}</script>
</head></html>`

const withFAQ = `<html><head>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What?","acceptedAnswer":{"@type":"Answer","text":"This."}}]}</script>
</head></html>`

const withBrokenJson = `<html><head>
  <script type="application/ld+json">{broken json: not valid}</script>
</head></html>`

const withMicrodata = `<html><body>
  <div itemscope itemtype="https://schema.org/Product">
    <span itemprop="name">Product Name</span>
  </div>
</body></html>`

describe('analyzeStructuredData', () => {
  it('returns 0 score for empty HTML', () => {
    const { score, types } = analyzeStructuredData('<html></html>')
    expect(score).toBe(0)
    expect(types).toHaveLength(0)
  })

  it('detects valid JSON-LD and scores points', () => {
    const { score, checks, types } = analyzeStructuredData(withWebsite)
    expect(score).toBeGreaterThan(0)
    expect(types).toContain('WebSite')
    const jsonLdCheck = checks.find(c => c.name.includes('JSON-LD'))!
    expect(jsonLdCheck.passed).toBe(true)
  })

  it('does not score for broken JSON-LD', () => {
    const { score, checks } = analyzeStructuredData(withBrokenJson)
    const jsonLdCheck = checks.find(c => c.name.includes('JSON-LD'))!
    expect(jsonLdCheck.passed).toBe(false)
    expect(jsonLdCheck.example).toBeDefined()
    expect(score).toBe(0)
  })

  it('detects WebSite+SearchAction JSON-LD as rich type (WebSite is in richTypes)', () => {
    // The analyzer captures top-level @type. In the withSearch fixture, top-level @type is
    // "WebSite" which is in the richTypes list. SearchAction is a nested potentialAction.
    const { checks, types } = analyzeStructuredData(withSearch)
    expect(types).toContain('WebSite')
    const richCheck = checks.find(c => c.name.includes('Rich'))!
    expect(richCheck.passed).toBe(true)
    expect(richCheck.detail).toMatch(/WebSite/)
  })

  it('detects FAQPage as rich type', () => {
    const { checks } = analyzeStructuredData(withFAQ)
    const richCheck = checks.find(c => c.name.includes('Rich'))!
    expect(richCheck.passed).toBe(true)
    expect(richCheck.detail).toMatch(/FAQPage/)
  })

  it('detects microdata', () => {
    const { score, types, checks } = analyzeStructuredData(withMicrodata)
    const mdCheck = checks.find(c => c.name.includes('Microdata'))!
    expect(mdCheck.passed).toBe(true)
    expect(types.some(t => t.includes('Product'))).toBe(true)
    expect(score).toBeGreaterThan(0)
  })

  it('score does not exceed max of 15', () => {
    const many = `<html><head>` +
      Array.from({ length: 10 }, (_, i) =>
        `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","name":"Art ${i}"}</script>`
      ).join('') +
      `</head></html>`
    const { score } = analyzeStructuredData(many)
    expect(score).toBeLessThanOrEqual(15)
  })

  it('returns example code when JSON-LD missing', () => {
    const { checks } = analyzeStructuredData('<html><body>plain</body></html>')
    const jsonLdCheck = checks.find(c => c.name.includes('JSON-LD'))!
    expect(jsonLdCheck.fix).toBeDefined()
    expect(jsonLdCheck.example).toContain('@context')
  })
})
