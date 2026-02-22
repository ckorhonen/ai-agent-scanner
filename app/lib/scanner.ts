import { analyzeUsability } from './analyzers/usability'
import { analyzeWebMCP } from './analyzers/webmcp'
import { analyzeSemantic } from './analyzers/semantic'
import { analyzeStructuredData } from './analyzers/schema'
import { analyzeCrawlability } from './analyzers/crawlability'
import { analyzeContent } from './analyzers/content'
import { calculateGrade, calculateOverall, generateRecommendations } from './scoring'
import type { ScanResult, CategoryDetail } from './types'

export async function scanUrl(url: string): Promise<ScanResult> {
  const timestamp = new Date().toISOString()

  let html = ''
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AI-Agent-Scanner/1.0 (ai-agent-scanner.pages.dev)' },
      signal: AbortSignal.timeout(8000),
    })
    html = await res.text()
  } catch (err) {
    return {
      url,
      timestamp,
      scores: { usability: 0, webmcp: 0, semantic: 0, structured: 0, crawlability: 0, content: 0 },
      overall: 0,
      grade: 'F',
      recommendations: [],
      categoryDetails: [],
      error: `Failed to fetch: ${String(err)}`,
    }
  }

  // Run all analyzers
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
    { category: 'usability',    label: 'Usability',       score: scores.usability,    max: 30, checks: usabilityResult.checks },
    { category: 'webmcp',       label: 'WebMCP',           score: scores.webmcp,       max: 25, checks: webmcpResult.checks },
    { category: 'semantic',     label: 'Semantic HTML',    score: scores.semantic,     max: 20, checks: semanticResult.checks },
    { category: 'structured',   label: 'Structured Data',  score: scores.structured,   max: 15, checks: schemaResult.checks },
    { category: 'crawlability', label: 'Crawlability',     score: scores.crawlability, max: 5,  checks: crawlResult.checks },
    { category: 'content',      label: 'Content Quality',  score: scores.content,      max: 5,  checks: contentResult.checks },
  ]

  const overall         = calculateOverall(scores)
  const grade           = calculateGrade(overall)
  const recommendations = generateRecommendations(scores, categoryDetails)

  return { url, timestamp, scores, overall, grade, recommendations, categoryDetails }
}
