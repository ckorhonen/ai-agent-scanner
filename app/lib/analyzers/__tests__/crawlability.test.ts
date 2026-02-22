import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeCrawlability } from '../crawlability'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Parallel fetch order: [robots.txt, sitemap.xml, llms.txt, /.well-known/llms.txt]
function mockParallel(robots: string | null, sitemap = false, llms = false, llmsWk = false) {
  const ok = (body: string) => ({ ok: true, text: () => Promise.resolve(body) })
  const fail = () => ({ ok: false, text: () => Promise.resolve('') })
  mockFetch
    .mockResolvedValueOnce(robots !== null ? ok(robots) : fail())
    .mockResolvedValueOnce(sitemap ? ok('<urlset/>') : fail())
    .mockResolvedValueOnce(llms ? ok('# llms.txt') : fail())
    .mockResolvedValueOnce(llmsWk ? ok('# llms.txt') : fail())
}

const GOOD_ROBOTS = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

Sitemap: https://example.com/sitemap.xml`

const BLOCKING_ROBOTS = `User-agent: GPTBot
Disallow: /

User-agent: *
Allow: /`

describe('analyzeCrawlability', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('gives full score for HTTPS site with all signals present', async () => {
    mockParallel(GOOD_ROBOTS, true, true, false)
    const { score, checks } = await analyzeCrawlability('https://example.com')
    expect(score).toBe(5)
    expect(checks.find(c => c.name.includes('HTTPS'))?.passed).toBe(true)
    expect(checks.find(c => c.name.includes('robots.txt'))?.passed).toBe(true)
    expect(checks.find(c => c.name.includes('AI crawlers'))?.passed).toBe(true)
    expect(checks.find(c => c.name.includes('sitemap'))?.passed).toBe(true)
    expect(checks.find(c => c.name.includes('llms.txt'))?.passed).toBe(true)
  })

  it('penalises HTTP sites', async () => {
    mockParallel(null, false, false, false)
    const { checks } = await analyzeCrawlability('http://example.com')
    const httpsCheck = checks.find(c => c.name.includes('HTTPS'))!
    expect(httpsCheck.passed).toBe(false)
    expect(httpsCheck.fix).toBeDefined()
  })

  it('detects blocked AI crawlers', async () => {
    mockParallel(BLOCKING_ROBOTS, false, false, false)
    const { checks } = await analyzeCrawlability('https://example.com')
    const botCheck = checks.find(c => c.name.includes('AI crawlers'))!
    expect(botCheck.passed).toBe(false)
    expect(botCheck.detail).toMatch(/gptbot/i)
  })

  it('detects llms.txt at root path', async () => {
    mockParallel(GOOD_ROBOTS, true, true, false)
    const { checks } = await analyzeCrawlability('https://example.com')
    const llmsCheck = checks.find(c => c.name.includes('llms.txt'))!
    expect(llmsCheck.passed).toBe(true)
    expect(llmsCheck.detail).toMatch(/\/llms\.txt/)
  })

  it('provides llms.txt example when missing', async () => {
    mockParallel(null, false, false, false)
    const { checks } = await analyzeCrawlability('https://example.com')
    const llmsCheck = checks.find(c => c.name.includes('llms.txt'))!
    expect(llmsCheck.passed).toBe(false)
    expect(llmsCheck.example).toBeDefined()
    expect(llmsCheck.example).toContain('llms.txt')
  })

  it('provides robots.txt example when missing', async () => {
    mockParallel(null, false, false, false)
    const { checks } = await analyzeCrawlability('https://example.com')
    const robotsCheck = checks.find(c => c.name.includes('robots.txt'))!
    expect(robotsCheck.passed).toBe(false)
    expect(robotsCheck.example).toContain('GPTBot')
  })

  it('score does not exceed 5', async () => {
    mockParallel(GOOD_ROBOTS, true, true, false)
    const { score } = await analyzeCrawlability('https://example.com')
    expect(score).toBeLessThanOrEqual(5)
  })

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const { score, checks } = await analyzeCrawlability('https://example.com')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(checks.length).toBeGreaterThan(0)
  })
})
