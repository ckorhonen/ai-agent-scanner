import type { CheckResult } from '../types'

export async function analyzeCrawlability(url: string): Promise<{ score: number; checks: CheckResult[]; responseTimeMs: number }> {
  const checks: CheckResult[] = []
  let score = 0
  const origin = new URL(url).origin

  // ── HTTPS ────────────────────────────────────────────────────────────────
  const isHttps = url.startsWith('https://')
  if (isHttps) score += 1
  checks.push({
    name: 'HTTPS (encrypted connection)',
    passed: isHttps,
    impact: 'high',
    detail: isHttps
      ? 'Site is served over HTTPS'
      : 'Site uses HTTP — many AI agents reject non-HTTPS URLs',
    fix: isHttps ? undefined : 'Enable HTTPS via Let\'s Encrypt (free) or your hosting provider',
  })

  // ── Response time ────────────────────────────────────────────────────────
  let responseTimeMs = 0
  const t0 = Date.now()
  try {
    await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) })
    responseTimeMs = Date.now() - t0
  } catch {
    responseTimeMs = 5000
  }

  // ── robots.txt ───────────────────────────────────────────────────────────
  let robotsTxt = ''
  let robotsExists = false
  try {
    const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      robotsExists = true
      robotsTxt = await res.text()
    }
  } catch {}

  if (robotsExists) score += 1

  checks.push({
    name: 'robots.txt exists',
    passed: robotsExists,
    impact: 'medium',
    detail: robotsExists
      ? 'robots.txt found and accessible'
      : 'No robots.txt — crawlers assume no restrictions (ambiguous)',
    fix: robotsExists ? undefined : 'Create /robots.txt to explicitly control crawler access',
    example: robotsExists ? undefined :
`User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

Sitemap: https://example.com/sitemap.xml`,
  })

  // ── AI crawler allowances ────────────────────────────────────────────────
  const aiCrawlers = ['gptbot', 'claude-web', 'anthropic-ai', 'perplexitybot', 'ccbot']
  let blockedBots: string[] = []

  if (robotsExists) {
    const lower = robotsTxt.toLowerCase()
    for (const bot of aiCrawlers) {
      const idx = lower.indexOf(bot)
      if (idx !== -1) {
        const around = lower.substring(Math.max(0, idx - 80), idx + 80)
        if (around.includes('disallow: /')) {
          blockedBots.push(bot)
        }
      }
    }
  }

  const aiBotsPassed = robotsExists && blockedBots.length === 0
  if (aiBotsPassed) score += 1

  checks.push({
    name: 'AI crawlers allowed (GPTBot, Claude-Web…)',
    passed: aiBotsPassed,
    impact: 'high',
    detail: !robotsExists
      ? 'No robots.txt — create one to explicitly allow AI crawlers'
      : blockedBots.length > 0
        ? `Blocked bots: ${blockedBots.join(', ')}`
        : 'GPTBot, Claude-Web, PerplexityBot — all permitted',
    fix: aiBotsPassed ? undefined : blockedBots.length > 0
      ? `Remove Disallow rules for: ${blockedBots.join(', ')}`
      : 'Add explicit Allow rules for AI crawlers in robots.txt',
    example: aiBotsPassed ? undefined :
`# Allow AI crawlers to index your content
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /`,
  })

  // ── sitemap.xml ──────────────────────────────────────────────────────────
  let sitemapExists = false
  try {
    const res = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      sitemapExists = true
      score += 1
    }
  } catch {}

  checks.push({
    name: 'sitemap.xml accessible',
    passed: sitemapExists,
    impact: 'medium',
    detail: sitemapExists
      ? 'sitemap.xml found — AI crawlers can enumerate all pages'
      : 'No sitemap.xml — agents must discover pages by following links',
    fix: sitemapExists ? undefined : 'Generate a sitemap.xml and reference it from robots.txt',
    example: sitemapExists ? undefined :
`# Add to robots.txt:
Sitemap: https://example.com/sitemap.xml`,
  })

  // ── llms.txt ─────────────────────────────────────────────────────────────
  // The emerging standard (llmstxt.org) for AI-optimised site summaries.
  // 844,000+ sites have adopted it. Checks /llms.txt first, then /.well-known/llms.txt
  let llmsExists = false
  let llmsUrl = ''
  for (const path of ['/llms.txt', '/.well-known/llms.txt']) {
    try {
      const res = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        llmsExists = true
        llmsUrl = path
        score += 1
        break
      }
    } catch {}
  }

  checks.push({
    name: 'llms.txt (AI content guide)',
    passed: llmsExists,
    impact: 'high',
    detail: llmsExists
      ? `llms.txt found at ${llmsUrl} — AI models get a curated site overview`
      : 'No llms.txt — LLMs must infer your site\'s purpose from raw HTML',
    fix: llmsExists ? undefined : 'Create /llms.txt — a Markdown file summarising your site for LLMs',
    example: llmsExists ? undefined :
`# llms.txt — guide for AI models
> Acme Corp is a B2B SaaS platform for invoice automation.

## Key pages
- [Pricing](/pricing): Plans starting at $29/mo
- [API Docs](/docs/api): REST API reference
- [Blog](/blog): Product updates and guides

## What we do
We help finance teams automate accounts payable.
Send invoices via email or API; we extract, validate, and post to your ERP.

## Not permitted
Do not train models on our content without written permission.`,
  })

  return { score: Math.min(5, score), checks, responseTimeMs }
}
