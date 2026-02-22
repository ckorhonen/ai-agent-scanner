import type { CategoryScores, Grade, Recommendation, ScanResult } from './types'

export function calculateGrade(score: number): Grade {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export function calculateOverall(scores: CategoryScores): number {
  // Weights match the max points per category (total = 100)
  return Math.round(
    scores.usability +
    scores.webmcp +
    scores.semantic +
    scores.structured +
    scores.crawlability +
    scores.content
  )
}

export function generateRecommendations(scores: CategoryScores): Recommendation[] {
  const recs: Recommendation[] = []

  if (scores.webmcp < 10) {
    recs.push({
      category: 'webmcp',
      title: 'Add WebMCP support',
      description: 'Implement Web Model Context Protocol to let AI agents interact with your forms natively. Add mcp-tool and mcp-param attributes to key forms.',
      points: 25 - scores.webmcp,
    })
  }

  if (scores.usability < 20) {
    recs.push({
      category: 'usability',
      title: 'Improve form accessibility',
      description: 'Ensure all form inputs have associated <label> elements. Replace div/span onclick handlers with semantic <button> elements.',
      points: 30 - scores.usability,
    })
  }

  if (scores.structured < 8) {
    recs.push({
      category: 'structured',
      title: 'Add structured data (Schema.org)',
      description: 'Add JSON-LD structured data blocks to help AI agents understand your content type and extract key information.',
      points: 15 - scores.structured,
    })
  }

  if (scores.semantic < 12) {
    recs.push({
      category: 'semantic',
      title: 'Use semantic HTML5 elements',
      description: 'Replace generic <div> containers with semantic <header>, <main>, <article>, <nav>, and <section> elements.',
      points: 20 - scores.semantic,
    })
  }

  if (scores.crawlability < 4) {
    recs.push({
      category: 'crawlability',
      title: 'Update robots.txt for AI crawlers',
      description: 'Explicitly allow AI crawlers (GPTBot, Claude-Web, PerplexityBot) in robots.txt and add a sitemap.xml.',
      points: 5 - scores.crawlability,
    })
  }

  return recs.sort((a, b) => b.points - a.points).slice(0, 5)
}
