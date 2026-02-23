import { describe, it, expect } from 'vitest'
import { analyzeWebMCP } from '../webmcp'

const makeHtml = (body: string) =>
  `<html lang="en"><head><meta name="description" content="Test site" /></head><body>${body}</body></html>`

describe('analyzeWebMCP', () => {
  it('returns zero score for page with no WebMCP attributes', () => {
    const html = makeHtml(`
      <form action="/search">
        <input type="search" name="q" placeholder="Search..." />
        <button type="submit">Search</button>
      </form>
    `)
    const { score, checks } = analyzeWebMCP(html)
    const toolCheck = checks.find(c => c.name.includes('mcp-tool'))!
    const paramCheck = checks.find(c => c.name.includes('mcp-param'))!
    const descCheck = checks.find(c => c.name.includes('mcp-description'))!

    expect(toolCheck.passed).toBe(false)
    expect(paramCheck.passed).toBe(false)
    expect(descCheck.passed).toBe(false)
    expect(score).toBe(0)
  })

  it('detects mcp-tool attribute', () => {
    const html = makeHtml(`
      <form mcp-tool="search-products">
        <input name="q" />
      </form>
    `)
    const { checks, score } = analyzeWebMCP(html)
    const toolCheck = checks.find(c => c.name.includes('mcp-tool'))!
    expect(toolCheck.passed).toBe(true)
    expect(score).toBeGreaterThan(0)
  })

  it('detects mcp-param attribute', () => {
    const html = makeHtml(`
      <form mcp-tool="search">
        <input mcp-param="query" name="q" type="search" />
      </form>
    `)
    const { checks } = analyzeWebMCP(html)
    const paramCheck = checks.find(c => c.name.includes('mcp-param'))!
    expect(paramCheck.passed).toBe(true)
  })

  it('detects mcp-description attribute', () => {
    const html = makeHtml(`
      <form mcp-tool="search" mcp-description="Search the product catalog">
        <input mcp-param="query" mcp-description="Keywords to search for" name="q" />
      </form>
    `)
    const { checks } = analyzeWebMCP(html)
    const descCheck = checks.find(c => c.name.includes('mcp-description'))!
    expect(descCheck.passed).toBe(true)
  })

  it('gives higher score with all three attributes', () => {
    const noneHtml = makeHtml(`<form><input name="q" /></form>`)
    const allHtml = makeHtml(`
      <form mcp-tool="search" mcp-description="Search products">
        <input mcp-param="query" mcp-description="Keywords" name="q" type="search" />
        <input mcp-param="category" mcp-description="Category filter" name="cat" />
      </form>
    `)
    const noneResult = analyzeWebMCP(noneHtml)
    const allResult = analyzeWebMCP(allHtml)
    expect(allResult.score).toBeGreaterThan(noneResult.score)
  })

  it('detects OpenAPI / ai-plugin.json reference', () => {
    const html = makeHtml(`
      <link rel="ai-plugin" href="/.well-known/ai-plugin.json" />
      <a href="/openapi.json">API Spec</a>
    `)
    const { checks } = analyzeWebMCP(html)
    const apiCheck = checks.find(c => c.name.includes('OpenAPI'))!
    expect(apiCheck.passed).toBe(true)
  })

  it('detects meta description tag', () => {
    // Meta description is included in makeHtml already
    const html = makeHtml(`<p>Content</p>`)
    const { checks } = analyzeWebMCP(html)
    const metaCheck = checks.find(c => c.name.includes('meta tags'))!
    expect(metaCheck.passed).toBe(true)
  })

  it('returns score capped at 25', () => {
    const html = makeHtml(`
      <form mcp-tool="t1" mcp-description="d1">
        <input mcp-param="p1" mcp-description="dp1" />
        <input mcp-param="p2" mcp-description="dp2" />
        <input mcp-param="p3" mcp-description="dp3" />
      </form>
      <a href="/.well-known/ai-plugin.json">API</a>
    `)
    const { score } = analyzeWebMCP(html)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(25)
  })

  it('returns fix suggestions on failure', () => {
    const html = makeHtml(`<form><input name="q" /></form>`)
    const { checks } = analyzeWebMCP(html)
    for (const check of checks.filter(c => !c.passed && c.impact !== 'low')) {
      expect(check.fix).toBeDefined()
    }
  })
})
