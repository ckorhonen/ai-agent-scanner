import { analyzeUsability } from './analyzers/usability'
import { analyzeWebMCP } from './analyzers/webmcp'
import { analyzeSemantic } from './analyzers/semantic'
import { analyzeStructuredData } from './analyzers/schema'
import { analyzeCrawlability } from './analyzers/crawlability'
import { analyzeContent } from './analyzers/content'
import { calculateGrade, calculateOverall, generateRecommendations, getReadinessLevel, generateSummary } from './scoring'
import type { ScanResult, CategoryDetail } from './types'

const EDUCATIONAL_NOTES: Record<string, string> = {
  usability: 'AI agents navigate your site programmatically — they see your DOM, not pixels. Poor form labels, CAPTCHA walls, and non-semantic buttons make agents fail silently. Every fix here makes your site legible to the next generation of AI tooling.',
  webmcp: 'WebMCP (Chrome 146+) is the emerging W3C standard for agent-native websites. With it, AI agents can call your site\'s forms and actions as structured tools — no scraping, no guessing. It\'s the difference between an agent reading a menu and actually placing an order.',
  semantic: 'Semantic HTML is the vocabulary agents use to understand your pages. Elements like <main>, <article>, and <h1> signal importance and structure. Generic <div> soup looks identical to an agent — it can\'t tell the header from the footer.',
  structured: 'Schema.org JSON-LD gives AI agents a machine-readable fact-sheet about your content. Without it, agents must infer everything from raw text — slowly and inaccurately. A single <script type="application/ld+json"> block can transform how AI systems understand your site.',
  crawlability: 'Before agents can use your site, they need to discover and read it. robots.txt controls access, sitemap.xml maps your content, and llms.txt (the new standard, adopted by 844k+ sites) gives AI models a curated, accurate summary of what your site is and does.',
  content: 'Agents are blind. Alt text on images and descriptive link text are the only way visual content becomes accessible to AI. Missing alt text means agents can\'t understand up to 60% of web content.',
}

export async function scanUrl(url: string): Promise<ScanResult> {
  const timestamp = new Date().toISOString()

  let html = ''
  let responseTimeMs = 0

  try {
    const t0 = Date.now()
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AI-Agent-Scanner/1.0 (ai-agent-scanner.pages.dev; educational tool)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })
    responseTimeMs = Date.now() - t0
    const raw = await res.text()
    // Cap at 500KB to keep regex analyzers fast on huge pages
    html = raw.length > 500_000 ? raw.slice(0, 500_000) : raw
  } catch (err) {
    return {
      url,
      timestamp,
      scores: { usability: 0, webmcp: 0, semantic: 0, structured: 0, crawlability: 0, content: 0 },
      overall: 0,
      grade: 'F',
      level: getReadinessLevel(0),
      summary: 'This site could not be reached.',
      recommendations: [],
      categoryDetails: [],
      responseTimeMs: 0,
      error: `Failed to fetch: ${String(err)}`,
    }
  }

  // Run analyzers (crawlability also fetches robots.txt / sitemap / llms.txt)
  const [crawlResult] = await Promise.all([analyzeCrawlability(url)])
  const usabilityResult = analyzeUsability(html)
  const webmcpResult    = analyzeWebMCP(html)
  const semanticResult  = analyzeSemantic(html)
  const schemaResult    = analyzeStructuredData(html)
  const contentResult   = analyzeContent(html)

  const scores = {
    usability:    usabilityResult.score,
    webmcp:       webmcpResult.score,
    semantic:     semanticResult.score,
    structured:   schemaResult.score,
    crawlability: crawlResult.score,
    content:      contentResult.score,
  }

  const categoryDetails: CategoryDetail[] = [
    {
      category: 'usability',
      label: 'Agent Usability',
      score: scores.usability,
      max: 30,
      checks: usabilityResult.checks,
      educationalNote: EDUCATIONAL_NOTES.usability,
    },
    {
      category: 'webmcp',
      label: 'WebMCP Support',
      score: scores.webmcp,
      max: 25,
      checks: webmcpResult.checks,
      educationalNote: EDUCATIONAL_NOTES.webmcp,
    },
    {
      category: 'semantic',
      label: 'Semantic HTML',
      score: scores.semantic,
      max: 20,
      checks: semanticResult.checks,
      educationalNote: EDUCATIONAL_NOTES.semantic,
    },
    {
      category: 'structured',
      label: 'Structured Data',
      score: scores.structured,
      max: 15,
      checks: schemaResult.checks,
      educationalNote: EDUCATIONAL_NOTES.structured,
    },
    {
      category: 'crawlability',
      label: 'AI Discoverability',
      score: scores.crawlability,
      max: 5,
      checks: crawlResult.checks,
      educationalNote: EDUCATIONAL_NOTES.crawlability,
    },
    {
      category: 'content',
      label: 'Content Quality',
      score: scores.content,
      max: 5,
      checks: contentResult.checks,
      educationalNote: EDUCATIONAL_NOTES.content,
    },
  ]

  const overall         = calculateOverall(scores)
  const grade           = calculateGrade(overall)
  const level           = getReadinessLevel(overall)
  const recommendations = generateRecommendations(scores, categoryDetails)
  const summary         = generateSummary(url, overall, level, scores, categoryDetails)

  // ── SPA / JS-rendered detection ──────────────────────────────────────────
  // If the page looks like a client-side SPA, the scan results may undercount
  // actual content (which is rendered by JavaScript, not present in raw HTML).
  const jsBased = detectSpa(html)

  return { url, timestamp, scores, overall, grade, level, summary, recommendations, categoryDetails, responseTimeMs, jsBased }
}

/** Heuristic SPA detection: returns true if the page is likely a JS-rendered app */
function detectSpa(html: string): boolean {
  if (!html) return false
  // Common SPA root element patterns
  const spaRoots = [
    /<div\s+id=["']root["']/i,          // React CRA
    /<div\s+id=["']app["']/i,           // Vue CLI
    /<div\s+id=["']__next["']/i,        // Next.js pre-render gap
    /data-reactroot/i,                   // React class legacy
    /<app-root[\s>]/i,                   // Angular
    /ng-version=/i,                      // Angular
    /data-v-app/i,                       // Vue 3
  ]
  const hasSpaRoot = spaRoots.some(rx => rx.test(html))

  // Very thin text content (< 150 words) despite being a real page
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const thinContent = wordCount < 150

  // Scripts pointing to typical SPA build artifacts
  const hasSpaScript = /(?:main\.|app\.|bundle\.)[a-f0-9]{8,}\.js|\/static\/js\/|\/assets\/index\.[a-f0-9]+\.js/.test(html)

  return hasSpaRoot || (thinContent && hasSpaScript)
}
