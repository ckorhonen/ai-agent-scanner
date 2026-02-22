import { describe, it, expect } from 'vitest'
import { analyzeWebMCP } from '../webmcp'

const withFullWebMCP = `<html><body>
  <form mcp-tool="search-products"
        mcp-description="Search the product catalog by keyword">
    <input mcp-param="query"
           mcp-description="Search keywords e.g. blue shoes"
           name="q" type="search" />
    <input mcp-param="category"
           mcp-description="Product category filter"
           name="cat" type="text" />
  </form>
  <link rel="ai-plugin" href="/.well-known/ai-plugin.json" />
  <meta name="description" content="Product catalog" />
</body></html>`

const withToolOnly = `<html><body>
  <form mcp-tool="subscribe">
    <input name="email" type="email" />
  </form>
</body></html>`

const withOpenAPI = `<html><head>
  <link href="/openapi.json" rel="spec" />
  <meta name="description" content="API docs" />
</head></html>`

describe('analyzeWebMCP', () => {
  it('scores 0 for plain HTML with no WebMCP attributes', () => {
    const { score } = analyzeWebMCP('<html><body><form><input /></form></body></html>')
    expect(score).toBe(0)
  })

  it('detects mcp-tool and scores points', () => {
    const { score, checks } = analyzeWebMCP(withToolOnly)
    const toolCheck = checks.find(c => c.name.includes('mcp-tool'))!
    expect(toolCheck.passed).toBe(true)
    expect(score).toBeGreaterThan(0)
  })

  it('scores full WebMCP implementation correctly', () => {
    const { score, checks } = analyzeWebMCP(withFullWebMCP)
    expect(score).toBeGreaterThanOrEqual(20)

    const toolCheck = checks.find(c => c.name.includes('mcp-tool'))!
    const paramCheck = checks.find(c => c.name.includes('mcp-param'))!
    const descCheck = checks.find(c => c.name.includes('mcp-description'))!
    expect(toolCheck.passed).toBe(true)
    expect(paramCheck.passed).toBe(true)
    expect(descCheck.passed).toBe(true)
  })

  it('detects multiple mcp-params', () => {
    const { checks } = analyzeWebMCP(withFullWebMCP)
    const paramCheck = checks.find(c => c.name.includes('mcp-param'))!
    expect(paramCheck.detail).toMatch(/2 mcp-param/)
  })

  it('detects OpenAPI reference', () => {
    const { checks } = analyzeWebMCP(withOpenAPI)
    const apiCheck = checks.find(c => c.name.includes('OpenAPI'))!
    expect(apiCheck.passed).toBe(true)
  })

  it('provides fix + example when mcp-tool missing', () => {
    const { checks } = analyzeWebMCP('<html><body><form></form></body></html>')
    const toolCheck = checks.find(c => c.name.includes('mcp-tool'))!
    expect(toolCheck.passed).toBe(false)
    expect(toolCheck.fix).toBeDefined()
    expect(toolCheck.example).toContain('mcp-tool=')
  })

  it('score does not exceed max of 25', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      `<form mcp-tool="t${i}" mcp-description="d"><input mcp-param="p" mcp-description="d" /></form>`
    ).join('')
    const { score } = analyzeWebMCP(`<html><body>${many}</body></html>`)
    expect(score).toBeLessThanOrEqual(25)
  })

  it('detects meta description as informational check', () => {
    const html = `<html><head><meta name="description" content="My site" /></head></html>`
    const { checks } = analyzeWebMCP(html)
    const metaCheck = checks.find(c => c.name.includes('meta'))!
    expect(metaCheck.passed).toBe(true)
  })
})
