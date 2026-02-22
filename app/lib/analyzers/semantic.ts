import type { CheckResult } from '../types'

export function analyzeSemantic(html: string): { score: number; checks: CheckResult[] } {
  const checks: CheckResult[] = []
  let score = 20
  const doc = html.toLowerCase()

  // ── Semantic HTML5 landmarks ──────────────────────────────────────────────
  const landmarks = ['<header', '<main', '<footer', '<article', '<section', '<nav', '<aside']
  const foundLandmarks = landmarks.filter(t => doc.includes(t))
  const landmarkPassed = foundLandmarks.length >= 5
  if (foundLandmarks.length < 3) score -= 6
  else if (foundLandmarks.length < 5) score -= 3
  checks.push({
    name: 'Semantic HTML5 landmark elements',
    passed: landmarkPassed,
    impact: 'high',
    detail: foundLandmarks.length === 0
      ? 'No semantic landmark elements found'
      : `${foundLandmarks.length}/7 landmarks used: ${foundLandmarks.map(t => t.slice(1)).join(', ')}`,
    fix: landmarkPassed ? undefined : `Add missing landmark elements: ${landmarks.filter(t => !foundLandmarks.includes(t)).map(t => t.slice(1)).join(', ')}`,
    example: landmarkPassed ? undefined :
`<body>
  <header>…</header>
  <nav>…</nav>
  <main>
    <article>…</article>
    <aside>…</aside>
  </main>
  <footer>…</footer>
</body>`,
  })

  // ── H1 presence ──────────────────────────────────────────────────────────
  const hasH1 = doc.includes('<h1')
  if (!hasH1) score -= 4
  checks.push({
    name: 'Single <h1> heading',
    passed: hasH1,
    impact: 'high',
    detail: hasH1 ? '<h1> heading found' : 'No <h1> — agents cannot identify page topic',
    fix: hasH1 ? undefined : 'Add exactly one <h1> describing the page\'s main topic',
    example: hasH1 ? undefined : '<h1>Product Catalog — Shop All Items</h1>',
  })

  // ── Heading hierarchy ─────────────────────────────────────────────────────
  const hasH2 = doc.includes('<h2')
  if (!hasH2) score -= 2
  checks.push({
    name: 'Heading hierarchy (h1 → h2 → h3)',
    passed: hasH1 && hasH2,
    impact: 'medium',
    detail: !hasH1
      ? 'No headings found at all'
      : !hasH2
        ? 'Only h1 found, no h2 subheadings'
        : 'Heading hierarchy present',
    fix: hasH2 ? undefined : 'Use h2 for section titles and h3 for subsections under h2',
  })

  // ── Div ratio ────────────────────────────────────────────────────────────
  const divCount = (html.match(/<div/gi) || []).length
  const totalTags = (html.match(/<[a-z]/gi) || []).length
  const divRatio = divCount / (totalTags || 1)
  const divPassed = divRatio <= 0.45
  if (!divPassed) score -= 5
  checks.push({
    name: 'Low div-soup ratio',
    passed: divPassed,
    impact: 'medium',
    detail: `div elements are ${Math.round(divRatio * 100)}% of all tags (target: ≤45%)`,
    fix: divPassed ? undefined : 'Replace generic <div> wrappers with semantic elements: <section>, <article>, <aside>, <nav>, <header>, <footer>',
  })

  // ── Layout tables ─────────────────────────────────────────────────────────
  const tables = (html.match(/<table/gi) || []).length
  const markedPresentational = (html.match(/role=["'](presentation|none)["']/gi) || []).length
  const tablePassed = tables <= 2 || markedPresentational > 0
  if (!tablePassed) score -= 3
  checks.push({
    name: 'Tables used for data, not layout',
    passed: tablePassed,
    impact: 'low',
    detail: tables === 0
      ? 'No tables found'
      : `${tables} table(s) found${markedPresentational > 0 ? ', presentational ones marked correctly' : ''}`,
    fix: tablePassed ? undefined : 'Add role="presentation" to layout tables, or convert to CSS Grid/Flexbox',
  })

  return { score: Math.max(0, score), checks }
}
