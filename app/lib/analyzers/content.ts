import type { CheckResult } from '../types'

export function analyzeContent(html: string): { score: number; checks: CheckResult[] } {
  const checks: CheckResult[] = []
  let score = 5

  // ── Image alt text ────────────────────────────────────────────────────────
  const imgTotal = (html.match(/<img/gi) || []).length
  const imgWithAlt = (html.match(/<img[^>]+alt=["'][^"']+["']/gi) || []).length
  const altRatio = imgTotal > 0 ? imgWithAlt / imgTotal : 1
  const altPassed = imgTotal === 0 || altRatio >= 0.8

  if (!altPassed) {
    if (altRatio < 0.5) score -= 3
    else score -= 1
  }

  checks.push({
    name: 'Images have descriptive alt text',
    passed: altPassed,
    impact: 'high',
    detail: imgTotal === 0
      ? 'No images found'
      : `${imgWithAlt}/${imgTotal} images have non-empty alt text (${Math.round(altRatio * 100)}%)`,
    fix: altPassed ? undefined : `Add descriptive alt text to ${imgTotal - imgWithAlt} image(s)`,
    example: altPassed ? undefined :
`<!-- Before -->
<img src="chart.png" />

<!-- After -->
<img src="chart.png"
     alt="Bar chart showing 42% increase in agent adoption Q4 2024" />`,
  })

  // ── Text content density ──────────────────────────────────────────────────
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = textContent.split(/\s+/).filter(Boolean).length
  const textPassed = wordCount >= 100

  if (!textPassed) score -= 2

  checks.push({
    name: 'Sufficient text content',
    passed: textPassed,
    impact: 'medium',
    detail: `~${wordCount} words of readable text content${wordCount < 100 ? ' (agents need more context)' : ''}`,
    fix: textPassed ? undefined : 'Add descriptive text content — headings, paragraphs, and labels that describe what the page does',
  })

  return { score: Math.max(0, score), checks }
}
