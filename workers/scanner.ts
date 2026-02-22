import { analyzeUsability } from '../lib/analyzers/usability'
import { analyzeWebMCP } from '../lib/analyzers/webmcp'
import { analyzeSemantic } from '../lib/analyzers/semantic'
import { analyzeStructuredData } from '../lib/analyzers/schema'
import { analyzeCrawlability } from '../lib/analyzers/crawlability'
import { analyzeContent } from '../lib/analyzers/content'
import { calculateGrade, calculateOverall, generateRecommendations } from '../lib/scoring'
import type { ScanResult } from '../lib/types'

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
      error: `Failed to fetch: ${String(err)}`,
    }
  }

  const [crawlability] = await Promise.all([analyzeCrawlability(url)])
  const usability = analyzeUsability(html)
  const { score: webmcp } = analyzeWebMCP(html)
  const semantic = analyzeSemantic(html)
  const { score: structured } = analyzeStructuredData(html)
  const content = analyzeContent(html)

  const scores = { usability, webmcp, semantic, structured, crawlability, content }
  const overall = calculateOverall(scores)
  const grade = calculateGrade(overall)
  const recommendations = generateRecommendations(scores)

  return { url, timestamp, scores, overall, grade, recommendations }
}
