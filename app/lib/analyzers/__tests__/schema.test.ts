import { describe, it, expect } from 'vitest'
import { analyzeStructuredData } from '../schema'

const wrap = (body: string) => `<html lang="en"><head>${body}</head><body>Content</body></html>`
const jsonLd = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data)}</script>`

describe('analyzeStructuredData', () => {
  it('detects valid JSON-LD with @type', () => {
    const html = wrap(jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Test' }))
    const { checks, types } = analyzeStructuredData(html)
    const ldCheck = checks.find(c => c.name.includes('JSON-LD'))!
    expect(ldCheck.passed).toBe(true)
    expect(types).toContain('WebSite')
  })

  it('extracts all @type values from @graph array', () => {
    const html = wrap(jsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', name: 'Acme' },
        { '@type': 'WebSite', url: 'https://example.com' },
        { '@type': 'BreadcrumbList', itemListElement: [] },
      ],
    }))
    const { types, checks } = analyzeStructuredData(html)
    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
    expect(types).toContain('BreadcrumbList')
    const ldCheck = checks.find(c => c.name.includes('JSON-LD'))!
    expect(ldCheck.passed).toBe(true)
  })

  it('handles malformed JSON-LD without throwing', () => {
    const html = `<html><head>
      <script type="application/ld+json">{ this is not valid json }</script>
    </head><body></body></html>`
    expect(() => analyzeStructuredData(html)).not.toThrow()
    const { checks } = analyzeStructuredData(html)
    const ldCheck = checks.find(c => c.name.includes('JSON-LD'))!
    expect(ldCheck.passed).toBe(false)
  })

  it('scores higher with rich schema types (SearchAction, FAQPage)', () => {
    const basic = wrap(jsonLd({ '@context': 'https://schema.org', '@type': 'WebPage' }))
    const rich = wrap(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      potentialAction: { '@type': 'SearchAction', target: 'https://example.com/search?q={q}' },
    }))

    const basicResult = analyzeStructuredData(basic)
    const richResult = analyzeStructuredData(rich)

    // Rich check should pass; basic should not
    const richCheck = richResult.checks.find(c => c.name.includes('Rich schema'))!
    expect(richCheck.passed).toBe(true)

    const basicCheck = basicResult.checks.find(c => c.name.includes('Rich schema'))!
    expect(basicCheck.passed).toBe(false)
  })

  it('detects microdata itemtype', () => {
    const html = `<html><body>
      <div itemscope itemtype="https://schema.org/Product">
        <span itemprop="name">Widget</span>
      </div>
    </body></html>`
    const { checks, types } = analyzeStructuredData(html)
    const mdCheck = checks.find(c => c.name.includes('Microdata'))!
    expect(mdCheck.passed).toBe(true)
    expect(types.some(t => t.includes('Product'))).toBe(true)
  })

  it('returns empty types array with no structured data', () => {
    const { types, checks } = analyzeStructuredData('<html><body>Plain HTML</body></html>')
    const ldCheck = checks.find(c => c.name.includes('JSON-LD'))!
    expect(ldCheck.passed).toBe(false)
    expect(ldCheck.fix).toBeDefined()
    expect(types).toHaveLength(0)
  })

  it('handles multiple JSON-LD blocks', () => {
    const html = `<html><head>
      ${jsonLd({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Acme' })}
      ${jsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] })}
    </head><body></body></html>`
    const { types } = analyzeStructuredData(html)
    expect(types).toContain('Organization')
    expect(types).toContain('FAQPage')
  })

  it('returns score capped at 15', () => {
    // Best case: multiple rich JSON-LD types
    const html = wrap([
      jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite' }),
      jsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage' }),
      jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList' }),
    ].join(''))
    const { score } = analyzeStructuredData(html)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(15)
  })
})
