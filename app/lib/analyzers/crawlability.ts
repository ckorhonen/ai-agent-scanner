import type { CheckResult } from '../types'

export async function analyzeCrawlability(url: string): Promise<{ score: number; checks: CheckResult[] }> {
  const checks: CheckResult[] = []
  let score = 0
  const origin = new URL(url).origin

  // ── robots.txt ───────────────────────────────────────────────────────────
  let robotsTxt = ''
  let robotsExists = false
  try {
    const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      robotsExists = true
      score += 2
      robotsTxt = await res.text()
    }
  } catch {}

  checks.push({
    name: 'robots.txt exists',
    passed: robotsExists,
    impact: 'medium',
    detail: robotsExists ? 'robots.txt found and accessible' : 'No robots.txt — crawlers assume no restrictions',
    fix: robotsExists ? undefined : 'Create /robots.txt to explicitly control crawler access',
    example: robotsExists ? undefined :
`User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

Sitemap: https://example.com/sitemap.xml`,
  })

  // ── AI crawler allowances ────────────────────────────────────────────────
  const aiCrawlers = ['gptbot', 'claude-web', 'anthropic-ai', 'perplexitybot', 'ccbot', 'googlebot']
  let blockedBots: string[] = []
  let allowedBots: string[] = []

  if (robotsExists) {
    const lower = robotsTxt.toLowerCase()
    for (const bot of aiCrawlers) {
      const idx = lower.indexOf(bot)
      if (idx === -1) {
        allowedBots.push(bot) // not mentioned = allowed by default
      } else {
        const around = lower.substring(Math.max(0, idx - 80), idx + 80)
        if (around.includes('disallow: /')) {
          blockedBots.push(bot)
        } else {
          allowedBots.push(bot)
          score += 1
        }
      }
    }
  }

  const aiBotsPassed = blockedBots.length === 0
  checks.push({
    name: 'AI crawlers allowed (GPTBot, Claude-Web…)',
    passed: aiBotsPassed,
    impact: 'high',
    detail: !robotsExists
      ? 'Cannot check — no robots.txt'
      : blockedBots.length > 0
        ? `Blocked: ${blockedBots.join(', ')}`
        : `All AI crawlers permitted`,
    fix: aiBotsPassed ? undefined : `Remove Disallow rules for: ${blockedBots.join(', ')}`,
    example: aiBotsPassed ? undefined :
`User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /`,
  })

  // ── sitemap.xml ──────────────────────────────────────────────────────────
  let sitemapExists = false
  try {
    const res = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      sitemapExists = true
      score += 2
    }
  } catch {}

  checks.push({
    name: 'sitemap.xml accessible',
    passed: sitemapExists,
    impact: 'medium',
    detail: sitemapExists ? 'sitemap.xml found' : 'No sitemap.xml at /sitemap.xml',
    fix: sitemapExists ? undefined : 'Generate and publish a sitemap.xml; reference it in robots.txt',
    example: sitemapExists ? undefined :
`# Add to robots.txt:
Sitemap: https://example.com/sitemap.xml`,
  })

  return { score: Math.min(5, score), checks }
}
