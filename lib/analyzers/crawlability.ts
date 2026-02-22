export async function analyzeCrawlability(url: string): Promise<number> {
  let score = 0
  const origin = new URL(url).origin

  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(3000) })
    if (robotsRes.ok) {
      score += 2
      const robotsTxt = await robotsRes.text()
      const lower = robotsTxt.toLowerCase()

      // Check for AI crawler allowances
      const aiCrawlers = ['gptbot', 'claude-web', 'perplexitybot', 'anthropic-ai', 'googlebot']
      const allowsAI = aiCrawlers.some(bot => {
        const idx = lower.indexOf(bot)
        if (idx === -1) return false
        // Check if it's allowed (not disallowed)
        const around = lower.substring(Math.max(0, idx - 50), idx + 50)
        return !around.includes('disallow: /')
      })
      if (allowsAI) score += 1
    }
  } catch {}

  try {
    const sitemapRes = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(3000) })
    if (sitemapRes.ok) score += 2
  } catch {}

  return Math.min(5, score)
}
