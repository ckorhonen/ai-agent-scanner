import type { CategoryScores, CategoryDetail, Grade, Recommendation } from './types'

export function calculateGrade(score: number): Grade {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export function calculateOverall(scores: CategoryScores): number {
  return Math.round(
    scores.usability +
    scores.webmcp +
    scores.semantic +
    scores.structured +
    scores.crawlability +
    scores.content
  )
}

export function generateRecommendations(
  scores: CategoryScores,
  details: CategoryDetail[]
): Recommendation[] {
  const recs: Recommendation[] = []

  // Build a lookup for quick check access
  const byCategory = Object.fromEntries(details.map(d => [d.category, d]))

  // ── WebMCP — highest value, usually missing ────────────────────────────
  if (scores.webmcp < 10) {
    const check = byCategory['webmcp']?.checks.find(c => c.name.includes('mcp-tool') && !c.passed)
    recs.push({
      category: 'webmcp',
      title: 'Implement WebMCP declarative API',
      description: 'Add mcp-tool, mcp-param, and mcp-description attributes to your forms. This lets AI agents (Chrome 146+) natively interact with your site without scraping.',
      points: 25 - scores.webmcp,
      effort: 'low',
      impact: 'high',
      example: check?.example,
    })
  }

  if (scores.webmcp >= 10 && scores.webmcp < 20) {
    recs.push({
      category: 'webmcp',
      title: 'Add OpenAPI spec / ai-plugin.json',
      description: 'Link to your API spec via /.well-known/ai-plugin.json so agents can discover your capabilities automatically.',
      points: 5,
      effort: 'medium',
      impact: 'medium',
      example: `// /.well-known/ai-plugin.json
{
  "schema_version": "v1",
  "name_for_human": "My API",
  "description_for_human": "...",
  "api": {
    "type": "openapi",
    "url": "https://example.com/openapi.json"
  }
}`,
    })
  }

  // ── Structured data — high ROI ─────────────────────────────────────────
  if (scores.structured < 8) {
    const check = byCategory['structured']?.checks.find(c => c.name.includes('JSON-LD') && !c.passed)
    recs.push({
      category: 'structured',
      title: 'Add JSON-LD structured data',
      description: 'JSON-LD lets agents understand your content type instantly. Add WebSite + SearchAction at minimum; add Product, Article, or FAQPage for richer context.',
      points: 15 - scores.structured,
      effort: 'low',
      impact: 'high',
      example: check?.example,
    })
  }

  // ── Usability — form labels ────────────────────────────────────────────
  const labelCheck = byCategory['usability']?.checks.find(c => c.name.includes('Labels') && !c.passed)
  if (labelCheck) {
    recs.push({
      category: 'usability',
      title: 'Add labels to all form inputs',
      description: 'Every <input> needs an associated <label>. Agents use labels to understand what data a field expects — unlabeled fields look identical.',
      points: 8,
      effort: 'low',
      impact: 'high',
      example: labelCheck.example,
    })
  }

  // ── Usability — CAPTCHA ────────────────────────────────────────────────
  const captchaCheck = byCategory['usability']?.checks.find(c => c.name.includes('CAPTCHA') && !c.passed)
  if (captchaCheck) {
    recs.push({
      category: 'usability',
      title: 'Remove CAPTCHA from agent-accessible flows',
      description: 'CAPTCHAs block AI agents completely. Use honeypot fields or API rate limiting instead, or expose a CAPTCHA-free API endpoint.',
      points: 5,
      effort: 'medium',
      impact: 'high',
    })
  }

  // ── Semantic HTML ──────────────────────────────────────────────────────
  if (scores.semantic < 12) {
    const landmarkCheck = byCategory['semantic']?.checks.find(c => c.name.includes('landmark') && !c.passed)
    recs.push({
      category: 'semantic',
      title: 'Add semantic HTML5 landmark elements',
      description: 'Replace generic <div> wrappers with <header>, <main>, <nav>, <article>, <section>, <aside>, <footer>. Agents use these to navigate page structure.',
      points: 20 - scores.semantic,
      effort: 'medium',
      impact: 'medium',
      example: landmarkCheck?.example,
    })
  }

  // ── H1 ─────────────────────────────────────────────────────────────────
  const h1Check = byCategory['semantic']?.checks.find(c => c.name.includes('<h1>') && !c.passed)
  if (h1Check) {
    recs.push({
      category: 'semantic',
      title: 'Add a descriptive <h1> heading',
      description: 'The <h1> is the first thing agents read to understand a page. It should clearly describe the page\'s purpose.',
      points: 4,
      effort: 'low',
      impact: 'high',
      example: h1Check.example,
    })
  }

  // ── Crawlability ───────────────────────────────────────────────────────
  const robotsCheck = byCategory['crawlability']?.checks.find(c => c.name.includes('robots.txt') && !c.passed)
  if (robotsCheck) {
    recs.push({
      category: 'crawlability',
      title: 'Create robots.txt with AI crawler allowances',
      description: 'A missing robots.txt is ambiguous. Explicitly allow GPTBot, Claude-Web, and PerplexityBot so your content appears in AI search results.',
      points: 5 - scores.crawlability,
      effort: 'low',
      impact: 'medium',
      example: robotsCheck.example,
    })
  }

  const aiBotsCheck = byCategory['crawlability']?.checks.find(c => c.name.includes('AI crawlers') && !c.passed)
  if (aiBotsCheck && !robotsCheck) {
    recs.push({
      category: 'crawlability',
      title: 'Unblock AI crawlers in robots.txt',
      description: 'GPTBot, Claude-Web, or PerplexityBot are being blocked. This prevents your content from appearing in AI-generated answers.',
      points: 3,
      effort: 'low',
      impact: 'high',
      example: aiBotsCheck.example,
    })
  }

  // ── Content ────────────────────────────────────────────────────────────
  const altCheck = byCategory['content']?.checks.find(c => c.name.includes('alt text') && !c.passed)
  if (altCheck) {
    recs.push({
      category: 'content',
      title: 'Add descriptive alt text to images',
      description: 'Agents cannot see images. Alt text is the only way they understand visual content. Be descriptive — not just "image" or "photo".',
      points: 3,
      effort: 'low',
      impact: 'medium',
      example: altCheck.example,
    })
  }

  // Sort: points desc, then effort asc (quick wins first)
  const effortOrder = { low: 0, medium: 1, high: 2 }
  return recs
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return effortOrder[a.effort] - effortOrder[b.effort]
    })
    .slice(0, 6)
}
