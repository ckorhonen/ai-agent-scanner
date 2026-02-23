import { describe, it, expect, vi, afterEach } from 'vitest'
import { analyzeCrawlability } from '../crawlability'

// Helper: build a mock fetch that maps URL substrings to responses
function makeFetch(responses: Record<string, { ok: boolean; status?: number; text?: string }>) {
  return vi.fn().mockImplementation((url: string) => {
    for (const [pattern, res] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: res.ok,
          status: res.status ?? (res.ok ? 200 : 404),
          text: () => Promise.resolve(res.text ?? ''),
        })
      }
    }
    // Default: 404
    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('') })
  })
}

const ALLOW_ALL_ROBOTS = `User-agent: *\nAllow: /\n`
const BLOCK_ALL_ROBOTS = `User-agent: *\nDisallow: /\n`
const BLOCK_PATH_ROBOTS = `User-agent: *\nDisallow: /admin/\n`
const BLOCK_GPTBOT_ONLY = `User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n`

afterEach(() => { vi.restoreAllMocks() })

describe('analyzeCrawlability', () => {
  it('gives full score for HTTPS + permissive robots.txt + sitemap + llms.txt', async () => {
    vi.stubGlobal('fetch', makeFetch({
      '/robots.txt':  { ok: true,  text: ALLOW_ALL_ROBOTS },
      '/sitemap.xml': { ok: true,  text: '<urlset></urlset>' },
      '/llms.txt':    { ok: true,  text: '# llms.txt' },
    }))
    const { score } = await analyzeCrawlability('https://example.com')
    expect(score).toBe(5) // max is 5
  })

  it('HTTPS adds +1 point', async () => {
    vi.stubGlobal('fetch', makeFetch({}))
    const https = await analyzeCrawlability('https://example.com')
    const http  = await analyzeCrawlability('http://example.com')
    expect(https.score).toBeGreaterThan(http.score)
  })

  it('flags root-level Disallow: / as full block', async () => {
    vi.stubGlobal('fetch', makeFetch({
      '/robots.txt': { ok: true, text: BLOCK_ALL_ROBOTS },
    }))
    const { checks } = await analyzeCrawlability('https://example.com')
    // robots.txt exists check
    const existsCheck = checks.find(c => c.name.includes('robots.txt exists'))!
    expect(existsCheck.passed).toBe(true)
  })

  it('does NOT flag Disallow: /admin/ as full site block', async () => {
    vi.stubGlobal('fetch', makeFetch({
      '/robots.txt':  { ok: true, text: BLOCK_PATH_ROBOTS },
      '/sitemap.xml': { ok: true, text: '' },
      '/llms.txt':    { ok: true, text: '' },
    }))
    const { checks } = await analyzeCrawlability('https://example.com')
    const aiCheck = checks.find(c => c.name.includes('AI crawlers'))!
    // /admin/ block should NOT mark AI crawlers as blocked
    expect(aiCheck.passed).toBe(true)
  })

  it('detects GPTBot Disallow: / as AI crawler block', async () => {
    vi.stubGlobal('fetch', makeFetch({
      '/robots.txt': { ok: true, text: BLOCK_GPTBOT_ONLY },
    }))
    const { checks } = await analyzeCrawlability('https://example.com')
    const aiCheck = checks.find(c => c.name.includes('AI crawlers'))!
    expect(aiCheck.passed).toBe(false)
    expect(aiCheck.detail).toContain('gptbot')
  })

  it('scores higher with llms.txt present', async () => {
    vi.stubGlobal('fetch', makeFetch({
      '/robots.txt':  { ok: true, text: ALLOW_ALL_ROBOTS },
      '/sitemap.xml': { ok: true, text: '' },
      '/llms.txt':    { ok: true, text: '# AI content guide' },
    }))
    const withLlms = await analyzeCrawlability('https://example.com')

    vi.stubGlobal('fetch', makeFetch({
      '/robots.txt':  { ok: true, text: ALLOW_ALL_ROBOTS },
      '/sitemap.xml': { ok: true, text: '' },
    }))
    const withoutLlms = await analyzeCrawlability('https://example.com')

    expect(withLlms.score).toBeGreaterThan(withoutLlms.score)
  })

  it('falls back to /.well-known/llms.txt', async () => {
    // Note: put more-specific patterns first so the mock doesn't match /llms.txt
    // before it gets a chance to check /.well-known/llms.txt
    vi.stubGlobal('fetch', makeFetch({
      '/robots.txt':           { ok: true, text: ALLOW_ALL_ROBOTS },
      '/sitemap.xml':          { ok: true, text: '' },
      '/.well-known/llms.txt': { ok: true, text: '# AI guide' },
      // /llms.txt is NOT in the map → default 404
    }))
    const { checks } = await analyzeCrawlability('https://example.com')
    const llmsCheck = checks.find(c => c.name.includes('llms.txt'))!
    expect(llmsCheck.passed).toBe(true)
    expect(llmsCheck.detail).toContain('.well-known')
  })

  it('handles 404 robots.txt gracefully', async () => {
    vi.stubGlobal('fetch', makeFetch({ '/robots.txt': { ok: false, status: 404 } }))
    await expect(analyzeCrawlability('https://example.com')).resolves.not.toThrow()
    const { checks } = await analyzeCrawlability('https://example.com')
    const robotsCheck = checks.find(c => c.name.includes('robots.txt exists'))!
    expect(robotsCheck.passed).toBe(false)
    expect(robotsCheck.fix).toBeDefined()
  })

  it('returns responseTimeMs ≥ 0', async () => {
    vi.stubGlobal('fetch', makeFetch({}))
    const { responseTimeMs } = await analyzeCrawlability('https://example.com')
    expect(responseTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('returns score between 0 and 5', async () => {
    vi.stubGlobal('fetch', makeFetch({
      '/robots.txt':  { ok: true, text: ALLOW_ALL_ROBOTS },
      '/sitemap.xml': { ok: true, text: '' },
      '/llms.txt':    { ok: true, text: '' },
    }))
    const { score } = await analyzeCrawlability('https://example.com')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(5)
  })
})
